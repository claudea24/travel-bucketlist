"use client";

import { useState } from "react";
import { useBucketList } from "@/context/BucketListContext";
import { useTravelPlans } from "@/context/TravelPlanContext";
import { BucketListItem } from "@/lib/types";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";
import TravelPlanCard from "./TravelPlanCard";
import Link from "next/link";

type Section = "plans" | "wishlist" | "visited";

export default function PersonalDashboard() {
  const { items, isLoading, dispatch } = useBucketList();
  const { plans, dispatch: planDispatch } = useTravelPlans();
  const [section, setSection] = useState<Section>("plans");
  const [editingNotes, setEditingNotes] = useState<string | null>(null);
  const [notesText, setNotesText] = useState("");

  const wishlist = items.filter((i) => i.status === "want_to_visit");
  const planning = items.filter((i) => i.status === "planning");
  const visited = items.filter((i) => i.status === "visited");
  const activePlans = plans.filter((p) => p.status !== "completed" && p.status !== "cancelled");

  const handleRemove = (id: string) => dispatch({ type: "REMOVE_ITEM", payload: { id } });

  const handleSaveNotes = (id: string) => {
    dispatch({ type: "UPDATE_ITEM", payload: { id, notes: notesText } });
    setEditingNotes(null);
  };

  const handleCreatePlan = (item: BucketListItem) => {
    const plan = {
      id: crypto.randomUUID(), userId: "", bucketListItemId: item.id,
      countryCode: item.countryCode, countryName: item.countryName,
      title: `Trip to ${item.countryName}`, startDate: null, endDate: null,
      budgetAmount: null, budgetCurrency: "USD", status: "draft" as const,
      notes: null, summary: null, tips: [],
      createdAt: new Date().toISOString(), updatedAt: new Date().toISOString(),
    };
    planDispatch({ type: "ADD_PLAN", payload: plan });
    dispatch({ type: "UPDATE_ITEM", payload: { id: item.id, status: "planning" } });
  };

  if (isLoading) return <LoadingSpinner message="Loading your trips..." />;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Trip Plans", count: activePlans.length, icon: "📋", color: "bg-amber-50 text-amber-700" },
          { label: "Want to Visit", count: wishlist.length, icon: "💛", color: "bg-teal-50 text-teal-700" },
          { label: "Visited", count: visited.length, icon: "✅", color: "bg-blue-50 text-blue-700" },
        ].map((stat) => (
          <div key={stat.label} className={`${stat.color} rounded-2xl p-4 text-center`}>
            <p className="text-2xl font-bold">{stat.count}</p>
            <p className="text-xs font-medium opacity-70">{stat.icon} {stat.label}</p>
          </div>
        ))}
      </div>

      {/* Section tabs */}
      <div className="flex gap-1 bg-gray-100 rounded-xl p-1">
        {([
          { value: "plans" as Section, label: `Trip Plans (${activePlans.length})` },
          { value: "wishlist" as Section, label: `Want to Visit (${wishlist.length})` },
          { value: "visited" as Section, label: `Visited (${visited.length})` },
        ]).map((tab) => (
          <button key={tab.value} onClick={() => setSection(tab.value)}
            className={`flex-1 py-2.5 text-sm font-medium rounded-lg transition-all ${
              section === tab.value ? "bg-white text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700"
            }`}>
            {tab.label}
          </button>
        ))}
      </div>

      {/* Trip Plans — shows itinerary cards that link to the calendar editor */}
      {section === "plans" && (
        <div className="space-y-3">
          {activePlans.length === 0 ? (
            <EmptyState icon="📋" title="No trip plans yet"
              description="Save a country and click 'Plan Trip' to start planning, or use AI to generate an itinerary!"
              actionLabel="Discover Destinations" actionHref="/" />
          ) : (
            activePlans.map((plan) => (
              <TravelPlanCard key={plan.id} plan={plan} />
            ))
          )}

          {/* Countries in "planning" status without a plan */}
          {planning.filter((item) => !plans.some((p) => p.bucketListItemId === item.id)).length > 0 && (
            <div className="mt-4">
              <p className="text-xs text-gray-400 uppercase tracking-wide font-medium mb-2">Needs a plan</p>
              {planning.filter((item) => !plans.some((p) => p.bucketListItemId === item.id)).map((item) => (
                <div key={item.id} className="flex items-center gap-3 p-3 bg-amber-50 rounded-xl mb-2">
                  {item.flagUrl && <img src={item.flagUrl} alt={item.countryName} className="w-10 h-7 rounded object-cover border border-amber-200" />}
                  <span className="text-sm font-medium text-gray-900 flex-1">{item.countryName}</span>
                  <Link href={`/country/${item.countryCode}`}
                    className="text-xs px-3 py-1.5 bg-amber-500 text-white rounded-lg hover:bg-amber-600">
                    Plan Trip
                  </Link>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Want to Visit — simple country cards */}
      {section === "wishlist" && (
        <div className="space-y-2">
          {wishlist.length === 0 ? (
            <EmptyState icon="💛" title="No saved destinations"
              description="Browse destinations and save the ones you want to visit!"
              actionLabel="Discover Destinations" actionHref="/" />
          ) : (
            wishlist.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                {item.flagUrl && (
                  <img src={item.flagUrl} alt={item.countryName}
                    className="w-14 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <Link href={`/country/${item.countryCode}`}
                    className="font-semibold text-gray-900 hover:text-teal-600 transition-colors">
                    {item.countryName}
                  </Link>
                  {item.capital && <p className="text-xs text-gray-500">{item.capital}</p>}
                  {/* Notes */}
                  {editingNotes === item.id ? (
                    <div className="flex gap-2 mt-2">
                      <input type="text" value={notesText} onChange={(e) => setNotesText(e.target.value)}
                        className="flex-1 text-sm px-3 py-1.5 bg-gray-50 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-teal-500"
                        placeholder="Add notes..." autoFocus />
                      <button onClick={() => handleSaveNotes(item.id)} className="text-xs px-3 py-1.5 bg-teal-500 text-white rounded-lg">Save</button>
                      <button onClick={() => setEditingNotes(null)} className="text-xs px-3 py-1.5 bg-gray-100 text-gray-600 rounded-lg">Cancel</button>
                    </div>
                  ) : item.notes ? (
                    <p className="text-xs text-gray-400 mt-1 cursor-pointer hover:text-gray-600"
                      onClick={() => { setEditingNotes(item.id); setNotesText(item.notes || ""); }}>
                      {item.notes}
                    </p>
                  ) : null}
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  <button onClick={() => handleCreatePlan(item)}
                    className="text-xs px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100">
                    Plan Trip
                  </button>
                  <button onClick={() => handleRemove(item.id)}
                    className="text-xs px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg hover:bg-rose-100">
                    Remove
                  </button>
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* Visited — simple country cards */}
      {section === "visited" && (
        <div className="space-y-2">
          {visited.length === 0 ? (
            <EmptyState icon="✅" title="No visited countries yet"
              description="Mark countries as visited once you've been there!" />
          ) : (
            visited.map((item) => (
              <div key={item.id} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 flex items-center gap-4">
                {item.flagUrl && (
                  <img src={item.flagUrl} alt={item.countryName}
                    className="w-14 h-10 rounded-lg object-cover border border-gray-100 flex-shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <Link href={`/country/${item.countryCode}`}
                    className="font-semibold text-gray-900 hover:text-teal-600 transition-colors">
                    {item.countryName}
                  </Link>
                  {item.capital && <p className="text-xs text-gray-500">{item.capital}</p>}
                </div>
                <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">Visited</span>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
