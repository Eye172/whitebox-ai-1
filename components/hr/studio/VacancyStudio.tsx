"use client";

/* Vacancy Studio — SPEC §4.

   Everything on this surface edits the one draft in StudioProvider, which is
   persisted on every keystroke, so navigating away and coming back resumes
   exactly where you were. The step rail is navigation, never a wizard lock:
   the preflight validator is the only thing that gates publishing, and every
   issue it raises is a link straight to the control that fixes it. */

import { useEffect, useMemo, useRef, useState } from "react";
import {
  AlertTriangle, ArrowDown, ArrowUp, Check, ChevronRight, Copy, Eye,
  GripVertical, Library, Lock, LockOpen, Plus, RotateCcw, Search, ShieldCheck,
  Sparkles, Trash2, WandSparkles, X,
} from "lucide-react";
import { useStudio } from "./StudioProvider";
import BlockSettingsEditor from "./BlockSettings";
import {
  BTN, CARD, ChipMulti, Combo, Field, INPUT, LABEL, NumberInput, TagList, Toggle, Why,
} from "./fields";
import {
  BLOCK_GROUPS, BLOCK_LIBRARY, clearBlockTimeOverride, createBlock, derivedMinutes,
  estimateMinutes, setBlockMinutes, timeSettingOf,
} from "@/lib/blocks";
import { BUILT_IN_PRESETS, instantiatePreset } from "@/lib/presets";
import {
  coverageMatrix, distributeEqually, effectiveWeights, fmtMinutes, impactSummary,
  preflight, rebalanceWeights,
} from "@/lib/studio";
import { listVacancies, publishDraft } from "@/lib/store";
import { draftQuestion } from "@/lib/ai";
import {
  ATTRIBUTE_KINDS, CANDIDATE_TONES, EMPLOYMENT_TYPES, INDUSTRY_PACKS,
  JURISDICTION_PROFILES, SENIORITIES, WORK_MODES,
} from "@/lib/types";
import type {
  AttributeKind, BlockKind, BlockSettings, CategorySpec, EmploymentType, IndustryPack,
  PipelineBlock, PositionProfile, PreflightIssue, Role, Seniority, VacancyV2, WorkMode,
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

const VERIFICATIONS = ["self_report", "interview", "test", "document", "reference"] as const;
const ROLES = ["Owner", "HiringManager", "TechnicalReviewer", "Observer"] as const;
const TIMEZONES = ["Asia/Almaty", "UTC", "Europe/London", "Europe/Berlin", "America/New_York"] as const;

const words = (v: string) => v.replaceAll("_", " ");
const uid = (prefix: string) => `${prefix}-${Math.random().toString(36).slice(2, 9)}`;

/* Shown whenever a draft came from the built-in generator rather than a
   model, so nobody mistakes a heuristic for an evaluated recommendation. */
const LOCAL_DRAFT_NOTICE =
  "Drafted locally — no model credential is configured, so this is a starting scaffold rather than a model recommendation. Every field is editable.";

/* Focus a freshly-added row so the author can type its name immediately —
   the difference between "a thing appeared" and "I am naming my thing". */
function useFocusOnAppear(id: string | null) {
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { if (id) ref.current?.focus(); }, [id]);
  return ref;
}

function StepHeading({ eyebrow, title, text, action }: {
  eyebrow: string; title: string; text: string; action?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex items-end justify-between gap-5">
      <div>
        <div className="hud-label">{eyebrow}</div>
        <h1 className="mt-2 font-display text-[28px] tracking-[-.02em]">{title}</h1>
        <p className="mt-2 max-w-2xl text-[12px] leading-relaxed text-mid">{text}</p>
      </div>
      {action}
    </div>
  );
}

/* ============================================================
   ENTRY
   ============================================================ */

