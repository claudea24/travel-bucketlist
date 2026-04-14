"use client";

import Image from "next/image";
import Link from "next/link";
import { Destination } from "@/lib/types";
import SaveButton from "@/components/shared/SaveButton";
import { useBucketList } from "@/context/BucketListContext";

interface DestinationCardProps {
  destination: Destination;
}

export default function DestinationCard({ destination }: DestinationCardProps) {
  const { items, dispatch } = useBucketList();
  const isSaved = items.some((i) => i.countryCode === destination.countryCode);

  const handleToggleSave = () => {
    if (isSaved) {
      const item = items.find((i) => i.countryCode === destination.countryCode);
      if (item) dispatch({ type: "REMOVE_ITEM", payload: { id: item.id } });
    } else {
      dispatch({
        type: "ADD_ITEM",
        payload: {
          id: crypto.randomUUID(),
          countryCode: destination.countryCode,
          countryName: destination.countryName,
          capital: "",
          region: "",
          subregion: "",
          flagUrl: "",
          population: 0,
          status: "want_to_visit",
          notes: "",
        },
      });
    }
  };

  const categoryColors: Record<string, string> = {
    beach: "bg-cyan-50 text-cyan-700",
    mountains: "bg-emerald-50 text-emerald-700",
    city: "bg-violet-50 text-violet-700",
    adventure: "bg-orange-50 text-orange-700",
    culture: "bg-rose-50 text-rose-700",
    nature: "bg-green-50 text-green-700",
    food: "bg-amber-50 text-amber-700",
    historical: "bg-stone-100 text-stone-700",
  };

  return (
    <Link href={`/country/${destination.countryCode}`} className="group block">
      <div className="relative overflow-hidden rounded-2xl bg-white shadow-sm hover:shadow-md transition-all duration-300 group-hover:scale-[1.02]">
        {/* Photo */}
        <div className="relative aspect-[4/3] overflow-hidden">
          {destination.photoUrl ? (
            <Image
              src={destination.photoUrl}
              alt={destination.title}
              fill
              className="object-cover transition-transform duration-500 group-hover:scale-110"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-teal-100 to-teal-200" />
          )}
          {/* Gradient overlay */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />

          {/* Save button */}
          <div className="absolute top-3 right-3">
            <SaveButton isSaved={isSaved} onToggle={handleToggleSave} size="sm" />
          </div>

          {/* Category badge */}
          <div className="absolute top-3 left-3">
            <span
              className={`px-2.5 py-1 rounded-full text-xs font-medium backdrop-blur-sm ${
                categoryColors[destination.category] || "bg-gray-100 text-gray-700"
              }`}
            >
              {destination.category.charAt(0).toUpperCase() + destination.category.slice(1)}
            </span>
          </div>

          {/* Title overlay */}
          <div className="absolute bottom-0 left-0 right-0 p-4">
            <h3 className="text-white font-semibold text-lg leading-tight drop-shadow-sm">
              {destination.title}
            </h3>
            {destination.subtitle && (
              <p className="text-white/80 text-sm mt-0.5 drop-shadow-sm">
                {destination.subtitle}
              </p>
            )}
          </div>
        </div>

        {/* Description */}
        {destination.description && (
          <div className="px-4 py-3">
            <p className="text-gray-500 text-sm line-clamp-2">{destination.description}</p>
          </div>
        )}
      </div>
    </Link>
  );
}
