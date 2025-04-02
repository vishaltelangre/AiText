import type { StorageData } from "../types";

function checkApiKey(): void {
  const statusContainer = document.getElementById("api-status-container");
  const statusText = document.getElementById("api-status-text");
  const successIcon = document.getElementById("status-icon-success");
  const errorIcon = document.getElementById("status-icon-error");

  if (!statusContainer || !statusText || !successIcon || !errorIcon) {
    return;
  }

  browser.storage.sync
    .get("geminiApiKey")
    .then((res: StorageData) => {
      if (res.geminiApiKey) {
        statusContainer.className =
          "ait-flex ait-items-center ait-justify-between ait-bg-green-50 ait-border ait-border-green-100 ait-rounded-lg ait-px-4 ait-py-2.5 ait-mt-4";
        statusText.className = "ait-text-sm ait-text-green-700";
        successIcon.classList.remove("ait-hidden");
        errorIcon.classList.add("ait-hidden");
        statusText.textContent = "API key configured";
      } else {
        statusContainer.className =
          "ait-flex ait-items-center ait-justify-between ait-bg-red-100/50 ait-border ait-border-red-200 ait-rounded-lg ait-px-4 ait-py-2.5 ait-mt-4";
        statusText.className = "ait-text-sm ait-text-red-700";
        successIcon.classList.add("ait-hidden");
        errorIcon.classList.remove("ait-hidden");
        statusText.textContent = "API key not set";
      }
    })
    .catch((error: Error) => {
      statusContainer.className =
        "ait-flex ait-items-center ait-justify-between ait-bg-red-100/50 ait-border ait-border-red-200 ait-rounded-lg ait-px-4 ait-py-2.5 ait-mt-4";
      statusText.className = "ait-text-sm ait-text-red-700";
      successIcon.classList.add("ait-hidden");
      errorIcon.classList.remove("ait-hidden");
      statusText.textContent = "Error checking API key";
    });
}

function openOptions(): void {
  browser.runtime.openOptionsPage();
}

document.addEventListener("DOMContentLoaded", checkApiKey);

const optionsButton = document.getElementById("options-button");
if (optionsButton) {
  optionsButton.addEventListener("click", openOptions);
}
