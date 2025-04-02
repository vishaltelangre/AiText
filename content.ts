import React from "react";
import ReactDOM from "react-dom/client";
import { Modal } from "@/components/Modal";
import { ACTION_NAME_PREFIX, Message, MessageSchema, type EnhancementType } from "@/schemas";

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
}

/* Prevent body scroll when modal is open */
body.ait-modal-open {
  overflow: hidden !important;
}`;

const styleEl = document.createElement("style");
styleEl.textContent = styles;
document.head.appendChild(styleEl);

let selectedRange: Range | null = null;

function toggleBodyScroll(shouldPreventScroll: boolean) {
  if (shouldPreventScroll) {
    document.body.classList.add("ait-modal-open");
  } else {
    document.body.classList.remove("ait-modal-open");
  }
}

function ensureModalRootExists(): HTMLElement {
  const modalRoot = document.getElementById("ait-root");
  if (!modalRoot) {
    const newModalRoot = document.createElement("div");
    newModalRoot.id = "ait-root";
    document.body.appendChild(newModalRoot);
    ReactDOM.createRoot(newModalRoot).render(React.createElement(Modal));
    return newModalRoot;
  }

  return modalRoot;
}

ensureModalRootExists();

function isEditableElement(element: Element | null): boolean {
  if (!element) return false;
  const htmlElement = element as HTMLElement;
  return (
    htmlElement.isContentEditable || element.tagName === "INPUT" || element.tagName === "TEXTAREA"
  );
}

// Listen for messages from background script
browser.runtime.onMessage.addListener((message: unknown) => {
  try {
    const { success, data } = MessageSchema.safeParse(message);
    if (!success) throw new Error("Invalid message received");

    ensureModalRootExists();
    const validatedMessage = data;

    if (
      validatedMessage.action === `${ACTION_NAME_PREFIX}-enhanceText` &&
      validatedMessage.text.trim() !== ""
    ) {
      selectedRange = window.getSelection()?.getRangeAt(0) || null;
      toggleBodyScroll(true);

      // Dispatch loading event
      window.dispatchEvent(
        new CustomEvent("ait-modal-event", {
          detail: {
            action: `${ACTION_NAME_PREFIX}-modal-showLoading`,
            enhancementType: validatedMessage.enhancementType,
          },
        })
      );

      // Send message to background script
      browser.runtime.sendMessage({
        ...validatedMessage,
        action: `${ACTION_NAME_PREFIX}-callAiApi`,
      } as Message);
    } else if (validatedMessage.action === `${ACTION_NAME_PREFIX}-replaceText`) {
      const parentElement = selectedRange?.startContainer.parentElement;

      // Dispatch result event
      window.dispatchEvent(
        new CustomEvent("ait-modal-event", {
          detail: {
            action: `${ACTION_NAME_PREFIX}-modal-showResult`,
            enhancementType: validatedMessage.enhancementType,
            originalText: validatedMessage.originalText,
            enhancedText: validatedMessage.result,
            onApply: isEditableElement(parentElement ? parentElement : null)
              ? () => {
                  if (selectedRange) {
                    selectedRange.deleteContents();
                    selectedRange.insertNode(document.createTextNode(validatedMessage.result));
                  }
                }
              : undefined,
          } as Message,
        })
      );
    } else if (validatedMessage.action === `${ACTION_NAME_PREFIX}-showError`) {
      // Dispatch error event
      window.dispatchEvent(
        new CustomEvent("ait-modal-event", {
          detail: {
            action: `${ACTION_NAME_PREFIX}-modal-showError`,
            error: validatedMessage.error || "An error occurred",
          },
        })
      );
    }
  } catch (error) {
    console.error("Invalid message received:", error);
  }
});

// Add cleanup when modal closes
window.addEventListener("ait-modal-event", ((event: CustomEvent) => {
  const { action } = event.detail;
  if (action === `${ACTION_NAME_PREFIX}-modal-close`) {
    toggleBodyScroll(false);
  }
}) as EventListener);
