import { Destination, DestinationActivity } from "../types";

export function destinationFromRow(row: Record<string, unknown>): Destination {
  return {
    id: row.id as string,
    countryCode: row.country_code as string,
    countryName: row.country_name as string,
    category: row.category as Destination["category"],
    title: row.title as string,
    subtitle: (row.subtitle as string) || null,
    description: (row.description as string) || null,
    photoUrl: (row.photo_url as string) || null,
    photoAttribution: (row.photo_attribution as string) || null,
    latitude: (row.latitude as number) || null,
    longitude: (row.longitude as number) || null,
    popularityScore: (row.popularity_score as number) || 0,
  };
}

export function destinationActivityFromRow(
  row: Record<string, unknown>
): DestinationActivity {
  return {
    id: row.id as string,
    destinationId: row.destination_id as string,
    name: row.name as string,
    description: (row.description as string) || null,
    category: (row.category as string) || null,
    photoUrl: (row.photo_url as string) || null,
    rating: (row.rating as number) || null,
    source: (row.source as string) || "opentripmap",
    externalId: (row.external_id as string) || null,
    latitude: (row.latitude as number) || null,
    longitude: (row.longitude as number) || null,
  };
}
