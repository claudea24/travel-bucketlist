"use client";

import { useState } from "react";
import { useBucketList } from "@/context/BucketListContext";
import { useTravelPlans } from "@/context/TravelPlanContext";
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
  const visited = items.filter((i) => i.status === "visited");
  const activePlans = plans.filter((p) => p.status !== "completed" && p.status !== "cancelled");
  const completedPlans = plans.filter((p) => p.status === "completed");

  const handleRemove = (id: string) => dispatch({ type: "REMOVE_ITEM", payload: { id } });

  const handleSaveNotes = (id: string) => {
    dispatch({ type: "UPDATE_ITEM", payload: { id, notes: notesText } });
    setEditingNotes(null);
  };


  if (isLoading) return <LoadingSpinner message="Loading your trips..." />;

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: "Trip Plans", count: activePlans.length, icon: "📋", color: "bg-amber-50 text-amber-700" },
          { label: "Want to Visit", count: wishlist.length, icon: "💛", color: "bg-teal-50 text-teal-700" },
          { label: "Visited", count: new Set([...visited.map((v) => v.countryCode), ...completedPlans.map((p) => p.countryCode)]).size, icon: "✅", color: "bg-blue-50 text-blue-700" },
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
          { value: "visited" as Section, label: `Visited (${new Set([...visited.map((v) => v.countryCode), ...completedPlans.map((p) => p.countryCode)]).size})` },
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
                  {plans.some((p) => p.countryCode === item.countryCode) ? (
                    <Link href={`/personal/plan/${plans.find((p) => p.countryCode === item.countryCode)!.id}`}
                      className="text-xs px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg hover:bg-amber-100">
                      View Plan
                    </Link>
                  ) : (
                    <Link href={`/country/${item.countryCode}`}
                      className="text-xs px-3 py-1.5 bg-teal-50 text-teal-700 rounded-lg hover:bg-teal-100">
                      Plan Trip
                    </Link>
                  )}
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
        <div className="space-y-3">
          {visited.length === 0 && completedPlans.length === 0 ? (
            <EmptyState icon="✅" title="No visited countries yet"
              description="Complete a trip to see it here as an archive!" />
          ) : (
            <>
              {/* Completed trip plans with itinerary links */}
              {completedPlans.map((cp) => (
                <Link key={cp.id} href={`/personal/plan/${cp.id}`} className="block">
                  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md hover:border-blue-200 transition-all">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-blue-100 text-blue-700 rounded-xl flex items-center justify-center text-lg">🎉</div>
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm">{cp.title}</h4>
                        <p className="text-xs text-gray-500">{cp.countryName}
                          {cp.startDate && cp.endDate && ` · ${new Date(cp.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(cp.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2.5 py-1 bg-blue-50 text-blue-700 rounded-full font-medium">Completed</span>
                        <span className="text-sm text-teal-600">View →</span>
                      </div>
                    </div>
                  </div>
                </Link>
              ))}

              {/* Countries visited without a plan */}
              {visited.filter((item) => !completedPlans.some((cp) => cp.countryCode === item.countryCode)).map((item) => (
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
              ))}
            </>
          )}
        </div>
      )}
    </div>
  );
}
