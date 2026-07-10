"use client";

import React, { useState } from "react";
import Link from "next/link";
import type { Candidate, Vacancy, AuditEntry } from "@/lib/types";
import { chainHash, shortHash } from "@/lib/hash";
import { Gauge, Radar } from "@/components/ui/viz";
import { ConfidenceBadge, TierBadge, StatusPill, Button } from "@/components/ui/primitives";
import CompetencyBlock from "./CompetencyBlock";
import {
  Lock,
  Check,
  Pencil,
  RefreshCw,
  X,
  ShieldAlert,
  Play,
  FileCheck2,
  Trash2,
  Fingerprint,
  ArrowLeft,
  GitCompareArrows,
  Clock,
} from "lucide-react";

const TABS = ["Overview", "Competencies", "Interview", "Documents", "Audit", "Notes"] as const;
type Tab = (typeof TABS)[number];

const ACTION_LABEL: Record<string, string> = {
  AI_SCORED: "AI scored",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ESCALATED: "Escalated",
  OVERRIDDEN: "Overridden",
  RECOMPUTED: "Recomputed",
  IDENTITY_REVEALED: "Identity revealed",
  INVITED: "Invited",
};
const ACTION_COLOR: Record<string, string> = {
  AI_SCORED: "var(--iris-b)",
  APPROVED: "var(--pos)",
  REJECTED: "var(--neg)",
  ESCALATED: "var(--warn)",
  OVERRIDDEN: "var(--ember)",
  RECOMPUTED: "var(--iris-c)",
  IDENTITY_REVEALED: "var(--warn)",
  INVITED: "var(--pos)",
};

