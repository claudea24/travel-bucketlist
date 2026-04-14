"use client";

import { BucketListItem } from "@/lib/types";

const statusConfig: Record<BucketListItem["status"], { label: string; className: string }> = {
  want_to_visit: { label: "Want to Visit", className: "bg-teal-50 text-teal-700" },
  planning: { label: "Planning", className: "bg-amber-50 text-amber-700" },
  visited: { label: "Visited", className: "bg-blue-50 text-blue-700" },
};

export default function StatusBadge({ status }: { status: BucketListItem["status"] }) {
  const config = statusConfig[status];
  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${config.className}`}>
      {config.label}
    </span>
  );
}
