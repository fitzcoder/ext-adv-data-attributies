import "../scripts/main.js";

document.addEventListener("DOMContentLoaded", async () => {
  const instance = await AdvAttribute.Config.create();

  const generateAttrListHTML = () => {
    const attrStrings = instance.config.attrStrings;
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
        const newAttrStrings = instance.config.attrStrings.filter(
          (a) => a !== attr
        );
        await instance.set({ attrStrings: newAttrStrings });
        generateAttrListHTML();
        attrStringsInput.value = newAttrStrings.join(",");
      });
      div.appendChild(span);
      attrListDiv.appendChild(div);
    });
    attrStringsInput.value = attrStrings.join(",");
  };

  // Elements
  const displayCheckbox = document.getElementById("is-display");
  const clickThroughCheckbox = document.getElementById("is-click-through");
  const attrStringsInput = document.getElementById("attr-strings");
  const updateBtn = document.getElementById("update-btn");
  const attrListDiv = document.getElementById("attr-list");

  // Initialize state
  if (instance.disabled) {
    displayCheckbox.disabled = true;
    attrStringsInput.disabled = true;
    updateBtn.disabled = true;
    clickThroughCheckbox.disabled = true;
    updateBtn.textContent = "DISABLED";
  } else {
    displayCheckbox.checked = instance.config.isDisplay;
    clickThroughCheckbox.checked = instance.config.isClickThrough;
    attrStringsInput.value = instance.config.attrStrings.join(",");
    generateAttrListHTML();
  }

  // Display Checkbox: onChange
  displayCheckbox.addEventListener("change", () => {
    instance.set({ isDisplay: displayCheckbox.checked });
    chrome.tabs.sendMessage(instance.tabId, {
      type: displayCheckbox.checked ? "SHOW_BADGES" : "HIDE_BADGES",
    });
  });
  // Click Through Checkbox: onChange
  clickThroughCheckbox.addEventListener("change", () => {
    instance.set({ isClickThrough: clickThroughCheckbox.checked });
    chrome.tabs.sendMessage(instance.tabId, {
      type: clickThroughCheckbox.checked
        ? "ENABLE_CLICK_THROUGH"
        : "DISABLE_CLICK_THROUGH",
    });
  });
  // Update button: onClick
  updateBtn.addEventListener("click", () => {
    const attrStrings = attrStringsInput.value
      .split(",")
      .map((s) => s.trim())
      .filter((s) => s.length > 0);
    instance.set({ attrStrings });
    generateAttrListHTML();
    chrome.tabs.sendMessage(instance.tabId, {
      type: "RELOAD_BADGES",
      attrStrings,
    });
  });
});
