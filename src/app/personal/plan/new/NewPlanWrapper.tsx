"use client";

import { TravelPlanProvider } from "@/context/TravelPlanContext";
import NewPlanClient from "./NewPlanClient";

export default function NewPlanWrapper() {
  return (
    <TravelPlanProvider>
      <NewPlanClient />
    </TravelPlanProvider>
  );
}
