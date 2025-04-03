import { z } from "zod";

export const StorageDataSchema = z.object({
  geminiApiKey: z.string().optional(),
});

export type StorageData = z.infer<typeof StorageDataSchema>;
export const ACTION_NAME_PREFIX = "ait";

const enhancementTypes = [
  "fixGrammar",
  "rephraseSentence",
  "formalize",
  "simplify",
  "summarize",
] as const;
export type EnhancementType = (typeof enhancementTypes)[number];
export const EnhancementTypeSchema = z.enum(enhancementTypes);

export const MessageSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal(`${ACTION_NAME_PREFIX}-enhanceText`),
    text: z.string(),
    instruction: z.string(),
    enhancementType: EnhancementTypeSchema,
  }),
  z.object({
    action: z.literal(`${ACTION_NAME_PREFIX}-callAiApi`),
    text: z.string(),
    instruction: z.string(),
    enhancementType: EnhancementTypeSchema,
  }),
  z.object({
    action: z.literal(`${ACTION_NAME_PREFIX}-replaceText`),
    originalText: z.string(),
    result: z.string(),
    enhancementType: EnhancementTypeSchema,
  }),
  z.object({
    action: z.literal(`${ACTION_NAME_PREFIX}-showError`),
    error: z.string().optional(),
  }),
  z.object({
    action: z.literal(`${ACTION_NAME_PREFIX}-modal-showError`),
    error: z.string().optional(),
  }),
  z.object({
    action: z.literal(`${ACTION_NAME_PREFIX}-modal-showLoading`),
    enhancementType: EnhancementTypeSchema,
  }),
  z.object({
    action: z.literal(`${ACTION_NAME_PREFIX}-modal-showResult`),
    enhancementType: EnhancementTypeSchema,
    originalText: z.string(),
    enhancedText: z.string(),
    onReplace: z.function().optional(),
  }),
  z.object({
    action: z.literal(`${ACTION_NAME_PREFIX}-modal-close`),
  }),
]);

export type Message = z.infer<typeof MessageSchema>;

export const GeminiApiErrorSchema = z.object({
  error: z
    .object({
      message: z.string(),
    })
    .optional(),
});

export type GeminiApiError = z.infer<typeof GeminiApiErrorSchema>;

export const GeminiApiResponseSchema = z.object({
  candidates: z.array(
    z.object({
      content: z.object({
        parts: z.array(z.object({ text: z.string() })),
      }),
    })
  ),
});

export type GeminiApiResponse = z.infer<typeof GeminiApiResponseSchema>;
