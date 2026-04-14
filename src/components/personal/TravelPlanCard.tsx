"use client";

import Link from "next/link";
import { TravelPlan } from "@/lib/types";

const statusConfig: Record<TravelPlan["status"], { label: string; color: string; icon: string }> = {
  draft: { label: "Draft", color: "bg-gray-100 text-gray-600", icon: "📝" },
  planning: { label: "Planning", color: "bg-amber-50 text-amber-700", icon: "📋" },
  booked: { label: "Booked", color: "bg-teal-50 text-teal-700", icon: "✅" },
  completed: { label: "Completed", color: "bg-blue-50 text-blue-700", icon: "🎉" },
  cancelled: { label: "Cancelled", color: "bg-rose-50 text-rose-600", icon: "❌" },
};

export default function TravelPlanCard({ plan }: { plan: TravelPlan }) {
  const config = statusConfig[plan.status];
  const dateRange = plan.startDate && plan.endDate
    ? `${new Date(plan.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} – ${new Date(plan.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
    : null;

  return (
    <Link href={`/personal/plan/${plan.id}`} className="block">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 hover:shadow-md hover:border-teal-200 transition-all">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-lg">{config.icon}</span>
              <h3 className="font-semibold text-gray-900">{plan.title}</h3>
            </div>
            <p className="text-sm text-gray-500">{plan.countryName}</p>
            {plan.summary && <p className="text-xs text-gray-400 mt-1 line-clamp-1">{plan.summary}</p>}
            {dateRange && <p className="text-xs text-gray-400 mt-1">{dateRange}</p>}
          </div>
          <div className="flex flex-col items-end gap-2 flex-shrink-0">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${config.color}`}>{config.label}</span>
            <span className="text-sm text-teal-600 font-medium">Edit →</span>
          </div>
        </div>
      </div>
    </Link>
  );
}
