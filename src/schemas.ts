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

export const AiProviderTypeSchema = z.enum(["gemini", "openai", "anthropic", "deepseek"]);
export type AiProviderType = z.infer<typeof AiProviderTypeSchema>;

export const AiProviderConfigSchema = z.object({
  type: AiProviderTypeSchema,
  name: z.string(),
  apiKey: z.string(),
  model: z.string(),
  baseUrl: z.string(),
  getApiKeyUrl: z.string(),
});

export type AiProviderConfig = z.infer<typeof AiProviderConfigSchema>;

export const AiProvidersConfigsSchema = z.object({
  activeProvider: AiProviderTypeSchema,
  providers: z.record(AiProviderTypeSchema, AiProviderConfigSchema),
});

export type AiProvidersConfigs = z.infer<typeof AiProvidersConfigsSchema>;

export const StorageDataSchema = z.object({
  [STORAGE_KEYS.AI_PROVIDERS_CONFIGS]: AiProvidersConfigsSchema.optional(),
  [STORAGE_KEYS.CUSTOM_CONTEXT_MENU_ITEMS]: CustomContextMenuItemsSchema.optional(),
});

export type StorageData = z.infer<typeof StorageDataSchema>;

// Allow both default and custom instruction types
export const InstructionTypeSchema = z.string();

const messageCommonFieldsSchema = z.object({
  originalText: z.string(),
  instruction: z.string(),
  operation: z.string(),
  instructionType: InstructionTypeSchema,
});

export const MessageSchema = z.discriminatedUnion("action", [
  z.object({
    ...messageCommonFieldsSchema.shape,
    action: z.literal(ACTIONS.PROCESS_TEXT),
  }),
  z.object({
    ...messageCommonFieldsSchema.shape,
    action: z.literal(ACTIONS.RETRY_PROCESS_TEXT),
  }),
  z.object({
    ...messageCommonFieldsSchema.shape,
    action: z.literal(ACTIONS.CALL_AI_API),
  }),
  z.object({
    ...messageCommonFieldsSchema.shape,
    result: z.string(),
    action: z.literal(ACTIONS.SHOW_PROCESSED_TEXT),
  }),
  z.object({
    ...messageCommonFieldsSchema.shape,
    action: z.literal(ACTIONS.MODAL_SHOW_ERROR),
    error: z.string().optional(),
  }),
  z.object({
    ...messageCommonFieldsSchema.shape,
    action: z.literal(ACTIONS.MODAL_SHOW_LOADING),
  }),
  z.object({
    ...messageCommonFieldsSchema.shape,
    result: z.string(),
    action: z.literal(ACTIONS.MODAL_SHOW_PROCESSED_TEXT),
  }),
  z.object({
    action: z.literal(ACTIONS.MODAL_CLOSE),
  }),
  z.object({
    action: z.literal(ACTIONS.SWITCH_TO_CONTEXT_MENU_ITEMS_OPTIONS_TAB),
  }),
  z.object({
    action: z.literal(ACTIONS.OPEN_SETTINGS_PAGE),
  }),
]);

export type Message = z.infer<typeof MessageSchema>;

// Gemini API schemas
export const GeminiApiErrorResponseSchema = z.object({
  error: z
    .object({
      message: z.string(),
    })
    .optional(),
});
export const GeminiApiSuccessResponseSchema = z.object({
  candidates: z.array(
    z.object({
      content: z.object({
        parts: z.array(z.object({ text: z.string() })),
      }),
    })
  ),
});

// OpenAI API schemas
export const OpenAiApiErrorResponseSchema = z.object({
  error: z
    .object({
      message: z.string(),
    })
    .optional(),
});
export const OpenAiApiSuccessResponseSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string() }) })),
});

// Anthropic API schemas
export const AnthropicApiErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
  }),
});
export const AnthropicApiSuccessResponseSchema = z.object({
  content: z.array(z.object({ text: z.string() })),
});

// DeepSeek API schemas
export const DeepSeekApiErrorResponseSchema = z.object({
  error: z.object({
    message: z.string(),
  }),
});
export const DeepSeekApiSuccessResponseSchema = z.object({
  choices: z.array(z.object({ message: z.object({ content: z.string() }) })),
});
