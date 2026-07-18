import RankingTable from "@/components/hr/RankingTable";
import { StatusPill } from "@/components/ui/primitives";

export default function RankingPage() {
  return (
    <div className="contour-bg p-8">
      <div className="mb-6 flex items-end justify-between">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="font-display text-[24px] font-medium tracking-[-0.015em] text-hi">Team Lead — Core Platform</h1>
            <StatusPill label="LIVE" />
          </div>
          <div className="hud-label mt-1.5">WBX-7Q4K · CONFIG V3 · 214 CANDIDATES · RANKING</div>
        </div>
        <span className="text-[12px] text-lo">
          Scores are AI-structured, human-decided. Every override lands in the <span className="text-mid">audit chain</span>.
        </span>
      </div>
      <RankingTable />
    </div>
  );
}
