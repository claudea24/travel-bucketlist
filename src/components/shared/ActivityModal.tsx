"use client";

import { useState, useEffect } from "react";
import Image from "next/image";

interface ActivityModalProps {
  name: string;
  description: string;
  category: string;
  imageUrl: string | null;
  youtubeSearchUrl: string;
  countryName: string;
  onClose: () => void;
}

interface ActivityDetails {
  whatToExpect: string;
  tips: string[];
  bestTimeToVisit: string;
  estimatedDuration: string;
  estimatedCost: string;
}

const categoryEmoji: Record<string, string> = {
  sightseeing: "📸", food: "🍽️", adventure: "🎯", culture: "🏛️",
  nature: "🌿", relaxation: "🧘", shopping: "🛍️", nightlife: "🍸",
};

export default function ActivityModal({
  name, description, category, imageUrl, youtubeSearchUrl, countryName, onClose,
}: ActivityModalProps) {
  const [details, setDetails] = useState<ActivityDetails | null>(null);
  const [loadingDetails, setLoadingDetails] = useState(true);

  // Fetch rich details from OpenAI when modal opens
  useEffect(() => {
    const cacheKey = `detail_${name}_${countryName}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) {
      setDetails(JSON.parse(cached));
      setLoadingDetails(false);
      return;
    }

    async function fetchDetails() {
      try {
        const res = await fetch("/api/activity-detail", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, countryName }),
        });
        if (res.ok) {
          const data = await res.json();
          setDetails(data);
          sessionStorage.setItem(cacheKey, JSON.stringify(data));
        }
      } catch { /* ignore */ }
      setLoadingDetails(false);
    }
    fetchDetails();
  }, [name, countryName]);

  // YouTube search query for embedding
  const ytQuery = encodeURIComponent(`${name} ${countryName} travel vlog`);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      {/* Modal */}
      <div
        className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Hero image */}
        <div className="relative h-48 sm:h-56 overflow-hidden sm:rounded-t-2xl">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill className="object-cover" unoptimized sizes="100vw" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
              <span className="text-6xl opacity-40">{categoryEmoji[category] || "📌"}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          {/* Close button */}
          <button onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 bg-black/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/50 transition-colors">
            &times;
          </button>

          {/* Title */}
          <div className="absolute bottom-4 left-5 right-5">
            <span className="inline-block px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full mb-2">
              {categoryEmoji[category] || "📌"} {category}
            </span>
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">{name}</h2>
            <p className="text-white/80 text-sm mt-0.5">{countryName}</p>
          </div>
        </div>

        <div className="p-5 space-y-5">
          {/* Description */}
          <p className="text-gray-700 leading-relaxed">{description}</p>

          {/* AI-generated details */}
          {loadingDetails ? (
            <div className="flex items-center gap-2 py-4">
              <div className="w-4 h-4 border-2 border-teal-200 border-t-teal-500 rounded-full animate-spin" />
              <span className="text-sm text-gray-400">Loading more details...</span>
            </div>
          ) : details ? (
            <>
              {/* What to expect */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What to Expect</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{details.whatToExpect}</p>
              </div>

              {/* Quick info */}
              <div className="grid grid-cols-3 gap-2">
                <div className="bg-teal-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-teal-600 font-medium">Duration</p>
                  <p className="text-sm font-semibold text-teal-800 mt-0.5">{details.estimatedDuration}</p>
                </div>
                <div className="bg-amber-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-amber-600 font-medium">Cost</p>
                  <p className="text-sm font-semibold text-amber-800 mt-0.5">{details.estimatedCost}</p>
                </div>
                <div className="bg-blue-50 rounded-xl p-3 text-center">
                  <p className="text-xs text-blue-600 font-medium">Best Time</p>
                  <p className="text-sm font-semibold text-blue-800 mt-0.5">{details.bestTimeToVisit}</p>
                </div>
              </div>

              {/* Tips */}
              {details.tips.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Tips from Travelers</h3>
                  <div className="space-y-2">
                    {details.tips.map((tip, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="text-teal-500 flex-shrink-0 mt-0.5">💡</span>
                        <p className="text-gray-600">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}

          {/* YouTube video section */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Watch Videos</h3>
            <a href={youtubeSearchUrl} target="_blank" rel="noopener noreferrer"
              className="block relative overflow-hidden rounded-xl border border-gray-100 hover:shadow-md transition-all group">
              <div className="relative h-44 bg-gray-900 flex items-center justify-center">
                {imageUrl ? (
                  <Image src={imageUrl} alt={name} fill className="object-cover opacity-60" unoptimized sizes="100vw" />
                ) : (
                  <div className="w-full h-full bg-gradient-to-br from-red-500 to-red-700" />
                )}
                {/* Play button */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 bg-red-600 rounded-full flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="white">
                      <path d="M8 5v14l11-7z" />
                    </svg>
                  </div>
                </div>
                {/* YouTube branding */}
                <div className="absolute bottom-3 left-3 flex items-center gap-2">
                  <svg width="20" height="14" viewBox="0 0 24 18" fill="white" opacity="0.9">
                    <path d="M23.5 3.19a3.02 3.02 0 0 0-2.12-2.14C19.5.5 12 .5 12 .5S4.5.5 2.62 1.05A3.02 3.02 0 0 0 .5 3.19 31.6 31.6 0 0 0 0 9a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14C4.5 17.5 12 17.5 12 17.5s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 9a31.6 31.6 0 0 0-.5-5.81z" />
                  </svg>
                  <span className="text-white text-xs font-medium opacity-90">
                    Search: {name} {countryName}
                  </span>
                </div>
              </div>
            </a>
          </div>

          {/* External links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Explore More</h3>
            <div className="grid grid-cols-2 gap-2">
              <a href={`https://www.google.com/search?q=${encodeURIComponent(name + " " + countryName)}&tbm=isch`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-blue-50 rounded-xl text-sm font-medium text-blue-700 hover:bg-blue-100 transition-colors">
                📷 Google Photos
              </a>
              <a href={`https://www.google.com/maps/search/${encodeURIComponent(name + " " + countryName)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-green-50 rounded-xl text-sm font-medium text-green-700 hover:bg-green-100 transition-colors">
                📍 Google Maps
              </a>
              <a href={`https://www.tripadvisor.com/Search?q=${encodeURIComponent(name + " " + countryName)}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-emerald-50 rounded-xl text-sm font-medium text-emerald-700 hover:bg-emerald-100 transition-colors">
                ⭐ TripAdvisor
              </a>
              <a href={`https://www.google.com/search?q=${encodeURIComponent(name + " " + countryName + " travel blog")}`}
                target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 px-4 py-3 bg-gray-50 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-100 transition-colors">
                📝 Travel Blogs
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
