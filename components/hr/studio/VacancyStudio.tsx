"use client";

import { useMemo, useState } from "react";
import {
  AlertTriangle, ArrowDown, ArrowUp, Check, ChevronRight, CircleHelp, Copy,
  Eye, GripVertical, Library, Lock, Plus, RotateCcw, ShieldCheck,
  Sparkles, Trash2, Users, WandSparkles, X,
} from "lucide-react";
import { useStudio } from "./StudioProvider";
import { BLOCK_GROUPS, BLOCK_LIBRARY, createBlock, estimateMinutes } from "@/lib/blocks";
import { BUILT_IN_PRESETS, instantiatePreset } from "@/lib/presets";
import {
  coverageMatrix, distributeEqually, effectiveWeights, fmtMinutes, impactSummary,
  preflight, rebalanceWeights,
} from "@/lib/studio";
import { listVacancies, publishDraft } from "@/lib/store";
import { draftQuestion } from "@/lib/ai";
import type {
  AttributeKind, BlockKind, CategorySpec, EmploymentType, IndustryPack, PipelineBlock,
  PositionProfile, Role, Seniority, VacancyV2, WorkMode,
} from "@/lib/types";

const STEPS = [
  ["Position Profile", "Role identity & logistics"],
  ["Criteria", "Weighted KSAO architecture"],
  ["Pipeline Composer", "Methods, mappings & gates"],
  ["Scoring & Ranking", "Visible composite math"],
  ["Candidate Experience", "Landing, notices & consent"],
  ["Team & Governance", "Human review controls"],
  ["Preflight / Publish", "Validate, preview, open"],
] as const;

const INPUT = "iris-focus w-full rounded-lg border border-hairline bg-surface px-3 py-2.5 text-[13px] text-hi";
const LABEL = "mb-1.5 block font-mono text-[10px] uppercase tracking-[.08em] text-lo";
const CARD = "rounded-xl border border-hairline bg-surface";
const BTN = "iris-focus rounded-lg border border-hairline px-3 py-2 text-[12px] text-mid hover:border-hairline-strong hover:text-hi";

function uid(prefix: string) {
  return `${prefix}-${Math.random().toString(36).slice(2, 9)}`;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <label className="block"><span className={LABEL}>{label}</span>{children}</label>;
}

function Toggle({ checked, onChange, label, help }: {
  checked: boolean; onChange: (v: boolean) => void; label: string; help?: string;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3">
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`mt-0.5 h-5 w-9 rounded-full border p-0.5 transition-colors ${checked ? "border-irisb bg-irisb/20" : "border-hairline-strong bg-void2"}`}
      >
        <span className={`block size-3.5 rounded-full transition-transform ${checked ? "translate-x-4 bg-irisb" : "bg-lo"}`} />
      </button>
      <span>
        <span className="block text-[13px] text-hi">{label}</span>
        {help && <span className="mt-0.5 block text-[11px] leading-relaxed text-lo">{help}</span>}
      </span>
    </label>
  );
}

function Why({ text }: { text?: string }) {
  if (!text) return null;
  return (
    <span className="group relative inline-flex">
      <CircleHelp className="size-3.5 text-lo" />
      <span className="pointer-events-none absolute right-0 top-5 z-30 hidden w-64 rounded-lg border border-hairline bg-void2 p-3 text-[11px] leading-relaxed text-mid group-hover:block">
        {text}
      </span>
    </span>
  );
}

