import { NextRequest, NextResponse } from "next/server";

const HEADERS = { "User-Agent": "TravelBucketList/1.0 (educational project)" };

interface WikiSection {
  title: string;
  content: string;
}

interface Activity {
  name: string;
  description: string;
  category: string;
  source: string;
  imageUrl: string | null;
  youtubeSearchUrl: string;
}

const SECTION_MAP: Record<string, string> = {
  see: "sightseeing",
  do: "adventure",
  eat: "food",
  drink: "nightlife",
  buy: "shopping",
  understand: "culture",
};

const RELEVANT_SECTIONS = new Set(["see", "do", "eat", "drink", "buy", "understand"]);

async function wikiApiFetch(url: string) {
  const res = await fetch(url, { headers: HEADERS, next: { revalidate: 86400 } });
  return res.json();
}

// Fetch thumbnail from Wikipedia for a place name
async function fetchWikipediaImage(name: string): Promise<string | null> {
  try {
    const data = await wikiApiFetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(name)}&prop=pageimages&format=json&pithumbsize=400&origin=*`
    );
    const pages = data?.query?.pages;
    if (!pages) return null;
    const page = Object.values(pages)[0] as { thumbnail?: { source: string } };
    return page?.thumbnail?.source || null;
  } catch {
    return null;
  }
}

// Batch fetch images for multiple activity names
async function fetchImagesForActivities(activities: Activity[], countryName: string): Promise<void> {
  // Fetch images in parallel, max 8 at a time
  const tasks = activities.slice(0, 12).map(async (activity) => {
    // Try activity name first, then with country name
    let img = await fetchWikipediaImage(activity.name);
    if (!img && !activity.name.includes(countryName)) {
      img = await fetchWikipediaImage(`${activity.name} ${countryName}`);
    }
    activity.imageUrl = img;
  });
  await Promise.all(tasks);
}

async function fetchWikivoyageSections(placeName: string): Promise<WikiSection[]> {
  const searchData = await wikiApiFetch(
    `https://en.wikivoyage.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(placeName)}&format=json&origin=*`
  );

  const pageTitle = searchData?.query?.search?.[0]?.title;
  if (!pageTitle) return [];

  const sectionsData = await wikiApiFetch(
    `https://en.wikivoyage.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&prop=sections&format=json&origin=*`
  );

  const sections = sectionsData?.parse?.sections || [];
  const results: WikiSection[] = [];

  for (const section of sections) {
    const sectionName = section.line?.toLowerCase();
    if (!RELEVANT_SECTIONS.has(sectionName)) continue;

    const contentData = await wikiApiFetch(
      `https://en.wikivoyage.org/w/api.php?action=parse&page=${encodeURIComponent(pageTitle)}&section=${section.index}&prop=wikitext&format=json&origin=*`
    );

    const wikitext = contentData?.parse?.wikitext?.["*"] || "";
    if (wikitext.length > 50) {
      results.push({ title: sectionName, content: wikitext });
    }
  }

  return results;
}

function makeYoutubeSearchUrl(name: string, country: string): string {
  const query = `${name} ${country} travel`;
  return `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}`;
}

