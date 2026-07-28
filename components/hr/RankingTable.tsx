"use client";

import { useState } from "react";
import Link from "next/link";
import { ChevronDown, ChevronRight, Flag, Eye, Columns3, ListFilter } from "lucide-react";
import { candidates, threshold } from "@/lib/fixtures";
import { ConfidenceBadge, MiniScores, ScoreCell, StatusPill, TierBadge } from "@/components/ui/primitives";

export default function RankingTable() {
  const [expanded, setExpanded] = useState<string | null>(null);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [tier, setTier] = useState<"All" | "Top" | "Mid" | "Bottom">("All");
  const [aboveThreshold, setAboveThreshold] = useState(false);
  const [verification, setVerification] = useState<"All" | "VERIFIED" | "PENDING">("All");
  const [flagsOnly, setFlagsOnly] = useState(false);
  const [showCompetencies, setShowCompetencies] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [rowsPerPage, setRowsPerPage] = useState(25);
  const [notice, setNotice] = useState("");

  const visibleCandidates = candidates.filter((c) =>
    (tier === "All" || c.tier === tier) &&
    (!aboveThreshold || c.overall >= threshold) &&
    (verification === "All" || c.verification === verification) &&
    (!flagsOnly || c.integrityAdvisory || c.divergence),
  );

  const toggle = (id: string) => setSelected((prev) => {
    const next = new Set(prev);
    next.has(id) ? next.delete(id) : next.add(id);
    return next;
  });

  const exportSelected = () => {
    const rows = candidates.filter((c) => selected.has(c.internalId));
    const csv = ["candidate,overall,tier,confidence", ...rows.map((c) => `${c.internalId},${c.overall},${c.tier},${c.confidence}`)].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = "whitebox-candidates.csv";
    anchor.click();
    URL.revokeObjectURL(url);
    setNotice(`Exported ${rows.length} candidate record${rows.length === 1 ? "" : "s"}.`);
  };

  return (
    <div>
      <div className="relative flex items-center gap-2.5 pb-4">
        <label className="flex items-center gap-2 rounded-lg border border-hairline bg-surface px-2.5 py-1.5 text-[12px] text-mid">
          Tier
          <select aria-label="Filter by tier" value={tier} onChange={(event) => setTier(event.target.value as typeof tier)} className="bg-transparent text-hi outline-none">
            <option>All</option><option>Top</option><option>Mid</option><option>Bottom</option>
          </select>
        </label>
        <button aria-expanded={filtersOpen} onClick={() => setFiltersOpen((value) => !value)} className={`flex items-center gap-1.5 rounded-lg border bg-surface px-3 py-1.5 text-[12px] ${aboveThreshold || verification !== "All" || flagsOnly ? "border-irisb/50 text-hi" : "border-hairline text-mid"}`}><ListFilter className="size-3" />More filters</button>
        {filtersOpen && (
          <div className="absolute left-24 top-9 z-20 w-56 rounded-xl border border-hairline-strong bg-surface2 p-3 shadow-2xl">
            <button onClick={() => setAboveThreshold((value) => !value)} className={`flex w-full items-center justify-between rounded-lg px-3 py-2 text-[12px] ${aboveThreshold ? "bg-white/5 text-hi" : "text-mid hover:bg-white/[0.03]"}`}><span>Score at least {threshold}</span><span>{aboveThreshold ? "✓" : ""}</span></button>
            <label className="mt-1 flex items-center justify-between rounded-lg px-3 py-2 text-[12px] text-mid">
              Verification
              <select aria-label="Filter by verification" value={verification} onChange={(event) => setVerification(event.target.value as typeof verification)} className="bg-transparent text-hi outline-none">
                <option>All</option><option>VERIFIED</option><option>PENDING</option>
              </select>
            </label>
            <button onClick={() => setFlagsOnly((value) => !value)} className={`mt-1 flex w-full items-center justify-between rounded-lg px-3 py-2 text-[12px] ${flagsOnly ? "bg-white/5 text-hi" : "text-mid hover:bg-white/[0.03]"}`}><span>Only flagged</span><span>{flagsOnly ? "✓" : ""}</span></button>
          </div>
        )}
        <button onClick={() => setShowCompetencies((value) => !value)} className="flex items-center gap-1.5 rounded-lg border border-hairline bg-surface px-3 py-1.5 text-[12px] text-mid hover:text-hi"><Columns3 className="size-3" />{showCompetencies ? "Hide scores" : "Show scores"}</button>
        <span className="ml-auto text-[11px] text-lo">{visibleCandidates.length} candidates · highest score first</span>
      </div>

      <div className="overflow-hidden rounded-xl border border-hairline bg-surface/80">
        <table className="w-full text-left text-[13px]">
          <thead><tr className="border-b border-hairline">
            {["", "RANK", "INTERNAL ID", "OVERALL"].map((heading, index) => <th key={`primary-${index}`} className="hud-label whitespace-nowrap px-3 py-3 font-normal first:w-8 first:pl-4">{heading}</th>)}
            {showCompetencies && <th className="hud-label whitespace-nowrap px-3 py-3 font-normal">COMPETENCIES</th>}
            {["CONFIDENCE", "TIER", "DOCS", "DIV", "INT", ""].map((heading, index) => <th key={`detail-${index}`} className="hud-label whitespace-nowrap px-3 py-3 font-normal">{heading}</th>)}
          </tr></thead>
          <tbody>
            {visibleCandidates.map((c) => {
              const isOpen = expanded === c.internalId;
              const isSel = selected.has(c.internalId);
              return (
                <FragmentRow key={c.internalId}>
                  <tr className={`group relative border-b border-hairline transition-colors hover:bg-white/[0.025] ${isSel ? "bg-white/[0.03]" : ""}`}>
                    <td className="py-3 pl-4 pr-3">{isSel && <span className="absolute inset-y-0 left-0 w-[2px] iris-line" />}<input type="checkbox" checked={isSel} onChange={() => toggle(c.internalId)} className="size-3.5 accent-white/80" aria-label={`select ${c.internalId}`} /></td>
                    <td className="tnum px-3 font-mono text-lo">{String(c.rank).padStart(2, "0")}</td>
                    <td className="px-3"><Link href={`/vacancies/vac-001/candidates/${c.internalId}`} className="font-mono text-hi hover:underline">{c.internalId}</Link></td>
                    <td className="px-3"><ScoreCell score={c.overall} threshold={threshold} /></td>
                    {showCompetencies && <td className="px-3"><MiniScores scores={c.competencies.map((k) => ({ name: k.name, score: k.score }))} threshold={threshold} /></td>}
                    <td className="px-3"><ConfidenceBadge band={c.confidence} compact /></td>
                    <td className="px-3"><TierBadge tier={c.tier} /></td>
                    <td className="px-3"><StatusPill label={c.verification} /></td>
                    <td className="px-3">{c.divergence && <Flag className="size-3.5 text-ember" aria-label="human overrode AI" />}</td>
                    <td className="px-3">{c.integrityAdvisory && <span title="Integrity advisory — context only, never a verdict"><Eye className="size-3.5 text-warn" /></span>}</td>
                    <td className="px-3"><button onClick={() => setExpanded(isOpen ? null : c.internalId)} className="rounded p-1 text-lo hover:bg-white/5 hover:text-hi" aria-label={`expand ${c.internalId}`}>{isOpen ? <ChevronDown className="size-4" /> : <ChevronRight className="size-4" />}</button></td>
                  </tr>
                  {isOpen && <tr className="border-b border-hairline bg-void2/60"><td colSpan={showCompetencies ? 11 : 10} className="px-6 py-4"><div className="grid grid-cols-5 gap-4">{c.competencies.map((k) => <div key={k.id} className="rounded-lg border border-hairline bg-surface p-3.5"><div className="flex items-baseline justify-between"><span className="text-[12px] text-mid">{k.name}</span><span className={`tnum font-mono text-[13px] ${k.score >= threshold ? "text-hi" : "text-lo"}`}>{k.score}</span></div><div className="mt-2 h-1 overflow-hidden rounded-full bg-white/8"><div className="h-full rounded-full" style={{ width: `${k.score}%`, background: k.score >= threshold ? "var(--iris-gradient)" : "var(--line-mid)" }} /></div><div className="mt-2"><ConfidenceBadge band={k.confidence} compact /></div></div>)}</div></td></tr>}
                </FragmentRow>
              );
            })}
          </tbody>
        </table>
        {visibleCandidates.length === 0 && <div className="p-10 text-center text-[12px] text-lo">No candidates match the active filters.</div>}
        <div className="flex items-center justify-between border-t border-hairline px-4 py-3">
          <span className="hud-label">SHOWING {visibleCandidates.length} OF {candidates.length} DEMO RECORDS · {rowsPerPage} ROW VIEW</span>
          <div className="flex items-center gap-1.5 font-mono text-[12px] text-mid">
            <span className="text-lo">ROWS</span>
            {[25, 50, 100].map((n) => <button key={n} onClick={() => setRowsPerPage(n)} className={`rounded px-2 py-0.5 ${rowsPerPage === n ? "bg-white/5 text-hi" : "hover:text-hi"}`}>{n}</button>)}
            <span className="mx-2 h-4 w-px bg-hairline-strong" /><button disabled className="rounded px-2 py-0.5 opacity-30">‹</button><span className="text-hi">1</span><span className="text-lo">/ 1</span><button disabled className="rounded px-2 py-0.5 opacity-30">›</button>
          </div>
        </div>
      </div>

      {selected.size > 0 && <div className="fixed bottom-6 left-1/2 z-30 flex -translate-x-1/2 items-center gap-3 rounded-xl border border-hairline-strong bg-surface2 px-5 py-3 shadow-2xl"><span className="tnum font-mono text-[12px] text-hi">{selected.size} SELECTED</span><span className="h-4 w-px bg-hairline-strong" /><button onClick={() => { setNotice(`${selected.size} candidate${selected.size === 1 ? "" : "s"} moved to the human-confirmed invitation queue.`); setSelected(new Set()); }} className="rounded border border-hairline-strong bg-surface px-3 py-1.5 text-[13px] text-hi hover:border-irisb/50">Move to invited</button><Link href={`/vacancies/vac-001/compare?ids=${[...selected].join(",")}`} className="rounded border border-hairline px-3 py-1.5 text-[13px] text-mid hover:text-hi">Compare</Link><button onClick={exportSelected} className="rounded border border-hairline px-3 py-1.5 text-[13px] text-mid hover:text-hi">Export</button><button onClick={() => setSelected(new Set())} className="ml-1 text-[12px] text-lo hover:text-hi">Clear</button></div>}
      {notice && <button onClick={() => setNotice("")} className="fixed bottom-6 right-6 z-40 rounded-xl border border-pos/30 bg-surface2 px-4 py-3 text-[12px] text-pos">{notice} ×</button>}
    </div>
  );
}

function FragmentRow({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
