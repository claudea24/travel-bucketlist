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
  status: "want_to_visit" | "planning" | "visited";
  notes: string;
  createdAt?: string;
  activities?: UserActivity[];
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

// User profile (cached from Clerk, stored in Supabase for social features)
export interface UserProfile {
  id: string;
  userId: string;
  displayName: string;
  avatarUrl: string | null;
  bio: string;
  countriesVisitedCount: number;
  countriesWantCount: number;
  isPublic: boolean;
  createdAt: string;
  updatedAt: string;
}

// Pre-seeded destination for the Home feed
export type DestinationCategory =
  | "beach"
  | "mountains"
  | "city"
  | "adventure"
  | "culture"
  | "nature"
  | "food"
  | "historical";

export interface Destination {
  id: string;
  countryCode: string;
  countryName: string;
  category: DestinationCategory;
  title: string;
  subtitle: string | null;
  description: string | null;
  photoUrl: string | null;
  photoAttribution: string | null;
  latitude: number | null;
  longitude: number | null;
  popularityScore: number;
}

// Things to do at a destination (pre-seeded from OpenTripMap)
export interface DestinationActivity {
  id: string;
  destinationId: string;
  name: string;
  description: string | null;
  category: string | null;
  photoUrl: string | null;
  rating: number | null;
  source: string;
  externalId: string | null;
  latitude: number | null;
  longitude: number | null;
}

// Activity a user saves to their personal bucket list item
export interface UserActivity {
  id: string;
  userId: string;
  bucketListItemId: string;
  destinationActivityId: string | null;
  name: string;
  notes: string | null;
  isCompleted: boolean;
  createdAt: string;
}

// Travel plan linked to a bucket list item
export interface TravelPlan {
  id: string;
  userId: string;
  bucketListItemId: string | null;
  countryCode: string;
  countryName: string;
  title: string;
  startDate: string | null;
  endDate: string | null;
  budgetAmount: number | null;
  budgetCurrency: string;
  status: "draft" | "planning" | "booked" | "completed" | "cancelled";
  notes: string | null;
  summary: string | null;
  tips: string[];
  createdAt: string;
  updatedAt: string;
}

// Hotel/accommodation option within a travel plan
export interface PlanAccommodation {
  id: string;
  travelPlanId: string;
  userId: string;
  area: string;
  description: string | null;
  budgetRange: string | null;
  searchUrl: string | null;
  chosenPlace: string | null;
  chosenUrl: string | null;
  userNotes: string | null;
  isBooked: boolean;
  sortOrder: number;
  createdAt: string;
}

// Day-by-day item within a travel plan
export interface ItineraryItem {
  id: string;
  travelPlanId: string;
  userId: string;
  dayNumber: number | null;
  title: string;
  description: string | null;
  category: "transport" | "accommodation" | "activity" | "food" | "other";
  startTime: string | null;
  endTime: string | null;
  estimatedCost: number | null;
  isBooked: boolean;
  sortOrder: number;
  createdAt: string;
}

// --- Actions for state management ---

export type BucketListAction =
  | { type: "SET_ITEMS"; payload: BucketListItem[] }
  | { type: "ADD_ITEM"; payload: BucketListItem }
  | { type: "UPDATE_ITEM"; payload: { id: string } & Partial<BucketListItem> }
  | { type: "REMOVE_ITEM"; payload: { id: string } }
  | { type: "SET_ACTIVITIES"; payload: { bucketListItemId: string; activities: UserActivity[] } }
  | { type: "ADD_ACTIVITY"; payload: UserActivity }
  | { type: "REMOVE_ACTIVITY"; payload: { id: string; bucketListItemId: string } };

export type TravelPlanAction =
  | { type: "SET_PLANS"; payload: TravelPlan[] }
  | { type: "ADD_PLAN"; payload: TravelPlan }
  | { type: "UPDATE_PLAN"; payload: { id: string } & Partial<TravelPlan> }
  | { type: "DELETE_PLAN"; payload: { id: string } }
  | { type: "SET_ITINERARY"; payload: { planId: string; items: ItineraryItem[] } }
  | { type: "ADD_ITINERARY_ITEM"; payload: ItineraryItem }
  | { type: "UPDATE_ITINERARY_ITEM"; payload: { id: string } & Partial<ItineraryItem> }
  | { type: "DELETE_ITINERARY_ITEM"; payload: { id: string; planId: string } }
  | { type: "SET_ACCOMMODATIONS"; payload: { planId: string; items: PlanAccommodation[] } }
  | { type: "ADD_ACCOMMODATION"; payload: PlanAccommodation }
  | { type: "UPDATE_ACCOMMODATION"; payload: { id: string } & Partial<PlanAccommodation> }
  | { type: "DELETE_ACCOMMODATION"; payload: { id: string; planId: string } };

