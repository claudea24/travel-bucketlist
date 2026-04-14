import { UserActivity } from "../types";

export function userActivityFromRow(
  row: Record<string, unknown>
): UserActivity {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    bucketListItemId: row.bucket_list_item_id as string,
    destinationActivityId: (row.destination_activity_id as string) || null,
    name: row.name as string,
    notes: (row.notes as string) || null,
    isCompleted: (row.is_completed as boolean) || false,
    createdAt: row.created_at as string,
  };
}

export function userActivityToRow(
  activity: Partial<UserActivity>,
  userId: string
): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId };
  if (activity.id !== undefined) row.id = activity.id;
  if (activity.bucketListItemId !== undefined)
    row.bucket_list_item_id = activity.bucketListItemId;
  if (activity.destinationActivityId !== undefined)
    row.destination_activity_id = activity.destinationActivityId;
  if (activity.name !== undefined) row.name = activity.name;
  if (activity.notes !== undefined) row.notes = activity.notes;
  if (activity.isCompleted !== undefined) row.is_completed = activity.isCompleted;
  return row;
}
