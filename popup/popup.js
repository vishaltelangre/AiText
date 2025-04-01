function checkApiKey() {
  const apiStatus = document.getElementById("api-status");

  apiStatus.className = "api-status api-checking";
  apiStatus.innerHTML = `
    <div class="status-icon">⚙️</div>
    <div class="status-text">Checking API key...</div>
  `;

  browser.storage.sync
    .get("geminiApiKey")
    .then((res) => {
      if (res.geminiApiKey) {
        apiStatus.className = "api-status api-ok";
        apiStatus.innerHTML = `
        <div class="status-icon">✅</div>
        <div class="status-text">API key configured and ready</div>
      `;
      } else {
        apiStatus.className = "api-status api-missing";
        apiStatus.innerHTML = `
        <div class="status-icon">⚠️</div>
        <div class="status-text">API key not set. Click Settings to configure.</div>
      `;
      }
    })
    .catch((error) => {
      apiStatus.className = "api-status api-missing";
      apiStatus.innerHTML = `
      <div class="status-icon">❌</div>
      <div class="status-text">Error checking API key: ${error}</div>
    `;
    });
}

function openOptions() {
  browser.runtime.openOptionsPage();
}

document.addEventListener("DOMContentLoaded", checkApiKey);
document
  .getElementById("options-button")
  .addEventListener("click", openOptions);
