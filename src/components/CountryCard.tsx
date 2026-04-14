"use client";

import Link from "next/link";
import { Country } from "@/lib/types";
import { useBucketList } from "@/context/BucketListContext";

interface CountryCardProps {
  country: Country;
}

export default function CountryCard({ country }: CountryCardProps) {
  const { items, dispatch } = useBucketList();
  const saved = items.find((i) => i.countryCode === country.cca3);

  function handleSave() {
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

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-md transition-shadow bg-white">
      <Link href={`/country/${country.cca3}`}>
        <div className="relative h-40 bg-gray-100 flex items-center justify-center">
          {country.flags?.svg ? (
            <img
              src={country.flags.svg}
              alt={`${country.name.common} flag`}
              className="w-full h-full object-cover"
            />
          ) : (
            <span className="text-gray-400 text-sm">No flag</span>
          )}
        </div>
      </Link>
      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <Link href={`/country/${country.cca3}`}>
            <h3 className="font-semibold text-gray-900 hover:text-emerald-600 transition-colors">
              {country.name.common}
            </h3>
          </Link>
          <button
            onClick={handleSave}
            className={`shrink-0 text-xl transition-colors ${
              saved ? "text-red-500 hover:text-red-600" : "text-gray-300 hover:text-red-400"
            }`}
            title={saved ? "Remove from bucket list" : "Add to bucket list"}
          >
            {saved ? "♥" : "♡"}
          </button>
        </div>
        <p className="text-sm text-gray-500 mt-1">
          {country.capital?.[0] || "N/A"}
        </p>
        <div className="flex gap-2 mt-2">
          <span className="text-xs px-2 py-0.5 bg-emerald-50 text-emerald-700 rounded-full">
            {country.region}
          </span>
          {country.subregion && (
            <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-600 rounded-full">
              {country.subregion}
            </span>
          )}
        </div>
        <p className="text-xs text-gray-400 mt-2">
          Pop: {country.population?.toLocaleString() || "N/A"}
        </p>
      </div>
    </div>
  );
}
