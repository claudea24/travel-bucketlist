"use client";

import { useState } from "react";
import { useBucketList } from "@/context/BucketListContext";
import { useTravelPlans } from "@/context/TravelPlanContext";
import { BucketListItem } from "@/lib/types";
import StatusBadge from "@/components/shared/StatusBadge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import TravelPlanCard from "./TravelPlanCard";
import Link from "next/link";

const FILTERS = [
  { value: "all", label: "All" },
  { value: "want_to_visit", label: "Want to Visit" },
  { value: "planning", label: "Planning" },
  { value: "visited", label: "Visited" },
] as const;

export default function PersonalDashboard() {
  const { items, isLoading, dispatch } = useBucketList();
  const { plans, dispatch: planDispatch } = useTravelPlans();
  const [filter, setFilter] = useState("all");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState("");

  const filtered = filter === "all" ? items : items.filter((i) => i.status === filter);

  const counts = {
    want_to_visit: items.filter((i) => i.status === "want_to_visit").length,
    planning: items.filter((i) => i.status === "planning").length,
    visited: items.filter((i) => i.status === "visited").length,
  };

  const handleStatusChange = (item: BucketListItem, newStatus: BucketListItem["status"]) => {
    dispatch({ type: "UPDATE_ITEM", payload: { id: item.id, status: newStatus } });
  };

  const handleSaveNotes = (id: string) => {
    dispatch({ type: "UPDATE_ITEM", payload: { id, notes: notesText } });
    setEditingNotes(null);
  };

  const handleRemove = (id: string) => {
    dispatch({ type: "REMOVE_ITEM", payload: { id } });
  };

  const handleCreatePlan = (item: BucketListItem) => {
    const plan = {
      id: crypto.randomUUID(),
      userId: "",
      bucketListItemId: item.id,
      countryCode: item.countryCode,
      countryName: item.countryName,
      title: `Trip to ${item.countryName}`,
      startDate: null,
      endDate: null,
      budgetAmount: null,
      budgetCurrency: "USD",
      status: "draft" as const,
      notes: null,
      summary: null,
      tips: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    planDispatch({ type: "ADD_PLAN", payload: plan });
    if (item.status === "want_to_visit") {
      dispatch({ type: "UPDATE_ITEM", payload: { id: item.id, status: "planning" } });
    }
  };

  if (isLoading) return <LoadingSpinner message="Loading your trips..." />;

  return (
    <div className="space-y-8">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Want to Visit", count: counts.want_to_visit, color: "bg-teal-50 text-teal-700" },
          { label: "Planning", count: counts.planning, color: "bg-amber-50 text-amber-700" },
          { label: "Visited", count: counts.visited, color: "bg-blue-50 text-blue-700" },
          { label: "Total", count: items.length, color: "bg-gray-50 text-gray-700" },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} rounded-2xl p-4 text-center`}>
            <p className="text-2xl font-bold">{stat.count}</p>
            <p className="text-xs font-medium opacity-70">{stat.label}</p>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
              filter === f.value
                ? "bg-white text-gray-900 shadow-sm"
                : "text-gray-500 hover:text-gray-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Travel Plans Section */}
      {plans.length > 0 && (
        <div>
          <h2 className="text-lg font-semibold text-gray-900 mb-3">Active Plans</h2>
          <div className="grid gap-3">
            {plans.filter((p) => p.status !== "completed" && p.status !== "cancelled").map((plan) => (
              <TravelPlanCard key={plan.id} plan={plan} />
            ))}
          </div>
        </div>
      )}

      {/* Bucket List */}
      {filtered.length === 0 ? (
        <EmptyState
          icon="✈️"
          title="No destinations yet"
          description="Start exploring and save destinations you want to visit!"
          actionLabel="Discover Destinations"
          actionHref="/"
        />
      ) : (
        <div className="space-y-3">
          {filtered.map((item) => (
            <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
              <div className="p-4 flex items-start gap-4">
                {/* Flag */}
                {item.flagUrl && (
                  <img
                    src={item.flagUrl}
                    alt={item.countryName}
                    className="w-14 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0"
                  />
                )}

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Link
                      href={`/country/${item.countryCode}`}
                      className="font-semibold text-gray-900 hover:text-teal-600 transition-colors truncate"
                    >
                      {item.countryName}
                    </Link>
                    <StatusBadge status={item.status} />
                  </div>

                  {item.capital && (
                    <p className="text-sm text-gray-500">{item.capital}</p>
                  )}

                  {/* Status selector */}
                  <div className="flex gap-1.5 mt-2">
                    {(["want_to_visit", "planning", "visited"] as const).map((s) => (
                      <button
                        key={s}
                        onClick={() => handleStatusChange(item, s)}
                        className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                          item.status === s
                            ? s === "want_to_visit"
                              ? "bg-teal-500 text-white"
                              : s === "planning"
                              ? "bg-amber-500 text-white"
                              : "bg-blue-500 text-white"
                            : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                        }`}
                      >
                        {s === "want_to_visit" ? "Want to Visit" : s === "planning" ? "Planning" : "Visited"}
                      </button>
                    ))}
                  </div>

                  {/* Notes */}
                  <div className="mt-3">
                    {editingNotes === item.id ? (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          value={notesText}
                          onChange={(e) => setNotesText(e.target.value)}
                          className="flex-1 text-sm px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                          placeholder="Add notes..."
                          autoFocus
                        />
                        <button
                          onClick={() => handleSaveNotes(item.id)}
                          className="text-xs px-3 py-1.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => setEditingNotes(null)}
                          className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingNotes(item.id); setNotesText(item.notes || ""); }}
                        className="text-sm text-gray-400 hover:text-gray-600 transition-colors"
                      >
                        {item.notes || "Add notes..."}
                      </button>
                    )}
                  </div>
                </div>

                {/* Actions */}
                <div className="flex flex-col gap-2 flex-shrink-0">
                  {!plans.some((p) => p.bucketListItemId === item.id) && (
                    <button
                      onClick={() => handleCreatePlan(item)}
                      className="text-xs px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100 transition-colors whitespace-nowrap"
                    >
                      Plan Trip
                    </button>
                  )}
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-xs px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100 transition-colors"
                  >
                    Remove
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