export default function Scorecard({ candidate, vacancy }: { candidate: Candidate; vacancy: Vacancy }) {
  const [tab, setTab] = useState<Tab>("Overview");
  const [overall, setOverall] = useState(candidate.overall);
  const [audit, setAudit] = useState<AuditEntry[]>(candidate.audit);
  const [revealed, setRevealed] = useState(false);
  const [toast, setToast] = useState<string | null>(null);
  const [seek, setSeek] = useState<string | null>(null);
  const versions = "model claude-scoring-4 · prompt sc-v7 · rubric r3";

  const pushAudit = (action: AuditEntry["action"], target: string, reason: string) => {
    setAudit((prev) => {
      const last = prev[prev.length - 1];
      const timestamp = new Date().toISOString().replace("T", " ").slice(0, 19) + "Z";
      const hash = chainHash(last.hash, { timestamp, actor: "R. Alvarez (HR)", action, target, reason, versions });
      const entry: AuditEntry = {
        id: `a${prev.length + 1}`,
        timestamp,
        actor: "R. Alvarez (HR)",
        action,
        target,
        reason,
        versions,
        prevHash: last.hash,
        hash,
      };
      return [...prev, entry];
    });
  };

  const fireToast = (m: string) => {
    setToast(m);
    setTimeout(() => setToast(null), 3200);
  };

  const radarSeries = [
    {
      name: candidate.internalId,
      color: "var(--iris-b)",
      values: candidate.competencies.map((c) => ({ axis: c.name, value: c.score })),
    },
  ];

  return (
    <div className="relative flex min-h-full flex-col xl:flex-row">
      {/* Main column */}
      <div className="min-w-0 flex-1 p-6 md:p-8">
        {/* back + identity header */}
        <div className="mb-5 flex items-center justify-between">
          <Link href={`/hr/vacancies/${vacancy.id}/ranking`} className="mono flex items-center gap-1.5 text-[12px] text-text-lo hover:text-text-hi">
            <ArrowLeft className="h-3.5 w-3.5" /> Ranking
          </Link>
          <div className="flex items-center gap-2">
            <StatusPill status={candidate.stage === "invited" ? "LIVE" : "PENDING"} label={candidate.stage.replace("_", " ")} />
          </div>
        </div>

        {/* header block */}
        <div className="mb-6 flex flex-wrap items-center gap-5">
          <Gauge score={overall} threshold={vacancy.threshold} size={116} />
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <span className="mono text-[16px] text-text-hi">{candidate.internalId}</span>
              <TierBadge tier={candidate.tier} />
              <span className="mono-label">rank {candidate.rank} / {vacancy.applicants}</span>
            </div>
            <div className="mt-2 max-w-md text-[13px] text-text-mid">{candidate.confidencePhrase}</div>
            <div className="mt-2 flex items-center gap-2">
              <ConfidenceBadge band={candidate.confidence} size="md" />
              {candidate.divergence && (
                <span className="mono inline-flex items-center gap-1 rounded-full border border-hairline px-2 py-0.5 text-[11px]" style={{ color: "var(--ember)" }}>
                  <GitCompareArrows className="h-3 w-3" /> AI↔human divergence
                </span>
              )}
            </div>
          </div>
        </div>

        {/* tab bar */}
        <div className="mb-6 flex gap-1 overflow-x-auto border-b border-hairline no-scrollbar">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative whitespace-nowrap px-3 py-2.5 text-[13.5px] transition-colors ${
                tab === t ? "text-text-hi" : "text-text-lo hover:text-text-mid"
              }`}
            >
              {t}
              {t === "Audit" && <span className="mono ml-1.5 rounded-full bg-white/[0.06] px-1.5 text-[10px] text-text-mid">{audit.length}</span>}
              {tab === t && <span className="iris-bar absolute inset-x-2 bottom-0 h-[2px] rounded-full" />}
            </button>
          ))}
        </div>

        {/* tab content */}
        {tab === "Overview" && (
          <OverviewTab candidate={candidate} vacancy={vacancy} revealed={revealed} />
        )}
        {tab === "Competencies" && (
          <div className="space-y-3">
            <p className="mb-1 text-[13px] text-text-mid">
              Each competency unfolds its layers — ranked drivers, the evidence behind them, and the full reasoning trace.
            </p>
            {candidate.competencies.map((c, i) => (
              <CompetencyBlock key={c.id} comp={c} threshold={vacancy.threshold} defaultOpen={i === 0} />
            ))}
          </div>
        )}
        {tab === "Interview" && <InterviewTab candidate={candidate} seek={seek} setSeek={setSeek} />}
        {tab === "Documents" && <DocumentsTab candidate={candidate} />}
        {tab === "Audit" && <AuditTab audit={audit} />}
        {tab === "Notes" && <NotesTab />}
      </div>

      {/* Right inspector — HITL (stacks below on < xl so it's always reachable) */}
      <aside className="w-full shrink-0 border-t border-hairline bg-void-2/50 p-5 xl:w-[360px] xl:border-l xl:border-t-0">
        <div className="xl:sticky xl:top-4">
          <div className="mb-1 flex items-center gap-2">
            <span className="mono-label">Human-in-the-loop</span>
          </div>
          <p className="mb-4 text-[12px] leading-relaxed text-text-lo">
            The AI structures the evidence. The decision is yours — and it is written to the audit log.
          </p>

          {/* current score editable */}
          <div className="mb-4 rounded-md border border-hairline bg-surface p-3">
            <div className="mono-label mb-1">Current overall</div>
            <div className="flex items-center gap-2">
              <span className="metric text-[26px]" style={{ color: overall >= vacancy.threshold ? "var(--pos)" : "var(--text-hi)" }}>
                {overall}
              </span>
              {overall !== candidate.aiScore && (
                <span className="mono text-[11px] text-text-lo">AI: {candidate.aiScore}</span>
              )}
            </div>
          </div>

          <HITLActions
            overall={overall}
            aiScore={candidate.aiScore}
            onAccept={() => {
              pushAudit("APPROVED", `${candidate.internalId} · overall`, "Accepted AI assessment; advancing.");
              fireToast("Accepted · written to audit log");
            }}
            onChange={(score, reason) => {
              setOverall(score);
              pushAudit("OVERRIDDEN", `${candidate.internalId} · overall`, `${reason} (${candidate.overall}→${score})`);
              fireToast("Score overridden · audit entry written");
            }}
            onRecompute={() => {
              const jitter = Math.round((Math.random() - 0.5) * 4);
              const next = Math.max(0, Math.min(100, overall + jitter));
              setOverall(next);
              pushAudit("RECOMPUTED", `${candidate.internalId} · overall`, `Recomputed with pinned model/prompt/rubric (${overall}→${next}).`);
              fireToast("Recomputed · audit entry written");
            }}
            onReject={(reason) => {
              pushAudit("REJECTED", `${candidate.internalId} · overall`, reason);
              fireToast("Rejected with reason · audit entry written");
            }}
          />

          {/* reveal identity */}
          <div className="mt-4 rounded-md border border-hairline bg-surface p-3">
            <div className="mb-2 flex items-center gap-2">
              <Lock className="h-3.5 w-3.5 text-text-lo" />
              <span className="mono-label">Identity — locked</span>
            </div>
            {revealed ? (
              <div className="text-[12.5px] text-text-hi">
                <div>{candidate.pii.name}</div>
                <div className="text-text-mid">{candidate.pii.location} · {candidate.pii.years}y exp</div>
              </div>
            ) : (
              <>
                <p className="mb-2 text-[12px] text-text-lo">
                  PII is hidden from scoring and reviewers until the final stage. Revealing is permissioned and logged.
                </p>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => {
                    setRevealed(true);
                    pushAudit("IDENTITY_REVEALED", `${candidate.internalId} · PII`, "Identity revealed at final stage (permissioned).");
                    fireToast("Identity revealed · logged to audit");
                  }}
                >
                  <Fingerprint className="h-3.5 w-3.5" /> Reveal identity
                </Button>
              </>
            )}
          </div>

          {/* activity log */}
          <div className="mt-4">
            <div className="mono-label mb-2">Activity log</div>
            <div className="max-h-64 space-y-2 overflow-y-auto pr-1 no-scrollbar">
              {[...audit].reverse().map((a) => (
                <div key={a.hash} className="flex gap-2 text-[11.5px]">
                  <span className="mt-1 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: ACTION_COLOR[a.action] }} />
                  <div className="min-w-0">
                    <span className="text-text-hi">{ACTION_LABEL[a.action]}</span>{" "}
                    <span className="text-text-lo">by {a.actor}</span>
                    <div className="mono truncate text-[10px] text-text-lo">{a.timestamp}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </aside>

      {/* toast */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-2 rounded-md border border-hairline-strong bg-surface-2 px-4 py-2.5 shadow-2xl animate-fade-in-up">
          <Check className="h-4 w-4" style={{ color: "var(--pos)" }} />
          <span className="text-[13px] text-text-hi">{toast}</span>
        </div>
      )}
    </div>
  );
}

/* ---------- HITL actions (equal weight: design the "no" before the "yes") ---------- */
function HITLActions({
  overall,
  aiScore,
  onAccept,
  onChange,
  onRecompute,
  onReject,
}: {
  overall: number;
  aiScore: number;
  onAccept: () => void;
  onChange: (score: number, reason: string) => void;
  onRecompute: () => void;
  onReject: (reason: string) => void;
}) {
  const [mode, setMode] = useState<null | "change" | "reject">(null);
  const [score, setScore] = useState(overall);
  const [reason, setReason] = useState("");

  const btn =
    "flex flex-col items-center justify-center gap-1 rounded-md border border-hairline bg-surface py-3 text-[12px] transition-all hover:border-hairline-strong";

  if (mode === "change") {
    return (
      <ReasonForm
        title="Change score"
        withScore
        score={score}
        setScore={setScore}
        reason={reason}
        setReason={setReason}
        cta="Write override"
        onCancel={() => { setMode(null); setReason(""); }}
        onSubmit={() => { if (reason.trim()) { onChange(score, reason.trim()); setMode(null); setReason(""); } }}
      />
    );
  }
  if (mode === "reject") {
    return (
      <ReasonForm
        title="Reject with reason"
        reason={reason}
        setReason={setReason}
        cta="Write rejection"
        destructive
        onCancel={() => { setMode(null); setReason(""); }}
        onSubmit={() => { if (reason.trim()) { onReject(reason.trim()); setMode(null); setReason(""); } }}
      />
    );
  }

  return (
    <div className="grid grid-cols-2 gap-2">
      <button className={btn} style={{ color: "var(--pos)" }} onClick={onAccept}>
        <Check className="h-4 w-4" /> Accept
      </button>
      <button className={btn} style={{ color: "var(--ember)" }} onClick={() => { setScore(overall); setMode("change"); }}>
        <Pencil className="h-4 w-4" /> Change
      </button>
      <button className={btn} style={{ color: "var(--iris-c)" }} onClick={onRecompute}>
        <RefreshCw className="h-4 w-4" /> Recompute
      </button>
      <button className={btn} style={{ color: "var(--neg)" }} onClick={() => setMode("reject")}>
        <X className="h-4 w-4" /> Reject
      </button>
    </div>
  );
}

function ReasonForm({
  title, withScore, score, setScore, reason, setReason, cta, destructive, onCancel, onSubmit,
}: {
  title: string; withScore?: boolean; score?: number; setScore?: (n: number) => void;
  reason: string; setReason: (s: string) => void; cta: string; destructive?: boolean;
  onCancel: () => void; onSubmit: () => void;
}) {
  return (
    <div className="rounded-md border border-hairline-strong bg-surface p-3">
      <div className="mono-label mb-2">{title}</div>
      {withScore && (
        <div className="mb-3">
          <div className="mb-1 flex items-center justify-between">
            <span className="text-[12px] text-text-mid">New score</span>
            <span className="metric text-[18px] text-text-hi">{score}</span>
          </div>
          <input type="range" min={0} max={100} value={score} onChange={(e) => setScore?.(Number(e.target.value))} className="w-full accent-[var(--ember)]" />
        </div>
      )}
      <label className="mono-label mb-1 block">Reason (required → audit)</label>
      <textarea
        value={reason}
        onChange={(e) => setReason(e.target.value)}
        rows={3}
        placeholder="Why are you changing this? This is written to the tamper-evident log."
        className="mb-3 w-full resize-none rounded-[6px] border border-hairline bg-void-2 p-2 text-[12.5px] text-text-hi outline-none focus:border-hairline-strong"
      />
      <div className="flex gap-2">
        <Button size="sm" variant={destructive ? "destructive" : "primary"} onClick={onSubmit} disabled={!reason.trim()} className="flex-1">
          {cta}
        </Button>
        <Button size="sm" variant="ghost" onClick={onCancel}>Cancel</Button>
      </div>
    </div>
  );
}

/* ---------- Overview ---------- */
function OverviewTab({ candidate, vacancy, revealed }: { candidate: Candidate; vacancy: Vacancy; revealed: boolean }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div className="space-y-5">
        <div className="rounded-md border border-hairline bg-surface p-4">
          <div className="mono-label mb-3">Anonymized profile</div>
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <Field label="Internal ID" value={candidate.internalId} mono />
            <Field label="Applied" value={candidate.appliedDate} mono />
            <Field label="Tier" value={candidate.tier} />
            <Field label="Identity" value={revealed ? candidate.pii.name : "Hidden until final stage"} />
          </div>
        </div>

        <div className="rounded-md border border-hairline bg-surface p-4">
          <div className="mono-label mb-2">Top strengths</div>
          <ul className="space-y-1.5">
            {candidate.strengths.map((s) => (
              <li key={s} className="flex items-start gap-2 text-[13px] text-text-hi">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--pos)" }} />
                {s}
              </li>
            ))}
          </ul>
          <div className="mono-label mb-2 mt-4">Growth areas</div>
          <ul className="space-y-1.5">
            {candidate.weaknesses.map((s) => (
              <li key={s} className="flex items-start gap-2 text-[13px] text-text-mid">
                <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full" style={{ background: "var(--warn)" }} />
                {s}
              </li>
            ))}
          </ul>
        </div>
      </div>

      <div className="rounded-md border border-hairline bg-surface p-4">
        <div className="mono-label mb-2">Competency profile</div>
        <div className="flex justify-center">
          <Radar series={[{ name: candidate.internalId, color: "var(--iris-b)", values: candidate.competencies.map((c) => ({ axis: c.name, value: c.score })) }]} size={300} />
        </div>
      </div>
    </div>
  );
}

function Field({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div>
      <div className="mono-label">{label}</div>
      <div className={`${mono ? "mono" : ""} text-text-hi`}>{value}</div>
    </div>
  );
}

/* ---------- Interview ---------- */
function InterviewTab({ candidate, seek, setSeek }: { candidate: Candidate; seek: string | null; setSeek: (s: string) => void }) {
  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
      <div>
        <div className="relative mb-3 flex aspect-video items-center justify-center overflow-hidden rounded-md border border-hairline bg-void">
          <div className="pointer-events-none absolute inset-0 tex-grid opacity-40" />
          <div className="relative flex flex-col items-center">
            <button className="flex h-12 w-12 items-center justify-center rounded-full border border-hairline-strong bg-surface-2 text-text-hi hover:iris-border">
              <Play className="h-5 w-5" />
            </button>
            <span className="mono-label mt-3">recorded interview · 42:18</span>
            {seek && <span className="mono mt-1 text-[11px] text-iris-b">seek → {seek}</span>}
          </div>
        </div>
        <div className="rounded-md border border-hairline bg-surface p-3">
          <div className="mono-label mb-2 flex items-center gap-1.5">
            <ShieldAlert className="h-3.5 w-3.5" style={{ color: "var(--ember)" }} /> Integrity signals — advisory, not a verdict
          </div>
          <p className="text-[12.5px] text-text-mid">{candidate.integrity.note}</p>
          <p className="mt-2 text-[11px] text-text-lo">Never grounds for automatic rejection. The candidate was informed these are collected.</p>
        </div>
      </div>

      <div>
        <div className="mono-label mb-2">Transcript · click a line to seek</div>
        <div className="max-h-[440px] space-y-2 overflow-y-auto rounded-md border border-hairline bg-surface p-3">
          {candidate.transcript.map((l, i) => (
            <button
              key={i}
              onClick={() => setSeek(l.t)}
              className={`flex w-full gap-2 rounded-[6px] p-2 text-left transition-colors hover:bg-white/[0.03] ${l.flag === "key" ? "bg-[rgba(123,147,255,0.05)]" : ""}`}
            >
              <span className="mono shrink-0 text-[11px] text-iris-b">{l.t}</span>
              <span className={`mono shrink-0 text-[10px] ${l.speaker === "AI" ? "text-iris-b" : "text-text-lo"}`}>{l.speaker}</span>
              <span className="text-[12.5px] leading-snug text-text-mid">
                {l.text}
                {l.flag === "integrity" && <span className="mono ml-1 text-[10px]" style={{ color: "var(--ember)" }}> ⚑ advisory</span>}
              </span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/* ---------- Documents ---------- */
function DocumentsTab({ candidate }: { candidate: Candidate }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2 rounded-md border border-hairline bg-surface px-3 py-2">
        <Trash2 className="h-3.5 w-3.5 text-text-lo" />
        <span className="text-[12.5px] text-text-mid">Source documents were auto-deleted after verification. Only the result and structured data are retained.</span>
      </div>
      <div className="overflow-hidden rounded-md border border-hairline bg-surface">
        <table className="w-full text-left text-[13px]">
          <thead>
            <tr className="border-b border-hairline">
              <th className="mono-label px-4 py-2 font-normal">Claim</th>
              <th className="mono-label px-4 py-2 font-normal">Result</th>
              <th className="mono-label px-4 py-2 font-normal">Extracted</th>
              <th className="mono-label px-4 py-2 font-normal">Conf.</th>
            </tr>
          </thead>
          <tbody>
            {candidate.documents.map((d, i) => (
              <tr key={i} className="border-b border-hairline last:border-0">
                <td className="px-4 py-3 text-text-hi">{d.claim}</td>
                <td className="px-4 py-3">
                  <StatusPill status={d.result} label={d.result === "VERIFIED" ? "Verified" : "Not verified"} />
                </td>
                <td className="px-4 py-3 text-text-mid">{d.extracted}</td>
                <td className="px-4 py-3"><ConfidenceBadge band={d.confidence} /></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

/* ---------- Audit ---------- */
function AuditTab({ audit }: { audit: AuditEntry[] }) {
  return (
    <div>
      <div className="mb-3 flex items-center gap-2">
        <FileCheck2 className="h-4 w-4 text-iris-b" />
        <p className="text-[13px] text-text-mid">Append-only, hash-chained. Each entry hashes the previous — tamper-evident.</p>
      </div>
      <div className="space-y-2">
        {[...audit].reverse().map((a) => (
          <div key={a.hash} className="rounded-md border border-hairline bg-surface p-3">
            <div className="mb-1.5 flex items-center gap-2">
              <span className="mono rounded-[4px] px-1.5 py-0.5 text-[10px] uppercase" style={{ color: ACTION_COLOR[a.action], background: "rgba(255,255,255,0.04)" }}>
                {ACTION_LABEL[a.action]}
              </span>
              <span className="text-[12.5px] text-text-hi">{a.target}</span>
              <span className="mono ml-auto flex items-center gap-1 text-[11px] text-text-lo">
                <Clock className="h-3 w-3" /> {a.timestamp}
              </span>
            </div>
            <p className="mb-2 text-[12.5px] text-text-mid">{a.reason}</p>
            <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-text-lo">
              <span className="mono">actor: {a.actor}</span>
              <span className="mono">{a.versions}</span>
              <span className="mono">prev: {shortHash(a.prevHash)}</span>
              <span className="mono" style={{ color: "var(--iris-b)" }}>hash: {shortHash(a.hash)}</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Notes ---------- */
function NotesTab() {
  const [scope, setScope] = useState<"Public" | "Private" | "Interviewers">("Public");
  const [submitted, setSubmitted] = useState(false);
  return (
    <div className="max-w-2xl">
      <div className="mb-3 flex gap-1">
        {(["Public", "Private", "Interviewers"] as const).map((s) => (
          <button key={s} onClick={() => setScope(s)} className={`mono rounded-[6px] px-3 py-1.5 text-[12px] ${scope === s ? "bg-white/[0.05] text-text-hi" : "text-text-lo hover:text-text-mid"}`}>
            {s}
          </button>
        ))}
      </div>
      {scope === "Interviewers" && !submitted ? (
        <div className="rounded-md border border-hairline bg-surface p-6 text-center">
          <Lock className="mx-auto mb-2 h-5 w-5 text-text-lo" />
          <p className="mb-3 text-[13px] text-text-mid">Others&rsquo; feedback is blind until you submit your own — this removes anchoring (Ashby pattern).</p>
          <Button size="sm" variant="secondary" onClick={() => setSubmitted(true)}>Submit my feedback to unblind</Button>
        </div>
      ) : (
        <div className="rounded-md border border-hairline bg-surface p-4">
          <textarea rows={4} placeholder={`Add a ${scope.toLowerCase()} note…`} className="w-full resize-none rounded-[6px] border border-hairline bg-void-2 p-3 text-[13px] text-text-hi outline-none focus:border-hairline-strong" />
          {scope === "Interviewers" && submitted && (
            <div className="mt-3 rounded-[6px] border border-hairline bg-void-2 p-3 text-[12.5px] text-text-mid">
              <span className="mono-label">T. Okafor · unblinded</span>
              <p className="mt-1">Strong on decision-making; I&rsquo;d probe stakeholder management in the next round.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
