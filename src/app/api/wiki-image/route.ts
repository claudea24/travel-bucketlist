import { NextRequest, NextResponse } from "next/server";

const HEADERS = { "User-Agent": "TravelBucketList/1.0" };

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ imageUrl: null });
  }

  try {
    // Strategy 1: Direct page lookup (fast, exact match)
    let imageUrl = await getImageByTitle(query);
    if (imageUrl) return NextResponse.json({ imageUrl });

    // Strategy 2: Search Wikipedia and get first result's image
    imageUrl = await searchAndGetImage(query);
    if (imageUrl) return NextResponse.json({ imageUrl });

    // Strategy 3: Search Wikimedia Commons directly
    imageUrl = await searchCommonsImage(query);
    if (imageUrl) return NextResponse.json({ imageUrl });

    return NextResponse.json({ imageUrl: null });
  } catch {
    return NextResponse.json({ imageUrl: null });
  }
}

async function getImageByTitle(title: string): Promise<string | null> {
  const res = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(title)}&prop=pageimages&format=json&pithumbsize=500&origin=*`,
    { headers: HEADERS, next: { revalidate: 604800 } }
  );
  const data = await res.json();
  const pages = data?.query?.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0] as { thumbnail?: { source: string } };
  return page?.thumbnail?.source || null;
}

async function searchAndGetImage(query: string): Promise<string | null> {
  // Search for the page
  const searchRes = await fetch(
    `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&srlimit=1&format=json&origin=*`,
    { headers: HEADERS, next: { revalidate: 604800 } }
  );
  const searchData = await searchRes.json();
  const title = searchData?.query?.search?.[0]?.title;
  if (!title) return null;

  return getImageByTitle(title);
}

async function searchCommonsImage(query: string): Promise<string | null> {
  const res = await fetch(
    `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=1&prop=imageinfo&iiprop=url&iiurlwidth=500&format=json&origin=*`,
    { headers: HEADERS, next: { revalidate: 604800 } }
  );
  const data = await res.json();
  const pages = data?.query?.pages;
  if (!pages) return null;
  const page = Object.values(pages)[0] as { imageinfo?: { thumburl?: string }[] };
  const url = page?.imageinfo?.[0]?.thumburl;
  if (!url || url.includes(".svg")) return null;
  return url;
}
