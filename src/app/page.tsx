import HomeFeed from "@/components/home/HomeFeed";

export default function HomePage() {
  return (
    <div className="max-w-6xl mx-auto px-5 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
          Discover
        </h1>
        <p className="text-gray-500 mt-1">
          Find your next adventure. Browse destinations and build your bucket list.
        </p>
      </div>
      <HomeFeed />
    </div>
  );
}
