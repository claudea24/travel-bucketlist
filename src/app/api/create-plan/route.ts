import { NextRequest, NextResponse } from "next/server";
import { auth } from "@clerk/nextjs/server";
import { createClient } from "@supabase/supabase-js";

export async function POST(request: NextRequest) {
  const { userId, getToken } = await auth();
  if (!userId) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { countryCode, countryName, startDate, endDate, title } = await request.json();
  if (!countryCode || !countryName) {
    return NextResponse.json({ error: "countryCode and countryName required" }, { status: 400 });
  }

  const token = await getToken({ template: "supabase" });
  if (!token) {
    return NextResponse.json({ error: "Failed to get Supabase token" }, { status: 500 });
  }

  const client = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    { global: { headers: { Authorization: `Bearer ${token}` } } }
  );

  const planId = crypto.randomUUID();
  const { error } = await client.from("travel_plans").insert({
    id: planId,
    user_id: userId,
    country_code: countryCode,
    country_name: countryName,
    title: title || `Trip to ${countryName}`,
    start_date: startDate || null,
    end_date: endDate || null,
    status: "draft",
  });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ planId });
}
