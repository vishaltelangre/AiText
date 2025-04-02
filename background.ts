import {
  type Message,
  ACTION_NAME_PREFIX,
  MessageSchema,
  GeminiApiErrorSchema,
  GeminiApiResponseSchema,
  EnhancementType,
} from "@/schemas";

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
      const message: Message = {
        action: `${ACTION_NAME_PREFIX}-enhanceText`,
        text: info.selectionText,
        instruction: menuItem.instruction,
        enhancementType: menuItem.id,
      };
      browser.tabs.sendMessage(tab.id, message);
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
      // Clear any existing debounce timeout
      if (debounceTimeout) {
        clearTimeout(debounceTimeout);
      }

      // Set a new debounce timeout
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
            if (error.name === "AbortError") {
              // Ignore abort errors
              return;
            }
            browser.tabs.sendMessage(tabId, {
              action: `${ACTION_NAME_PREFIX}-modal-showError`,
              error: error.message,
            });
          });
      }, 300); // 300ms debounce
    }
  } catch (error) {
    console.error("Invalid message received:", error);
  }
  return true;
});

function callAiApi(text: string, instruction: string, signal?: AbortSignal): Promise<string> {
  return callGeminiApi(text, instruction, undefined, signal);
}

export async function callGeminiApi(
  text: string,
  instruction: string,
  apiKey?: string,
  signal?: AbortSignal
): Promise<string> {
  if (!apiKey) {
    const data = await browser.storage.sync.get("geminiApiKey");
    apiKey = data.geminiApiKey;
  }

  if (!apiKey) throw new Error("API key not set");

  const modelId = "gemini-2.0-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{ role: "user", parts: [{ text }] }],
    systemInstruction: { parts: [{ text: instruction }] },
    generationConfig: { temperature: 0.7, responseMimeType: "text/plain" },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal,
  });

  if (!response.ok) {
    const { success, data, error } = GeminiApiErrorSchema.safeParse(await response.json());
    if (!success) throw new Error(`API Error: ${error.message}`);
    throw new Error(`API Error: ${data.error?.message || response.statusText}`);
  }

  const { success, data, error } = GeminiApiResponseSchema.safeParse(await response.json());
  if (!success) throw new Error(`API Error: ${error.message}`);
  return data.candidates[0].content.parts[0].text;
}
