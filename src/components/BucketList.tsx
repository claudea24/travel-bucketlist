"use client";

import { useState } from "react";
import Link from "next/link";
import { useBucketList } from "@/context/BucketListContext";
import { BucketListItem } from "@/lib/types";

export default function BucketList() {
  const { items, isLoading, dispatch } = useBucketList();
  const [filter, setFilter] = useState<"all" | "want_to_visit" | "visited">("all");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesValue, setNotesValue] = useState("");

  const filtered = items.filter((item) => {
    if (filter === "all") return true;
    return item.status === filter;
  });

  const wantCount = items.filter((i) => i.status === "want_to_visit").length;
  const visitedCount = items.filter((i) => i.status === "visited").length;

  function toggleStatus(item: BucketListItem) {
    dispatch({
      type: "UPDATE_ITEM",
      payload: {
        id: item.id,
        status: item.status === "want_to_visit" ? "visited" : "want_to_visit",
      },
    });
  }

  function startEditNotes(item: BucketListItem) {
    setEditingNotes(item.id);
    setNotesValue(item.notes || "");
  }

  function saveNotes(id: string) {
    dispatch({
      type: "UPDATE_ITEM",
      payload: { id, notes: notesValue },
    });
    setEditingNotes(null);
  }

  function removeItem(id: string) {
    dispatch({ type: "REMOVE_ITEM", payload: { id } });
  }

  if (isLoading) {
    return <div className="text-center py-12 text-gray-500">Loading your bucket list...</div>;
  }

  return (
    <div>
      {/* Stats */}
      <div className="flex gap-4 mb-6">
        <div className="bg-emerald-50 rounded-lg px-4 py-3 flex-1 text-center">
          <div className="text-2xl font-bold text-emerald-600">{wantCount}</div>
          <div className="text-sm text-emerald-700">Want to Visit</div>
        </div>
        <div className="bg-blue-50 rounded-lg px-4 py-3 flex-1 text-center">
          <div className="text-2xl font-bold text-blue-600">{visitedCount}</div>
          <div className="text-sm text-blue-700">Visited</div>
        </div>
        <div className="bg-gray-50 rounded-lg px-4 py-3 flex-1 text-center">
          <div className="text-2xl font-bold text-gray-600">{items.length}</div>
          <div className="text-sm text-gray-700">Total</div>
        </div>
      </div>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6">
        {(["all", "want_to_visit", "visited"] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {f === "all" ? "All" : f === "want_to_visit" ? "Want to Visit" : "Visited"}
          </button>
        ))}
      </div>

      {/* List */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-gray-500">
            {items.length === 0
              ? "Your bucket list is empty. Start exploring countries and save the ones you want to visit!"
              : "No countries match this filter."}
          </p>
          {items.length === 0 && (
            <Link
              href="/"
              className="inline-block mt-4 px-6 py-2.5 bg-emerald-600 text-white rounded-lg hover:bg-emerald-700 transition-colors text-sm font-medium"
            >
              Explore Countries
            </Link>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div
              key={item.id}
              className="border border-gray-200 rounded-lg p-4 bg-white flex items-start gap-4"
            >
              {/* Flag */}
              <Link href={`/country/${item.countryCode}`} className="shrink-0">
                {item.flagUrl ? (
                  <img
                    src={item.flagUrl}
                    alt={`${item.countryName} flag`}
                    className="w-16 h-11 object-cover rounded border border-gray-100"
                  />
                ) : (
                  <div className="w-16 h-11 bg-gray-100 rounded flex items-center justify-center text-xs text-gray-400">
                    {item.countryCode}
                  </div>
                )}
              </Link>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <Link
                    href={`/country/${item.countryCode}`}
                    className="font-semibold text-gray-900 hover:text-emerald-600 transition-colors"
                  >
                    {item.countryName}
                  </Link>
                  <button
                    onClick={() => toggleStatus(item)}
                    className={`text-xs px-2 py-0.5 rounded-full font-medium transition-colors cursor-pointer ${
                      item.status === "visited"
                        ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                        : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                    }`}
                  >
                    {item.status === "visited" ? "Visited" : "Want to Visit"}
                  </button>
                </div>
                <p className="text-sm text-gray-500 mt-0.5">
                  {item.capital && `${item.capital} · `}
                  {item.region}
                  {item.subregion && ` · ${item.subregion}`}
                </p>

                {/* Notes */}
                {editingNotes === item.id ? (
                  <div className="mt-2 flex gap-2">
                    <input
                      type="text"
                      value={notesValue}
                      onChange={(e) => setNotesValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && saveNotes(item.id)}
                      placeholder="Add a note..."
                      className="flex-1 px-3 py-1.5 border border-gray-300 rounded text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      autoFocus
                    />
                    <button
                      onClick={() => saveNotes(item.id)}
                      className="px-3 py-1.5 bg-emerald-600 text-white rounded text-sm hover:bg-emerald-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => setEditingNotes(null)}
                      className="px-3 py-1.5 bg-gray-100 text-gray-600 rounded text-sm hover:bg-gray-200"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => startEditNotes(item)}
                    className="mt-1 text-sm text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {item.notes || "Add a note..."}
                  </button>
                )}
              </div>

              {/* Remove button */}
              <button
                onClick={() => removeItem(item.id)}
                className="shrink-0 text-gray-300 hover:text-red-500 transition-colors"
                title="Remove from bucket list"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
