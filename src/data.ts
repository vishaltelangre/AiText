import { GeminiApiErrorSchema, GeminiApiResponseSchema } from "@/schemas";
import { STORAGE_KEYS } from "@/constants";
import { getStorageData } from "@/utils";

export async function callAiApi(
  text: string,
  instruction: string,
  signal?: AbortSignal
): Promise<string> {
  return callGeminiApi(text, instruction, undefined, signal);
}

export async function callGeminiApi(
  text: string,
  instruction: string,
  apiKey?: string,
  signal?: AbortSignal
): Promise<string> {
  if (!apiKey) {
    const { success, data, error } = await getStorageData([STORAGE_KEYS.GEMINI_API_KEY]);
    if (!success) throw new Error(error.message);
    apiKey = data[STORAGE_KEYS.GEMINI_API_KEY];
  }

  if (!apiKey) throw new Error("API key not set");

  const modelId = "gemini-2.0-flash-lite";
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`;

  const requestBody = {
    contents: [{ role: "user", parts: [{ text }] }],
    systemInstruction: { parts: [{ text: instruction }] },
    generationConfig: { temperature: 0.7, responseMimeType: "text/plain" },
  };

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(requestBody),
    signal,
  });

  if (!response.ok) {
    const { success, data, error } = GeminiApiErrorSchema.safeParse(await response.json());
    if (!success) throw new Error(`API Error: ${error.message}`);
    throw new Error(`API Error: ${data.error?.message || response.statusText}`);
  }

  const { success, data, error } = GeminiApiResponseSchema.safeParse(await response.json());
  if (!success) throw new Error(`API Error: ${error.message}`);
  return data.candidates[0].content.parts[0].text;
}
