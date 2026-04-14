"use client";

import { ReactNode } from "react";
import { BucketListProvider } from "@/context/BucketListContext";
import { ProfileProvider } from "@/context/ProfileContext";
import { TravelPlanProvider } from "@/context/TravelPlanContext";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ProfileProvider>
      <BucketListProvider>
        <TravelPlanProvider>
          {children}
        </TravelPlanProvider>
      </BucketListProvider>
    </ProfileProvider>
  );
}
