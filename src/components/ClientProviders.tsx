"use client";

import { ReactNode } from "react";
import { BucketListProvider } from "@/context/BucketListContext";

export default function ClientProviders({ children }: { children: ReactNode }) {
  return <BucketListProvider>{children}</BucketListProvider>;
}
