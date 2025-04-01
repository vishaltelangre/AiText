// Initialize and manage context menu items
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
];

// Create context menu when extension is installed
browser.runtime.onInstalled.addListener(() => {
  // Create parent menu item
  browser.contextMenus.create({
    id: "ai-text",
    title: "AiText",
    contexts: ["selection"]
  });

  // Create child menu items
  menuItems.forEach((item) => {
    browser.contextMenus.create({
      id: item.id,
      parentId: "ai-text",
      title: item.title,
      contexts: ["selection"],
    });
  });
});

// Listen for context menu clicks
browser.contextMenus.onClicked.addListener((info, tab) => {
  if (info.selectionText) {
    const menuItem = menuItems.find(item => item.id === info.menuItemId);

    if (menuItem) {
      // Send message to content script with the selected text and instruction
      browser.tabs.sendMessage(tab.id, {
        action: "enhanceText",
        text: info.selectionText,
        instruction: menuItem.instruction,
        enhancementType: menuItem.id
      });
    }
  }
});

// Listen for messages from content script
browser.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "callAiApi") {
    callAiApi(message.text, message.instruction)
      .then(result => {
        browser.tabs.sendMessage(sender.tab.id, {
          action: "replaceText",
          result: result,
          originalText: message.text
        });
      })
      .catch(error => {
        browser.tabs.sendMessage(sender.tab.id, {
          action: "showError",
          error: error.message
        });
      });
  }
  return true;
});


function callAiApi(text, instruction) {
  return callGeminiApi(text, instruction);
}

async function callGeminiApi(text, instruction) {
  const data = await browser.storage.sync.get("geminiApiKey");
  const apiKey = data.geminiApiKey;

  if (!apiKey) {
    throw new Error("Gemini API key not set. Please configure it in the extension options.");
  }

  const modelId = "gemini-2.0-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [
      {
        role: "user",
        parts: [
          {
            text: text
          }
        ]
      }
    ],
    systemInstruction: {
      parts: [
        {
          text: instruction
        }
      ]
    },
    generationConfig: {
      temperature: 0.7,
      responseMimeType: "text/plain"
    }
  };

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(requestBody)
  });

  if (!response.ok) {
    const errorData = await response.json();
    throw new Error(`API Error: ${errorData.error?.message || response.statusText}`);
  }

  const responseData = await response.json();
  return responseData.candidates[0].content.parts[0].text;
}
