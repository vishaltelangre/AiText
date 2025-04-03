import React from "react";
import ReactDOM from "react-dom/client";
import { Modal } from "@/components/Modal";
import { Message, MessageSchema } from "@/schemas";
import { MODAL_EVENT_NAME, ACTIONS } from "@/constants";

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

function isEditableElement(element: Element): boolean {
  return (
    element instanceof HTMLInputElement ||
    element instanceof HTMLTextAreaElement ||
    element.hasAttribute("contenteditable")
  );
}

function handleEnhanceTextMessage(message: Message & { action: typeof ACTIONS.ENHANCE_TEXT }) {
  if (message.text.trim() === "") return;

  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    selectedRange = selection.getRangeAt(0);
  }

  window.dispatchEvent(
    new CustomEvent(MODAL_EVENT_NAME, {
      detail: {
        action: ACTIONS.MODAL_SHOW_LOADING,
        enhancementType: message.enhancementType,
      } as Message,
    })
  );

  browser.runtime.sendMessage({
    action: ACTIONS.CALL_AI_API,
    text: message.text,
    instruction: message.instruction,
    enhancementType: message.enhancementType,
  } as Message);
}

function handleReplaceTextMessage(message: Message & { action: typeof ACTIONS.REPLACE_TEXT }) {
  const parentElement = selectedRange?.startContainer.parentElement;
  window.dispatchEvent(
    new CustomEvent(MODAL_EVENT_NAME, {
      detail: {
        action: ACTIONS.MODAL_SHOW_RESULT,
        enhancementType: message.enhancementType,
        originalText: message.originalText,
        enhancedText: message.result,
        onReplace:
          parentElement && isEditableElement(parentElement)
            ? () => {
                if (selectedRange) {
                  selectedRange.deleteContents();
                  selectedRange.insertNode(document.createTextNode(message.result));
                }
              }
            : undefined,
      } as Message,
    })
  );
}

function handleShowErrorMessage(message: Message & { action: typeof ACTIONS.SHOW_ERROR }) {
  window.dispatchEvent(
    new CustomEvent(MODAL_EVENT_NAME, {
      detail: {
        action: ACTIONS.MODAL_SHOW_ERROR,
        error: message.error || "An error occurred",
      } as Message,
    })
  );
}

function handleModalClose(message: Message & { action: typeof ACTIONS.MODAL_CLOSE }) {
  toggleBodyScroll(false);
}

// Handle messages emitted by the background script
browser.runtime.onMessage.addListener(async (message: unknown) => {
  try {
    const { success, data } = MessageSchema.safeParse(message);
    if (!success) return;

    ensureModalRootExists();

    if (data.action === ACTIONS.ENHANCE_TEXT) {
      handleEnhanceTextMessage(data);
    } else if (data.action === ACTIONS.REPLACE_TEXT) {
      handleReplaceTextMessage(data);
    } else if (data.action === ACTIONS.SHOW_ERROR) {
      handleShowErrorMessage(data);
    }
  } catch (error) {
    console.error("Error processing message:", error);
  }
});

// Handle custom modal events
window.addEventListener(MODAL_EVENT_NAME, ((event: CustomEvent) => {
  const { success, data } = MessageSchema.safeParse(event.detail);
  if (!success) return;

  if (data.action === ACTIONS.MODAL_CLOSE) {
    handleModalClose(data);
  }
}) as EventListener);

document.addEventListener("DOMContentLoaded", ensureModalRootExists);
