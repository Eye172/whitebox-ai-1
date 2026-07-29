"use client";

/* Per-kind block settings editors (SPEC §4.4.1–19).

   Every block in the pipeline is an actual instrument, not a card with a label:
   the questions a candidate is asked, the knockout items, the form fields, the
   rubric dimensions and their anchors are all authored here and are the same
   objects the runtime and the scoring engine read. Nothing on this surface is
   decorative — if it renders, it is editable and it changes the config. */

import { useState } from "react";
import { ChevronDown, ChevronRight, Plus, Sparkles, Trash2 } from "lucide-react";
import { draftQuestion, draftSjtItem } from "@/lib/ai";
import { BTN, CARD, ChipMulti, Combo, Field, INPUT, LABEL, NumberInput, TagList, Toggle } from "./fields";
import type {
  AttributeSpec, BlockSettings, FormField, FormFieldType, InterviewQuestion,
  KnockoutItem, KnowledgeItem, PipelineBlock, QuestionType, RubricDimension,
  Seniority, SjtItem,
} from "@/lib/types";

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;
const words = (v: string) => v.replaceAll("_", " ");

interface EditorProps {
  block: PipelineBlock;
  attrs: AttributeSpec[];
  seniority: Seniority;
  onSettings: (s: BlockSettings) => void;
}

/* ---------- small shared pieces ---------- */

function Row({ children, onRemove, label }: { children: React.ReactNode; onRemove?: () => void; label?: string }) {
  return (
    <div className="rounded-lg border border-hairline bg-void2 p-3">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-3">{children}</div>
        {onRemove && (
          <button type="button" onClick={onRemove} aria-label={label ? `Remove ${label}` : "Remove"} className="iris-focus mt-0.5 rounded p-1 text-lo hover:text-neg">
            <Trash2 className="size-3.5" />
          </button>
        )}
      </div>
    </div>
  );
}

function AddButton({ onClick, children }: { onClick: () => void; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} className={`${BTN} inline-flex items-center gap-1.5`}>
      <Plus className="size-3.5" /> {children}
    </button>
  );
}

function Empty({ text }: { text: string }) {
  return <p className="rounded-lg border border-dashed border-hairline p-4 text-center text-[11px] text-lo">{text}</p>;
}

/* Attribute binding — the single rule that makes a scored item traceable:
   exactly one attribute per scored item (SPEC §4.4.4, preflight enforces it). */
function AttributePicker({
  value, attrs, onChange, label = "Scores attribute", allowNone = false,
}: { value: string | undefined; attrs: AttributeSpec[]; onChange: (id: string) => void; label?: string; allowNone?: boolean }) {
  return (
    <Field label={label}>
      <select
        className={INPUT}
        aria-label={label}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{allowNone ? "Not scored" : "— bind an attribute —"}</option>
        {attrs.map((a) => <option key={a.id} value={a.id}>{a.focus ? "◉ " : ""}{a.name}</option>)}
      </select>
      {attrs.length === 0 && <p className="mt-1 text-[10px] text-warn">Define criteria in step 02 first — scored items must bind to an attribute.</p>}
    </Field>
  );
}

/* BARS anchors 1..5 — the rubric a human and the model both read. */
function AnchorsEditor({
  anchors, onChange,
}: { anchors: [string, string, string, string, string]; onChange: (a: [string, string, string, string, string]) => void }) {
  return (
    <div className="space-y-1.5">
      <span className={LABEL}>Rubric anchors · level 1 → 5</span>
      {anchors.map((a, i) => (
        <div key={i} className="flex items-start gap-2">
          <span className="mt-2 w-4 shrink-0 text-right font-mono text-[10px] text-lo">{i + 1}</span>
          <textarea
            className={`${INPUT} min-h-14 py-2 text-[12px] leading-relaxed`}
            aria-label={`Anchor for level ${i + 1}`}
            value={a}
            onChange={(e) => {
              const next = [...anchors] as [string, string, string, string, string];
              next[i] = e.target.value;
              onChange(next);
            }}
          />
        </div>
      ))}
    </div>
  );
}

/* ---------- interviews (async / live / chat) ---------- */

const QUESTION_TYPES: QuestionType[] = ["behavioral", "situational", "background", "job_knowledge", "motivation"];

function QuestionEditor({
  q, attrs, onChange, onRemove,
}: { q: InterviewQuestion; attrs: AttributeSpec[]; onChange: (q: InterviewQuestion) => void; onRemove: () => void }) {
  const [open, setOpen] = useState(false);
  const bound = attrs.find((a) => a.id === q.attributeId);
  return (
    <Row onRemove={onRemove} label="question">
      <div className="flex items-start gap-2">
        <button type="button" onClick={() => setOpen(!open)} aria-expanded={open} aria-label={open ? "Collapse question" : "Expand question"} className="iris-focus mt-1.5 rounded text-lo hover:text-hi">
          {open ? <ChevronDown className="size-3.5" /> : <ChevronRight className="size-3.5" />}
        </button>
        <textarea
          className={`${INPUT} min-h-16 leading-relaxed`}
          aria-label="Question text"
          value={q.text}
          onChange={(e) => onChange({ ...q, text: e.target.value, source: "manual" })}
        />
      </div>
      <div className="flex flex-wrap items-center gap-2 pl-6 text-[10px]">
        <span className={`rounded-full border px-2 py-0.5 ${bound ? "border-hairline text-lo" : "border-neg/50 text-neg"}`}>
          {bound ? bound.name : "unbound — not scoreable"}
        </span>
        <span className="rounded-full border border-hairline px-2 py-0.5 text-lo">{words(q.type)}</span>
        <span className="rounded-full border border-hairline px-2 py-0.5 text-lo">{q.modality}</span>
        <span className="font-mono text-lo">{q.answerCapSec}s cap</span>
      </div>
      {open && (
        <div className="space-y-4 border-t border-hairline pl-6 pt-3">
          <div className="grid grid-cols-2 gap-3">
            <AttributePicker
              value={q.attributeId}
              attrs={attrs}
              onChange={(attributeId) => {
                const attr = attrs.find((a) => a.id === attributeId);
                onChange({
                  ...q,
                  attributeId,
                  /* the rubric follows the attribute — a rubric bound to a
                     different attribute than its question is the exact silent
                     mis-scoring preflight exists to prevent */
                  rubric: {
                    ...q.rubric,
                    attributeId,
                    anchors: attr ? ([...attr.scale.anchors] as [string, string, string, string, string]) : q.rubric.anchors,
                    version: q.rubric.version + 1,
                  },
                });
              }}
            />
            <Field label="Question type">
              <Combo value={q.type} options={QUESTION_TYPES} format={words} onChange={(v) => onChange({ ...q, type: v as QuestionType })} label="Question type" />
            </Field>
            <Field label="Think time · seconds">
              <NumberInput
                value={q.thinkTimeSec ?? undefined}
                min={0} max={300}
                placeholder="untimed"
                label="Think time in seconds"
                onChange={(v) => onChange({ ...q, thinkTimeSec: (v ?? null) as InterviewQuestion["thinkTimeSec"] })}
              />
            </Field>
            <Field label="Answer cap · seconds">
              <NumberInput value={q.answerCapSec} min={30} max={600} label="Answer cap in seconds" onChange={(v) => onChange({ ...q, answerCapSec: v ?? 180 })} />
            </Field>
            <Field label="Response modality">
              <Combo value={q.modality} options={["video", "audio", "text"]} onChange={(v) => onChange({ ...q, modality: v as InterviewQuestion["modality"] })} label="Response modality" />
            </Field>
            <Field label="Re-record attempts">
              <NumberInput value={q.reRecordAttempts} min={0} max={3} label="Re-record attempts" onChange={(v) => onChange({ ...q, reRecordAttempts: Math.min(3, Math.max(0, v ?? 0)) as 0 | 1 | 2 | 3 })} />
            </Field>
          </div>
          <Field label="Pre-approved probes" hint="The only follow-ups the interviewer may ask. Anchored probing keeps every candidate on the same structure (R-I.8).">
            <TagList values={q.probes} onChange={(probes) => onChange({ ...q, probes })} label="probes" placeholder="Add a probe and press Enter" />
          </Field>
          <Toggle checked={q.notesAllowed} onChange={(notesAllowed) => onChange({ ...q, notesAllowed })} label="Candidate may keep notes" />
          <AnchorsEditor
            anchors={q.rubric.anchors}
            onChange={(anchors) => onChange({ ...q, rubric: { ...q.rubric, anchors, version: q.rubric.version + 1 } })}
          />
          {q.rationale && <p className="text-[10px] leading-relaxed text-lo">{q.rationale}</p>}
        </div>
      )}
    </Row>
  );
}

