# Wanderlust — Travel Bucket List

A travel planning app with two main experiences: **Discover** destinations with rich photos and AI-powered activity suggestions, and **Personal** trip planning with AI itinerary builder and drag-and-drop calendar.

**GitHub**: https://github.com/claudea24/travel-bucketlist
**Live URL**: https://travelbucketlist-tan.vercel.app
**Supabase project ref**: `pssuuarfwhhepnxaieud`

## Tech Stack

- **Next.js 16** (App Router) with TypeScript
- **Tailwind CSS v4** — light + airy aesthetic (teal/rose accents, rounded-2xl cards, soft shadows)
- **Clerk** for authentication (email sign-up/sign-in)
- **Supabase** for persistent data (PostgreSQL + RLS, 11 tables)
- **RestCountries API** for country metadata (free, no key)
- **Open-Meteo API** for weather data (free, no key)
- **Pexels API** for destination photos (seeded, not runtime)
- **React Context + async dispatch** for client-side state with optimistic Supabase persistence

## Pages

| Route | Description |
|---|---|
| `/` | **Discover** — photo-rich destination feed with category filters |
| `/personal` | **My Trips** — bucket list + travel plan management |
| `/personal/plan/[planId]` | Trip planner — dates, budget, day-by-day itinerary |
| `/country/[code]` | Country detail — full info, save/status controls |
| `/sign-in`, `/sign-up` | Clerk authentication |
| `/bucket-list` | Redirects to `/personal` (legacy) |

## Authentication (Clerk)

- All routes protected by Clerk middleware — unauthenticated users redirect to `/sign-in`
- `ClerkProvider` wraps the app in `layout.tsx`
- Clerk JWT Template `supabase` generates HS256 tokens with `sub` = user ID
- Supabase client injects Clerk JWT via custom fetch in `src/lib/supabase.ts`

## Database (Supabase)

### Tables (11 total, all with RLS enabled)

| Table | Purpose |
|---|---|
| `bucket_list` | User's saved destinations (status: want_to_visit/planning/visited) |
| `profiles` | User profile cache |
| `destinations` | Pre-seeded destination cards with Pexels photos |
| `destination_activities` | Things to do at destinations |
| `travel_plans` | Trip plans (dates, budget, linked to bucket list items) |
| `itinerary_items` | Day-by-day items within a travel plan |

### Column Name Mapping
Database uses snake_case, TypeScript uses camelCase. Mapper files in `src/lib/mappers/`:
- `profile.ts`, `destination.ts`, `travelPlan.ts`

Legacy mappers in `src/lib/supabase.ts`: `itemFromRow()` / `itemToRow()`

## State Management (React Contexts)

| Context | File | Scope |
|---|---|---|
| `BucketListContext` | `src/context/BucketListContext.tsx` | Bucket list items (loads on auth) |
| `ProfileContext` | `src/context/ProfileContext.tsx` | Current user profile (loads on auth) |
| `TravelPlanContext` | `src/context/TravelPlanContext.tsx` | Travel plans + itinerary (lazy, on /personal) |

All contexts use optimistic updates with Supabase persistence and rollback on error.

## API Routes

| Route | Purpose |
|---|---|
| `/api/weather` | Proxies Open-Meteo API for weather data (cached 1hr) |
| `/api/activities` | AI-generated activities (OpenAI) with Wikipedia images, Wikivoyage fallback |
| `/api/activity-detail` | AI-generated detail for a single activity (what to expect, tips, cost, duration) |
| `/api/wiki-image` | Fetches Wikipedia thumbnail for a place name (cached 7 days) |
| `/api/plan-trip` | AI trip planner — generates + refines itinerary via conversational edits |

## External APIs

| API | Usage | Key Required? |
|---|---|---|
| RestCountries | Country metadata | No |
| Open-Meteo | Weather/forecast | No |
| Pexels | Destination photos (seeded into DB) | Yes (PEXELS_API_KEY, server-only) |
| Wikivoyage | Travel guides — See/Do/Eat/Drink/Buy sections | No |
| Wikipedia | Thumbnail images for activities/places | No |
| OpenAI | AI trip planner (gpt-4o-mini) | Yes (OPENAI_API_KEY, server-only) |

## Country Detail Page Features

Each country page (`/country/[code]`) includes:
- **Save button** (Airbnb-style heart) — saves to bucket list as "want_to_visit"
- **Plan My Trip button** — opens AI trip planner, sets status to "planning"
- **Quick links** — direct links to Airbnb, Google Hotels, Google Flights for the country
- **Things to Do** — auto-fetched from Wikivoyage with Wikipedia images
  - Category filters (See, Do, Eat, Drink, Shop, Culture)
  - YouTube search link per activity
  - Google Photos + Google search links
  - Heart to save individual activities (passed to AI planner)
