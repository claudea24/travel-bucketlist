"use client";

import { ReactNode } from "react";
import { BucketListProvider } from "@/context/BucketListContext";
import { ProfileProvider } from "@/context/ProfileContext";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return (
    <ProfileProvider>
      <BucketListProvider>
        {children}
      </BucketListProvider>
    </ProfileProvider>
  );
}
