import React from "react";
import ReactDOM from "react-dom/client";
import { Modal } from "@/components/Modal";
import { Message, MessageSchema } from "@/schemas";
import { MODAL_EVENT_NAME, ACTIONS } from "@/constants";
import { sendRuntimeMessage, dispatchModalEvent } from "@/utils";
import DOMPurify from "dompurify";

let selectedRange: Range | null = null;

function toggleBodyScroll(shouldPreventScroll: boolean) {
  if (shouldPreventScroll) {
    document.body.classList.add("ait-modal-open");
  } else {
    document.body.classList.remove("ait-modal-open");
  }
}

function ensureModalRootExists() {
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

function handleProcessTextMessage(message: Message & { action: typeof ACTIONS.PROCESS_TEXT }) {
  if (message.text.trim() === "") return;

  const selection = window.getSelection();
  if (selection && selection.rangeCount > 0) {
    selectedRange = selection.getRangeAt(0);
  }

  dispatchModalEvent({
    action: ACTIONS.MODAL_SHOW_LOADING,
    operation: message.operation,
    instructionType: message.instructionType,
  });

  toggleBodyScroll(true);

  sendRuntimeMessage({
    action: ACTIONS.CALL_AI_API,
    text: message.text,
    instruction: message.instruction,
    operation: message.operation,
    instructionType: message.instructionType,
  });
}

function handleShowProcessedTextMessage(
  message: Message & { action: typeof ACTIONS.SHOW_PROCESSED_TEXT }
) {
  const parentElement = selectedRange?.startContainer.parentElement;
  dispatchModalEvent({
    action: ACTIONS.MODAL_SHOW_PROCESSED_TEXT,
    operation: message.operation,
    instructionType: message.instructionType,
    originalText: message.originalText,
    result: message.result,
    onReplace:
      parentElement && isEditableElement(parentElement)
        ? () => {
            if (selectedRange) {
              const sanitizedText = DOMPurify.sanitize(message.result, { ALLOWED_TAGS: [] });
              selectedRange.deleteContents();
              const textNode = document.createTextNode(sanitizedText);
              selectedRange.insertNode(textNode);
              selectedRange.collapse(false);
            }
          }
        : undefined,
  });
}

function handleShowErrorMessage(message: Message & { action: typeof ACTIONS.MODAL_SHOW_ERROR }) {
  dispatchModalEvent({
    action: ACTIONS.MODAL_SHOW_ERROR,
    error: message.error || "An error occurred",
  });
}

ensureModalRootExists();

// Handle messages emitted by the background script
browser.runtime.onMessage.addListener(async (message: unknown) => {
  try {
    const { success, data } = MessageSchema.safeParse(message);
    if (!success) return;

    ensureModalRootExists();

    if (data.action === ACTIONS.PROCESS_TEXT) {
      handleProcessTextMessage(data);
    } else if (data.action === ACTIONS.SHOW_PROCESSED_TEXT) {
      handleShowProcessedTextMessage(data);
    } else if (data.action === ACTIONS.MODAL_SHOW_ERROR) {
      handleShowErrorMessage(data);
    }
  } catch (error) {
    console.log("Error processing message:", error);
  }
});

// Handle custom modal events
window.addEventListener(MODAL_EVENT_NAME, ((event: CustomEvent) => {
  const { success, data } = MessageSchema.safeParse(event.detail);
  if (!success) return;

  if (data.action === ACTIONS.MODAL_CLOSE) {
    toggleBodyScroll(false);
  } else if (data.action === ACTIONS.OPEN_SETTINGS_PAGE) {
    sendRuntimeMessage({ action: ACTIONS.OPEN_SETTINGS_PAGE });
  }
}) as EventListener);
