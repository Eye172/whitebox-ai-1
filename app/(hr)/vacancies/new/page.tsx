"use client";

/* Create Vacancy — Book III · §2. The whole flow lives in an inverted
   white-box panel: you are literally building transparency. */

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { Sparkles, SlidersHorizontal, Copy, Check, ArrowLeft } from "lucide-react";
import type { NlToConfigResponse, VacancyConfig } from "@/lib/ai";
import { employerBrief } from "@/lib/fixtures";

type Stage = "branch" | "nl" | "generating" | "config" | "published";

const GEN_STEPS = ["Analyzing role…", "Selecting competencies…", "Setting weights…", "Choosing interview depth…"];

function WhyChip({ text }: { text: string }) {
  const [open, setOpen] = useState(false);
  return (
    <span className="relative inline-block">
      <button
        onClick={() => setOpen(!open)}
        className="rounded-full border px-1.5 py-px font-mono text-[9px] tracking-[0.08em]"
        style={{ borderColor: "var(--wb-hairline)", color: open ? "var(--wb-ink)" : "#7a7a80" }}
      >
        WHY?
      </button>
      {open && (
        <span
          className="absolute left-0 top-6 z-20 block w-[300px] rounded-lg border bg-white p-3 text-left text-[12px] leading-relaxed shadow-lg"
          style={{ borderColor: "var(--wb-hairline)", color: "var(--wb-text)" }}
        >
          {text}
        </span>
      )}
    </span>
  );
}

