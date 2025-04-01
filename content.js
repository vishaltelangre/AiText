const styles = `
.ai-text-overlay {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 10000;
}

.ai-text-modal {
  background-color: white;
  border-radius: 0.5rem;
  box-shadow: 0 10px 25px rgba(0, 0, 0, 0.2);
  width: 90%;
  max-width: 600px;
  max-height: 80vh;
  overflow-y: auto;
  position: relative;
}

.ai-text-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1rem 1.5rem;
  border-bottom: 1px solid #eaeaea;
  background-color: #f9fafb;
  border-top-left-radius: 0.5rem;
  border-top-right-radius: 0.5rem;
}

.ai-text-title {
  font-weight: 600;
  font-size: 1.125rem;
  color: #1f2937;
}

.ai-text-close {
  background: none;
  border: none;
  cursor: pointer;
  color: #6b7280;
  font-size: 1.25rem;
  transition: color 0.2s;
}

.ai-text-close:hover {
  color: #ef4444;
}

.ai-text-content {
  padding: 1.5rem;
}

.ai-text-label {
  display: block;
  font-weight: 500;
  margin-bottom: 0.5rem;
  color: #4b5563;
}

.ai-text-textarea {
  width: 100%;
  min-height: 120px;
  padding: 0.75rem;
  border: 1px solid #d1d5db;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
  font-family: inherit;
  font-size: 0.875rem;
  line-height: 1.5;
  resize: vertical;
}

.ai-text-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1rem;
}

.ai-text-button {
  padding: 0.5rem 1rem;
  border-radius: 0.375rem;
  font-weight: 500;
  font-size: 0.875rem;
  cursor: pointer;
  transition: all 0.2s;
}

.ai-text-primary {
  background-color: #3b82f6;
  color: white;
  border: none;
}

.ai-text-primary:hover {
  background-color: #2563eb;
}

.ai-text-secondary {
  background-color: white;
  color: #4b5563;
  border: 1px solid #d1d5db;
}

.ai-text-secondary:hover {
  background-color: #f9fafb;
}

.ai-text-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 2rem;
}

.ai-text-spinner {
  border: 3px solid rgba(209, 213, 219, 0.3);
  border-radius: 50%;
  border-top-color: #3b82f6;
  width: 2rem;
  height: 2rem;
  animation: spinner 1s linear infinite;
  margin-bottom: 1rem;
}

@keyframes spinner {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.ai-text-error {
  color: #ef4444;
  padding: 1rem;
  border: 1px solid #fca5a5;
  background-color: #fee2e2;
  border-radius: 0.375rem;
  margin-bottom: 1rem;
}`;

const styleEl = document.createElement("style");
styleEl.textContent = styles;
document.head.appendChild(styleEl);

let selectedText = "";
let selectedRange = null;

// Listen for messages from background script
browser.runtime.onMessage.addListener((message) => {
  if (message.action === "enhanceText") {
    // Store the selected text and range
    selectedText = message.text;
    selectedRange = window.getSelection().getRangeAt(0);

    // Create loading overlay
    showLoadingOverlay(message.enhancementType);

    // Send request to background script to call an AI model API
    browser.runtime.sendMessage({
      action: "callAiApi",
      text: message.text,
      instruction: message.instruction
    });
  } else if (message.action === "replaceText") {
    // Remove loading overlay
    removeOverlay();
    // Show result modal
    showResultModal(message.originalText, message.result);
  } else if (message.action === "showError") {
    // Remove loading overlay
    removeOverlay();
    // Show error modal
    showErrorModal(message.error);
  }
});

function showLoadingOverlay(enhancementType) {
  // Create overlay
  const overlay = document.createElement("div");
  overlay.className = "ai-text-overlay";
  overlay.id = "ai-text-overlay";

  // Create loading content
  overlay.innerHTML = `
  <div class="ai-text-modal">
      <div class="ai-text-header">
        <div class="ai-text-title">Enhancing text...</div>
        <button class="ai-text-close" onclick="document.getElementById('ai-text-overlay').remove();">×</button>
      </div>
      <div class="ai-text-loading">
        <div class="ai-text-spinner"></div>
        <div>${getTitleFromType(enhancementType)} in progress...</div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Add close on escape key
  document.addEventListener("keydown", handleEscapeKey);
}

function showResultModal(originalText, enhancedText) {
  // Create overlay
  const overlay = document.createElement("div");
  overlay.className = "ai-text-overlay";
  overlay.id = "ai-text-overlay";

  // Create modal content
  overlay.innerHTML = `
    <div class="ai-text-modal">
      <div class="ai-text-header">
        <div class="ai-text-title">Enhanced text</div>
        <button class="ai-text-close" onclick="document.getElementById('ai-text-overlay').remove();">×</button>
      </div>
      <div class="ai-text-content">
        <div>
          <label class="ai-text-label">Original Text:</label>
          <textarea class="ai-text-textarea" readonly>${originalText}</textarea>
        </div>
        <div>
          <label class="ai-text-label">Enhanced Text:</label>
          <textarea id="enhanced-text" class="ai-text-textarea">${enhancedText}</textarea>
        </div>
        <div class="ai-text-actions">
          <button class="ai-text-button ai-text-secondary" onclick="document.getElementById('ai-text-overlay').remove();">Cancel</button>
          <button class="ai-text-button ai-text-primary" id="apply-button">Apply Changes</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Add event listener to apply button
  document.getElementById("apply-button").addEventListener("click", () => {
    const newText = document.getElementById("enhanced-text").value;
    replaceSelectedText(newText);
    removeOverlay();
  });

  // Add close on escape key
  document.addEventListener("keydown", handleEscapeKey);
}

function showErrorModal(errorMessage) {
  // Create overlay
  const overlay = document.createElement("div");
  overlay.className = "ai-text-overlay";
  overlay.id = "ai-text-overlay";

  // Create modal content
  overlay.innerHTML = `
    <div class="ai-text-modal">
      <div class="ai-text-header">
        <div class="ai-text-title">Error</div>
        <button class="ai-text-close" onclick="document.getElementById('ai-text-overlay').remove();">×</button>
      </div>
      <div class="ai-text-content">
        <div class="ai-text-error">
          ${errorMessage}
        </div>
        <div class="ai-text-actions">
          <button class="ai-text-button ai-text-primary" onclick="document.getElementById('ai-text-overlay').remove();">Close</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);

  // Add close on escape key
  document.addEventListener("keydown", handleEscapeKey);
}

function replaceSelectedText(newText) {
  if (selectedRange) {
    selectedRange.deleteContents();
    selectedRange.insertNode(document.createTextNode(newText));
  }
}

function removeOverlay() {
  const overlay = document.getElementById("ai-text-overlay");
  if (overlay) {
    overlay.remove();
    document.removeEventListener("keydown", handleEscapeKey);
  }
}

function handleEscapeKey(e) {
  if (e.key === "Escape") {
    removeOverlay();
  }
}

function getTitleFromType(type) {
  const titles = {
    fixGrammar: "Fixing grammar",
    rephraseSentence: "Rephrasing sentence",
    formalize: "Formalizing text",
    simplify: "Simplifying text",
    summarize: "Summarizing text",
  };

  return titles[type] || "Enhancing text";
}
