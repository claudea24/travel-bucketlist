import { NextRequest, NextResponse } from "next/server";

// Use Piped API (free YouTube frontend) to search for videos and get real video IDs
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q");

  if (!query) {
    return NextResponse.json({ videos: [] });
  }

  try {
    // Try multiple Piped instances for reliability
    const instances = [
      "https://pipedapi.kavin.rocks",
      "https://pipedapi.adminforge.de",
    ];

    for (const instance of instances) {
      try {
        const res = await fetch(
          `${instance}/search?q=${encodeURIComponent(query)}&filter=videos`,
          { next: { revalidate: 86400 } } // cache 24hr
        );
        if (!res.ok) continue;

        const data = await res.json();
        const items = (data.items || data).slice(0, 3);

        const videos = items
          .filter((item: { url?: string; title?: string }) => item.url && item.title)
          .map((item: { url: string; title: string; thumbnail?: string; uploaderName?: string; duration?: number }) => {
            const videoId = item.url.replace("/watch?v=", "");
            return {
              videoId,
              title: item.title,
              thumbnail: item.thumbnail || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`,
              channel: item.uploaderName || "",
              duration: item.duration || 0,
            };
          });

        if (videos.length > 0) {
          return NextResponse.json({ videos });
        }
      } catch {
        continue;
      }
    }

    return NextResponse.json({ videos: [] });
  } catch {
    return NextResponse.json({ videos: [] });
  }
}
