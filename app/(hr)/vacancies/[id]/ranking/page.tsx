import RankingTable from "@/components/hr/RankingTable";
import { StatusPill } from "@/components/ui/primitives";
import { vacancies } from "@/lib/fixtures";

export default async function RankingPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const vacancy = vacancies.find((v) => v.id === id) ?? vacancies.find((v) => v.id === "vac-001")!;
  return (
    <div className="contour-bg min-h-[calc(100vh-52px)] p-8">
      <div className="mb-6">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[24px] font-medium tracking-[-0.015em] text-hi">{vacancy.title}</h1>
            <StatusPill label={vacancy.status} />
          </div>
          <div className="mt-1.5 font-mono text-[10px] text-lo">{vacancy.code} · {vacancy.candidates} candidates</div>
        </div>
      </div>
      <RankingTable />
    </div>
  );
}
