"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Flag, Eye, MoreHorizontal, Columns3, ListFilter } from "lucide-react";
import { candidates, threshold } from "@/lib/fixtures";
import { ConfidenceBadge, MiniScores, ScoreCell, StatusPill, TierBadge } from "@/components/ui/primitives";

export default function RankingTable() {
  const [expanded, setExpanded] = useState<string | null>("CND-4A19");
  const [selected, setSelected] = useState<Set<string>>(new Set());

  const toggle = (id: string) =>
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });

  return (
    <div>
      {/* Toolbar */}
      <div className="flex items-center gap-2.5 pb-4">
        {["Tier", "Threshold", "Competency", "Verification", "Flags"].map((f) => (
          <button key={f} className="flex items-center gap-1.5 rounded border border-hairline bg-surface px-2.5 py-1.5 text-[12px] text-mid hover:text-hi">
            <ListFilter className="size-3" /> {f}
          </button>
        ))}
        <span className="mx-2 h-4 w-px bg-hairline-strong" />
        <button className="flex items-center gap-1.5 rounded border border-hairline bg-surface px-2.5 py-1.5 text-[12px] text-mid hover:text-hi">
          <Columns3 className="size-3" /> Columns
        </button>
        <span className="ml-auto hud-label">SORT · OVERALL DESC · THRESHOLD {threshold}</span>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-xl border border-hairline bg-surface/80">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-hairline">
              {["", "RANK", "INTERNAL ID", "OVERALL", "COMPETENCIES", "CONFIDENCE", "TIER", "DOCS", "DIV", "INT", ""].map((h, i) => (
                <th key={i} className="hud-label whitespace-nowrap px-3 py-3 font-normal first:w-8 first:pl-4">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {candidates.map((c) => {
              const isOpen = expanded === c.internalId;
              const isSel = selected.has(c.internalId);
              return (
                <FragmentRow key={c.internalId}>
                  <tr
                    className={`group relative border-b border-hairline transition-colors hover:bg-white/[0.025] ${isSel ? "bg-white/[0.03]" : ""}`}
                  >
                    <td className="py-3 pl-4 pr-3">
                      {isSel && <span className="absolute inset-y-0 left-0 w-[2px] iris-line" />}
                      <input
                        type="checkbox"
                        checked={isSel}
                        onChange={() => toggle(c.internalId)}
                        className="size-3.5 accent-white/80"
                        aria-label={`select ${c.internalId}`}
                      />
                    </td>
                    <td className="tnum px-3 font-mono text-lo">{String(c.rank).padStart(2, "0")}</td>
                    <td className="px-3">
                      <Link href={`/vacancies/vac-001/candidates/${c.internalId}`} className="font-mono text-hi hover:underline">
                        {c.internalId}
                      </Link>
                    </td>
                    <td className="px-3"><ScoreCell score={c.overall} threshold={threshold} /></td>
                    <td className="px-3">
                      <MiniScores scores={c.competencies.map((k) => ({ name: k.name, score: k.score }))} threshold={threshold} />
                    </td>
                    <td className="px-3"><ConfidenceBadge band={c.confidence} compact /></td>
                    <td className="px-3"><TierBadge tier={c.tier} /></td>
                    <td className="px-3"><StatusPill label={c.verification} /></td>
                    <td className="px-3">
                      {c.divergence && <Flag className="size-3.5 text-ember" aria-label="human overrode AI" />}
                    </td>
                    <td className="px-3">
                      {c.integrityAdvisory && (
                        <span title="Integrity advisory — context only, never a verdict">
                          <Eye className="size-3.5 text-warn" />
                        </span>
                      )}
                    </td>
                    <td className="px-3">
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => setExpanded(isOpen ? null : c.internalId)}
                          className="rounded p-1 text-lo hover:bg-white/5 hover:text-hi"
                          aria-label="expand row"
                        >
                          {isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}
                        </button>
                        <MoreHorizontal className="size-4 text-lo opacity-0 group-hover:opacity-100" />
                      </div>
                    </td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b border-hairline bg-void2/60">
                      <td colSpan={11} className="px-6 py-4">
                        <div className="grid grid-cols-5 gap-4">
                          {c.competencies.map((k) => (
                            <div key={k.id} className="rounded-lg border border-hairline bg-surface p-3.5">
                              <div className="flex items-baseline justify-between">
                                <span className="text-[12px] text-mid">{k.name}</span>
                                <span className={`tnum font-mono text-[13px] ${k.score >= threshold ? "text-hi" : "text-lo"}`}>{k.score}</span>
                              </div>
                              <div className="mt-2 h-1 overflow-hidden rounded-full bg-white/8">
                                <div
                                  className="h-full rounded-full"
                                  style={{ width: `${k.score}%`, background: k.score >= threshold ? "var(--iris-gradient)" : "var(--line-mid)" }}
                                />
                              </div>
                              <div className="mt-2"><ConfidenceBadge band={k.confidence} compact /></div>
                            </div>
                          ))}
                        </div>
                      </td>
                    </tr>
                  )}
                </FragmentRow>
              );
            })}
          </tbody>
        </table>

        {/* Footer / pagination */}
        <div className="flex items-center justify-between border-t border-hairline px-4 py-3">
          <span className="hud-label">SHOWING 8 OF 214</span>
          <div className="flex items-center gap-1.5 font-mono text-[12px] text-mid">
            <span className="text-lo">ROWS</span>
            {[25, 50, 100].map((n, i) => (
              <button key={n} className={`rounded px-2 py-0.5 ${i === 0 ? "bg-white/5 text-hi" : "hover:text-hi"}`}>{n}</button>
            ))}
            <span className="mx-2 h-4 w-px bg-hairline-strong" />
            <button className="rounded px-2 py-0.5 hover:text-hi">‹</button>
            <span className="text-hi">1</span>
            <span className="text-lo">/ 9</span>
            <button className="rounded px-2 py-0.5 hover:text-hi">›</button>
          </div>
        </div>
      </div>

      {/* Bulk-action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-hairline-strong bg-surface2 px-5 py-3 shadow-2xl">
          <span className="tnum font-mono text-[12px] text-hi">{selected.size} SELECTED</span>
          <span className="h-4 w-px bg-hairline-strong" />
          <button className="rounded border border-hairline-strong bg-surface px-3 py-1.5 text-[13px] text-hi hover:border-irisb/50">
            Move to invited
          </button>
          <button className="rounded border border-hairline px-3 py-1.5 text-[13px] text-mid hover:text-hi">Compare</button>
          <button className="rounded border border-hairline px-3 py-1.5 text-[13px] text-mid hover:text-hi">Export</button>
          <button onClick={() => setSelected(new Set())} className="ml-1 text-[12px] text-lo hover:text-hi">Clear</button>
        </div>
      )}
    </div>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
