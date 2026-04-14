"use client";

import Link from "next/link";
import { TravelPlanProvider } from "@/context/TravelPlanContext";
import TripPlanner from "@/components/personal/TripPlanner";

export default function TripPlannerClient({ planId }: { planId: string }) {
  return (
    <TravelPlanProvider>
      <Link href="/personal" className="text-sm text-gray-500 hover:text-teal-600 transition-colors mb-4 inline-block">
        &larr; Back to My Trips
      </Link>
      <TripPlanner planId={planId} />
    </TravelPlanProvider>
  );
}
