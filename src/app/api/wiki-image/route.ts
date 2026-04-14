import { NextRequest, NextResponse } from "next/server";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ imageUrl: null });
  }

  try {
    const res = await fetch(
      `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(query)}&prop=pageimages&format=json&pithumbsize=400&origin=*`,
      {
        headers: { "User-Agent": "TravelBucketList/1.0" },
        next: { revalidate: 604800 }, // cache 7 days
      }
    );
    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return NextResponse.json({ imageUrl: null });

    const page = Object.values(pages)[0] as { thumbnail?: { source: string } };
    return NextResponse.json({ imageUrl: page?.thumbnail?.source || null });
  } catch {
    return NextResponse.json({ imageUrl: null });
  }
}
