"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Country } from "@/lib/types";
import { getCountryByCode } from "@/lib/countries";
import { useBucketList } from "@/context/BucketListContext";
import StatusBadge from "@/components/shared/StatusBadge";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

interface CountryDetailProps {
  code: string;
}

export default function CountryDetail({ code }: CountryDetailProps) {
  const [country, setCountry] = useState<Country | null>(null);
  const [loading, setLoading] = useState(true);
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

  function handleSave() {
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
  }

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
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 tracking-tight">{country.name.common}</h1>
              <p className="text-gray-500 mt-0.5">{country.name.official}</p>
            </div>
          </div>

          {/* Action buttons */}
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <button
              onClick={handleSave}
              className={`px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                saved
                  ? "bg-rose-50 text-rose-600 hover:bg-rose-100"
                  : "bg-teal-500 text-white hover:bg-teal-600 shadow-sm"
              }`}
            >
              {saved ? "♥ Remove from Bucket List" : "♡ Add to Bucket List"}
            </button>

            {saved && (
              <div className="flex items-center gap-2">
                <StatusBadge status={saved.status} />
                {(["want_to_visit", "planning", "visited"] as const).map((s) => (
                  <button
                    key={s}
                    onClick={() => dispatch({ type: "UPDATE_ITEM", payload: { id: saved.id, status: s } })}
                    className={`text-xs px-2.5 py-1 rounded-full transition-all ${
                      saved.status === s
                        ? "ring-2 ring-teal-500 ring-offset-1"
                        : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                    }`}
                  >
                    {s === "want_to_visit" ? "Want" : s === "planning" ? "Planning" : "Visited"}
                  </button>
                ))}
              </div>
            )}
          </div>

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
        </div>
      </div>
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
