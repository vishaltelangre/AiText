import type { ButtonType, StorageData, GeminiApiError } from "../types";

function setFormDisabled(
  disabled: boolean,
  buttonType: ButtonType = "both"
): void {
  const elements = [
    document.getElementById("api-key"),
    document.getElementById("show-key"),
    document.getElementById("clear-key"),
    document.getElementById("save"),
    document.getElementById("test-key"),
  ] as Array<HTMLInputElement | HTMLButtonElement | null>;

  elements.forEach((el) => {
    if (el) {
      el.disabled = disabled;
    }
  });

  const saveSpinner = document.getElementById("save-spinner");
  const testSpinner = document.getElementById("test-spinner");

  if (disabled) {
    if (buttonType === "save" || buttonType === "both") {
      saveSpinner?.classList.remove("ait-hidden");
    }
    if (buttonType === "test" || buttonType === "both") {
      testSpinner?.classList.remove("ait-hidden");
    }
  } else {
    saveSpinner?.classList.add("ait-hidden");
    testSpinner?.classList.add("ait-hidden");
  }
}

function saveOptions(e: Event): void {
  e.preventDefault();
  setFormDisabled(true, "save");

  const apiKeyInput = document.getElementById("api-key") as HTMLInputElement;
  const status = document.getElementById("status");

  if (!apiKeyInput || !status) {
    return;
  }

  const apiKey = apiKeyInput.value.trim();

  // Allow empty API key for clearing
  browser.storage.sync
    .set({
      geminiApiKey: apiKey,
    })
    .then(() => {
      showStatus("Options saved!", "ait-text-green-600");
    })
    .catch((error: Error) => {
      showStatus("Error saving options: " + error, "ait-text-red-600");
    })
    .finally(() => {
      setFormDisabled(false);
    });
}

function restoreOptions(): void {
  const apiKeyInput = document.getElementById("api-key") as HTMLInputElement;
  const clearButton = document.getElementById("clear-key");

  if (!apiKeyInput || !clearButton) {
    return;
  }

  browser.storage.sync
    .get("geminiApiKey")
    .then((res: StorageData) => {
      if (res.geminiApiKey) {
        apiKeyInput.value = res.geminiApiKey;
        clearButton.classList.remove("ait-hidden");
      }
    })
    .catch((error: Error) => {
      console.error("Error loading options: " + error);
    });
}

function toggleApiKeyVisibility(): void {
  const apiKeyInput = document.getElementById("api-key") as HTMLInputElement;
  const showKeyButton = document.getElementById("show-key");
  const eyeIcon = showKeyButton?.querySelector("svg");

  if (!apiKeyInput || !eyeIcon) {
    return;
  }

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

function clearApiKey(): void {
  const apiKeyInput = document.getElementById("api-key") as HTMLInputElement;
  const clearButton = document.getElementById("clear-key");

  if (!apiKeyInput || !clearButton) {
    return;
  }

  apiKeyInput.value = "";
  clearButton.classList.add("ait-hidden");
}

function toggleClearButton(): void {
  const apiKeyInput = document.getElementById("api-key") as HTMLInputElement;
  const clearButton = document.getElementById("clear-key");

  if (!apiKeyInput || !clearButton) {
    return;
  }

  if (apiKeyInput.value.trim()) {
    clearButton.classList.remove("ait-hidden");
  } else {
    clearButton.classList.add("ait-hidden");
  }
}

function showStatus(message: string, colorClass: string): void {
  const status = document.getElementById("status");
  if (!status) {
    return;
  }

  status.textContent = message;
  status.className = `ait-text-sm ${colorClass}`;
  setTimeout(() => {
    status.textContent = "";
    status.className = "ait-text-sm";
  }, 3000);
}

async function testApiKey(): Promise<void> {
  const apiKeyInput = document.getElementById("api-key") as HTMLInputElement;
  if (!apiKeyInput) {
    return;
  }

  const apiKey = apiKeyInput.value.trim();
  if (!apiKey) {
    showStatus("Please enter an API key first", "ait-text-red-600");
    return;
  }

  setFormDisabled(true, "test");
  const modelId = "gemini-2.0-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: "Test",
          },
        ],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "text/plain",
    },
  };

  try {
    const response = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = (await response.json()) as GeminiApiError;
      throw new Error(errorData.error?.message || response.statusText);
    }

    showStatus("API key is valid!", "ait-text-green-600");
  } catch (error) {
    if (error instanceof Error) {
      showStatus(error.message, "ait-text-red-600");
    } else {
      showStatus("An unknown error occurred", "ait-text-red-600");
    }
  } finally {
    setFormDisabled(false);
  }
}

document.addEventListener("DOMContentLoaded", () => {
  restoreOptions();

  const apiKeyInput = document.getElementById("api-key");
  const saveButton = document.getElementById("save");
  const showKeyButton = document.getElementById("show-key");
  const clearKeyButton = document.getElementById("clear-key");
  const testKeyButton = document.getElementById("test-key");
  const form = document.querySelector("form");

  if (apiKeyInput) {
    apiKeyInput.addEventListener("input", toggleClearButton);
  }
  if (saveButton) {
    saveButton.addEventListener("click", saveOptions);
  }
  if (showKeyButton) {
    showKeyButton.addEventListener("click", toggleApiKeyVisibility);
  }
  if (clearKeyButton) {
    clearKeyButton.addEventListener("click", clearApiKey);
  }
  if (testKeyButton) {
    testKeyButton.addEventListener("click", testApiKey);
  }
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      saveOptions(e);
    });
  }
});
