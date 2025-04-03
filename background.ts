import { type Message, ACTION_NAME_PREFIX, MessageSchema } from "@/schemas";
import { callAiApi } from "@/data";

const menuItems = [
  {
    id: "fixGrammar",
    title: "Fix Grammar",
    instruction:
      "Fix the grammar and make any necessary corrections in the given text. Don't output anything else. Keep it simple and don't use any heavy or non-standard words. Use plain text for the output.",
  },
  {
    id: "rephraseSentence",
    title: "Rephrase Sentence",
    instruction:
      "Rephrase the given text to convey the same meaning in a different way. Don't output anything else. Use plain text for the output.",
  },
  {
    id: "formalize",
    title: "Formalize",
    instruction:
      "Make the given text more formal and professional. Don't output anything else. Use plain text for the output.",
  },
  {
    id: "simplify",
    title: "Simplify",
    instruction:
      "Simplify the given text to make it easier to understand. Don't output anything else. Use plain text for the output.",
  },
  {
    id: "summarize",
    title: "Summarize",
    instruction:
      "Summarize the given text concisely. Don't output anything else. Use plain text for the output.",
  },
] as const;

browser.runtime.onInstalled.addListener(() => {
  browser.contextMenus.create({
    id: "ait-context-menu",
    title: browser.runtime.getManifest().name,
    contexts: ["selection"],
  });

  menuItems.forEach((item) => {
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
      browser.tabs.sendMessage(tab.id, {
        action: `${ACTION_NAME_PREFIX}-enhanceText`,
        text: info.selectionText,
        instruction: menuItem.instruction,
        enhancementType: menuItem.id,
      } as Message);
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

    const validatedMessage = data;

    if (validatedMessage.action === `${ACTION_NAME_PREFIX}-callAiApi` && sender.tab?.id) {
      if (debounceTimeout) clearTimeout(debounceTimeout);
      debounceTimeout = setTimeout(() => {
        abortController?.abort();
        abortController = new AbortController();
        const tabId = sender.tab?.id;
        if (!tabId) return;

        const promise = callAiApi(
          validatedMessage.text,
          validatedMessage.instruction,
          abortController.signal
        );
        promise
          .then((result) => {
            browser.tabs.sendMessage(tabId, {
              action: `${ACTION_NAME_PREFIX}-replaceText`,
              result: result,
              originalText: validatedMessage.text,
              enhancementType: validatedMessage.enhancementType,
            } as Message);
          })
          .catch((error) => {
            if (error instanceof DOMException && error.name === "AbortError") return;

            browser.tabs.sendMessage(tabId, {
              action: `${ACTION_NAME_PREFIX}-modal-showError`,
              error: error.message,
            });
          });
      }, 300);
    }
  } catch (error) {
    console.error("Invalid message received:", error);
  }
  return true;
});
