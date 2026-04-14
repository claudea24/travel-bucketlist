"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useSocial } from "@/context/SocialContext";

export default function CreatePostForm() {
  const router = useRouter();
  const { createPost } = useSocial();
  const [postType, setPostType] = useState<"story" | "tip">("story");
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [countryName, setCountryName] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || !content.trim()) return;
    setIsSubmitting(true);

    const post = await createPost({
      postType,
      title: title.trim(),
      content: content.trim(),
      countryName: countryName.trim() || null,
      countryCode: null,
      photoUrls: photoUrl.trim() ? [photoUrl.trim()] : [],
      tags: [],
    });

    if (post) {
      router.push("/social");
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-5">
      {/* Post type */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Post Type</label>
        <div className="flex gap-2">
          {(["story", "tip"] as const).map((type) => (
            <button
              key={type}
              onClick={() => setPostType(type)}
              className={`flex-1 py-3 rounded-xl text-sm font-medium transition-all ${
                postType === type
                  ? type === "story"
                    ? "bg-violet-500 text-white"
                    : "bg-teal-500 text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              {type === "story" ? "📸 Travel Story" : "💡 Travel Tip"}
            </button>
          ))}
        </div>
      </div>

      {/* Title */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Title</label>
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder={postType === "story" ? "My amazing trip to..." : "Pro tip for traveling in..."}
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      {/* Country */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Country (optional)</label>
        <input
          value={countryName}
          onChange={(e) => setCountryName(e.target.value)}
          placeholder="e.g. Japan, Italy, Thailand..."
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      {/* Photo URL */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Photo URL (optional)</label>
        <input
          value={photoUrl}
          onChange={(e) => setPhotoUrl(e.target.value)}
          placeholder="https://example.com/photo.jpg"
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent"
        />
      </div>

      {/* Content */}
      <div>
        <label className="text-sm font-medium text-gray-700 mb-2 block">Content</label>
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          rows={6}
          placeholder={
            postType === "story"
              ? "Tell us about your experience..."
              : "Share your travel tip or advice..."
          }
          className="w-full px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent resize-none"
        />
      </div>

      {/* Submit */}
      <div className="flex gap-3">
        <button
          onClick={handleSubmit}
          disabled={!title.trim() || !content.trim() || isSubmitting}
          className="flex-1 py-3 bg-teal-500 text-white text-sm font-medium rounded-xl hover:bg-teal-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "Posting..." : "Publish"}
        </button>
        <button
          onClick={() => router.back()}
          className="px-6 py-3 bg-gray-100 text-gray-600 text-sm font-medium rounded-xl hover:bg-gray-200 transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
