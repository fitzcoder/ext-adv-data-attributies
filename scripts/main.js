const DDA_ATTR_STRINGS = ["data-testid"];

const getInfoTab = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab.url);
  return { domain: url.hostname, tabId: tab.id, url: tab.url };
};

const getConfigForDomain = async (domain) => {
  return new Promise((resolve) => {
    chrome.storage.sync.get([domain], (result) => {
      const valid = result[domain];
      resolve({
        isDisplay: valid?.isDisplay ?? false,
        isClickThrough: valid?.isClickThrough ?? false,
        attrStrings: valid?.attrStrings ?? DDA_ATTR_STRINGS,
      });
    });
  });
};

class Config {
  tabId = null;
  domain = null;
  config = null;
  disabled = false;

  async init(domain) {
    if (domain) {
      this.domain = domain;
    } else {
      const infoTab = await getInfoTab();
      this.domain = infoTab.domain;
      this.tabId = infoTab.tabId;
      this.disabled = ["chrome://", "edge://", "about:"].some((prefix) =>
        infoTab.url.startsWith(prefix)
      );
    }
    this.config = await getConfigForDomain(this.domain);

    return this;
  }

  static async create(domain) {
    const instance = new Config();
    return instance.init(domain);
  }

  async set(newConfig) {
    this.config = { ...this.config, ...newConfig };
    return new Promise((resolve) => {
      chrome.storage.sync.set({ [this.domain]: this.config }, () => {
        resolve();
      });
    });
  }

  getAttrOfElement(element) {
    for (const attr of this.config.attrStrings) {
      let validAttr = (attr || "").trim();
      if (validAttr.indexOf("[") > -1 || validAttr.indexOf("]") > -1) {
        const match = validAttr.match(/\[(.*?)\]/);
        validAttr = match ? match[1] : null;
      }
      if (validAttr && element.hasAttribute(validAttr)) {
        return { attr: validAttr, value: element.getAttribute(validAttr) };
      }
    }
    return null;
  }

  async getValidElements() {
    const queryStrings = this.config.attrStrings
      .filter((attr) => attr && attr.length > 0)
      .map((attr) =>
        attr.indexOf("[") > -1 || attr.indexOf("]") > -1 ? attr : `[${attr}]`
      )
      .join(",");
    return document.querySelectorAll(queryStrings);
  }

  /**
   * Generate badges for elements
   * and append to the page after body
   */
  generateBadges(elements) {
    if (document.getElementById("dda-attr-page"))
      document.getElementById("dda-attr-page").remove();
    const page = document.createElement("div");
    page.id = "dda-attr-page";
    document.body.insertAdjacentElement("afterend", page);

    elements.forEach((el) => {
      const position = el.getBoundingClientRect();

      const badge = document.createElement("span");
      const attrInfo = this.getAttrOfElement(el);
      badge.innerHTML = `<span>${attrInfo.attr}:</span> <span>${attrInfo.value}</span>`;
      badge.style.top = `${position.top + window.scrollY}px`;
      badge.style.left = `${position.left + window.scrollX}px`;
      badge.classList.add(
        "dda-attr-badge",
        `dda-attr-tag-${el.tagName.toLowerCase()}`
      );
      page.appendChild(badge);

      // Adjust position to avoid overflow
      const badgeRect = badge.getBoundingClientRect();
      if (badgeRect.right > window.innerWidth) {
        badge.style.left = `${
          position.left +
          window.scrollX -
          (badgeRect.right - window.innerWidth) -
          4
        }px`;
      }
      if (badgeRect.bottom > window.innerHeight) {
        badge.style.top = `${
          position.top +
          window.scrollY -
          (badgeRect.bottom - window.innerHeight) -
          4
        }px`;
      }
    });
  }

  /* Show all badges */
  async showBadges() {
    const elements = await this.getValidElements();
    if (!elements || elements.length === 0) {
      return;
    }
    this.generateBadges(elements);
  }

  /* Hide all badges */
  async hideBadges() {
    const page = document.getElementById("dda-attr-page");
    if (page) {
      page.remove();
    }
  }

  /* Reload badges */
  async reloadBadges() {
    await this.hideBadges();
    await this.showBadges();
  }
}

window.AdvAttribute = { Config };
