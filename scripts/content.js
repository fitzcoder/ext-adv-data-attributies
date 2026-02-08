const init = async () => {
  const url = location.href;
  const domain = new URL(url).hostname;
  const configsInstance = await AdvAttribute.Config.create(domain);

  // Listen to messages
  chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
    if (msg.type === "SHOW_BADGES") {
      configsInstance.showBadges();
    } else if (msg.type === "HIDE_BADGES") {
      configsInstance.hideBadges();
    } else if (msg.type === "RELOAD_BADGES") {
      configsInstance.set({ attrStrings: msg.attrStrings });
      configsInstance.reloadBadges();
    }
  });

  // Initial display
  if (
    !configsInstance.config.isDisplay ||
    !configsInstance.config.attrStrings ||
    configsInstance.config.attrStrings.length === 0
  ) {
    configsInstance.hideBadges();
    return;
  }

  // OK: Need wait a bit for the page to load
  setTimeout(() => {
    configsInstance.showBadges();
  }, 1000);
};

init();

// const observer = new MutationObserver((mutations) => {
//   for (const mutation of mutations) {
//     // If a new article was added.
//     for (const node of mutation.addedNodes) {
//       if (node instanceof Element && node.tagName === "ARTICLE") {
//         // Render the reading time for this particular article.
//         renderReadingTime(node);
//       }
//     }
//   }
// });

// // https://developer.chrome.com/ is a SPA (Single Page Application) so can
// // update the address bar and render new content without reloading. Our content
// // script won't be reinjected when this happens, so we need to watch for
// // changes to the content.
// observer.observe(document.querySelector("devsite-content"), {
//   childList: true,
// });
