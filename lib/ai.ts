/* ============================================================
   AI CONTRACTS + STUBS — MASTERDOC · Book I · Part XI, Book V · §V.3
   These are the exact typed contracts the real backend implements
   (FastAPI + Instructor/Outlines + LangGraph). The stubs below are
   deterministic heuristics so the whole product flow runs today;
   swapping them for real LLM calls changes NOTHING outside this file
   and the /api/ai/* route handlers.
   ============================================================ */

/* ---------- 1 · NL → CONFIG (powers T2.1, "why" chips included) ---------- */

export interface GeneratedField<T> {
  value: T;
  rationale: string; // feeds the in-UI "why the AI set this" chip — never omitted
}

export interface CompetencyConfigItem {
  name: string;
  weight: number; // all weights sum to 100 — validated
  rationale: string;
  focus: boolean; // focus attributes are iris-highlighted in the builder
}

export interface VacancyConfig {
  categories: CompetencyConfigItem[];
  interviewType: GeneratedField<"adaptive-video" | "adaptive-voice">;
  questionDepth: GeneratedField<"standard" | "deep" | "expert">;
  requiredDocuments: GeneratedField<string[]>;
  passThreshold: GeneratedField<number>;
  languages: GeneratedField<string[]>;
}

export interface NlToConfigRequest {
  title: string;
  description: string; // employer's plain-language role description (any language)
}

export interface NlToConfigResponse {
  config: VacancyConfig;
  modelVer: string; // pinned per vacancy for reproducibility (Part XI.3)
  promptVer: string;
}

/* keyword heuristics standing in for the LLM structured-extraction call */
const COMPETENCY_SIGNALS: { name: string; focusHints: RegExp; rationaleHit: string; rationaleMiss: string }[] = [
  { name: "Leadership", focusHints: /лидер|leader|руковод|команд|team|manage|вести за/i, rationaleHit: "The description names leading people directly — weighted as a focus attribute.", rationaleMiss: "Kept at a low weight: the role text does not emphasize people leadership." },
  { name: "Decision-Making", focusHints: /решени|decision|приорит|trade-?off|выбор|бюджет/i, rationaleHit: "The employer stresses making calls under constraints — high impact on outcomes.", rationaleMiss: "Standard weight: decisions implied but not emphasized." },
  { name: "Communication", focusHints: /коммуника|communicat|переговор|клиент|stakeholder|презент|обратн.. связ/i, rationaleHit: "Stakeholder/client interaction is explicit in the description.", rationaleMiss: "Baseline weight for any collaborative role." },
  { name: "Stress-Resilience", focusHints: /стресс|stress|давлен|дедлайн|deadline|конфликт|conflict|кризис/i, rationaleHit: "Pressure and conflict situations appear in the employer's text.", rationaleMiss: "Low weight: no pressure context named." },
  { name: "Analytical Thinking", focusHints: /аналит|analy|данн|data|метрик|metric|критическ|critical/i, rationaleHit: "The role asks for reasoning over data and metrics explicitly.", rationaleMiss: "Included at base weight for professional roles." },
  { name: "Customer Empathy", focusHints: /клиент|customer|пользовател|user|эмпат|empath|сервис|service/i, rationaleHit: "Customer/user focus is called out — measured through scenario questions.", rationaleMiss: "Omittable: no customer-facing signals found." },
  { name: "Growth Potential", focusHints: /рост|growth|потенциал|potential|обуча|learn|развит/i, rationaleHit: "The employer explicitly prioritizes growth potential over current experience.", rationaleMiss: "Kept small: growth not mentioned as a priority." },
];

