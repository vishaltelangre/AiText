import { MessageSchema } from "@/schemas";
import { callAiApi } from "@/data";
import { ACTIONS } from "@/constants";
import { sendContentMessageToTab } from "@/utils";

const menuItems = [
  {
    id: "fixGrammar",
    title: "Fix Grammar",
    instruction: "Fix the grammar and make any necessary corrections in the given text.",
  },
  {
    id: "rephrase",
    title: "Rephrase",
    instruction: "Rephrase the given text to convey the same meaning in a different way.",
  },
  {
    id: "formalize",
    title: "Formalize",
    instruction: "Make the given text more formal and professional.",
  },
  {
    id: "simplify",
    title: "Simplify",
    instruction: "Simplify the given text to make it easier to understand.",
  },
  {
    id: "summarize",
    title: "Summarize",
    instruction: "Summarize the given text concisely.",
  },
] as const;

const commonInstruction =
  "Format your response in markdown. Use markdown features where appropriate to improve readability. Focus on making the text clear and well-structured. Don't say 'Here's a ...' or anything like that. Just return the text.";
const menuItemsWithInstructions = menuItems.map((item) => ({
  ...item,
  instruction: `${item.instruction} ${commonInstruction}`,
}));

browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "ait-context-menu",
    title: browser.runtime.getManifest().name,
    contexts: ["selection"],
  });

  menuItemsWithInstructions.forEach((item) => {
    browser.contextMenus.create({
      id: item.id,
      parentId: "ait-context-menu",
      title: item.title,
      contexts: ["selection"],
    });
  });
});

browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.selectionText && tab?.id) {
    const menuItem = menuItems.find((item) => item.id === info.menuItemId);

    if (menuItem) {
      // Send message to content script with the selected text and instruction
      sendContentMessageToTab(tab.id, {
        action: ACTIONS.ENHANCE_TEXT,
        text: info.selectionText,
        instruction: menuItem.instruction,
        enhancementType: menuItem.id,
      });
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
              action: ACTIONS.SHOW_ENHANCED_TEXT,
              result,
              originalText: data.text,
              enhancementType: data.enhancementType,
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
