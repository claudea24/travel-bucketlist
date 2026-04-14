"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import LoadingSpinner from "./LoadingSpinner";

interface Activity {
  name: string;
  description: string;
  category: string;
  source: string;
  imageUrl: string | null;
  youtubeSearchUrl: string;
}

const categoryConfig: Record<string, { emoji: string; label: string; color: string; gradient: string }> = {
  sightseeing: { emoji: "📸", label: "See", color: "bg-violet-50 text-violet-700", gradient: "from-violet-400 to-purple-500" },
  adventure: { emoji: "🎯", label: "Do", color: "bg-orange-50 text-orange-700", gradient: "from-orange-400 to-red-500" },
  food: { emoji: "🍽️", label: "Eat", color: "bg-amber-50 text-amber-700", gradient: "from-amber-400 to-orange-500" },
  nightlife: { emoji: "🍸", label: "Drink", color: "bg-pink-50 text-pink-700", gradient: "from-pink-400 to-rose-500" },
  shopping: { emoji: "🛍️", label: "Shop", color: "bg-teal-50 text-teal-700", gradient: "from-teal-400 to-cyan-500" },
  culture: { emoji: "🏛️", label: "Culture", color: "bg-rose-50 text-rose-700", gradient: "from-rose-400 to-pink-500" },
  nature: { emoji: "🌿", label: "Nature", color: "bg-green-50 text-green-700", gradient: "from-green-400 to-emerald-500" },
  relaxation: { emoji: "🏨", label: "Stay", color: "bg-blue-50 text-blue-700", gradient: "from-blue-400 to-indigo-500" },
};

interface ActivitySectionProps {
  countryName: string;
  countryCode: string;
  onSelectActivities?: (activities: Activity[]) => void;
}

