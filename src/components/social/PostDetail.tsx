"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { useSocial } from "@/context/SocialContext";
import { PostComment } from "@/lib/types";
import UserAvatar from "@/components/shared/UserAvatar";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function PostDetail({ postId }: { postId: string }) {
  const { feedPosts, dispatch, fetchComments } = useSocial();
  const post = feedPosts.find((p) => p.id === postId);
  const [comments, setComments] = useState<PostComment[]>([]);
  const [loadingComments, setLoadingComments] = useState(true);
  const [newComment, setNewComment] = useState("");

  useEffect(() => {
    async function load() {
      setLoadingComments(true);
      const data = await fetchComments(postId);
      setComments(data);
      setLoadingComments(false);
    }
    load();
  }, [postId, fetchComments]);

  if (!post) return <div className="text-center py-20 text-gray-500">Post not found</div>;

  const handleLike = () => {
    dispatch({ type: "TOGGLE_LIKE", payload: { postId: post.id, liked: !post.isLikedByMe } });
  };

  const handleAddComment = () => {
    if (!newComment.trim()) return;
    const comment: PostComment = {
      id: crypto.randomUUID(),
      postId: post.id,
      userId: "",
      content: newComment.trim(),
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    dispatch({ type: "ADD_COMMENT", payload: { postId: post.id, comment } });
    setComments((prev) => [...prev, comment]);
    setNewComment("");
  };

  const timeAgo = (date: string) => {
    const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
    if (seconds < 60) return "just now";
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
    if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
    return `${Math.floor(seconds / 86400)}d ago`;
  };

  return (
    <div className="space-y-6">
      {/* Post */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
        {post.photoUrls.length > 0 && (
          <div className="relative aspect-[16/9] overflow-hidden">
            <Image src={post.photoUrls[0]} alt={post.title} fill className="object-cover" sizes="100vw" />
          </div>
        )}

        <div className="p-5">
          {/* Author */}
          <div className="flex items-center gap-3 mb-4">
            <UserAvatar
              avatarUrl={post.author?.avatarUrl || null}
              displayName={post.author?.displayName || "Traveler"}
              size="md"
            />
            <div>
              <p className="font-medium text-gray-900">{post.author?.displayName || "Traveler"}</p>
              <p className="text-xs text-gray-400">{timeAgo(post.createdAt)}</p>
            </div>
            <span
              className={`ml-auto text-xs px-2.5 py-1 rounded-full font-medium ${
                post.postType === "story" ? "bg-violet-50 text-violet-700" : "bg-teal-50 text-teal-700"
              }`}
            >
              {post.postType === "story" ? "Story" : "Tip"}
            </span>
          </div>

          <h1 className="text-xl font-bold text-gray-900 mb-2">{post.title}</h1>

          {post.countryName && (
            <span className="inline-block text-xs bg-gray-100 text-gray-600 px-2.5 py-1 rounded-full mb-3">
              📍 {post.countryName}
            </span>
          )}

          <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">{post.content}</p>

          {/* Like */}
          <div className="flex items-center gap-4 mt-5 pt-4 border-t border-gray-100">
            <button
              onClick={handleLike}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                post.isLikedByMe
                  ? "bg-rose-50 text-rose-600"
                  : "bg-gray-50 text-gray-500 hover:bg-rose-50 hover:text-rose-600"
              }`}
            >
              {post.isLikedByMe ? "♥" : "♡"} {post.likesCount} {post.likesCount === 1 ? "like" : "likes"}
            </button>
            <span className="text-sm text-gray-400">
              💬 {post.commentsCount} {post.commentsCount === 1 ? "comment" : "comments"}
            </span>
          </div>
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="font-semibold text-gray-900 mb-4">Comments</h2>

        {/* Add comment */}
        <div className="flex gap-2 mb-4">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            placeholder="Write a comment..."
            className="flex-1 px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
            onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
          />
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="px-4 py-2.5 bg-teal-500 text-white text-sm rounded-xl hover:bg-teal-600 disabled:opacity-50 transition-colors"
          >
            Post
          </button>
        </div>

        {/* Comment list */}
        {loadingComments ? (
          <LoadingSpinner message="Loading comments..." />
        ) : comments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-6">No comments yet. Be the first!</p>
        ) : (
          <div className="space-y-3">
            {comments.map((comment) => (
              <div key={comment.id} className="flex gap-3">
                <UserAvatar
                  avatarUrl={comment.author?.avatarUrl || null}
                  displayName={comment.author?.displayName || "User"}
                  size="sm"
                />
                <div className="flex-1 bg-gray-50 rounded-xl px-3.5 py-2.5">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-gray-900">
                      {comment.author?.displayName || "User"}
                    </span>
                    <span className="text-xs text-gray-400">{timeAgo(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-gray-700 mt-0.5">{comment.content}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
