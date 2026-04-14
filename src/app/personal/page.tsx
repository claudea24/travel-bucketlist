import PersonalPageClient from "./PersonalPageClient";

export default function PersonalPage() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">My Trips</h1>
        <p className="text-gray-500 mt-1">
          Manage your bucket list and plan your next adventure.
        </p>
      </div>
      <PersonalPageClient />
    </div>
  );
}
