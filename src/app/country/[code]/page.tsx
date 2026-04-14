import CountryDetail from "@/components/CountryDetail";

export default async function CountryPage({
  params,
}: {
  params: Promise<{ code: string }>;
}) {
  const { code } = await params;

  return (
    <div className="max-w-4xl mx-auto px-6 py-8">
      <CountryDetail code={code} />
    </div>
  );
}
