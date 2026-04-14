# Travel Bucket List

A travel planning app where users discover countries and build a personal bucket list — powered by the RestCountries API, with Clerk authentication and Supabase persistence.

**GitHub**: https://github.com/claudea24/travel-bucketlist

## Tech Stack

- **Next.js 16** (App Router) with TypeScript
- **Tailwind CSS v4** for styling
- **Clerk** for authentication (email sign-up/sign-in)
- **Supabase** for persistent, per-user data storage (PostgreSQL + RLS)
- **RestCountries API** for country data (free, no key needed)
- **React Context + async dispatch** for client-side state with Supabase persistence

## External API: RestCountries

Base URL: `https://restcountries.com/v3.1/`

API helpers in `src/lib/countries.ts`:
- `getAllCountries()` — fetch all countries
- `searchCountries(query)` — search by name
- `getCountryByCode(code)` — single country by alpha-3 code
- `getCountriesByRegion(region)` — filter by region

No API key required.

## Database (Supabase)

### Table: `bucket_list`
- `id` (uuid PK), `user_id` (text), `country_code`, `country_name`, `capital`, `region`, `subregion`, `flag_url`, `population`, `status` (want_to_visit/visited), `notes`, `created_at`
- UNIQUE constraint on `(user_id, country_code)`
- RLS: `auth.jwt() ->> 'sub' = user_id`

## Environment Variables (`.env.local`)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=...
```

## Pages

| Route | Description |
|---|---|
| `/` | Explore — search/browse countries, save to bucket list |
| `/bucket-list` | My Bucket List — saved countries with status + notes |
| `/country/[code]` | Country Detail — full info, save/status controls |
| `/sign-in` | Clerk sign-in |
| `/sign-up` | Clerk sign-up |

## Security Rules

- Never read, display, or log the contents of `.env`, `.env.*`, or any file likely containing secrets.
- Never commit or stage `.env` files or secret-containing files.
