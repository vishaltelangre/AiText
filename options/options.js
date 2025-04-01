function setFormDisabled(disabled, buttonType = 'both') {
  const elements = [
    document.getElementById("api-key"),
    document.getElementById("show-key"),
    document.getElementById("clear-key"),
    document.getElementById("save"),
    document.getElementById("test-key")
  ];

  elements.forEach(el => {
    el.disabled = disabled;
  });

  const saveSpinner = document.getElementById("save-spinner");
  const testSpinner = document.getElementById("test-spinner");

  if (disabled) {
    if (buttonType === 'save' || buttonType === 'both') {
      saveSpinner.classList.remove("ait-hidden");
    }
    if (buttonType === 'test' || buttonType === 'both') {
      testSpinner.classList.remove("ait-hidden");
    }
  } else {
    saveSpinner.classList.add("ait-hidden");
    testSpinner.classList.add("ait-hidden");
  }
}

function saveOptions(e) {
  e.preventDefault();
  setFormDisabled(true, 'save');

  const apiKey = document.getElementById("api-key").value.trim();
  const status = document.getElementById("status");

  // Allow empty API key for clearing
  browser.storage.sync
    .set({
      geminiApiKey: apiKey,
    })
    .then(() => {
      showStatus("Options saved!", "ait-text-green-600");
    })
    .catch((error) => {
      showStatus("Error saving options: " + error, "ait-text-red-600");
    })
    .finally(() => {
      setFormDisabled(false);
    });
}

function restoreOptions() {
  const apiKeyInput = document.getElementById("api-key");
  const clearButton = document.getElementById("clear-key");

  browser.storage.sync
    .get("geminiApiKey")
    .then((res) => {
      if (res.geminiApiKey) {
        apiKeyInput.value = res.geminiApiKey;
        clearButton.classList.remove("ait-hidden");
      }
    })
    .catch((error) => {
      console.error("Error loading options: " + error);
    });
}

function toggleApiKeyVisibility() {
  const apiKeyInput = document.getElementById("api-key");
  const showKeyButton = document.getElementById("show-key");
  const eyeIcon = showKeyButton.querySelector("svg");

  if (apiKeyInput.type === "password") {
    apiKeyInput.type = "text";
    eyeIcon.innerHTML = `
      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M3.98 8.223A10.477 10.477 0 001.934 12C3.226 16.338 7.244 19.5 12 19.5c.993 0 1.953-.138 2.863-.395M6.228 6.228A10.45 10.45 0 0112 4.5c4.756 0 8.773 3.162 10.065 7.498a10.523 10.523 0 01-4.293 5.774M6.228 6.228L3 3m3.228 3.228l3.65 3.65m7.894 7.894L21 21m-3.228-3.228l-3.65-3.65m0 0a3 3 0 10-4.243-4.243m4.242 4.242L9.88 9.88" />
    `;
  } else {
    apiKeyInput.type = "password";
    eyeIcon.innerHTML = `
      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" />
      <path stroke="currentColor" stroke-linecap="round" stroke-linejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    `;
  }
}

function clearApiKey() {
  const apiKeyInput = document.getElementById("api-key");
  const clearButton = document.getElementById("clear-key");
  apiKeyInput.value = "";
  clearButton.classList.add("ait-hidden");
}

function toggleClearButton() {
  const apiKeyInput = document.getElementById("api-key");
  const clearButton = document.getElementById("clear-key");

  if (apiKeyInput.value.trim()) {
    clearButton.classList.remove("ait-hidden");
  } else {
    clearButton.classList.add("ait-hidden");
  }
}

function showStatus(message, colorClass) {
  const status = document.getElementById("status");
  status.textContent = message;
  status.className = `ait-text-sm ${colorClass}`;
  setTimeout(() => {
    status.textContent = "";
    status.className = "ait-text-sm";
  }, 3000);
}

async function testApiKey() {
  const apiKey = document.getElementById("api-key").value.trim();
  if (!apiKey) {
    showStatus("Please enter an API key first", "ait-text-red-600");
    return;
  }

  setFormDisabled(true, 'test');
  const modelId = "gemini-2.0-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: "Test"
          }
        ]
      }
    ],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "text/plain"
    }
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || response.statusText);
    }

    showStatus("API key is valid!", "ait-text-green-600");
  } catch (error) {
    showStatus(error.message, "ait-text-red-600");
  } finally {
    setFormDisabled(false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  restoreOptions();

  // Add event listeners
  document.getElementById("api-key").addEventListener("input", toggleClearButton);
  document.getElementById("save").addEventListener("click", saveOptions);
  document.getElementById("show-key").addEventListener("click", toggleApiKeyVisibility);
  document.getElementById("clear-key").addEventListener("click", clearApiKey);
  document.getElementById("test-key").addEventListener("click", testApiKey);

  // Prevent form submission
  document.querySelector("form").addEventListener("submit", (e) => {
    e.preventDefault();
    saveOptions(e);
  });
});
