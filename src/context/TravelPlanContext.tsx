"use client";

import { createContext, useContext, useCallback, useEffect, useState, ReactNode, useMemo, useRef } from "react";
import { useSession, useUser } from "@clerk/nextjs";
import { TravelPlan, ItineraryItem, TravelPlanAction } from "@/lib/types";
import { createClerkSupabaseClient } from "@/lib/supabase";
import { planFromRow, planToRow, itineraryItemFromRow, itineraryItemToRow } from "@/lib/mappers/travelPlan";

interface TravelPlanContextType {
  plans: TravelPlan[];
  itineraryItems: Record<string, ItineraryItem[]>; // keyed by planId
  isLoading: boolean;
  dispatch: (action: TravelPlanAction) => void;
  fetchItinerary: (planId: string) => Promise<void>;
}

const TravelPlanContext = createContext<TravelPlanContextType | null>(null);

export function TravelPlanProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const { user } = useUser();
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [itineraryItems, setItineraryItems] = useState<Record<string, ItineraryItem[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const hasFetched = useRef(false);

  const getToken = useCallback(
    () => session?.getToken({ template: "supabase" }) ?? Promise.resolve(null),
    [session]
  );
  const clientRef = useRef(createClerkSupabaseClient(getToken));
  useEffect(() => { clientRef.current = createClerkSupabaseClient(getToken); }, [getToken]);

  // Lazy fetch — only when provider mounts (on /personal page visit)
  useEffect(() => {
    if (!session || !user || hasFetched.current) return;
    hasFetched.current = true;

    let cancelled = false;
    async function fetchPlans() {
      setIsLoading(true);
      const client = clientRef.current;
      const { data, error } = await client
        .from("travel_plans")
        .select("*")
        .order("created_at", { ascending: false });

      if (!cancelled && !error && data) {
        setPlans(data.map((r) => planFromRow(r as Record<string, unknown>)));
      }
      if (!cancelled) setIsLoading(false);
    }
    fetchPlans();
    return () => { cancelled = true; };
  }, [session, user]);

  const fetchItinerary = useCallback(async (planId: string) => {
    const client = clientRef.current;
    const { data, error } = await client
      .from("itinerary_items")
      .select("*")
      .eq("travel_plan_id", planId)
      .order("day_number", { ascending: true })
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setItineraryItems((prev) => ({
        ...prev,
        [planId]: data.map((r) => itineraryItemFromRow(r as Record<string, unknown>)),
      }));
    }
  }, []);

  const dispatch = useCallback((action: TravelPlanAction) => {
    const client = clientRef.current;
    const userId = user?.id;
    if (!userId) return;

    switch (action.type) {
      case "SET_PLANS":
        setPlans(action.payload);
        break;

      case "ADD_PLAN": {
        const plan = action.payload;
        setPlans((prev) => [plan, ...prev]);
        client.from("travel_plans").insert(planToRow(plan, userId)).then(({ error }) => {
          if (error) {
            console.error("Failed to add plan:", error);
            setPlans((prev) => prev.filter((p) => p.id !== plan.id));
          }
        });
        break;
      }

      case "UPDATE_PLAN": {
        const { id, ...updates } = action.payload;
        setPlans((prev) => prev.map((p) => (p.id === id ? { ...p, ...updates } : p)));
        const dbUpdates: Record<string, unknown> = {};
        if ("title" in updates) dbUpdates.title = updates.title;
        if ("startDate" in updates) dbUpdates.start_date = updates.startDate;
        if ("endDate" in updates) dbUpdates.end_date = updates.endDate;
        if ("budgetAmount" in updates) dbUpdates.budget_amount = updates.budgetAmount;
        if ("budgetCurrency" in updates) dbUpdates.budget_currency = updates.budgetCurrency;
        if ("status" in updates) dbUpdates.status = updates.status;
        if ("notes" in updates) dbUpdates.notes = updates.notes;
        client.from("travel_plans").update(dbUpdates).eq("id", id).then(({ error }) => {
          if (error) console.error("Failed to update plan:", error);
        });
        break;
      }

      case "DELETE_PLAN": {
        const { id } = action.payload;
        setPlans((prev) => prev.filter((p) => p.id !== id));
        client.from("travel_plans").delete().eq("id", id).then(({ error }) => {
          if (error) console.error("Failed to delete plan:", error);
        });
        break;
      }

      case "ADD_ITINERARY_ITEM": {
        const item = action.payload;
        setItineraryItems((prev) => ({
          ...prev,
          [item.travelPlanId]: [...(prev[item.travelPlanId] || []), item],
        }));
        client.from("itinerary_items").insert(itineraryItemToRow(item, userId)).then(({ error }) => {
          if (error) console.error("Failed to add itinerary item:", error);
        });
        break;
      }

      case "UPDATE_ITINERARY_ITEM": {
        const { id, ...updates } = action.payload;
        setItineraryItems((prev) => {
          const newState = { ...prev };
          for (const planId of Object.keys(newState)) {
            newState[planId] = newState[planId].map((i) =>
              i.id === id ? { ...i, ...updates } : i
            );
          }
          return newState;
        });
        const dbUp: Record<string, unknown> = {};
        if ("title" in updates) dbUp.title = updates.title;
        if ("description" in updates) dbUp.description = updates.description;
        if ("category" in updates) dbUp.category = updates.category;
        if ("dayNumber" in updates) dbUp.day_number = updates.dayNumber;
        if ("startTime" in updates) dbUp.start_time = updates.startTime;
        if ("endTime" in updates) dbUp.end_time = updates.endTime;
        if ("estimatedCost" in updates) dbUp.estimated_cost = updates.estimatedCost;
        if ("isBooked" in updates) dbUp.is_booked = updates.isBooked;
        if ("sortOrder" in updates) dbUp.sort_order = updates.sortOrder;
        client.from("itinerary_items").update(dbUp).eq("id", id).then(({ error }) => {
          if (error) console.error("Failed to update itinerary item:", error);
        });
        break;
      }

      case "DELETE_ITINERARY_ITEM": {
        const { id, planId } = action.payload;
        setItineraryItems((prev) => ({
          ...prev,
          [planId]: (prev[planId] || []).filter((i) => i.id !== id),
        }));
        client.from("itinerary_items").delete().eq("id", id).then(({ error }) => {
          if (error) console.error("Failed to delete itinerary item:", error);
        });
        break;
      }

      case "SET_ITINERARY": {
        const { planId, items } = action.payload;
        setItineraryItems((prev) => ({ ...prev, [planId]: items }));
        break;
      }
    }
  }, [user]);

  const value = useMemo(
    () => ({ plans, itineraryItems, isLoading, dispatch, fetchItinerary }),
    [plans, itineraryItems, isLoading, dispatch, fetchItinerary]
  );

  return <TravelPlanContext.Provider value={value}>{children}</TravelPlanContext.Provider>;
}

export function useTravelPlans() {
  const context = useContext(TravelPlanContext);
  if (!context) throw new Error("useTravelPlans must be used within TravelPlanProvider");
  return context;
}
