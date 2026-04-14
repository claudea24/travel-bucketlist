"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Country } from "@/lib/types";
import { getCountryByCode } from "@/lib/countries";
import { useBucketList } from "@/context/BucketListContext";
import StatusBadge from "@/components/shared/StatusBadge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import ActivitySection from "@/components/shared/ActivitySection";

interface CountryDetailProps {
  code: string;
}

export default function CountryDetail({ code }: CountryDetailProps) {
  const router = useRouter();
  const [country, setCountry] = useState<Country | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedActivities, setSelectedActivities] = useState<string[]>([]);
  const [showPlanOptions, setShowPlanOptions] = useState(false);
  const [manualStartDate, setManualStartDate] = useState("");
  const [manualEndDate, setManualEndDate] = useState("");
  const [creatingPlan, setCreatingPlan] = useState(false);
  const { items, dispatch } = useBucketList();

  const saved = items.find((i) => i.countryCode === code);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoading(true);
      const data = await getCountryByCode(code);
      if (!cancelled) {
        setCountry(data);
        setLoading(false);
      }
    }
    load();
    return () => { cancelled = true; };
  }, [code]);

  const handleSave = () => {
    if (!country) return;
    if (saved) {
      dispatch({ type: "REMOVE_ITEM", payload: { id: saved.id } });
    } else {
      dispatch({
        type: "ADD_ITEM",
        payload: {
          id: crypto.randomUUID(),
          countryCode: country.cca3,
          countryName: country.name.common,
          capital: country.capital?.[0] || "",
          region: country.region || "",
          subregion: country.subregion || "",
          flagUrl: country.flags?.svg || country.flags?.png || "",
          population: country.population || 0,
          status: "want_to_visit",
          notes: "",
        },
      });
    }
  };

  const saveToBucketListAsPlanning = () => {
    if (!country) return;
    if (!saved) {
      dispatch({
        type: "ADD_ITEM",
        payload: {
          id: crypto.randomUUID(), countryCode: country.cca3, countryName: country.name.common,
          capital: country.capital?.[0] || "", region: country.region || "",
          subregion: country.subregion || "", flagUrl: country.flags?.svg || country.flags?.png || "",
          population: country.population || 0, status: "planning", notes: "",
        },
      });
    } else if (saved.status === "want_to_visit") {
      dispatch({ type: "UPDATE_ITEM", payload: { id: saved.id, status: "planning" } });
    }
  };

  const handlePlanWithAI = () => {
    if (!country) return;
    saveToBucketListAsPlanning();
    localStorage.setItem(`plan_setup_${country.cca3}`, JSON.stringify({
      countryName: country.name.common, countryCode: country.cca3, selectedActivities,
    }));
    router.push(`/personal/plan/new?country=${country.cca3}&name=${encodeURIComponent(country.name.common)}`);
  };

  const handlePlanManually = async () => {
    if (!country) return;
    setCreatingPlan(true);
    saveToBucketListAsPlanning();

    try {
      const token = await fetch("/api/create-plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          countryCode: country.cca3,
          countryName: country.name.common,
          startDate: manualStartDate || null,
          endDate: manualEndDate || null,
          title: `Trip to ${country.name.common}`,
        }),
      });
      const data = await token.json();
      if (data.planId) {
        router.push(`/personal/plan/${data.planId}`);
      }
    } catch (e) {
      console.error("Failed to create plan:", e);
    }
    setCreatingPlan(false);
  };

  const handleActivitySelect = useCallback((activities: { name: string }[]) => {
    setSelectedActivities(activities.map((a) => a.name));
  }, []);

  if (loading) return <LoadingSpinner message="Loading country details..." />;

  if (!country) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500">Country not found.</p>
        <Link href="/" className="text-teal-600 hover:underline mt-2 inline-block">
          Back to Discover
        </Link>
      </div>
    );
  }

  const languages = country.languages ? Object.values(country.languages).join(", ") : "N/A";
  const currencies = country.currencies
    ? Object.values(country.currencies)
        .map((c) => `${c.name} (${c.symbol})`)
        .join(", ")
    : "N/A";

  return (
    <div>
      <Link href="/" className="text-sm text-gray-500 hover:text-teal-600 transition-colors">
        &larr; Back to Discover
      </Link>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Flag */}
        <div className="rounded-2xl overflow-hidden border border-gray-100 shadow-sm bg-white">
          {country.flags?.svg ? (
            <img
              src={country.flags.svg}
              alt={`${country.name.common} flag`}
              className="w-full h-auto"
            />
          ) : (
            <div className="h-64 bg-gray-50 flex items-center justify-center text-gray-400">
              No flag available
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{country.name.common}</h1>
          <p className="text-gray-500 mt-0.5">{country.name.official}</p>

          {/* Action buttons — Airbnb-style save + plan */}
          <div className="mt-4 flex flex-wrap gap-3">
            <button
              onClick={handleSave}
              className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                saved
                  ? "bg-rose-50 text-rose-600 hover:bg-rose-100 border border-rose-200"
                  : "bg-white text-gray-700 hover:bg-gray-50 border border-gray-200 shadow-sm"
              }`}
            >
              <span className="text-lg">{saved ? "♥" : "♡"}</span>
              {saved ? "Saved" : "Save"}
            </button>

            <div className="relative">
              <button
                onClick={() => setShowPlanOptions(!showPlanOptions)}
                className="flex items-center gap-2 px-5 py-2.5 bg-teal-500 text-white rounded-xl text-sm font-medium hover:bg-teal-600 shadow-sm transition-all"
              >
                ✈️ Plan My Trip
              </button>

              {showPlanOptions && (
                <div className="absolute top-full left-0 mt-2 w-80 bg-white rounded-2xl border border-gray-200 shadow-xl z-20 overflow-hidden">
                  {/* AI option */}
                  <button onClick={handlePlanWithAI}
                    className="w-full p-4 text-left hover:bg-teal-50 transition-colors border-b border-gray-100">
                    <div className="flex items-center gap-3">
                      <span className="text-2xl">✨</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Plan with AI</p>
                        <p className="text-xs text-gray-500">AI generates a full itinerary based on your interests</p>
                      </div>
                    </div>
                  </button>

                  {/* Manual option */}
                  <div className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="text-2xl">📝</span>
                      <div>
                        <p className="font-semibold text-gray-900 text-sm">Plan Manually</p>
                        <p className="text-xs text-gray-500">Create an empty plan and add activities yourself</p>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">Start Date</label>
                        <input type="date" value={manualStartDate} onChange={(e) => setManualStartDate(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">End Date</label>
                        <input type="date" value={manualEndDate} onChange={(e) => setManualEndDate(e.target.value)}
                          className="w-full px-3 py-2 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-teal-500" />
                      </div>
                    </div>
                    <button onClick={handlePlanManually} disabled={creatingPlan}
                      className="w-full py-2.5 bg-teal-500 text-white text-sm font-medium rounded-xl hover:bg-teal-600 disabled:opacity-50 transition-colors">
                      {creatingPlan ? "Creating..." : "Create Plan"}
                    </button>
                  </div>

                  {/* Close */}
                  <button onClick={() => setShowPlanOptions(false)}
                    className="w-full py-2 text-xs text-gray-400 hover:text-gray-600 border-t border-gray-100">
                    Cancel
                  </button>
                </div>
              )}
            </div>

            {saved && (
              <div className="flex items-center gap-2">
                <StatusBadge status={saved.status} />
              </div>
            )}
          </div>

          {/* Status selector (only when saved) */}
          {saved && (
            <div className="mt-3 flex gap-1.5">
              {(["want_to_visit", "planning", "visited"] as const).map((s) => (
                <button
                  key={s}
                  onClick={() => dispatch({ type: "UPDATE_ITEM", payload: { id: saved.id, status: s } })}
                  className={`text-xs px-3 py-1.5 rounded-full transition-all ${
                    saved.status === s
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
          )}

          {/* Info grid */}
          <div className="mt-6 bg-white rounded-2xl border border-gray-100 shadow-sm p-5 space-y-3">
            <InfoRow label="Capital" value={country.capital?.join(", ") || "N/A"} />
            <InfoRow label="Region" value={country.region} />
            <InfoRow label="Subregion" value={country.subregion || "N/A"} />
            <InfoRow label="Population" value={country.population?.toLocaleString() || "N/A"} />
            <InfoRow label="Area" value={country.area ? `${country.area.toLocaleString()} km²` : "N/A"} />
            <InfoRow label="Continents" value={country.continents?.join(", ") || "N/A"} />
            <InfoRow label="Languages" value={languages} />
            <InfoRow label="Currencies" value={currencies} />
          </div>

          {/* Quick links */}
          <div className="mt-4 flex gap-2">
            <a
              href={`https://www.airbnb.com/s/${encodeURIComponent(country.name.common)}/homes`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-rose-50 text-rose-600 rounded-xl text-sm font-medium hover:bg-rose-100 transition-colors"
            >
              🏠 Browse Airbnb
            </a>
            <a
              href={`https://www.google.com/travel/hotels/${encodeURIComponent(country.name.common)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-blue-50 text-blue-600 rounded-xl text-sm font-medium hover:bg-blue-100 transition-colors"
            >
              🏨 Find Hotels
            </a>
            <a
              href={`https://www.google.com/travel/flights?q=flights+to+${encodeURIComponent(country.name.common)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-sky-50 text-sky-600 rounded-xl text-sm font-medium hover:bg-sky-100 transition-colors"
            >
              ✈️ Flights
            </a>
          </div>
        </div>
      </div>

      {/* Things to Do */}
      <ActivitySection
        countryName={country.name.common}
        countryCode={country.cca3}
        onSelectActivities={handleActivitySelect}
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex gap-3">
      <span className="text-sm font-medium text-gray-400 w-28 shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}
