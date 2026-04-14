"use client";

import { createContext, useContext, useCallback, useEffect, useState, ReactNode, useMemo, useRef } from "react";
import { useSession, useUser } from "@clerk/nextjs";
import { TravelPlan, ItineraryItem, PlanAccommodation, TravelPlanAction } from "@/lib/types";
import { createClerkSupabaseClient } from "@/lib/supabase";
import { planFromRow, planToRow, itineraryItemFromRow, itineraryItemToRow, accommodationFromRow, accommodationToRow } from "@/lib/mappers/travelPlan";

interface TravelPlanContextType {
  plans: TravelPlan[];
  itineraryItems: Record<string, ItineraryItem[]>;
  accommodations: Record<string, PlanAccommodation[]>;
  isLoading: boolean;
  dispatch: (action: TravelPlanAction) => void;
  fetchItinerary: (planId: string) => Promise<void>;
  fetchAccommodations: (planId: string) => Promise<void>;
  saveAiPlan: (plan: {
    countryCode: string;
    countryName: string;
    title: string;
    summary: string;
    tips: string[];
    estimatedBudget: Record<string, string>;
    days: { day: number; title: string; activities: { id: string; time: string; title: string; description: string; category: string; estimatedCost: string }[] }[];
    accommodation: { area: string; description: string; budgetRange: string; searchUrl: string }[];
  }) => Promise<string | null>;
}

const TravelPlanContext = createContext<TravelPlanContextType | null>(null);

