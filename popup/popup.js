import "../scripts/main.js";

document.addEventListener("DOMContentLoaded", async () => {
  const configsInstance = await AdvAttribute.Config.create();

  const generateAttrListHTML = (attrStrings) => {
    attrListDiv.innerHTML = "";
    attrStrings.forEach((attr) => {
      const div = document.createElement("div");
      div.classList.add("dda-attr-item");
      div.textContent = attr;

      const span = document.createElement("span");
      span.title = "Remove";
      span.textContent = "✕";
      span.style.cursor = "pointer";
      span.addEventListener("click", async () => {
        const newAttrStrings = configsInstance.config.attrStrings.filter(
          (a) => a !== attr
        );
        await configsInstance.set({ attrStrings: newAttrStrings });
        generateAttrListHTML(newAttrStrings);
        attrStringsInput.value = newAttrStrings.join(",");
      });

      div.appendChild(span);
      attrListDiv.appendChild(div);
      attrStringsInput.value = attrStrings.join(",");
    });
  };

  // Elements
  const displayCheckbox = document.getElementById("is-display");
  const attrStringsInput = document.getElementById("attr-strings");
  const updateBtn = document.getElementById("update-btn");
  const attrListDiv = document.getElementById("attr-list");

  // Initialize state
  displayCheckbox.checked = configsInstance.config.isDisplay;
  attrStringsInput.value = configsInstance.config.attrStrings.join(",");
  generateAttrListHTML(configsInstance.config.attrStrings);

  // Checkbox: onChange
  displayCheckbox.addEventListener("change", () => {
    configsInstance.set({ isDisplay: displayCheckbox.checked });
    if (displayCheckbox.checked) {
      chrome.tabs.sendMessage(configsInstance.tabId, { type: "SHOW_BADGES" });
    } else {
      chrome.tabs.sendMessage(configsInstance.tabId, { type: "HIDE_BADGES" });
    }
  });
  // Update button: onClick
  updateBtn.addEventListener("click", () => {
    const attrStrings = attrStringsInput.value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    configsInstance.set({ attrStrings });
    generateAttrListHTML(attrStrings);
    chrome.tabs.sendMessage(configsInstance.tabId, { type: "RELOAD_BADGES" });
  });
});
