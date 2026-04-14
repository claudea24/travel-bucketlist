"use client";

import Link from "next/link";
import { TravelPlan } from "@/lib/types";

const statusColors: Record<TravelPlan["status"], string> = {
  draft: "bg-gray-100 text-gray-600",
  planning: "bg-amber-50 text-amber-700",
  booked: "bg-teal-50 text-teal-700",
  completed: "bg-blue-50 text-blue-700",
  cancelled: "bg-rose-50 text-rose-600",
};

export default function TravelPlanCard({ plan }: { plan: TravelPlan }) {
  const dateRange =
    plan.startDate && plan.endDate
      ? `${new Date(plan.startDate).toLocaleDateString("en-US", { month: "short", day: "numeric" })} - ${new Date(plan.endDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}`
      : "Dates not set";

  return (
    <Link href={`/personal/plan/${plan.id}`} className="block">
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-4 hover:shadow-md transition-all">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">{plan.title}</h3>
            <p className="text-sm text-gray-500 mt-0.5">{plan.countryName}</p>
            <p className="text-xs text-gray-400 mt-1">{dateRange}</p>
          </div>
          <div className="flex flex-col items-end gap-2">
            <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${statusColors[plan.status]}`}>
              {plan.status.charAt(0).toUpperCase() + plan.status.slice(1)}
            </span>
            {plan.budgetAmount && (
              <span className="text-sm font-medium text-gray-600">
                {plan.budgetCurrency} {plan.budgetAmount.toLocaleString()}
              </span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
