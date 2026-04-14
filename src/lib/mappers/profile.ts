import { UserProfile } from "../types";

export function profileFromRow(row: Record<string, unknown>): UserProfile {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    displayName: (row.display_name as string) || "",
    avatarUrl: (row.avatar_url as string) || null,
    bio: (row.bio as string) || "",
    countriesVisitedCount: (row.countries_visited_count as number) || 0,
    countriesWantCount: (row.countries_want_count as number) || 0,
    isPublic: row.is_public as boolean,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function profileToRow(
  profile: Partial<UserProfile>,
  userId: string
): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId };
  if (profile.displayName !== undefined) row.display_name = profile.displayName;
  if (profile.avatarUrl !== undefined) row.avatar_url = profile.avatarUrl;
  if (profile.bio !== undefined) row.bio = profile.bio;
  if (profile.isPublic !== undefined) row.is_public = profile.isPublic;
  return row;
}
