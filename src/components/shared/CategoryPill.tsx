"use client";

interface CategoryPillProps {
  label: string;
  isActive: boolean;
  onClick: () => void;
}

export default function CategoryPill({ label, isActive, onClick }: CategoryPillProps) {
  return (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
        isActive
          ? "bg-teal-500 text-white shadow-sm"
          : "bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
      }`}
    >
      {label}
    </button>
  );
}
