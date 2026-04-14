import { Suspense } from "react";
import NewPlanWrapper from "./NewPlanWrapper";
import LoadingSpinner from "@/components/shared/LoadingSpinner";

export default function NewPlanPage() {
  return (
    <div className="max-w-5xl mx-auto px-5 py-8">
      <Suspense fallback={<LoadingSpinner message="Loading trip planner..." />}>
        <NewPlanWrapper />
      </Suspense>
    </div>
  );
}
