import { Message, MessageSchema, StorageData, StorageDataSchema } from "@/schemas";
import { MODAL_EVENT_NAME } from "@/constants";

// Sends a message to the background script
export function sendRuntimeMessage<T extends Message>(message: T) {
  const { success } = MessageSchema.safeParse(message);
  if (!success) throw new Error("Invalid runtime message format");

  browser.runtime.sendMessage(message);
}

// Sends a message to the content script in a specific tab
export function sendContentMessageToTab<T extends Message>(tabId: number, message: T) {
  const { success } = MessageSchema.safeParse(message);
  if (!success) throw new Error("Invalid content message format");

  browser.tabs.sendMessage(tabId, message);
}

// Dispatches a custom event
export function dispatchModalEvent<T extends Message>(message: T) {
  const { success } = MessageSchema.safeParse(message);
  if (!success) throw new Error("Invalid modal event message format");

  window.dispatchEvent(new CustomEvent(MODAL_EVENT_NAME, { detail: message }));
}

export async function setStorageData(data: Partial<StorageData>) {
  await browser.storage.sync.set(data);
}

export async function getStorageData(keys: (keyof StorageData)[]) {
  const res = await browser.storage.sync.get(keys);
  return StorageDataSchema.safeParse(res);
}
