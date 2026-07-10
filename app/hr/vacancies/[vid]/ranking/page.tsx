import { notFound } from "next/navigation";
import { getVacancy, CANDIDATES } from "@/lib/fixtures";
import { PageHeader } from "@/components/hr/PageHeader";
import { VacancyStatusPill } from "@/components/ui/primitives";
import RankingTable from "@/components/hr/RankingTable";
import { EmptyState } from "@/components/ui/states";
import { Users } from "lucide-react";

export default async function RankingPage({ params }: { params: Promise<{ vid: string }> }) {
  const { vid } = await params;
  const vacancy = getVacancy(vid);
  if (!vacancy) notFound();

  const candidates = vid === "v-teamlead" ? CANDIDATES : [];

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        title="Candidate ranking"
        sub={`${vacancy.title} · ${vacancy.code}`}
        right={<VacancyStatusPill status={vacancy.status} />}
      />
      {candidates.length > 0 ? (
        <RankingTable candidates={candidates} vacancy={vacancy} />
      ) : vacancy.status === "DRAFT" ? (
        <EmptyState icon={Users} title="Applications not open yet" body="Publish this vacancy to start receiving candidates." />
      ) : (
        <EmptyState icon={Users} title="No candidates yet" body="Candidates will appear here as they complete their interviews." />
      )}
    </div>
  );
}