export function TravelPlanProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const { user } = useUser();
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [itineraryItems, setItineraryItems] = useState<Record<string, ItineraryItem[]>>({});
  const [accommodations, setAccommodations] = useState<Record<string, PlanAccommodation[]>>({});
  const [isLoading, setIsLoading] = useState(false);
  const hasFetched = useRef(false);

  const getToken = useCallback(
    () => session?.getToken({ template: "supabase" }) ?? Promise.resolve(null),
    [session]
  );
  const clientRef = useRef(createClerkSupabaseClient(getToken));
  useEffect(() => { clientRef.current = createClerkSupabaseClient(getToken); }, [getToken]);

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

  const fetchAccommodations = useCallback(async (planId: string) => {
    const client = clientRef.current;
    const { data, error } = await client
      .from("plan_accommodations")
      .select("*")
      .eq("travel_plan_id", planId)
      .order("sort_order", { ascending: true });

    if (!error && data) {
      setAccommodations((prev) => ({
        ...prev,
        [planId]: data.map((r) => accommodationFromRow(r as Record<string, unknown>)),
      }));
    }
  }, []);

  // Save a complete AI-generated plan to Supabase
  const saveAiPlan = useCallback(async (aiPlan: {
    countryCode: string;
    countryName: string;
    title: string;
    summary: string;
    tips: string[];
    estimatedBudget: Record<string, string>;
    days: { day: number; title: string; activities: { id: string; time: string; title: string; description: string; category: string; estimatedCost: string }[] }[];
    accommodation: { area: string; description: string; budgetRange: string; searchUrl: string }[];
  }): Promise<string | null> => {
    const userId = user?.id;
    if (!userId) return null;
    const client = clientRef.current;

    // 1. Create the travel plan
    const planId = crypto.randomUUID();
    const planRow = {
      id: planId,
      user_id: userId,
      country_code: aiPlan.countryCode,
      country_name: aiPlan.countryName,
      title: aiPlan.title,
      summary: aiPlan.summary,
      tips: aiPlan.tips || [],
      status: "planning",
      notes: aiPlan.estimatedBudget ? JSON.stringify(aiPlan.estimatedBudget) : null,
    };

    const { error: planError } = await client.from("travel_plans").insert(planRow);
    if (planError) { console.error("Failed to save plan:", planError); return null; }

    // 2. Insert all itinerary items
    const itinRows = aiPlan.days.flatMap((day) =>
      day.activities.map((act, i) => ({
        id: act.id || crypto.randomUUID(),
        travel_plan_id: planId,
        user_id: userId,
        day_number: day.day,
        title: act.title,
        description: act.description || null,
        category: act.category || "activity",
        start_time: act.time || null,
        estimated_cost: act.estimatedCost ? parseFloat(act.estimatedCost.replace(/[^0-9.]/g, "")) || null : null,
        sort_order: i,
      }))
    );

    if (itinRows.length > 0) {
      const { error: itinError } = await client.from("itinerary_items").insert(itinRows);
      if (itinError) console.error("Failed to save itinerary:", itinError);
    }

    // 3. Insert accommodations
    const accomRows = (aiPlan.accommodation || []).map((acc, i) => ({
      id: crypto.randomUUID(),
      travel_plan_id: planId,
      user_id: userId,
      area: acc.area,
      description: acc.description || null,
      budget_range: acc.budgetRange || null,
      search_url: acc.searchUrl || null,
      sort_order: i,
    }));

    if (accomRows.length > 0) {
      const { error: accomError } = await client.from("plan_accommodations").insert(accomRows);
      if (accomError) console.error("Failed to save accommodations:", accomError);
    }

    // 4. Update local state
    const newPlan: TravelPlan = {
      id: planId,
      userId,
      bucketListItemId: null,
      countryCode: aiPlan.countryCode,
      countryName: aiPlan.countryName,
      title: aiPlan.title,
      summary: aiPlan.summary,
      tips: aiPlan.tips || [],
      startDate: null,
      endDate: null,
      budgetAmount: null,
      budgetCurrency: "USD",
      status: "planning",
      notes: aiPlan.estimatedBudget ? JSON.stringify(aiPlan.estimatedBudget) : null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setPlans((prev) => [newPlan, ...prev]);

    const items = itinRows.map((r) => itineraryItemFromRow(r as unknown as Record<string, unknown>));
    setItineraryItems((prev) => ({ ...prev, [planId]: items }));

    const accoms = accomRows.map((r) => accommodationFromRow(r as unknown as Record<string, unknown>));
    setAccommodations((prev) => ({ ...prev, [planId]: accoms }));

    return planId;
  }, [user]);

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
          if (error) { console.error("Failed to add plan:", error); setPlans((prev) => prev.filter((p) => p.id !== plan.id)); }
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
        if ("summary" in updates) dbUpdates.summary = updates.summary;
        if ("tips" in updates) dbUpdates.tips = updates.tips;
        client.from("travel_plans").update(dbUpdates).eq("id", id).then(({ error }) => {
          if (error) console.error("Failed to update plan:", error);
        });
        break;
      }

      case "DELETE_PLAN": {
        const { id } = action.payload;
        setPlans((prev) => prev.filter((p) => p.id !== id));
        client.from("travel_plans").delete().eq("id", id);
        break;
      }

      case "ADD_ITINERARY_ITEM": {
        const item = action.payload;
        setItineraryItems((prev) => ({
          ...prev,
          [item.travelPlanId]: [...(prev[item.travelPlanId] || []), item],
        }));
        client.from("itinerary_items").insert(itineraryItemToRow(item, userId));
        break;
      }

      case "UPDATE_ITINERARY_ITEM": {
        const { id, ...updates } = action.payload;
        setItineraryItems((prev) => {
          const newState = { ...prev };
          for (const planId of Object.keys(newState)) {
            newState[planId] = newState[planId].map((i) => i.id === id ? { ...i, ...updates } : i);
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
        client.from("itinerary_items").update(dbUp).eq("id", id);
        break;
      }

      case "DELETE_ITINERARY_ITEM": {
        const { id, planId } = action.payload;
        setItineraryItems((prev) => ({
          ...prev,
          [planId]: (prev[planId] || []).filter((i) => i.id !== id),
        }));
        client.from("itinerary_items").delete().eq("id", id);
        break;
      }

      case "SET_ITINERARY": {
        const { planId, items } = action.payload;
        setItineraryItems((prev) => ({ ...prev, [planId]: items }));
        break;
      }

      case "SET_ACCOMMODATIONS": {
        const { planId, items } = action.payload;
        setAccommodations((prev) => ({ ...prev, [planId]: items }));
        break;
      }

      case "ADD_ACCOMMODATION": {
        const item = action.payload;
        setAccommodations((prev) => ({
          ...prev,
          [item.travelPlanId]: [...(prev[item.travelPlanId] || []), item],
        }));
        client.from("plan_accommodations").insert(accommodationToRow(item, userId));
        break;
      }

      case "UPDATE_ACCOMMODATION": {
        const { id, ...updates } = action.payload;
        setAccommodations((prev) => {
          const newState = { ...prev };
          for (const planId of Object.keys(newState)) {
            newState[planId] = newState[planId].map((a) => a.id === id ? { ...a, ...updates } : a);
          }
          return newState;
        });
        const dbAcc: Record<string, unknown> = {};
        if ("area" in updates) dbAcc.area = updates.area;
        if ("description" in updates) dbAcc.description = updates.description;
        if ("chosenPlace" in updates) dbAcc.chosen_place = updates.chosenPlace;
        if ("chosenUrl" in updates) dbAcc.chosen_url = updates.chosenUrl;
        if ("userNotes" in updates) dbAcc.user_notes = updates.userNotes;
        if ("isBooked" in updates) dbAcc.is_booked = updates.isBooked;
        client.from("plan_accommodations").update(dbAcc).eq("id", id);
        break;
      }

      case "DELETE_ACCOMMODATION": {
        const { id, planId } = action.payload;
        setAccommodations((prev) => ({
          ...prev,
          [planId]: (prev[planId] || []).filter((a) => a.id !== id),
        }));
        client.from("plan_accommodations").delete().eq("id", id);
        break;
      }
    }
  }, [user]);

  const value = useMemo(
    () => ({ plans, itineraryItems, accommodations, isLoading, dispatch, fetchItinerary, fetchAccommodations, saveAiPlan }),
    [plans, itineraryItems, accommodations, isLoading, dispatch, fetchItinerary, fetchAccommodations, saveAiPlan]
  );

  return <TravelPlanContext.Provider value={value}>{children}</TravelPlanContext.Provider>;
}

export function useTravelPlans() {
  const context = useContext(TravelPlanContext);
  if (!context) throw new Error("useTravelPlans must be used within TravelPlanProvider");
  return context;
}
