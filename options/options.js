function saveOptions(e) {
  e.preventDefault();

  const apiKey = document.getElementById("api-key").value.trim();
  const status = document.getElementById("status");

  if (!apiKey) {
    status.textContent = "API key cannot be empty.";
    status.className = "status error";
    setTimeout(() => {
      status.textContent = "";
      status.className = "status";
    }, 3000);
    return;
  }

  browser.storage.sync
    .set({
      geminiApiKey: apiKey,
    })
    .then(() => {
      status.textContent = "Options saved!";
      status.className = "status success";
      setTimeout(() => {
        status.textContent = "";
        status.className = "status";
      }, 3000);
    })
    .catch((error) => {
      status.textContent = "Error saving options: " + error;
      status.className = "status error";
    });
}

function restoreOptions() {
  browser.storage.sync
    .get("geminiApiKey")
    .then((res) => {
      if (res.geminiApiKey) {
        document.getElementById("api-key").value = res.geminiApiKey;
      }
    })
    .catch((error) => {
      console.error("Error loading options: " + error);
    });
}

function toggleApiKeyVisibility() {
  const apiKeyInput = document.getElementById("api-key");
  const showKeyButton = document.getElementById("show-key");

  if (apiKeyInput.type === "password") {
    apiKeyInput.type = "text";
    showKeyButton.textContent = "🔒";
  } else {
    apiKeyInput.type = "password";
    showKeyButton.textContent = "👁️";
  }
}

document.addEventListener("DOMContentLoaded", restoreOptions);
document.getElementById("save").addEventListener("click", saveOptions);
document
  .getElementById("show-key")
  .addEventListener("click", toggleApiKeyVisibility);
