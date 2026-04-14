import { Suspense } from "react";
import NewPlanClient from "./NewPlanClient";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function NewPlanPage() {
  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <Suspense fallback={<LoadingSpinner message="Loading trip planner..." />}>
        <NewPlanClient />
      </Suspense>
    </div>
  );
}
