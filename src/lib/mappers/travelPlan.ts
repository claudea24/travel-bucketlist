import { TravelPlan, ItineraryItem } from "../types";

export function planFromRow(row: Record<string, unknown>): TravelPlan {
  return {
    id: row.id as string,
    userId: row.user_id as string,
    bucketListItemId: (row.bucket_list_item_id as string) || null,
    countryCode: row.country_code as string,
    countryName: row.country_name as string,
    title: (row.title as string) || "My Trip",
    startDate: (row.start_date as string) || null,
    endDate: (row.end_date as string) || null,
    budgetAmount: (row.budget_amount as number) || null,
    budgetCurrency: (row.budget_currency as string) || "USD",
    status: row.status as TravelPlan["status"],
    notes: (row.notes as string) || null,
    createdAt: row.created_at as string,
    updatedAt: row.updated_at as string,
  };
}

export function planToRow(
  plan: Partial<TravelPlan>,
  userId: string
): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId };
  if (plan.id !== undefined) row.id = plan.id;
  if (plan.bucketListItemId !== undefined) row.bucket_list_item_id = plan.bucketListItemId;
  if (plan.countryCode !== undefined) row.country_code = plan.countryCode;
  if (plan.countryName !== undefined) row.country_name = plan.countryName;
  if (plan.title !== undefined) row.title = plan.title;
  if (plan.startDate !== undefined) row.start_date = plan.startDate;
  if (plan.endDate !== undefined) row.end_date = plan.endDate;
  if (plan.budgetAmount !== undefined) row.budget_amount = plan.budgetAmount;
  if (plan.budgetCurrency !== undefined) row.budget_currency = plan.budgetCurrency;
  if (plan.status !== undefined) row.status = plan.status;
  if (plan.notes !== undefined) row.notes = plan.notes;
  return row;
}

export function itineraryItemFromRow(
  row: Record<string, unknown>
): ItineraryItem {
  return {
    id: row.id as string,
    travelPlanId: row.travel_plan_id as string,
    userId: row.user_id as string,
    dayNumber: (row.day_number as number) || null,
    title: row.title as string,
    description: (row.description as string) || null,
    category: (row.category as ItineraryItem["category"]) || "other",
    startTime: (row.start_time as string) || null,
    endTime: (row.end_time as string) || null,
    estimatedCost: (row.estimated_cost as number) || null,
    isBooked: (row.is_booked as boolean) || false,
    sortOrder: (row.sort_order as number) || 0,
    createdAt: row.created_at as string,
  };
}

export function itineraryItemToRow(
  item: Partial<ItineraryItem>,
  userId: string
): Record<string, unknown> {
  const row: Record<string, unknown> = { user_id: userId };
  if (item.id !== undefined) row.id = item.id;
  if (item.travelPlanId !== undefined) row.travel_plan_id = item.travelPlanId;
  if (item.dayNumber !== undefined) row.day_number = item.dayNumber;
  if (item.title !== undefined) row.title = item.title;
  if (item.description !== undefined) row.description = item.description;
  if (item.category !== undefined) row.category = item.category;
  if (item.startTime !== undefined) row.start_time = item.startTime;
  if (item.endTime !== undefined) row.end_time = item.endTime;
  if (item.estimatedCost !== undefined) row.estimated_cost = item.estimatedCost;
  if (item.isBooked !== undefined) row.is_booked = item.isBooked;
  if (item.sortOrder !== undefined) row.sort_order = item.sortOrder;
  return row;
}
