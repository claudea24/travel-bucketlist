# Wanderlust — Travel Bucket List

A travel planning app with three main experiences: **Discover** destinations with rich photos, **Personal** trip planning with itinerary builder, and a **Community** social feed for sharing stories and tips.

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
| `/social` | **Community** — social feed of stories + tips |
| `/social/create` | Create a new post (story or tip) |
| `/social/post/[postId]` | Post detail with comments |
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
| `profiles` | User profile cache for social features |
| `destinations` | Pre-seeded destination cards with Pexels photos |
| `destination_activities` | Things to do at destinations (from OpenTripMap) |
| `user_activities` | Activities saved to personal bucket list items |
| `travel_plans` | Trip plans (dates, budget, linked to bucket list items) |
| `itinerary_items` | Day-by-day items within a travel plan |
| `social_posts` | Travel stories and tips |
| `post_comments` | Comments on social posts |
| `post_likes` | Like/unlike with UNIQUE(post_id, user_id) |
| `follows` | Follow relationships between users |

### DB Triggers
- `trigger_update_likes_count` — auto-updates `social_posts.likes_count`
- `trigger_update_comments_count` — auto-updates `social_posts.comments_count`

### Column Name Mapping
Database uses snake_case, TypeScript uses camelCase. Mapper files in `src/lib/mappers/`:
- `profile.ts`, `destination.ts`, `travelPlan.ts`, `social.ts`, `userActivity.ts`

Legacy mappers in `src/lib/supabase.ts`: `itemFromRow()` / `itemToRow()`

## State Management (React Contexts)

| Context | File | Scope |
|---|---|---|
| `BucketListContext` | `src/context/BucketListContext.tsx` | Bucket list items (loads on auth) |
| `ProfileContext` | `src/context/ProfileContext.tsx` | Current user profile (loads on auth) |
| `TravelPlanContext` | `src/context/TravelPlanContext.tsx` | Travel plans + itinerary (lazy, on /personal) |
| `SocialContext` | `src/context/SocialContext.tsx` | Social feed, likes, follows (lazy, on /social) |

All contexts use optimistic updates with Supabase persistence and rollback on error.

## API Routes

| Route | Purpose |
|---|---|
| `/api/weather` | Proxies Open-Meteo API for weather data (cached 1hr) |

## External APIs

| API | Usage | Key Required? |
|---|---|---|
| RestCountries | Country metadata | No |
| Open-Meteo | Weather/forecast | No |
| Pexels | Destination photos (seeded into DB) | Yes (PEXELS_API_KEY, server-only) |

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
│   ├── api/weather/route.ts          # Open-Meteo proxy
│   ├── bucket-list/page.tsx          # Redirect to /personal
│   ├── personal/
│   │   ├── page.tsx                  # My Trips dashboard
│   │   ├── PersonalPageClient.tsx
│   │   └── plan/[planId]/
│   │       ├── page.tsx              # Trip planner
│   │       └── TripPlannerClient.tsx
│   ├── social/
│   │   ├── page.tsx                  # Community feed
│   │   ├── SocialPageClient.tsx
│   │   ├── create/                   # Create post
│   │   └── post/[postId]/            # Post detail
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
│   │   └── UserAvatar.tsx
│   ├── home/                         # Discover page components
│   │   ├── HomeFeed.tsx
│   │   ├── DestinationCard.tsx
│   │   └── CategoryFilter.tsx
│   ├── personal/                     # My Trips components
│   │   ├── PersonalDashboard.tsx
│   │   ├── TravelPlanCard.tsx
│   │   └── TripPlanner.tsx
│   ├── social/                       # Community components
│   │   ├── SocialFeed.tsx
│   │   ├── PostCard.tsx
│   │   ├── PostDetail.tsx
│   │   └── CreatePostForm.tsx
│   ├── Navbar.tsx                    # Top nav (Discover/My Trips/Community)
│   ├── ClientProviders.tsx           # Context wrapper
│   ├── CountryCard.tsx               # Legacy country card
│   ├── CountryDetail.tsx             # Country detail page
│   ├── ExploreCountries.tsx          # Legacy explore (replaced by HomeFeed)
│   └── BucketList.tsx                # Legacy bucket list (replaced by PersonalDashboard)
├── context/
│   ├── BucketListContext.tsx
│   ├── ProfileContext.tsx
│   ├── TravelPlanContext.tsx
│   └── SocialContext.tsx
├── lib/
│   ├── types.ts                      # All TypeScript interfaces + action types
│   ├── supabase.ts                   # Supabase client + legacy row mappers
│   ├── countries.ts                  # RestCountries API helpers
│   └── mappers/                      # snake_case ↔ camelCase row mappers
│       ├── profile.ts
│       ├── destination.ts
│       ├── travelPlan.ts
│       ├── social.ts
│       └── userActivity.ts
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
