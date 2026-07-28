"use client";

import { useState } from "react";
import {
  ChevronDown, ChevronRight, Lock, Check, Pencil, RefreshCw, X,
  Quote, FileCheck2, ShieldQuestion,
} from "lucide-react";
import type { Candidate, CompetencyScore, EvidenceSpan } from "@/lib/fixtures";
import { threshold } from "@/lib/fixtures";
import { ConfidenceBadge, TierBadge } from "@/components/ui/primitives";

const TABS = ["Overview", "Competencies", "Interview", "Documents", "Audit", "Notes"] as const;
type Tab = (typeof TABS)[number];

/* ---------- radar (SVG, iris stroke) ---------- */
function Radar({ comps }: { comps: CompetencyScore[] }) {
  const n = comps.length;
  const R = 74;
  const cx = 210, cy = 106;
  const pt = (i: number, r: number) => {
    const a = (Math.PI * 2 * i) / n - Math.PI / 2;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const ring = (f: number) => comps.map((_, i) => pt(i, R * f).join(",")).join(" ");
  const data = comps.map((c, i) => pt(i, (c.score / 100) * R).join(",")).join(" ");
  return (
    <svg viewBox="0 0 420 212" className="w-full max-w-[440px]">
      {[0.33, 0.66, 1].map((f) => (
        <polygon key={f} points={ring(f)} fill="none" stroke="var(--line-soft)" strokeWidth="1" />
      ))}
      {comps.map((_, i) => {
        const [x, y] = pt(i, R);
        return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="var(--line-soft)" strokeWidth="0.5" />;
      })}
      <polygon points={data} fill="rgba(255,106,46,0.12)" stroke="var(--iris-b)" strokeWidth="1.25" />
      {comps.map((c, i) => {
        const [x, y] = pt(i, (c.score / 100) * R);
        return <circle key={c.id} cx={x} cy={y} r="2" fill="var(--iris-a)" />;
      })}
      {comps.map((c, i) => {
        const [x, y] = pt(i, R + 14);
        const anchor = Math.abs(x - cx) < 12 ? "middle" : x > cx ? "start" : "end";
        return (
          <text key={c.id} x={x} y={y + 2.5} textAnchor={anchor} className="fill-[var(--text-lo)]" fontSize="8" fontFamily="var(--font-jetbrains)" letterSpacing="0.06em">
            {c.name.toUpperCase()}
          </text>
        );
      })}
    </svg>
  );
}

/* ---------- evidence chip + anchored popover (Perplexity model) ---------- */
function EvidenceChips({ evidence, onOpenTranscript }: { evidence: EvidenceSpan[]; onOpenTranscript: () => void }) {
  const [open, setOpen] = useState<number | null>(null);
  return (
    <div className="relative flex flex-wrap gap-2">
      {evidence.map((e, i) => (
        <button
          key={i}
          onClick={() => setOpen(open === i ? null : i)}
          className={`flex items-center gap-1.5 rounded-full border px-2.5 py-1 font-mono text-[11px] transition-colors ${
            open === i ? "border-irisb/60 text-hi" : "border-hairline text-mid hover:border-hairline-strong hover:text-hi"
          }`}
        >
          <Quote className="size-3" />
          {e.timestamp}
        </button>
      ))}
      {open !== null && (
        <div className="absolute left-0 top-9 z-20 w-[420px] rounded-lg border border-hairline-strong bg-surface2 p-4 shadow-xl">
          <div className="hud-label">EVIDENCE · {evidence[open].timestamp} · {open + 1}/{evidence.length}</div>
          <p className="mt-2 text-[13px] leading-relaxed text-hi">“{evidence[open].quote}”</p>
          <p className="mt-2 text-[12px] text-lo">Q: {evidence[open].question}</p>
          <div className="mt-3 flex items-center justify-between">
            <button onClick={onOpenTranscript} className="text-[12px] text-mid hover:text-hi">Open in transcript →</button>
            <div className="flex gap-1">
              <button onClick={() => setOpen((open - 1 + evidence.length) % evidence.length)} className="rounded border border-hairline px-2 text-[12px] text-mid">‹</button>
              <button onClick={() => setOpen((open + 1) % evidence.length)} className="rounded border border-hairline px-2 text-[12px] text-mid">›</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/* ---------- one competency block: the explainability heart ---------- */
function CompetencyBlock({ comp, onOpenTranscript }: { comp: CompetencyScore; onOpenTranscript: () => void }) {
  const [open, setOpen] = useState(comp.id === "leadership");
  const [traceOpen, setTraceOpen] = useState(false);
  const [confOpen, setConfOpen] = useState(false);
  return (
    <div className="rounded-xl border border-hairline bg-surface">
      <button onClick={() => setOpen(!open)} className="flex w-full items-center gap-4 px-5 py-4 text-left">
        {open ? <ChevronDown className="size-4 text-lo" /> : <ChevronRight className="size-4 text-lo" />}
        <span className="text-[14px] font-medium text-hi">{comp.name}</span>
        {comp.docVerified && (
          <span className="flex items-center gap-1 font-mono text-[10px] tracking-[0.06em] text-pos">
            <FileCheck2 className="size-3" /> DOC-VERIFIED
          </span>
        )}
        <span className="ml-auto flex items-center gap-4">
          <ConfidenceBadge band={comp.confidence} compact />
          <span className={`tnum font-mono text-[15px] ${comp.score >= threshold ? "text-hi" : "text-mid"}`}>{comp.score}</span>
          <span className="hud-label">W {comp.weight}%</span>
        </span>
      </button>

      {open && (
        <div className="border-t border-hairline px-5 pb-5 pt-4 pl-[52px]">
          {/* Ranked drivers — FICO reason-code model, principal reason first */}
          <div className="hud-label">RANKED DRIVERS · PRINCIPAL FIRST</div>
          <ol className="mt-2.5 space-y-2">
            {comp.drivers.map((d, i) => (
              <li key={i} className="flex items-center gap-3">
                <span className="tnum w-4 font-mono text-[11px] text-lo">{i + 1}</span>
                <span className="relative h-1 w-20 shrink-0 overflow-hidden rounded-full bg-white/8">
                  <span
                    className="absolute inset-y-0 left-0 rounded-full"
                    style={{ width: `${d.impact * 200}%`, backgroundColor: d.direction === "pos" ? "var(--pos)" : "var(--neg)" }}
                  />
                </span>
                <span className="text-[13px] leading-snug text-hi">{d.text}</span>
              </li>
            ))}
          </ol>

          {/* Confidence as a phrase, expandable "why" */}
          <button onClick={() => setConfOpen(!confOpen)} className="mt-4 block text-left">
            <span className="text-[13px] text-mid hover:text-hi">{comp.confidenceReason}</span>
            <span className="ml-2 font-mono text-[10px] text-lo">{confOpen ? "HIDE" : "WHY?"}</span>
          </button>
          {confOpen && (
            <div className="mt-2 rounded-lg border border-hairline bg-void2 p-3.5 text-[12px] leading-relaxed text-mid">
              Drivers of this confidence: evidence count ({comp.evidence.length} cited fragments), answer consistency
              across the interview, and data quality of the transcript segments. Confidence is calibrated post-hoc
              against held-out agreement data — it is a band, never a raw number.
            </div>
          )}

          {/* Evidence chips */}
          <div className="mt-4">
            <div className="hud-label mb-2">EVIDENCE · INTERVIEW FRAGMENTS</div>
            <EvidenceChips evidence={comp.evidence} onOpenTranscript={onOpenTranscript} />
          </div>

          {/* Collapsible reasoning trace — "Completed N steps" */}
          <button onClick={() => setTraceOpen(!traceOpen)} className="mt-4 flex items-center gap-2 text-[12px] text-lo hover:text-mid">
            {traceOpen ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
            Completed {comp.trace.length} steps
          </button>
          {traceOpen && (
            <ol className="mt-2 space-y-1.5 border-l border-hairline pl-4">
              {comp.trace.map((s, i) => (
                <li key={i} className="flex gap-2.5 text-[12px] leading-relaxed text-mid">
                  <span className="tnum font-mono text-[10px] text-lo">{String(i + 1).padStart(2, "0")}</span>
                  {s}
                </li>
              ))}
              <li className="pt-1 font-mono text-[10px] tracking-[0.06em] text-lo">
                MODEL wbx-score-2.3 · PROMPT V11 · RUBRIC V3 · FULL TREE IN AUDIT →
              </li>
            </ol>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------- HITL inspector (right panel) ---------- */
function HitlInspector({ c }: { c: Candidate }) {
  const [action, setAction] = useState<string | null>(null);
  const [reason, setReason] = useState("");
  const [logged, setLogged] = useState<string[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const needsReason = action === "Change" || action === "Reject";
  const commit = () => {
    if (!action || (needsReason && reason.trim().length < 8)) return;
    setLogged((l) => [`${new Date().toISOString().slice(0, 16).replace("T", " ")} · a.rakhimova · ${action.toUpperCase()}${reason ? ` · “${reason}”` : ""} · hash 3c9d…${Math.floor(Math.random() * 8999 + 1000)}`, ...l]);
    setAction(null);
    setReason("");
  };

  const actions = [
    { label: "Accept", value: "Accept", icon: Check },
    { label: "Adjust score", value: "Change", icon: Pencil },
    { label: "Rescore", value: "Recompute", icon: RefreshCw },
    { label: "Reject", value: "Reject", icon: X },
  ];

  return (
    <aside className="sticky top-[76px] h-fit w-[310px] shrink-0 rounded-xl border border-hairline bg-surface">
      <div className="border-b border-hairline p-5">
        <div className="text-[14px] font-medium text-hi">Human decision</div>
        <p className="mt-1.5 text-[11px] leading-relaxed text-mid">Choose an action. Adjustments and rejections require a reason.</p>
      </div>

      <div className="p-5">
        {/* equal-weight action grid — the "no" designed before the "yes" */}
        <div className="grid grid-cols-2 gap-2">
          {actions.map((a) => (
            <button
              key={a.label}
              onClick={() => setAction(action === a.value ? null : a.value)}
              className={`flex h-10 items-center justify-center gap-2 rounded border text-[13px] transition-colors ${
                action === a.value
                  ? "border-irisb/60 bg-surface2 text-hi"
                  : "border-hairline-strong bg-surface2 text-hi hover:border-irisb/40"
              }`}
            >
              <a.icon className="size-3.5" /> {a.label}
            </button>
          ))}
        </div>

        {needsReason && (
          <div className="mt-3">
            <label className="hud-label">REASON · REQUIRED · GOES TO AUDIT</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              className="iris-focus mt-1.5 w-full rounded-lg border border-hairline bg-void2 p-3 text-[13px] text-hi placeholder:text-lo"
              placeholder="Why is the AI score wrong? Cite the fragment if you can."
            />
          </div>
        )}
        {action && (
          <button
            onClick={commit}
            disabled={needsReason && reason.trim().length < 8}
            className="mt-3 w-full rounded border border-hairline-strong bg-surface2 py-2 text-[13px] text-hi transition-colors hover:border-irisb/50 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Confirm decision
          </button>
        )}

        <div className="mt-5 border-t border-hairline pt-4">
          <button onClick={() => setShowHistory((value) => !value)} aria-expanded={showHistory} className="flex w-full items-center justify-between text-[11px] text-mid hover:text-hi">
            <span>Decision history</span>
            <span>{showHistory ? "Hide" : `${logged.length + c.audit.length} entries`}</span>
          </button>
          {showHistory && <div className="mt-3 space-y-2.5">
            {logged.map((l, i) => (
              <p key={i} className="font-mono text-[10.5px] leading-relaxed text-ember">{l}</p>
            ))}
            {c.audit.slice().reverse().map((a) => (
              <p key={a.id} className="font-mono text-[10.5px] leading-relaxed text-lo">
                <span className="text-mid">{a.timestamp}</span> · {a.actor} · <span className={a.action === "OVERRIDDEN" ? "text-ember" : ""}>{a.action}</span>
                {a.reason && <span className="text-mid"> · “{a.reason}”</span>} · {a.hash}
              </p>
            ))}
          </div>}
        </div>
      </div>
    </aside>
  );
}

/* ---------- tabs content ---------- */
function Overview({ c }: { c: Candidate }) {
  const [revealed, setRevealed] = useState(false);
  return (
    <div className="grid grid-cols-[1fr_1fr] gap-6">
      <div className="rounded-xl border border-hairline bg-surface p-6">
        <div className="flex items-start justify-between">
          <div>
            <div className="hud-label">ANONYMIZED · PII HIDDEN UNTIL FINAL STAGE</div>
            <div className="mt-2 font-mono text-[20px] text-hi">{c.internalId}</div>
            <div className="mt-1.5 flex items-center gap-2.5">
              <TierBadge tier={c.tier} />
              <span className="font-mono text-[11px] text-lo">APPLIED {c.appliedAt}</span>
            </div>
          </div>
          <button onClick={() => setRevealed((v) => !v)} className="flex items-center gap-1.5 rounded border border-hairline px-2.5 py-1.5 font-mono text-[11px] text-lo hover:text-mid">
            <Lock className="size-3" /> {revealed ? "HIDE IDENTITY" : "REVEAL IDENTITY"}
          </button>
        </div>
        {revealed && <div className="mt-4 rounded-lg border border-warn/25 bg-warn/5 p-3 text-[11px] text-warn">Identity revealed: Dana Chen · reveal event logged for this review session.</div>}
        <div className="mt-6 flex items-end gap-4">
          <span className="tnum font-display text-[56px] font-medium leading-none text-hi">{c.overall}</span>
          <div className="pb-1.5">
            <div className="h-1.5 w-40 overflow-hidden rounded-full bg-white/8">
              <div className="h-full rounded-full" style={{ width: `${c.overall}%`, background: "var(--iris-gradient)" }} />
            </div>
            <p className="mt-2 max-w-[30ch] text-[12px] leading-snug text-mid">{c.confidencePhrase}</p>
          </div>
        </div>
        <div className="mt-6 grid grid-cols-2 gap-5 border-t border-hairline pt-5">
          <div>
            <div className="hud-label mb-2 text-pos">TOP STRENGTHS</div>
            <ul className="space-y-1.5 text-[13px] text-hi">
              {c.strengths.map((s) => <li key={s} className="flex gap-2"><span className="text-pos">+</span>{s}</li>)}
            </ul>
          </div>
          <div>
            <div className="hud-label mb-2 text-warn">GROWTH AREAS</div>
            <ul className="space-y-1.5 text-[13px] text-mid">
              {c.weaknesses.map((s) => <li key={s} className="flex gap-2"><span className="text-warn">−</span>{s}</li>)}
            </ul>
          </div>
        </div>
      </div>
      <div className="grid-paper flex items-center justify-center rounded-xl border border-hairline bg-surface p-6">
        <Radar comps={c.competencies} />
      </div>
    </div>
  );
}

function Interview({ c }: { c: Candidate }) {
  const lines = c.competencies.flatMap((k) => k.evidence.map((e) => ({ ...e, comp: k.name })));
  const [selectedLine, setSelectedLine] = useState(0);
  const selected = lines[selectedLine];
  return (
    <div className="grid grid-cols-[3fr_2fr] gap-6">
      <div className="flex aspect-video items-center justify-center rounded-xl border border-hairline bg-void2">
        <div className="text-center">
          <div className="mx-auto size-10 rounded-full border border-hairline-strong pl-[3px] pt-[7px] text-[18px] text-mid">▶</div>
          <div className="hud-label mt-3">INTERVIEW RECORDING · 47:12</div>
          {selected && (
            <div className="mx-auto mt-4 max-w-md px-6">
              <div className="font-mono text-[10px] text-irisc">PLAYHEAD · {selected.timestamp} · {selected.comp.toUpperCase()}</div>
              <p className="mt-2 text-[12px] leading-relaxed text-mid">“{selected.quote}”</p>
            </div>
          )}
        </div>
      </div>
      <div className="rounded-xl border border-hairline bg-surface p-5">
        <div className="hud-label mb-3">SYNCED TRANSCRIPT · PER-QUESTION</div>
        <div className="space-y-4">
          {lines.map((l, i) => (
            <button
              key={i}
              aria-pressed={selectedLine === i}
              onClick={() => setSelectedLine(i)}
              className={`block w-full rounded px-2 py-1.5 text-left transition-colors ${selectedLine === i ? "bg-irisa/10" : "hover:bg-white/[0.02]"}`}
            >
              <div className="font-mono text-[10px] text-lo">{l.timestamp} · {l.comp.toUpperCase()}</div>
              <p className="mt-0.5 text-[13px] leading-relaxed text-mid">“{l.quote}”</p>
            </button>
          ))}
        </div>
        <div className="mt-5 rounded-lg border border-warn/25 bg-warn/5 p-3.5">
          <div className="flex items-center gap-2 font-mono text-[10px] tracking-[0.06em] text-warn">
            <ShieldQuestion className="size-3.5" /> INTEGRITY SIGNALS · ADVISORY, NOT A VERDICT
          </div>
          <p className="mt-1.5 text-[12px] leading-relaxed text-mid">
            {c.integrityAdvisory
              ? "Window switching detected around Q7; speech-rate consistent. Context for your judgement only — never grounds for automatic rejection."
              : "No advisory signals recorded. Timing, gaze, and speech-rate within baseline."}
          </p>
        </div>
      </div>
    </div>
  );
}

function Documents({ c }: { c: Candidate }) {
  return (
    <div className="rounded-xl border border-hairline bg-surface">
      <table className="w-full text-left text-[13px]">
        <thead>
          <tr className="border-b border-hairline">
            {["CLAIM", "RESULT", "EXTRACTED", "CONFIDENCE"].map((h) => (
              <th key={h} className="hud-label px-5 py-3 font-normal">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          <tr className="border-b border-hairline">
            <td className="px-5 py-3.5 text-hi">B.Sc. Computer Science, KBTU (2019)</td>
            <td className="px-5"><span className="font-mono text-[11px] text-pos">VERIFIED</span></td>
            <td className="px-5 text-mid">Diploma № KZ-2019-4471 · GPA 3.6</td>
            <td className="px-5"><ConfidenceBadge band="High" compact /></td>
          </tr>
          <tr>
            <td className="px-5 py-3.5 text-hi">AWS Solutions Architect cert (2024)</td>
            <td className="px-5"><span className="font-mono text-[11px] text-warn">PENDING</span></td>
            <td className="px-5 text-mid">—</td>
            <td className="px-5"><ConfidenceBadge band="Medium" compact /></td>
          </tr>
        </tbody>
      </table>
      <p className="border-t border-hairline px-5 py-3.5 font-mono text-[10.5px] tracking-[0.04em] text-lo">
        SOURCE DOCUMENTS AUTO-DELETED AFTER VERIFICATION · ONLY RESULTS + STRUCTURED DATA RETAINED
      </p>
    </div>
  );
}

function Audit({ c }: { c: Candidate }) {
  return (
    <div className="overflow-hidden rounded-xl border border-hairline bg-surface">
      <table className="w-full text-left text-[12.5px]">
        <thead>
          <tr className="border-b border-hairline">
            {["ID", "TIMESTAMP", "ACTOR", "ACTION", "TARGET", "REASON", "VERSIONS", "PREV-HASH"].map((h) => (
              <th key={h} className="hud-label whitespace-nowrap px-4 py-3 font-normal">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {c.audit.map((a) => (
            <tr key={a.id} className="border-b border-hairline last:border-b-0">
              <td className="px-4 py-3 font-mono text-[11px] text-lo">{a.id}</td>
              <td className="px-4 font-mono text-[11px] text-mid">{a.timestamp}</td>
              <td className="px-4 text-mid">{a.actor}</td>
              <td className={`px-4 font-mono text-[11px] ${a.action === "OVERRIDDEN" ? "text-ember" : a.action === "APPROVED" ? "text-pos" : "text-mid"}`}>{a.action}</td>
              <td className="px-4 text-mid">{a.target}</td>
              <td className="max-w-[240px] px-4 text-[12px] text-lo">{a.reason ?? "—"}</td>
              <td className="px-4 font-mono text-[10px] text-lo">{a.modelVer}</td>
              <td className="px-4 font-mono text-[10px] text-lo">{a.hash}</td>
            </tr>
          ))}
        </tbody>
      </table>
      <p className="border-t border-hairline px-4 py-3 font-mono text-[10.5px] tracking-[0.04em] text-lo">
        APPEND-ONLY · EACH ENTRY HASHES THE PREVIOUS · TAMPER-EVIDENT
      </p>
    </div>
  );
}

/* ---------- the page ---------- */
export default function Scorecard({ candidate }: { candidate: Candidate }) {
  const [tab, setTab] = useState<Tab>("Competencies");
  return (
    <div className="flex gap-6 p-8">
      <div className="min-w-0 flex-1">
        {/* header */}
        <div className="mb-5 flex items-center gap-4">
          <h1 className="font-mono text-[20px] text-hi">{candidate.internalId}</h1>
          <TierBadge tier={candidate.tier} />
          <span className="tnum font-mono text-[13px] text-mid">RANK {String(candidate.rank).padStart(2, "0")}</span>
          <span className="tnum ml-auto font-display text-[24px] font-medium text-hi">{candidate.overall}</span>
        </div>

        {/* tab bar */}
        <div className="mb-6 flex gap-1 border-b border-hairline">
          {TABS.map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`relative px-4 pb-3 text-[13px] transition-colors ${tab === t ? "text-hi" : "text-lo hover:text-mid"}`}
            >
              {t}
              {tab === t && <span className="absolute inset-x-2 bottom-0 h-[2px] iris-line" />}
            </button>
          ))}
        </div>

        {tab === "Overview" && <Overview c={candidate} />}
        {tab === "Competencies" && (
          <div className="space-y-3">
            {candidate.competencies.map((comp) => <CompetencyBlock key={comp.id} comp={comp} onOpenTranscript={() => setTab("Interview")} />)}
          </div>
        )}
        {tab === "Interview" && <Interview c={candidate} />}
        {tab === "Documents" && <Documents c={candidate} />}
        {tab === "Audit" && <Audit c={candidate} />}
        {tab === "Notes" && (
          <div className="rounded-xl border border-hairline bg-surface p-8 text-center">
            <p className="text-[13px] text-mid">Notes are blind until you submit your own feedback.</p>
            <p className="hud-label mt-1.5">ASHBY BLIND-FEEDBACK RULE · REMOVES ANCHORING</p>
          </div>
        )}
      </div>

      <HitlInspector c={candidate} />
    </div>
  );
}
