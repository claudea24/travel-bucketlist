import CreatePostClient from "./CreatePostClient";

export default function CreatePostPage() {
  return (
    <div className="max-w-2xl mx-auto px-5 py-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900 tracking-tight">Create Post</h1>
        <p className="text-gray-500 mt-1">
          Share a travel story or tip with the community.
        </p>
      </div>
      <CreatePostClient />
    </div>
  );
}
