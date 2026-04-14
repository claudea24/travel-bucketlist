"use client";

import { SocialProvider } from "@/context/SocialContext";
import CreatePostForm from "@/components/social/CreatePostForm";

export default function CreatePostClient() {
  return (
    <SocialProvider>
      <CreatePostForm />
    </SocialProvider>
  );
}