- **AI Trip Planner** — powered by OpenAI (gpt-4o-mini)
  - Select trip duration (3-14 days)
  - Builds itinerary from your saved activities + interests
  - Day-by-day schedule with times, costs, categories
  - Hotel/Airbnb area recommendations with direct booking links
  - Budget breakdown + practical travel tips
  - **Setup wizard**: choose days (2-21), car/public transport, interests, pick from saved activities, add custom ones
  - **Diary/calendar view**: day-by-day cards with drag-and-drop reordering (@dnd-kit)
  - Click activity titles to edit inline, remove items/days
  - **Refine with AI**: chat-style input to modify ("make day 3 more relaxing", "add more food")
  - Quick suggestion chips for common refinements
  - Hotel/Airbnb area recommendations with direct booking links
  - Save finalized itinerary
  - "Plan My Trip" from country page → redirects to `/personal/plan/new` with saved activities pre-loaded

### Activity Data Pipeline
1. **Primary**: OpenAI generates 12-15 specific activities per country (real place names, descriptions, categories)
2. **Fallback**: Wikivoyage API parsing if OpenAI unavailable
3. **Images**: Wikipedia API thumbnails fetched in parallel for each activity
4. **Links**: Auto-generated YouTube search + Google Images + Google search per activity

## Environment Variables (`.env.local`)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_SUPABASE_URL=https://pssuuarfwhhepnxaieud.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
PEXELS_API_KEY=...
SUPABASE_SERVICE_ROLE_KEY=...
OPENAI_API_KEY=sk-...
```

## Supabase MCP
```bash
claude mcp add supabase --transport http "https://mcp.supabase.com/mcp?project_ref=pssuuarfwhhepnxaieud"
```

## Deployment (Vercel)
- Auto-builds from `main` branch on GitHub
- Clerk dashboard must include Vercel domain in allowed redirect origins

## Project Structure

```
src/
├── app/
│   ├── layout.tsx                    # Root layout (ClerkProvider + Navbar)
│   ├── page.tsx                      # Discover feed (Home)
│   ├── globals.css                   # Tailwind + theme
│   ├── api/
│   │   ├── weather/route.ts          # Open-Meteo proxy
│   │   ├── activities/route.ts       # Wikivoyage + Wikipedia images
│   │   └── plan-trip/route.ts        # OpenAI trip planner
│   ├── bucket-list/page.tsx          # Redirect to /personal
│   ├── personal/
│   │   ├── page.tsx                  # My Trips dashboard
│   │   ├── PersonalPageClient.tsx
│   │   └── plan/[planId]/
│   │       ├── page.tsx              # Trip planner
│   │       └── TripPlannerClient.tsx
│   ├── country/[code]/page.tsx       # Country detail
│   ├── sign-in/[[...sign-in]]/
│   └── sign-up/[[...sign-up]]/
├── components/
│   ├── shared/                       # Reusable UI components
│   │   ├── LoadingSpinner.tsx
│   │   ├── EmptyState.tsx
│   │   ├── CategoryPill.tsx
│   │   ├── SaveButton.tsx
│   │   ├── StatusBadge.tsx
│   │   ├── UserAvatar.tsx
│   │   ├── ActivitySection.tsx       # Activity cards with lazy images + YouTube
│   │   ├── ActivityModal.tsx         # Expandable detail modal (tips, videos, links)
│   │   └── AiTripPlanner.tsx         # OpenAI-powered itinerary generator
│   ├── home/                         # Discover page components
│   │   ├── HomeFeed.tsx
│   │   ├── DestinationCard.tsx
│   │   └── CategoryFilter.tsx
│   ├── personal/                     # My Trips components
│   │   ├── PersonalDashboard.tsx
│   │   ├── TravelPlanCard.tsx
│   │   ├── TripPlanner.tsx
│   │   ├── TripSetup.tsx             # Trip planning setup wizard
│   │   └── TripCalendar.tsx          # Diary/calendar view with drag-and-drop
│   ├── Navbar.tsx                    # Top nav (Discover/My Trips)
│   ├── ClientProviders.tsx           # Context wrapper
│   ├── CountryCard.tsx               # Legacy country card
│   ├── CountryDetail.tsx             # Country detail page
│   ├── ExploreCountries.tsx          # Legacy explore (replaced by HomeFeed)
│   └── BucketList.tsx                # Legacy bucket list (replaced by PersonalDashboard)
├── context/
│   ├── BucketListContext.tsx
│   ├── ProfileContext.tsx
│   └── TravelPlanContext.tsx
├── lib/
│   ├── types.ts                      # All TypeScript interfaces + action types
│   ├── supabase.ts                   # Supabase client + legacy row mappers
│   ├── countries.ts                  # RestCountries API helpers
│   └── mappers/                      # snake_case ↔ camelCase row mappers
│       ├── profile.ts
│       ├── destination.ts
│       ├── travelPlan.ts
└── middleware.ts                     # Clerk route protection
```

## Getting Started

```bash
npm install
npm run dev        # http://localhost:3000
```

## Security Rules

- Never read, display, or log the contents of `.env`, `.env.*`, or any file likely containing secrets.
- Never commit or stage `.env` files or secret-containing files.
- Never push secrets to GitHub. If secrets are accidentally staged, unstage them immediately and alert the user.
