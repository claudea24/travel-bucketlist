"use client";

import Image from "next/image";

interface UserAvatarProps {
  avatarUrl: string | null;
  displayName: string;
  size?: "sm" | "md" | "lg";
}

const sizes = {
  sm: "w-7 h-7 text-xs",
  md: "w-9 h-9 text-sm",
  lg: "w-12 h-12 text-base",
};

export default function UserAvatar({ avatarUrl, displayName, size = "md" }: UserAvatarProps) {
  const initials = displayName
    .split(" ")
    .map((n) => n[0])
    .join("")
    .toUpperCase()
    .slice(0, 2);

  return avatarUrl ? (
    <Image
      src={avatarUrl}
      alt={displayName}
      width={size === "lg" ? 48 : size === "md" ? 36 : 28}
      height={size === "lg" ? 48 : size === "md" ? 36 : 28}
      className={`${sizes[size]} rounded-full object-cover`}
    />
  ) : (
    <div
      className={`${sizes[size]} rounded-full bg-teal-100 text-teal-700 font-medium flex items-center justify-center`}
    >
      {initials || "?"}
    </div>
  );
}