function QuestionsEditor({
  questions, attrs, seniority, onChange,
}: { questions: InterviewQuestion[]; attrs: AttributeSpec[]; seniority: Seniority; onChange: (q: InterviewQuestion[]) => void }) {
  const addFor = (attr: AttributeSpec) =>
    onChange([...questions, draftQuestion(attr, attr.kind === "knowledge" ? "job_knowledge" : "behavioral", seniority)]);
  const uncovered = attrs.filter((a) => !questions.some((q) => q.attributeId === a.id));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={LABEL}>Questions · {questions.length}</span>
        <div className="flex flex-wrap justify-end gap-1.5">
          {uncovered.slice(0, 3).map((a) => (
            <button key={a.id} type="button" onClick={() => addFor(a)} className={`${BTN} inline-flex items-center gap-1 py-1 text-[10px]`}>
              <Sparkles className="size-3" /> {a.name}
            </button>
          ))}
        </div>
      </div>
      {questions.length === 0 && <Empty text="No questions yet. Draft one per attribute, or add a blank question and write it yourself." />}
      {questions.map((q, i) => (
        <QuestionEditor
          key={q.id}
          q={q}
          attrs={attrs}
          onChange={(next) => onChange(questions.map((x, xi) => (xi === i ? next : x)))}
          onRemove={() => onChange(questions.filter((_, xi) => xi !== i))}
        />
      ))}
      <AddButton
        onClick={() => {
          const attr = uncovered[0] ?? attrs[0];
          if (attr) { addFor(attr); return; }
          onChange([...questions, {
            id: uid("q"), text: "", attributeId: "", type: "behavioral",
            thinkTimeSec: 30, answerCapSec: 180, modality: "video", reRecordAttempts: 1,
            notesAllowed: true, probes: [],
            rubric: { id: uid("r"), attributeId: "", anchors: ["", "", "", "", ""], version: 1 },
            source: "manual",
          }]);
        }}
      >Add question</AddButton>
    </div>
  );
}

/* ---------- knockout ---------- */

