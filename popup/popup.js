function checkApiKey() {
  const statusContainer = document.getElementById('api-status-container');
  const statusText = document.getElementById('api-status-text');
  const successIcon = document.getElementById('status-icon-success');
  const errorIcon = document.getElementById('status-icon-error');

  browser.storage.sync
    .get("geminiApiKey")
    .then((res) => {
      if (res.geminiApiKey) {
        statusContainer.className = 'ait-flex ait-items-center ait-justify-between ait-bg-green-50 ait-border ait-border-green-100 ait-rounded-lg ait-px-4 ait-py-2.5 ait-mt-4';
        statusText.className = 'ait-text-sm ait-text-green-700';
        successIcon.classList.remove('ait-hidden');
        errorIcon.classList.add('ait-hidden');
        statusText.textContent = 'API key configured';
      } else {
        statusContainer.className = 'ait-flex ait-items-center ait-justify-between ait-bg-red-100/50 ait-border ait-border-red-200 ait-rounded-lg ait-px-4 ait-py-2.5 ait-mt-4';
        statusText.className = 'ait-text-sm ait-text-red-700';
        successIcon.classList.add('ait-hidden');
        errorIcon.classList.remove('ait-hidden');
        statusText.textContent = 'API key not set';
      }
    })
    .catch((error) => {
      statusContainer.className = 'ait-flex ait-items-center ait-justify-between ait-bg-red-100/50 ait-border ait-border-red-200 ait-rounded-lg ait-px-4 ait-py-2.5 ait-mt-4';
      statusText.className = 'ait-text-sm ait-text-red-700';
      successIcon.classList.add('ait-hidden');
      errorIcon.classList.remove('ait-hidden');
      statusText.textContent = 'Error checking API key';
    });
}

function openOptions() {
  browser.runtime.openOptionsPage();
}

document.addEventListener("DOMContentLoaded", checkApiKey);
document
  .getElementById("options-button")
  .addEventListener("click", openOptions);
