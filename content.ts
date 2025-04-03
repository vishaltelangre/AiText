import React from "react";
import ReactDOM from "react-dom/client";
import { Modal } from "@/components/Modal";
import { ACTION_NAME_PREFIX, Message, MessageSchema } from "@/schemas";

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
    newModalRoot.classList.add("ait-root");
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
      const selection = window.getSelection();
      selectedRange = selection && selection.rangeCount > 0 ? selection.getRangeAt(0) : null;
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
            onReplace:
              parentElement && isEditableElement(parentElement)
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
