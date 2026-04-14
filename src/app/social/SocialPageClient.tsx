"use client";

import { SocialProvider } from "@/context/SocialContext";
import SocialFeed from "@/components/social/SocialFeed";

export default function SocialPageClient() {
  return (
    <SocialProvider>
      <SocialFeed />
    </SocialProvider>
  );
}
