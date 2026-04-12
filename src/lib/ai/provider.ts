/* ═══════════════════════════════════════════════
   AI Provider — Gemini 2.5 Pro
   Google Generative AI via @google/generative-ai
   ═══════════════════════════════════════════════ */

import type { AICompletionOptions, AICompletionResult } from "../types";

// ── Provider Interface ──
export interface IAIProvider {
  complete(options: AICompletionOptions): Promise<AICompletionResult>;
  generateEmbeddings(texts: string[]): Promise<number[][]>;
}

// ── Singleton ──
let cachedProvider: IAIProvider | null = null;

export function getAIProvider(): IAIProvider {
  if (cachedProvider) return cachedProvider;
  cachedProvider = new GeminiProvider();
  return cachedProvider;
}

// ── Gemini Provider ──
class GeminiProvider implements IAIProvider {
  private apiKey: string;

  constructor() {
    this.apiKey = process.env.GOOGLE_GEMINI_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("GOOGLE_GEMINI_API_KEY is required. Set it in .env.local");
    }
  }

  async complete(options: AICompletionOptions): Promise<AICompletionResult> {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({
      model: "gemini-2.5-pro",
      generationConfig: {
        temperature: options.temperature ?? 0.3,
        maxOutputTokens: options.maxTokens ?? 4096,
        responseMimeType: options.jsonMode ? "application/json" : "text/plain",
      },
    });

    // Convert messages to Gemini format
    const systemInstruction = options.messages
      .filter((m) => m.role === "system")
      .map((m) => m.content)
      .join("\n");

    const history = options.messages
      .filter((m) => m.role !== "system")
      .slice(0, -1)
      .map((m) => ({
        role: m.role === "assistant" ? ("model" as const) : ("user" as const),
        parts: [{ text: m.content }],
      }));

    const lastMessage = options.messages[options.messages.length - 1];

    const chat = model.startChat({
      history,
      ...(systemInstruction ? { systemInstruction } : {}),
    });

    const result = await chat.sendMessage(lastMessage.content);
    const response = result.response;

    return {
      content: response.text(),
      usage: response.usageMetadata
        ? {
            promptTokens: response.usageMetadata.promptTokenCount || 0,
            completionTokens: response.usageMetadata.candidatesTokenCount || 0,
            totalTokens: response.usageMetadata.totalTokenCount || 0,
          }
        : undefined,
    };
  }

  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    const { GoogleGenerativeAI } = await import("@google/generative-ai");
    const genAI = new GoogleGenerativeAI(this.apiKey);
    const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

    const results: number[][] = [];
    for (const text of texts) {
      const result = await model.embedContent(text);
      results.push(result.embedding.values);
    }

    return results;
  }
}
