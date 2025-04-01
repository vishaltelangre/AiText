// Define spinner animation styles
const styles = `
@keyframes spinner {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

.ait-text-spinner {
  animation: spinner 1s linear infinite;
}

/* Fade in animation */
@keyframes fadeIn {
  from { opacity: 0; transform: scale(0.95); }
  to { opacity: 1; transform: scale(1); }
}

.ait-modal-animate {
  animation: fadeIn 0.2s ease-out;
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
      instruction: message.instruction,
      enhancementType: message.enhancementType
    });
  } else if (message.action === "replaceText") {
    // Remove loading overlay
    removeOverlay();
    // Show result modal
    showResultModal(message.originalText, message.result, message.enhancementType);
  } else if (message.action === "showError") {
    // Remove loading overlay
    removeOverlay();
    // Show error modal
    showErrorModal(message.error);
  }
});

function showLoadingOverlay(enhancementType) {
  const overlay = document.createElement("div");
  overlay.className = "ait-fixed ait-inset-0 ait-bg-gray-900/75 ait-backdrop-blur-sm ait-flex ait-justify-center ait-items-center ait-z-[10000]";
  overlay.id = "ait-text-overlay";

  const { loading } = getActionTitle(enhancementType);

  overlay.innerHTML = `
    <div class="ait-bg-white ait-rounded-2xl ait-shadow-2xl ait-w-[90%] ait-max-w-[600px] ait-modal-animate ait-overflow-hidden">
      <div class="ait-flex ait-justify-between ait-items-center ait-px-6 ait-py-4 ait-bg-gray-50">
        <div class="ait-flex ait-items-center ait-gap-3">
          <div class="ait-text-primary">
            <svg class="ait-w-5 ait-h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
          </div>
          <div class="ait-font-semibold ait-text-lg ait-text-gray-800">${loading}</div>
        </div>
        <button class="ait-text-gray-400 hover:ait-text-gray-600 ait-transition-colors ait-p-1 hover:ait-bg-gray-100 ait-rounded-lg" onclick="document.getElementById('ait-text-overlay').remove();">
          <svg class="ait-w-5 ait-h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="ait-flex ait-flex-col ait-items-center ait-p-12">
        <div class="ait-w-10 ait-h-10 ait-border-4 ait-border-gray-200 ait-border-t-primary ait-rounded-full ait-text-spinner ait-mb-6"></div>
        <div class="ait-text-gray-600 ait-font-medium">${loading}</div>
        <div class="ait-text-gray-400 ait-text-sm ait-mt-2">This might take a few seconds...</div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.addEventListener("keydown", handleEscapeKey);
}

function isEditableElement(element) {
  if (!element) return false;
  return element.isContentEditable ||
         element.tagName === 'INPUT' ||
         element.tagName === 'TEXTAREA';
}

function getActionTitle(type) {
  const titles = {
    fixGrammar: {
      action: "Enhanced with grammar fix",
      loading: "Fixing grammar",
    },
    rephraseSentence: {
      action: "Rephrased",
      loading: "Rephrasing sentence",
    },
    formalize: {
      action: "Formalized",
      loading: "Formalizing text",
    },
    simplify: {
      action: "Simplified",
      loading: "Simplifying text",
    },
    summarize: {
      action: "Summarized",
      loading: "Summarizing text",
    }
  };

  return titles[type] || { action: "Enhanced", loading: "Enhancing text" };
}

