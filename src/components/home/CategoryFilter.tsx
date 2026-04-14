"use client";

import CategoryPill from "@/components/shared/CategoryPill";
import { DestinationCategory } from "@/lib/types";

const CATEGORIES: { value: DestinationCategory | "all"; label: string }[] = [
  { value: "all", label: "All" },
  { value: "beach", label: "Beach" },
  { value: "mountains", label: "Mountains" },
  { value: "city", label: "City" },
  { value: "adventure", label: "Adventure" },
  { value: "culture", label: "Culture" },
  { value: "nature", label: "Nature" },
  { value: "food", label: "Food" },
  { value: "historical", label: "Historical" },
];

interface CategoryFilterProps {
  selected: string;
  onChange: (category: string) => void;
}

export default function CategoryFilter({ selected, onChange }: CategoryFilterProps) {
  return (
    <div className="flex gap-2 overflow-x-auto hide-scrollbar pb-1">
      {CATEGORIES.map((cat) => (
        <CategoryPill
          key={cat.value}
          label={cat.label}
          isActive={selected === cat.value}
          onClick={() => onChange(cat.value)}
        />
      ))}
    </div>
  );
}
