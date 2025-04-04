import { z } from "zod";
import { ACTIONS, DEFAULT_INSTRUCTION_TYPES, STORAGE_KEYS } from "@/constants";

export type DefaultInstructionType = (typeof DEFAULT_INSTRUCTION_TYPES)[number];
export type CustomInstructionType = string;
export type InstructionType = DefaultInstructionType | CustomInstructionType;

export type CustomContextMenuItem = {
  id: string;
  title: string;
  instruction: string;
};

export const CustomContextMenuItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  instruction: z.string(),
});

export const CustomContextMenuItemsSchema = z.array(CustomContextMenuItemSchema);

export const StorageDataSchema = z.object({
  [STORAGE_KEYS.GEMINI_API_KEY]: z.string().optional(),
  [STORAGE_KEYS.CUSTOM_CONTEXT_MENU_ITEMS]: CustomContextMenuItemsSchema.optional(),
});

export type StorageData = z.infer<typeof StorageDataSchema>;

// Allow both default and custom instruction types
export const InstructionTypeSchema = z.string();

export const MessageSchema = z.discriminatedUnion("action", [
  z.object({
    action: z.literal(ACTIONS.PROCESS_TEXT),
    text: z.string(),
    instruction: z.string(),
    operation: z.string(),
    instructionType: InstructionTypeSchema,
  }),
  z.object({
    action: z.literal(ACTIONS.CALL_AI_API),
    text: z.string(),
    instruction: z.string(),
    operation: z.string(),
    instructionType: InstructionTypeSchema,
  }),
  z.object({
    action: z.literal(ACTIONS.SHOW_PROCESSED_TEXT),
    operation: z.string(),
    originalText: z.string(),
    result: z.string(),
    instructionType: InstructionTypeSchema,
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
    operation: z.string(),
    instructionType: InstructionTypeSchema,
  }),
  z.object({
    action: z.literal(ACTIONS.MODAL_SHOW_PROCESSED_TEXT),
    operation: z.string(),
    instructionType: InstructionTypeSchema,
    originalText: z.string(),
    result: z.string(),
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
