import Link from "next/link";
import { CornerCard, VacancyStatusPill } from "@/components/ui/primitives";
import type { Vacancy } from "@/lib/types";
import { Copy, MoreHorizontal } from "lucide-react";

export function VacancyCard({ vacancy }: { vacancy: Vacancy }) {
  const funnelMax = vacancy.funnel[0]?.value || 1;
  return (
    <CornerCard as={Link} href={`/hr/vacancies/${vacancy.id}/ranking`} className="block p-5 hover:-translate-y-0.5 hover:border-hairline-strong">
      <div className="mb-3 flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="truncate text-[15px] font-medium text-text-hi">{vacancy.title}</div>
          <div className="mono mt-1 flex items-center gap-2 text-[11px] text-text-lo">
            <span>{vacancy.code}</span>
            <Copy className="h-3 w-3" />
            <span>· v{vacancy.configVersion}</span>
          </div>
        </div>
        <MoreHorizontal className="h-4 w-4 shrink-0 text-text-lo" />
      </div>

      <div className="mb-3 flex items-center gap-2">
        <VacancyStatusPill status={vacancy.status} />
        <span className="mono text-[11px] text-text-mid">{vacancy.applicants} applicants</span>
        {vacancy.needReview > 0 && (
          <span className="mono ml-auto rounded-full bg-[rgba(255,106,46,0.10)] px-2 py-0.5 text-[10px]" style={{ color: "var(--ember)" }}>
            {vacancy.needReview} need review
          </span>
        )}
      </div>

      {/* mini funnel */}
      {vacancy.funnel.length > 0 ? (
        <div className="flex items-end gap-1" title="Hiring funnel">
          {vacancy.funnel.map((f, i) => (
            <div key={f.label} className="flex-1" title={`${f.label}: ${f.value}`}>
              <div
                className="rounded-[2px]"
                style={{
                  height: Math.max(4, (f.value / funnelMax) * 28),
                  background: i === vacancy.funnel.length - 1 ? "var(--iris-b)" : "rgba(255,255,255,0.12)",
                }}
              />
            </div>
          ))}
        </div>
      ) : (
        <div className="mono text-[11px] text-text-lo">Draft — not yet published</div>
      )}
    </CornerCard>
  );
}
