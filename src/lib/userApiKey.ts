"use client";

/** The visitor's own OpenAI key, saved only in this browser's localStorage. */
const STORAGE_KEY = "wanderlust_openai_key";
export const KEY_CHANGED_EVENT = "wanderlust-openai-key-changed";

export function getUserApiKey(): string {
  if (typeof window === "undefined") return "";
  try {
    return localStorage.getItem(STORAGE_KEY) || "";
  } catch {
    return "";
  }
}

export function setUserApiKey(key: string) {
  try {
    if (key.trim()) localStorage.setItem(STORAGE_KEY, key.trim());
    else localStorage.removeItem(STORAGE_KEY);
  } catch {
    /* storage unavailable */
  }
  window.dispatchEvent(new Event(KEY_CHANGED_EVENT));
}

/** fetch() that attaches the visitor's OpenAI key (if any) for our AI routes. */
export function aiFetch(input: string, init: RequestInit = {}) {
  const headers = new Headers(init.headers);
  const key = getUserApiKey();
  if (key) headers.set("x-openai-key", key);
  return fetch(input, { ...init, headers });
}
