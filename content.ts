import React from "react";
import ReactDOM from "react-dom/client";
import { Modal } from "@/components/Modal";
import { Message, MessageSchema } from "@/schemas";
import { MODAL_EVENT_NAME, ACTIONS } from "@/constants";
import { sendRuntimeMessage, dispatchModalEvent } from "@/utils";

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

function handleProcessTextMessage(message: Message & { action: typeof ACTIONS.PROCESS_TEXT }) {
  if (message.originalText.trim() === "") return;

  dispatchModalEvent({
    action: ACTIONS.MODAL_SHOW_LOADING,
    operation: message.operation,
    instructionType: message.instructionType,
    instruction: message.instruction,
    originalText: message.originalText,
  });

  toggleBodyScroll(true);

  sendRuntimeMessage({
    action: ACTIONS.CALL_AI_API,
    originalText: message.originalText,
    instruction: message.instruction,
    operation: message.operation,
    instructionType: message.instructionType,
  });
}

function handleShowProcessedTextMessage(
  message: Message & { action: typeof ACTIONS.SHOW_PROCESSED_TEXT }
) {
  dispatchModalEvent({
    action: ACTIONS.MODAL_SHOW_PROCESSED_TEXT,
    operation: message.operation,
    instructionType: message.instructionType,
    instruction: message.instruction,
    originalText: message.originalText,
    result: message.result,
  });
}

function handleShowErrorMessage(message: Message & { action: typeof ACTIONS.MODAL_SHOW_ERROR }) {
  dispatchModalEvent({
    action: ACTIONS.MODAL_SHOW_ERROR,
    error: message.error || "An error occurred",
    operation: message.operation,
    instructionType: message.instructionType,
    instruction: message.instruction,
    originalText: message.originalText,
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
  } else if (data.action === ACTIONS.RETRY_PROCESS_TEXT) {
    handleProcessTextMessage({
      ...data,
      action: ACTIONS.PROCESS_TEXT,
    });
  }
}) as EventListener);
