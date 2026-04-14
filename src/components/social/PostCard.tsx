"use client";

import Link from "next/link";
import Image from "next/image";
import { SocialPost } from "@/lib/types";
import UserAvatar from "@/components/shared/UserAvatar";
import { useSocial } from "@/context/SocialContext";

export default function PostCard({ post }: { post: SocialPost }) {
  const { dispatch } = useSocial();

  const handleLike = (e: React.MouseEvent) => {
    e.preventDefault();
    dispatch({ type: "TOGGLE_LIKE", payload: { postId: post.id, liked: !post.isLikedByMe } });
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <Link href={`/social/post/${post.id}`} className="block">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden hover:shadow-md transition-all">
        {/* Photo */}
        {post.photoUrls.length > 0 && (
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image
              src={post.photoUrls[0]}
              alt={post.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, 50vw"
            />
          </div>
        )}

        <div className="p-4">
          {/* Author */}
          <div className="flex items-center gap-2.5 mb-3">
            <UserAvatar
              avatarUrl={post.author?.avatarUrl || null}
              displayName={post.author?.displayName || "Traveler"}
              size="sm"
            />
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 truncate">
                {post.author?.displayName || "Traveler"}
              </p>
              <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
            </div>
            <span
              className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                post.postType === "story"
                  ? "bg-violet-50 text-violet-700"
                  : "bg-teal-50 text-teal-700"
              }`}
            >
              {post.postType === "story" ? "Story" : "Tip"}
            </span>
          </div>

          {/* Content */}
          <h3 className="font-semibold text-gray-900 mb-1">{post.title}</h3>
          <p className="text-sm text-gray-500 line-clamp-2">{post.content}</p>

          {/* Country tag */}
          {post.countryName && (
            <div className="mt-2">
              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded-full">
                📍 {post.countryName}
              </span>
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center gap-4 mt-3 pt-3 border-t border-gray-50">
            <button
              onClick={handleLike}
              className={`flex items-center gap-1.5 text-sm transition-colors ${
                post.isLikedByMe ? "text-rose-500" : "text-gray-400 hover:text-rose-500"
              }`}
            >
              {post.isLikedByMe ? "♥" : "♡"} {post.likesCount}
            </button>
            <span className="flex items-center gap-1.5 text-sm text-gray-400">
              💬 {post.commentsCount}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
