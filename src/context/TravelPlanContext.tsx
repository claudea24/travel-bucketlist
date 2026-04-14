"use client";

import { createContext, useContext, useCallback, useEffect, useState, ReactNode, useMemo, useRef } from "react";
import { useSession, useUser } from "@clerk/nextjs";
import { TravelPlan, ItineraryItem, PlanAccommodation, PlanTransport, TripNote, TravelPlanAction } from "@/lib/types";
import { createClerkSupabaseClient } from "@/lib/supabase";
import { planFromRow, planToRow, itineraryItemFromRow, itineraryItemToRow, accommodationFromRow, accommodationToRow } from "@/lib/mappers/travelPlan";

interface TravelPlanContextType {
  plans: TravelPlan[];
  itineraryItems: Record<string, ItineraryItem[]>;
  transports: Record<string, PlanTransport[]>;
  tripNotes: Record<string, TripNote[]>;
  accommodations: Record<string, PlanAccommodation[]>;
  isLoading: boolean;
  dispatch: (action: TravelPlanAction) => void;
  fetchItinerary: (planId: string) => Promise<void>;
  fetchAccommodations: (planId: string) => Promise<void>;
  fetchTransports: (planId: string) => Promise<void>;
  fetchTripNotes: (planId: string) => Promise<void>;
  addTransport: (t: PlanTransport) => void;
  updateTransport: (id: string, updates: Partial<PlanTransport>) => void;
  deleteTransport: (id: string, planId: string) => void;
  addTripNote: (n: TripNote) => void;
  deleteTripNote: (id: string, planId: string) => void;
  saveAiPlan: (plan: {
    countryCode: string;
    countryName: string;
    title: string;
    summary: string;
    tips: string[];
    estimatedBudget: Record<string, string>;
    days: { day: number; title: string; activities: { id: string; time: string; title: string; description: string; category: string; estimatedCost: string }[] }[];
    accommodation: { area: string; description: string; budgetRange: string; searchUrl: string }[];
    startDate?: string | null;
    endDate?: string | null;
  }) => Promise<string | null>;
}

const TravelPlanContext = createContext<TravelPlanContextType | null>(null);