export default function ActivitySection({ countryName, countryCode, onSelectActivities }: ActivitySectionProps) {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [savedActivities, setSavedActivities] = useState<Set<string>>(new Set());

  useEffect(() => {
    let cancelled = false;

    async function fetchActivities() {
      setLoading(true);
      setError(false);

      // Check localStorage cache first (valid for 7 days)
      const cacheKey = `activities_${countryCode}`;
      try {
        const cached = localStorage.getItem(cacheKey);
        if (cached) {
          const parsed = JSON.parse(cached);
          const age = Date.now() - new Date(parsed.cachedAt).getTime();
          if (age < 7 * 86400000 && parsed.activities?.length > 0) {
            if (!cancelled) {
              setActivities(parsed.activities);
              setLoading(false);
            }
            return;
          }
        }
      } catch { /* ignore cache errors */ }

      try {
        const res = await fetch(
          `/api/activities?country=${encodeURIComponent(countryName)}&code=${encodeURIComponent(countryCode)}`
        );
        if (!res.ok) throw new Error("Failed to fetch");
        const data = await res.json();
        if (!cancelled) {
          setActivities(data.activities || []);
          // Cache the result
          try {
            localStorage.setItem(cacheKey, JSON.stringify({ activities: data.activities, cachedAt: new Date().toISOString() }));
          } catch { /* ignore storage full */ }
        }
      } catch {
        if (!cancelled) setError(true);
      }
      if (!cancelled) setLoading(false);
    }

    fetchActivities();
    return () => { cancelled = true; };
  }, [countryName, countryCode]);

  const toggleSaveActivity = (activityName: string) => {
    setSavedActivities((prev) => {
      const next = new Set(prev);
      if (next.has(activityName)) next.delete(activityName);
      else next.add(activityName);
      return next;
    });
  };

  // Notify parent of selected activities
  useEffect(() => {
    if (onSelectActivities) {
      onSelectActivities(activities.filter((a) => savedActivities.has(a.name)));
    }
  }, [savedActivities, activities, onSelectActivities]);

  if (loading) return <LoadingSpinner message={`Finding things to do in ${countryName}...`} />;
  if (error || activities.length === 0) return null;

  const categories = [...new Set(activities.map((a) => a.category))];
  const filtered = selectedCategory === "all"
    ? activities
    : activities.filter((a) => a.category === selectedCategory);

  return (
    <div className="mt-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-900">Things to Do</h2>
        {savedActivities.size > 0 && (
          <span className="text-sm text-teal-600 font-medium">
            {savedActivities.size} saved
          </span>
        )}
      </div>

      {/* Category filter */}
      {categories.length > 1 && (
        <div className="flex gap-2 overflow-x-auto hide-scrollbar mb-5 pb-1">
          <button
            onClick={() => setSelectedCategory("all")}
            className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
              selectedCategory === "all"
                ? "bg-teal-500 text-white"
                : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
            }`}
          >
            All
          </button>
          {categories.map((cat) => {
            const config = categoryConfig[cat] || { emoji: "📌", label: cat };
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  selectedCategory === cat
                    ? "bg-teal-500 text-white"
                    : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                }`}
              >
                {config.emoji} {config.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Activity cards — visual grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {filtered.map((activity, i) => {
          const config = categoryConfig[activity.category] || {
            emoji: "📌", label: activity.category, color: "bg-gray-100 text-gray-700", gradient: "from-gray-400 to-gray-500",
          };
          const isSaved = savedActivities.has(activity.name);

          return (
            <div
              key={i}
              className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all group"
            >
              {/* Image / gradient header */}
              <div className="relative h-36 overflow-hidden">
                {activity.imageUrl ? (
                  <Image
                    src={activity.imageUrl}
                    alt={activity.name}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-500"
                    sizes="(max-width: 640px) 100vw, 50vw"
                    unoptimized
                  />
                ) : (
                  <div className={`w-full h-full bg-gradient-to-br ${config.gradient} flex items-center justify-center`}>
                    <span className="text-4xl opacity-50">{config.emoji}</span>
                  </div>
                )}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                {/* Category badge */}
                <span className={`absolute top-2.5 left-2.5 px-2 py-0.5 rounded-full text-xs font-medium backdrop-blur-sm ${config.color}`}>
                  {config.emoji} {config.label}
                </span>

                {/* Save heart */}
                <button
                  onClick={() => toggleSaveActivity(activity.name)}
                  className={`absolute top-2.5 right-2.5 w-8 h-8 flex items-center justify-center rounded-full transition-all ${
                    isSaved
                      ? "bg-rose-500 text-white"
                      : "bg-white/70 backdrop-blur-sm text-gray-500 hover:text-rose-500 hover:bg-white"
                  }`}
                >
                  {isSaved ? "♥" : "♡"}
                </button>

                {/* Title on image */}
                <h4 className="absolute bottom-2.5 left-3 right-3 text-white font-semibold text-sm drop-shadow-sm line-clamp-1">
                  {activity.name}
                </h4>
              </div>

              {/* Content */}
              <div className="p-3.5">
                {activity.description && (
                  <p className="text-sm text-gray-500 line-clamp-2 leading-relaxed mb-3">
                    {activity.description}
                  </p>
                )}

                {/* Action buttons */}
                <div className="flex items-center gap-2">
                  <a
                    href={activity.youtubeSearchUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-xs font-medium hover:bg-red-100 transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81zM9.75 15.02V8.98L15.5 12l-5.75 3.02z" />
                    </svg>
                    YouTube
                  </a>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(activity.name + " " + countryName)}&tbm=isch`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-600 rounded-lg text-xs font-medium hover:bg-blue-100 transition-colors"
                  >
                    📷 Photos
                  </a>
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(activity.name + " " + countryName + " travel guide")}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={(e) => e.stopPropagation()}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-50 text-gray-600 rounded-lg text-xs font-medium hover:bg-gray-100 transition-colors"
                  >
                    🔍 More
                  </a>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <p className="text-xs text-gray-300 mt-4 text-center">
        Travel tips powered by Wikivoyage &middot; Images from Wikipedia
      </p>
    </div>
  );
}
