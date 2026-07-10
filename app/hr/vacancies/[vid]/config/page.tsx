import { notFound } from "next/navigation";
import { getVacancy, CANDIDATES } from "@/lib/fixtures";
import { PageHeader } from "@/components/hr/PageHeader";
import CompetencyBuilder from "@/components/hr/CompetencyBuilder";
import { VacancyStatusPill } from "@/components/ui/primitives";

export default async function ConfigPage({ params }: { params: Promise<{ vid: string }> }) {
  const { vid } = await params;
  const vacancy = getVacancy(vid);
  if (!vacancy) notFound();
  const candidates = vid === "v-teamlead" ? CANDIDATES : [];
  return (
    <div className="p-6 md:p-8">
      <PageHeader
        title="Competency builder"
        sub={`${vacancy.title} · config v${vacancy.configVersion}`}
        right={<VacancyStatusPill status={vacancy.status} />}
      />
      <CompetencyBuilder categories={vacancy.categories} candidates={candidates} threshold={vacancy.threshold} />
    </div>
  );
}
