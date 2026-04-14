import SocialPageClient from "./SocialPageClient";

export default function SocialPage() {
  return (
    <div className="max-w-4xl mx-auto px-5 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">Community</h1>
        <p className="text-gray-500 mt-1">
          Share your travel stories and discover tips from other travelers.
        </p>
      </div>
      <SocialPageClient />
    </div>
  );
}