function Entry() {
  const { replace, setEntered, setStep } = useStudio();
  const [mode, setMode] = useState<"choose" | "describe" | "preset" | "clone">("choose");
  const [title, setTitle] = useState("Product Manager — Marketplace");
  const [description, setDescription] = useState(
    "Ищем Product Manager для маркетплейса. Важны решения по данным, коммуникация со стейкхолдерами, эмпатия к клиенту и работа с конфликтующими приоритетами. Потенциал роста важнее формального стажа.",
  );
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const clones = typeof window === "undefined" ? [] : listVacancies();

  const enter = (draft: VacancyV2) => {
    replace(draft);
    setEntered(true);
    setStep(1);
  };

  const generate = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ai/vacancy-draft", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ title, description }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not generate the vacancy.");
      enter(body.draft as VacancyV2);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not generate the vacancy.");
    } finally {
      setBusy(false);
    }
  };

  if (mode === "describe") {
    return (
      <div className="mx-auto max-w-3xl px-8 py-14">
        <button className={BTN} onClick={() => setMode("choose")}>← Entry modes</button>
        <div className={`${CARD} mt-5 p-7`}>
          <div className="hud-label">Describe → transparent draft</div>
          <h1 className="mt-3 font-display text-[26px]">Describe the role in your own words.</h1>
          <p className="mt-2 max-w-2xl text-[13px] leading-relaxed text-mid">
            WhiteBox drafts the profile, weighted criteria and initial pipeline. Every recommendation stays editable and carries a “why”.
          </p>
          <div className="mt-6 space-y-4">
            <Field label="Position title"><input className={INPUT} value={title} onChange={(e) => setTitle(e.target.value)} /></Field>
            <Field label="Role description">
              <textarea className={`${INPUT} min-h-40 leading-relaxed`} value={description} onChange={(e) => setDescription(e.target.value)} />
            </Field>
          </div>
          {error && <p className="mt-3 text-[12px] text-neg">{error}</p>}
          <button
            onClick={generate}
            disabled={busy || description.trim().length < 20}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-paper px-4 py-2.5 text-[13px] font-medium text-void disabled:opacity-40"
          >
            <WandSparkles className="size-4" />{busy ? "Building the transparent chain…" : "Draft vacancy"}
          </button>
        </div>
      </div>
    );
  }

  if (mode === "preset") {
    return (
      <div className="mx-auto max-w-5xl px-8 py-12">
        <button className={BTN} onClick={() => setMode("choose")}>← Entry modes</button>
        <h1 className="mt-5 font-display text-[27px]">Start from a validated role-family preset.</h1>
        <div className="mt-6 grid grid-cols-3 gap-4">
          {BUILT_IN_PRESETS.map((preset) => (
            <button key={preset.id} onClick={() => enter(instantiatePreset(preset))} className={`${CARD} brackets p-5 text-left`}>
              <div className="flex items-center justify-between"><Library className="size-4 text-irisb" /><span className="font-mono text-[9px] text-lo">v{preset.version}</span></div>
              <div className="mt-4 text-[15px] font-medium text-hi">{preset.name}</div>
              <p className="mt-2 line-clamp-6 text-[11px] leading-relaxed text-mid">{preset.description}</p>
              <span className="mt-4 inline-flex items-center gap-1 text-[11px] text-irisc">Use preset <ChevronRight className="size-3" /></span>
            </button>
          ))}
        </div>
      </div>
    );
  }

  if (mode === "clone") {
    return (
      <div className="mx-auto max-w-4xl px-8 py-12">
        <button className={BTN} onClick={() => setMode("choose")}>← Entry modes</button>
        <h1 className="mt-5 font-display text-[27px]">Clone an existing vacancy.</h1>
        <div className="mt-6 space-y-3">
          {clones.length === 0 && <div className={`${CARD} p-6 text-[13px] text-mid`}>No locally published vacancies yet. Start from a built-in preset instead.</div>}
          {clones.map((v) => (
            <button
              key={v.id}
              onClick={() => enter({ ...structuredClone(v), id: uid("vac"), code: "", status: "DRAFT", configVersion: 1, audit: [], createdAt: "", publishedAt: undefined })}
              className={`${CARD} flex w-full items-center justify-between p-5 text-left`}
            >
              <span><span className="block text-[14px] text-hi">{v.profile.title}</span><span className="mt-1 block font-mono text-[10px] text-lo">{v.code} · CONFIG V{v.configVersion}</span></span>
              <ChevronRight className="size-4 text-lo" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  const choices = [
    { title: "Describe", text: "Plain language → profile, criteria and pipeline, each choice explained.", icon: Sparkles, action: () => setMode("describe") },
    { title: "Manual", text: "A clean scaffold with the compliance and governance defaults already in place.", icon: GripVertical, action: () => setEntered(true) },
    { title: "From preset", text: "Role-family blueprints with the method rationale embedded in every block.", icon: Library, action: () => setMode("preset") },
    { title: "Clone vacancy", text: "Deep-copy a local vacancy without candidates, dates or competition code.", icon: Copy, action: () => setMode("clone") },
  ];

  return (
    <div className="grid min-h-[calc(100vh-52px)] place-items-center px-8 py-12">
      <div className="w-full max-w-5xl">
        <div className="hud-label">Vacancy Studio · one transparent chain</div>
        <h1 className="mt-3 max-w-3xl font-display text-[34px] leading-tight tracking-[-.025em]">
          Build the selection method, not just a vacancy form.
        </h1>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-mid">
          Role → criteria → methods → rubrics → evidence → mechanical composite → named human decision.
        </p>
        <div className="mt-8 grid grid-cols-4 gap-4">
          {choices.map(({ title: choiceTitle, text, icon: Icon, action }) => (
            <button key={choiceTitle} onClick={action} className={`${CARD} brackets min-h-48 p-5 text-left`}>
              <Icon className="size-5 text-irisb" />
              <div className="mt-8 text-[16px] font-medium text-hi">{choiceTitle}</div>
              <p className="mt-2 text-[12px] leading-relaxed text-mid">{text}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProfileStep() {
  const { draft, update } = useStudio();
  const p = draft.profile;
  const patch = (next: Partial<PositionProfile>) => update((d) => ({ ...d, profile: { ...d.profile, ...next } }));
  return (
    <section>
      <StepHeading eyebrow="01 · Position Profile" title="Define the concrete workplace." text="This context seeds criteria, question banks, candidate copy and evaluation prompts." />
      <div className="grid grid-cols-2 gap-4">
        <div className={`${CARD} col-span-2 grid grid-cols-2 gap-4 p-5`}>
          <Field label="Role title"><input className={INPUT} value={p.title} onChange={(e) => patch({ title: e.target.value })} /></Field>
          <Field label="Internal requisition ID"><input className={INPUT} value={p.requisitionId ?? ""} onChange={(e) => patch({ requisitionId: e.target.value })} placeholder="REQ-2026-041" /></Field>
          <Field label="Department / team"><input className={INPUT} value={p.department ?? ""} onChange={(e) => patch({ department: e.target.value })} /></Field>
          <Field label="Hiring manager"><input className={INPUT} value={p.hiringManager ?? ""} onChange={(e) => patch({ hiringManager: e.target.value })} /></Field>
        </div>
        <div className={`${CARD} grid grid-cols-2 gap-4 p-5`}>
          <Field label="Seniority">
            <select className={INPUT} value={p.seniority} onChange={(e) => patch({ seniority: e.target.value as Seniority })}>
              {["Intern", "Junior", "Middle", "Senior", "Lead", "Head", "Executive"].map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>
          <Field label="Openings"><input className={INPUT} type="number" min={1} value={p.openings} onChange={(e) => patch({ openings: Number(e.target.value) })} /></Field>
          <Field label="Employment">
            <select className={INPUT} value={p.employmentType} onChange={(e) => patch({ employmentType: e.target.value as EmploymentType })}>
              {["full_time", "part_time", "contract", "internship", "seasonal", "shift"].map((x) => <option key={x} value={x}>{x.replaceAll("_", " ")}</option>)}
            </select>
          </Field>
          <Field label="Work mode">
            <select className={INPUT} value={p.workMode} onChange={(e) => patch({ workMode: e.target.value as WorkMode })}>
              {["on_site", "hybrid", "remote_country", "remote_global"].map((x) => <option key={x} value={x}>{x.replaceAll("_", " ")}</option>)}
            </select>
          </Field>
          <Field label="Location(s)"><input className={INPUT} value={p.locations.join(", ")} onChange={(e) => patch({ locations: e.target.value.split(",").map((x) => x.trim()).filter(Boolean) })} /></Field>
          <Field label="Time-zone overlap"><input className={INPUT} value={p.timezoneOverlap ?? ""} onChange={(e) => patch({ timezoneOverlap: e.target.value })} placeholder="UTC+3 to UTC+7" /></Field>
        </div>
        <div className={`${CARD} grid grid-cols-2 gap-4 p-5`}>
          <Field label="Industry pack">
            <select className={INPUT} value={p.industryPack} onChange={(e) => patch({ industryPack: e.target.value as IndustryPack })}>
              {["tech", "sales_cs", "healthcare", "finance", "retail_hourly", "manufacturing", "logistics", "creative", "public_sector", "education", "custom"].map((x) => <option key={x}>{x}</option>)}
            </select>
          </Field>
          <Field label="Primary language"><input className={INPUT} value={p.languages.primary} onChange={(e) => patch({ languages: { ...p.languages, primary: e.target.value } })} /></Field>
          <Field label="Application opens"><input className={INPUT} type="datetime-local" value={draft.window.opensAt.slice(0, 16)} onChange={(e) => update((d) => ({ ...d, window: { ...d.window, opensAt: e.target.value } }))} /></Field>
          <Field label="Application closes"><input className={INPUT} type="datetime-local" value={draft.window.closesAt.slice(0, 16)} onChange={(e) => update((d) => ({ ...d, window: { ...d.window, closesAt: e.target.value } }))} /></Field>
        </div>
        <div className={`${CARD} col-span-2 p-5`}>
          <Field label="Mission of the role"><textarea className={`${INPUT} min-h-24`} value={p.mission} onChange={(e) => patch({ mission: e.target.value })} /></Field>
          <div className="mt-4 grid grid-cols-2 gap-4">
            <Field label="Responsibilities · one per line"><textarea className={`${INPUT} min-h-28`} value={p.responsibilities.join("\n")} onChange={(e) => patch({ responsibilities: e.target.value.split("\n").filter(Boolean) })} /></Field>
            <Field label="Team context"><textarea className={`${INPUT} min-h-28`} value={p.teamContext ?? ""} onChange={(e) => patch({ teamContext: e.target.value })} /></Field>
          </div>
        </div>
      </div>
    </section>
  );
}

function CriteriaStep() {
  const { draft, update } = useStudio();
  const [busy, setBusy] = useState(false);
  const [locked, setLocked] = useState<Set<string>>(new Set());
  const coverage = coverageMatrix(draft);
  const suggest = async () => {
    setBusy(true);
    const res = await fetch("/api/ai/suggest-criteria", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ profile: draft.profile }) });
    const body = await res.json();
    if (res.ok) update((d) => ({ ...d, categories: body.categories as CategorySpec[] }));
    setBusy(false);
  };
  const setCategoryWeight = (id: string, weight: number) => update((d) => ({ ...d, categories: rebalanceWeights(d.categories, id, weight, locked) }));
  const setAttrWeight = (catId: string, attrId: string, weight: number) => update((d) => ({
    ...d,
    categories: d.categories.map((c) => c.id === catId ? { ...c, attributes: rebalanceWeights(c.attributes, attrId, weight, locked) } : c),
  }));
  const focusCount = draft.categories.flatMap((c) => c.attributes).filter((a) => a.focus).length;
  return (
    <section>
      <StepHeading eyebrow="02 · Criteria Architecture" title="Define what “good” means." text="Weights sum to 100 at both levels. Knockouts stay separate from scored criteria." action={
        <button className={`${BTN} inline-flex items-center gap-2`} onClick={suggest} disabled={busy || !draft.profile.title}><Sparkles className="size-3.5" />{busy ? "Drafting…" : "Suggest attributes"}</button>
      } />
      {draft.categories.length === 0 && <div className={`${CARD} p-10 text-center text-[13px] text-mid`}>Start with “Suggest attributes” or add a category manually.</div>}
      <div className="space-y-4">
        {draft.categories.map((cat) => (
          <div key={cat.id} className={`${CARD} overflow-hidden`}>
            <div className="flex items-center gap-3 border-b border-hairline bg-surface2 px-4 py-3">
              <input className="min-w-0 flex-1 bg-transparent text-[14px] font-medium text-hi outline-none" value={cat.name} onChange={(e) => update((d) => ({ ...d, categories: d.categories.map((c) => c.id === cat.id ? { ...c, name: e.target.value } : c) }))} />
              <Why text={cat.rationale} />
              <input type="range" min={0} max={100} className="w-28 accent-[var(--iris-b)]" value={cat.weight} onChange={(e) => setCategoryWeight(cat.id, Number(e.target.value))} />
              <input className="w-14 rounded border border-hairline bg-void2 px-2 py-1 text-right font-mono text-[11px]" type="number" value={cat.weight} onChange={(e) => setCategoryWeight(cat.id, Number(e.target.value))} />
              <button onClick={() => setLocked((s) => { const n = new Set(s); n.has(cat.id) ? n.delete(cat.id) : n.add(cat.id); return n; })}><Lock className={`size-3.5 ${locked.has(cat.id) ? "text-irisb" : "text-lo"}`} /></button>
              <button onClick={() => update((d) => ({ ...d, categories: distributeEqually(d.categories) }))} className="font-mono text-[9px] text-lo">EQUAL</button>
            </div>
            <div className="divide-y divide-hairline">
              {cat.attributes.map((attr) => {
                const cell = coverage.find((x) => x.attributeId === attr.id);
                return (
                  <div key={attr.id} className="grid grid-cols-[1fr_108px_120px_56px_72px_28px] items-center gap-3 px-4 py-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <input className="min-w-0 flex-1 bg-transparent text-[13px] text-hi outline-none" value={attr.name} onChange={(e) => update((d) => ({ ...d, categories: d.categories.map((c) => c.id === cat.id ? { ...c, attributes: c.attributes.map((a) => a.id === attr.id ? { ...a, name: e.target.value } : a) } : c) }))} />
                        <Why text={attr.rationale} />
                      </div>
                      <input className="mt-1 w-full bg-transparent text-[11px] text-lo outline-none" value={attr.definition} onChange={(e) => update((d) => ({ ...d, categories: d.categories.map((c) => c.id === cat.id ? { ...c, attributes: c.attributes.map((a) => a.id === attr.id ? { ...a, definition: e.target.value } : a) } : c) }))} />
                    </div>
                    <select className={`${INPUT} py-1.5`} value={attr.kind} onChange={(e) => update((d) => ({ ...d, categories: d.categories.map((c) => c.id === cat.id ? { ...c, attributes: c.attributes.map((a) => a.id === attr.id ? { ...a, kind: e.target.value as AttributeKind } : a) } : c) }))}>
                      {["skill", "trait", "knowledge", "qualification", "experience", "language"].map((x) => <option key={x}>{x}</option>)}
                    </select>
                    <input type="range" className="accent-[var(--iris-b)]" min={0} max={100} value={attr.weight} onChange={(e) => setAttrWeight(cat.id, attr.id, Number(e.target.value))} />
                    <input className="rounded border border-hairline bg-void2 px-2 py-1 text-right font-mono text-[11px]" type="number" value={attr.weight} onChange={(e) => setAttrWeight(cat.id, attr.id, Number(e.target.value))} />
                    <button
                      disabled={!attr.focus && focusCount >= 5}
                      onClick={() => update((d) => ({ ...d, categories: d.categories.map((c) => c.id === cat.id ? { ...c, attributes: c.attributes.map((a) => a.id === attr.id ? { ...a, focus: !a.focus || undefined } : a) } : c) }))}
                      className={`rounded-full border px-2 py-1 font-mono text-[9px] ${attr.focus ? "border-irisb/50 text-irisc" : "border-hairline text-lo"}`}
                    >FOCUS</button>
                    <span title={cell?.ok ? "Coverage complete" : "Needs pipeline coverage"} className={`size-2 rounded-full ${cell?.ok ? "bg-pos" : "bg-warn"}`} />
                  </div>
                );
              })}
            </div>
            <button onClick={() => update((d) => ({ ...d, categories: d.categories.map((c) => c.id === cat.id ? { ...c, attributes: distributeEqually([...c.attributes, { id: uid("attr"), name: "New attribute", kind: "skill", definition: "Describe observable behavior.", weight: 0, scale: { anchors: ["No evidence", "Limited evidence", "Adequate evidence", "Strong evidence", "Exceptional evidence"] }, verification: "interview" }]) } : c) }))} className="m-3 inline-flex items-center gap-1 text-[11px] text-lo hover:text-hi"><Plus className="size-3" /> Add attribute</button>
          </div>
        ))}
      </div>
      <button onClick={() => update((d) => ({ ...d, categories: distributeEqually([...d.categories, { id: uid("cat"), name: "New category", weight: 0, attributes: [] }]) }))} className={`${BTN} mt-4 inline-flex items-center gap-2`}><Plus className="size-3.5" /> Add category</button>
    </section>
  );
}

function PipelineStep() {
  const { draft, update } = useStudio();
  const [library, setLibrary] = useState(false);
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const attrs = draft.categories.flatMap((c) => c.attributes);
  const add = (kind: BlockKind) => {
    const block = createBlock(kind, draft.pipeline.length);
    if (block.scored && attrs.length) {
      block.measures = distributeEqually(attrs.map((a) => ({ id: a.id, attributeId: a.id, weight: 0 }))).map((x) => ({ attributeId: x.attributeId, share: x.weight }));
    }
    if (["async_interview", "live_ai_interview", "chat_interview"].includes(kind) && "questions" in block.settings) {
      block.settings.questions = attrs.slice(0, 5).map((a) => draftQuestion(a, draft.profile.seniority === "Junior" ? "situational" : "behavioral", draft.profile.seniority));
      block.estimatedMinutes = estimateMinutes(block);
    }
    update((d) => ({ ...d, pipeline: [...d.pipeline, block] }));
    setExpandedBlock(block.id);
    setLibrary(false);
  };
  const mutateBlock = (id: string, patch: Partial<PipelineBlock>) => update((d) => ({ ...d, pipeline: d.pipeline.map((b) => b.id === id ? { ...b, ...patch } : b) }));
  const move = (index: number, delta: number) => update((d) => {
    const next = [...d.pipeline];
    const target = index + delta;
    if (target < 0 || target >= next.length) return d;
    [next[index], next[target]] = [next[target], next[index]];
    return { ...d, pipeline: next.map((b, i) => ({ ...b, order: i })) };
  });
  return (
    <section>
      <StepHeading eyebrow="03 · Pipeline Composer" title="Compose named selection methods." text="Each block declares its evidence basis, time cost and adverse-impact profile." action={<button onClick={() => setLibrary(true)} className="inline-flex items-center gap-2 rounded-lg bg-paper px-3 py-2 text-[12px] text-void"><Plus className="size-3.5" /> Add block</button>} />
      <div className="space-y-3">
        {draft.pipeline.length === 0 && <button onClick={() => setLibrary(true)} className={`${CARD} w-full border-dashed p-12 text-center text-[13px] text-mid`}>Open the 19-method Block Library</button>}
        {draft.pipeline.map((block, index) => {
          const meta = BLOCK_LIBRARY[block.kind];
          const expanded = expandedBlock === block.id;
          return (
            <div key={block.id}>
              <div className={`${CARD} overflow-hidden`}>
                <div className={`grid grid-cols-[32px_1fr_auto] items-center gap-3 p-4 ${expanded ? "border-b border-hairline" : ""}`}>
                  <GripVertical className="size-4 text-lo" />
                  <div>
                    {expanded ? (
                      <input aria-label={`Block title ${index + 1}`} className="w-full bg-transparent text-[14px] font-medium text-hi outline-none" value={block.title} onChange={(e) => mutateBlock(block.id, { title: e.target.value })} />
                    ) : (
                      <div className="text-[14px] font-medium text-hi">{block.title}</div>
                    )}
                    <div className="mt-1 flex items-center gap-2 text-[10px] text-lo">
                      <span>{fmtMinutes(estimateMinutes(block))}</span><span>·</span>
                      <span>{block.required ? "Required" : "Optional"}</span><span>·</span>
                      <span>{block.scored ? "Scored" : "Not scored"}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button aria-label={expanded ? `Done editing ${block.title}` : `Edit ${block.title}`} className={`${BTN} min-w-14 text-[10px]`} onClick={() => setExpandedBlock(expanded ? null : block.id)}>{expanded ? "Done" : "Edit"}</button>
                    <button className={BTN} onClick={() => move(index, -1)} aria-label={`Move ${block.title} up`}><ArrowUp className="size-3.5" /></button>
                    <button className={BTN} onClick={() => move(index, 1)} aria-label={`Move ${block.title} down`}><ArrowDown className="size-3.5" /></button>
                    <button className={BTN} onClick={() => { setExpandedBlock((current) => current === block.id ? null : current); update((d) => ({ ...d, pipeline: d.pipeline.filter((b) => b.id !== block.id).map((b, i) => ({ ...b, order: i })) })); }} aria-label={`Delete ${block.title}`}><Trash2 className="size-3.5" /></button>
                  </div>
                </div>
                {expanded && <div className="grid grid-cols-[1.25fr_.75fr] gap-5 p-4">
                  <div>
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      <span className="rounded-full border border-hairline px-2 py-0.5 font-mono text-[9px] text-lo">{meta.evidenceLevel}</span>
                      {meta.validity && <span className="font-mono text-[9px] text-pos">ρ ≈ {meta.validity.toFixed(2)}</span>}
                      {meta.subgroupD && <span className="font-mono text-[9px] text-warn">{meta.subgroupD}</span>}
                    </div>
                    <Field label="Candidate instructions">
                      <textarea className={`${INPUT} min-h-24 leading-relaxed`} value={block.candidateIntro} onChange={(e) => mutateBlock(block.id, { candidateIntro: e.target.value })} />
                    </Field>
                    {block.scored && (
                      <div className="mt-4">
                        <span className={LABEL}>Attribute mapping · click to include</span>
                        <div className="flex flex-wrap gap-1.5">
                          {attrs.map((attr) => {
                            const active = block.measures.some((m) => m.attributeId === attr.id);
                            return (
                              <button
                                key={attr.id}
                                onClick={() => {
                                  const ids = active ? block.measures.filter((m) => m.attributeId !== attr.id).map((m) => m.attributeId) : [...block.measures.map((m) => m.attributeId), attr.id];
                                  const measures = distributeEqually(ids.map((id) => ({ id, weight: 0 }))).map((x) => ({ attributeId: x.id, share: x.weight }));
                                  mutateBlock(block.id, { measures });
                                }}
                                className={`rounded-full border px-2.5 py-1 text-[10px] ${active ? "border-irisb/50 bg-irisb/10 text-irisc" : "border-hairline text-lo"}`}
                              >{attr.focus ? "◉ " : ""}{attr.name}</button>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </div>
                  <div className="grid grid-cols-2 content-start gap-3">
                    <Toggle checked={block.required} onChange={(required) => mutateBlock(block.id, { required })} label="Required" />
                    <Toggle checked={block.scored} onChange={(scored) => mutateBlock(block.id, { scored })} label="Scored" />
                    <Field label="Integrity tier">
                      <select className={`${INPUT} py-2`} value={block.integrityTier} onChange={(e) => mutateBlock(block.id, { integrityTier: Number(e.target.value) as 0 | 1 | 2 | 3 })}>
                        <option value={0}>0 · none</option><option value={1}>1 · signals</option><option value={2}>2 · camera + liveness</option><option value={3}>3 · ID check</option>
                      </select>
                    </Field>
                    <Field label="Retakes"><select className={`${INPUT} py-2`} value={block.retakePolicy} onChange={(e) => mutateBlock(block.id, { retakePolicy: Number(e.target.value) as 0 | 1 | 2 })}><option value={0}>0</option><option value={1}>1</option><option value={2}>2</option></select></Field>
                    <Field label="Gate · min score"><input className={`${INPUT} py-2`} type="number" placeholder="none" value={block.gate?.minBlockScore ?? ""} onChange={(e) => mutateBlock(block.id, { gate: e.target.value ? { ...block.gate, minBlockScore: Number(e.target.value) } : undefined })} /></Field>
                    <div><span className={LABEL}>Candidate time</span><div className="rounded-lg border border-hairline bg-void2 px-3 py-2 text-[12px] text-mid">{fmtMinutes(estimateMinutes(block))}</div></div>
                  </div>
                </div>}
              </div>
              {index < draft.pipeline.length - 1 && <div className="ml-8 h-3 border-l border-dashed border-hairline-strong" />}
            </div>
          );
        })}
      </div>
      {library && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/65" onMouseDown={(e) => { if (e.target === e.currentTarget) setLibrary(false); }}>
          <div className="h-full w-[560px] overflow-y-auto border-l border-hairline bg-void p-6">
            <div className="flex items-start justify-between"><div><div className="hud-label">Block Library · 19 methods</div><h2 className="mt-2 font-display text-[24px]">What evidence should this role collect?</h2></div><button aria-label="Close block library" onClick={() => setLibrary(false)} className={BTN}><X className="size-4" /></button></div>
            {BLOCK_GROUPS.map((group) => (
              <div key={group.id} className="mt-7">
                <div className="hud-label">{group.label}</div>
                <div className="mt-2 grid grid-cols-2 gap-2">
                  {group.kinds.map((kind) => {
                    const meta = BLOCK_LIBRARY[kind];
                    return (
                      <button key={kind} onClick={() => add(kind)} className={`${CARD} brackets p-4 text-left`}>
                        <div className="flex items-center justify-between"><span className="text-[12px] font-medium text-hi">{meta.label}</span><Plus className="size-3.5 text-irisb" /></div>
                        <p className="mt-2 text-[10px] leading-relaxed text-mid">{meta.description}</p>
                        <div className="mt-3 flex gap-2 font-mono text-[9px] text-lo"><span>{meta.defaultMinutes} min</span><span>{meta.evidenceLevel}</span>{meta.validity && <span className="text-pos">ρ {meta.validity}</span>}</div>
                      </button>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

function ScoringStep() {
  const { draft, update } = useStudio();
  const ew = effectiveWeights(draft);
  return (
    <section>
      <StepHeading eyebrow="04 · Scoring & Ranking" title="Keep the math visible." text="The model explains evidence; arithmetic—not a model—rolls scores into the composite." />
      <div className="grid grid-cols-2 gap-4">
        <div className={`${CARD} space-y-5 p-5`}>
          <Field label="Combination topology">
            <select className={INPUT} value={draft.scoring.topology} onChange={(e) => update((d) => ({ ...d, scoring: { ...d.scoring, topology: e.target.value as VacancyV2["scoring"]["topology"] } }))}>
              <option value="hybrid">Hybrid · knockouts + composite</option><option value="compensatory">Compensatory</option><option value="multiple_hurdle">Multiple hurdle</option>
            </select>
          </Field>
          <Field label="Weighting mode">
            <select className={INPUT} value={draft.scoring.weighting} onChange={(e) => update((d) => ({ ...d, scoring: { ...d.scoring, weighting: e.target.value as VacancyV2["scoring"]["weighting"] } }))}>
              <option value="rational">Rational · configured</option><option value="unit">Unit · equal within level</option><option value="pareto_assist">Pareto assist · validity / diversity</option>
            </select>
          </Field>
          <Field label={`Pass threshold · ${draft.scoring.threshold}/100`}><input className="w-full accent-[var(--iris-b)]" type="range" min={0} max={100} value={draft.scoring.threshold} onChange={(e) => update((d) => ({ ...d, scoring: { ...d.scoring, threshold: Number(e.target.value) } }))} /></Field>
          <Toggle checked={draft.scoring.banding?.enabled ?? false} onChange={(enabled) => update((d) => ({ ...d, scoring: { ...d.scoring, banding: { enabled, sedWidth: d.scoring.banding?.sedWidth ?? 4 } } }))} label="SED-based score bands" help="Candidates inside one band are treated as statistically indistinguishable." />
          <Toggle checked={draft.scoring.anonymization.maskPII} onChange={(maskPII) => update((d) => ({ ...d, scoring: { ...d.scoring, anonymization: { ...d.scoring.anonymization, maskPII } } }))} label="Blind review by default" help="Identity stays separate from scoring and is revealed only at the configured decision gate." />
        </div>
        <div className={`${CARD} p-5`}>
          <div className="hud-label">Effective weight · actual contribution</div>
          <div className="mt-4 space-y-3">
            {ew.blocks.length === 0 && <p className="text-[12px] text-mid">Add scored, mapped blocks to calculate effective weights.</p>}
            {ew.blocks.map((b) => (
              <div key={b.blockId}>
                <div className="flex justify-between text-[11px]"><span className="text-mid">{b.title}</span><span className="font-mono text-hi">{b.pct}%</span></div>
                <div className="mt-1 h-1 overflow-hidden rounded bg-surface2"><div className="h-full bg-irisb" style={{ width: `${Math.min(100, b.pct)}%` }} /></div>
              </div>
            ))}
          </div>
          <div className="mt-6 border-t border-hairline pt-4">
            <div className="hud-label">Attribute weights</div>
            <div className="mt-3 grid grid-cols-2 gap-x-4 gap-y-2">
              {ew.attributes.map((a) => <div key={a.attributeId} className="flex justify-between text-[10px]"><span className="truncate text-lo">{a.name}</span><span className="font-mono text-mid">{a.pct}%</span></div>)}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExperienceStep() {
  const { draft, update } = useStudio();
  const e = draft.experience;
  return (
    <section>
      <StepHeading eyebrow="05 · Candidate Experience" title="Explain the process before it begins." text="Job-relatedness, notice, consent, accommodation and a disposition promise are product surfaces." />
      <div className="grid grid-cols-2 gap-4">
        <div className={`${CARD} space-y-4 p-5`}>
          <div className="hud-label">Landing & brand</div>
          <Field label="Company blurb"><textarea className={`${INPUT} min-h-24`} value={e.landing.companyBlurb} onChange={(ev) => update((d) => ({ ...d, experience: { ...d.experience, landing: { ...d.experience.landing, companyBlurb: ev.target.value } } }))} /></Field>
          <Field label="Published bias-audit URL"><input className={INPUT} value={e.landing.biasAuditUrl ?? ""} onChange={(ev) => update((d) => ({ ...d, experience: { ...d.experience, landing: { ...d.experience.landing, biasAuditUrl: ev.target.value } } }))} placeholder="https://…" /></Field>
          <Toggle checked={e.landing.showCompensation} onChange={(showCompensation) => update((d) => ({ ...d, experience: { ...d.experience, landing: { ...d.experience.landing, showCompensation } } }))} label="Show compensation on landing" />
          <Field label="Candidate-facing tone"><select className={INPUT} value={e.tone} onChange={(ev) => update((d) => ({ ...d, experience: { ...d.experience, tone: ev.target.value as VacancyV2["experience"]["tone"] } }))}><option>formal</option><option>neutral</option><option>warm</option></select></Field>
        </div>
        <div className={`${CARD} space-y-4 p-5`}>
          <div className="hud-label">Notice & consent · v{e.notices.version}</div>
          <Field label="Jurisdiction profile"><select className={INPUT} value={e.notices.jurisdictionProfile} onChange={(ev) => update((d) => ({ ...d, experience: { ...d.experience, notices: { ...d.experience.notices, jurisdictionProfile: ev.target.value } } }))}><option>EU</option><option>US-NYC</option><option>US-IL</option><option>US-CA</option><option>KZ</option><option>Custom</option></select></Field>
          <Field label="Plain-language AI disclosure"><textarea className={`${INPUT} min-h-32 leading-relaxed`} value={e.notices.aiDisclosure} onChange={(ev) => update((d) => ({ ...d, experience: { ...d.experience, notices: { ...d.experience.notices, aiDisclosure: ev.target.value } } }))} /></Field>
          <div className="grid grid-cols-2 gap-4">
            <Field label="Retention · days"><input className={INPUT} type="number" value={e.notices.retentionDays} onChange={(ev) => update((d) => ({ ...d, experience: { ...d.experience, notices: { ...d.experience.notices, retentionDays: Number(ev.target.value) } } }))} /></Field>
            <Field label="Disposition SLA · days"><input className={INPUT} type="number" value={e.comms.dispositionSlaDays} onChange={(ev) => update((d) => ({ ...d, experience: { ...d.experience, comms: { ...d.experience.comms, dispositionSlaDays: Number(ev.target.value) } } }))} /></Field>
          </div>
          <Toggle checked={e.comms.feedbackOffer} onChange={(feedbackOffer) => update((d) => ({ ...d, experience: { ...d.experience, comms: { ...d.experience.comms, feedbackOffer } } }))} label="Offer on-request structured feedback" />
        </div>
      </div>
    </section>
  );
}

function GovernanceStep() {
  const { draft, update } = useStudio();
  const g = draft.governance;
  return (
    <section>
      <StepHeading eyebrow="06 · Team & Governance" title="Name the humans in the loop." text="Independent-first review, calibration and dual control turn oversight into behavior—not a policy claim." />
      <div className="grid grid-cols-[1.2fr_.8fr] gap-4">
        <div className={`${CARD} p-5`}>
          <div className="flex items-center justify-between"><div className="hud-label">Vacancy roster</div><button aria-label="Add reviewer" className={BTN} onClick={() => update((d) => ({ ...d, governance: { ...d.governance, roles: [...d.governance.roles, { userId: uid("u"), name: "new.reviewer", role: "TechnicalReviewer", piiReveal: false }] } }))}><Plus className="size-3.5" /></button></div>
          <div className="mt-3 divide-y divide-hairline">
            {g.roles.map((person) => (
              <div key={person.userId} className="grid grid-cols-[1fr_150px_90px_28px] items-center gap-3 py-3">
                <input aria-label={`Reviewer name ${person.name}`} className="bg-transparent text-[13px] text-hi outline-none" value={person.name} onChange={(e) => update((d) => ({ ...d, governance: { ...d.governance, roles: d.governance.roles.map((r) => r.userId === person.userId ? { ...r, name: e.target.value } : r) } }))} />
                <select aria-label={`Reviewer role ${person.name}`} className={`${INPUT} py-1.5`} value={person.role} onChange={(e) => update((d) => ({ ...d, governance: { ...d.governance, roles: d.governance.roles.map((r) => r.userId === person.userId ? { ...r, role: e.target.value as Role } : r) } }))}><option>Owner</option><option>HiringManager</option><option>TechnicalReviewer</option><option>Observer</option></select>
                <button onClick={() => update((d) => ({ ...d, governance: { ...d.governance, roles: d.governance.roles.map((r) => r.userId === person.userId ? { ...r, piiReveal: !r.piiReveal } : r) } }))} className={`rounded-full border px-2 py-1 font-mono text-[9px] ${person.piiReveal ? "border-irisb/50 text-irisc" : "border-hairline text-lo"}`}>PII REVEAL</button>
                <button aria-label={`Remove reviewer ${person.name}`} onClick={() => update((d) => ({ ...d, governance: { ...d.governance, roles: d.governance.roles.filter((r) => r.userId !== person.userId) } }))}><Trash2 className="size-3.5 text-lo" /></button>
              </div>
            ))}
          </div>
        </div>
        <div className={`${CARD} space-y-5 p-5`}>
          <Field label="Independent reviews required"><select className={INPUT} value={g.reviewPolicy.independentReviews} onChange={(e) => update((d) => ({ ...d, governance: { ...d.governance, reviewPolicy: { ...d.governance.reviewPolicy, independentReviews: Number(e.target.value) as 1 | 2 | 3 } } }))}><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option></select></Field>
          <Field label="Reviewer assignment"><select className={INPUT} value={g.reviewPolicy.assignment} onChange={(e) => update((d) => ({ ...d, governance: { ...d.governance, reviewPolicy: { ...d.governance.reviewPolicy, assignment: e.target.value as "round_robin" | "by_expertise" } } }))}><option value="round_robin">Round robin</option><option value="by_expertise">By attribute expertise</option></select></Field>
          <Field label="Dual-control batch threshold"><input className={INPUT} type="number" value={g.dualControlThreshold} onChange={(e) => update((d) => ({ ...d, governance: { ...d.governance, dualControlThreshold: Number(e.target.value) } }))} /></Field>
          <Toggle checked={g.calibrationRequired} onChange={(calibrationRequired) => update((d) => ({ ...d, governance: { ...d.governance, calibrationRequired } }))} label="Require frame-of-reference calibration" help="Reviewers rate anchored practice cases before their first live review." />
        </div>
      </div>
    </section>
  );
}

function CandidatePreview({ onClose }: { onClose: () => void }) {
  const { draft } = useStudio();
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/75 p-8" onMouseDown={(e) => { if (e.currentTarget === e.target) onClose(); }}>
      <div className="wb relative w-full max-w-3xl overflow-hidden rounded-2xl border border-black/10 p-8">
        <button aria-label="Close candidate preview" onClick={onClose} className="absolute right-5 top-5"><X className="size-4" /></button>
        <div className="font-mono text-[10px] uppercase tracking-[.1em] text-black/45">Candidate preview · sandbox</div>
        <h2 className="mt-5 max-w-xl font-display text-[34px] leading-tight">{draft.profile.title || "Untitled position"}</h2>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-black/65">{draft.profile.mission || "The role mission will appear here."}</p>
        <div className="mt-7 grid grid-cols-3 gap-3">
          {draft.pipeline.filter((b) => b.required).map((b, i) => <div key={b.id} className="rounded-xl border border-black/10 bg-white p-4"><div className="font-mono text-[9px] text-black/40">STEP {String(i + 1).padStart(2, "0")}</div><div className="mt-2 text-[12px] font-medium">{b.title}</div><div className="mt-1 text-[10px] text-black/50">{fmtMinutes(estimateMinutes(b))}</div></div>)}
        </div>
        <div className="mt-6 rounded-xl bg-black p-5 text-white"><div className="font-mono text-[9px] text-white/45">WHAT AI DOES — AND NEVER DOES</div><p className="mt-2 text-[12px] leading-relaxed text-white/75">{draft.experience.notices.aiDisclosure}</p></div>
        <div className="mt-6 flex items-center justify-between"><span className="text-[11px] text-black/50">Accommodation or alternative-process request available at every step.</span><button onClick={onClose} className="rounded-lg bg-black px-4 py-2.5 text-[12px] text-white">Continue</button></div>
      </div>
    </div>
  );
}

function PreflightStep() {
  const { draft, replace, resetBlank } = useStudio();
  const issues = preflight(draft);
  const blockers = issues.filter((i) => i.severity === "blocker");
  const [preview, setPreview] = useState(false);
  const [previewed, setPreviewed] = useState(false);
  const [published, setPublished] = useState<VacancyV2 | null>(null);
  const [copied, setCopied] = useState(false);
  const publish = () => {
    if (blockers.length || !previewed) return;
    const value = publishDraft(draft);
    replace(value);
    setPublished(value);
  };
  return (
    <section>
      <StepHeading eyebrow="07 · Preflight / Publish" title={published ? "Competition is live." : "Prove the chain is complete."} text="Blockers protect traceability, candidate rights and meaningful human review. Warnings require judgment." action={<button className={`${BTN} inline-flex items-center gap-2`} onClick={() => { setPreview(true); setPreviewed(true); }}><Eye className="size-3.5" /> Preview as candidate</button>} />
      {published ? (
        <div className={`${CARD} p-8 text-center`}>
          <div className="mx-auto grid size-12 place-items-center rounded-full border border-pos/40 bg-pos/10"><Check className="size-5 text-pos" /></div>
          <div className="mt-5 font-mono text-[10px] text-lo">LIVE · CONFIG V{published.configVersion} · HASH-CHAINED AUDIT</div>
          <h2 className="mt-2 font-display text-[28px]">{published.profile.title}</h2>
          <button
            aria-label={`Copy competition code ${published.code}`}
            onClick={async () => {
              await navigator.clipboard.writeText(published.code);
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            }}
            className="mx-auto mt-6 flex items-center gap-3 rounded-xl border border-hairline bg-surface2 px-6 py-4 font-mono text-[25px] tracking-[.2em]"
          >
            <span>{published.code}</span><Copy className="size-4 text-lo" />
          </button>
          <div aria-live="polite" className={`mt-2 min-h-4 font-mono text-[10px] ${copied ? "text-pos" : "text-transparent"}`}>{copied ? "COPIED TO CLIPBOARD" : "COPY READY"}</div>
          <div className="mt-6 flex justify-center gap-3"><button onClick={() => resetBlank()} className={BTN}><RotateCcw className="mr-2 inline size-3.5" />Create another</button></div>
        </div>
      ) : (
        <div className="grid grid-cols-[1fr_300px] gap-4">
          <div className={`${CARD} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <div className="hud-label">Continuous validation</div>
              <span className={`font-mono text-[10px] ${blockers.length ? "text-neg" : "text-pos"}`}>{blockers.length ? `${blockers.length} BLOCKERS` : "BLOCKERS CLEAR"}</span>
            </div>
            <div className="divide-y divide-hairline">
              {issues.length === 0 && <div className="flex items-center gap-3 p-5 text-[13px] text-pos"><ShieldCheck className="size-4" /> The configured chain passes every automated check.</div>}
              {issues.map((issue) => (
                <div key={issue.id} className="flex items-start gap-3 p-4">
                  {issue.severity === "blocker" ? <X className="mt-0.5 size-4 shrink-0 text-neg" /> : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />}
                  <div><div className="font-mono text-[9px] uppercase text-lo">Step {issue.step} · {issue.severity}</div><p className="mt-1 text-[12px] leading-relaxed text-mid">{issue.message}</p></div>
                </div>
              ))}
            </div>
          </div>
          <div className={`${CARD} h-fit p-5`}>
            <div className="hud-label">Publish gate</div>
            <div className="mt-4 space-y-3 text-[12px]">
              <div className="flex items-center justify-between"><span className="text-mid">Automated blockers</span><span className={blockers.length ? "text-neg" : "text-pos"}>{blockers.length ? blockers.length : "clear"}</span></div>
              <div className="flex items-center justify-between"><span className="text-mid">Candidate preview</span><span className={previewed ? "text-pos" : "text-warn"}>{previewed ? "reviewed" : "required"}</span></div>
              <div className="flex items-center justify-between"><span className="text-mid">Human reviewer</span><span className={draft.governance.roles.some((r) => r.role !== "Observer") ? "text-pos" : "text-neg"}>{draft.governance.roles.some((r) => r.role !== "Observer") ? "assigned" : "missing"}</span></div>
            </div>
            <button disabled={blockers.length > 0 || !previewed} onClick={publish} className="mt-5 w-full rounded-lg bg-paper px-4 py-3 text-[13px] font-medium text-void disabled:cursor-not-allowed disabled:opacity-25">Freeze config & publish</button>
            <p className="mt-3 text-[10px] leading-relaxed text-lo">Publishing freezes criteria, rubrics, prompts and notices into config version {draft.configVersion}. Later edits create a new version.</p>
          </div>
        </div>
      )}
      {preview && <CandidatePreview onClose={() => setPreview(false)} />}
    </section>
  );
}

function StepHeading({ eyebrow, title, text, action }: { eyebrow: string; title: string; text: string; action?: React.ReactNode }) {
  return (
    <div className="mb-6 flex items-end justify-between gap-5">
      <div><div className="hud-label">{eyebrow}</div><h1 className="mt-2 font-display text-[28px] tracking-[-.02em]">{title}</h1><p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-mid">{text}</p></div>
      {action}
    </div>
  );
}

function ImpactPanel() {
  const { draft } = useStudio();
  const impact = impactSummary(draft);
  const coverage = coverageMatrix(draft);
  const covered = coverage.filter((item) => item.ok).length;
  const issueCount = impact.lint.blockers + impact.lint.warnings;
  return (
    <aside className="sticky top-[72px] h-fit">
      <div className={`${CARD} p-4`}>
        <div className="text-[12px] font-medium text-hi">Quick check</div>
        <div className="mt-4 space-y-3 text-[12px]">
          <div className="flex items-center justify-between"><span className="text-mid">Candidate time</span><span className={impact.totalMinutes > 45 ? "text-warn" : "text-hi"}>{fmtMinutes(impact.totalMinutes)}</span></div>
          <div className="flex items-center justify-between"><span className="text-mid">Criteria covered</span><span className="text-hi">{covered} of {coverage.length}</span></div>
          <div className="flex items-center justify-between"><span className="text-mid">Issues to review</span><span className={impact.lint.blockers ? "text-neg" : issueCount ? "text-warn" : "text-pos"}>{issueCount || "None"}</span></div>
          <div className="flex gap-1 pt-1">{coverage.map((item) => <span key={item.attributeId} title={item.attributeName} className={`h-1 flex-1 rounded ${item.ok ? "bg-pos" : "bg-warn"}`} />)}</div>
        </div>
      </div>
    </aside>
  );
}

export default function VacancyStudio() {
  const { draft, entered, step, setStep, resetBlank } = useStudio();
  const issues = useMemo(() => preflight(draft), [draft]);
  if (!entered) return <Entry />;
  const panels = [<ProfileStep key="p" />, <CriteriaStep key="c" />, <PipelineStep key="pl" />, <ScoringStep key="s" />, <ExperienceStep key="e" />, <GovernanceStep key="g" />, <PreflightStep key="pf" />];
  return (
    <div className="grid min-h-[calc(100vh-52px)] grid-cols-[214px_minmax(0,1fr)] bg-void2">
      <nav className="border-r border-hairline bg-void px-3 py-5">
        <div className="px-3"><div className="hud-label">Vacancy Studio</div><div className="mt-2 truncate text-[13px] text-hi">{draft.profile.title || "Untitled vacancy"}</div><div className="mt-1 font-mono text-[9px] text-lo">DRAFT · CONFIG V{draft.configVersion}</div></div>
        <div className="mt-6 space-y-1">
          {STEPS.map(([name, sub], i) => {
            const count = issues.filter((x) => x.step === i + 1 && x.severity === "blocker").length;
            return (
              <button key={name} onClick={() => setStep(i + 1)} className={`w-full rounded-lg border px-3 py-2.5 text-left ${step === i + 1 ? "border-hairline-strong bg-surface" : "border-transparent hover:bg-surface/60"}`}>
                <div className="flex items-center gap-2"><span className={`font-mono text-[9px] ${step === i + 1 ? "text-irisc" : "text-lo"}`}>{String(i + 1).padStart(2, "0")}</span><span className={`text-[11px] ${step === i + 1 ? "text-hi" : "text-mid"}`}>{name}</span>{count > 0 && <span className="ml-auto size-1.5 rounded-full bg-neg" />}</div>
                {step === i + 1 && <div className="ml-6 mt-0.5 text-[9px] text-lo">{sub}</div>}
              </button>
            );
          })}
        </div>
        <button onClick={resetBlank} className="mt-6 flex w-full items-center gap-2 px-3 py-2 text-[10px] text-lo hover:text-hi"><RotateCcw className="size-3" /> Change entry mode</button>
      </nav>
      <div className="grid grid-cols-[minmax(0,1fr)_210px] gap-5 px-6 py-7">
        <main className="min-w-0">{panels[step - 1]}</main>
        <ImpactPanel />
      </div>
    </div>
  );
}