function Entry() {
  const { replace, setEntered, setStep, draft, hydrated } = useStudio();
  const [mode, setMode] = useState<"choose" | "describe" | "preset" | "clone">("choose");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [clones, setClones] = useState<VacancyV2[]>([]);

  useEffect(() => { setClones(listVacancies()); }, []);

  /* A draft with real content survived from a previous visit — offer it back
     rather than silently discarding work behind an entry-mode picker. */
  const resumable = hydrated && (draft.profile.title.trim() !== "" || draft.categories.length > 0 || draft.pipeline.length > 0);

  const enter = (next: VacancyV2) => { replace(next); setEntered(true); setStep(1); };

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
      if (body.warning) setNotice(String(body.warning));
      else if (body.meta?.source === "local") setNotice(LOCAL_DRAFT_NOTICE);
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
            <Field label="Position title">
              <input className={INPUT} aria-label="Position title" placeholder="e.g. Product Manager — Marketplace" value={title} onChange={(e) => setTitle(e.target.value)} />
            </Field>
            <Field label="Role description" hint="Any language. Describe the work, the team, and what separates a strong hire from an adequate one.">
              <textarea
                className={`${INPUT} min-h-40 leading-relaxed`}
                aria-label="Role description"
                placeholder="What this person owns, who they work with, the decisions they make…"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </Field>
          </div>
          {error && <p className="mt-3 text-[12px] text-neg" role="alert">{error}</p>}
          {notice && (
            <p className="mt-3 rounded-lg border border-warn/30 bg-warn/5 p-3 text-[11px] leading-relaxed text-warn">
              {notice}
            </p>
          )}
          <button
            onClick={generate}
            disabled={busy || description.trim().length < 20}
            className="mt-5 inline-flex items-center gap-2 rounded-lg bg-paper px-4 py-2.5 text-[13px] font-medium text-void disabled:opacity-40"
          >
            <WandSparkles className="size-4" />{busy ? "Building the transparent chain…" : "Draft vacancy"}
          </button>
          {description.trim().length < 20 && (
            <p className="mt-2 text-[11px] text-lo">Write at least a sentence or two so the draft has something to work from.</p>
          )}
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
              <div className="flex items-center justify-between">
                <Library className="size-4 text-irisb" />
                <span className="font-mono text-[9px] text-lo">v{preset.version}</span>
              </div>
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
          {clones.length === 0 && (
            <div className={`${CARD} p-6 text-[13px] text-mid`}>No locally published vacancies yet. Start from a built-in preset instead.</div>
          )}
          {clones.map((v) => (
            <button
              key={v.id}
              onClick={() => enter({
                ...structuredClone(v),
                id: uid("vac"), code: "", status: "DRAFT", configVersion: 1,
                audit: [], createdAt: "", publishedAt: undefined,
              })}
              className={`${CARD} flex w-full items-center justify-between p-5 text-left`}
            >
              <span>
                <span className="block text-[14px] text-hi">{v.profile.title}</span>
                <span className="mt-1 block font-mono text-[10px] text-lo">{v.code} · CONFIG V{v.configVersion}</span>
              </span>
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

        {resumable && (
          <div className={`${CARD} mt-7 flex items-center justify-between gap-5 p-5`}>
            <div>
              <div className="hud-label">Unfinished draft</div>
              <div className="mt-1.5 text-[14px] text-hi">{draft.profile.title || "Untitled vacancy"}</div>
              <p className="mt-1 text-[11px] text-mid">
                {draft.categories.length} categor{draft.categories.length === 1 ? "y" : "ies"} · {draft.pipeline.length} block{draft.pipeline.length === 1 ? "" : "s"} · saved on this device
              </p>
            </div>
            <button onClick={() => setEntered(true)} className="shrink-0 rounded-lg bg-paper px-4 py-2.5 text-[13px] font-medium text-void">
              Resume draft
            </button>
          </div>
        )}

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

/* ============================================================
   01 · POSITION PROFILE
   ============================================================ */

function ProfileStep() {
  const { draft, update } = useStudio();
  const p = draft.profile;
  const patch = (next: Partial<PositionProfile>) =>
    update((d) => ({ ...d, profile: { ...d.profile, ...next } }));

  return (
    <section>
      <StepHeading
        eyebrow="01 · Position Profile"
        title="Define the concrete workplace."
        text="This context seeds criteria, question banks, candidate copy and evaluation prompts."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={`${CARD} col-span-full grid grid-cols-1 gap-4 p-5 md:grid-cols-2`}>
          <Field label="Role title">
            <input className={INPUT} aria-label="Role title" placeholder="e.g. Team Lead — Core Platform" value={p.title} onChange={(e) => patch({ title: e.target.value })} />
          </Field>
          <Field label="Internal requisition ID">
            <input className={INPUT} aria-label="Internal requisition ID" value={p.requisitionId ?? ""} onChange={(e) => patch({ requisitionId: e.target.value })} placeholder="REQ-2026-041" />
          </Field>
          <Field label="Department / team">
            <input className={INPUT} aria-label="Department or team" value={p.department ?? ""} onChange={(e) => patch({ department: e.target.value })} />
          </Field>
          <Field label="Hiring manager">
            <input className={INPUT} aria-label="Hiring manager" value={p.hiringManager ?? ""} onChange={(e) => patch({ hiringManager: e.target.value })} />
          </Field>
        </div>

        <div className={`${CARD} grid grid-cols-1 gap-4 p-5 md:grid-cols-2`}>
          <Field label="Seniority">
            <Combo value={p.seniority} options={SENIORITIES} allowCustom label="Seniority" onChange={(v) => patch({ seniority: v as Seniority })} />
          </Field>
          <Field label="Openings">
            <NumberInput value={p.openings} min={1} label="Openings" onChange={(v) => patch({ openings: v ?? 1 })} />
          </Field>
          <Field label="Employment">
            <Combo value={p.employmentType} options={EMPLOYMENT_TYPES} allowCustom format={words} label="Employment type" onChange={(v) => patch({ employmentType: v as EmploymentType })} />
          </Field>
          <Field label="Work mode">
            <Combo value={p.workMode} options={WORK_MODES} allowCustom format={words} label="Work mode" onChange={(v) => patch({ workMode: v as WorkMode })} />
          </Field>
          <div className="col-span-full">
            <Field label="Location(s)">
              <TagList values={p.locations} onChange={(locations) => patch({ locations })} label="locations" placeholder="Add a location and press Enter" />
            </Field>
          </div>
          <Field label="Time-zone overlap">
            <input className={INPUT} aria-label="Time-zone overlap" value={p.timezoneOverlap ?? ""} onChange={(e) => patch({ timezoneOverlap: e.target.value })} placeholder="UTC+3 to UTC+7" />
          </Field>
        </div>

        <div className={`${CARD} grid grid-cols-1 gap-4 p-5 md:grid-cols-2`}>
          <Field label="Industry pack" hint="Seeds the scenario and item banks. Pick Custom for anything not listed.">
            <Combo value={p.industryPack} options={INDUSTRY_PACKS} allowCustom format={words} label="Industry pack" onChange={(v) => patch({ industryPack: v as IndustryPack })} />
          </Field>
          <Field label="Primary language">
            <input className={INPUT} aria-label="Primary language" value={p.languages.primary} onChange={(e) => patch({ languages: { ...p.languages, primary: e.target.value } })} />
          </Field>
          <div className="col-span-full">
            <Field label="Other languages accepted">
              <TagList values={p.languages.alternates} onChange={(alternates) => patch({ languages: { ...p.languages, alternates } })} label="alternate languages" />
            </Field>
          </div>
          <Field label="Application opens">
            <input
              className={INPUT} type="datetime-local" aria-label="Application opens"
              value={draft.window.opensAt.slice(0, 16)}
              onChange={(e) => update((d) => ({ ...d, window: { ...d.window, opensAt: e.target.value } }))}
            />
          </Field>
          <Field label="Application closes">
            <input
              className={INPUT} type="datetime-local" aria-label="Application closes"
              value={draft.window.closesAt.slice(0, 16)}
              onChange={(e) => update((d) => ({ ...d, window: { ...d.window, closesAt: e.target.value } }))}
            />
          </Field>
          <div className="col-span-full">
            <Field label="Timezone">
              <Combo value={draft.window.timezone} options={TIMEZONES} allowCustom label="Timezone" onChange={(timezone) => update((d) => ({ ...d, window: { ...d.window, timezone } }))} />
            </Field>
          </div>
        </div>

        <div className={`${CARD} col-span-full p-5`}>
          <Field label="Mission of the role" hint="One to three sentences. Appears on the candidate landing page and frames every evaluation prompt.">
            <textarea className={`${INPUT} min-h-24`} aria-label="Mission of the role" value={p.mission} onChange={(e) => patch({ mission: e.target.value })} />
          </Field>
          <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Responsibilities">
              <TagList values={p.responsibilities} onChange={(responsibilities) => patch({ responsibilities })} label="responsibilities" placeholder="Add a responsibility and press Enter" />
            </Field>
            <Field label="Team context">
              <textarea className={`${INPUT} min-h-28`} aria-label="Team context" value={p.teamContext ?? ""} onChange={(e) => patch({ teamContext: e.target.value })} />
            </Field>
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   02 · CRITERIA
   ============================================================ */

function CriteriaStep() {
  const { draft, update } = useStudio();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [locked, setLocked] = useState<Set<string>>(new Set());
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const nameRef = useFocusOnAppear(justAdded);

  const coverage = coverageMatrix(draft);
  const ew = effectiveWeights(draft);
  const catSum = draft.categories.reduce((a, c) => a + c.weight, 0);
  const focusCount = draft.categories.flatMap((c) => c.attributes).filter((a) => a.focus).length;

  const suggest = async () => {
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/ai/suggest-criteria", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ profile: draft.profile }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error || "Could not draft criteria.");
      setNotice(body.warning ? String(body.warning) : body.meta?.source === "local" ? LOCAL_DRAFT_NOTICE : "");
      update((d) => ({ ...d, categories: body.categories as CategorySpec[] }));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not draft criteria.");
    } finally {
      setBusy(false);
    }
  };

  const patchCategory = (id: string, next: Partial<CategorySpec>) =>
    update((d) => ({ ...d, categories: d.categories.map((c) => (c.id === id ? { ...c, ...next } : c)) }));

  const patchAttribute = (catId: string, attrId: string, next: Partial<CategorySpec["attributes"][number]>) =>
    update((d) => ({
      ...d,
      categories: d.categories.map((c) => c.id === catId
        ? { ...c, attributes: c.attributes.map((a) => (a.id === attrId ? { ...a, ...next } : a)) }
        : c),
    }));

  const setCategoryWeight = (id: string, weight: number) =>
    update((d) => ({ ...d, categories: rebalanceWeights(d.categories, id, weight, locked) }));

  const setAttrWeight = (catId: string, attrId: string, weight: number) =>
    update((d) => ({
      ...d,
      categories: d.categories.map((c) => c.id === catId
        ? { ...c, attributes: rebalanceWeights(c.attributes, attrId, weight, locked) }
        : c),
    }));

  const toggleLock = (id: string) =>
    setLocked((s) => { const n = new Set(s); if (n.has(id)) n.delete(id); else n.add(id); return n; });

  const addCategory = () => {
    const id = uid("cat");
    update((d) => ({
      ...d,
      categories: distributeEqually([
        ...d.categories,
        { id, name: "", description: "", weight: 0, attributes: [] },
      ]),
    }));
    setJustAdded(id);
  };

  const addAttribute = (catId: string) => {
    const id = uid("attr");
    update((d) => ({
      ...d,
      categories: d.categories.map((c) => c.id === catId
        ? {
          ...c,
          attributes: distributeEqually([...c.attributes, {
            id, name: "", kind: "skill" as AttributeKind, definition: "", weight: 0,
            scale: { anchors: ["No evidence", "Limited evidence", "Adequate evidence", "Strong evidence", "Exceptional evidence"] as [string, string, string, string, string] },
            verification: "interview" as const,
          }]),
        }
        : c),
    }));
    setJustAdded(id);
  };

  return (
    <section>
      <StepHeading
        eyebrow="02 · Criteria Architecture"
        title="Define what “good” means."
        text="Weights sum to 100 at both levels. Everything here is yours to name — the suggestions are a starting point, not a vocabulary."
        action={
          <button className={`${BTN} inline-flex items-center gap-2`} onClick={suggest} disabled={busy || !draft.profile.title.trim()} title={!draft.profile.title.trim() ? "Give the role a title first" : undefined}>
            <Sparkles className="size-3.5" />{busy ? "Drafting…" : "Suggest attributes"}
          </button>
        }
      />

      {error && <p className="mb-4 text-[12px] text-neg" role="alert">{error}</p>}
      {notice && (
        <p className="mb-4 rounded-lg border border-warn/30 bg-warn/5 p-3 text-[11px] leading-relaxed text-warn">
          {notice}
        </p>
      )}

      {draft.categories.length > 0 && (
        <div className="mb-4 flex items-center gap-3">
          <span className={`font-mono text-[10px] ${catSum === 100 ? "text-pos" : "text-warn"}`}>
            CATEGORY TOTAL {catSum}/100
          </span>
          {catSum !== 100 && (
            <button className={`${BTN} py-1 text-[10px]`} onClick={() => update((d) => ({ ...d, categories: distributeEqually(d.categories) }))}>
              Distribute equally
            </button>
          )}
        </div>
      )}

      {draft.categories.length === 0 && (
        <div className={`${CARD} p-10 text-center`}>
          <p className="text-[13px] text-mid">No criteria yet.</p>
          <p className="mx-auto mt-1.5 max-w-md text-[11px] leading-relaxed text-lo">
            Add a category of your own, or let WhiteBox suggest a starting architecture from the position profile — every suggestion stays editable.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {draft.categories.map((cat) => {
          const attrSum = cat.attributes.reduce((a, x) => a + x.weight, 0);
          const catEffective = ew.categories.find((c) => c.categoryId === cat.id);
          return (
            <div key={cat.id} className={`${CARD} overflow-hidden`}>
              <div className="border-b border-hairline bg-surface2 px-4 py-3">
                <div className="flex items-center gap-3">
                  <input
                    ref={justAdded === cat.id ? nameRef : undefined}
                    className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-[14px] font-medium text-hi outline-none placeholder:text-lo placeholder:font-normal hover:border-hairline focus:border-hairline-strong"
                    aria-label="Category name"
                    placeholder="Name this category…"
                    value={cat.name}
                    onChange={(e) => patchCategory(cat.id, { name: e.target.value })}
                  />
                  <Why text={cat.rationale} />
                  <input
                    type="range" min={0} max={100}
                    className="w-28 accent-[var(--iris-b)]"
                    aria-label={`Weight for ${cat.name || "this category"}`}
                    value={cat.weight}
                    onChange={(e) => setCategoryWeight(cat.id, Number(e.target.value))}
                  />
                  <span className="w-14 shrink-0">
                    <NumberInput
                      value={cat.weight} min={0} max={100}
                      label={`Weight percent for ${cat.name || "this category"}`}
                      className="iris-focus w-full rounded border border-hairline bg-void2 px-2 py-1 text-right font-mono text-[11px] text-hi"
                      onChange={(v) => setCategoryWeight(cat.id, v ?? 0)}
                    />
                  </span>
                  <button
                    onClick={() => toggleLock(cat.id)}
                    aria-pressed={locked.has(cat.id)}
                    aria-label={`${locked.has(cat.id) ? "Unlock" : "Lock"} weight for ${cat.name || "this category"}`}
                    title="Locked weights are not rebalanced when other weights change"
                    className="iris-focus rounded p-1"
                  >
                    {locked.has(cat.id) ? <Lock className="size-3.5 text-irisb" /> : <LockOpen className="size-3.5 text-lo" />}
                  </button>
                  <button
                    onClick={() => update((d) => ({ ...d, categories: distributeEqually(d.categories.filter((c) => c.id !== cat.id)) }))}
                    aria-label={`Delete category ${cat.name || "untitled"}`}
                    className="iris-focus rounded p-1 text-lo hover:text-neg"
                  >
                    <Trash2 className="size-3.5" />
                  </button>
                </div>
                <input
                  className="mt-2 w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-[11px] text-mid outline-none placeholder:text-lo hover:border-hairline focus:border-hairline-strong"
                  aria-label={`Description for ${cat.name || "this category"}`}
                  placeholder="What does this category cover? (shown to candidates, and used in evaluation prompts)"
                  value={cat.description ?? ""}
                  onChange={(e) => patchCategory(cat.id, { description: e.target.value })}
                />
                {cat.attributes.length > 0 && (
                  <div className="mt-2 flex items-center gap-3 font-mono text-[9px]">
                    <span className={attrSum === 100 ? "text-lo" : "text-warn"}>ATTRIBUTES {attrSum}/100</span>
                    {attrSum !== 100 && (
                      <button
                        className="text-irisc hover:underline"
                        onClick={() => patchCategory(cat.id, { attributes: distributeEqually(cat.attributes) })}
                      >EQUALIZE</button>
                    )}
                    {catEffective && catEffective.effectivePct !== catEffective.configuredPct && (
                      <span className="text-lo">→ {catEffective.effectivePct}% EFFECTIVE</span>
                    )}
                  </div>
                )}
              </div>

              <div className="divide-y divide-hairline">
                {cat.attributes.map((attr) => {
                  const cell = coverage.find((x) => x.attributeId === attr.id);
                  return (
                    <div key={attr.id} className="grid grid-cols-1 items-start gap-3 px-4 py-3 lg:grid-cols-[1fr_120px_110px_60px_64px_20px]">
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <input
                            ref={justAdded === attr.id ? nameRef : undefined}
                            className="min-w-0 flex-1 rounded border border-transparent bg-transparent px-1 py-0.5 text-[13px] text-hi outline-none placeholder:text-lo hover:border-hairline focus:border-hairline-strong"
                            aria-label="Attribute name"
                            placeholder="Name this attribute…"
                            value={attr.name}
                            onChange={(e) => patchAttribute(cat.id, attr.id, { name: e.target.value })}
                          />
                          <Why text={attr.rationale} />
                          <button
                            onClick={() => update((d) => ({
                              ...d,
                              categories: d.categories.map((c) => c.id === cat.id
                                ? { ...c, attributes: distributeEqually(c.attributes.filter((a) => a.id !== attr.id)) }
                                : c),
                            }))}
                            aria-label={`Delete attribute ${attr.name || "untitled"}`}
                            className="iris-focus rounded p-0.5 text-lo hover:text-neg"
                          >
                            <Trash2 className="size-3" />
                          </button>
                        </div>
                        <input
                          className="mt-1 w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-[11px] text-lo outline-none placeholder:text-lo hover:border-hairline focus:border-hairline-strong"
                          aria-label={`Definition for ${attr.name || "this attribute"}`}
                          placeholder="One observable behaviour that shows this…"
                          value={attr.definition}
                          onChange={(e) => patchAttribute(cat.id, attr.id, { definition: e.target.value })}
                        />
                        <div className="mt-1.5">
                          <Combo
                            value={attr.verification}
                            options={VERIFICATIONS}
                            format={(v) => `via ${words(v)}`}
                            label={`How ${attr.name || "this attribute"} is verified`}
                            className="!w-auto !border-transparent !bg-transparent !px-1 !py-0 !text-[10px] !text-lo hover:!border-hairline"
                            onChange={(v) => patchAttribute(cat.id, attr.id, { verification: v as typeof attr.verification })}
                          />
                        </div>
                      </div>

                      <Combo
                        value={attr.kind}
                        options={ATTRIBUTE_KINDS}
                        allowCustom
                        label={`Kind of ${attr.name || "this attribute"}`}
                        className="!py-1.5 !text-[12px]"
                        onChange={(v) => patchAttribute(cat.id, attr.id, { kind: v as AttributeKind })}
                      />

                      <input
                        type="range" className="mt-2 accent-[var(--iris-b)]" min={0} max={100}
                        aria-label={`Weight for ${attr.name || "this attribute"}`}
                        value={attr.weight}
                        onChange={(e) => setAttrWeight(cat.id, attr.id, Number(e.target.value))}
                      />

                      <NumberInput
                        value={attr.weight} min={0} max={100}
                        label={`Weight percent for ${attr.name || "this attribute"}`}
                        className="iris-focus w-full rounded border border-hairline bg-void2 px-2 py-1 text-right font-mono text-[11px] text-hi"
                        onChange={(v) => setAttrWeight(cat.id, attr.id, v ?? 0)}
                      />

                      <button
                        disabled={!attr.focus && focusCount >= 5}
                        title={!attr.focus && focusCount >= 5 ? "Five focus attributes is the maximum" : "Focus attributes need two scored blocks and break ties"}
                        onClick={() => patchAttribute(cat.id, attr.id, { focus: !attr.focus || undefined })}
                        className={`mt-1 rounded-full border px-2 py-1 font-mono text-[9px] disabled:opacity-30 ${attr.focus ? "border-irisb/50 text-irisc" : "border-hairline text-lo"}`}
                      >FOCUS</button>

                      <span
                        title={cell?.ok ? "Measured by the pipeline" : "No scored block measures this yet"}
                        className={`mt-2.5 size-2 rounded-full ${cell?.ok ? "bg-pos" : "bg-warn"}`}
                      />
                    </div>
                  );
                })}
              </div>

              <button onClick={() => addAttribute(cat.id)} className="m-3 inline-flex items-center gap-1 text-[11px] text-lo hover:text-hi">
                <Plus className="size-3" /> Add attribute
              </button>
            </div>
          );
        })}
      </div>

      <button onClick={addCategory} className={`${BTN} mt-4 inline-flex items-center gap-2`}>
        <Plus className="size-3.5" /> Add category
      </button>
    </section>
  );
}

/* ============================================================
   03 · PIPELINE COMPOSER
   ============================================================ */

function BlockCard({
  block, index, total, attrs, seniority, expanded, onToggle, onPatch, onMove, onDelete,
}: {
  block: PipelineBlock; index: number; total: number;
  attrs: CategorySpec["attributes"]; seniority: Seniority;
  expanded: boolean; onToggle: () => void;
  onPatch: (patch: Partial<PipelineBlock>) => void;
  onMove: (delta: number) => void; onDelete: () => void;
}) {
  const meta = BLOCK_LIBRARY[block.kind];
  const minutes = estimateMinutes(block);
  const derived = derivedMinutes(block);
  const timeSetting = timeSettingOf(block);
  const overridden = block.timeOverrideMin !== undefined;

  return (
    <div>
      <div className={`${CARD} overflow-hidden`}>
        <div className={`grid grid-cols-[32px_1fr_auto] items-center gap-3 p-4 ${expanded ? "border-b border-hairline" : ""}`}>
          <span className="grid size-7 place-items-center rounded border border-hairline font-mono text-[10px] text-lo">{String(index + 1).padStart(2, "0")}</span>
          <div className="min-w-0">
            {expanded ? (
              <input
                aria-label="Block title"
                className="w-full rounded border border-transparent bg-transparent px-1 py-0.5 text-[14px] font-medium text-hi outline-none hover:border-hairline focus:border-hairline-strong"
                value={block.title}
                placeholder="Name this block…"
                onChange={(e) => onPatch({ title: e.target.value })}
              />
            ) : (
              <div className="truncate text-[14px] font-medium text-hi">{block.title || meta.label}</div>
            )}
            <div className="mt-1 flex items-center gap-2 text-[10px] text-lo">
              <span>{meta.methodName}</span><span>·</span>
              <span className={overridden ? "text-irisc" : ""}>{fmtMinutes(minutes)}</span><span>·</span>
              <span>{block.required ? "Required" : "Optional"}</span><span>·</span>
              <span>{block.scored ? `Scored · ${block.measures.length} attribute${block.measures.length === 1 ? "" : "s"}` : "Not scored"}</span>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button className={`${BTN} min-w-14 text-[10px]`} onClick={onToggle} aria-expanded={expanded}>{expanded ? "Done" : "Edit"}</button>
            <button className={BTN} onClick={() => onMove(-1)} disabled={index === 0} aria-label={`Move ${block.title} up`}><ArrowUp className="size-3.5" /></button>
            <button className={BTN} onClick={() => onMove(1)} disabled={index === total - 1} aria-label={`Move ${block.title} down`}><ArrowDown className="size-3.5" /></button>
            <button className={BTN} onClick={onDelete} aria-label={`Delete ${block.title}`}><Trash2 className="size-3.5" /></button>
          </div>
        </div>

        {expanded && (
          <div className="grid grid-cols-1 gap-5 p-4 lg:grid-cols-[1.3fr_.7fr]">
            <div className="min-w-0 space-y-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full border border-hairline px-2 py-0.5 font-mono text-[9px] text-lo">{meta.evidenceLevel}</span>
                {meta.validity !== undefined && <span className="font-mono text-[9px] text-pos">ρ ≈ {meta.validity.toFixed(2)}</span>}
                {meta.subgroupD && <span className="font-mono text-[9px] text-warn">{meta.subgroupD}</span>}
              </div>
              <p className="text-[11px] leading-relaxed text-lo">{meta.methodBasis}</p>

              <Field label="Candidate instructions" hint="States what this measures and why it is job-relevant. Blocks at integrity tier 2+ must also mention recording or identity checks.">
                <textarea
                  className={`${INPUT} min-h-24 leading-relaxed`}
                  aria-label="Candidate instructions"
                  value={block.candidateIntro}
                  onChange={(e) => onPatch({ candidateIntro: e.target.value })}
                />
              </Field>

              <div className="border-t border-hairline pt-4">
                <BlockSettingsEditor
                  block={block}
                  attrs={attrs}
                  seniority={seniority}
                  onSettings={(settings: BlockSettings) => onPatch({ settings })}
                />
              </div>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <Toggle checked={block.required} onChange={(required) => onPatch({ required })} label="Required" />
                <Toggle checked={block.scored} onChange={(scored) => onPatch({ scored })} label="Scored" />
              </div>

              {block.scored && (
                <Field label={`Attribute mapping · ${block.measures.length} selected`} hint="Shares are split evenly across the attributes you pick; this is what rolls the block's score into the composite.">
                  <div className="flex flex-wrap gap-1.5">
                    {attrs.length === 0 && <span className="text-[11px] text-warn">Define criteria in step 02 first.</span>}
                    {attrs.map((attr) => {
                      const active = block.measures.some((m) => m.attributeId === attr.id);
                      return (
                        <button
                          key={attr.id}
                          aria-pressed={active}
                          onClick={() => {
                            const ids = active
                              ? block.measures.filter((m) => m.attributeId !== attr.id).map((m) => m.attributeId)
                              : [...block.measures.map((m) => m.attributeId), attr.id];
                            const measures = distributeEqually(ids.map((id) => ({ id, weight: 0 })))
                              .map((x) => ({ attributeId: x.id, share: x.weight }));
                            onPatch({ measures });
                          }}
                          className={`iris-focus rounded-full border px-2.5 py-1 text-[10px] ${active ? "border-irisb/50 bg-irisb/10 text-irisc" : "border-hairline text-lo hover:text-mid"}`}
                        >{attr.focus ? "◉ " : ""}{attr.name || "untitled"}</button>
                      );
                    })}
                  </div>
                </Field>
              )}

              <Field label="Integrity tier" hint="Tier 3 is allowed only on the final block, and every tier above 0 must be disclosed in the instructions.">
                <Combo
                  value={String(block.integrityTier)}
                  options={["0", "1", "2", "3"]}
                  format={(v) => ({ "0": "0 · none", "1": "1 · signals", "2": "2 · camera + liveness", "3": "3 · ID check" })[v] ?? v}
                  label="Integrity tier"
                  onChange={(v) => onPatch({ integrityTier: Number(v) as 0 | 1 | 2 | 3 })}
                />
              </Field>

              <Field label="Retakes">
                <NumberInput value={block.retakePolicy} min={0} max={2} label="Retakes allowed" onChange={(v) => onPatch({ retakePolicy: (v ?? 0) as 0 | 1 | 2 })} />
              </Field>

              <Field label="Gate · minimum block score" hint="Leave empty for no hurdle. Candidates below this do not continue to the next block.">
                <NumberInput
                  value={block.gate?.minBlockScore}
                  min={0} max={100} placeholder="none"
                  label="Minimum block score to continue"
                  onChange={(v) => onPatch({ gate: v === undefined ? undefined : { ...block.gate, minBlockScore: v } })}
                />
              </Field>

              <Field
                label={timeSetting ? `${timeSetting.label} · minutes` : "Candidate time · minutes"}
                hint={
                  timeSetting
                    ? "This block owns its duration — the number here is what the runtime enforces and what the candidate is told."
                    : overridden
                      ? `Your figure. The block's content implies ${fmtMinutes(derived)}.`
                      : "Derived from the block's content. Type your own figure to override it."
                }
              >
                <div className="flex items-center gap-1.5">
                  <NumberInput
                    value={minutes} min={1}
                    label={timeSetting ? timeSetting.label : "Candidate time in minutes"}
                    onChange={(v) => { if (v !== undefined) onPatch(setBlockMinutes(block, v)); }}
                  />
                  {overridden && (
                    <button
                      className={BTN}
                      onClick={() => onPatch(clearBlockTimeOverride(block))}
                      title={`Reset to the derived estimate (${fmtMinutes(derived)})`}
                      aria-label="Reset candidate time to the derived estimate"
                    ><RotateCcw className="size-3.5" /></button>
                  )}
                </div>
              </Field>

              <Field label="Extra time" hint="Accessibility allowance applied to every timed element of this block.">
                <Combo
                  value={String(block.accessibility.extraTimeMultiplier)}
                  options={["1", "1.25", "1.5", "2", "untimed"]}
                  format={(v) => (v === "1" ? "none" : v === "untimed" ? "untimed" : `×${v}`)}
                  label="Extra time multiplier"
                  onChange={(v) => onPatch({
                    accessibility: {
                      ...block.accessibility,
                      extraTimeMultiplier: (v === "untimed" ? "untimed" : Number(v)) as PipelineBlock["accessibility"]["extraTimeMultiplier"],
                    },
                  })}
                />
              </Field>

              <div className="space-y-3 border-t border-hairline pt-3">
                <Toggle checked={block.accessibility.captions} onChange={(captions) => onPatch({ accessibility: { ...block.accessibility, captions } })} label="Captions" />
                <Toggle checked={block.accessibility.screenReaderMode} onChange={(screenReaderMode) => onPatch({ accessibility: { ...block.accessibility, screenReaderMode } })} label="Screen-reader mode" />
                <Toggle checked={block.accessibility.alternativeFormats} onChange={(alternativeFormats) => onPatch({ accessibility: { ...block.accessibility, alternativeFormats } })} label="Offer an alternative format" />
              </div>
            </div>
          </div>
        )}
      </div>
      {index < total - 1 && <div className="ml-8 h-3 border-l border-dashed border-hairline-strong" />}
    </div>
  );
}

function PipelineStep() {
  const { draft, update } = useStudio();
  const [library, setLibrary] = useState(false);
  const [query, setQuery] = useState("");
  const [expandedBlock, setExpandedBlock] = useState<string | null>(null);
  const attrs = draft.categories.flatMap((c) => c.attributes);

  const add = (kind: BlockKind) => {
    const block = createBlock(kind, draft.pipeline.length);
    if (block.scored && attrs.length > 0) {
      block.measures = distributeEqually(attrs.map((a) => ({ id: a.id, weight: 0 })))
        .map((x) => ({ attributeId: x.id, share: x.weight }));
    }
    if ("questions" in block.settings && attrs.length > 0) {
      block.settings = {
        ...block.settings,
        questions: attrs.slice(0, 5).map((a) =>
          draftQuestion(a, a.kind === "knowledge" ? "job_knowledge" : "behavioral", draft.profile.seniority)),
      };
      block.estimatedMinutes = estimateMinutes(block);
    }
    update((d) => ({ ...d, pipeline: [...d.pipeline, block] }));
    setExpandedBlock(block.id);
    setLibrary(false);
    setQuery("");
  };

  const patchBlock = (id: string, patch: Partial<PipelineBlock>) =>
    update((d) => ({
      ...d,
      pipeline: d.pipeline.map((b) => {
        if (b.id !== id) return b;
        const next = { ...b, ...patch };
        /* keep the cached estimate honest whatever changed */
        return { ...next, estimatedMinutes: estimateMinutes(next) };
      }),
    }));

  const move = (index: number, delta: number) =>
    update((d) => {
      const next = [...d.pipeline];
      const target = index + delta;
      if (target < 0 || target >= next.length) return d;
      [next[index], next[target]] = [next[target], next[index]];
      return { ...d, pipeline: next.map((b, i) => ({ ...b, order: i })) };
    });

  const totalRequired = draft.pipeline.filter((b) => b.required).reduce((a, b) => a + estimateMinutes(b), 0);

  return (
    <section>
      <StepHeading
        eyebrow="03 · Pipeline Composer"
        title="Compose named selection methods."
        text="Each block declares its evidence basis, time cost and adverse-impact profile. Open one to author its actual content."
        action={
          <button onClick={() => setLibrary(true)} className="inline-flex items-center gap-2 rounded-lg bg-paper px-3 py-2 text-[12px] text-void">
            <Plus className="size-3.5" /> Add block
          </button>
        }
      />

      {draft.pipeline.length > 0 && (
        <div className="mb-4 flex items-center gap-3 font-mono text-[10px]">
          <span className={totalRequired > 45 ? "text-warn" : "text-lo"}>REQUIRED TOTAL {fmtMinutes(totalRequired)}</span>
          <span className="text-lo">· {draft.pipeline.filter((b) => b.scored).length} SCORED OF {draft.pipeline.length}</span>
        </div>
      )}

      <div className="space-y-3">
        {draft.pipeline.length === 0 && (
          <button onClick={() => setLibrary(true)} className={`${CARD} w-full border-dashed p-12 text-center text-[13px] text-mid hover:text-hi`}>
            Open the {Object.keys(BLOCK_LIBRARY).length}-method block library
          </button>
        )}
        {draft.pipeline.map((block, index) => (
          <BlockCard
            key={block.id}
            block={block}
            index={index}
            total={draft.pipeline.length}
            attrs={attrs}
            seniority={draft.profile.seniority}
            expanded={expandedBlock === block.id}
            onToggle={() => setExpandedBlock(expandedBlock === block.id ? null : block.id)}
            onPatch={(patch) => patchBlock(block.id, patch)}
            onMove={(delta) => move(index, delta)}
            onDelete={() => {
              setExpandedBlock((current) => (current === block.id ? null : current));
              update((d) => ({ ...d, pipeline: d.pipeline.filter((b) => b.id !== block.id).map((b, i) => ({ ...b, order: i })) }));
            }}
          />
        ))}
      </div>

      {library && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/65" onMouseDown={(e) => { if (e.target === e.currentTarget) setLibrary(false); }}>
          <div className="h-full w-[560px] overflow-y-auto border-l border-hairline bg-void p-6">
            <div className="flex items-start justify-between">
              <div>
                <div className="hud-label">Block library · {Object.keys(BLOCK_LIBRARY).length} methods</div>
                <h2 className="mt-2 font-display text-[24px]">What evidence should this role collect?</h2>
              </div>
              <button aria-label="Close block library" onClick={() => setLibrary(false)} className={BTN}><X className="size-4" /></button>
            </div>

            <div className="mt-5 flex items-center gap-2 rounded-lg border border-hairline bg-surface px-3">
              <Search className="size-3.5 shrink-0 text-lo" />
              <input
                autoFocus
                className="w-full bg-transparent py-2.5 text-[12px] text-hi outline-none placeholder:text-lo"
                aria-label="Search methods"
                placeholder="Search methods…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            </div>

            {BLOCK_GROUPS.map((group) => {
              const kinds = group.kinds.filter((kind) => {
                const meta = BLOCK_LIBRARY[kind];
                const q = query.trim().toLowerCase();
                return q === "" || meta.label.toLowerCase().includes(q) || meta.methodName.toLowerCase().includes(q) || meta.description.toLowerCase().includes(q);
              });
              if (kinds.length === 0) return null;
              return (
                <div key={group.id} className="mt-7">
                  <div className="hud-label">{group.label}</div>
                  <div className="mt-2 grid grid-cols-2 gap-2">
                    {kinds.map((kind) => {
                      const meta = BLOCK_LIBRARY[kind];
                      return (
                        <button key={kind} onClick={() => add(kind)} className={`${CARD} brackets p-4 text-left`}>
                          <div className="flex items-center justify-between">
                            <span className="text-[12px] font-medium text-hi">{meta.label}</span>
                            <Plus className="size-3.5 text-irisb" />
                          </div>
                          <p className="mt-2 text-[10px] leading-relaxed text-mid">{meta.description}</p>
                          <div className="mt-3 flex flex-wrap gap-2 font-mono text-[9px] text-lo">
                            <span>{meta.defaultMinutes} min</span>
                            <span>{meta.evidenceLevel}</span>
                            {meta.validity !== undefined && <span className="text-pos">ρ {meta.validity}</span>}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </section>
  );
}

/* ============================================================
   04 · SCORING & RANKING
   ============================================================ */

function ScoringStep() {
  const { draft, update } = useStudio();
  const ew = effectiveWeights(draft);
  const patchScoring = (next: Partial<VacancyV2["scoring"]>) =>
    update((d) => ({ ...d, scoring: { ...d.scoring, ...next } }));

  return (
    <section>
      <StepHeading
        eyebrow="04 · Scoring & Ranking"
        title="Keep the math visible."
        text="The model explains evidence; arithmetic — not a model — rolls scores into the composite."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={`${CARD} space-y-5 p-5`}>
          <Field label="Combination topology">
            <Combo
              value={draft.scoring.topology}
              options={["hybrid", "compensatory", "multiple_hurdle"]}
              format={(v) => ({ hybrid: "Hybrid · knockouts + composite", compensatory: "Compensatory", multiple_hurdle: "Multiple hurdle" })[v] ?? v}
              label="Combination topology"
              onChange={(v) => patchScoring({ topology: v as VacancyV2["scoring"]["topology"] })}
            />
          </Field>
          <Field label="Weighting mode">
            <Combo
              value={draft.scoring.weighting}
              options={["rational", "unit", "pareto_assist"]}
              format={(v) => ({ rational: "Rational · configured", unit: "Unit · equal within level", pareto_assist: "Pareto assist · validity / diversity" })[v] ?? v}
              label="Weighting mode"
              onChange={(v) => patchScoring({ weighting: v as VacancyV2["scoring"]["weighting"] })}
            />
          </Field>
          <Field label={`Pass threshold · ${draft.scoring.threshold}/100`}>
            <div className="flex items-center gap-3">
              <input
                className="w-full accent-[var(--iris-b)]" type="range" min={0} max={100}
                aria-label="Pass threshold"
                value={draft.scoring.threshold}
                onChange={(e) => patchScoring({ threshold: Number(e.target.value) })}
              />
              <span className="w-16 shrink-0">
                <NumberInput value={draft.scoring.threshold} min={0} max={100} label="Pass threshold value" onChange={(v) => patchScoring({ threshold: v ?? 0 })} />
              </span>
            </div>
          </Field>
          <Field label="Tie-breakers · in order">
            <ChipMulti
              values={draft.scoring.tieBreakers}
              options={["focus_attributes", "work_sample", "earlier_submission"]}
              format={words}
              label="tie-breakers"
              onChange={(v) => patchScoring({ tieBreakers: v as VacancyV2["scoring"]["tieBreakers"] })}
            />
          </Field>
          <Toggle
            checked={draft.scoring.banding?.enabled ?? false}
            onChange={(enabled) => patchScoring({ banding: { enabled, sedWidth: draft.scoring.banding?.sedWidth ?? 4 } })}
            label="SED-based score bands"
            help="Candidates inside one band are treated as statistically indistinguishable."
          />
          {draft.scoring.banding?.enabled && (
            <Field label="Band width · SED">
              <NumberInput
                value={draft.scoring.banding.sedWidth} min={1} max={20} label="Band width in standard errors"
                onChange={(v) => patchScoring({ banding: { enabled: true, sedWidth: v ?? 4 } })}
              />
            </Field>
          )}
          <Toggle
            checked={draft.scoring.anonymization.maskPII}
            onChange={(maskPII) => patchScoring({ anonymization: { ...draft.scoring.anonymization, maskPII } })}
            label="Blind review by default"
            help="Identity stays separate from scoring and is revealed only at the configured gate."
          />
          <Field label="Reveal identity at">
            <Combo
              value={draft.scoring.anonymization.revealAtStage}
              options={["decision", "invited"]}
              label="Reveal identity at"
              onChange={(v) => patchScoring({ anonymization: { ...draft.scoring.anonymization, revealAtStage: v as "decision" | "invited" } })}
            />
          </Field>
          <Field label="Minimum evidence per attribute" hint="Below this the engine abstains and routes to a human instead of guessing a low score.">
            <NumberInput
              value={draft.scoring.abstainPolicy.minEvidencePerAttribute} min={1} max={5}
              label="Minimum evidence per attribute"
              onChange={(v) => patchScoring({ abstainPolicy: { ...draft.scoring.abstainPolicy, minEvidencePerAttribute: v ?? 1 } })}
            />
          </Field>
        </div>

        <div className={`${CARD} h-fit p-5`}>
          <div className="hud-label">Effective weight · actual contribution</div>
          <p className="mt-2 text-[11px] leading-relaxed text-lo">
            What actually reaches the composite, recomputed from your criteria weights and the pipeline mapping.
          </p>

          <div className="mt-5 space-y-3">
            {ew.blocks.length === 0 && <p className="text-[12px] text-mid">Add scored, mapped blocks to calculate effective weights.</p>}
            {ew.blocks.map((b) => (
              <div key={b.blockId}>
                <div className="flex justify-between text-[11px]">
                  <span className="truncate text-mid">{b.title}</span>
                  <span className="ml-2 shrink-0 font-mono text-hi">{b.pct}%</span>
                </div>
                <div className="mt-1 h-1 overflow-hidden rounded bg-surface2">
                  <div className="h-full bg-irisb" style={{ width: `${Math.min(100, b.pct)}%` }} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-6 border-t border-hairline pt-4">
            <div className="flex items-center justify-between">
              <div className="hud-label">Attribute weights</div>
              <span className="font-mono text-[9px] text-lo">CONFIGURED → EFFECTIVE</span>
            </div>
            {ew.attributes.length === 0 && <p className="mt-3 text-[12px] text-mid">Define criteria in step 02 to see the composite.</p>}
            <div className="mt-3 space-y-2">
              {ew.attributes.map((a) => (
                <div key={a.attributeId} className="flex items-center justify-between gap-3 text-[11px]">
                  <span className="flex min-w-0 items-center gap-1.5">
                    <span className={`size-1.5 shrink-0 rounded-full ${a.covered ? "bg-pos" : "bg-warn"}`} title={a.covered ? "Measured" : "Not measured by any scored block"} />
                    <span className="truncate text-mid">{a.focus ? "◉ " : ""}{a.name || "untitled"}</span>
                  </span>
                  <span className="shrink-0 font-mono">
                    <span className="text-lo">{a.configuredPct}%</span>
                    <span className="mx-1 text-lo">→</span>
                    <span className={a.covered ? "text-hi" : "text-warn"}>{a.effectivePct}%</span>
                  </span>
                </div>
              ))}
            </div>
            {ew.uncoveredPct > 0 && (
              <p className="mt-4 rounded-lg border border-warn/30 bg-warn/5 p-3 text-[11px] leading-relaxed text-warn">
                {ew.uncoveredPct}% of your configured weight measures nothing and is discarded. Map those attributes to a scored block in step 03, or remove them.
              </p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   05 · CANDIDATE EXPERIENCE
   ============================================================ */

function ExperienceStep() {
  const { draft, update } = useStudio();
  const e = draft.experience;
  const patchLanding = (next: Partial<typeof e.landing>) =>
    update((d) => ({ ...d, experience: { ...d.experience, landing: { ...d.experience.landing, ...next } } }));
  const patchNotices = (next: Partial<typeof e.notices>) =>
    update((d) => ({ ...d, experience: { ...d.experience, notices: { ...d.experience.notices, ...next } } }));
  const patchComms = (next: Partial<typeof e.comms>) =>
    update((d) => ({ ...d, experience: { ...d.experience, comms: { ...d.experience.comms, ...next } } }));

  return (
    <section>
      <StepHeading
        eyebrow="05 · Candidate Experience"
        title="Explain the process before it begins."
        text="Job-relatedness, notice, consent, accommodation and a disposition promise are product surfaces."
      />
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
        <div className={`${CARD} space-y-4 p-5`}>
          <div className="hud-label">Landing & brand</div>
          <Field label="Company blurb">
            <textarea className={`${INPUT} min-h-24`} aria-label="Company blurb" value={e.landing.companyBlurb} onChange={(ev) => patchLanding({ companyBlurb: ev.target.value })} />
          </Field>
          <Field label="Published bias-audit URL" hint="Required by NYC Local Law 144 and a strong trust signal everywhere else.">
            <input className={INPUT} aria-label="Published bias-audit URL" value={e.landing.biasAuditUrl ?? ""} onChange={(ev) => patchLanding({ biasAuditUrl: ev.target.value })} placeholder="https://…" />
          </Field>
          <Toggle checked={e.landing.showCompensation} onChange={(showCompensation) => patchLanding({ showCompensation })} label="Show compensation on landing" />
          <Field label="Candidate-facing tone">
            <Combo value={e.tone} options={CANDIDATE_TONES} allowCustom label="Candidate-facing tone" onChange={(v) => update((d) => ({ ...d, experience: { ...d.experience, tone: v as VacancyV2["experience"]["tone"] } }))} />
          </Field>

          <div className="border-t border-hairline pt-4">
            <div className="hud-label">Communication</div>
            <div className="mt-4 space-y-4">
              <Toggle checked={e.comms.confirmationEnabled} onChange={(confirmationEnabled) => patchComms({ confirmationEnabled })} label="Send an application confirmation" />
              <Field label="Reminders before the deadline" hint="Two is the researched maximum before reminders read as pressure.">
                <NumberInput value={e.comms.reminderCadence} min={0} max={2} label="Reminders before the deadline" onChange={(v) => patchComms({ reminderCadence: (v ?? 0) as 0 | 1 | 2 })} />
              </Field>
              <Field label="Sender identity">
                <Combo value={e.comms.senderIdentity} options={["org", "recruiter"]} label="Sender identity" onChange={(v) => patchComms({ senderIdentity: v as "org" | "recruiter" })} />
              </Field>
              <Toggle checked={e.comms.feedbackOffer} onChange={(feedbackOffer) => patchComms({ feedbackOffer })} label="Offer on-request structured feedback" />
            </div>
          </div>
        </div>

        <div className={`${CARD} space-y-4 p-5`}>
          <div className="hud-label">Notice & consent · v{e.notices.version}</div>
          <Field label="Jurisdiction profile" hint="Pick Custom for a jurisdiction not listed — the notice text is yours either way.">
            <Combo value={e.notices.jurisdictionProfile} options={JURISDICTION_PROFILES} allowCustom label="Jurisdiction profile" onChange={(jurisdictionProfile) => patchNotices({ jurisdictionProfile })} />
          </Field>
          <Field label="Plain-language AI disclosure">
            <textarea className={`${INPUT} min-h-32 leading-relaxed`} aria-label="Plain-language AI disclosure" value={e.notices.aiDisclosure} onChange={(ev) => patchNotices({ aiDisclosure: ev.target.value })} />
          </Field>
          <Field label="Consent checkpoints">
            <ChipMulti
              values={e.notices.consentCheckpoints}
              options={["entry", "recorded_blocks", "integrity_tier"]}
              format={words}
              allowCustom={false}
              label="consent checkpoints"
              onChange={(v) => patchNotices({ consentCheckpoints: v as typeof e.notices.consentCheckpoints })}
            />
          </Field>
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <Field label="Retention · days">
              <NumberInput value={e.notices.retentionDays} min={1} label="Retention in days" onChange={(v) => patchNotices({ retentionDays: v ?? 180 })} />
            </Field>
            <Field label="Disposition SLA · days">
              <NumberInput value={e.comms.dispositionSlaDays} min={1} label="Disposition SLA in days" onChange={(v) => patchComms({ dispositionSlaDays: v ?? 5 })} />
            </Field>
          </div>
          <p className="rounded-lg border border-hairline bg-void2 p-3 text-[10px] leading-relaxed text-lo">
            Editing the disclosure or the checkpoints raises the notice version at publish, so every candidate record stores exactly which text they consented to.
          </p>
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   06 · TEAM & GOVERNANCE
   ============================================================ */

function GovernanceStep() {
  const { draft, update } = useStudio();
  const g = draft.governance;
  const [justAdded, setJustAdded] = useState<string | null>(null);
  const nameRef = useFocusOnAppear(justAdded);

  const patchGov = (next: Partial<typeof g>) =>
    update((d) => ({ ...d, governance: { ...d.governance, ...next } }));

  const addReviewer = () => {
    const userId = uid("u");
    patchGov({ roles: [...g.roles, { userId, name: "", role: "TechnicalReviewer", piiReveal: false }] });
    setJustAdded(userId);
  };

  return (
    <section>
      <StepHeading
        eyebrow="06 · Team & Governance"
        title="Name the humans in the loop."
        text="Independent-first review, calibration and dual control turn oversight into behavior — not a policy claim."
      />
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.2fr_.8fr]">
        <div className={`${CARD} p-5`}>
          <div className="flex items-center justify-between">
            <div className="hud-label">Vacancy roster</div>
            <button aria-label="Add reviewer" className={BTN} onClick={addReviewer}><Plus className="size-3.5" /></button>
          </div>
          <div className="mt-3 divide-y divide-hairline">
            {g.roles.length === 0 && (
              <p className="py-6 text-center text-[12px] text-warn">No one is assigned. Every decision needs a named human.</p>
            )}
            {g.roles.map((person) => (
              <div key={person.userId} className="grid grid-cols-1 items-center gap-3 py-3 sm:grid-cols-[1fr_160px_96px_28px]">
                <input
                  ref={justAdded === person.userId ? nameRef : undefined}
                  aria-label="Reviewer name"
                  placeholder="name or email…"
                  className="rounded border border-transparent bg-transparent px-1 py-1 text-[13px] text-hi outline-none placeholder:text-lo hover:border-hairline focus:border-hairline-strong"
                  value={person.name}
                  onChange={(e) => patchGov({ roles: g.roles.map((r) => (r.userId === person.userId ? { ...r, name: e.target.value } : r)) })}
                />
                <Combo
                  value={person.role}
                  options={ROLES}
                  format={(v) => v.replace(/([a-z])([A-Z])/g, "$1 $2")}
                  label={`Role for ${person.name || "this reviewer"}`}
                  className="!py-1.5 !text-[12px]"
                  onChange={(v) => patchGov({ roles: g.roles.map((r) => (r.userId === person.userId ? { ...r, role: v as Role } : r)) })}
                />
                <button
                  onClick={() => patchGov({ roles: g.roles.map((r) => (r.userId === person.userId ? { ...r, piiReveal: !r.piiReveal } : r)) })}
                  aria-pressed={person.piiReveal}
                  aria-label={`Toggle identity access for ${person.name || "this reviewer"}`}
                  className={`rounded-full border px-2 py-1 font-mono text-[9px] ${person.piiReveal ? "border-irisb/50 text-irisc" : "border-hairline text-lo"}`}
                >PII REVEAL</button>
                <button
                  aria-label={`Remove ${person.name || "reviewer"}`}
                  onClick={() => patchGov({ roles: g.roles.filter((r) => r.userId !== person.userId) })}
                  className="iris-focus rounded p-1 text-lo hover:text-neg"
                ><Trash2 className="size-3.5" /></button>
              </div>
            ))}
          </div>
        </div>

        <div className={`${CARD} space-y-5 p-5`}>
          <Field label="Independent reviews required">
            <NumberInput
              value={g.reviewPolicy.independentReviews} min={1} max={3}
              label="Independent reviews required"
              onChange={(v) => patchGov({ reviewPolicy: { ...g.reviewPolicy, independentReviews: Math.min(3, Math.max(1, v ?? 1)) as 1 | 2 | 3 } })}
            />
          </Field>
          <Field label="Reviewer assignment">
            <Combo
              value={g.reviewPolicy.assignment}
              options={["round_robin", "by_expertise"]}
              format={(v) => (v === "round_robin" ? "Round robin" : "By attribute expertise")}
              label="Reviewer assignment"
              onChange={(v) => patchGov({ reviewPolicy: { ...g.reviewPolicy, assignment: v as "round_robin" | "by_expertise" } })}
            />
          </Field>
          <Field label="Dual-control batch threshold" hint="Batch actions above this size need a second approver.">
            <NumberInput value={g.dualControlThreshold} min={1} label="Dual-control batch threshold" onChange={(v) => patchGov({ dualControlThreshold: v ?? 25 })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Review queue SLA · hours">
              <NumberInput value={g.slaTargets.reviewQueueHours} min={1} label="Review queue SLA in hours" onChange={(v) => patchGov({ slaTargets: { ...g.slaTargets, reviewQueueHours: v ?? 48 } })} />
            </Field>
            <Field label="Disposition SLA · days">
              <NumberInput value={g.slaTargets.dispositionDays} min={1} label="Disposition SLA in days" onChange={(v) => patchGov({ slaTargets: { ...g.slaTargets, dispositionDays: v ?? 5 } })} />
            </Field>
          </div>
          <Toggle
            checked={g.calibrationRequired}
            onChange={(calibrationRequired) => patchGov({ calibrationRequired })}
            label="Require frame-of-reference calibration"
            help="Reviewers rate anchored practice cases before their first live review."
          />
          <Toggle
            checked={draft.rollingReview}
            onChange={(rollingReview) => update((d) => ({ ...d, rollingReview }))}
            label="Review on a rolling basis"
            help="Off means nothing is reviewed until the application window closes."
          />
        </div>
      </div>
    </section>
  );
}

/* ============================================================
   07 · PREFLIGHT / PUBLISH
   ============================================================ */

function CandidatePreview({ onClose }: { onClose: () => void }) {
  const { draft } = useStudio();
  const required = draft.pipeline.filter((b) => b.required);
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto bg-black/75 p-8" onMouseDown={(e) => { if (e.currentTarget === e.target) onClose(); }}>
      <div className="wb relative w-full max-w-3xl overflow-hidden rounded-2xl border border-black/10 p-8">
        <button aria-label="Close candidate preview" onClick={onClose} className="absolute right-5 top-5"><X className="size-4" /></button>
        <div className="font-mono text-[10px] uppercase tracking-[.1em] text-black/45">Candidate preview · sandbox</div>
        <h2 className="mt-5 max-w-xl font-display text-[34px] leading-tight">{draft.profile.title || "Untitled position"}</h2>
        <p className="mt-3 max-w-2xl text-[14px] leading-relaxed text-black/65">{draft.profile.mission || "The role mission will appear here."}</p>
        {required.length === 0 ? (
          <p className="mt-7 rounded-xl border border-black/10 bg-white p-5 text-[12px] text-black/55">No required blocks yet — candidates would have nothing to complete.</p>
        ) : (
          <div className="mt-7 grid grid-cols-3 gap-3">
            {required.map((b, i) => (
              <div key={b.id} className="rounded-xl border border-black/10 bg-white p-4">
                <div className="font-mono text-[9px] text-black/40">STEP {String(i + 1).padStart(2, "0")}</div>
                <div className="mt-2 text-[12px] font-medium">{b.title}</div>
                <div className="mt-1 text-[10px] text-black/50">{fmtMinutes(estimateMinutes(b))}</div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-6 rounded-xl bg-black p-5 text-white">
          <div className="font-mono text-[9px] text-white/45">WHAT AI DOES — AND NEVER DOES</div>
          <p className="mt-2 text-[12px] leading-relaxed text-white/75">{draft.experience.notices.aiDisclosure}</p>
        </div>
        <div className="mt-6 flex items-center justify-between">
          <span className="text-[11px] text-black/50">Accommodation or alternative-process request available at every step.</span>
          <button onClick={onClose} className="rounded-lg bg-black px-4 py-2.5 text-[12px] text-white">Continue</button>
        </div>
      </div>
    </div>
  );
}

function PreflightStep() {
  const { draft, replace, resetBlank, setStep, previewedAt, markPreviewed } = useStudio();
  const issues = preflight(draft);
  const blockers = issues.filter((i) => i.severity === "blocker");
  const warnings = issues.filter((i) => i.severity === "warning");
  const [preview, setPreview] = useState(false);
  const [published, setPublished] = useState<VacancyV2 | null>(null);
  const [copied, setCopied] = useState(false);

  const hasReviewer = draft.governance.roles.some((r) => r.role !== "Observer");
  const canPublish = blockers.length === 0 && previewedAt !== null;

  const publish = () => {
    if (!canPublish) return;
    const value = publishDraft(draft);
    replace(value);
    setPublished(value);
  };

  return (
    <section>
      <StepHeading
        eyebrow="07 · Preflight / Publish"
        title={published ? "Competition is live." : "Prove the chain is complete."}
        text="Blockers protect traceability, candidate rights and meaningful human review. Warnings require judgment."
        action={
          <button className={`${BTN} inline-flex items-center gap-2`} onClick={() => { setPreview(true); markPreviewed(); }}>
            <Eye className="size-3.5" /> Preview as candidate
          </button>
        }
      />

      {published ? (
        <div className={`${CARD} p-8 text-center`}>
          <div className="mx-auto grid size-12 place-items-center rounded-full border border-pos/40 bg-pos/10"><Check className="size-5 text-pos" /></div>
          <div className="mt-5 font-mono text-[10px] text-lo">LIVE · CONFIG V{published.configVersion} · HASH-CHAINED AUDIT</div>
          <h2 className="mt-2 font-display text-[28px]">{published.profile.title}</h2>
          <button
            aria-label={`Copy competition code ${published.code}`}
            onClick={async () => {
              try { await navigator.clipboard.writeText(published.code); } catch { /* clipboard blocked — the code is on screen */ }
              setCopied(true);
              window.setTimeout(() => setCopied(false), 1800);
            }}
            className="mx-auto mt-6 flex items-center gap-3 rounded-xl border border-hairline bg-surface2 px-6 py-4 font-mono text-[25px] tracking-[.2em]"
          >
            <span>{published.code}</span><Copy className="size-4 text-lo" />
          </button>
          <div aria-live="polite" className={`mt-2 min-h-4 font-mono text-[10px] ${copied ? "text-pos" : "text-transparent"}`}>{copied ? "COPIED TO CLIPBOARD" : "COPY READY"}</div>
          <p className="mx-auto mt-4 max-w-md text-[11px] leading-relaxed text-lo">
            Candidates enter this code on the landing page. Config version {published.configVersion} is frozen — later edits create a new version.
          </p>
          <div className="mt-6 flex justify-center gap-3">
            <button onClick={() => resetBlank()} className={BTN}><RotateCcw className="mr-2 inline size-3.5" />Create another</button>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
          <div className={`${CARD} overflow-hidden`}>
            <div className="flex items-center justify-between border-b border-hairline px-5 py-4">
              <div className="hud-label">Continuous validation</div>
              <span className={`font-mono text-[10px] ${blockers.length ? "text-neg" : "text-pos"}`}>
                {blockers.length ? `${blockers.length} BLOCKER${blockers.length === 1 ? "" : "S"}` : "BLOCKERS CLEAR"}
                {warnings.length > 0 && <span className="ml-2 text-warn">{warnings.length} WARNING{warnings.length === 1 ? "" : "S"}</span>}
              </span>
            </div>
            <div className="divide-y divide-hairline">
              {issues.length === 0 && (
                <div className="flex items-center gap-3 p-5 text-[13px] text-pos">
                  <ShieldCheck className="size-4" /> The configured chain passes every automated check.
                </div>
              )}
              {issues.map((issue: PreflightIssue) => (
                <button
                  key={issue.id}
                  onClick={() => setStep(issue.step)}
                  className="flex w-full items-start gap-3 p-4 text-left hover:bg-surface2"
                >
                  {issue.severity === "blocker"
                    ? <X className="mt-0.5 size-4 shrink-0 text-neg" />
                    : <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warn" />}
                  <span className="min-w-0">
                    <span className="block font-mono text-[9px] uppercase text-lo">
                      Step {issue.step} · {STEPS[issue.step - 1][0]} · {issue.severity}
                    </span>
                    <span className="mt-1 block text-[12px] leading-relaxed text-mid">{issue.message}</span>
                  </span>
                  <ChevronRight className="ml-auto mt-0.5 size-3.5 shrink-0 text-lo" />
                </button>
              ))}
            </div>
          </div>

          <div className={`${CARD} h-fit p-5`}>
            <div className="hud-label">Publish gate</div>
            <div className="mt-4 space-y-3 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="text-mid">Automated blockers</span>
                <span className={blockers.length ? "text-neg" : "text-pos"}>{blockers.length ? blockers.length : "clear"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-mid">Candidate preview</span>
                <span className={previewedAt ? "text-pos" : "text-warn"}>{previewedAt ? "reviewed" : "required"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-mid">Human reviewer</span>
                <span className={hasReviewer ? "text-pos" : "text-neg"}>{hasReviewer ? "assigned" : "missing"}</span>
              </div>
            </div>

            <button
              disabled={!canPublish}
              onClick={publish}
              className="mt-5 w-full rounded-lg bg-paper px-4 py-3 text-[13px] font-medium text-void disabled:cursor-not-allowed disabled:opacity-25"
            >Freeze config & publish</button>

            {/* Say exactly what is missing — a disabled button with no reason is
                the "unexplained problem" this gate used to present. */}
            {!canPublish && (
              <p className="mt-3 text-[11px] leading-relaxed text-warn">
                {blockers.length > 0
                  ? `Resolve ${blockers.length} blocker${blockers.length === 1 ? "" : "s"} first — select one to jump to it.`
                  : "Open “Preview as candidate” once before publishing."}
              </p>
            )}
            {!previewedAt && blockers.length === 0 && (
              <button className={`${BTN} mt-2 w-full`} onClick={() => { setPreview(true); markPreviewed(); }}>
                <Eye className="mr-2 inline size-3.5" />Preview now
              </button>
            )}

            <p className="mt-3 text-[10px] leading-relaxed text-lo">
              Publishing freezes criteria, rubrics, prompts and notices into config version {draft.configVersion}. Later edits create a new version.
            </p>
          </div>
        </div>
      )}

      {preview && <CandidatePreview onClose={() => setPreview(false)} />}
    </section>
  );
}

/* ============================================================
   RAIL + SHELL
   ============================================================ */

function ImpactPanel() {
  const { draft, savedAt } = useStudio();
  const impact = impactSummary(draft);
  const coverage = coverageMatrix(draft);
  const covered = coverage.filter((item) => item.ok).length;
  const issueCount = impact.lint.blockers + impact.lint.warnings;

  return (
    <aside className="sticky top-[72px] h-fit space-y-3">
      <div className={`${CARD} p-4`}>
        <div className="text-[12px] font-medium text-hi">Quick check</div>
        <div className="mt-4 space-y-3 text-[12px]">
          <div className="flex items-center justify-between">
            <span className="text-mid">Candidate time</span>
            <span className={impact.totalMinutes > 45 ? "text-warn" : "text-hi"}>{fmtMinutes(impact.totalMinutes)}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-mid">Criteria covered</span>
            <span className={coverage.length > 0 && covered < coverage.length ? "text-warn" : "text-hi"}>{covered} of {coverage.length}</span>
          </div>
          {impact.validityBand && (
            <div className="flex items-center justify-between">
              <span className="text-mid">Est. validity</span>
              <span className="font-mono text-hi">ρ {impact.validityBand.lo}–{impact.validityBand.hi}</span>
            </div>
          )}
          <div className="flex items-center justify-between">
            <span className="text-mid">Issues to review</span>
            <span className={impact.lint.blockers ? "text-neg" : issueCount ? "text-warn" : "text-pos"}>{issueCount || "None"}</span>
          </div>
          {coverage.length > 0 && (
            <div className="flex gap-1 pt-1">
              {coverage.map((item) => (
                <span key={item.attributeId} title={`${item.attributeName} — ${item.ok ? "covered" : "not measured"}`} className={`h-1 flex-1 rounded ${item.ok ? "bg-pos" : "bg-warn"}`} />
              ))}
            </div>
          )}
        </div>
      </div>

      {impact.adverseImpactNotes.length > 0 && (
        <div className={`${CARD} p-4`}>
          <div className="hud-label">Fairness cautions</div>
          <div className="mt-3 space-y-3">
            {impact.adverseImpactNotes.map((note) => (
              <p key={note} className="text-[11px] leading-relaxed text-warn">{note}</p>
            ))}
          </div>
        </div>
      )}

      <p className="px-1 font-mono text-[9px] text-lo">
        {savedAt
          ? `DRAFT SAVED ${new Date(savedAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
          : "DRAFT SAVES AUTOMATICALLY"}
      </p>
    </aside>
  );
}

export default function VacancyStudio() {
  const { draft, entered, step, setStep, resetBlank, hydrated } = useStudio();
  const issues = useMemo(() => preflight(draft), [draft]);

  /* Don't paint the entry picker before localStorage has been read, or a saved
     draft flashes as "no draft" for a frame and the resume offer never shows. */
  if (!hydrated) return <div className="min-h-[calc(100vh-52px)] bg-void2" />;
  if (!entered) return <Entry />;

  const panels = [
    <ProfileStep key="p" />, <CriteriaStep key="c" />, <PipelineStep key="pl" />,
    <ScoringStep key="s" />, <ExperienceStep key="e" />, <GovernanceStep key="g" />,
    <PreflightStep key="pf" />,
  ];

  return (
    <div className="grid min-h-[calc(100vh-52px)] grid-cols-1 bg-void2 lg:grid-cols-[214px_minmax(0,1fr)]">
      <nav className="border-b border-hairline bg-void px-3 py-5 lg:border-b-0 lg:border-r" aria-label="Studio steps">
        <div className="px-3">
          <div className="hud-label">Vacancy Studio</div>
          <div className="mt-2 truncate text-[13px] text-hi">{draft.profile.title || "Untitled vacancy"}</div>
          <div className="mt-1 font-mono text-[9px] text-lo">DRAFT · CONFIG V{draft.configVersion}</div>
        </div>
        <div className="mt-6 space-y-1">
          {STEPS.map(([name, sub], i) => {
            const stepIssues = issues.filter((x) => x.step === i + 1);
            const blockerCount = stepIssues.filter((x) => x.severity === "blocker").length;
            const warnCount = stepIssues.length - blockerCount;
            const active = step === i + 1;
            return (
              <button
                key={name}
                onClick={() => setStep(i + 1)}
                aria-current={active ? "step" : undefined}
                className={`w-full rounded-lg border px-3 py-2.5 text-left ${active ? "border-hairline-strong bg-surface" : "border-transparent hover:bg-surface/60"}`}
              >
                <div className="flex items-center gap-2">
                  <span className={`font-mono text-[9px] ${active ? "text-irisc" : "text-lo"}`}>{String(i + 1).padStart(2, "0")}</span>
                  <span className={`text-[11px] ${active ? "text-hi" : "text-mid"}`}>{name}</span>
                  {blockerCount > 0
                    ? <span title={`${blockerCount} blocker${blockerCount === 1 ? "" : "s"}`} className="ml-auto size-1.5 rounded-full bg-neg" />
                    : warnCount > 0
                      ? <span title={`${warnCount} warning${warnCount === 1 ? "" : "s"}`} className="ml-auto size-1.5 rounded-full bg-warn" />
                      : null}
                </div>
                {active && <div className="ml-6 mt-0.5 text-[9px] text-lo">{sub}</div>}
              </button>
            );
          })}
        </div>
        <button onClick={resetBlank} className="mt-6 flex w-full items-center gap-2 px-3 py-2 text-[10px] text-lo hover:text-hi">
          <RotateCcw className="size-3" /> Change entry mode
        </button>
      </nav>

      <div className="grid grid-cols-1 gap-5 px-6 py-7 xl:grid-cols-[minmax(0,1fr)_210px]">
        <main className="min-w-0">{panels[step - 1]}</main>
        <ImpactPanel />
      </div>
    </div>
  );
}
