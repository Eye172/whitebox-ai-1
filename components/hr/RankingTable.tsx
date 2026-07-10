"use client";

import React, { useMemo, useState } from "react";
import Link from "next/link";
import type { Candidate, Vacancy } from "@/lib/types";
import { ScoreCell, TierBadge, DocPill, ConfidenceBadge } from "@/components/ui/primitives";
import { Button } from "@/components/ui/primitives";
import ContourBg from "@/components/ui/ContourBg";
import {
  ChevronRight,
  GitCompareArrows,
  Eye,
  ArrowUpDown,
  RotateCcw,
  Send,
  Download,
  ShieldAlert,
  Circle,
} from "lucide-react";

type SortKey = "rank" | "overall" | "id";

function IntegrityDot({ level }: { level: "none" | "low" | "medium" }) {
  const map = {
    none: { c: "var(--line-mid)", t: "Clear" },
    low: { c: "var(--warn)", t: "1 advisory signal" },
    medium: { c: "var(--ember)", t: "2 advisory signals" },
  }[level];
  return (
    <span title={`Integrity: ${map.t} (advisory, not a verdict)`} className="inline-flex">
      <Circle className="h-3 w-3" style={{ color: map.c, fill: level === "none" ? "transparent" : map.c }} />
    </span>
  );
}

