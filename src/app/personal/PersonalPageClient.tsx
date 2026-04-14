"use client";

import { TravelPlanProvider } from "@/context/TravelPlanContext";
import PersonalDashboard from "@/components/personal/PersonalDashboard";

export default function PersonalPageClient() {
  return (
    <TravelPlanProvider>
      <PersonalDashboard />
    </TravelPlanProvider>
  );
}
