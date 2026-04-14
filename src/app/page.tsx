import ExploreCountries from "@/components/ExploreCountries";

export default function HomePage() {
  return (
    <div className="max-w-7xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Explore Countries</h1>
        <p className="text-gray-500 mt-1">
          Search and browse countries around the world. Save the ones you want to visit!
        </p>
      </div>
      <ExploreCountries />
    </div>
  );
}
