import { CustomContextMenuItemsSchema, MessageSchema } from "@/schemas";
import { callAiApi } from "@/data";
import { ACTIONS, defaultContextMenuItems } from "@/constants";
import { sendContentMessageToTab } from "@/utils";

const commonInstruction =
  "Format your response in markdown. Use markdown features where appropriate to improve readability making it clear and well-structured. Don't say 'Here's a ...' or anything like that. Just return the text.";

const getContextMenuItems = async () => {
  try {
    const res = await browser.storage.sync.get("customContextMenuItems");
    const { success, data } = CustomContextMenuItemsSchema.safeParse(res.customContextMenuItems);
    if (!success) return defaultContextMenuItems;
    return [...defaultContextMenuItems, ...data];
  } catch (error) {
    console.error("Error loading custom menu items:", error);
    return defaultContextMenuItems;
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
  if (changes.customContextMenuItems) createContextMenu();
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
      console.error("Error handling custom menu item:", error);
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
      debounceTimeout = setTimeout(() => {
        abortController?.abort();
        abortController = new AbortController();
        const tabId = sender.tab?.id;
        if (!tabId) return;

        const promise = callAiApi(data.text, data.instruction, abortController.signal);
        promise
          .then((result) => {
            sendContentMessageToTab(tabId, {
              action: ACTIONS.SHOW_PROCESSED_TEXT,
              operation: data.operation,
              result,
              originalText: data.text,
              instructionType: data.instructionType,
            });
          })
          .catch((error: unknown) => {
            if (error instanceof DOMException && error.name === "AbortError") return;

            const errorMessage =
              error instanceof Error ? error.message : "An unknown error occurred";
            sendContentMessageToTab(tabId, {
              action: ACTIONS.MODAL_SHOW_ERROR,
              error: errorMessage,
            });
          });
      }, 300);
    }
  } catch (error) {
    console.error("Invalid message received:", error);
  }
  return true;
});
