"use client";

import { useState, useEffect } from "react";
import { useSession } from "@clerk/nextjs";
import { Destination } from "@/lib/types";
import { createClerkSupabaseClient } from "@/lib/supabase";
import { destinationFromRow } from "@/lib/mappers/destination";
import CategoryFilter from "./CategoryFilter";
import DestinationCard from "./DestinationCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";

export default function HomeFeed() {
  const { session } = useSession();
  const [destinations, setDestinations] = useState<Destination[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!session) return;

    let cancelled = false;

    async function fetchDestinations() {
      setLoading(true);
      const client = createClerkSupabaseClient(() =>
        session!.getToken({ template: "supabase" })
      );

      let query = client
        .from("destinations")
        .select("*")
        .order("popularity_score", { ascending: false });

      if (category !== "all") {
        query = query.eq("category", category);
      }

      if (search.trim()) {
        query = query.or(
          `title.ilike.%${search.trim()}%,country_name.ilike.%${search.trim()}%`
        );
      }

      const { data, error } = await query;

      if (!cancelled && !error && data) {
        setDestinations(data.map((row) => destinationFromRow(row as Record<string, unknown>)));
      }
      if (!cancelled) setLoading(false);
    }

    fetchDestinations();
    return () => { cancelled = true; };
  }, [session, category, search]);

  return (
    <div className="space-y-6">
      {/* Search */}
      <div className="relative">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search destinations..."
          className="w-full px-5 py-3 bg-white border border-gray-200 rounded-2xl text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent shadow-sm"
        />
        <span className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <circle cx="11" cy="11" r="8" />
            <line x1="21" y1="21" x2="16.65" y2="16.65" />
          </svg>
        </span>
      </div>

      {/* Category filter */}
      <CategoryFilter selected={category} onChange={setCategory} />

      {/* Destination grid */}
      {loading ? (
        <LoadingSpinner message="Discovering destinations..." />
      ) : destinations.length === 0 ? (
        <EmptyState
          icon="🗺️"
          title="No destinations found"
          description="Try a different category or search term."
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {destinations.map((dest) => (
            <DestinationCard key={dest.id} destination={dest} />
          ))}
        </div>
      )}
    </div>
  );
}
