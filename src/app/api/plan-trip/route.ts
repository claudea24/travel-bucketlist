import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  const body = await request.json();
  const { countryName, activities, days, interests, hasTransport, currentItinerary, refineRequest } = body;

  if (!countryName) {
    return NextResponse.json({ error: "countryName is required" }, { status: 400 });
  }

  const selectedActivities = (activities || []).join(", ");
  const tripDays = days || 5;
  const userInterests = interests || "sightseeing, food, culture";

  let prompt: string;

  if (refineRequest && currentItinerary) {
    // Refine existing itinerary
    prompt = `You are an expert travel planner. The user has an existing itinerary for ${countryName} and wants to modify it.

Current itinerary:
${currentItinerary}

User's request: "${refineRequest}"

Apply the user's changes to the itinerary. Return the COMPLETE updated itinerary as a JSON object (no markdown, no code fences, just valid JSON) with this structure:
{
  "title": "Trip title",
  "summary": "Updated 1-2 sentence overview",
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "activities": [
        {
          "time": "9:00 AM",
          "title": "Activity name",
          "description": "What to do and tips",
          "category": "sightseeing|food|adventure|culture|relaxation|shopping|nightlife|nature",
          "estimatedCost": "$20-30"
        }
      ]
    }
  ],
  "accommodation": [
    {
      "area": "Neighborhood name",
      "description": "Why this area is good",
      "budgetRange": "$50-100/night",
      "searchUrl": "https://www.google.com/travel/hotels/DESTINATION"
    }
  ],
  "tips": ["Tip 1", "Tip 2", "Tip 3"],
  "estimatedBudget": {
    "accommodation": "$X-Y per night",
    "food": "$X-Y per day",
    "activities": "$X-Y total",
    "transport": "$X-Y total"
  }
}`;
  } else {
    // Generate new itinerary
    prompt = `You are an expert travel planner. Create a detailed ${tripDays}-day travel itinerary for ${countryName}.

${selectedActivities ? `The traveler is especially interested in: ${selectedActivities}` : ""}
Their general interests: ${userInterests}
Transportation: ${hasTransport ? "They have a rental car so include driving destinations and day trips" : "They will use public transport, taxis, and walking — keep activities accessible without a car"}

Return ONLY a JSON object (no markdown, no code fences, just valid JSON):
{
  "title": "Your Trip to ${countryName}",
  "summary": "A brief 1-2 sentence overview",
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "activities": [
        {
          "time": "9:00 AM",
          "title": "Activity name",
          "description": "What to do and tips",
          "category": "sightseeing|food|adventure|culture|relaxation|shopping|nightlife|nature",
          "estimatedCost": "$20-30"
        }
      ]
    }
  ],
  "accommodation": [
    {
      "area": "Neighborhood/area name",
      "description": "Why this area is good to stay",
      "budgetRange": "$50-100/night",
      "searchUrl": "https://www.google.com/travel/hotels/DESTINATION"
    }
  ],
  "tips": ["Practical tip 1", "Practical tip 2", "Practical tip 3"],
  "estimatedBudget": {
    "accommodation": "$X-Y per night",
    "food": "$X-Y per day",
    "activities": "$X-Y total",
    "transport": "$X-Y total"
  }
}

Use real, specific place names and realistic prices. Include 2-3 accommodation area options with different vibes/budgets.`;
  }

  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 4000,
      }),
    });

    const data = await res.json();

    if (!data.choices?.[0]?.message?.content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 502 });
    }

    const content = data.choices[0].message.content.trim();

    let itinerary;
    try {
      const jsonStr = content.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
      itinerary = JSON.parse(jsonStr);
    } catch {
      return NextResponse.json({ error: "Failed to parse itinerary", raw: content }, { status: 500 });
    }

    return NextResponse.json(itinerary);
  } catch (error) {
    console.error("OpenAI error:", error);
    return NextResponse.json({ error: "Failed to generate itinerary" }, { status: 500 });
  }
}
