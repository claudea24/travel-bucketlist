-- =============================================
-- Travel Bucket List — Supabase Table Setup
-- Run this in the Supabase SQL Editor
-- =============================================

-- 1. Create the bucket_list table
CREATE TABLE IF NOT EXISTS bucket_list (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL,
  country_code TEXT NOT NULL,
  country_name TEXT NOT NULL,
  capital TEXT,
  region TEXT,
  subregion TEXT,
  flag_url TEXT,
  population BIGINT DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'want_to_visit'
    CHECK (status IN ('want_to_visit', 'visited')),
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (user_id, country_code)
);

-- 2. Enable Row Level Security
ALTER TABLE bucket_list ENABLE ROW LEVEL SECURITY;

-- 3. RLS Policies — users can only access their own rows
CREATE POLICY "Users can read own bucket list items"
  ON bucket_list FOR SELECT
  USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can insert own bucket list items"
  ON bucket_list FOR INSERT
  WITH CHECK (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can update own bucket list items"
  ON bucket_list FOR UPDATE
  USING (auth.jwt() ->> 'sub' = user_id);

CREATE POLICY "Users can delete own bucket list items"
  ON bucket_list FOR DELETE
  USING (auth.jwt() ->> 'sub' = user_id);
