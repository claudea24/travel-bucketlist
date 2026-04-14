// Saved bucket list item (stored in Supabase)
export interface BucketListItem {
  id: string;
  countryCode: string; // ISO 3166-1 alpha-3
  countryName: string;
  capital: string;
  region: string;
  subregion: string;
  flagUrl: string;
  population: number;
  status: "want_to_visit" | "visited";
  notes: string;
  createdAt?: string;
}

// Country from RestCountries API
export interface Country {
  name: {
    common: string;
    official: string;
  };
  cca3: string; // alpha-3 code
  capital: string[];
  region: string;
  subregion: string;
  population: number;
  flags: {
    svg: string;
    png: string;
  };
  latlng: number[];
  area: number;
  languages: Record<string, string>;
  currencies: Record<string, { name: string; symbol: string }>;
  continents: string[];
}

// Actions for state management
export type BucketListAction =
  | { type: "SET_ITEMS"; payload: BucketListItem[] }
  | { type: "ADD_ITEM"; payload: BucketListItem }
  | { type: "UPDATE_ITEM"; payload: { id: string } & Partial<BucketListItem> }
  | { type: "REMOVE_ITEM"; payload: { id: string } };