export default function CreateVacancy() {
  const [stage, setStage] = useState<Stage>("branch");
  const [title, setTitle] = useState("Product Manager — Marketplace");
  const [desc, setDesc] = useState("");
  const [genStep, setGenStep] = useState(0);
  const [result, setResult] = useState<NlToConfigResponse | null>(null);
  const [config, setConfig] = useState<VacancyConfig | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [code, setCode] = useState<string>("");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (stage !== "generating") return;
    setGenStep(0);
    const t = setInterval(() => setGenStep((s) => Math.min(s + 1, GEN_STEPS.length - 1)), 450);
    return () => clearInterval(t);
  }, [stage]);

  const weightSum = useMemo(
    () => config?.categories.reduce((a, c) => a + c.weight, 0) ?? 0,
    [config],
  );

  const generate = async () => {
    setError(null);
    setStage("generating");
    try {
      const res = await fetch("/api/ai/nl-to-config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description: desc }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Generation failed");
      const data = (await res.json()) as NlToConfigResponse;
      setResult(data);
      setConfig(data.config);
      setStage("config");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed — try again or configure manually.");
      setStage("nl");
    }
  };

  const publish = () => {
    const newCode = "WBX-" + Array.from({ length: 4 }, () => "ABCDEFGHJKMNPQRSTUVWXYZ23456789"[Math.floor(Math.random() * 31)]).join("");
    const published = JSON.parse(localStorage.getItem("wbx-published") ?? "{}");
    published[newCode] = {
      title,
      code: newCode,
      competencies: config!.categories.map((c) => ({ name: c.name, weight: c.weight })),
      entry: "interview",
    };
    localStorage.setItem("wbx-published", JSON.stringify(published));
    setCode(newCode);
    setStage("published");
  };

  const setWeight = (i: number, w: number) => {
    if (!config) return;
    setConfig({ ...config, categories: config.categories.map((c, j) => (j === i ? { ...c, weight: w } : c)) });
  };

  return (
    <div className="grid-paper min-h-[calc(100vh-52px)] p-8">
      <Link href="/dashboard" className="mb-5 flex w-fit items-center gap-1.5 text-[12px] text-lo hover:text-mid">
        <ArrowLeft className="size-3.5" /> Dashboard
      </Link>

      {/* the white box you build transparency inside */}
      <div className="wb grain relative mx-auto max-w-[860px] overflow-hidden rounded-2xl p-8">
        {/* wireframe motif visible "inside" the box */}
        <div className="pointer-events-none absolute -right-10 -top-10 size-56 rotate-12 border opacity-[0.07]" style={{ borderColor: "var(--wb-ink)" }} />
        <div className="pointer-events-none absolute -right-2 top-2 size-40 -rotate-6 border opacity-[0.05]" style={{ borderColor: "var(--wb-ink)" }} />

        <div className="font-mono text-[10px] tracking-[0.12em] uppercase" style={{ color: "#7a7a80" }}>
          Create vacancy · every generated field explains itself
        </div>

        {stage === "branch" && (
          <div className="mt-6">
            <h1 className="font-display text-[26px] font-medium tracking-[-0.015em]" style={{ color: "var(--wb-ink)" }}>
              How do you want to define the evaluation?
            </h1>
            <div className="mt-6 grid grid-cols-2 gap-4">
              <button
                onClick={() => { setDesc(employerBrief); setStage("nl"); }}
                className="rounded-xl border bg-white p-6 text-left transition-transform hover:-translate-y-0.5"
                style={{ borderColor: "var(--wb-hairline)" }}
              >
                <Sparkles className="size-5" style={{ color: "var(--iris-b)" }} />
                <div className="mt-3 text-[15px] font-medium" style={{ color: "var(--wb-ink)" }}>Describe in natural language</div>
                <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "#4a4a50" }}>
                  Tell WhiteBox about the role in plain language. We'll build the evaluation config — and show you why.
                </p>
              </button>
              <button
                onClick={() => {
                  setConfig({
                    categories: [
                      { name: "Leadership", weight: 25, rationale: "Set manually.", focus: false },
                      { name: "Communication", weight: 25, rationale: "Set manually.", focus: false },
                      { name: "Decision-Making", weight: 25, rationale: "Set manually.", focus: false },
                      { name: "Growth Potential", weight: 25, rationale: "Set manually.", focus: false },
                    ],
                    interviewType: { value: "adaptive-video", rationale: "Set manually." },
                    questionDepth: { value: "standard", rationale: "Set manually." },
                    requiredDocuments: { value: [], rationale: "Set manually." },
                    passThreshold: { value: 65, rationale: "Set manually." },
                    languages: { value: ["en"], rationale: "Set manually." },
                  });
                  setResult(null);
                  setStage("config");
                }}
                className="rounded-xl border bg-white p-6 text-left transition-transform hover:-translate-y-0.5"
                style={{ borderColor: "var(--wb-hairline)" }}
              >
                <SlidersHorizontal className="size-5" style={{ color: "var(--ember)" }} />
                <div className="mt-3 text-[15px] font-medium" style={{ color: "var(--wb-ink)" }}>Configure manually</div>
                <p className="mt-1.5 text-[13px] leading-relaxed" style={{ color: "#4a4a50" }}>
                  Set every parameter yourself. For power users.
                </p>
              </button>
            </div>
          </div>
        )}

        {stage === "nl" && (
          <div className="mt-6">
            <label className="text-[13px] font-medium" style={{ color: "var(--wb-ink)" }}>Vacancy title</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="mt-1.5 w-full rounded-lg border bg-white px-4 py-2.5 text-[14px]"
              style={{ borderColor: "var(--wb-hairline)", color: "var(--wb-ink)" }}
            />
            <label className="mt-5 block text-[13px] font-medium" style={{ color: "var(--wb-ink)" }}>
              Describe the role — what matters, in your own words (any language)
            </label>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              rows={7}
              className="mt-1.5 w-full rounded-lg border bg-white p-4 font-mono text-[13px] leading-relaxed"
              style={{ borderColor: "var(--wb-hairline)", color: "var(--wb-ink)" }}
              placeholder='e.g. "Team Lead for a dev team. Leadership, decision-making, communication, conflict resolution, stress-resilience matter most…"'
            />
            {error && <p className="mt-2 text-[13px] text-neg">{error}</p>}
            <div className="mt-4 flex gap-3">
              <button
                onClick={generate}
                disabled={desc.trim().length < 20}
                className="rounded-lg px-5 py-2.5 text-[14px] text-white transition-opacity disabled:opacity-40"
                style={{ background: "var(--wb-ink)" }}
              >
                Generate config
              </button>
              <button onClick={() => setStage("branch")} className="rounded-lg border px-5 py-2.5 text-[14px]" style={{ borderColor: "var(--wb-hairline)", color: "#4a4a50" }}>
                Back
              </button>
            </div>
          </div>
        )}

        {stage === "generating" && (
          <div className="mt-10 pb-6">
            {GEN_STEPS.map((s, i) => (
              <div key={s} className="flex items-center gap-3 py-1.5">
                <span
                  className="flex size-4 items-center justify-center rounded-full border text-[9px]"
                  style={{ borderColor: i <= genStep ? "var(--iris-b)" : "var(--wb-hairline)", color: "var(--iris-b)" }}
                >
                  {i < genStep ? "✓" : ""}
                </span>
                <span className="font-mono text-[12px]" style={{ color: i <= genStep ? "var(--wb-ink)" : "#7a7a80" }}>{s}</span>
              </div>
            ))}
          </div>
        )}

        {stage === "config" && config && (
          <div className="mt-6">
            <div className="flex items-baseline justify-between">
              <h1 className="font-display text-[24px] font-medium tracking-[-0.015em]" style={{ color: "var(--wb-ink)" }}>{title}</h1>
              <span className="font-mono text-[10px] tracking-[0.08em]" style={{ color: "#7a7a80" }}>
                {result ? `${result.modelVer} · ${result.promptVer}` : "MANUAL MODE"}
              </span>
            </div>

            {/* categories + weights, sum must equal 100 */}
            <div className="mt-5 rounded-xl border bg-white p-5" style={{ borderColor: "var(--wb-hairline)" }}>
              <div className="flex items-baseline justify-between">
                <span className="font-mono text-[10px] tracking-[0.1em] uppercase" style={{ color: "#7a7a80" }}>
                  Evaluation categories · weights
                </span>
                <span className="font-mono text-[11px]" style={{ color: weightSum === 100 ? "var(--pos)" : "var(--neg)" }}>
                  Σ {weightSum}% {weightSum !== 100 && "— must equal 100"}
                </span>
              </div>
              <div className="mt-3 space-y-2.5">
                {config.categories.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-3">
                    {c.focus && <span className="size-1.5 rounded-full" style={{ background: "var(--iris-gradient)" }} />}
                    <span className="w-44 text-[13.5px]" style={{ color: "var(--wb-ink)", fontWeight: c.focus ? 500 : 400 }}>{c.name}</span>
                    <input
                      type="range" min={0} max={60} value={c.weight}
                      onChange={(e) => setWeight(i, Number(e.target.value))}
                      className="flex-1 accent-black"
                    />
                    <input
                      type="number" value={c.weight}
                      onChange={(e) => setWeight(i, Number(e.target.value))}
                      className="w-14 rounded border px-1.5 py-1 text-right font-mono text-[12px]"
                      style={{ borderColor: "var(--wb-hairline)", color: "var(--wb-ink)" }}
                    />
                    <WhyChip text={c.rationale} />
                  </div>
                ))}
              </div>
            </div>

            {/* generated settings */}
            <div className="mt-4 grid grid-cols-2 gap-4">
              {(
                [
                  ["Interview type", config.interviewType.value, config.interviewType.rationale],
                  ["Question depth", config.questionDepth.value, config.questionDepth.rationale],
                  ["Required documents", config.requiredDocuments.value.join(", ") || "None", config.requiredDocuments.rationale],
                  ["Pass threshold", `${config.passThreshold.value} / 100`, config.passThreshold.rationale],
                  ["Interview languages", config.languages.value.join(" · ").toUpperCase(), config.languages.rationale],
                ] as const
              ).map(([label, value, why]) => (
                <div key={label} className="rounded-xl border bg-white p-4" style={{ borderColor: "var(--wb-hairline)" }}>
                  <div className="flex items-center justify-between">
                    <span className="font-mono text-[10px] tracking-[0.1em] uppercase" style={{ color: "#7a7a80" }}>{label}</span>
                    <WhyChip text={why} />
                  </div>
                  <div className="mt-1.5 text-[14px]" style={{ color: "var(--wb-ink)" }}>{value}</div>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center gap-3">
              <button
                onClick={publish}
                disabled={weightSum !== 100}
                className="rounded-lg px-6 py-2.5 text-[14px] text-white transition-opacity disabled:opacity-40"
                style={{ background: "var(--wb-ink)" }}
              >
                Publish competition
              </button>
              <button onClick={() => setStage(result ? "nl" : "branch")} className="rounded-lg border px-5 py-2.5 text-[14px]" style={{ borderColor: "var(--wb-hairline)", color: "#4a4a50" }}>
                Back
              </button>
              <span className="ml-auto font-mono text-[10px] tracking-[0.06em]" style={{ color: "#7a7a80" }}>
                EVERY FIELD IS YOURS TO OVERRIDE · CONFIG SAVED AS V1
              </span>
            </div>
          </div>
        )}

        {stage === "published" && (
          <div className="mt-8 pb-4 text-center">
            <div className="font-mono text-[10px] tracking-[0.12em] uppercase" style={{ color: "#7a7a80" }}>
              Competition live · config v1 · versioned
            </div>
            <h1 className="mt-3 font-display text-[26px] font-medium" style={{ color: "var(--wb-ink)" }}>{title}</h1>
            <button
              onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 1500); }}
              className="mx-auto mt-6 flex items-center gap-3 rounded-xl border bg-white px-8 py-4 font-mono text-[26px] tracking-[0.25em]"
              style={{ borderColor: "var(--wb-hairline)", color: "var(--wb-ink)" }}
            >
              {code}
              {copied ? <Check className="size-5 text-pos" /> : <Copy className="size-5" style={{ color: "#7a7a80" }} />}
            </button>
            <p className="mt-3 text-[13px]" style={{ color: "#4a4a50" }}>
              Share this code with candidates — they enter it on the candidate side and go straight into this competition.
            </p>
            <div className="mt-6 flex justify-center gap-3">
              <Link href="/" className="rounded-lg px-5 py-2.5 text-[14px] text-white" style={{ background: "var(--wb-ink)" }}>
                Open candidate side →
              </Link>
              <Link href="/dashboard" className="rounded-lg border px-5 py-2.5 text-[14px]" style={{ borderColor: "var(--wb-hairline)", color: "#4a4a50" }}>
                Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
