const init = async () => {
  const url = location.href;
  const domain = new URL(url).hostname;
  const configsInstance = await AdvAttribute.Config.create(domain);

  if (
    !configsInstance.config.isDisplay ||
    !configsInstance.config.attrStrings ||
    configsInstance.config.attrStrings.length === 0
  ) {
    configsInstance.hideBadges();
    return;
  }

  // Need wait a bit for the page to load
  setTimeout(() => {
    configsInstance.showBadges();
  }, 1000);

  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "SHOW_BADGES") {
      configsInstance.showBadges();
    } else if (msg.type === "HIDE_BADGES") {
      configsInstance.hideBadges();
    } else if (msg.type === "RELOAD_BADGES") {
      configsInstance.reloadBadges();
    }
  });
};

init();
