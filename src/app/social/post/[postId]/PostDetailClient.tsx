"use client";

import Link from "next/link";
import { SocialProvider } from "@/context/SocialContext";
import PostDetail from "@/components/social/PostDetail";

export default function PostDetailClient({ postId }: { postId: string }) {
  return (
    <SocialProvider>
      <Link href="/social" className="text-sm text-gray-500 hover:text-teal-600 transition-colors mb-4 inline-block">
        &larr; Back to Community
      </Link>
      <PostDetail postId={postId} />
    </SocialProvider>
  );
}