export function TravelPlanProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const { user } = useUser();
  const [plans, setPlans] = useState<TravelPlan[]>([]);
  const [itineraryItems, setItineraryItems] = useState<Record<string, ItineraryItem[]>>({});
  const [accommodations, setAccommodations] = useState<Record<string, PlanAccommodation[]>>({});
  const [transports, setTransports] = useState<Record<string, PlanTransport[]>>({});
  const [tripNotes, setTripNotes] = useState<Record<string, TripNote[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  const getToken = useCallback(
    () => session?.getToken({ template: "supabase" }) ?? Promise.resolve(null),
    [session]
  );
  const clientRef = useRef(createClerkSupabaseClient(getToken));
  useEffect(() => { clientRef.current = createClerkSupabaseClient(getToken); }, [getToken]);

  useEffect(() => {
    if (!session || !user) { setIsLoading(false); return; }

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

  const fetchTransports = useCallback(async (planId: string) => {
    const client = clientRef.current;
    const { data } = await client.from("plan_transport").select("*").eq("travel_plan_id", planId).order("sort_order");
    if (data) {
      const mapped = data.map((r: Record<string, unknown>): PlanTransport => ({
        id: r.id as string, travelPlanId: r.travel_plan_id as string, userId: r.user_id as string,
        transportType: r.transport_type as PlanTransport["transportType"], title: r.title as string,
        confirmationNumber: (r.confirmation_number as string) || null, bookingUrl: (r.booking_url as string) || null,
        provider: (r.provider as string) || null, pickupDate: (r.pickup_date as string) || null,
        dropoffDate: (r.dropoff_date as string) || null, notes: (r.notes as string) || null,
        isBooked: (r.is_booked as boolean) || false, sortOrder: (r.sort_order as number) || 0,
        createdAt: r.created_at as string,
      }));
      setTransports((prev) => ({ ...prev, [planId]: mapped }));
    }
  }, []);

  const fetchTripNotes = useCallback(async (planId: string) => {
    const client = clientRef.current;
    const { data } = await client.from("trip_notes").select("*").eq("travel_plan_id", planId).order("created_at", { ascending: false });
    if (data) {
      const mapped = data.map((r: Record<string, unknown>): TripNote => ({
        id: r.id as string, travelPlanId: r.travel_plan_id as string, userId: r.user_id as string,
        content: (r.content as string) || null, photoUrl: (r.photo_url as string) || null,
        noteType: (r.note_type as TripNote["noteType"]) || "note", createdAt: r.created_at as string,
      }));
      setTripNotes((prev) => ({ ...prev, [planId]: mapped }));
    }
  }, []);

  const addTransport = useCallback((t: PlanTransport) => {
    setTransports((prev) => ({ ...prev, [t.travelPlanId]: [...(prev[t.travelPlanId] || []), t] }));
    const client = clientRef.current;
    client.from("plan_transport").insert({
      id: t.id, travel_plan_id: t.travelPlanId, user_id: user?.id,
      transport_type: t.transportType, title: t.title, confirmation_number: t.confirmationNumber,
      booking_url: t.bookingUrl, provider: t.provider, pickup_date: t.pickupDate,
      dropoff_date: t.dropoffDate, notes: t.notes, is_booked: t.isBooked, sort_order: t.sortOrder,
    });
  }, [user]);

  const updateTransport = useCallback((id: string, updates: Partial<PlanTransport>) => {
    setTransports((prev) => {
      const n = { ...prev };
      for (const k of Object.keys(n)) n[k] = n[k].map((t) => t.id === id ? { ...t, ...updates } : t);
      return n;
    });
    const dbUp: Record<string, unknown> = {};
    if ("title" in updates) dbUp.title = updates.title;
    if ("confirmationNumber" in updates) dbUp.confirmation_number = updates.confirmationNumber;
    if ("bookingUrl" in updates) dbUp.booking_url = updates.bookingUrl;
    if ("provider" in updates) dbUp.provider = updates.provider;
    if ("pickupDate" in updates) dbUp.pickup_date = updates.pickupDate;
    if ("dropoffDate" in updates) dbUp.dropoff_date = updates.dropoffDate;
    if ("notes" in updates) dbUp.notes = updates.notes;
    if ("isBooked" in updates) dbUp.is_booked = updates.isBooked;
    clientRef.current.from("plan_transport").update(dbUp).eq("id", id);
  }, []);

  const deleteTransport = useCallback((id: string, planId: string) => {
    setTransports((prev) => ({ ...prev, [planId]: (prev[planId] || []).filter((t) => t.id !== id) }));
    clientRef.current.from("plan_transport").delete().eq("id", id);
  }, []);

  const addTripNote = useCallback((n: TripNote) => {
    setTripNotes((prev) => ({ ...prev, [n.travelPlanId]: [n, ...(prev[n.travelPlanId] || [])] }));
    clientRef.current.from("trip_notes").insert({
      id: n.id, travel_plan_id: n.travelPlanId, user_id: user?.id,
      content: n.content, photo_url: n.photoUrl, note_type: n.noteType,
    });
  }, [user]);

  const deleteTripNote = useCallback((id: string, planId: string) => {
    setTripNotes((prev) => ({ ...prev, [planId]: (prev[planId] || []).filter((n) => n.id !== id) }));
    clientRef.current.from("trip_notes").delete().eq("id", id);
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
    startDate?: string | null;
    endDate?: string | null;
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
      start_date: aiPlan.startDate || null,
      end_date: aiPlan.endDate || null,
      notes: aiPlan.estimatedBudget ? JSON.stringify(aiPlan.estimatedBudget) : null,
    };

    const { error: planError } = await client.from("travel_plans").insert(planRow);
    if (planError) { console.error("Failed to save plan:", JSON.stringify(planError)); return null; }

    // 2. Insert all itinerary items
    const validCategories = new Set(["transport", "accommodation", "activity", "food", "other"]);
    const mapCategory = (cat: string) => validCategories.has(cat) ? cat : "activity";
    const parseTime = (t: string | null): string | null => {
      if (!t) return null;
      // Convert "9:00 AM" → "09:00:00" for Postgres TIME type
      const match = t.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
      if (!match) return null;
      let hours = parseInt(match[1]);
      const mins = match[2];
      if (match[3]?.toUpperCase() === "PM" && hours < 12) hours += 12;
      if (match[3]?.toUpperCase() === "AM" && hours === 12) hours = 0;
      return `${hours.toString().padStart(2, "0")}:${mins}:00`;
    };

    const itinRows = aiPlan.days.flatMap((day) =>
      day.activities.map((act, i) => ({
        id: act.id || crypto.randomUUID(),
        travel_plan_id: planId,
        user_id: userId,
        day_number: day.day,
        title: act.title,
        description: act.description || null,
        category: mapCategory(act.category || "activity"),
        start_time: parseTime(act.time),
        estimated_cost: act.estimatedCost ? parseFloat(act.estimatedCost.replace(/[^0-9.]/g, "")) || null : null,
        sort_order: i,
      }))
    );

    if (itinRows.length > 0) {
      const { error: itinError } = await client.from("itinerary_items").insert(itinRows);
      if (itinError) console.error("Failed to save itinerary:", JSON.stringify(itinError));
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
      startDate: aiPlan.startDate || null,
      endDate: aiPlan.endDate || null,
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
        // Also clear local itinerary/accommodation state
        setItineraryItems((prev) => { const n = { ...prev }; delete n[id]; return n; });
        setAccommodations((prev) => { const n = { ...prev }; delete n[id]; return n; });
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
    () => ({ plans, itineraryItems, accommodations, transports, tripNotes, isLoading, dispatch, fetchItinerary, fetchAccommodations, fetchTransports, fetchTripNotes, saveAiPlan, addTransport, updateTransport, deleteTransport, addTripNote, deleteTripNote }),
    [plans, itineraryItems, accommodations, transports, tripNotes, isLoading, dispatch, fetchItinerary, fetchAccommodations, fetchTransports, fetchTripNotes, saveAiPlan, addTransport, updateTransport, deleteTransport, addTripNote, deleteTripNote]
  );

  return <TravelPlanContext.Provider value={value}>{children}</TravelPlanContext.Provider>;
}

export function useTravelPlans() {
  const context = useContext(TravelPlanContext);
  if (!context) throw new Error("useTravelPlans must be used within TravelPlanProvider");
  return context;
}
