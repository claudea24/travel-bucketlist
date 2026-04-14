"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { TravelPlanProvider, useTravelPlans } from "@/context/TravelPlanContext";
import SavedPlanEditor from "@/components/personal/SavedPlanEditor";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

function PlanLoader({ planId }: { planId: string }) {
  const router = useRouter();
  const { plans, itineraryItems, accommodations, isLoading, fetchItinerary, fetchAccommodations } = useTravelPlans();
  const [loaded, setLoaded] = useState(false);
  const plan = plans.find((p) => p.id === planId);
  const items = itineraryItems[planId] || [];
  const accoms = accommodations[planId] || [];

  useEffect(() => {
    if (plan && !loaded) {
      Promise.all([fetchItinerary(planId), fetchAccommodations(planId)]).then(() => setLoaded(true));
    }
  }, [plan, planId, loaded, fetchItinerary, fetchAccommodations]);

  if (isLoading || (!plan && !loaded)) return <LoadingSpinner message="Loading your trip..." />;

  if (!plan) {
    return (
      <div className="text-center py-20">
        <p className="text-gray-500 mb-3">Trip not found.</p>
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
