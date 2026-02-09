const init = async () => {
  const url = location.href;
  const domain = new URL(url).hostname;
  const instance = await AdvAttribute.Config.create(domain);

  // Listen to messages
  chrome.runtime.onMessage.addListener((msg) => {
    if (msg.type === "SHOW_BADGES") {
      instance.showBadges();
    } else if (msg.type === "HIDE_BADGES") {
      instance.hideBadges();
    } else if (msg.type === "RELOAD_BADGES") {
      instance.set({ attrStrings: msg.attrStrings });
      instance.reloadBadges();
    } else if (
      msg.type === "ENABLE_CLICK_THROUGH" ||
      msg.type === "DISABLE_CLICK_THROUGH"
    ) {
      instance.set({ isClickThrough: msg.type === "ENABLE_CLICK_THROUGH" });
      instance.toggleClickThrough();
    }
  });

  // Initial display
  if (
    !instance.config.isDisplay ||
    !instance.config.attrStrings ||
    instance.config.attrStrings.length === 0
  ) {
    instance.hideBadges();
    return;
  }

  // OK: Need wait a bit for the page to load
  setTimeout(() => {
    instance.showBadges();
  }, 1000);

  // Detect DOM changes
  const observer = new MutationObserver((mutations) => {
    for (const mutation of mutations) {
      if (mutation.addedNodes.length > 0 || mutation.removedNodes.length > 0) {
        instance.reloadBadges();
        break;
      }
    }
  });
  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });
};

init();
