"use client";

import { useState } from "react";

interface TripSetupProps {
  countryName: string;
  countryCode: string;
  savedActivities: string[];
  onGenerate: (config: {
    days: number;
    hasTransport: boolean;
    interests: string;
    selectedActivities: string[];
    customActivities: string[];
    startDate: string;
    endDate: string;
  }) => void;
}

const INTEREST_OPTIONS = [
  { value: "sightseeing", label: "📸 Sightseeing", color: "bg-violet-50 text-violet-700 border-violet-200" },
  { value: "food", label: "🍽️ Food & Dining", color: "bg-amber-50 text-amber-700 border-amber-200" },
  { value: "adventure", label: "🎯 Adventure", color: "bg-orange-50 text-orange-700 border-orange-200" },
  { value: "culture", label: "🏛️ Culture & History", color: "bg-rose-50 text-rose-700 border-rose-200" },
  { value: "nature", label: "🌿 Nature", color: "bg-green-50 text-green-700 border-green-200" },
  { value: "relaxation", label: "🧘 Relaxation", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { value: "nightlife", label: "🍸 Nightlife", color: "bg-pink-50 text-pink-700 border-pink-200" },
  { value: "shopping", label: "🛍️ Shopping", color: "bg-teal-50 text-teal-700 border-teal-200" },
];

export default function TripSetup({ countryName, savedActivities, onGenerate }: TripSetupProps) {
  const [days, setDays] = useState(5);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [hasTransport, setHasTransport] = useState(false);
  const [selectedInterests, setSelectedInterests] = useState<Set<string>>(new Set(["sightseeing", "food", "culture"]));
  const [selectedActivities, setSelectedActivities] = useState<Set<string>>(new Set(savedActivities));
  const [customInput, setCustomInput] = useState("");
  const [customActivities, setCustomActivities] = useState<string[]>([]);

  const toggleInterest = (value: string) => {
    setSelectedInterests((prev) => {
      const next = new Set(prev);
      if (next.has(value)) next.delete(value);
      else next.add(value);
      return next;
    });
  };

  const toggleActivity = (name: string) => {
    setSelectedActivities((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const addCustomActivity = () => {
    if (customInput.trim() && !customActivities.includes(customInput.trim())) {
      setCustomActivities((prev) => [...prev, customInput.trim()]);
      setCustomInput("");
    }
  };

  const removeCustomActivity = (name: string) => {
    setCustomActivities((prev) => prev.filter((a) => a !== name));
  };

  const handleSubmit = () => {
    onGenerate({
      days,
      hasTransport,
      interests: [...selectedInterests].join(", "),
      selectedActivities: [...selectedActivities],
      customActivities,
      startDate,
      endDate,
    });
  };

  return (
    <div className="space-y-8">
      {/* Duration */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-1">How long is your trip?</h3>
        <p className="text-sm text-gray-500 mb-4">Select the number of days</p>
        <div className="flex gap-2 flex-wrap">
          {[2, 3, 5, 7, 10, 14, 21].map((d) => (
            <button key={d} onClick={() => setDays(d)}
              className={`px-5 py-3 rounded-xl text-sm font-medium transition-all ${
                days === d
                  ? "bg-teal-500 text-white shadow-sm"
                  : "bg-gray-50 text-gray-600 hover:bg-gray-100 border border-gray-200"
              }`}>
              {d} {d === 1 ? "day" : "days"}
            </button>
          ))}
        </div>
      </div>

      {/* Dates */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-1">When are you going?</h3>
        <p className="text-sm text-gray-500 mb-4">Optional — you can set dates later</p>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
            <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
          </div>
          <div>
            <label className="text-xs text-gray-500 mb-1 block">End Date</label>
            <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
              className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent" />
          </div>
        </div>
      </div>

      {/* Transport */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-1">Transportation</h3>
        <p className="text-sm text-gray-500 mb-4">Will you have a car or rely on public transport?</p>
        <div className="flex gap-3">
          <button onClick={() => setHasTransport(false)}
            className={`flex-1 py-4 rounded-xl text-sm font-medium transition-all border ${
              !hasTransport
                ? "bg-teal-50 text-teal-700 border-teal-300 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}>
            <span className="text-2xl block mb-1">🚌</span>
            Public Transport / Walking
          </button>
          <button onClick={() => setHasTransport(true)}
            className={`flex-1 py-4 rounded-xl text-sm font-medium transition-all border ${
              hasTransport
                ? "bg-teal-50 text-teal-700 border-teal-300 shadow-sm"
                : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
            }`}>
            <span className="text-2xl block mb-1">🚗</span>
            Rental Car / Driving
          </button>
        </div>
      </div>

      {/* Interests */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-1">What are you into?</h3>
        <p className="text-sm text-gray-500 mb-4">Select all that interest you</p>
        <div className="flex flex-wrap gap-2">
          {INTEREST_OPTIONS.map((opt) => (
            <button key={opt.value} onClick={() => toggleInterest(opt.value)}
              className={`px-4 py-2.5 rounded-xl text-sm font-medium transition-all border ${
                selectedInterests.has(opt.value)
                  ? opt.color + " shadow-sm"
                  : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
              }`}>
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Must-do activities */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6">
        <h3 className="font-semibold text-gray-900 mb-1">Must-do activities</h3>
        <p className="text-sm text-gray-500 mb-4">
          {savedActivities.length > 0
            ? `Select from your saved activities or add your own`
            : `Add specific things you want to do in ${countryName}`}
        </p>

        {/* Saved activities from country page */}
        {savedActivities.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-4">
            {savedActivities.map((name) => (
              <button key={name} onClick={() => toggleActivity(name)}
                className={`px-3 py-1.5 rounded-full text-sm transition-all border ${
                  selectedActivities.has(name)
                    ? "bg-teal-50 text-teal-700 border-teal-300"
                    : "bg-white text-gray-500 border-gray-200 hover:bg-gray-50"
                }`}>
                {selectedActivities.has(name) ? "✓ " : ""}{name}
              </button>
            ))}
          </div>
        )}

        {/* Custom activities */}
        <div className="flex gap-2">
          <input value={customInput} onChange={(e) => setCustomInput(e.target.value)}
            placeholder="Add something you want to do..."
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            onKeyDown={(e) => e.key === "Enter" && addCustomActivity()} />
          <button onClick={addCustomActivity}
            className="px-4 py-2.5 bg-teal-500 text-white text-sm rounded-xl hover:bg-teal-600 transition-colors">
            Add
          </button>
        </div>

        {customActivities.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {customActivities.map((name) => (
              <span key={name} className="flex items-center gap-1.5 px-3 py-1.5 bg-teal-50 text-teal-700 rounded-full text-sm border border-teal-200">
                {name}
                <button onClick={() => removeCustomActivity(name)} className="text-teal-400 hover:text-teal-700">&times;</button>
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Generate button */}
      <button onClick={handleSubmit}
        className="w-full py-4 bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-lg font-semibold rounded-2xl hover:from-teal-600 hover:to-cyan-600 shadow-lg transition-all">
        ✨ Generate My Itinerary
      </button>
    </div>
  );
}