export function nlToConfigStub(req: NlToConfigRequest): NlToConfigResponse {
  const text = req.description;
  const scored = COMPETENCY_SIGNALS.map((s) => ({
    name: s.name,
    hit: s.focusHints.test(text),
    rationale: s.focusHints.test(text) ? s.rationaleHit : s.rationaleMiss,
  }));
  let picked = scored.filter((s) => s.hit);
  if (picked.length < 3) picked = [...picked, ...scored.filter((s) => !s.hit).slice(0, 3 - picked.length)];
  if (picked.length > 6) picked = picked.slice(0, 6);

  // weights: focus attributes get double share, everything normalized to exactly 100
  const shares = picked.map((p) => (p.hit ? 2 : 1));
  const total = shares.reduce((a, b) => a + b, 0);
  let acc = 0;
  const categories: CompetencyConfigItem[] = picked.map((p, i) => {
    const w = i === picked.length - 1 ? 100 - acc : Math.round((shares[i] / total) * 100);
    acc += w;
    return { name: p.name, weight: w, rationale: p.rationale, focus: p.hit };
  });

  const deep = /senior|lead|глубок|expert|сложн/i.test(text);
  const docs = /диплом|degree|сертифи|certif|образован/i.test(text);
  const ru = /[а-яё]/i.test(text);

  return {
    config: {
      categories,
      interviewType: { value: "adaptive-video", rationale: "Behavioral competencies dominate the config — video lets the agent probe real episodes and follow up." },
      questionDepth: { value: deep ? "deep" : "standard", rationale: deep ? "Seniority markers in the description warrant second-level follow-ups." : "No seniority markers — standard depth keeps candidate effort proportionate." },
      requiredDocuments: { value: docs ? ["Diploma / degree", "Certifications named in interview"] : [], rationale: docs ? "The employer references formal education — claims will be verified, then sources auto-deleted." : "No credential requirements detected; documents stay optional." },
      passThreshold: { value: 65, rationale: "Default calibrated threshold; adjust with the live pass-rate preview." },
      languages: { value: ru ? ["ru", "en"] : ["en"], rationale: ru ? "Description is in Russian — interview offered in Russian and English." : "English-only description." },
    },
    modelVer: "stub-nl2config-0.1", // real impl: claude-* + Instructor, pinned per vacancy
    promptVer: "v0-heuristic",
  };
}

/* ---------- 2 · ADAPTIVE INTERVIEW AGENT (powers T2.4) ---------- */
/* Stateless contract: the client carries the running interview state,
   the real LangGraph agent will hold it server-side instead — same shape. */

export interface InterviewTurn {
  question: string;
  topic: string;
  kind: "main" | "followup";
  answer?: string;
}

export interface InterviewStepRequest {
  vacancyTitle: string;
  competencies: { name: string; weight: number }[];
  history: InterviewTurn[]; // last entry's answer just given by the candidate
}

export interface InterviewStepResponse {
  done: boolean;
  question?: string;
  topic?: string;
  kind?: "main" | "followup";
  progress: number; // 0..1, approximate — candidate UI shows gentle progress only
  closing?: string;
}

const MAIN_TEMPLATES: Record<string, string> = {
  Leadership: "Tell me about a time you led people through something that was failing. What did you actually do?",
  "Decision-Making": "Walk me through a hard decision you made with incomplete information. How did you decide when to stop deliberating?",
  Communication: "Describe a moment you had to explain something complex to someone who disagreed with you. How did you approach it?",
  "Stress-Resilience": "Tell me about the most pressured period in your recent work. What did you do on the worst day of it?",
  "Analytical Thinking": "Give me an example where the data pointed one way and intuition another. What did you do?",
  "Customer Empathy": "Tell me about a time you changed a plan because of something a customer said or did.",
  "Growth Potential": "What is something you were genuinely bad at professionally, and how did you get good at it?",
};

const FOLLOWUPS = [
  "What was your specific role in that — what did you personally decide or do?",
  "What was the measurable outcome, and how do you know?",
  "If you faced it again tomorrow, what would you do differently?",
];

export function interviewStepStub(req: InterviewStepRequest): InterviewStepResponse {
  const ordered = [...req.competencies].sort((a, b) => b.weight - a.weight).slice(0, 5);
  const mainsAsked = req.history.filter((t) => t.kind === "main").length;
  const last = req.history[req.history.length - 1];
  const totalPlanned = ordered.length + 2; // rough: mains + ~2 follow-ups

  // follow-up rule (stands in for consistency/depth checks): short answer → probe once
  if (last?.answer && last.kind === "main" && last.answer.trim().length < 140) {
    return {
      done: false,
      question: FOLLOWUPS[mainsAsked % FOLLOWUPS.length],
      topic: last.topic,
      kind: "followup",
      progress: Math.min(0.95, req.history.length / totalPlanned),
    };
  }

  if (mainsAsked >= ordered.length) {
    return {
      done: true,
      progress: 1,
      closing: "That's everything from my side — thank you. Your answers now go to the scoring pipeline, and a human reviewer makes the final call. You can follow your status any time.",
    };
  }

  const next = ordered[mainsAsked];
  return {
    done: false,
    question: MAIN_TEMPLATES[next.name] ?? `Tell me about a concrete situation that shows your ${next.name.toLowerCase()}. What happened and what did you do?`,
    topic: next.name,
    kind: "main",
    progress: Math.min(0.9, req.history.length / totalPlanned),
  };
}
