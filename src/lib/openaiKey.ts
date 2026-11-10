import type { NextRequest } from "next/server";

/** Header the browser uses to pass a visitor's own OpenAI key. */
export const USER_KEY_HEADER = "x-openai-key";

/**
 * Prefer the visitor's own key (sent from their browser), and fall back to
 * the server key if one is configured. The key is only forwarded to OpenAI.
 * It is never logged or stored.
 */
export function resolveOpenAIKey(request: NextRequest): string | undefined {
  const userKey = request.headers.get(USER_KEY_HEADER)?.trim();
  if (userKey) return userKey;
  return process.env.OPENAI_API_KEY || undefined;
}

export const NO_KEY_MESSAGE =
  "Add your own OpenAI API key (🔑 AI key button, top right) to use the AI features.";
export const BAD_KEY_MESSAGE =
  "Your OpenAI API key was rejected. Update it with the 🔑 AI key button (top right).";
