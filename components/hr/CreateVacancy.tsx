"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { WhiteBoxPanel } from "@/components/ui/WhiteBox";
import { Button } from "@/components/ui/primitives";
import { MessageSquareText, SlidersHorizontal, Sparkles, Info, Check, Copy, ArrowRight } from "lucide-react";

const EXAMPLE =
  "Team Lead for a dev team. Leadership, decision-making, communication, conflict resolution, stress-resilience matter most. Experience important, but growth potential is high priority.";

type Field = { key: string; label: string; value: string; why: string };

const GENERATED: { categories: { name: string; weight: number; why: string }[]; fields: Field[] } = {
  categories: [
    { name: "Leadership & People", weight: 34, why: "You named leadership, communication and conflict resolution as top priorities — grouped and weighted highest." },
    { name: "Judgement & Thinking", weight: 33, why: "Decision-making was called out explicitly; paired with critical thinking and the professional knowledge a lead needs." },
    { name: "Resilience & Growth", weight: 33, why: "You emphasised stress-resilience and 'growth potential is high priority', so this carries equal weight to judgement." },
  ],
  fields: [
    { key: "type", label: "Interview type", value: "Adaptive behavioural + situational", why: "A team-lead role rewards real examples and judgement under ambiguity — adaptive follow-ups surface these better than fixed questions." },
    { key: "depth", label: "Question depth", value: "Deep (3–4 follow-ups)", why: "You valued depth of argument; deeper follow-ups let the model check consistency against earlier answers." },
    { key: "docs", label: "Required documents", value: "Degree + management reference (optional)", why: "Experience matters but you weighted growth highly, so documents are supportive, not gating." },
    { key: "threshold", label: "Minimum pass threshold", value: "70 / 100", why: "Set to shortlist roughly the top third given the current applicant distribution — adjustable with a live preview." },
  ],
};

