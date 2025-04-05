import { MessageSchema } from "@/schemas";
import { ACTIONS, DEFAULT_CONTEXT_MENU_ITEMS, STORAGE_KEYS } from "@/constants";
import { getActiveAiProviderConfig, getStorageData, sendContentMessageToTab } from "@/utils";
import { createAiProvider } from "@/data";

const commonInstruction =
  "Format your response in markdown. Use markdown features where appropriate to improve readability making it clear and well-structured. Don't say 'Here's a ...' or anything like that. Just return the text.";

const getContextMenuItems = async () => {
  try {
    const res = await getStorageData([STORAGE_KEYS.CUSTOM_CONTEXT_MENU_ITEMS]);
    if (!res.success) return DEFAULT_CONTEXT_MENU_ITEMS;
    const customContextMenuItems = res.data[STORAGE_KEYS.CUSTOM_CONTEXT_MENU_ITEMS] || [];
    return [...DEFAULT_CONTEXT_MENU_ITEMS, ...customContextMenuItems];
  } catch (error) {
    console.log("Error loading custom menu items:", error);
    return DEFAULT_CONTEXT_MENU_ITEMS;
  }
};

const createContextMenu = async () => {
  // Clear existing menu items
  await browser.contextMenus.removeAll();

  // Create parent menu
  browser.contextMenus.create({
    id: "ait-context-menu",
    title: browser.runtime.getManifest().name,
    contexts: ["selection"],
  });

  // Add menu items
  const contextMenuItems = await getContextMenuItems();
  contextMenuItems.forEach((item) => {
    browser.contextMenus.create({
      id: item.id,
      parentId: "ait-context-menu",
      title: item.title,
      contexts: ["selection"],
    });
  });
};

browser.runtime.onInstalled.addListener(createContextMenu);

browser.storage.onChanged.addListener((changes) => {
  if (changes[STORAGE_KEYS.CUSTOM_CONTEXT_MENU_ITEMS]) createContextMenu();
});

browser.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.selectionText && tab?.id) {
    // Check default menu items first
    try {
      const contextMenuItems = await getContextMenuItems();
      const contextMenuItem = contextMenuItems.find((item) => item.id === info.menuItemId);
      if (contextMenuItem) {
        sendContentMessageToTab(tab.id, {
          action: ACTIONS.PROCESS_TEXT,
          operation: contextMenuItem.title,
          text: info.selectionText,
          instruction: contextMenuItem.instruction + " " + commonInstruction,
          instructionType: contextMenuItem.id,
        });
        return;
      }
    } catch (error) {
      console.log("Error handling custom menu item:", error);
    }
  }
});

let abortController: AbortController | null = null;
let debounceTimeout: ReturnType<typeof setTimeout> | null = null;

// Listen for messages from content script
browser.runtime.onMessage.addListener((message: unknown, sender) => {
  try {
    const { success, data } = MessageSchema.safeParse(message);
    if (!success) throw new Error("Invalid message received");

    if (data.action === ACTIONS.OPEN_SETTINGS_PAGE) {
      browser.runtime.openOptionsPage();
      return true;
    }

    if (data.action === ACTIONS.CALL_AI_API && sender.tab?.id) {
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(async () => {
        abortController?.abort();
        abortController = new AbortController();
        const tabId = sender.tab?.id;
        if (!tabId) return;

        try {
          const config = await getActiveAiProviderConfig();
          const result = await createAiProvider(config.type, config).callApi(
            data.text,
            data.instruction,
            abortController?.signal
          );
          sendContentMessageToTab(tabId, {
            action: ACTIONS.SHOW_PROCESSED_TEXT,
            operation: data.operation,
            result,
            originalText: data.text,
            instructionType: data.instructionType,
          });
        } catch (error) {
          if (error instanceof DOMException && error.name === "AbortError") return;

          console.log("Error getting active AI provider config:", error);
          const errorMessage = error instanceof Error ? error.message : "An unknown error occurred";
          sendContentMessageToTab(tabId, {
            action: ACTIONS.MODAL_SHOW_ERROR,
            error: errorMessage,
          });
        }
      }, 300);
    }
  } catch (error) {
    console.log("Invalid message received:", error);
  }
  return true;
});