function showResultModal(originalText, enhancedText, enhancementType) {
  const overlay = document.createElement("div");
  overlay.className = "ait-fixed ait-inset-0 ait-bg-gray-900/75 ait-backdrop-blur-sm ait-flex ait-justify-center ait-items-center ait-z-[10000]";
  overlay.id = "ait-text-overlay";

  // Prevent background scroll when modal is open
  document.body.style.overflow = 'hidden';

  // Check if the selected text is from an editable element
  const isEditable = selectedRange && isEditableElement(selectedRange.startContainer.parentElement);

  // Get the action-specific title
  const { action } = getActionTitle(enhancementType);

  overlay.innerHTML = `
    <div class="ait-bg-white ait-rounded-2xl ait-shadow-2xl ait-w-[90%] ait-max-w-[1000px] ait-max-h-[85vh] ait-flex ait-flex-col ait-modal-animate ait-overflow-hidden">
      <div class="ait-flex ait-justify-between ait-items-center ait-px-6 ait-py-4 ait-bg-gray-50">
        <div class="ait-flex ait-items-center ait-gap-3">
          <div class="ait-text-primary">
            <svg class="ait-w-5 ait-h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="ait-font-semibold ait-text-lg ait-text-gray-800">${action}</div>
        </div>
        <button class="ait-text-gray-400 hover:ait-text-gray-600 ait-transition-colors ait-p-1 hover:ait-bg-gray-100 ait-rounded-lg" onclick="document.getElementById('ait-text-overlay').remove();">
          <svg class="ait-w-5 ait-h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="ait-grid ait-grid-cols-2 ait-min-h-0 ait-flex-1 ait-divide-x ait-divide-gray-200">
        <div class="ait-overflow-hidden ait-flex ait-flex-col">
          <div class="ait-flex ait-items-center ait-gap-2 ait-px-6 ait-py-3 ait-shrink-0 ait-bg-gray-50/80 ait-border-y ait-border-gray-200">
            <svg class="ait-w-4 ait-h-4 ait-text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"/>
            </svg>
            <h3 class="ait-font-medium ait-text-gray-700">Original</h3>
          </div>
          <div class="ait-overflow-y-auto ait-px-6 ait-py-4 ait-grow">
            <div class="ait-prose ait-prose-sm ait-max-w-none ait-text-gray-600 ait-mx-auto ait-max-w-[450px]">
              ${originalText.split('\n').map(line => `<p>${line || '<br/>'}</p>`).join('')}
            </div>
          </div>
        </div>
        <div class="ait-overflow-hidden ait-flex ait-flex-col">
          <div class="ait-flex ait-items-center ait-gap-2 ait-px-6 ait-py-3 ait-shrink-0 ait-bg-gray-50/80 ait-border-y ait-border-gray-200">
            <svg class="ait-w-4 ait-h-4 ait-text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
            </svg>
            <h3 class="ait-font-medium ait-text-gray-700">Updated</h3>
          </div>
          <div class="ait-overflow-y-auto ait-px-6 ait-py-4 ait-grow">
            <div id="ait-enhanced-text" class="ait-prose ait-prose-sm ait-max-w-none ait-text-gray-800 ait-mx-auto ait-max-w-[450px]">
              ${enhancedText.split('\n').map(line => `<p>${line || '<br/>'}</p>`).join('')}
            </div>
          </div>
        </div>
      </div>
      ${isEditable ? `
        <div class="ait-flex ait-justify-end ait-gap-3 ait-px-6 ait-py-4 ait-bg-gray-50 ait-border-t ait-border-gray-200 ait-shrink-0">
          <button class="ait-px-4 ait-py-2 ait-rounded-lg ait-text-sm ait-font-medium ait-text-gray-700 ait-bg-white ait-border ait-border-gray-200 hover:ait-bg-gray-50 hover:ait-border-gray-300 ait-transition-colors focus:ait-ring-2 focus:ait-ring-gray-200" onclick="document.getElementById('ait-text-overlay').remove();">Cancel</button>
          <button class="ait-px-4 ait-py-2 ait-rounded-lg ait-text-sm ait-font-medium ait-text-white ait-bg-primary hover:ait-bg-primary-hover ait-transition-colors focus:ait-ring-2 focus:ait-ring-primary/50 focus:ait-ring-offset-2" id="ait-apply-button">
            Apply Changes
          </button>
        </div>
      ` : ''}
    </div>
  `;

  document.body.appendChild(overlay);

  if (isEditable) {
    document.getElementById("ait-apply-button").addEventListener("click", () => {
      const newText = document.getElementById("ait-enhanced-text").textContent;
      replaceSelectedText(newText);
      removeOverlay();
    });
  }

  document.addEventListener("keydown", handleEscapeKey);
}

function showErrorModal(errorMessage) {
  const overlay = document.createElement("div");
  overlay.className = "ait-fixed ait-inset-0 ait-bg-gray-900/75 ait-backdrop-blur-sm ait-flex ait-justify-center ait-items-center ait-z-[10000]";
  overlay.id = "ait-text-overlay";

  overlay.innerHTML = `
    <div class="ait-bg-white ait-rounded-xl ait-shadow-2xl ait-w-[90%] ait-max-w-[600px] ait-modal-animate">
      <div class="ait-flex ait-justify-between ait-items-center ait-p-6 ait-border-b ait-border-gray-100">
        <div class="ait-flex ait-items-center ait-gap-3">
          <div class="ait-text-red-500">
            <svg class="ait-w-5 ait-h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
          </div>
          <div class="ait-font-semibold ait-text-lg ait-text-gray-800">Error</div>
        </div>
        <button class="ait-text-gray-400 hover:ait-text-gray-600 ait-transition-colors ait-p-1 hover:ait-bg-gray-100 ait-rounded-lg" onclick="document.getElementById('ait-text-overlay').remove();">
          <svg class="ait-w-5 ait-h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>
      <div class="ait-p-6">
        <div class="ait-flex ait-items-start ait-gap-3 ait-text-red-600 ait-p-4 ait-border ait-border-red-100 ait-bg-red-50 ait-rounded-lg ait-mb-4">
          <svg class="ait-w-5 ait-h-5 ait-mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
          </svg>
          <div>${errorMessage}</div>
        </div>
        <div class="ait-flex ait-justify-end">
          <button class="ait-px-4 ait-py-2 ait-rounded-lg ait-text-sm ait-font-medium ait-text-gray-700 ait-bg-white ait-border ait-border-gray-200 hover:ait-bg-gray-50 hover:ait-border-gray-300 ait-transition-colors focus:ait-ring-2 focus:ait-ring-gray-200" onclick="document.getElementById('ait-text-overlay').remove();">Close</button>
        </div>
      </div>
    </div>
  `;

  document.body.appendChild(overlay);
  document.addEventListener("keydown", handleEscapeKey);
}

function replaceSelectedText(newText) {
  if (selectedRange) {
    selectedRange.deleteContents();
    selectedRange.insertNode(document.createTextNode(newText));
  }
}

function removeOverlay() {
  const overlay = document.getElementById("ait-text-overlay");
  if (overlay) {
    overlay.remove();
    document.removeEventListener("keydown", handleEscapeKey);
    // Re-enable background scroll
    document.body.style.overflow = '';
  }
}

function handleEscapeKey(e) {
  if (e.key === "Escape") {
    removeOverlay();
  }
}
