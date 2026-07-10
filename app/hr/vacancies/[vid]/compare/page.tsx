import { notFound } from "next/navigation";
import Link from "next/link";
import { getVacancy, CANDIDATES } from "@/lib/fixtures";
import { PageHeader } from "@/components/hr/PageHeader";
import { Radar } from "@/components/ui/viz";
import { ScoreCell, TierBadge, ConfidenceBadge, Button, DocPill } from "@/components/ui/primitives";
import { Send } from "lucide-react";

const SERIES_COLORS = ["#7B93FF", "#6EE7F0", "#C77BFF", "#FF8AD8"];

export default async function ComparePage({ params }: { params: Promise<{ vid: string }> }) {
  const { vid } = await params;
  const vacancy = getVacancy(vid);
  if (!vacancy) notFound();

  const picked = CANDIDATES.slice(0, 3);
  const comps = picked[0].competencies.map((c) => c.name);
  const radarSeries = picked.map((c, i) => ({
    name: c.internalId,
    color: SERIES_COLORS[i],
    values: c.competencies.map((cp) => ({ axis: cp.name, value: cp.score })),
  }));

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        title="Compare finalists"
        sub="Attributes, not gut feelings."
        right={
          <Button size="sm">
            <Send className="h-3.5 w-3.5" /> Move all to invited
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[360px_1fr]">
        {/* overlaid radar */}
        <div className="rounded-md border border-hairline bg-surface p-5">
          <div className="mono-label mb-3">Overlaid competency profile</div>
          <div className="flex justify-center">
            <Radar series={radarSeries} size={300} />
          </div>
          <div className="mt-4 space-y-1.5">
            {picked.map((c, i) => (
              <div key={c.internalId} className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full" style={{ background: SERIES_COLORS[i] }} />
                <Link href={`/hr/vacancies/${vid}/candidates/${c.internalId}`} className="mono text-[12px] text-text-hi hover:text-iris-b">
                  {c.internalId}
                </Link>
                <TierBadge tier={c.tier} />
                <span className="mono ml-auto text-[12px] text-text-mid">{c.overall}</span>
              </div>
            ))}
          </div>
        </div>

        {/* delta table */}
        <div className="overflow-x-auto rounded-md border border-hairline bg-surface">
          <table className="w-full min-w-[560px] text-left text-[13px]">
            <thead>
              <tr className="border-b border-hairline">
                <th className="mono-label px-4 py-2.5 font-normal">Competency</th>
                {picked.map((c, i) => (
                  <th key={c.internalId} className="px-4 py-2.5">
                    <span className="mono flex items-center gap-1.5 text-[12px] text-text-hi">
                      <span className="h-2 w-2 rounded-full" style={{ background: SERIES_COLORS[i] }} />
                      {c.internalId}
                    </span>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              <tr className="border-b border-hairline bg-void-2/40">
                <td className="px-4 py-2.5 font-medium text-text-hi">Overall</td>
                {picked.map((c) => (
                  <td key={c.internalId} className="px-4 py-2.5"><ScoreCell score={c.overall} threshold={vacancy.threshold} width={60} /></td>
                ))}
              </tr>
              {comps.map((name) => {
                const vals = picked.map((c) => c.competencies.find((cp) => cp.name === name)!.score);
                const best = Math.max(...vals);
                return (
                  <tr key={name} className="border-b border-hairline last:border-0">
                    <td className="px-4 py-2.5 text-text-mid">{name}</td>
                    {picked.map((c, i) => {
                      const v = vals[i];
                      return (
                        <td key={c.internalId} className="px-4 py-2.5">
                          <div className="flex items-center gap-2">
                            <ScoreCell score={v} threshold={vacancy.threshold} width={48} />
                            {v === best && vals.filter((x) => x === best).length === 1 && (
                              <span className="mono text-[10px]" style={{ color: "var(--pos)" }}>best</span>
                            )}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
              <tr className="border-t border-hairline">
                <td className="px-4 py-2.5 text-text-mid">Confidence</td>
                {picked.map((c) => (
                  <td key={c.internalId} className="px-4 py-2.5"><ConfidenceBadge band={c.confidence} /></td>
                ))}
              </tr>
              <tr>
                <td className="px-4 py-2.5 text-text-mid">Documents</td>
                {picked.map((c) => (
                  <td key={c.internalId} className="px-4 py-2.5"><DocPill status={c.docStatus} /></td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
