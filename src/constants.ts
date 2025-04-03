export const UNIQUE_PREFIX = "ait";

export const MODAL_EVENT_NAME = `${UNIQUE_PREFIX}-modal-event`;

export const ACTIONS = {
  ENHANCE_TEXT: `${UNIQUE_PREFIX}-enhanceText`,
  CALL_AI_API: `${UNIQUE_PREFIX}-callAiApi`,
  REPLACE_TEXT: `${UNIQUE_PREFIX}-replaceText`,
  SHOW_ERROR: `${UNIQUE_PREFIX}-showError`,
  MODAL_SHOW_ERROR: `${UNIQUE_PREFIX}-modal-showError`,
  MODAL_SHOW_LOADING: `${UNIQUE_PREFIX}-modal-showLoading`,
  MODAL_SHOW_RESULT: `${UNIQUE_PREFIX}-modal-showResult`,
  MODAL_CLOSE: `${UNIQUE_PREFIX}-modal-close`,
} as const;

export const ENHANCEMENT_TYPES = [
  "fixGrammar",
  "rephraseSentence",
  "formalize",
  "simplify",
  "summarize",
] as const;

export type EnhancementType = (typeof ENHANCEMENT_TYPES)[number];
