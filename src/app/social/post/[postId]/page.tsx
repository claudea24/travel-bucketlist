import PostDetailClient from "./PostDetailClient";

export default async function PostDetailPage({
  params,
}: {
  params: Promise<{ postId: string }>;
}) {
  const { postId } = await params;
  return (
    <div className="max-w-3xl mx-auto px-5 py-8">
      <PostDetailClient postId={postId} />
    </div>
  );
}