export default function RankingTable({ candidates, vacancy }: { candidates: Candidate[]; vacancy: Vacancy }) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expanded, setExpanded] = useState<string | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const fireToast = (m: string) => { setToast(m); setTimeout(() => setToast(null), 3200); };
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "overall", dir: "desc" });
  const [tierFilter, setTierFilter] = useState<string>("all");
  const [passFilter, setPassFilter] = useState<string>("all");
  const [compact, setCompact] = useState(false);
  const [page, setPage] = useState(0);
  const perPage = 25;

  const filtered = useMemo(() => {
    let rows = [...candidates];
    if (tierFilter !== "all") rows = rows.filter((c) => c.tier === tierFilter);
    if (passFilter === "pass") rows = rows.filter((c) => c.overall >= vacancy.threshold);
    if (passFilter === "fail") rows = rows.filter((c) => c.overall < vacancy.threshold);
    rows.sort((a, b) => {
      const dir = sort.dir === "asc" ? 1 : -1;
      if (sort.key === "rank") return (a.rank - b.rank) * dir;
      if (sort.key === "overall") return (a.overall - b.overall) * dir;
      return a.internalId.localeCompare(b.internalId) * dir;
    });
    return rows;
  }, [candidates, tierFilter, passFilter, sort, vacancy.threshold]);

  const paged = filtered.slice(page * perPage, page * perPage + perPage);
  const allSelected = paged.length > 0 && paged.every((c) => selected.has(c.internalId));

  const toggle = (id: string) =>
    setSelected((s) => {
      const n = new Set(s);
      n.has(id) ? n.delete(id) : n.add(id);
      return n;
    });
  const toggleAll = () =>
    setSelected((s) => {
      const n = new Set(s);
      if (allSelected) paged.forEach((c) => n.delete(c.internalId));
      else paged.forEach((c) => n.add(c.internalId));
      return n;
    });

  const setSortKey = (key: SortKey) =>
    setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }));

  const rowPad = compact ? "py-1.5" : "py-2.5";

  return (
    <div className="relative">
      {/* Toolbar */}
      <div className="mb-3 flex flex-wrap items-center gap-2">
        <FilterSelect label="Tier" value={tierFilter} onChange={setTierFilter} options={[["all", "All tiers"], ["Top", "Top"], ["Mid", "Mid"], ["Bottom", "Bottom"]]} />
        <FilterSelect label="Threshold" value={passFilter} onChange={setPassFilter} options={[["all", "Pass & fail"], ["pass", `≥ ${vacancy.threshold} (pass)`], ["fail", `< ${vacancy.threshold} (fail)`]]} />
        <button
          onClick={() => setCompact((c) => !c)}
          className="mono rounded-[6px] border border-hairline px-2.5 py-1.5 text-[11px] text-text-mid hover:text-text-hi"
        >
          {compact ? "Comfortable" : "Compact"}
        </button>
        <button
          onClick={() => {
            setTierFilter("all");
            setPassFilter("all");
            setSort({ key: "overall", dir: "desc" });
          }}
          className="mono flex items-center gap-1 rounded-[6px] border border-hairline px-2.5 py-1.5 text-[11px] text-text-mid hover:text-text-hi"
        >
          <RotateCcw className="h-3 w-3" /> Reset
        </button>
        <span className="mono ml-auto text-[11px] text-text-lo">
          {filtered.length} candidates · threshold {vacancy.threshold}
        </span>
      </div>

      {/* Table */}
      <div className="relative overflow-x-auto rounded-md border border-hairline bg-surface">
        {/* contour+HUD map background at low opacity (Book II data-map layer) */}
        <ContourBg opacity={0.05} />
        <table className="relative w-full min-w-[900px] border-collapse text-left">
          <thead className="sticky top-0 z-10 bg-surface/95 glass-blur">
            <tr className="border-b border-hairline">
              <Th className="w-10 pl-4">
                <input type="checkbox" checked={allSelected} onChange={toggleAll} className="accent-[var(--iris-b)]" />
              </Th>
              <Th className="w-14">
                <SortBtn label="#" active={sort.key === "rank"} dir={sort.dir} onClick={() => setSortKey("rank")} />
              </Th>
              <Th className="w-32">Internal ID</Th>
              <Th className="w-40">
                <SortBtn label="Overall" active={sort.key === "overall"} dir={sort.dir} onClick={() => setSortKey("overall")} />
              </Th>
              <Th className="w-44">Competencies</Th>
              <Th className="w-16">Conf.</Th>
              <Th className="w-16">Tier</Th>
              <Th className="w-24">Docs</Th>
              <Th className="w-16" title="AI↔human divergence">Diverge</Th>
              <Th className="w-16" title="Integrity — advisory only">Integ.</Th>
              <Th className="w-10" />
            </tr>
          </thead>
          <tbody>
            {paged.map((c) => {
              const isOpen = expanded === c.internalId;
              const isSel = selected.has(c.internalId);
              return (
                <React.Fragment key={c.internalId}>
                  <tr
                    className={`group relative border-b border-hairline transition-colors hover:bg-white/[0.02] ${isSel ? "bg-[rgba(123,147,255,0.04)]" : ""}`}
                  >
                    {isSel && <td className="absolute left-0 top-0 h-full w-[2px]"><span className="iris-bar block h-full w-full" /></td>}
                    <Td className={`pl-4 ${rowPad}`}>
                      <input type="checkbox" checked={isSel} onChange={() => toggle(c.internalId)} className="accent-[var(--iris-b)]" />
                    </Td>
                    <Td className={`mono text-[12px] text-text-mid ${rowPad}`}>{c.rank}</Td>
                    <Td className={rowPad}>
                      <Link href={`/hr/vacancies/${vacancy.id}/candidates/${c.internalId}`} className="mono text-[12.5px] text-text-hi hover:text-iris-b">
                        {c.internalId}
                      </Link>
                    </Td>
                    <Td className={rowPad}>
                      <ScoreCell score={c.overall} threshold={vacancy.threshold} />
                    </Td>
                    <Td className={rowPad}>
                      <div className="flex items-center gap-[3px]">
                        {c.competencies.map((cp) => (
                          <span
                            key={cp.id}
                            title={`${cp.name}: ${cp.score}`}
                            className="h-4 w-[6px] rounded-[1px]"
                            style={{
                              background:
                                cp.score >= vacancy.threshold
                                  ? "var(--pos)"
                                  : cp.score >= vacancy.threshold - 15
                                  ? "var(--warn)"
                                  : "rgba(255,255,255,0.14)",
                              opacity: cp.score >= vacancy.threshold ? 0.9 : 0.7,
                            }}
                          />
                        ))}
                      </div>
                    </Td>
                    <Td className={rowPad}>
                      <ConfidenceBadge band={c.confidence} />
                    </Td>
                    <Td className={rowPad}>
                      <TierBadge tier={c.tier} />
                    </Td>
                    <Td className={rowPad}>
                      <DocPill status={c.docStatus} />
                    </Td>
                    <Td className={rowPad}>
                      {c.divergence ? (
                        <span title="Human overrode AI on a competency" className="inline-flex">
                          <GitCompareArrows className="h-3.5 w-3.5" style={{ color: "var(--ember)" }} />
                        </span>
                      ) : (
                        <span className="text-text-lo">—</span>
                      )}
                    </Td>
                    <Td className={rowPad}>
                      <IntegrityDot level={c.integrity.level} />
                    </Td>
                    <Td className={`pr-3 ${rowPad}`}>
                      <button onClick={() => setExpanded(isOpen ? null : c.internalId)} className="text-text-lo hover:text-text-hi">
                        <ChevronRight className={`h-4 w-4 transition-transform ${isOpen ? "rotate-90" : ""}`} />
                      </button>
                    </Td>
                  </tr>
                  {isOpen && (
                    <tr className="border-b border-hairline bg-void-2/60">
                      <td colSpan={11} className="px-6 py-4">
                        <div className="mb-3 flex items-center justify-between">
                          <span className="mono-label">Per-competency breakdown · {c.internalId}</span>
                          <Link href={`/hr/vacancies/${vacancy.id}/candidates/${c.internalId}`} className="mono flex items-center gap-1 text-[11px] text-iris-b hover:underline">
                            Open scorecard <ChevronRight className="h-3 w-3" />
                          </Link>
                        </div>
                        <div className="grid gap-x-8 gap-y-1.5 sm:grid-cols-2 lg:grid-cols-3">
                          {c.competencies.map((cp) => (
                            <div key={cp.id} className="flex items-center justify-between gap-3">
                              <span className="truncate text-[12.5px] text-text-mid">{cp.name}</span>
                              <ScoreCell score={cp.score} threshold={vacancy.threshold} width={56} />
                            </div>
                          ))}
                        </div>
                        {c.integrity.level !== "none" && (
                          <div className="mt-3 flex items-center gap-2 rounded-[6px] border border-hairline bg-surface px-3 py-2">
                            <ShieldAlert className="h-3.5 w-3.5" style={{ color: "var(--ember)" }} />
                            <span className="text-[12px] text-text-mid">{c.integrity.note}</span>
                          </div>
                        )}
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-3 flex items-center justify-between">
        <span className="mono text-[11px] text-text-lo">
          {page * perPage + 1}–{Math.min((page + 1) * perPage, filtered.length)} of {filtered.length}
        </span>
        <div className="flex gap-1">
          <button disabled={page === 0} onClick={() => setPage((p) => p - 1)} className="mono rounded-[6px] border border-hairline px-2 py-1 text-[11px] text-text-mid disabled:opacity-30">
            ← Prev
          </button>
          <button disabled={(page + 1) * perPage >= filtered.length} onClick={() => setPage((p) => p + 1)} className="mono rounded-[6px] border border-hairline px-2 py-1 text-[11px] text-text-mid disabled:opacity-30">
            Next →
          </button>
        </div>
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div className="fixed bottom-6 left-1/2 z-40 flex -translate-x-1/2 items-center gap-3 rounded-full border border-hairline-strong bg-surface-2 px-4 py-2.5 shadow-2xl animate-fade-in-up">
          <span className="mono text-[12px] text-text-hi">{selected.size} selected</span>
          <span className="h-4 w-px bg-hairline" />
          <Button size="sm" variant="ghost" onClick={() => { fireToast(`${selected.size} moved to invited · audit entry written`); setSelected(new Set()); }}>
            <Send className="h-3.5 w-3.5" /> Move to invited
          </Button>
          <Link href={`/hr/vacancies/${vacancy.id}/compare`}>
            <Button size="sm" variant="ghost">
              <GitCompareArrows className="h-3.5 w-3.5" /> Compare
            </Button>
          </Link>
          <Button size="sm" variant="ghost" onClick={() => fireToast(`Exported ${selected.size} candidates to CSV`)}>
            <Download className="h-3.5 w-3.5" /> Export
          </Button>
          <button onClick={() => setSelected(new Set())} className="mono text-[11px] text-text-lo hover:text-text-hi">
            clear
          </button>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-md border border-hairline-strong bg-surface-2 px-4 py-2.5 shadow-2xl animate-fade-in-up">
          <Send className="h-4 w-4" style={{ color: "var(--pos)" }} />
          <span className="text-[13px] text-text-hi">{toast}</span>
        </div>
      )}
    </div>
  );
}

function Th({ children, className = "", title }: { children?: React.ReactNode; className?: string; title?: string }) {
  return (
    <th title={title} className={`mono-label whitespace-nowrap px-2 py-2.5 text-left font-normal ${className}`}>
      {children}
    </th>
  );
}
function Td({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <td className={`px-2 align-middle ${className}`}>{children}</td>;
}
function SortBtn({ label, active, dir, onClick }: { label: string; active: boolean; dir: "asc" | "desc"; onClick: () => void }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center gap-1 ${active ? "text-text-hi" : ""}`}>
      {label}
      <ArrowUpDown className="h-3 w-3" style={{ opacity: active ? 1 : 0.4 }} />
    </button>
  );
}
function FilterSelect({ label, value, onChange, options }: { label: string; value: string; onChange: (v: string) => void; options: [string, string][] }) {
  return (
    <div className="relative">
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="mono appearance-none rounded-[6px] border border-hairline bg-surface py-1.5 pl-2.5 pr-7 text-[11px] text-text-mid outline-none hover:text-text-hi"
        aria-label={label}
      >
        {options.map(([v, l]) => (
          <option key={v} value={v}>
            {l}
          </option>
        ))}
      </select>
      <ChevronRight className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 rotate-90 text-text-lo" />
    </div>
  );
}
