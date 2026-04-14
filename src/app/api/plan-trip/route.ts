import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI API key not configured" }, { status: 500 });
  }

  const body = await request.json();
  const { countryName, activities, days, interests } = body;

  if (!countryName) {
    return NextResponse.json({ error: "countryName is required" }, { status: 400 });
  }

  const selectedActivities = (activities || []).join(", ");
  const tripDays = days || 5;
  const userInterests = interests || "sightseeing, food, culture";

  const prompt = `You are an expert travel planner. Create a detailed ${tripDays}-day travel itinerary for ${countryName}.

${selectedActivities ? `The traveler is especially interested in these activities: ${selectedActivities}` : ""}
Their general interests include: ${userInterests}

Return a JSON object with this exact structure (no markdown, no code fences, just valid JSON):
{
  "title": "Your Trip to ${countryName}",
  "summary": "A brief 1-2 sentence overview of the trip",
  "days": [
    {
      "day": 1,
      "title": "Day title",
      "activities": [
        {
          "time": "9:00 AM",
          "title": "Activity name",
          "description": "What to do and tips",
          "category": "sightseeing|food|adventure|culture|relaxation|shopping",
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
      "searchUrl": "a Google search URL for hotels in that area"
    }
  ],
  "tips": ["Practical travel tip 1", "Practical travel tip 2", "Practical travel tip 3"],
  "estimatedBudget": {
    "accommodation": "$X-Y per night",
    "food": "$X-Y per day",
    "activities": "$X-Y total",
    "transport": "$X-Y total"
  }
}

Make it specific and practical. Include real place names, real neighborhoods, and realistic prices. For accommodation searchUrl, use format: https://www.google.com/travel/hotels/DESTINATION`;

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
        max_tokens: 3000,
      }),
    });

    const data = await res.json();

    if (!data.choices?.[0]?.message?.content) {
      return NextResponse.json({ error: "No response from AI" }, { status: 502 });
    }

    const content = data.choices[0].message.content.trim();

    // Parse the JSON response (handle potential code fences)
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
