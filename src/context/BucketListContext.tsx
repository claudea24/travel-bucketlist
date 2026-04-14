"use client";

import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useState,
  ReactNode,
  useMemo,
  useRef,
} from "react";
import { useSession, useUser } from "@clerk/nextjs";
import { BucketListItem, BucketListAction } from "@/lib/types";
import {
  createClerkSupabaseClient,
  itemFromRow,
  itemToRow,
} from "@/lib/supabase";

interface BucketListState {
  items: BucketListItem[];
  isLoading: boolean;
}

interface BucketListContextType extends BucketListState {
  dispatch: (action: BucketListAction) => void;
}

const BucketListContext = createContext<BucketListContextType | null>(null);

export function BucketListProvider({ children }: { children: ReactNode }) {
  const { session } = useSession();
  const { user } = useUser();

  const [items, setItems] = useState<BucketListItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const getToken = useCallback(
    () => session?.getToken({ template: "supabase" }) ?? Promise.resolve(null),
    [session]
  );

  const clientRef = useRef(createClerkSupabaseClient(getToken));

  useEffect(() => {
    clientRef.current = createClerkSupabaseClient(getToken);
  }, [getToken]);

  // Fetch saved bucket list items on mount / user change
  useEffect(() => {
    if (!session || !user) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    async function fetchItems() {
      setIsLoading(true);
      const client = clientRef.current;
      const { data, error } = await client
        .from("bucket_list")
        .select("*")
        .order("created_at", { ascending: false });

      if (cancelled) return;

      if (error) {
        console.error("Failed to fetch bucket list:", error);
      } else if (data) {
        setItems(data.map(itemFromRow));
      }

      setIsLoading(false);
    }

    fetchItems();

    return () => {
      cancelled = true;
    };
  }, [session, user]);

  const dispatch = useCallback(
    (action: BucketListAction) => {
      const client = clientRef.current;
      const userId = user?.id;
      if (!userId) return;

      switch (action.type) {
        case "SET_ITEMS": {
          setItems(action.payload);
          break;
        }
        case "ADD_ITEM": {
          const item = action.payload;
          setItems((prev) => [item, ...prev]);
          client
            .from("bucket_list")
            .insert(itemToRow(item, userId))
            .then(({ error }) => {
              if (error) {
                console.error("Failed to add item:", error);
                setItems((prev) => prev.filter((i) => i.id !== item.id));
              }
            });
          break;
        }
        case "UPDATE_ITEM": {
          const { id, ...updates } = action.payload;
          setItems((prev) =>
            prev.map((i) => (i.id === id ? { ...i, ...updates } : i))
          );
          const dbUpdates: Record<string, unknown> = {};
          if ("status" in updates) dbUpdates.status = updates.status;
          if ("notes" in updates) dbUpdates.notes = updates.notes || null;

          client
            .from("bucket_list")
            .update(dbUpdates)
            .eq("id", id)
            .then(({ error }) => {
              if (error) console.error("Failed to update item:", error);
            });
          break;
        }
        case "REMOVE_ITEM": {
          const { id } = action.payload;
          const prev = items;
          setItems((curr) => curr.filter((i) => i.id !== id));
          client
            .from("bucket_list")
            .delete()
            .eq("id", id)
            .then(({ error }) => {
              if (error) {
                console.error("Failed to remove item:", error);
                setItems(prev);
              }
            });
          break;
        }
      }
    },
    [user, items]
  );

  const value = useMemo(
    () => ({ items, isLoading, dispatch }),
    [items, isLoading, dispatch]
  );

  return (
    <BucketListContext.Provider value={value}>
      {children}
    </BucketListContext.Provider>
  );
}

export function useBucketList() {
  const context = useContext(BucketListContext);
  if (!context)
    throw new Error("useBucketList must be used within BucketListProvider");
  return context;
}
