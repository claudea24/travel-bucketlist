import { SocialPost, PostComment } from "../types";
import { profileFromRow } from "./profile";

export function postFromRow(row: Record<string, unknown>): SocialPost {
  const post: SocialPost = {
    id: row.id as string,
    userId: row.user_id as string,
    postType: row.post_type as SocialPost["postType"],
    countryCode: (row.country_code as string) || null,
    countryName: (row.country_name as string) || null,
    title: row.title as string,
    content: row.content as string,
    photoUrls: (row.photo_urls as string[]) || [],
    tags: (row.tags as string[]) || [],
    likesCount: (row.likes_count as number) || 0,
    commentsCount: (row.comments_count as number) || 0,
    isPublished: row.is_published as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };

  // Join: author profile
  if (row.profiles && typeof row.profiles === "object") {
    post.author = profileFromRow(row.profiles as Record<string, unknown>);
  }

  return post;
}

export function postToRow(
  post: Partial<SocialPost>,
  userId: string
): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId };
  if (post.postType !== undefined) row.post_type = post.postType;
  if (post.countryCode !== undefined) row.country_code = post.countryCode;
  if (post.countryName !== undefined) row.country_name = post.countryName;
  if (post.title !== undefined) row.title = post.title;
  if (post.content !== undefined) row.content = post.content;
  if (post.photoUrls !== undefined) row.photo_urls = post.photoUrls;
  if (post.tags !== undefined) row.tags = post.tags;
  if (post.isPublished !== undefined) row.is_published = post.isPublished;
  return row;
}

export function commentFromRow(row: Record<string, unknown>): PostComment {
  const comment: PostComment = {
    id: row.id as string,
    postId: row.post_id as string,
    userId: row.user_id as string,
    content: row.content as string,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };

  if (row.profiles && typeof row.profiles === "object") {
    comment.author = profileFromRow(row.profiles as Record<string, unknown>);
  }

  return comment;
}

export function commentToRow(
  comment: Partial<PostComment>,
  userId: string
): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId };
  if (comment.postId !== undefined) row.post_id = comment.postId;
  if (comment.content !== undefined) row.content = comment.content;
  return row;
}
