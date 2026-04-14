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
}

interface Itinerary {
  title: string;
  summary: string;
  days: ItineraryDay[];
  accommodation: Accommodation[];
  tips: string[];
  estimatedBudget: {
    accommodation: string;
    food: string;
    activities: string;
    transport: string;
  };
}

const categoryEmoji: Record<string, string> = {
  sightseeing: "📸",
  food: "🍽️",
  adventure: "🎯",
  culture: "🏛️",
  relaxation: "🧘",
  shopping: "🛍️",
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
  const [error, setError] = useState("");

  const handleGenerate = async () => {
    setLoading(true);
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
        }),
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
          <button onClick={onClose} className="text-white/70 hover:text-white text-xl">&times;</button>
        </div>
      </div>

      {!itinerary ? (
        <div className="p-5 space-y-4">
          {/* Selected activities */}
          {selectedActivities.length > 0 && (
            <div>
              <label className="text-sm font-medium text-gray-700 mb-2 block">
                Building itinerary around your saved activities:
              </label>
              <div className="flex flex-wrap gap-1.5">
                {selectedActivities.map((a, i) => (
                  <span key={i} className="px-2.5 py-1 bg-teal-50 text-teal-700 rounded-full text-xs font-medium">
                    {a}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Trip days */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">How many days?</label>
            <div className="flex gap-2">
              {[3, 5, 7, 10, 14].map((d) => (
                <button
                  key={d}
                  onClick={() => setDays(d)}
                  className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    days === d
                      ? "bg-teal-500 text-white"
                      : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                  }`}
                >
                  {d} days
                </button>
              ))}
            </div>
          </div>

          {/* Interests */}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-2 block">Your interests</label>
            <input
              value={interests}
              onChange={(e) => setInterests(e.target.value)}
              placeholder="sightseeing, food, adventure..."
              className="w-full px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            />
          </div>

          {error && <p className="text-sm text-rose-600">{error}</p>}

          <button
            onClick={handleGenerate}
            disabled={loading}
            className="w-full py-3 bg-teal-500 text-white font-medium rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50"
          >
            {loading ? "Generating your itinerary..." : "Generate Itinerary"}
          </button>

          {loading && <LoadingSpinner message="AI is planning your perfect trip..." />}
        </div>
      ) : (
        <div className="p-5 space-y-6">
          {/* Summary */}
          <div>
            <h3 className="text-lg font-bold text-gray-900">{itinerary.title}</h3>
            <p className="text-sm text-gray-500 mt-1">{itinerary.summary}</p>
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

          {/* Day by day */}
          <div className="space-y-4">
            {itinerary.days?.map((day) => (
              <div key={day.day} className="border border-gray-100 rounded-xl overflow-hidden">
                <div className="bg-gray-50 px-4 py-2.5">
                  <h4 className="font-semibold text-gray-900 text-sm">
                    Day {day.day}: {day.title}
                  </h4>
                </div>
                <div className="divide-y divide-gray-50">
                  {day.activities?.map((activity, i) => (
                    <div key={i} className="px-4 py-3 flex gap-3">
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
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* Accommodation */}
          {itinerary.accommodation && itinerary.accommodation.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">Where to Stay</h3>
              <div className="grid gap-3">
                {itinerary.accommodation.map((acc, i) => (
                  <div key={i} className="bg-white border border-gray-100 rounded-xl p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-semibold text-gray-900 text-sm">{acc.area}</h4>
                        <p className="text-xs text-gray-500 mt-0.5">{acc.description}</p>
                        <p className="text-xs text-teal-600 mt-1 font-medium">{acc.budgetRange}</p>
                      </div>
                      <div className="flex gap-2 flex-shrink-0">
                        <a
                          href={acc.searchUrl || `https://www.google.com/travel/hotels/${encodeURIComponent(countryName)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                        >
                          🏨 Hotels
                        </a>
                        <a
                          href={`https://www.airbnb.com/s/${encodeURIComponent(acc.area + " " + countryName)}/homes`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-3 py-1.5 bg-rose-50 text-rose-600 rounded-lg text-xs font-medium hover:bg-rose-100 transition-colors"
                        >
                          🏠 Airbnb
                        </a>
                      </div>
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
          <div className="flex gap-3 pt-2">
            <button
              onClick={() => setItinerary(null)}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
            >
              Regenerate
            </button>
            <button
              onClick={onClose}
              className="flex-1 py-2.5 bg-teal-500 text-white text-sm font-medium rounded-xl hover:bg-teal-600 transition-colors"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
