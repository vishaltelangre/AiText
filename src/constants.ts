import { AiProvidersConfigs } from "@/schemas";

export const UNIQUE_PREFIX = "ait";

export const STORAGE_KEYS = {
  CUSTOM_CONTEXT_MENU_ITEMS: `${UNIQUE_PREFIX}-customContextMenuItems`,
  AI_PROVIDERS_CONFIGS: `${UNIQUE_PREFIX}-aiProvidersConfigs`,
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
  "explain",
  "define",
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

export const DEFAULT_AI_PROVIDERS_CONFIGS = {
  activeProvider: "gemini" as const,
  providers: {
    gemini: {
      type: "gemini",
      name: "Google Gemini",
      apiKey: "",
      baseUrl: "https://generativelanguage.googleapis.com/v1beta",
      getApiKeyUrl: "https://aistudio.google.com/app/apikey",
      model: "gemini-2.0-flash-lite",
    },
    openai: {
      type: "openai",
      name: "OpenAI",
      apiKey: "",
      baseUrl: "https://api.openai.com/v1",
      getApiKeyUrl: "https://platform.openai.com/api-keys",
      model: "gpt-4o-mini",
    },
    anthropic: {
      type: "anthropic",
      name: "Anthropic",
      apiKey: "",
      baseUrl: "https://api.anthropic.com/v1",
      getApiKeyUrl: "https://console.anthropic.com/settings/keys",
      model: "claude-3-haiku-20240307",
    },
    deepseek: {
      type: "deepseek",
      name: "DeepSeek",
      apiKey: "",
      baseUrl: "https://api.deepseek.com/v1",
      getApiKeyUrl: "https://platform.deepseek.com/api_keys",
      model: "deepseek-chat",
    },
  },
} satisfies AiProvidersConfigs;
