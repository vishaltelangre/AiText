export const UNIQUE_PREFIX = "ait";

export const STORAGE_KEYS = {
  CUSTOM_CONTEXT_MENU_ITEMS: `${UNIQUE_PREFIX}-customContextMenuItems`,
  GEMINI_API_KEY: `${UNIQUE_PREFIX}-geminiApiKey`,
} as const;

export const MODAL_EVENT_NAME = `${UNIQUE_PREFIX}-modal-event`;

export const ACTIONS = {
  PROCESS_TEXT: `${UNIQUE_PREFIX}-processText`,
  CALL_AI_API: `${UNIQUE_PREFIX}-callAiApi`,
  SHOW_PROCESSED_TEXT: `${UNIQUE_PREFIX}-showProcessedText`,
  OPEN_SETTINGS_PAGE: `${UNIQUE_PREFIX}-openSettingsPage`,
  MODAL_SHOW_LOADING: `${UNIQUE_PREFIX}-modal-showLoading`,
  MODAL_SHOW_PROCESSED_TEXT: `${UNIQUE_PREFIX}-modal-showProcessedText`,
  MODAL_SHOW_ERROR: `${UNIQUE_PREFIX}-modal-showError`,
  MODAL_CLOSE: `${UNIQUE_PREFIX}-modal-close`,
} as const;

export const DEFAULT_INSTRUCTION_TYPES = [
  "fixGrammar",
  "rephrase",
  "formalize",
  "simplify",
  "summarize",
] as const;

export type DefaultInstructionType = (typeof DEFAULT_INSTRUCTION_TYPES)[number];

export const DEFAULT_CONTEXT_MENU_ITEMS = [
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
  {
    id: "explain",
    title: "Explain",
    instruction: "Explain the given text in a way that is easy to understand.",
  },
  {
    id: "define",
    title: "Define",
    instruction:
      "Define the given word or phrase. Only provide pronunciation, concise definition, and simple examples.",
  },
] as const;
