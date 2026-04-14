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

interface YouTubeVideo {
  videoId: string;
  title: string;
  thumbnail: string;
  channel: string;
}

interface WikiImage {
  url: string;
  caption: string;
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
  const [videos, setVideos] = useState<YouTubeVideo[]>([]);
  const [loadingVideos, setLoadingVideos] = useState(true);
  const [playingVideo, setPlayingVideo] = useState<string | null>(null);
  const [photos, setPhotos] = useState<WikiImage[]>([]);
  const [loadingPhotos, setLoadingPhotos] = useState(true);
  const [selectedPhoto, setSelectedPhoto] = useState<string | null>(null);

  // Fetch details
  useEffect(() => {
    const cacheKey = `detail_${name}_${countryName}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) { setDetails(JSON.parse(cached)); setLoadingDetails(false); return; }

    fetch("/api/activity-detail", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, countryName }),
    })
      .then((r) => r.json())
      .then((d) => { setDetails(d); sessionStorage.setItem(cacheKey, JSON.stringify(d)); })
      .catch(() => {})
      .finally(() => setLoadingDetails(false));
  }, [name, countryName]);

  // Fetch YouTube videos
  useEffect(() => {
    const cacheKey = `yt_${name}_${countryName}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) { setVideos(JSON.parse(cached)); setLoadingVideos(false); return; }

    fetch(`/api/youtube-search?q=${encodeURIComponent(name + " " + countryName + " travel")}`)
      .then((r) => r.json())
      .then((d) => { setVideos(d.videos || []); sessionStorage.setItem(cacheKey, JSON.stringify(d.videos || [])); })
      .catch(() => {})
      .finally(() => setLoadingVideos(false));
  }, [name, countryName]);

  // Fetch photos
  useEffect(() => {
    const cacheKey = `photos_${name}_${countryName}`;
    const cached = sessionStorage.getItem(cacheKey);
    if (cached) { setPhotos(JSON.parse(cached)); setLoadingPhotos(false); return; }

    fetch(`/api/wiki-images?q=${encodeURIComponent(name + " " + countryName)}`)
      .then((r) => r.json())
      .then((d) => { setPhotos(d.images || []); sessionStorage.setItem(cacheKey, JSON.stringify(d.images || [])); })
      .catch(() => {})
      .finally(() => setLoadingPhotos(false));
  }, [name, countryName]);

  // Lock body scroll
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = ""; };
  }, []);

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center" onClick={onClose}>
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" />

      <div className="relative bg-white w-full sm:max-w-2xl sm:rounded-2xl rounded-t-2xl max-h-[92vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}>

        {/* Hero */}
        <div className="relative h-48 sm:h-56 overflow-hidden sm:rounded-t-2xl">
          {imageUrl ? (
            <Image src={imageUrl} alt={name} fill className="object-cover" unoptimized sizes="100vw" />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center">
              <span className="text-6xl opacity-40">{categoryEmoji[category] || "📌"}</span>
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />

          <button onClick={onClose}
            className="absolute top-3 right-3 w-9 h-9 bg-black/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center hover:bg-black/50 transition-colors text-lg">
            &times;
          </button>

          <div className="absolute bottom-4 left-5 right-5">
            <span className="inline-block px-2.5 py-0.5 bg-white/20 backdrop-blur-sm text-white text-xs font-medium rounded-full mb-2">
              {categoryEmoji[category] || "📌"} {category}
            </span>
            <h2 className="text-2xl font-bold text-white drop-shadow-lg">{name}</h2>
            <p className="text-white/80 text-sm mt-0.5">{countryName}</p>
          </div>
        </div>

        <div className="p-5 space-y-6">
          <p className="text-gray-700 leading-relaxed">{description}</p>

          {/* AI Details */}
          {loadingDetails ? (
            <div className="flex items-center gap-2 py-3">
              <div className="w-4 h-4 border-2 border-teal-200 border-t-teal-500 rounded-full animate-spin" />
              <span className="text-sm text-gray-400">Loading details...</span>
            </div>
          ) : details ? (
            <>
              <div>
                <h3 className="font-semibold text-gray-900 mb-2">What to Expect</h3>
                <p className="text-sm text-gray-600 leading-relaxed">{details.whatToExpect}</p>
              </div>

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

              {details.tips.length > 0 && (
                <div>
                  <h3 className="font-semibold text-gray-900 mb-2">Traveler Tips</h3>
                  <div className="space-y-2">
                    {details.tips.map((tip, i) => (
                      <div key={i} className="flex gap-2 text-sm">
                        <span className="text-teal-500 flex-shrink-0">💡</span>
                        <p className="text-gray-600">{tip}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          ) : null}

          {/* Photo Gallery */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Photos</h3>
            {loadingPhotos ? (
              <div className="flex gap-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="w-24 h-24 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : photos.length > 0 ? (
              <>
                <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
                  {photos.map((photo, i) => (
                    <button key={i} onClick={() => setSelectedPhoto(photo.url)}
                      className="flex-shrink-0 relative w-28 h-28 rounded-xl overflow-hidden border-2 border-transparent hover:border-teal-500 transition-all">
                      <Image src={photo.url} alt={photo.caption || name} fill className="object-cover" unoptimized sizes="112px" />
                    </button>
                  ))}
                </div>
                {/* Full-size photo viewer */}
                {selectedPhoto && (
                  <div className="mt-3 relative rounded-xl overflow-hidden bg-gray-100">
                    <Image src={selectedPhoto} alt={name} width={600} height={400}
                      className="w-full h-auto max-h-72 object-contain" unoptimized />
                    <button onClick={() => setSelectedPhoto(null)}
                      className="absolute top-2 right-2 w-7 h-7 bg-black/40 text-white rounded-full flex items-center justify-center text-sm hover:bg-black/60">
                      &times;
                    </button>
                  </div>
                )}
              </>
            ) : (
              <a href={`https://www.google.com/search?q=${encodeURIComponent(name + " " + countryName)}&tbm=isch`}
                target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-50 text-blue-700 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors">
                📷 View photos on Google
              </a>
            )}
          </div>

          {/* YouTube Videos — embedded */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Videos</h3>
            {loadingVideos ? (
              <div className="space-y-3">
                {[1, 2].map((i) => (
                  <div key={i} className="h-20 bg-gray-100 rounded-xl animate-pulse" />
                ))}
              </div>
            ) : videos.length > 0 ? (
              <div className="space-y-3">
                {/* Embedded player */}
                {playingVideo && (
                  <div className="relative rounded-xl overflow-hidden bg-black aspect-video">
                    <iframe
                      src={`https://www.youtube-nocookie.com/embed/${playingVideo}?autoplay=1&rel=0`}
                      title="YouTube video"
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="absolute inset-0 w-full h-full"
                    />
                  </div>
                )}

                {/* Video list */}
                {videos.map((video) => (
                  <button key={video.videoId} onClick={() => setPlayingVideo(video.videoId)}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl transition-all text-left ${
                      playingVideo === video.videoId
                        ? "bg-red-50 border border-red-200"
                        : "bg-gray-50 hover:bg-gray-100 border border-transparent"
                    }`}>
                    {/* Thumbnail */}
                    <div className="relative w-28 h-16 flex-shrink-0 rounded-lg overflow-hidden bg-gray-200">
                      <Image src={video.thumbnail} alt={video.title} fill className="object-cover" unoptimized sizes="112px" />
                      {playingVideo !== video.videoId && (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <div className="w-8 h-8 bg-red-600/90 rounded-full flex items-center justify-center">
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z" /></svg>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-gray-900 line-clamp-2">{video.title}</p>
                      {video.channel && (
                        <p className="text-xs text-gray-500 mt-0.5">{video.channel}</p>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            ) : (
              <a href={youtubeSearchUrl} target="_blank" rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-red-50 text-red-700 rounded-xl text-sm font-medium hover:bg-red-100 transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M23.5 6.19a3.02 3.02 0 0 0-2.12-2.14C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.38.55A3.02 3.02 0 0 0 .5 6.19 31.6 31.6 0 0 0 0 12a31.6 31.6 0 0 0 .5 5.81 3.02 3.02 0 0 0 2.12 2.14c1.88.55 9.38.55 9.38.55s7.5 0 9.38-.55a3.02 3.02 0 0 0 2.12-2.14A31.6 31.6 0 0 0 24 12a31.6 31.6 0 0 0-.5-5.81z" />
                </svg>
                Search on YouTube
              </a>
            )}
          </div>

          {/* Quick links */}
          <div>
            <h3 className="font-semibold text-gray-900 mb-3">Explore More</h3>
            <div className="grid grid-cols-2 gap-2">
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
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
