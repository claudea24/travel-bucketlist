"use client";

import { useState } from "react";
import Link from "next/link";
import { useSocial } from "@/context/SocialContext";
import PostCard from "./PostCard";
import LoadingSpinner from "@/components/shared/LoadingSpinner";
import EmptyState from "@/components/shared/EmptyState";

const TABS = [
  { value: "all", label: "All" },
  { value: "story", label: "Stories" },
  { value: "tip", label: "Tips" },
  { value: "following", label: "Following" },
] as const;

export default function SocialFeed() {
  const { feedPosts, following, isLoadingFeed } = useSocial();
  const [tab, setTab] = useState("all");

  const filtered = feedPosts.filter((post) => {
    if (tab === "all") return true;
    if (tab === "following") return following.includes(post.userId);
    return post.postType === tab;
  });

  return (
    <div className="space-y-6">
      {/* Header with create button */}
      <div className="flex items-center justify-between">
        <div className="flex gap-1 bg-gray-100 rounded-xl p-1 flex-1 mr-4">
          {TABS.map((t) => (
            <button
              key={t.value}
              onClick={() => setTab(t.value)}
              className={`flex-1 py-2 text-sm font-medium rounded-lg transition-all ${
                tab === t.value
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
        <Link
          href="/social/create"
          className="px-4 py-2.5 bg-teal-500 text-white text-sm font-medium rounded-xl hover:bg-teal-600 transition-colors whitespace-nowrap"
        >
          + Post
        </Link>
      </div>

      {/* Feed */}
      {isLoadingFeed ? (
        <LoadingSpinner message="Loading community posts..." />
      ) : filtered.length === 0 ? (
        <EmptyState
          icon="✍️"
          title={tab === "following" ? "No posts from people you follow" : "No posts yet"}
          description={
            tab === "following"
              ? "Follow other travelers to see their stories here."
              : "Be the first to share your travel story!"
          }
          actionLabel="Create Post"
          actionHref="/social/create"
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {filtered.map((post) => (
            <PostCard key={post.id} post={post} />
          ))}
        </div>
      )}
    </div>
  );
}
