import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { BucketListItem } from "./types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export function createClerkSupabaseClient(
  getToken: () => Promise<string | null>
): SupabaseClient {
  return createClient(supabaseUrl, supabaseAnonKey, {
    global: {
      fetch: async (url, options = {}) => {
        const token = await getToken();
        const headers = new Headers(options.headers);
        if (token) {
          headers.set("Authorization", `Bearer ${token}`);
        }
        return fetch(url, { ...options, headers });
      },
    },
  });
}

// --- Row mappers: snake_case (DB) <-> camelCase (TypeScript) ---

export function itemFromRow(row: Record<string, unknown>): BucketListItem {
  return {
    id: row.id as string,
    countryCode: row.country_code as string,
    countryName: row.country_name as string,
    capital: (row.capital as string) || "",
    region: (row.region as string) || "",
    subregion: (row.subregion as string) || "",
    flagUrl: (row.flag_url as string) || "",
    population: (row.population as number) || 0,
    status: row.status as BucketListItem["status"],
    notes: (row.notes as string) || "",
    createdAt: row.created_at as string,
  };
}

export function itemToRow(
  item: BucketListItem,
  userId: string
): Record<string, unknown> {
  return {
    id: item.id,
    user_id: userId,
    country_code: item.countryCode,
    country_name: item.countryName,
    capital: item.capital || null,
    region: item.region || null,
    subregion: item.subregion || null,
    flag_url: item.flagUrl || null,
    population: item.population || 0,
    status: item.status,
    notes: item.notes || null,
  };
}