function parseWikitextToActivities(sections: WikiSection[], countryName: string): Activity[] {
  const activities: Activity[] = [];

  for (const section of sections) {
    const category = SECTION_MAP[section.title] || "sightseeing";
    let foundForSection = false;

    // Strategy 1: Parse {{listing}}/{{see}}/{{do}}/{{eat}} templates
    const listingRegex = /\{\{(?:listing|see|do|eat|drink|buy|sleep|go)\s*\|([^}]*(?:\{[^}]*\}[^}]*)*)\}\}/gi;
    let match;

    while ((match = listingRegex.exec(section.content)) !== null) {
      const params = match[1];
      const name = params.match(/name\s*=\s*([^|}\n]+)/)?.[1]?.trim();
      const content = params.match(/content\s*=\s*([^|}\n][^}\n]*)/)?.[1]?.trim();
      const alt = params.match(/alt\s*=\s*([^|}\n]+)/)?.[1]?.trim();
      const description = content || alt || "";

      if (name && name.length > 1 && name.length < 100) {
        const cleanName = cleanWikitext(name);
        activities.push({
          name: cleanName,
          description: cleanWikitext(description).slice(0, 400),
          category,
          source: "wikivoyage",
          imageUrl: null,
          youtubeSearchUrl: makeYoutubeSearchUrl(cleanName, countryName),
        });
        foundForSection = true;
      }
    }

    // Strategy 2: '''bold names''' with descriptions
    if (!foundForSection) {
      const boldRegex = /'''([^']{2,60})'''\s*[-–—:.]?\s*([^\n]{15,})/g;
      let boldMatch;
      while ((boldMatch = boldRegex.exec(section.content)) !== null) {
        const name = boldMatch[1].trim();
        const desc = boldMatch[2].trim();
        if (name.length > 1 && !name.startsWith("=")) {
          const cleanName = cleanWikitext(name);
          activities.push({
            name: cleanName,
            description: cleanWikitext(desc).slice(0, 400),
            category,
            source: "wikivoyage",
            imageUrl: null,
            youtubeSearchUrl: makeYoutubeSearchUrl(cleanName, countryName),
          });
          foundForSection = true;
        }
      }
    }

    // Strategy 3: ===Subsection=== headers
    if (!foundForSection) {
      const subHeadingRegex = /===\s*([^=\n]+)\s*===/g;
      let subMatch;
      while ((subMatch = subHeadingRegex.exec(section.content)) !== null) {
        const name = subMatch[1].trim();
        const afterHeading = section.content.slice(subMatch.index + subMatch[0].length);
        const nextHeading = afterHeading.search(/===/);
        const paragraph = afterHeading.slice(0, nextHeading > 0 ? nextHeading : 500).trim();
        const desc = cleanWikitext(paragraph).slice(0, 400);

        if (name.length > 1 && name.length < 60 && desc.length > 20) {
          const cleanName = cleanWikitext(name);
          activities.push({
            name: cleanName,
            description: desc,
            category,
            source: "wikivoyage",
            imageUrl: null,
            youtubeSearchUrl: makeYoutubeSearchUrl(cleanName, countryName),
          });
          foundForSection = true;
        }
      }
    }

    // Strategy 4: Fallback summary
    if (!foundForSection) {
      const plainText = cleanWikitext(section.content).slice(0, 500);
      if (plainText.length > 50) {
        const label =
          section.title === "see" ? "Sightseeing Highlights" :
          section.title === "do" ? "Activities & Experiences" :
          section.title === "eat" ? "Local Cuisine" :
          section.title === "drink" ? "Nightlife & Drinks" :
          section.title === "buy" ? "Shopping" :
          "Local Culture";

        activities.push({
          name: label,
          description: plainText.slice(0, 400),
          category,
          source: "wikivoyage",
          imageUrl: null,
          youtubeSearchUrl: makeYoutubeSearchUrl(label, countryName),
        });
      }
    }
  }

  return activities.slice(0, 20);
}

function cleanWikitext(text: string): string {
  return text
    .replace(/\{\{[^}]*\}\}/g, "")
    .replace(/\[\[(?:File|Image):[^\]]*\]\]/gi, "")
    .replace(/\[\[(?:[^\]|]*\|)?([^\]]*)\]\]/g, "$1")
    .replace(/'{2,}/g, "")
    .replace(/<ref[^>]*>.*?<\/ref>/gi, "")
    .replace(/<ref[^/]*\/>/gi, "")
    .replace(/<[^>]+>/g, "")
    .replace(/\n{2,}/g, "\n")
    .replace(/==+[^=]+=+/g, "")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const countryName = searchParams.get("country");
  const countryCode = searchParams.get("code");

  if (!countryName) {
    return NextResponse.json({ error: "country parameter required" }, { status: 400 });
  }

  try {
    const sections = await fetchWikivoyageSections(countryName);
    const activities = parseWikitextToActivities(sections, countryName);

    // Fetch Wikipedia images in parallel
    await fetchImagesForActivities(activities, countryName);

    return NextResponse.json({
      country: countryName,
      countryCode,
      activities,
      source: "wikivoyage",
      cachedAt: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Wikivoyage fetch error:", error);
    return NextResponse.json({ error: "Failed to fetch activities" }, { status: 500 });
  }
}
