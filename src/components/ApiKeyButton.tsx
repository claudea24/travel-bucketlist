"use client";

import { useEffect, useState } from "react";
import { getUserApiKey, setUserApiKey, KEY_CHANGED_EVENT } from "@/lib/userApiKey";

export default function ApiKeyButton() {
  const [open, setOpen] = useState(false);
  const [hasKey, setHasKey] = useState(false);
  const [draft, setDraft] = useState("");

  useEffect(() => {
    const sync = () => setHasKey(!!getUserApiKey());
    sync();
    window.addEventListener(KEY_CHANGED_EVENT, sync);
    return () => window.removeEventListener(KEY_CHANGED_EVENT, sync);
  }, []);

  const save = () => {
    setUserApiKey(draft);
    setDraft("");
    setOpen(false);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        className="text-sm font-medium px-3 py-2 rounded-xl text-gray-600 hover:bg-gray-50 flex items-center gap-1.5"
        aria-expanded={open}
      >
        🔑 AI key
        <span className={`w-2 h-2 rounded-full ${hasKey ? "bg-teal-500" : "bg-gray-300"}`} />
      </button>
      {open && (
        <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-100 rounded-2xl shadow-lg p-4 z-50">
          <p className="text-sm font-semibold text-gray-900 mb-1">Use your own OpenAI API key</p>
          <p className="text-xs text-gray-500 mb-3">
            Powers the AI trip planner and activity suggestions (gpt-4o-mini, usually under a cent per request).
            It is saved only in this browser and sent with your AI requests. It is never stored on our servers.
            Get one at{" "}
            <a href="https://platform.openai.com/api-keys" target="_blank" rel="noopener noreferrer" className="text-teal-600 underline">
              platform.openai.com/api-keys
            </a>.
          </p>
          <input
            type="password"
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && draft.trim() && save()}
            placeholder={hasKey ? "Key saved. Paste a new one to replace it" : "sk-..."}
            className="w-full text-sm border border-gray-200 rounded-xl px-3 py-2 mb-3 focus:outline-none focus:ring-2 focus:ring-teal-200"
            autoComplete="off"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={!draft.trim()}
              className="flex-1 text-sm font-medium bg-teal-600 text-white rounded-xl py-2 disabled:opacity-40"
            >
              Save key
            </button>
            {hasKey && (
              <button
                onClick={() => { setUserApiKey(""); setOpen(false); }}
                className="text-sm font-medium text-rose-600 border border-rose-100 rounded-xl px-3 py-2"
              >
                Remove
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
