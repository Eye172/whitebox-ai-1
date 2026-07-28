import HrSurface from "@/components/hr/HrSurface";

export default async function SurfacePage({ params }: { params: Promise<{ rest: string[] }> }) {
  const { rest } = await params;
  return <HrSurface path={rest.join("/")} />;
}
