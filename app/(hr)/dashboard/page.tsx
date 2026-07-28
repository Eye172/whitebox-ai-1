"use client";

import Link from "next/link";
import { ArrowRight, Briefcase, Users, ClipboardCheck, Scale } from "lucide-react";
import { useState } from "react";
import { vacancies, attentionQueue } from "@/lib/fixtures";
import { StatusPill } from "@/components/ui/primitives";

const queueTone = { review: "var(--warn)", flag: "var(--neg)", divergence: "var(--iris-b)", bias: "var(--neg)" } as const;

export default function Dashboard() {
  const [importOpen, setImportOpen] = useState(false);
  const [imported, setImported] = useState(false);
  const [importReference, setImportReference] = useState("");
  const liveCount = vacancies.filter((vacancy) => vacancy.status === "LIVE").length;
  const candidateCount = vacancies.reduce((sum, vacancy) => sum + vacancy.candidates, 0);
  const reviewCount = vacancies.reduce((sum, vacancy) => sum + vacancy.needReview, 0);
  const metrics = [
    { label: "Open vacancies", value: liveCount, icon: Briefcase, accent: "var(--iris-b)" },
    { label: "Candidates", value: candidateCount, icon: Users, accent: "var(--iris-c)" },
    { label: "Need review", value: reviewCount, icon: ClipboardCheck, tone: "text-warn", accent: "var(--warn)" },
    { label: "Fairness alerts", value: 1, icon: Scale, tone: "text-neg", accent: "var(--neg)" },
  ];

  return (
    <div className="contour-bg contour-bg-soft min-h-[calc(100vh-52px)] p-8">
      <div className="relative min-h-40 overflow-hidden rounded-2xl border border-hairline-strong bg-surface">
        <div className="absolute inset-y-0 right-0 w-[54%] bg-cover bg-center opacity-[0.22]" style={{ backgroundImage: "url(/textures/engraving-cube.jpeg)" }} />
        <div className="absolute inset-0 bg-[linear-gradient(90deg,var(--surface)_0%,var(--surface)_47%,rgba(15,15,17,.35)_100%)]" />
        <div className="absolute inset-x-0 bottom-0 h-px iris-line opacity-70" />
        <div className="relative flex min-h-40 items-center justify-between gap-6 p-6">
          <div>
            <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-irisc">Workspace overview</div>
            <h1 className="mt-2 font-display text-[30px] font-medium tracking-[-0.02em] text-hi">Good morning, Aizhan</h1>
            <p className="mt-2 text-[13px] text-mid">Three priority reviews are shown below.</p>
          </div>
          <div className="flex self-end gap-2.5">
            <button onClick={() => setImportOpen(true)} className="rounded-lg border border-hairline-strong bg-void/70 px-4 py-2.5 text-[13px] text-mid backdrop-blur hover:text-hi">
              Import role
            </button>
            <Link href="/vacancies/new" className="rounded-lg bg-paper px-4 py-2.5 text-[13px] font-medium text-void shadow-[0_0_30px_rgba(255,255,255,.08)]">
              Create vacancy
            </Link>
          </div>
        </div>
      </div>

      <div className="mt-5 grid grid-cols-4 gap-3">
        {metrics.map(({ label, value, icon: Icon, tone, accent }) => (
          <div key={label} className="card-hover relative overflow-hidden rounded-xl border border-hairline bg-surface p-4">
            <span className="absolute inset-x-0 top-0 h-px opacity-80" style={{ background: accent }} />
            <div className="flex items-center justify-between">
              <span className="text-[12px] text-mid">{label}</span>
              <span className="grid size-7 place-items-center rounded-lg bg-white/[0.035]"><Icon className="size-3.5" style={{ color: accent }} strokeWidth={1.5} /></span>
            </div>
            <div className={`mt-3 font-display text-[28px] leading-none ${tone ?? "text-hi"}`}>{value}</div>
          </div>
        ))}
      </div>

      <div className="mt-7 grid grid-cols-[minmax(0,1fr)_360px] gap-5">
        <section className="min-w-0">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-hi">Recent vacancies</h2>
            <Link href="/vacancies" className="flex items-center gap-1 text-[12px] text-mid hover:text-hi">
              View all <ArrowRight className="size-3" />
            </Link>
          </div>
          <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
            {vacancies.slice(0, 4).map((vacancy) => (
              <Link
                key={vacancy.id}
                href={`/vacancies/${vacancy.id}/ranking`}
                className="group grid grid-cols-[minmax(0,1fr)_92px_100px_18px] items-center gap-4 border-b border-hairline px-5 py-4 last:border-0 hover:bg-white/[0.025]"
              >
                <div className="min-w-0">
                  <div className="truncate text-[14px] font-medium text-hi">{vacancy.title}</div>
                  <div className="mt-1 font-mono text-[10px] text-lo">{vacancy.code}</div>
                </div>
                <StatusPill label={vacancy.status} />
                <div className="text-right">
                  <div className="font-mono text-[12px] text-hi">{vacancy.candidates}</div>
                  <div className="text-[10px] text-lo">candidates</div>
                </div>
                <ArrowRight className="size-3.5 text-lo group-hover:text-hi" />
              </Link>
            ))}
          </div>
        </section>

        <section>
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-[15px] font-medium text-hi">Needs review</h2>
            <span className="rounded-full bg-warn/10 px-2 py-0.5 font-mono text-[10px] text-warn">{attentionQueue.length}</span>
          </div>
          <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
            {attentionQueue.slice(0, 3).map((item, index) => (
              <Link
                key={item.id + index}
                href={item.id.startsWith("CND") ? `/vacancies/vac-001/candidates/${item.id}` : "/bias"}
                className="group flex items-start gap-3 border-b border-hairline px-4 py-4 last:border-0 hover:bg-white/[0.025]"
              >
                <span className="mt-1.5 size-1.5 shrink-0 rounded-full" style={{ backgroundColor: queueTone[item.kind] }} />
                <div className="min-w-0 flex-1">
                  <div className="font-mono text-[11px] text-hi">{item.id}</div>
                  <div className="mt-1 line-clamp-2 text-[12px] leading-relaxed text-mid">{item.reason}</div>
                </div>
                <ArrowRight className="mt-1 size-3.5 shrink-0 text-lo group-hover:text-hi" />
              </Link>
            ))}
          </div>
        </section>
      </div>

      {importOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-8" onMouseDown={(event) => { if (event.target === event.currentTarget) setImportOpen(false); }}>
          <div className="w-full max-w-lg rounded-xl border border-hairline-strong bg-surface2 p-6">
            <h2 className="font-display text-[22px]">Import a role</h2>
            <p className="mt-2 text-[12px] leading-relaxed text-mid">Paste the requisition URL or ID. You can review everything before publishing.</p>
            <label className="mt-5 block text-[11px] text-mid">
              ATS requisition
              <input value={importReference} onChange={(event) => setImportReference(event.target.value)} className="mt-2 w-full rounded-lg border border-hairline bg-void2 px-3 py-2.5 text-[12px] text-hi outline-none" placeholder="URL or requisition ID" />
            </label>
            <div className="mt-5 flex justify-end gap-2">
              <button onClick={() => setImportOpen(false)} className="rounded-lg border border-hairline px-4 py-2 text-[12px] text-mid">Cancel</button>
              <button disabled={!importReference.trim()} onClick={() => { setImported(true); setImportOpen(false); setImportReference(""); }} className="rounded-lg bg-paper px-4 py-2 text-[12px] text-void disabled:cursor-not-allowed disabled:opacity-30">Create draft</button>
            </div>
          </div>
        </div>
      )}
      {imported && (
        <button onClick={() => setImported(false)} className="fixed bottom-6 right-6 z-50 rounded-xl border border-pos/30 bg-surface2 p-4 text-[12px] text-pos">
          Draft created. Review it before publishing. ×
        </button>
      )}
    </div>
  );
}
