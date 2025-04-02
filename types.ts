export type EnhancementType =
  | "fixGrammar"
  | "rephraseSentence"
  | "formalize"
  | "simplify"
  | "summarize";

export type MenuItem = {
  id: EnhancementType;
  title: string;
  instruction: string;
};

export type ActionTitle = {
  action: string;
  loading: string;
};

export type Message = {
  action: "enhanceText" | "callAiApi" | "replaceText" | "showError";
  text?: string;
  instruction?: string;
  enhancementType?: EnhancementType;
  result?: string;
  originalText?: string;
  error?: string;
};

export type GeminiApiResponse = {
  candidates: Array<{
    content: {
      parts: Array<{
        text: string;
      }>;
    };
  }>;
};

export type GeminiApiError = {
  error?: {
    message: string;
  };
};

export type ButtonType = "save" | "test" | "both";

export type StorageData = {
  geminiApiKey?: string;
};