function KnockoutEditor({ items, onChange }: { items: KnockoutItem[]; onChange: (i: KnockoutItem[]) => void }) {
  const patch = (i: number, next: Partial<KnockoutItem>) =>
    onChange(items.map((x, xi) => (xi === i ? { ...x, ...next } : x)));
  return (
    <div className="space-y-2">
      <span className={LABEL}>Minimum-requirement items · {items.length}</span>
      {items.length === 0 && <Empty text="No knockout items. Add one only for a documented, job-related minimum requirement." />}
      {items.map((item, i) => (
        <Row key={item.id} onRemove={() => onChange(items.filter((_, xi) => xi !== i))} label="knockout item">
          <Field label="Question"><input className={INPUT} aria-label="Knockout question" value={item.question} onChange={(e) => patch(i, { question: e.target.value })} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Answer type">
              <Combo
                value={item.type}
                options={["yes_no", "numeric_threshold", "single_choice", "multi_must_include"]}
                format={words}
                label="Answer type"
                onChange={(v) => patch(i, { type: v as KnockoutItem["type"] })}
              />
            </Field>
            {item.type === "numeric_threshold" && (
              <Field label="Minimum accepted"><NumberInput value={item.threshold} min={0} label="Minimum accepted" onChange={(threshold) => patch(i, { threshold })} /></Field>
            )}
            {item.type === "yes_no" && (
              <Field label="Passing answer">
                <Combo value={item.passValue === false ? "No" : "Yes"} options={["Yes", "No"]} label="Passing answer" onChange={(v) => patch(i, { passValue: v === "Yes" })} />
              </Field>
            )}
          </div>
          {(item.type === "single_choice" || item.type === "multi_must_include") && (
            <Field label="Options" hint="Mark the options that disqualify (single choice) or that must be included (multi).">
              <div className="space-y-1.5">
                {(item.options ?? []).map((o, oi) => (
                  <div key={o.id} className="flex items-center gap-2">
                    <input
                      className={INPUT}
                      aria-label={`Option ${oi + 1}`}
                      value={o.text}
                      onChange={(e) => patch(i, { options: (item.options ?? []).map((x, xi) => (xi === oi ? { ...x, text: e.target.value } : x)) })}
                    />
                    <button
                      type="button"
                      onClick={() => patch(i, {
                        options: (item.options ?? []).map((x, xi) => xi === oi
                          ? item.type === "single_choice" ? { ...x, disqualifies: !x.disqualifies } : { ...x, mustInclude: !x.mustInclude }
                          : x),
                      })}
                      className={`shrink-0 rounded-full border px-2 py-1 font-mono text-[9px] ${(item.type === "single_choice" ? o.disqualifies : o.mustInclude) ? "border-neg/50 text-neg" : "border-hairline text-lo"}`}
                    >{item.type === "single_choice" ? "DISQUALIFIES" : "REQUIRED"}</button>
                    <button type="button" aria-label={`Remove option ${oi + 1}`} onClick={() => patch(i, { options: (item.options ?? []).filter((_, xi) => xi !== oi) })} className="shrink-0 text-lo hover:text-neg"><Trash2 className="size-3.5" /></button>
                  </div>
                ))}
                <AddButton onClick={() => patch(i, { options: [...(item.options ?? []), { id: uid("o"), text: "" }] })}>Add option</AddButton>
              </div>
            </Field>
          )}
          <Field label="What the candidate is told" hint="Legally neutral wording. Every failed knockout still lands in a human tray.">
            <textarea className={`${INPUT} min-h-16 leading-relaxed`} aria-label="Rejection text" value={item.rejectionText} onChange={(e) => patch(i, { rejectionText: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Toggle checked={!item.immediate} onChange={(v) => patch(i, { immediate: !v })} label="Route to human tray" help="Off means the answer disqualifies immediately." />
            <Toggle checked={item.allowAppeal} onChange={(allowAppeal) => patch(i, { allowAppeal })} label="Allow an explanation" />
          </div>
        </Row>
      ))}
      <AddButton
        onClick={() => onChange([...items, {
          id: uid("ko"), question: "", type: "yes_no", passValue: true, immediate: false,
          rejectionText: "This role states a minimum requirement that your answer does not meet. If your background covers it differently, tell us — a person reads every case.",
          allowAppeal: true,
        }])}
      >Add requirement</AddButton>
    </div>
  );
}

/* ---------- application form ---------- */

const FIELD_TYPES: FormFieldType[] = [
  "short_text", "long_text", "single_choice", "multi_choice", "dropdown", "date", "number", "file", "url", "consent",
];
const CHOICE_TYPES = new Set<string>(["single_choice", "multi_choice", "dropdown"]);

function FormFieldsEditor({ fields, onChange }: { fields: FormField[]; onChange: (f: FormField[]) => void }) {
  const patch = (i: number, next: Partial<FormField>) => onChange(fields.map((x, xi) => (xi === i ? { ...x, ...next } : x)));
  return (
    <div className="space-y-2">
      <span className={LABEL}>Fields · {fields.length}</span>
      {fields.map((f, i) => (
        <Row key={f.id} onRemove={f.pii && f.required ? undefined : () => onChange(fields.filter((_, xi) => xi !== i))} label={f.label}>
          <div className="grid grid-cols-[1fr_170px] gap-3">
            <Field label="Label"><input className={INPUT} aria-label={`Field label ${i + 1}`} value={f.label} onChange={(e) => patch(i, { label: e.target.value })} /></Field>
            <Field label="Type">
              <Combo value={f.type} options={FIELD_TYPES} format={words} label="Field type" onChange={(v) => patch(i, { type: v as FormFieldType })} />
            </Field>
          </div>
          {CHOICE_TYPES.has(f.type) && (
            <Field label="Options" hint="Add a points value to score an option as rational biodata — keyed biodata is a strong, low-adverse-impact predictor.">
              <div className="space-y-1.5">
                {(f.options ?? []).map((o, oi) => (
                  <div key={o.id} className="flex items-center gap-2">
                    <input className={INPUT} aria-label={`Option ${oi + 1}`} value={o.text} onChange={(e) => patch(i, { options: (f.options ?? []).map((x, xi) => (xi === oi ? { ...x, text: e.target.value } : x)) })} />
                    {f.scored && (
                      <span className="w-20 shrink-0">
                        <NumberInput value={o.points} placeholder="pts" label={`Points for option ${oi + 1}`} onChange={(points) => patch(i, { options: (f.options ?? []).map((x, xi) => (xi === oi ? { ...x, points } : x)) })} />
                      </span>
                    )}
                    <button type="button" aria-label={`Remove option ${oi + 1}`} onClick={() => patch(i, { options: (f.options ?? []).filter((_, xi) => xi !== oi) })} className="shrink-0 text-lo hover:text-neg"><Trash2 className="size-3.5" /></button>
                  </div>
                ))}
                <AddButton onClick={() => patch(i, { options: [...(f.options ?? []), { id: uid("o"), text: "" }] })}>Add option</AddButton>
              </div>
            </Field>
          )}
          <div className="grid grid-cols-3 gap-3">
            <Toggle checked={f.required} onChange={(required) => patch(i, { required })} label="Required" />
            <Toggle checked={f.pii} onChange={(pii) => patch(i, { pii })} label="Personal data" help="Masked in review." />
            <Toggle checked={f.scored} onChange={(scored) => patch(i, { scored })} label="Scored" />
          </div>
        </Row>
      ))}
      <AddButton onClick={() => onChange([...fields, { id: uid("fld"), label: "", type: "short_text", required: false, pii: false, scored: false }])}>Add field</AddButton>
    </div>
  );
}

/* ---------- rubric dimensions (work sample / coding / case / custom) ---------- */

function RubricDimensionsEditor({ dims, onChange }: { dims: RubricDimension[]; onChange: (d: RubricDimension[]) => void }) {
  const sum = dims.reduce((a, d) => a + d.weight, 0);
  const patch = (i: number, next: Partial<RubricDimension>) => onChange(dims.map((x, xi) => (xi === i ? { ...x, ...next } : x)));
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className={LABEL}>Rubric dimensions · {dims.length}</span>
        <span className={`font-mono text-[10px] ${dims.length === 0 || sum === 100 ? "text-lo" : "text-warn"}`}>{sum}/100</span>
      </div>
      {dims.length === 0 && <Empty text="No dimensions yet. Score the exercise on 2–6 named dimensions — variance clusters by exercise, not by trait." />}
      {dims.map((d, i) => (
        <Row key={d.id} onRemove={() => onChange(dims.filter((_, xi) => xi !== i))} label={d.name || "dimension"}>
          <div className="grid grid-cols-[1fr_100px] gap-3">
            <Field label="Dimension"><input className={INPUT} aria-label={`Dimension ${i + 1}`} value={d.name} onChange={(e) => patch(i, { name: e.target.value })} /></Field>
            <Field label="Weight %"><NumberInput value={d.weight} min={0} max={100} label={`Weight for ${d.name || `dimension ${i + 1}`}`} onChange={(weight) => patch(i, { weight: weight ?? 0 })} /></Field>
          </div>
          <AnchorsEditor anchors={d.anchors} onChange={(anchors) => patch(i, { anchors })} />
        </Row>
      ))}
      <div className="flex gap-2">
        <AddButton onClick={() => onChange([...dims, { id: uid("dim"), name: "", weight: dims.length === 0 ? 100 : 0, anchors: ["", "", "", "", ""] }])}>Add dimension</AddButton>
        {dims.length > 1 && (
          <button
            type="button"
            className={BTN}
            onClick={() => {
              const base = Math.floor(100 / dims.length);
              const rem = 100 - base * dims.length;
              onChange(dims.map((d, i) => ({ ...d, weight: base + (i < rem ? 1 : 0) })));
            }}
          >Distribute equally</button>
        )}
      </div>
    </div>
  );
}

/* ---------- SJT / job knowledge item banks ---------- */

function SjtEditor({
  items, attrs, industry, onChange,
}: { items: SjtItem[]; attrs: AttributeSpec[]; industry: string; onChange: (i: SjtItem[]) => void }) {
  const patch = (i: number, next: Partial<SjtItem>) => onChange(items.map((x, xi) => (xi === i ? { ...x, ...next } : x)));
  return (
    <div className="space-y-2">
      <span className={LABEL}>Scenario items · {items.length}</span>
      {items.length === 0 && <Empty text="No scenarios yet. Draft one against an attribute, then have an SME review it before it can score." />}
      {items.map((item, i) => (
        <Row key={item.id} onRemove={() => onChange(items.filter((_, xi) => xi !== i))} label={`scenario ${i + 1}`}>
          <Field label={`Scenario ${i + 1}`}>
            <textarea className={`${INPUT} min-h-20 leading-relaxed`} aria-label={`Scenario ${i + 1}`} value={item.scenario} onChange={(e) => patch(i, { scenario: e.target.value })} />
          </Field>
          <AttributePicker value={item.attributeId} attrs={attrs} onChange={(attributeId) => patch(i, { attributeId })} />
          <Field label="Response options · key score 0–3">
            <div className="space-y-1.5">
              {item.options.map((o, oi) => (
                <div key={o.id} className="flex items-center gap-2">
                  <input className={INPUT} aria-label={`Option ${oi + 1}`} value={o.text} onChange={(e) => patch(i, { options: item.options.map((x, xi) => (xi === oi ? { ...x, text: e.target.value } : x)) })} />
                  <span className="w-16 shrink-0">
                    <NumberInput value={o.keyScore} min={0} max={3} label={`Key score option ${oi + 1}`} onChange={(keyScore) => patch(i, { options: item.options.map((x, xi) => (xi === oi ? { ...x, keyScore: keyScore ?? 0 } : x)) })} />
                  </span>
                  <button type="button" aria-label={`Remove option ${oi + 1}`} onClick={() => patch(i, { options: item.options.filter((_, xi) => xi !== oi) })} className="shrink-0 text-lo hover:text-neg"><Trash2 className="size-3.5" /></button>
                </div>
              ))}
              <AddButton onClick={() => patch(i, { options: [...item.options, { id: uid("o"), text: "", keyScore: 0 }] })}>Add option</AddButton>
            </div>
          </Field>
          <Toggle checked={item.smeReviewed} onChange={(smeReviewed) => patch(i, { smeReviewed })} label="Reviewed by a subject-matter expert" help="Generated items only become scoreable after this check." />
        </Row>
      ))}
      <AddButton
        onClick={() => {
          const attr = attrs[items.length % Math.max(1, attrs.length)];
          onChange([...items, attr
            ? draftSjtItem(attr, industry as never, items.length)
            : { id: uid("sjt"), scenario: "", mediaKind: "text", options: [], attributeId: "", smeReviewed: false }]);
        }}
      >Add scenario</AddButton>
    </div>
  );
}

function KnowledgeEditor({ items, attrs, onChange }: { items: KnowledgeItem[]; attrs: AttributeSpec[]; onChange: (i: KnowledgeItem[]) => void }) {
  const patch = (i: number, next: Partial<KnowledgeItem>) => onChange(items.map((x, xi) => (xi === i ? { ...x, ...next } : x)));
  const needsOptions = (t: string) => t === "mcq_single" || t === "mcq_multi";
  return (
    <div className="space-y-2">
      <span className={LABEL}>Items · {items.length}</span>
      {items.length === 0 && <Empty text="No items yet. Job-knowledge tests are the highest-validity test block — write items about what the role actually uses." />}
      {items.map((item, i) => (
        <Row key={item.id} onRemove={() => onChange(items.filter((_, xi) => xi !== i))} label={`item ${i + 1}`}>
          <Field label={`Prompt ${i + 1}`}>
            <textarea className={`${INPUT} min-h-16 leading-relaxed`} aria-label={`Prompt ${i + 1}`} value={item.prompt} onChange={(e) => patch(i, { prompt: e.target.value })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Item type">
              <Combo value={item.type} options={["mcq_single", "mcq_multi", "true_false_justify", "short_answer", "image_hotspot", "sequence"]} format={words} label="Item type" onChange={(v) => patch(i, { type: v as KnowledgeItem["type"] })} />
            </Field>
            <Field label="Difficulty">
              <Combo value={item.difficulty} options={["easy", "medium", "hard"]} label="Difficulty" onChange={(v) => patch(i, { difficulty: v as KnowledgeItem["difficulty"] })} />
            </Field>
          </div>
          <AttributePicker value={item.attributeId} attrs={attrs} onChange={(attributeId) => patch(i, { attributeId })} />
          {needsOptions(item.type) && (
            <Field label="Options · mark the correct ones">
              <div className="space-y-1.5">
                {(item.options ?? []).map((o, oi) => (
                  <div key={o.id} className="flex items-center gap-2">
                    <input className={INPUT} aria-label={`Option ${oi + 1}`} value={o.text} onChange={(e) => patch(i, { options: (item.options ?? []).map((x, xi) => (xi === oi ? { ...x, text: e.target.value } : x)) })} />
                    <button
                      type="button"
                      aria-pressed={!!o.correct}
                      onClick={() => patch(i, { options: (item.options ?? []).map((x, xi) => (xi === oi ? { ...x, correct: !x.correct } : x)) })}
                      className={`shrink-0 rounded-full border px-2 py-1 font-mono text-[9px] ${o.correct ? "border-pos/50 text-pos" : "border-hairline text-lo"}`}
                    >CORRECT</button>
                    <button type="button" aria-label={`Remove option ${oi + 1}`} onClick={() => patch(i, { options: (item.options ?? []).filter((_, xi) => xi !== oi) })} className="shrink-0 text-lo hover:text-neg"><Trash2 className="size-3.5" /></button>
                  </div>
                ))}
                <AddButton onClick={() => patch(i, { options: [...(item.options ?? []), { id: uid("o"), text: "" }] })}>Add option</AddButton>
              </div>
            </Field>
          )}
          {item.type === "short_answer" && (
            <>
              <Field label="Model answer"><textarea className={`${INPUT} min-h-16`} aria-label="Model answer" value={item.modelAnswer ?? ""} onChange={(e) => patch(i, { modelAnswer: e.target.value })} /></Field>
              <Field label="Key points"><TagList values={item.keyPoints ?? []} onChange={(keyPoints) => patch(i, { keyPoints })} label="key points" /></Field>
            </>
          )}
        </Row>
      ))}
      <AddButton onClick={() => onChange([...items, { id: uid("ki"), type: "mcq_single", prompt: "", options: [], difficulty: "medium", attributeId: attrs[0]?.id ?? "" }])}>Add item</AddButton>
    </div>
  );
}

/* ---------- the switch ---------- */

export default function BlockSettingsEditor({ block, attrs, seniority, onSettings }: EditorProps) {
  const s = block.settings;

  switch (s.kind) {
    case "application_form":
      return (
        <div className="space-y-4">
          <FormFieldsEditor fields={s.fields} onChange={(fields) => onSettings({ ...s, fields })} />
          <Toggle checked={s.prefillFromCv} onChange={(prefillFromCv) => onSettings({ ...s, prefillFromCv })} label="Pre-fill from the uploaded CV" />
        </div>
      );

    case "knockout":
      return (
        <div className="space-y-4">
          <KnockoutEditor items={s.items} onChange={(items) => onSettings({ ...s, items })} />
          <Field label="Placement">
            <Combo value={s.placement} options={["before_form", "after_form"]} format={words} label="Placement" onChange={(v) => onSettings({ ...s, placement: v as typeof s.placement })} />
          </Field>
        </div>
      );

    case "cv_intake":
      return (
        <div className="space-y-4">
          <Field label="Accepted formats">
            <ChipMulti values={s.acceptedFormats} options={["pdf", "docx"]} label="accepted formats" onChange={(v) => onSettings({ ...s, acceptedFormats: v as typeof s.acceptedFormats })} />
          </Field>
          <Field label="What to parse">
            <ChipMulti
              values={s.parseTargets}
              options={["employment", "education", "certifications", "skills", "publications", "links"]}
              format={words}
              label="parse targets"
              onChange={(v) => onSettings({ ...s, parseTargets: v as typeof s.parseTargets })}
            />
          </Field>
          <Field label="Max upload size · MB"><NumberInput value={s.maxSizeMb} min={1} max={100} label="Max upload size in MB" onChange={(maxSizeMb) => onSettings({ ...s, maxSizeMb: maxSizeMb ?? 10 })} /></Field>
          <Toggle checked={s.anonymizeForReview} onChange={(anonymizeForReview) => onSettings({ ...s, anonymizeForReview })} label="Anonymize for review" help="Names, photos and contact details are masked before a human sees the CV." />
          <Toggle checked={s.extractClaims} onChange={(extractClaims) => onSettings({ ...s, extractClaims })} label="Extract a claims ledger" help="Claims feed interview probes and document checks." />
          <Toggle checked={s.portfolioUrlField} onChange={(portfolioUrlField) => onSettings({ ...s, portfolioUrlField })} label="Ask for a portfolio link" />
        </div>
      );

    case "async_interview":
      return (
        <div className="space-y-4">
          <QuestionsEditor questions={s.questions} attrs={attrs} seniority={seniority} onChange={(questions) => onSettings({ ...s, questions })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Follow-up depth" hint="Anchored probes only — 0 asks none, 2 probes twice.">
              <NumberInput value={s.followUpPolicy} min={0} max={2} label="Follow-up depth" onChange={(v) => onSettings({ ...s, followUpPolicy: (v ?? 0) as 0 | 1 | 2 })} />
            </Field>
            <Field label="Question order">
              <Combo value={s.order} options={["fixed", "randomized"]} label="Question order" onChange={(v) => onSettings({ ...s, order: v as typeof s.order })} />
            </Field>
            <Field label="Intro video">
              <Combo value={s.introVideo} options={["recruiter", "ai_presenter", "none"]} format={words} label="Intro video" onChange={(v) => onSettings({ ...s, introVideo: v as typeof s.introVideo })} />
            </Field>
            <Field label="Pauses allowed">
              <NumberInput value={s.pauseAllowance} min={0} max={2} label="Pauses allowed" onChange={(v) => onSettings({ ...s, pauseAllowance: (v ?? 0) as 0 | 1 | 2 })} />
            </Field>
          </div>
          <Toggle checked={s.reviewBeforeSubmit} onChange={(reviewBeforeSubmit) => onSettings({ ...s, reviewBeforeSubmit })} label="Let candidates review answers before submitting" />
        </div>
      );

    case "live_ai_interview":
      return (
        <div className="space-y-4">
          <QuestionsEditor questions={s.questions} attrs={attrs} seniority={seniority} onChange={(questions) => onSettings({ ...s, questions })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Interviewer name"><input className={INPUT} aria-label="Interviewer name" value={s.persona.name} onChange={(e) => onSettings({ ...s, persona: { ...s.persona, name: e.target.value } })} /></Field>
            <Field label="Voice">
              <Combo value={s.persona.voice} options={["neutral", "warm", "formal"]} label="Voice" onChange={(v) => onSettings({ ...s, persona: { ...s.persona, voice: v as typeof s.persona.voice } })} />
            </Field>
            <Field label="Adaptivity" hint="Free-form question generation is deliberately not offered — probes only.">
              <Combo value={s.adaptivity} options={["probe_only", "probe_reorder"]} format={words} label="Adaptivity" onChange={(v) => onSettings({ ...s, adaptivity: v as typeof s.adaptivity })} />
            </Field>
            <Field label="Fallback on latency">
              <Combo value={s.latencyFallback} options={["async", "chat"]} label="Fallback on latency" onChange={(v) => onSettings({ ...s, latencyFallback: v as typeof s.latencyFallback })} />
            </Field>
          </div>
          <Toggle checked={s.bargeInAllowed} onChange={(bargeInAllowed) => onSettings({ ...s, bargeInAllowed })} label="Candidate may interrupt" />
        </div>
      );

    case "chat_interview":
      return (
        <div className="space-y-4">
          <QuestionsEditor questions={s.questions} attrs={attrs} seniority={seniority} onChange={(questions) => onSettings({ ...s, questions })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Min answer words"><NumberInput value={s.minAnswerWords} min={0} label="Minimum answer words" onChange={(v) => onSettings({ ...s, minAnswerWords: v ?? 0 })} /></Field>
            <Field label="Max answer words"><NumberInput value={s.maxAnswerWords} min={10} label="Maximum answer words" onChange={(v) => onSettings({ ...s, maxAnswerWords: v ?? 200 })} /></Field>
            <Field label="Paste policy">
              <Combo value={s.pastePolicy} options={["allow", "warn", "block"]} label="Paste policy" onChange={(v) => onSettings({ ...s, pastePolicy: v as typeof s.pastePolicy })} />
            </Field>
            <Field label="Follow-up depth"><NumberInput value={s.followUpPolicy} min={0} max={2} label="Follow-up depth" onChange={(v) => onSettings({ ...s, followUpPolicy: (v ?? 0) as 0 | 1 | 2 })} /></Field>
          </div>
          <Toggle checked={s.typingTelemetry} onChange={(typingTelemetry) => onSettings({ ...s, typingTelemetry })} label="Collect typing telemetry" help="Advisory integrity context only — never a verdict." />
        </div>
      );

    case "sjt":
      return (
        <div className="space-y-4">
          <SjtEditor items={s.items} attrs={attrs} industry="custom" onChange={(items) => onSettings({ ...s, items })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Instruction type" hint="Knowledge instructions load cognitive ability; behavioral tendency loads personality.">
              <Combo value={s.instruction} options={["knowledge", "behavioral_tendency"]} format={words} label="Instruction type" onChange={(v) => onSettings({ ...s, instruction: v as typeof s.instruction })} />
            </Field>
            <Field label="Response format">
              <Combo value={s.format} options={["pick_best", "pick_best_worst", "rank_all", "rate_each"]} format={words} label="Response format" onChange={(v) => onSettings({ ...s, format: v as typeof s.format })} />
            </Field>
            <Field label="Scoring key">
              <Combo value={s.keyType} options={["sme", "consensus", "hybrid"]} label="Scoring key" onChange={(v) => onSettings({ ...s, keyType: v as typeof s.keyType })} />
            </Field>
            <Field label="Timing">
              <Combo value={s.timing} options={["untimed", "soft_per_item"]} format={words} label="Timing" onChange={(v) => onSettings({ ...s, timing: v as typeof s.timing })} />
            </Field>
          </div>
          <Toggle checked={s.randomizeOrder} onChange={(randomizeOrder) => onSettings({ ...s, randomizeOrder })} label="Randomize item order" />
          <Toggle checked={s.pilotMode} onChange={(pilotMode) => onSettings({ ...s, pilotMode })} label="Pilot mode" help="Items are shown and logged but excluded from the composite." />
        </div>
      );

    case "cognitive":
      return (
        <div className="space-y-4">
          <Field label="Subtests">
            <ChipMulti values={s.subtests} options={["numerical", "verbal", "logical", "spatial", "working_memory", "attention"]} format={words} label="subtests" onChange={(v) => onSettings({ ...s, subtests: v as typeof s.subtests })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Items per subtest"><NumberInput value={s.itemsPerSubtest} min={4} max={30} label="Items per subtest" onChange={(v) => onSettings({ ...s, itemsPerSubtest: v ?? 8 })} /></Field>
            <Field label="Total time · min"><NumberInput value={s.totalTimeMin} min={1} label="Total time in minutes" onChange={(v) => onSettings({ ...s, totalTimeMin: v ?? 18 })} /></Field>
          </div>
          <Toggle checked={s.adaptive} onChange={(adaptive) => onSettings({ ...s, adaptive })} label="Adaptive difficulty" />
          <Toggle checked={s.calculatorAllowed} onChange={(calculatorAllowed) => onSettings({ ...s, calculatorAllowed })} label="Calculator allowed" />
        </div>
      );

    case "personality":
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Model">
              <Combo value={s.model} options={["big_five", "hexaco"]} format={words} label="Personality model" onChange={(v) => onSettings({ ...s, model: v as typeof s.model })} />
            </Field>
            <Field label="Length · items">
              <Combo value={String(s.lengthItems)} options={["60", "120", "200"]} label="Length in items" onChange={(v) => onSettings({ ...s, lengthItems: Number(v) as typeof s.lengthItems })} />
            </Field>
            <Field label="Format" hint="Forced choice resists faking and is the default.">
              <Combo value={s.format} options={["likert", "forced_choice"]} format={words} label="Response format" onChange={(v) => onSettings({ ...s, format: v as typeof s.format })} />
            </Field>
          </div>
          <Toggle checked={s.contextualizedAtWork} onChange={(contextualizedAtWork) => onSettings({ ...s, contextualizedAtWork })} label="Frame every item “at work”" />
          <Toggle checked={s.candidateFeedbackReport} onChange={(candidateFeedbackReport) => onSettings({ ...s, candidateFeedbackReport })} label="Give candidates their own insights report" />
        </div>
      );

    case "integrity_test":
      return (
        <div className="space-y-4">
          <Field label="Domains">
            <ChipMulti values={s.domains} options={["rule_adherence", "safety", "dependability", "cwb_attitudes"]} format={words} label="domains" onChange={(v) => onSettings({ ...s, domains: v as typeof s.domains })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Length · items"><NumberInput value={s.lengthItems} min={8} max={120} label="Length in items" onChange={(v) => onSettings({ ...s, lengthItems: v ?? 24 })} /></Field>
            <Field label="Format">
              <Combo value={s.format} options={["likert", "forced_choice"]} format={words} label="Response format" onChange={(v) => onSettings({ ...s, format: v as typeof s.format })} />
            </Field>
          </div>
        </div>
      );

    case "job_knowledge":
      return (
        <div className="space-y-4">
          <KnowledgeEditor items={s.items} attrs={attrs} onChange={(items) => onSettings({ ...s, items })} />
          <div className="grid grid-cols-2 gap-3">
            <Field label="Timing">
              <Combo value={s.timing} options={["per_item", "total"]} format={words} label="Timing" onChange={(v) => onSettings({ ...s, timing: v as typeof s.timing })} />
            </Field>
            {s.timing === "total" && (
              <Field label="Total time · min"><NumberInput value={s.totalTimeMin} min={1} label="Total time in minutes" onChange={(totalTimeMin) => onSettings({ ...s, totalTimeMin })} /></Field>
            )}
          </div>
          <Toggle checked={s.openBook} onChange={(openBook) => onSettings({ ...s, openBook })} label="Open book" help="Changes what is measured from knowledge to retrieval — labelled as such on the scorecard." />
        </div>
      );

    case "language_test":
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Language"><input className={INPUT} aria-label="Language" value={s.language} onChange={(e) => onSettings({ ...s, language: e.target.value })} /></Field>
            <Field label="Target level">
              <Combo value={s.targetLevel} options={["A2", "B1", "B2", "C1", "C2"]} label="Target level" onChange={(v) => onSettings({ ...s, targetLevel: v as typeof s.targetLevel })} />
            </Field>
          </div>
          <Field label="Skills tested">
            <ChipMulti values={s.skills} options={["reading", "listening", "writing", "speaking"]} label="skills" onChange={(v) => onSettings({ ...s, skills: v as typeof s.skills })} />
          </Field>
          <Field label="Minutes per skill"><NumberInput value={s.minutesPerSkill} min={1} label="Minutes per skill" onChange={(v) => onSettings({ ...s, minutesPerSkill: v ?? 10 })} /></Field>
        </div>
      );

    case "work_sample":
      return (
        <div className="space-y-4">
          <Field label="Brief"><textarea className={`${INPUT} min-h-28 leading-relaxed`} aria-label="Brief" value={s.brief} onChange={(e) => onSettings({ ...s, brief: e.target.value })} /></Field>
          <Field label="Deliverables">
            <ChipMulti values={s.deliverables} options={["file", "url", "rich_text", "spreadsheet"]} format={words} label="deliverables" onChange={(v) => onSettings({ ...s, deliverables: v as typeof s.deliverables })} />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Time model">
              <Combo value={s.timeModel} options={["honesty_window", "hard_timer"]} format={words} label="Time model" onChange={(v) => onSettings({ ...s, timeModel: v as typeof s.timeModel })} />
            </Field>
            <Field label="AI-use policy" hint="Disclosed verbatim to the candidate before they start.">
              <Combo value={s.aiPolicy} options={["forbidden", "disclosed", "expected"]} label="AI-use policy" onChange={(v) => onSettings({ ...s, aiPolicy: v as typeof s.aiPolicy })} />
            </Field>
          </div>
          <RubricDimensionsEditor dims={s.rubricDimensions} onChange={(rubricDimensions) => onSettings({ ...s, rubricDimensions })} />
          <Toggle checked={s.anonymizedGrading} onChange={(anonymizedGrading) => onSettings({ ...s, anonymizedGrading })} label="Grade anonymously" />
          <Toggle checked={s.originalityCheck} onChange={(originalityCheck) => onSettings({ ...s, originalityCheck })} label="Originality check" />
          <Toggle checked={s.defenseFollowUp} onChange={(defenseFollowUp) => onSettings({ ...s, defenseFollowUp })} label="Add defense probes to the next interview" help="The strongest anti-outsourcing measure available." />
        </div>
      );

    case "coding":
      return (
        <div className="space-y-4">
          <Field label="Brief"><textarea className={`${INPUT} min-h-28 leading-relaxed`} aria-label="Brief" value={s.brief} onChange={(e) => onSettings({ ...s, brief: e.target.value })} /></Field>
          <Field label="Languages offered"><TagList values={s.languages} onChange={(languages) => onSettings({ ...s, languages })} label="languages" placeholder="e.g. TypeScript" /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Environment">
              <Combo value={s.environment} options={["browser_ide", "take_home_repo"]} format={words} label="Environment" onChange={(v) => onSettings({ ...s, environment: v as typeof s.environment })} />
            </Field>
            <Field label="Task source">
              <Combo value={s.taskSource} options={["bank", "custom", "ai_sme_reviewed"]} format={words} label="Task source" onChange={(v) => onSettings({ ...s, taskSource: v as typeof s.taskSource })} />
            </Field>
            <Field label="AI-use policy">
              <Combo value={s.aiPolicy} options={["forbidden", "disclosed", "expected"]} label="AI-use policy" onChange={(v) => onSettings({ ...s, aiPolicy: v as typeof s.aiPolicy })} />
            </Field>
          </div>
          <Field label="Scoring split · %">
            <div className="grid grid-cols-3 gap-2">
              {(["correctness", "quality", "approach"] as const).map((k) => (
                <NumberInput key={k} value={s.scoringSplit[k]} min={0} max={100} label={`${k} share`} suffix={k} onChange={(v) => onSettings({ ...s, scoringSplit: { ...s.scoringSplit, [k]: v ?? 0 } })} />
              ))}
            </div>
          </Field>
          <RubricDimensionsEditor dims={s.rubricDimensions} onChange={(rubricDimensions) => onSettings({ ...s, rubricDimensions })} />
          <Toggle checked={s.similarityCheck} onChange={(similarityCheck) => onSettings({ ...s, similarityCheck })} label="Similarity check" />
        </div>
      );

    case "case_exercise":
      return (
        <div className="space-y-4">
          <Field label="Format">
            <Combo value={s.format} options={["case_analysis", "in_basket", "role_play", "presentation"]} format={words} label="Format" onChange={(v) => onSettings({ ...s, format: v as typeof s.format })} />
          </Field>
          <Field label="Materials given to the candidate"><textarea className={`${INPUT} min-h-28 leading-relaxed`} aria-label="Materials" value={s.materials} onChange={(e) => onSettings({ ...s, materials: e.target.value })} /></Field>
          {s.format === "in_basket" && (
            <Field label="Item count"><NumberInput value={s.itemCount} min={4} max={20} label="Item count" onChange={(itemCount) => onSettings({ ...s, itemCount })} /></Field>
          )}
          {s.format === "role_play" && (
            <Field label="Counterpart script" hint="The AI counterpart is always disclosed as AI.">
              <textarea className={`${INPUT} min-h-24`} aria-label="Counterpart script" value={s.personaScript ?? ""} onChange={(e) => onSettings({ ...s, personaScript: e.target.value })} />
            </Field>
          )}
          <RubricDimensionsEditor dims={s.rubricDimensions} onChange={(rubricDimensions) => onSettings({ ...s, rubricDimensions })} />
        </div>
      );

    case "doc_verification":
      return (
        <div className="space-y-4">
          <div className="space-y-2">
            <span className={LABEL}>Required documents · {s.requiredDocuments.length}</span>
            {s.requiredDocuments.length === 0 && <Empty text="No documents requested yet." />}
            {s.requiredDocuments.map((d, i) => (
              <Row key={d.id} onRemove={() => onSettings({ ...s, requiredDocuments: s.requiredDocuments.filter((_, xi) => xi !== i) })} label={d.label || "document"}>
                <Field label="Document"><input className={INPUT} aria-label={`Document ${i + 1}`} value={d.label} onChange={(e) => onSettings({ ...s, requiredDocuments: s.requiredDocuments.map((x, xi) => (xi === i ? { ...x, label: e.target.value } : x)) })} /></Field>
                <AttributePicker
                  label="Confirms qualification"
                  allowNone
                  value={d.qualificationAttributeId}
                  attrs={attrs}
                  onChange={(id) => onSettings({ ...s, requiredDocuments: s.requiredDocuments.map((x, xi) => (xi === i ? { ...x, qualificationAttributeId: id || undefined } : x)) })}
                />
              </Row>
            ))}
            <AddButton onClick={() => onSettings({ ...s, requiredDocuments: [...s.requiredDocuments, { id: uid("doc"), label: "" }] })}>Add document</AddButton>
          </div>
          <Field label="Accepted formats"><TagList values={s.acceptedFormats} onChange={(acceptedFormats) => onSettings({ ...s, acceptedFormats })} label="accepted formats" /></Field>
          <Field label="Placement">
            <Combo value={s.placement} options={["in_flow", "post_shortlist"]} format={words} label="Placement" onChange={(v) => onSettings({ ...s, placement: v as typeof s.placement })} />
          </Field>
          <Toggle checked={s.idCheck} onChange={(idCheck) => onSettings({ ...s, idCheck })} label="Identity check" help="Raises this block to integrity tier 3 — allowed on the final block only." />
        </div>
      );

    case "reference_check":
      return (
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <Field label="Referees required"><NumberInput value={s.referees.count} min={1} max={4} label="Referees required" onChange={(v) => onSettings({ ...s, referees: { ...s.referees, count: Math.min(4, Math.max(1, v ?? 2)) as 1 | 2 | 3 | 4 } })} /></Field>
            <Field label="Collection window · days"><NumberInput value={s.collectionWindowDays} min={1} label="Collection window in days" onChange={(v) => onSettings({ ...s, collectionWindowDays: v ?? 7 })} /></Field>
          </div>
          <Field label="Relationships accepted">
            <ChipMulti values={s.referees.relationships} options={["manager", "peer", "report"]} label="relationships" onChange={(v) => onSettings({ ...s, referees: { ...s.referees, relationships: v as typeof s.referees.relationships } })} />
          </Field>
          <div className="space-y-2">
            <span className={LABEL}>Questionnaire · {s.questionnaire.length}</span>
            {s.questionnaire.length === 0 && <Empty text="Structure is the only thing that makes references predictive — add the questions every referee answers." />}
            {s.questionnaire.map((q, i) => (
              <Row key={q.id} onRemove={() => onSettings({ ...s, questionnaire: s.questionnaire.filter((_, xi) => xi !== i) })} label={`question ${i + 1}`}>
                <Field label={`Question ${i + 1}`}><input className={INPUT} aria-label={`Referee question ${i + 1}`} value={q.text} onChange={(e) => onSettings({ ...s, questionnaire: s.questionnaire.map((x, xi) => (xi === i ? { ...x, text: e.target.value } : x)) })} /></Field>
                <div className="grid grid-cols-2 gap-3">
                  <Field label="Answer type">
                    <Combo value={q.type} options={["rating", "open"]} label="Answer type" onChange={(v) => onSettings({ ...s, questionnaire: s.questionnaire.map((x, xi) => (xi === i ? { ...x, type: v as "rating" | "open" } : x)) })} />
                  </Field>
                  <AttributePicker allowNone value={q.attributeId} attrs={attrs} onChange={(id) => onSettings({ ...s, questionnaire: s.questionnaire.map((x, xi) => (xi === i ? { ...x, attributeId: id || undefined } : x)) })} />
                </div>
              </Row>
            ))}
            <AddButton onClick={() => onSettings({ ...s, questionnaire: [...s.questionnaire, { id: uid("rq"), text: "", type: "rating" }] })}>Add question</AddButton>
          </div>
          <Toggle checked={s.fraudControls} onChange={(fraudControls) => onSettings({ ...s, fraudControls })} label="Fraud controls" />
          <Toggle checked={s.anonymizedAggregation} onChange={(anonymizedAggregation) => onSettings({ ...s, anonymizedAggregation })} label="Aggregate anonymously" help="Only meaningful with three or more referees." />
        </div>
      );

    case "human_stage":
      return (
        <div className="space-y-4">
          <Field label="Panel" hint="Names or roles of the people who will interview."><TagList values={s.panel} onChange={(panel) => onSettings({ ...s, panel })} label="panel" placeholder="Add a panelist and press Enter" /></Field>
          <Toggle checked={s.selfBooking} onChange={(selfBooking) => onSettings({ ...s, selfBooking })} label="Candidate books their own slot" />
          <Toggle checked={s.interviewKitAuto} onChange={(interviewKitAuto) => onSettings({ ...s, interviewKitAuto })} label="Auto-generate the interview kit" help="Targets the attributes the earlier blocks scored weakly, on the same anchors." />
          <Toggle checked={s.aiNotetaker} onChange={(aiNotetaker) => onSettings({ ...s, aiNotetaker })} label="AI notetaker" help="Consented; drafts a scorecard the human edits." />
        </div>
      );

    case "custom":
      return (
        <div className="space-y-4">
          <Field label="Instructions"><textarea className={`${INPUT} min-h-28 leading-relaxed`} aria-label="Instructions" value={s.instructions} onChange={(e) => onSettings({ ...s, instructions: e.target.value })} /></Field>
          <Field label="Primitives">
            <ChipMulti values={s.primitives} options={["recorder", "text", "choice", "file", "grid"]} label="primitives" onChange={(v) => onSettings({ ...s, primitives: v as typeof s.primitives })} />
          </Field>
          <RubricDimensionsEditor dims={s.rubricDimensions} onChange={(rubricDimensions) => onSettings({ ...s, rubricDimensions })} />
        </div>
      );
  }
}
