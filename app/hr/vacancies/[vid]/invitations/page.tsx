import { notFound } from "next/navigation";
import { getVacancy, CANDIDATES } from "@/lib/fixtures";
import { PageHeader } from "@/components/hr/PageHeader";
import Invitations from "@/components/hr/Invitations";

export default async function InvitationsPage({ params }: { params: Promise<{ vid: string }> }) {
  const { vid } = await params;
  const vacancy = getVacancy(vid);
  if (!vacancy) notFound();

  const invited = CANDIDATES.filter((c) => c.stage === "invited");
  const pending = CANDIDATES.filter((c) => c.stage !== "invited" && c.overall >= vacancy.threshold).slice(0, 4);

  return (
    <div className="p-6 md:p-8">
      <PageHeader title="Final selection & invitations" sub={`${vacancy.title} · ${vacancy.code}`} />
      <Invitations invited={invited} pending={pending} />
    </div>
  );
}
