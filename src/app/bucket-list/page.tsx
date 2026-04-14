import BucketList from "@/components/BucketList";

export default function BucketListPage() {
  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Bucket List</h1>
        <p className="text-gray-500 mt-1">
          Countries you want to visit and places you have been.
        </p>
      </div>
      <BucketList />
    </div>
  );
}
