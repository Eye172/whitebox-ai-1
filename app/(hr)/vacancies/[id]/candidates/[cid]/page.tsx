import { notFound } from "next/navigation";
import Scorecard from "@/components/hr/Scorecard";
import { candidates } from "@/lib/fixtures";

export default async function CandidatePage({ params }: { params: Promise<{ cid: string }> }) {
  const { cid } = await params;
  const candidate = candidates.find((c) => c.internalId === cid);
  if (!candidate) notFound();
  return <Scorecard candidate={candidate} />;
}
