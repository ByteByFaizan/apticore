/* ═══════════════════════════════════════════════
   AI Provider — Gemini 2.5 Pro / Flash
   Google Generative AI via @google/generative-ai
   Pro for accuracy-critical tasks (parsing, JD)
   Flash for speed tasks (explanations)
   ═══════════════════════════════════════════════ */

import type { AICompletionOptions, AICompletionResult } from "../types";
import { logger } from "../logger";

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

// ── Retry Config ──
const MAX_RETRIES = 3;
const BASE_DELAY_MS = 1000; // 1s, 2s, 4s exponential backoff
const RETRYABLE_CODES = new Set([429, 503, 500, 408]);

/**
 * Exponential backoff retry wrapper for AI API calls.
 * Retries on rate limits (429), server errors (500/503), and timeouts (408).
 */
async function withRetry<T>(
  fn: () => Promise<T>,
  context: string,
  maxRetries = MAX_RETRIES
): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn();
    } catch (err: unknown) {
      lastError = err instanceof Error ? err : new Error(String(err));

      // Check if error is retryable
      const statusCode = extractStatusCode(err);
      const isRetryable = statusCode ? RETRYABLE_CODES.has(statusCode) : isTransientError(err);

      if (!isRetryable || attempt === maxRetries) {
        logger.error(`[AI] ${context} failed after ${attempt + 1} attempt(s)`, {
          error: lastError.message,
          statusCode,
          attempts: attempt + 1,
        });
        throw lastError;
      }

      // Exponential backoff with jitter
      const delay = BASE_DELAY_MS * Math.pow(2, attempt) + Math.random() * 500;
      logger.warn(`[AI] ${context} retrying (attempt ${attempt + 2}/${maxRetries + 1})`, {
        error: lastError.message,
        statusCode,
        delayMs: Math.round(delay),
      });

      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error(`${context} failed after ${maxRetries + 1} attempts`);
}

/**
 * Extract HTTP status code from various error shapes.
 */
function extractStatusCode(err: unknown): number | null {
  if (!err || typeof err !== "object") return null;
  const e = err as Record<string, unknown>;
  // Google AI SDK errors
  if (typeof e.status === "number") return e.status;
  if (typeof e.httpStatusCode === "number") return e.httpStatusCode;
  // Nested error
  if (e.error && typeof e.error === "object") {
    const inner = e.error as Record<string, unknown>;
    if (typeof inner.code === "number") return inner.code;
  }
  // Check message for status codes
  const msg = e.message || e.toString?.();
  if (typeof msg === "string") {
    const match = msg.match(/(\b429\b|\b503\b|\b500\b|\b408\b)/);
    if (match) return parseInt(match[1], 10);
  }
  return null;
}

/**
 * Check if error is transient (network issues, timeouts).
 */
function isTransientError(err: unknown): boolean {
  if (!err || typeof err !== "object") return false;
  const msg = (err as Error).message?.toLowerCase() || "";
  return (
    msg.includes("timeout") ||
    msg.includes("econnreset") ||
    msg.includes("econnrefused") ||
    msg.includes("socket hang up") ||
    msg.includes("network") ||
    msg.includes("fetch failed") ||
    msg.includes("aborted")
  );
}

// ── Gemini Provider ──
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type GenAIModule = any;

class GeminiProvider implements IAIProvider {
  private apiKey: string;
  // [js-cache-function-results] Cache SDK + model instances across calls
  private genAIInstance: GenAIModule | null = null;
  private sdkModule: GenAIModule | null = null;

  constructor() {
    this.apiKey = process.env.GOOGLE_GEMINI_API_KEY || "";
    if (!this.apiKey) {
      throw new Error("GOOGLE_GEMINI_API_KEY is required. Set it in .env.local");
    }
  }

  private async getSDK(): Promise<GenAIModule> {
    if (!this.sdkModule) {
      this.sdkModule = await import("@google/generative-ai");
    }
    if (!this.genAIInstance) {
      this.genAIInstance = new this.sdkModule.GoogleGenerativeAI(this.apiKey);
    }
    return this.genAIInstance;
  }

  async complete(options: AICompletionOptions): Promise<AICompletionResult> {
    return withRetry(async () => {
      const genAI = await this.getSDK();
      const selectedModel = options.model ?? "gemini-2.5-pro";
      const model = genAI.getGenerativeModel({
        model: selectedModel,
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
    }, "complete");
  }

  // [async-parallel] Parallelize embedding calls with retry
  async generateEmbeddings(texts: string[]): Promise<number[][]> {
    return withRetry(async () => {
      const genAI = await this.getSDK();
      // Fix 6: Upgraded from gemini-embedding-001 to text-embedding-004
      const model = genAI.getGenerativeModel({ model: "text-embedding-004" });

      const results = await Promise.all(
        texts.map(async (text) => {
          const result = await model.embedContent(text);
          return result.embedding.values;
        })
      );

      return results;
    }, "generateEmbeddings");
  }
}
