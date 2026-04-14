"use client";

import { useState } from "react";
import LoadingSpinner from "./LoadingSpinner";

interface ItineraryActivity {
  time: string;
  title: string;
  description: string;
  category: string;
  estimatedCost: string;
}

interface ItineraryDay {
  day: number;
  title: string;
  activities: ItineraryActivity[];
}

interface Accommodation {
  area: string;
  description: string;
  budgetRange: string;
  searchUrl: string;
  userNotes?: string;
  chosenPlace?: string;
}

interface Itinerary {
  title: string;
  summary: string;
  days: ItineraryDay[];
  accommodation: Accommodation[];
  tips: string[];
  estimatedBudget: Record<string, string>;
}

const categoryEmoji: Record<string, string> = {
  sightseeing: "📸", food: "🍽️", adventure: "🎯",
  culture: "🏛️", relaxation: "🧘", shopping: "🛍️",
  nightlife: "🍸", nature: "🌿",
};

interface AiTripPlannerProps {
  countryName: string;
  countryCode: string;
  selectedActivities: string[];
  onClose: () => void;
}

export default function AiTripPlanner({ countryName, countryCode, selectedActivities, onClose }: AiTripPlannerProps) {
  const [days, setDays] = useState(5);
  const [interests, setInterests] = useState("sightseeing, food, culture");
  const [itinerary, setItinerary] = useState<Itinerary | null>(null);
  const [loading, setLoading] = useState(false);
  const [refineLoading, setRefineLoading] = useState(false);
  const [error, setError] = useState("");
  const [refineInput, setRefineInput] = useState("");
  const [editingDay, setEditingDay] = useState<number | null>(null);
  const [editingAccom, setEditingAccom] = useState<number | null>(null);
  const [saved, setSaved] = useState(false);

  const handleGenerate = async () => {
    setLoading(true);
    setError("");
    setSaved(false);
    try {
      const res = await fetch("/api/plan-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ countryName, countryCode, activities: selectedActivities, days, interests }),
      });
      if (!res.ok) throw new Error("Failed to generate");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setItinerary(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
    setLoading(false);
  };

  const handleRefine = async () => {
    if (!refineInput.trim() || !itinerary) return;
    setRefineLoading(true);
    setError("");
    try {
      const res = await fetch("/api/plan-trip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryName,
          countryCode,
          activities: selectedActivities,
          days,
          interests,
          currentItinerary: JSON.stringify(itinerary),
          refineRequest: refineInput.trim(),
        }),
      });
      if (!res.ok) throw new Error("Failed to refine");
      const data = await res.json();
      if (data.error) throw new Error(data.error);
      setItinerary(data);
      setRefineInput("");
      setSaved(false);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Something went wrong");
    }
    setRefineLoading(false);
  };

  // Inline edit handlers
  const removeActivity = (dayIndex: number, actIndex: number) => {
    if (!itinerary) return;
    const updated = { ...itinerary };
    updated.days = updated.days.map((d, di) =>
      di === dayIndex ? { ...d, activities: d.activities.filter((_, ai) => ai !== actIndex) } : d
    );
    setItinerary(updated);
    setSaved(false);
  };

  const removeDay = (dayIndex: number) => {
    if (!itinerary) return;
    const updated = { ...itinerary };
    updated.days = updated.days.filter((_, i) => i !== dayIndex);
    // Renumber days
    updated.days = updated.days.map((d, i) => ({ ...d, day: i + 1 }));
    setItinerary(updated);
    setSaved(false);
  };

  const updateAccommodationNotes = (index: number, field: "userNotes" | "chosenPlace", value: string) => {
    if (!itinerary) return;
    const updated = { ...itinerary };
    updated.accommodation = updated.accommodation.map((a, i) =>
      i === index ? { ...a, [field]: value } : a
    );
    setItinerary(updated);
    setSaved(false);
  };

  const handleSave = () => {
    // Save to localStorage for now (could save to Supabase travel_plans)
    if (!itinerary) return;
    const key = `trip_plan_${countryCode}_${Date.now()}`;
    localStorage.setItem(key, JSON.stringify({ ...itinerary, countryName, countryCode, savedAt: new Date().toISOString() }));
    setSaved(true);
  };

  return (
    <div className="mt-8 bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
      {/* Header */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-500 p-5 text-white">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold">AI Trip Planner</h2>
            <p className="text-teal-100 text-sm mt-0.5">
              Let AI build your perfect {countryName} itinerary
            </p>
          </div>
          <button onClick={onClose} className="text-white/70 hover:text-white text-2xl leading-none">&times;</button>
        </div>
      </div>

      {!itinerary ? (
        /* Setup form */
        <div className="p-5 space-y-4">
          {selectedActivities.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Including your saved activities:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {selectedActivities.map((a, i) => (
                  <span key={i} className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium">{a}</span>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">How many days?</label>
            <div className="flex gap-2">
              {[3, 5, 7, 10, 14].map((d) => (
                <button key={d} onClick={() => setDays(d)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${days === d ? "bg-teal-500 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}>
                  {d} days
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Your interests</label>
            <input value={interests} onChange={(e) => setInterests(e.target.value)} placeholder="sightseeing, food, adventure..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button onClick={handleGenerate} disabled={loading}
            className="w-full py-3 bg-teal-500 text-white font-medium rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50">
            {loading ? "Generating..." : "Generate Itinerary"}
          </button>
          {loading && <LoadingSpinner message="AI is planning your perfect trip..." />}
        </div>
      ) : (
        /* Itinerary view — editable */
        <div className="p-5 space-y-6">
          {/* Summary */}
          <div>
            <h3 className="text-lg font-bold text-gray-900">{itinerary.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{itinerary.summary}</p>
          </div>

          {/* Refine with AI */}
          <div className="bg-gradient-to-r from-teal-50 to-cyan-50 rounded-xl p-4">
            <p className="text-xs font-medium text-teal-700 mb-2">Refine with AI — tell me what to change:</p>
            <div className="flex gap-2">
              <input value={refineInput} onChange={(e) => setRefineInput(e.target.value)}
                placeholder="e.g. Make it 3 days, add more food spots, remove shopping..."
                className="flex-1 px-3.5 py-2.5 bg-white border border-teal-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
                onKeyDown={(e) => e.key === "Enter" && handleRefine()} />
              <button onClick={handleRefine} disabled={refineLoading || !refineInput.trim()}
                className="px-4 py-2.5 bg-teal-500 text-white text-sm rounded-xl hover:bg-teal-600 disabled:opacity-50 transition-colors whitespace-nowrap">
                {refineLoading ? "..." : "Refine"}
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5 mt-2">
              {["Make it shorter", "More food spots", "Add adventure activities", "Budget-friendly", "More relaxation"].map((suggestion) => (
                <button key={suggestion} onClick={() => { setRefineInput(suggestion); }}
                  className="px-2.5 py-1 bg-white text-teal-700 rounded-full text-xs hover:bg-teal-100 transition-colors border border-teal-200">
                  {suggestion}
                </button>
              ))}
            </div>
          </div>

          {/* Budget overview */}
          {itinerary.estimatedBudget && (
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              {Object.entries(itinerary.estimatedBudget).map(([key, value]) => (
                <div key={key} className="bg-gray-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-gray-500 capitalize">{key}</p>
                  <p className="text-sm font-semibold text-gray-900">{value}</p>
                </div>
              ))}
            </div>
          )}

          {/* Day by day — editable */}
          <div className="space-y-4">
            {itinerary.days?.map((day, dayIndex) => (
              <div key={day.day} className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5 flex items-center justify-between">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    Day {day.day}: {day.title}
                  </h4>
                  <button onClick={() => removeDay(dayIndex)}
                    className="text-xs text-gray-400 hover:text-rose-500 transition-colors px-2 py-1">
                    Remove day
                  </button>
                </div>
                <div className="divide-y divide-gray-50">
                  {day.activities?.map((activity, actIndex) => (
                    <div key={actIndex} className="px-4 py-3 flex gap-3 group">
                      <span className="text-lg">{categoryEmoji[activity.category] || "📌"}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-400 font-mono">{activity.time}</span>
                          <h5 className="text-sm font-medium text-gray-900">{activity.title}</h5>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5">{activity.description}</p>
                        {activity.estimatedCost && (
                          <span className="text-xs text-teal-600 mt-1 inline-block">{activity.estimatedCost}</span>
                        )}
                      </div>
                      <button onClick={() => removeActivity(dayIndex, actIndex)}
                        className="text-gray-300 hover:text-rose-500 transition-colors opacity-0 group-hover:opacity-100 self-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Accommodation — editable with notes */}
          {itinerary.accommodation && itinerary.accommodation.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Where to Stay</h3>
              <div className="grid gap-3">
                {itinerary.accommodation.map((acc, i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1">
                        <h4 className="font-semibold text-gray-900 text-sm">{acc.area}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{acc.description}</p>
                        <p className="text-xs text-teal-600 mt-1 font-medium">{acc.budgetRange}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <a href={acc.searchUrl || `https://www.google.com/travel/hotels/${encodeURIComponent(countryName)}`}
                          target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors">
                          🏨 Hotels
                        </a>
                        <a href={`https://www.airbnb.com/s/${encodeURIComponent(acc.area + " " + countryName)}/homes`}
                          target="_blank" rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-medium hover:bg-rose-100 transition-colors">
                          🏠 Airbnb
                        </a>
                      </div>
                    </div>

                    {/* User's chosen place */}
                    <div className="mt-3 space-y-2">
                      {editingAccom === i ? (
                        <div className="space-y-2">
                          <input value={acc.chosenPlace || ""} onChange={(e) => updateAccommodationNotes(i, "chosenPlace", e.target.value)}
                            placeholder="Paste your chosen Airbnb/hotel link or name..."
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                          <input value={acc.userNotes || ""} onChange={(e) => updateAccommodationNotes(i, "userNotes", e.target.value)}
                            placeholder="Notes (price, check-in time, confirmation #...)"
                            className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                          <button onClick={() => setEditingAccom(null)}
                            className="text-xs px-3 py-1.5 bg-teal-500 text-white rounded-lg hover:bg-teal-600">Done</button>
                        </div>
                      ) : (
                        <button onClick={() => setEditingAccom(i)}
                          className="text-xs text-teal-600 hover:text-teal-700 transition-colors">
                          {acc.chosenPlace ? (
                            <span className="flex flex-col items-start gap-0.5">
                              <span className="font-medium">✅ {acc.chosenPlace}</span>
                              {acc.userNotes && <span className="text-gray-500">{acc.userNotes}</span>}
                              <span className="text-gray-400">Click to edit</span>
                            </span>
                          ) : (
                            "📝 Add your chosen place..."
                          )}
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tips */}
          {itinerary.tips && itinerary.tips.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Travel Tips</h3>
              <div className="space-y-2">
                {itinerary.tips.map((tip, i) => (
                  <div key={i} className="flex gap-2.5 text-sm">
                    <span className="text-teal-500 flex-shrink-0">💡</span>
                    <p className="text-gray-600">{tip}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Actions */}
          {error && <p className="text-sm text-rose-600">{error}</p>}

          <div className="flex gap-3 pt-2">
            <button onClick={() => { setItinerary(null); setSaved(false); }}
              className="px-5 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors">
              Start Over
            </button>
            <button onClick={handleSave}
              className={`flex-1 py-2.5 text-sm font-medium rounded-xl transition-colors ${
                saved
                  ? "bg-green-50 text-green-700 border border-green-200"
                  : "bg-teal-500 text-white hover:bg-teal-600"
              }`}>
              {saved ? "✅ Saved!" : "💾 Save Itinerary"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
