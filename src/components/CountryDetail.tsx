"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Country } from "@/lib/types";
import { getCountryByCode } from "@/lib/countries";
import { useBucketList } from "@/context/BucketListContext";

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

  if (loading) {
    return <div className="text-center py-12 text-gray-500">Loading country details...</div>;
  }

  if (!country) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Country not found.</p>
        <Link href="/" className="text-emerald-600 hover:underline mt-2 inline-block">
          Back to Explore
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
      {/* Back link */}
      <Link href="/" className="text-sm text-gray-500 hover:text-emerald-600 transition-colors">
        &larr; Back to Explore
      </Link>

      <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Flag */}
        <div className="rounded-lg overflow-hidden border border-gray-200">
          {country.flags?.svg ? (
            <img
              src={country.flags.svg}
              alt={`${country.name.common} flag`}
              className="w-full h-auto"
            />
          ) : (
            <div className="h-64 bg-gray-100 flex items-center justify-center text-gray-400">
              No flag available
            </div>
          )}
        </div>

        {/* Details */}
        <div>
          <div className="flex items-start justify-between gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{country.name.common}</h1>
              <p className="text-gray-500 mt-1">{country.name.official}</p>
            </div>
            <button
              onClick={handleSave}
              className={`shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                saved
                  ? "bg-red-50 text-red-600 hover:bg-red-100"
                  : "bg-emerald-600 text-white hover:bg-emerald-700"
              }`}
            >
              {saved ? "Remove from Bucket List" : "Add to Bucket List"}
            </button>
          </div>

          {saved && (
            <div className="mt-3 flex items-center gap-2">
              <span className="text-sm text-gray-500">Status:</span>
              <button
                onClick={() =>
                  dispatch({
                    type: "UPDATE_ITEM",
                    payload: {
                      id: saved.id,
                      status: saved.status === "want_to_visit" ? "visited" : "want_to_visit",
                    },
                  })
                }
                className={`text-xs px-3 py-1 rounded-full font-medium cursor-pointer ${
                  saved.status === "visited"
                    ? "bg-blue-100 text-blue-700 hover:bg-blue-200"
                    : "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                }`}
              >
                {saved.status === "visited" ? "Visited" : "Want to Visit"}
              </button>
            </div>
          )}

          <div className="mt-6 space-y-3">
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
      <span className="text-sm font-medium text-gray-500 w-28 shrink-0">{label}</span>
      <span className="text-sm text-gray-900">{value}</span>
    </div>
  );
}
