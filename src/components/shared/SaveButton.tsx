"use client";

interface SaveButtonProps {
  isSaved: boolean;
  onToggle: () => void;
  size?: "sm" | "md";
}

export default function SaveButton({ isSaved, onToggle, size = "md" }: SaveButtonProps) {
  const sizeClass = size === "sm" ? "w-8 h-8 text-base" : "w-10 h-10 text-xl";
  return (
    <button
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
        onToggle();
      }}
      className={`${sizeClass} flex items-center justify-center rounded-full transition-all ${
        isSaved
          ? "bg-rose-50 text-rose-500 hover:bg-rose-100"
          : "bg-white/80 backdrop-blur-sm text-gray-400 hover:text-rose-500 hover:bg-white"
      }`}
      aria-label={isSaved ? "Remove from bucket list" : "Save to bucket list"}
    >
      {isSaved ? "♥" : "♡"}
    </button>
  );
}
