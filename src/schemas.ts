import { z } from "zod";
import { ACTIONS, ENHANCEMENT_TYPES } from "@/constants";

export const StorageDataSchema = z.object({
  geminiApiKey: z.string().optional(),
});

export type StorageData = z.infer<typeof StorageDataSchema>;

export const EnhancementTypeSchema = z.enum(ENHANCEMENT_TYPES);

export const MessageSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal(ACTIONS.ENHANCE_TEXT),
    text: z.string(),
    instruction: z.string(),
    enhancementType: EnhancementTypeSchema,
  }),
  z.object({
    action: z.literal(ACTIONS.CALL_AI_API),
    text: z.string(),
    instruction: z.string(),
    enhancementType: EnhancementTypeSchema,
  }),
  z.object({
    action: z.literal(ACTIONS.SHOW_ENHANCED_TEXT),
    originalText: z.string(),
    result: z.string(),
    enhancementType: EnhancementTypeSchema,
  }),
  z.object({
    action: z.literal(ACTIONS.OPEN_SETTINGS_PAGE),
  }),
  z.object({
    action: z.literal(ACTIONS.MODAL_SHOW_ERROR),
    error: z.string().optional(),
  }),
  z.object({
    action: z.literal(ACTIONS.MODAL_SHOW_LOADING),
    enhancementType: EnhancementTypeSchema,
  }),
  z.object({
    action: z.literal(ACTIONS.MODAL_SHOW_ENHANCED_TEXT),
    enhancementType: EnhancementTypeSchema,
    originalText: z.string(),
    enhancedText: z.string(),
    onReplace: z.function().optional(),
  }),
  z.object({
    action: z.literal(ACTIONS.MODAL_CLOSE),
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
