"use client";

import { createContext, useContext, useCallback, useEffect, useState, ReactNode, useMemo, useRef } from "react";
import { useSession, useUser } from "@clerk/nextjs";
import { SocialPost, PostComment, SocialAction } from "@/lib/types";
import { createClerkSupabaseClient } from "@/lib/supabase";
import { postFromRow, commentFromRow } from "@/lib/mappers/social";

interface SocialContextType {
  feedPosts: SocialPost[];
  following: string[];
  isLoadingFeed: boolean;
  dispatch: (action: SocialAction) => void;
  fetchComments: (postId: string) => Promise<PostComment[]>;
  createPost: (post: Partial<SocialPost>) => Promise<SocialPost | null>;
}

const SocialContext = createContext<SocialContextType | null>(null);

export function SocialProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const { user } = useUser();
  const [feedPosts, setFeedPosts] = useState<SocialPost[]>([]);
  const [following, setFollowing] = useState<string[]>([]);
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const hasFetched = useRef(false);

  const getToken = useCallback(
    () => session?.getToken({ template: "supabase" }) ?? Promise.resolve(null),
    [session]
  );
  const clientRef = useRef(createClerkSupabaseClient(getToken));
  useEffect(() => { clientRef.current = createClerkSupabaseClient(getToken); }, [getToken]);

  // Fetch feed + following on mount
  useEffect(() => {
    if (!session || !user || hasFetched.current) return;
    hasFetched.current = true;

    let cancelled = false;
    async function fetchData() {
      setIsLoadingFeed(true);
      const client = clientRef.current;
      const userId = user!.id;

      // Fetch posts with author profiles
      const { data: posts } = await client
        .from("social_posts")
        .select("*, profiles(*)")
        .eq("is_published", true)
        .order("created_at", { ascending: false })
        .limit(50);

      // Fetch user's likes to mark isLikedByMe
      const { data: likes } = await client
        .from("post_likes")
        .select("post_id")
        .eq("user_id", userId);

      // Fetch following list
      const { data: followData } = await client
        .from("follows")
        .select("following_id")
        .eq("follower_id", userId);

      if (cancelled) return;

      const likedPostIds = new Set((likes || []).map((l: { post_id: string }) => l.post_id));

      if (posts) {
        setFeedPosts(
          posts.map((row) => {
            const post = postFromRow(row as Record<string, unknown>);
            post.isLikedByMe = likedPostIds.has(post.id);
            return post;
          })
        );
      }

      if (followData) {
        setFollowing(followData.map((f: { following_id: string }) => f.following_id));
      }

      setIsLoadingFeed(false);
    }
    fetchData();
    return () => { cancelled = true; };
  }, [session, user]);

  const fetchComments = useCallback(async (postId: string): Promise<PostComment[]> => {
    const client = clientRef.current;
    const { data } = await client
      .from("post_comments")
      .select("*, profiles(*)")
      .eq("post_id", postId)
      .order("created_at", { ascending: true });

    return (data || []).map((r) => commentFromRow(r as Record<string, unknown>));
  }, []);

  const createPost = useCallback(async (postData: Partial<SocialPost>): Promise<SocialPost | null> => {
    if (!user) return null;
    const client = clientRef.current;
    const row = {
      user_id: user.id,
      post_type: postData.postType,
      country_code: postData.countryCode || null,
      country_name: postData.countryName || null,
      title: postData.title,
      content: postData.content,
      photo_urls: postData.photoUrls || [],
      tags: postData.tags || [],
    };

    const { data, error } = await client
      .from("social_posts")
      .insert(row)
      .select("*, profiles(*)")
      .single();

    if (error || !data) {
      console.error("Failed to create post:", error);
      return null;
    }

    const post = postFromRow(data as Record<string, unknown>);
    setFeedPosts((prev) => [post, ...prev]);
    return post;
  }, [user]);

  const dispatch = useCallback((action: SocialAction) => {
    const client = clientRef.current;
    const userId = user?.id;
    if (!userId) return;

    switch (action.type) {
      case "SET_FEED":
        setFeedPosts(action.payload);
        break;

      case "APPEND_FEED":
        setFeedPosts((prev) => [...prev, ...action.payload]);
        break;

      case "ADD_POST":
        setFeedPosts((prev) => [action.payload, ...prev]);
        break;

      case "DELETE_POST": {
        const { id } = action.payload;
        setFeedPosts((prev) => prev.filter((p) => p.id !== id));
        client.from("social_posts").delete().eq("id", id);
        break;
      }

      case "TOGGLE_LIKE": {
        const { postId, liked } = action.payload;
        setFeedPosts((prev) =>
          prev.map((p) =>
            p.id === postId
              ? { ...p, isLikedByMe: liked, likesCount: p.likesCount + (liked ? 1 : -1) }
              : p
          )
        );
        if (liked) {
          client.from("post_likes").insert({ post_id: postId, user_id: userId });
        } else {
          client.from("post_likes").delete().eq("post_id", postId).eq("user_id", userId);
        }
        break;
      }

      case "ADD_COMMENT": {
        const { postId, comment } = action.payload;
        // Increment comments_count (trigger handles DB side)
        setFeedPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, commentsCount: p.commentsCount + 1 } : p))
        );
        client.from("post_comments").insert({
          post_id: postId,
          user_id: userId,
          content: comment.content,
        });
        break;
      }

      case "DELETE_COMMENT": {
        const { postId, commentId } = action.payload;
        setFeedPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, commentsCount: Math.max(0, p.commentsCount - 1) } : p))
        );
        client.from("post_comments").delete().eq("id", commentId);
        break;
      }

      case "SET_FOLLOWING":
        setFollowing(action.payload);
        break;

      case "FOLLOW_USER": {
        const targetId = action.payload;
        setFollowing((prev) => [...prev, targetId]);
        client.from("follows").insert({ follower_id: userId, following_id: targetId });
        break;
      }

      case "UNFOLLOW_USER": {
        const targetId = action.payload;
        setFollowing((prev) => prev.filter((id) => id !== targetId));
        client.from("follows").delete().eq("follower_id", userId).eq("following_id", targetId);
        break;
      }
    }
  }, [user]);

  const value = useMemo(
    () => ({ feedPosts, following, isLoadingFeed, dispatch, fetchComments, createPost }),
    [feedPosts, following, isLoadingFeed, dispatch, fetchComments, createPost]
  );

  return <SocialContext.Provider value={value}>{children}</SocialContext.Provider>;
}

export function useSocial() {
  const context = useContext(SocialContext);
  if (!context) throw new Error("useSocial must be used within SocialProvider");
  return context;
}