export default function CreateVacancy() {
  const router = useRouter();
  const [branch, setBranch] = useState<null | "nl" | "manual">(null);
  const [text, setText] = useState("");
  const [phase, setPhase] = useState<"input" | "generating" | "result">("input");
  const [step, setStep] = useState(0);
  const [openWhy, setOpenWhy] = useState<string | null>(null);
  const [published, setPublished] = useState(false);

  const generate = () => {
    setPhase("generating");
    setStep(0);
    const steps = ["Analyzing role…", "Setting weights…", "Selecting competencies…", "Choosing interview type & thresholds…"];
    let i = 0;
    const iv = setInterval(() => {
      i++;
      setStep(i);
      if (i >= steps.length) {
        clearInterval(iv);
        setTimeout(() => setPhase("result"), 350);
      }
    }, 620);
  };
  const genSteps = ["Analyzing role…", "Setting weights…", "Selecting competencies…", "Choosing interview type & thresholds…"];

  if (!branch) {
    return (
      <div className="mx-auto max-w-3xl">
        <WhiteBoxPanel label="Create vacancy · building transparency" className="p-8">
          <h2 className="mb-1 text-[22px] font-semibold" style={{ color: "var(--wb-text)" }}>
            How do you want to build this evaluation?
          </h2>
          <p className="mb-7 text-[14px]" style={{ color: "rgba(23,23,26,0.6)" }}>
            Either way, every setting stays editable and shows why it was chosen.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <BranchCard
              icon={MessageSquareText}
              title="Describe in natural language"
              body="Tell WhiteBox about the role in plain language. We'll build the evaluation config — and show you why."
              onClick={() => setBranch("nl")}
            />
            <BranchCard
              icon={SlidersHorizontal}
              title="Configure manually"
              body="Set every parameter yourself. For power users — jump to any section, no wizard hand-holding."
              onClick={() => setBranch("manual")}
            />
          </div>
        </WhiteBoxPanel>
      </div>
    );
  }

  if (published) {
    return (
      <div className="mx-auto max-w-xl">
        <div className="rounded-md border border-hairline bg-surface p-8 text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full" style={{ background: "rgba(70,208,138,0.12)" }}>
            <Check className="h-5 w-5" style={{ color: "var(--pos)" }} />
          </div>
          <h2 className="h3 mb-1 text-text-hi">Vacancy published</h2>
          <p className="mb-4 text-sm text-text-mid">Config saved as version 1. A unique competition code was generated.</p>
          <div className="mb-6 inline-flex items-center gap-2 rounded-md border border-hairline bg-void-2 px-4 py-2">
            <span className="mono text-lg text-text-hi">WBX-3F8N</span>
            <Copy className="h-4 w-4 text-text-lo" />
          </div>
          <div className="flex justify-center gap-2">
            <Button onClick={() => router.push("/hr/vacancies/v-teamlead/config")}>Open competency builder</Button>
            <Button variant="secondary" onClick={() => router.push("/hr/vacancies")}>All vacancies</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      {/* progress segments */}
      <div className="mb-5 flex items-center gap-2">
        <button onClick={() => { setBranch(null); setPhase("input"); }} className="mono text-[12px] text-text-lo hover:text-text-hi">← branches</button>
        <div className="ml-2 flex flex-1 gap-1">
          {["Describe", "Review config", "Publish"].map((s, i) => {
            const active = (phase === "input" && i === 0) || (phase !== "input" && i === 1);
            return (
              <div key={s} className="flex-1">
                <div className="h-1 rounded-full" style={{ background: active || (phase === "result" && i <= 1) ? "var(--iris-b)" : "var(--hairline)" }} />
                <span className="mono-label mt-1 block">{s}</span>
              </div>
            );
          })}
        </div>
      </div>

      <WhiteBoxPanel className="p-7">
        {branch === "nl" && phase === "input" && (
          <>
            <div className="mono mb-2 text-[11px] uppercase tracking-[0.08em]" style={{ color: "rgba(23,23,26,0.5)" }}>
              Describe the role
            </div>
            <textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={5}
              placeholder={EXAMPLE}
              className="mb-4 w-full resize-none rounded-[8px] border p-4 text-[14px] leading-relaxed outline-none"
              style={{ background: "rgba(255,255,255,0.6)", borderColor: "rgba(0,0,0,0.12)", color: "var(--wb-text)" }}
            />
            <div className="flex items-center gap-3">
              <button
                onClick={generate}
                className="inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-[13.5px] font-medium text-white transition-transform hover:scale-[1.01]"
                style={{ background: "linear-gradient(120deg,#6b6bff,#c77bff)" }}
              >
                <Sparkles className="h-4 w-4" /> Generate config
              </button>
              <button onClick={() => setText(EXAMPLE)} className="text-[12.5px]" style={{ color: "rgba(23,23,26,0.55)" }}>
                use the example
              </button>
            </div>
          </>
        )}

        {branch === "nl" && phase === "generating" && (
          <div className="py-6">
            <div className="mono mb-4 text-[11px] uppercase tracking-[0.08em]" style={{ color: "rgba(23,23,26,0.5)" }}>
              Building your evaluation
            </div>
            <div className="space-y-3">
              {genSteps.map((s, i) => (
                <div key={s} className="flex items-center gap-3">
                  <span
                    className="flex h-5 w-5 items-center justify-center rounded-full text-[10px]"
                    style={{ background: i < step ? "rgba(70,208,138,0.2)" : i === step ? "#6b6bff" : "rgba(0,0,0,0.06)", color: i < step ? "#1f8f5c" : i === step ? "#fff" : "rgba(23,23,26,0.4)" }}
                  >
                    {i < step ? <Check className="h-3 w-3" /> : i + 1}
                  </span>
                  <span className="text-[14px]" style={{ color: i <= step ? "var(--wb-text)" : "rgba(23,23,26,0.4)" }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {phase === "result" || branch === "manual" ? (
          <ConfigResult openWhy={openWhy} setOpenWhy={setOpenWhy} onPublish={() => setPublished(true)} manual={branch === "manual"} />
        ) : null}
      </WhiteBoxPanel>
    </div>
  );
}

function BranchCard({ icon: Icon, title, body, onClick }: { icon: React.ElementType; title: string; body: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="group rounded-md border p-5 text-left transition-all hover:-translate-y-0.5"
      style={{ background: "rgba(255,255,255,0.5)", borderColor: "rgba(0,0,0,0.12)" }}
    >
      <div className="mb-8 flex items-center justify-between">
        <Icon className="h-5 w-5" style={{ color: "#5b5bd6" }} />
        <ArrowRight className="h-4 w-4 opacity-40 transition-transform group-hover:translate-x-1" style={{ color: "var(--wb-text)" }} />
      </div>
      <div className="mb-1 text-[15px] font-semibold" style={{ color: "var(--wb-text)" }}>{title}</div>
      <p className="text-[13px] leading-relaxed" style={{ color: "rgba(23,23,26,0.62)" }}>{body}</p>
    </button>
  );
}

function ConfigResult({ openWhy, setOpenWhy, onPublish, manual }: { openWhy: string | null; setOpenWhy: (s: string | null) => void; onPublish: () => void; manual: boolean }) {
  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <div>
          <div className="text-[16px] font-semibold" style={{ color: "var(--wb-text)" }}>
            {manual ? "Manual configuration" : "Generated evaluation config"}
          </div>
          <div className="text-[12.5px]" style={{ color: "rgba(23,23,26,0.55)" }}>
            {manual ? "Set each parameter directly." : "Every field is editable and shows why the AI set it."}
          </div>
        </div>
        <span className="mono rounded-full px-2 py-0.5 text-[10px]" style={{ background: "rgba(107,107,255,0.14)", color: "#4a4ad0" }}>
          transparent config
        </span>
      </div>

      {/* categories with weights */}
      <div className="mb-4 rounded-md border p-4" style={{ borderColor: "rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.45)" }}>
        <div className="mono mb-3 text-[11px] uppercase tracking-[0.08em]" style={{ color: "rgba(23,23,26,0.5)" }}>Categories · weights sum to 100</div>
        {GENERATED.categories.map((c) => (
          <div key={c.name} className="mb-2.5 last:mb-0">
            <div className="mb-1 flex items-center justify-between">
              <span className="flex items-center gap-2 text-[13.5px]" style={{ color: "var(--wb-text)" }}>
                {c.name}
                <WhyChip id={c.name} why={c.why} openWhy={openWhy} setOpenWhy={setOpenWhy} />
              </span>
              <span className="mono text-[13px]" style={{ color: "var(--wb-text)" }}>{c.weight}%</span>
            </div>
            <div className="h-1.5 overflow-hidden rounded-full" style={{ background: "rgba(0,0,0,0.08)" }}>
              <div className="h-full rounded-full" style={{ width: `${c.weight}%`, background: "linear-gradient(90deg,#6b6bff,#c77bff)" }} />
            </div>
          </div>
        ))}
      </div>

      {/* fields */}
      <div className="mb-6 grid gap-3 sm:grid-cols-2">
        {GENERATED.fields.map((f) => (
          <div key={f.key} className="rounded-md border p-3" style={{ borderColor: "rgba(0,0,0,0.1)", background: "rgba(255,255,255,0.45)" }}>
            <div className="mono mb-1 flex items-center gap-1.5 text-[10px] uppercase tracking-[0.08em]" style={{ color: "rgba(23,23,26,0.5)" }}>
              {f.label}
              <WhyChip id={f.key} why={f.why} openWhy={openWhy} setOpenWhy={setOpenWhy} />
            </div>
            <div className="text-[13.5px]" style={{ color: "var(--wb-text)" }}>{f.value}</div>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={onPublish}
          className="inline-flex items-center gap-2 rounded-[6px] px-4 py-2.5 text-[13.5px] font-medium text-white"
          style={{ background: "#17171a" }}
        >
          Publish vacancy <ArrowRight className="h-4 w-4" />
        </button>
        <span className="text-[12px]" style={{ color: "rgba(23,23,26,0.5)" }}>generates a competition code · saved as v1</span>
      </div>
    </div>
  );
}

function WhyChip({ id, why, openWhy, setOpenWhy }: { id: string; why: string; openWhy: string | null; setOpenWhy: (s: string | null) => void }) {
  const open = openWhy === id;
  return (
    <span className="relative inline-block">
      <button
        onClick={() => setOpenWhy(open ? null : id)}
        className="inline-flex items-center gap-1 rounded-full px-1.5 py-0.5 text-[9px] uppercase tracking-wide"
        style={{ background: "rgba(107,107,255,0.12)", color: "#4a4ad0" }}
      >
        <Info className="h-2.5 w-2.5" /> why
      </button>
      {open && (
        <>
          <span className="fixed inset-0 z-30" onClick={() => setOpenWhy(null)} />
          <span className="absolute left-0 top-full z-40 mt-1 block w-60 rounded-md border p-3 text-[12px] leading-relaxed shadow-xl" style={{ background: "#fff", borderColor: "rgba(0,0,0,0.14)", color: "rgba(23,23,26,0.8)" }}>
            {why}
          </span>
        </>
      )}
    </span>
  );
}
