import { NextRequest, NextResponse } from "next/server";

const WIKI_HEADERS = { "User-Agent": "TravelBucketList/1.0 (educational project)" };

interface Activity {
  name: string;
  description: string;
  category: string;
  source: string;
  imageUrl: string | null;
  youtubeSearchUrl: string;
}

// Fetch thumbnail from Wikipedia
async function fetchWikipediaImage(name: string): Promise<string | null> {
  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name)}&prop=pageimages&format=json&pithumbsize=400&origin=*`,
      { headers: WIKI_HEADERS, next: { revalidate: 86400 } }
    );
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0] as { thumbnail?: { source: string } };
    return page?.thumbnail?.source || null;
  } catch {
    return null;
  }
}

function makeYoutubeSearchUrl(name: string, country: string): string {
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(name + " " + country + " travel")}`;
}

// Use OpenAI to generate activities, or fall back to Wikivoyage
async function generateActivitiesWithAI(countryName: string): Promise<Activity[]> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) return [];

  const prompt = `You are a travel expert. List 12-15 specific things to do in ${countryName} that a tourist would love.

Return ONLY a JSON array (no markdown, no code fences). Each item:
{
  "name": "Specific place or activity name",
  "description": "2-3 sentences about why it's amazing and practical tips",
  "category": "sightseeing|food|adventure|culture|nightlife|shopping|nature|relaxation"
}

Include a mix of categories. Use real, specific place names (not generic like "visit temples" — say "Tanah Lot Temple" or "Tsukiji Market"). Include hidden gems alongside popular spots.`;

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
        temperature: 0.8,
        max_tokens: 2000,
      }),
    });

    const data = await res.json();
    const content = data.choices?.[0]?.message?.content?.trim();
    if (!content) return [];

    const jsonStr = content.replace(/^```json?\n?/, "").replace(/\n?```$/, "");
    const items = JSON.parse(jsonStr);

    return items.map((item: { name: string; description: string; category: string }) => ({
      name: item.name,
      description: item.description,
      category: item.category,
      source: "ai",
      imageUrl: null,
      youtubeSearchUrl: makeYoutubeSearchUrl(item.name, countryName),
    }));
  } catch (e) {
    console.error("OpenAI activities error:", e);
    return [];
  }
}

// Fallback: Wikivoyage
async function fetchWikivoyageActivities(countryName: string): Promise<Activity[]> {
  try {
    const searchData = await (
      await fetch(
        `https://en.wikivoyage.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(countryName)}&format=json&origin=*`,
        { headers: WIKI_HEADERS }
      )
    ).json();

    const pageTitle = searchData?.query?.search?.[0]?.title;
    if (!pageTitle) return [];

    const sectionsData = await (
      await fetch(
        `https://en.wikivoyage.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=sections&format=json&origin=*`,
        { headers: WIKI_HEADERS }
      )
    ).json();

    const sectionMap: Record<string, string> = {
      see: "sightseeing", do: "adventure", eat: "food",
      drink: "nightlife", buy: "shopping",
    };
    const relevant = new Set(Object.keys(sectionMap));
    const activities: Activity[] = [];

    for (const section of sectionsData?.parse?.sections || []) {
      const name = section.line?.toLowerCase();
      if (!relevant.has(name)) continue;

      const contentData = await (
        await fetch(
          `https://en.wikivoyage.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&section=${section.index}&prop=wikitext&format=json&origin=*`,
          { headers: WIKI_HEADERS }
        )
      ).json();

      const wikitext = contentData?.parse?.wikitext?.["*"] || "";
      const category = sectionMap[name] || "sightseeing";

      // Extract bold names
      const boldRegex = /'''([^']{2,60})'''\s*[-–—:.]?\s*([^\n]{15,})/g;
      let m;
      while ((m = boldRegex.exec(wikitext)) !== null) {
        const actName = m[1].trim().replace(/\[\[.*?\|?|\]\]/g, "").replace(/'{2,}/g, "");
        const desc = m[2].trim().replace(/\[\[.*?\|?|\]\]/g, "").replace(/\{\{.*?\}\}/g, "").replace(/<[^>]+>/g, "");
        if (actName.length > 1 && actName.length < 80) {
          activities.push({
            name: actName,
            description: desc.slice(0, 300),
            category,
            source: "wikivoyage",
            imageUrl: null,
            youtubeSearchUrl: makeYoutubeSearchUrl(actName, countryName),
          });
        }
      }
    }

    return activities.slice(0, 15);
  } catch {
    return [];
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const countryName = searchParams.get("country");
  const countryCode = searchParams.get("code");

  if (!countryName) {
    return NextResponse.json({ error: "country parameter required" }, { status: 400 });
  }

  try {
    // Try AI first, fall back to Wikivoyage
    let activities = await generateActivitiesWithAI(countryName);
    if (activities.length === 0) {
      activities = await fetchWikivoyageActivities(countryName);
    }

    // Fetch Wikipedia images in parallel
    await Promise.all(
      activities.slice(0, 15).map(async (activity) => {
        let img = await fetchWikipediaImage(activity.name);
        if (!img) img = await fetchWikipediaImage(`${activity.name} ${countryName}`);
        activity.imageUrl = img;
      })
    );

    return NextResponse.json({
      country: countryName,
      countryCode,
      activities,
      source: activities[0]?.source || "none",
      cachedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Activities fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}
