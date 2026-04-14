import TripPlannerClient from "./TripPlannerClient";

export default async function TripPlannerPage({
  params,
}: {
  params: Promise<{ planId: string }>;
}) {
  const { planId } = await params;
  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      <TripPlannerClient planId={planId} />
    </div>
  );
}
