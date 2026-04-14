"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useSession, useUser } from "@clerk/nextjs";
import Link from "next/link";
import { TravelPlan, ItineraryItem, PlanAccommodation } from "@/lib/types";
import { createClerkSupabaseClient } from "@/lib/supabase";
import { planFromRow, itineraryItemFromRow, accommodationFromRow } from "@/lib/mappers/travelPlan";
import { TravelPlanProvider, useTravelPlans } from "@/context/TravelPlanContext";
import { useBucketList } from "@/context/BucketListContext";
import SavedPlanEditor from "@/components/personal/SavedPlanEditor";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

function PlanLoader({ planId }: { planId: string }) {
  const router = useRouter();
  const { session } = useSession();
  const { user } = useUser();
  const { dispatch, itineraryItems, accommodations, plans: allPlans } = useTravelPlans();
  const { items: bucketItems, dispatch: bucketDispatch } = useBucketList();
  const [plan, setPlan] = useState<TravelPlan | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const getToken = useCallback(
    () => session?.getToken({ template: "supabase" }) ?? Promise.resolve(null),
    [session]
  );

  // Fetch plan + seed context
  useEffect(() => {
    if (!session || !user) return;
    let cancelled = false;

    async function loadPlan() {
      setLoading(true);
      const client = createClerkSupabaseClient(getToken);

      const { data: planData, error: planErr } = await client
        .from("travel_plans").select("*").eq("id", planId).maybeSingle();

      if (cancelled) return;
      if (planErr || !planData) { setError("Trip not found"); setLoading(false); return; }

      const loadedPlan = planFromRow(planData as Record<string, unknown>);
      setPlan(loadedPlan);

      const [itemsRes, accomsRes] = await Promise.all([
        client.from("itinerary_items").select("*").eq("travel_plan_id", planId).order("day_number").order("sort_order"),
        client.from("plan_accommodations").select("*").eq("travel_plan_id", planId).order("sort_order"),
      ]);

      if (!cancelled) {
        const loadedItems = (itemsRes.data || []).map((r) => itineraryItemFromRow(r as Record<string, unknown>));
        const loadedAccoms = (accomsRes.data || []).map((r) => accommodationFromRow(r as Record<string, unknown>));
        // Seed context so dispatch works
        dispatch({ type: "SET_ITINERARY", payload: { planId, items: loadedItems } });
        dispatch({ type: "SET_ACCOMMODATIONS", payload: { planId, items: loadedAccoms } });
        setLoading(false);
      }
    }

    loadPlan();
    return () => { cancelled = true; };
  }, [session, user, planId, getToken, dispatch]);

  // Listen to context for live updates
  const items = itineraryItems[planId] || [];
  const accoms = accommodations[planId] || [];

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
    <SavedPlanEditor plan={plan} items={items} accoms={accoms}
      onDelete={() => {
        dispatch({ type: "DELETE_PLAN", payload: { id: plan.id } });
        const otherPlans = allPlans.filter((p) => p.countryCode === plan.countryCode && p.id !== plan.id);
        if (otherPlans.length === 0) {
          const bi = bucketItems.find((i) => i.countryCode === plan.countryCode && i.status === "planning");
          if (bi) bucketDispatch({ type: "UPDATE_ITEM", payload: { id: bi.id, status: "want_to_visit" } });
        }
        router.push("/personal");
      }} />
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
