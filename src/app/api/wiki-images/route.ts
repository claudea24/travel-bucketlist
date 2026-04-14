import { NextRequest, NextResponse } from "next/server";

// Fetch multiple images from Wikimedia Commons for a place
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ images: [] });
  }

  try {
    const res = await fetch(
      `https://commons.wikimedia.org/w/api.php?action=query&generator=search&gsrsearch=${encodeURIComponent(query)}&gsrlimit=6&prop=imageinfo&iiprop=url|extmetadata&iiurlwidth=500&format=json&origin=*`,
      {
        headers: { "User-Agent": "TravelBucketList/1.0" },
        next: { revalidate: 604800 }, // cache 7 days
      }
    );

    const data = await res.json();
    const pages = data?.query?.pages;
    if (!pages) return NextResponse.json({ images: [] });

    const images = Object.values(pages)
      .map((page: unknown) => {
        const p = page as { imageinfo?: { thumburl?: string; extmetadata?: { ImageDescription?: { value?: string } } }[] };
        const info = p.imageinfo?.[0];
        if (!info?.thumburl) return null;
        // Filter out SVG, icons, and very small files
        if (info.thumburl.includes(".svg") || info.thumburl.includes("icon")) return null;
        return {
          url: info.thumburl,
          caption: info.extmetadata?.ImageDescription?.value?.replace(/<[^>]+>/g, "").slice(0, 100) || "",
        };
      })
      .filter(Boolean)
      .slice(0, 6);

    return NextResponse.json({ images });
  } catch {
    return NextResponse.json({ images: [] });
  }
}
