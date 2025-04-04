import {
  type AiProviderType,
  type AiProviderConfig,
  GeminiApiErrorResponseSchema,
  GeminiApiSuccessResponseSchema,
  OpenAiApiErrorResponseSchema,
  OpenAiApiSuccessResponseSchema,
  AnthropicApiSuccessResponseSchema,
  AnthropicApiErrorResponseSchema,
  DeepSeekApiErrorResponseSchema,
  DeepSeekApiSuccessResponseSchema,
} from "@/schemas";
interface AiProvider {
  callApi: (text: string, instruction: string, signal?: AbortSignal) => Promise<string>;
  testConnectivity: () => Promise<string>;
}

class GeminiProvider implements AiProvider {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: AiProviderConfig) {
    if (!config.apiKey) throw new Error("API key is required for Gemini");
    if (!config.model) throw new Error("Model is required for Gemini");
    if (!config.baseUrl) throw new Error("Base URL is required for Gemini");
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.baseUrl = config.baseUrl;
  }

  async callApi(text: string, instruction: string, signal?: AbortSignal): Promise<string> {
    const requestBody = {
      contents: [{ role: "user", parts: [{ text }] }],
      systemInstruction: { parts: [{ text: instruction }] },
      generationConfig: { temperature: 0.7, responseMimeType: "text/plain" },
    };
    const response = await fetch(
      `${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(requestBody),
        signal,
      }
    );

    if (!response.ok) {
      const { success, data, error } = GeminiApiErrorResponseSchema.safeParse(
        await response.json()
      );
      if (!success) throw new Error(`API Error: ${error.message}`);
      throw new Error(`API Error: ${data.error?.message || response.statusText}`);
    }

    const { success, data, error } = GeminiApiSuccessResponseSchema.safeParse(
      await response.json()
    );
    if (!success) throw new Error(`API Error: ${error.message}`);
    return data.candidates[0].content.parts[0].text;
  }

  testConnectivity() {
    return this.callApi("Test", "Test");
  }
}

class OpenAIProvider implements AiProvider {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: AiProviderConfig) {
    if (!config.apiKey) throw new Error("API key is required for OpenAI");
    if (!config.model) throw new Error("Model is required for OpenAI");
    if (!config.baseUrl) throw new Error("Base URL is required for OpenAI");
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.baseUrl = config.baseUrl;
  }

  async callApi(text: string, instruction: string, signal?: AbortSignal): Promise<string> {
    const requestBody = {
      model: this.model,
      messages: [
        { role: "system", content: instruction },
        { role: "user", content: text },
      ],
      stream: false,
      temperature: 0.7,
    };
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      const { success, data, error } = OpenAiApiErrorResponseSchema.safeParse(
        await response.json()
      );
      if (!success) throw new Error(`API Error: ${error.message}`);
      throw new Error(`API Error: ${data.error?.message || response.statusText}`);
    }

    const { success, data, error } = OpenAiApiSuccessResponseSchema.safeParse(
      await response.json()
    );
    if (!success) throw new Error(`API Error: ${error.message}`);
    return data.choices[0].message.content;
  }

  testConnectivity() {
    return this.callApi("Test", "Test");
  }
}

class AnthropicProvider implements AiProvider {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: AiProviderConfig) {
    if (!config.apiKey) throw new Error("API key is required for Anthropic");
    if (!config.model) throw new Error("Model is required for Anthropic");
    if (!config.baseUrl) throw new Error("Base URL is required for Anthropic");
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.baseUrl = config.baseUrl;
  }

  async callApi(text: string, instruction: string, signal?: AbortSignal): Promise<string> {
    const requestBody = {
      model: this.model,
      messages: [
        { role: "system", content: instruction },
        { role: "user", content: text },
      ],
      stream: false,
      temperature: 0.7,
    };
    const response = await fetch(`${this.baseUrl}/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": this.apiKey,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      const { success, data, error } = AnthropicApiErrorResponseSchema.safeParse(
        await response.json()
      );
      if (!success) throw new Error(`API Error: ${error.message}`);
      throw new Error(`API Error: ${data.error?.message || response.statusText}`);
    }

    const { success, data, error } = AnthropicApiSuccessResponseSchema.safeParse(
      await response.json()
    );
    if (!success) throw new Error(`API Error: ${error.message}`);
    return data.content[0].text;
  }

  testConnectivity() {
    return this.callApi("Test", "Test");
  }
}

class DeepSeekProvider implements AiProvider {
  private apiKey: string;
  private model: string;
  private baseUrl: string;

  constructor(config: AiProviderConfig) {
    if (!config.apiKey) throw new Error("API key is required for DeepSeek");
    if (!config.model) throw new Error("Model is required for DeepSeek");
    if (!config.baseUrl) throw new Error("Base URL is required for DeepSeek");
    this.apiKey = config.apiKey;
    this.model = config.model;
    this.baseUrl = config.baseUrl;
  }

  async callApi(text: string, instruction: string, signal?: AbortSignal): Promise<string> {
    const requestBody = {
      model: this.model,
      messages: [
        { role: "system", content: instruction },
        { role: "user", content: text },
      ],
      stream: false,
      temperature: 0.7,
    };
    const response = await fetch(`${this.baseUrl}/chat/completions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${this.apiKey}`,
      },
      body: JSON.stringify(requestBody),
      signal,
    });

    if (!response.ok) {
      const { success, data, error } = DeepSeekApiErrorResponseSchema.safeParse(
        await response.json()
      );
      if (!success) throw new Error(`API Error: ${error.message}`);
      throw new Error(`API Error: ${data.error?.message || response.statusText}`);
    }

    const { success, data, error } = DeepSeekApiSuccessResponseSchema.safeParse(
      await response.json()
    );
    if (!success) throw new Error(`API Error: ${error.message}`);
    return data.choices[0].message.content;
  }

  testConnectivity() {
    return this.callApi("Test", "Test");
  }
}

export function createAiProvider(type: AiProviderType, config: AiProviderConfig): AiProvider {
  switch (type) {
    case "gemini":
      return new GeminiProvider(config);
    case "openai":
      return new OpenAIProvider(config);
    case "anthropic":
      return new AnthropicProvider(config);
    case "deepseek":
      return new DeepSeekProvider(config);
    default:
      throw new Error(`Unknown provider type: ${type}`);
  }
}
