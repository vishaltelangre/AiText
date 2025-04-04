import { Message, MessageSchema, StorageData, StorageDataSchema } from "@/schemas";
import { MODAL_EVENT_NAME, STORAGE_KEYS } from "@/constants";

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

export async function getActiveAiProviderConfig() {
  const { success, data } = await getStorageData([STORAGE_KEYS.AI_PROVIDERS_CONFIGS]);
  if (!success) throw new Error("Failed to get AI providers configs");
  const configs = data[STORAGE_KEYS.AI_PROVIDERS_CONFIGS];
  console.log("configs", configs, data, STORAGE_KEYS.AI_PROVIDERS_CONFIGS);
  if (!configs) throw new Error("No AI providers configs");
  const activeProvider = configs.activeProvider;
  if (!activeProvider) throw new Error("No active AI provider");
  const config = configs.providers[activeProvider];
  if (!config) throw new Error("No active AI provider config");
  return config;
}
