"use client";

import { useState, useEffect } from "react";
import { Country } from "@/lib/types";
import { searchCountries, getAllCountries, getCountriesByRegion, REGIONS } from "@/lib/countries";
import CountryCard from "./CountryCard";

export default function ExploreCountries() {
  const [query, setQuery] = useState("");
  const [region, setRegion] = useState("");
  const [countries, setCountries] = useState<Country[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      setLoading(true);

      let results: Country[];
      if (query.trim()) {
        results = await searchCountries(query);
      } else if (region) {
        results = await getCountriesByRegion(region);
      } else {
        results = await getAllCountries();
      }

      if (!cancelled) {
        // Sort alphabetically
        results.sort((a, b) => a.name.common.localeCompare(b.name.common));
        setCountries(results);
        setLoading(false);
      }
    }

    const timeout = setTimeout(load, 300); // debounce
    return () => {
      cancelled = true;
      clearTimeout(timeout);
    };
  }, [query, region]);

  return (
    <div>
      {/* Search + Filter */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search countries..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setRegion(""); // clear region filter when searching
          }}
          className="flex-1 px-4 py-2.5 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent text-sm"
        />
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={() => { setRegion(""); setQuery(""); }}
            className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
              !region && !query
                ? "bg-emerald-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            All
          </button>
          {REGIONS.map((r) => (
            <button
              key={r}
              onClick={() => { setRegion(r); setQuery(""); }}
              className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                region === r
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {r}
            </button>
          ))}
        </div>
      </div>

      {/* Results */}
      {loading ? (
        <div className="text-center py-12 text-gray-500">Loading countries...</div>
      ) : countries.length === 0 ? (
        <div className="text-center py-12 text-gray-500">
          No countries found. Try a different search.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {countries.map((country) => (
            <CountryCard key={country.cca3} country={country} />
          ))}
        </div>
      )}
    </div>
  );
}
