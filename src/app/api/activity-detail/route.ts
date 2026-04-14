import { NextRequest, NextResponse } from "next/server";

export async function POST(request: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ error: "OpenAI not configured" }, { status: 500 });
  }

  const { name, countryName } = await request.json();
  if (!name || !countryName) {
    return NextResponse.json({ error: "name and countryName required" }, { status: 400 });
  }

  const prompt = `Give me practical travel details about "${name}" in ${countryName}.

Return ONLY valid JSON (no markdown, no code fences):
{
  "whatToExpect": "2-3 sentences about what the experience is like, what visitors say, atmosphere, and what makes it special",
  "tips": ["Practical tip 1 from travelers", "Practical tip 2", "Practical tip 3", "Practical tip 4"],
  "bestTimeToVisit": "Brief answer like 'Morning' or 'Oct-Mar' or 'Sunset'",
  "estimatedDuration": "Brief like '2-3 hours' or 'Half day'",
  "estimatedCost": "Brief like 'Free' or '$10-20' or '$50-100'"
}

Be specific and practical. Write as if sharing insider knowledge with a friend.`;

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
        max_tokens: 500,
      }),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return NextResponse.json({ error: "No response" }, { status: 502 });

    const jsonStr = content.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    const details = JSON.parse(jsonStr);
    return NextResponse.json(details);
  } catch {
    return NextResponse.json({
      whatToExpect: "A popular destination worth visiting.",
      tips: ["Check opening hours before visiting", "Bring comfortable shoes"],
      bestTimeToVisit: "Varies",
      estimatedDuration: "1-3 hours",
      estimatedCost: "Varies",
    });
  }
}
