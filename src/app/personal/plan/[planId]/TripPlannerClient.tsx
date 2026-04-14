"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { TravelPlan, ItineraryItem, PlanAccommodation } from "@/lib/types";
import { createClerkSupabaseClient } from "@/lib/supabase";
import { planFromRow, itineraryItemFromRow, accommodationFromRow } from "@/lib/mappers/travelPlan";
import { TravelPlanProvider } from "@/context/TravelPlanContext";
import SavedPlanEditor from "@/components/personal/SavedPlanEditor";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

function PlanLoader({ planId }: { planId: string }) {
  const router = useRouter();
  const { session } = useSession();
  const { user } = useUser();
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [items, setItems] = useState<ItineraryItem[]>([]);
  const [accoms, setAccoms] = useState<PlanAccommodation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getToken = useCallback(
    () => session?.getToken({ template: "supabase" }) ?? Promise.resolve(null),
    [session]
  );

  useEffect(() => {
    if (!session || !user) return;

    let cancelled = false;

    async function loadPlan() {
      setLoading(true);
      const client = createClerkSupabaseClient(getToken);

      // Fetch plan
      const { data: planData, error: planErr } = await client
        .from("travel_plans")
        .select("*")
        .eq("id", planId)
        .maybeSingle();

      if (cancelled) return;
      if (planErr || !planData) {
        setError("Trip not found");
        setLoading(false);
        return;
      }
      setPlan(planFromRow(planData as Record<string, unknown>));

      // Fetch items + accommodations in parallel
      const [itemsRes, accomsRes] = await Promise.all([
        client.from("itinerary_items").select("*").eq("travel_plan_id", planId)
          .order("day_number").order("sort_order"),
        client.from("plan_accommodations").select("*").eq("travel_plan_id", planId)
          .order("sort_order"),
      ]);

      if (!cancelled) {
        setItems((itemsRes.data || []).map((r) => itineraryItemFromRow(r as Record<string, unknown>)));
        setAccoms((accomsRes.data || []).map((r) => accommodationFromRow(r as Record<string, unknown>)));
        setLoading(false);
      }
    }

    loadPlan();
    return () => { cancelled = true; };
  }, [session, user, planId, getToken]);

  if (loading) return <LoadingSpinner message="Loading your trip..." />;

  if (error || !plan) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-3">{error || "Trip not found."}</p>
        <Link href="/personal" className="text-teal-600 hover:underline">Back to My Trips</Link>
      </div>
    );
  }

  return (
    <SavedPlanEditor
      plan={plan}
      items={items}
      accoms={accoms}
      onDelete={() => router.push("/personal")}
    />
  );
}

export default function TripPlannerClient({ planId }: { planId: string }) {
  return (
    <TravelPlanProvider>
      <Link href="/personal" className="text-sm text-gray-500 hover:text-teal-600 transition-colors mb-4 inline-block">
        &larr; Back to My Trips
      </Link>
      <PlanLoader planId={planId} />
    </TravelPlanProvider>
  );
}
