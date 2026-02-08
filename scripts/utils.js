const getInfoTab = async () => {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const url = new URL(tab.url);
  return { domain: url.hostname, tabId: tab.id };
};

const getConfigForDomain = async (domain) => {
  return new Promise((resolve) => {
    chrome.storage.sync.get([domain], (result) => {
      const valid = result[domain];
      resolve({
        isDisplay: result[domain]?.isDisplay ?? false,
        attrStrings: result[domain]?.attrStrings ?? [
          "data-testid",
          "aria-label",
        ],
      });
    });
  });
};

class Config {
  tabId = null;
  domain = null;
  config = null;

  async init(domain) {
    if (domain) {
      this.domain = domain;
    } else {
      const infoTab = await getInfoTab();
      this.domain = infoTab.domain;
      this.tabId = infoTab.tabId;
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
      if (element.hasAttribute(attr)) {
        return { attr, value: element.getAttribute(attr) };
      }
    }
    return null;
  }

  async getValidElements() {
    const queryStrings = this.config.attrStrings
      .map((attr) => `[${attr}]`)
      .join(",");
    return document.querySelectorAll(queryStrings);
  }

  addBadgeAfterElements(elements) {
    elements.forEach((el) => {
      const badge = document.createElement("span");
      badge.classList.add("dda-attr-badge");
      const attrInfo = this.getAttrOfElement(el);
      badge.innerHTML = `<span>${attrInfo.attr}:</span> <span>${attrInfo.value}</span>`;
      const div = document.createElement("div");
      div.style.position = "absolute";
      div.appendChild(badge);
      el.insertAdjacentElement("afterbegin", div);
    });
  }

  async showBadges() {
    const elements = await this.getValidElements();
    if (!elements || elements.length === 0) {
      return;
    }
    this.addBadgeAfterElements(elements);
  }

  async hideBadges() {
    // Remove all badges
    const badges = document.querySelectorAll(".dda-attr-badge");
    badges.forEach((badge) => badge.remove());
  }

  async reloadBadges() {
    await this.hideBadges();
    await this.showBadges();
  }
}

window.AdvAttribute = { Config };
