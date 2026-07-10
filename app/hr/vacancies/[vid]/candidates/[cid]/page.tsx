import { notFound } from "next/navigation";
import { getVacancy, getCandidate } from "@/lib/fixtures";
import Scorecard from "@/components/hr/Scorecard";

export default async function CandidatePage({ params }: { params: Promise<{ vid: string; cid: string }> }) {
  const { vid, cid } = await params;
  const vacancy = getVacancy(vid);
  const candidate = getCandidate(cid);
  if (!vacancy || !candidate) notFound();
  return <Scorecard candidate={candidate} vacancy={vacancy} />;
}
