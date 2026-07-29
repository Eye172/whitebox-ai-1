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

/* ---------- 3 · STUDIO AUTHORING STUBS (SPEC §4.3.3 suggestion engine,
   §4.4 question/rubric/SJT drafting, §8.4 authoring.* prompts) ----------
   These stand in for the authoring.question / authoring.rubric /
   authoring.sjt prompt family — they never run on candidates. */

import type {
  AttributeKind, AttributeSpec, CategorySpec, IndustryPack, InterviewQuestion,
  KnockoutItem, PipelineBlock, PositionProfile, QuestionType, Rubric, Seniority,
  SjtItem, VacancyV2,
} from "./types";
import { createEmptyDraft } from "./studio";
import { createBlock } from "./blocks";

const rand = () => Math.random().toString(36).slice(2, 8);
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

/* —— BARS anchor generator: concrete observable behaviors per level, per kind (§4.3.2) —— */

function barsFor(kind: AttributeKind, topic: string): [string, string, string, string, string] {
  const t = topic.toLowerCase();
  /* The skill treatment doubles as the fallback: AttributeKind is an open union,
     so an author-defined kind is a legal value that reaches here. */
  const asSkill: [string, string, string, string, string] = [
    `Talks about ${t} in general terms only; no personally executed example.`,
    `Describes taking part in ${t} work, but actions were directed by others and outcomes go unstated.`,
    `Gives one concrete, self-driven episode of ${t} with a clear action and a plausible outcome.`,
    `Names the situation, their own decisions, and a measured outcome; explains why the approach fit the constraints.`,
    `Multiple quantified episodes across contexts; anticipates failure modes and teaches the approach to others.`,
  ];
  switch (kind) {
    case "trait":
      return [
        `No behavioral evidence of ${t}; answers stay hypothetical.`,
        `Claims ${t} but examples are secondhand or contradicted elsewhere in the interview.`,
        `One credible episode showing ${t} in a real situation with their own behavior at the center.`,
        `Consistent pattern across two or more episodes, including one where showing ${t} carried a personal cost.`,
        `Pattern is stable under pressure and follow-ups; behavior, reflection, and outcomes all align.`,
      ];
    case "knowledge":
      return [
        `Misstates core concepts of ${t}.`,
        `Recites definitions of ${t} but cannot apply them to a scenario.`,
        `Applies ${t} correctly to a standard scenario.`,
        `Applies ${t} to a novel scenario, naming the trade-offs and limits involved.`,
        `Expert command of ${t}: corrects flawed premises and connects it to adjacent domains with current practice.`,
      ];
    case "qualification":
      return [
        `Credential absent and no equivalent evidence offered.`,
        `Claims the credential; no document provided yet.`,
        `Credential claimed with consistent detail (issuer, year); verification pending.`,
        `Document provided and machine-matched to the claim.`,
        `Document verified and corroborated by demonstrated use in a concrete episode.`,
      ];
    case "experience":
      return [
        `No relevant tenure; examples come from unrelated contexts.`,
        `Brief or peripheral exposure to the ${t} scope.`,
        `Meets the stated tenure with duties matching the scope described.`,
        `Exceeds the tenure with visibly growing responsibility across roles.`,
        `Deep tenure with ownership of outcomes others depended on, verifiable across sources.`,
      ];
    case "language":
      return [
        `Cannot sustain a basic professional exchange.`,
        `Handles simple routine exchanges only; frequent breakdowns.`,
        `Handles routine professional communication with occasional errors (≈B1–B2).`,
        `Communicates fluently on complex topics with minor slips (≈C1).`,
        `Near-native precision and register control (≈C2).`,
      ];
    case "skill":
    default:
      return asSkill;
  }
}

const VERIFICATION_BY_KIND: Record<AttributeKind, AttributeSpec["verification"]> = {
  skill: "interview",
  trait: "interview",
  knowledge: "test",
  qualification: "document", // §4.3.2: qualifications default to document proof
  experience: "interview",
  language: "test",
};

/* —— attribute atlas: COMPETENCY_SIGNALS extended with kinds, categories, definitions —— */

interface AttrTemplate {
  name: string;
  kind: AttributeKind;
  cat: "craft" | "people" | "drive";
  trigger: RegExp;
  definition: string;
  rationaleHit: string;
  rationaleMiss: string;
  priority: number; // focus ranking among hits — lower is stronger
}

const ATTRIBUTE_ATLAS: AttrTemplate[] = [
  { name: "Decision quality", kind: "skill", cat: "craft", priority: 1,
    trigger: /decision|решени|priorit|приорит|trade-?off|бюджет|budget|scope/i,
    definition: "Makes calls under incomplete information and can name what would change their mind.",
    rationaleHit: "The description stresses making calls under constraints — high impact on outcomes.",
    rationaleMiss: "Included at base weight: every professional role decides something." },
  { name: "Structured problem solving", kind: "skill", cat: "craft", priority: 2,
    trigger: /analy|аналит|data|данн|metric|метрик|problem|проблем|research|исследов/i,
    definition: "Breaks an ambiguous problem into checkable parts and shows the reasoning that led to the answer.",
    rationaleHit: "The role asks for reasoning over data and metrics explicitly.",
    rationaleMiss: "Baseline analytical expectation for the seniority level." },
  { name: "Domain knowledge", kind: "knowledge", cat: "craft", priority: 4,
    trigger: /процесс|process|стандарт|standard|методолог|methodolog|framework|регламент|domain|отрасл/i,
    definition: "Applies the field's core concepts correctly to concrete cases, not just by the book.",
    rationaleHit: "The description references domain processes and standards — tested, not self-reported.",
    rationaleMiss: "Light-weight knowledge check to anchor the interview evidence." },
  { name: "Tooling fluency", kind: "skill", cat: "craft", priority: 5,
    trigger: /sql|python|excel|figma|crm|jira|api|1c|1с|стек|stack|tool|инструмент/i,
    definition: "Uses the role's core tools hands-on to produce work others rely on.",
    rationaleHit: "Named tools appear in the description — fluency is observable in a work sample.",
    rationaleMiss: "Kept small: no specific tooling named by the employer." },
  { name: "Stakeholder communication", kind: "skill", cat: "people", priority: 2,
    trigger: /communicat|коммуника|stakeholder|стейкхолдер|презент|present|переговор|negotia|клиент|client/i,
    definition: "Explains complex material to a specific audience and lands the decision that matters.",
    rationaleHit: "Stakeholder and client interaction is explicit in the employer's text.",
    rationaleMiss: "Baseline weight for any collaborative role." },
  { name: "People leadership", kind: "skill", cat: "people", priority: 1,
    trigger: /\blead|лидер|руковод|manag|команд|team|наставн|mentor/i,
    definition: "Sets direction for others, owns unpopular calls, and grows the people around them.",
    rationaleHit: "The description names leading people directly — weighted as a focus attribute.",
    rationaleMiss: "Kept at a low weight: the role text does not emphasize people leadership." },
  { name: "Customer empathy", kind: "trait", cat: "people", priority: 3,
    trigger: /клиент|customer|пользовател|user|сервис|service|эмпат|empath/i,
    definition: "Changes a plan because of something a real customer said, did, or needed.",
    rationaleHit: "Customer and user focus is called out — measured through scenario questions.",
    rationaleMiss: "Small weight: no customer-facing signals found." },
  { name: "Collaboration", kind: "trait", cat: "people", priority: 6,
    trigger: /сотруднич|collaborat|cross-?functional|кросс-?функ|партнер|partner/i,
    definition: "Moves work forward across functions without formal authority, keeping others informed.",
    rationaleHit: "Cross-functional work appears in the description.",
    rationaleMiss: "Default people signal so the category never rests on one attribute." },
  { name: "Ownership", kind: "trait", cat: "drive", priority: 3,
    trigger: /ответствен|responsib|ownership|инициатив|initiativ|drive|самостоятел/i,
    definition: "Takes a result personally end-to-end, including the parts nobody assigned.",
    rationaleHit: "The employer emphasizes autonomous responsibility for outcomes.",
    rationaleMiss: "Kept as a base expectation of professional maturity." },
  { name: "Learning velocity", kind: "trait", cat: "drive", priority: 4,
    trigger: /learn|обуча|рост|growth|потенциал|potential|развит|develop|curios|любозн/i,
    definition: "Turns feedback and new domains into demonstrable capability, fast.",
    rationaleHit: "The employer explicitly prioritizes growth potential over current experience.",
    rationaleMiss: "Kept small: growth is not mentioned as a priority." },
  { name: "Resilience under pressure", kind: "trait", cat: "drive", priority: 2,
    trigger: /стресс|stress|давлен|pressure|дедлайн|deadline|конфликт|conflict|кризис|crisis|аврал/i,
    definition: "Keeps output and judgment stable when timelines compress or conflict flares.",
    rationaleHit: "Pressure and conflict situations appear in the employer's text.",
    rationaleMiss: "Low weight: no pressure context named." },
];

const CATEGORY_META: Record<AttrTemplate["cat"], { name: string; rationaleBase: string }> = {
  craft: { name: "Core craft", rationaleBase: "the doing of the job itself — what the person produces and how they reason" },
  people: { name: "Working with people", rationaleBase: "the role happens through other people — stakeholders, customers, the team" },
  drive: { name: "Drive and growth", rationaleBase: "how the person carries responsibility and compounds over time" },
};

/* normalize integer shares to exactly 100 (last item absorbs rounding) */
function normalizeTo100(shares: number[]): number[] {
  const total = shares.reduce((a, b) => a + b, 0) || 1;
  let acc = 0;
  return shares.map((s, i) => {
    const w = i === shares.length - 1 ? 100 - acc : Math.round((s / total) * 100);
    acc += w;
    return w;
  });
}

/* —— SPEC §4.3.3 — the suggestion engine —— */

export function suggestCriteria(profile: PositionProfile): CategorySpec[] {
  const text = [profile.title, profile.mission, ...(profile.responsibilities ?? [])].join(". ");
  const seniorPlus = ["Senior", "Lead", "Head", "Executive"].includes(profile.seniority);
  const juniorish = ["Intern", "Junior"].includes(profile.seniority);

  const scored = ATTRIBUTE_ATLAS.map((a) => {
    let hit = a.trigger.test(text);
    /* seniority moderators */
    if (a.name === "People leadership" && seniorPlus) hit = true;
    if (a.name === "Learning velocity" && juniorish) hit = true;
    return { a, hit };
  });

  /* focus: strongest signals only, max 3 across the whole vacancy */
  const focusIds = new Set(
    scored.filter((s) => s.hit).sort((x, y) => x.a.priority - y.a.priority).slice(0, 3).map((s) => s.a.name)
  );

  const cats: CategorySpec[] = (["craft", "people", "drive"] as const).map((catKey) => {
    const pool = scored.filter((s) => s.a.cat === catKey);
    const hits = pool.filter((s) => s.hit);
    const picked = [...hits, ...pool.filter((s) => !s.hit)].slice(0, Math.max(2, Math.min(4, hits.length || 2)));
    const weights = normalizeTo100(picked.map((p) => (focusIds.has(p.a.name) ? 2 : 1)));
    const attributes: AttributeSpec[] = picked.map((p, i) => ({
      id: `attr-${slug(p.a.name)}`,
      name: p.a.name,
      kind: p.a.kind,
      definition: p.a.definition,
      weight: weights[i],
      focus: focusIds.has(p.a.name) || undefined,
      scale: { anchors: barsFor(p.a.kind, p.a.name) },
      verification: VERIFICATION_BY_KIND[p.a.kind],
      rationale: p.hit ? p.a.rationaleHit : p.a.rationaleMiss,
    }));
    const meta = CATEGORY_META[catKey];
    return {
      id: `cat-${catKey}`,
      name: meta.name,
      weight: 0, // set below
      attributes,
      rationale: hits.length
        ? `Weighted by ${hits.length} direct signal${hits.length > 1 ? "s" : ""} in the description — ${meta.rationaleBase}.`
        : `Kept at base weight — ${meta.rationaleBase}.`,
    };
  });

  /* category weights: 2 base shares + 1 per hit inside, normalized to 100 */
  const catShares = cats.map((c, i) =>
    2 + scored.filter((s) => s.hit && s.a.cat === (["craft", "people", "drive"] as const)[i]).length
  );
  normalizeTo100(catShares).forEach((w, i) => { cats[i].weight = w; });
  return cats;
}

/* —— rubric drafting: anchors flow from the attribute scale (§4.4.4 rubric lock) —— */

export function draftRubric(attr: AttributeSpec): Rubric {
  return {
    id: "r-" + rand(),
    attributeId: attr.id,
    anchors: [...attr.scale.anchors] as [string, string, string, string, string],
    version: 1,
  };
}

/* —— question drafting: behavioral STAR-eliciting for Middle+, situational for
   Junior/Intern (Huffcutt moderator, R-I.2) — with pre-approved probes only —— */

const AUTHOR_PROBES = [
  "What was your specific role in that — what did you personally decide or do?",
  "What was the measurable outcome, and how do you know?",
];

function questionTextFor(attr: AttributeSpec, type: QuestionType): string {
  const n = attr.name.toLowerCase();
  switch (type) {
    case "behavioral":
      switch (attr.kind) {
        case "trait":
          return `Describe a time your ${n} was genuinely tested. What was the situation, what did you do, and what came of it?`;
        case "knowledge":
          return `Tell me about a time you applied your ${n} to a real problem. What did you know that changed the outcome?`;
        case "experience":
          return `Walk me through the most representative project from your ${n}. What was your specific role, and what happened?`;
        case "language":
          return `Tell me about a situation where you had to work entirely in another language. What was at stake, and how did it go?`;
        default:
          return `Tell me about a recent piece of work where ${n} made the difference. What was the situation, and what did you personally do?`;
      }
    case "situational":
      switch (attr.kind) {
        case "trait":
          return `Suppose in your first month here a commitment you made starts slipping and your ${n} is put to the test. What exactly would you do, in order?`;
        case "knowledge":
          return `A colleague proposes a plan that conflicts with how ${n} actually works. What do you check first, and what do you tell them?`;
        default:
          return `Imagine a task lands in your first month that depends entirely on ${n}, with half the time you'd want. Walk me through what you would do, step by step.`;
      }
    case "background":
      return `Which parts of your background best evidence ${n}? Give the concrete facts — dates, scope, outcomes.`;
    case "job_knowledge":
      return `Explain ${n} as you would apply it in this role: the core principles, and one common mistake people make with it.`;
    case "motivation":
      return `What draws you to work where ${n} matters daily? Anchor it in something you have actually done.`;
  }
}

export function draftQuestion(attr: AttributeSpec, type: QuestionType, seniority: Seniority): InterviewQuestion {
  /* Huffcutt moderator (R-I.2): past-behavior questions need a past to draw on —
     for Junior/Intern, behavioral requests are drafted as situational instead */
  const juniorish = seniority === "Junior" || seniority === "Intern";
  const effectiveType: QuestionType = type === "behavioral" && juniorish ? "situational" : type;
  return {
    id: "q-" + rand(),
    text: questionTextFor(attr, effectiveType),
    attributeId: attr.id,
    type: effectiveType,
    thinkTimeSec: 30,
    answerCapSec: 180,
    modality: "video",
    reRecordAttempts: 1,
    notesAllowed: true,
    probes: [...AUTHOR_PROBES],
    rubric: draftRubric(attr),
    source: "ai",
    rationale:
      effectiveType !== type
        ? `Drafted as situational rather than behavioral: ${seniority} candidates may lack past episodes, and situational questions predict as well at this level (R-I.2).`
        : `${effectiveType === "behavioral" ? "STAR-eliciting behavioral" : `A ${effectiveType.replace("_", " ")}`} question targeting “${attr.name}” — scored only against its own BARS rubric, with pre-approved probes.`,
  };
}

/* —— SJT drafting: industry scenario frames, 4 keyed options, SME review required —— */

const SJT_SCENARIOS: Record<IndustryPack, string> = {
  tech: "A release is due tomorrow; QA finds an intermittent bug nobody can reproduce reliably, and the product manager still wants to ship.",
  sales_cs: "A key account emails that they are considering a competitor — and copies your manager.",
  healthcare: "During a busy shift, a colleague skips a documented checklist step and asks you to sign off anyway.",
  finance: "You find a small reconciliation discrepancy on the morning the reports go out to the regulator.",
  retail_hourly: "Two customers need help at once, your queue is growing, and a delivery has just arrived at the door.",
  manufacturing: "A machine's safety guard keeps jamming; removing it would keep the line running until the end of the shift.",
  logistics: "A shipment will miss its delivery window unless you reroute it outside the approved process.",
  creative: "A client rejects the agreed concept a day before launch and asks for “something completely different”.",
  public_sector: "A citizen's request is clearly valid but falls outside the written procedure you are required to follow.",
  education: "A student challenges your grading decision in front of the whole class.",
  custom: "A deadline, a quality concern, and a colleague's urgent request all land in the same hour.",
};

export function draftSjtItem(attr: AttributeSpec, industry: IndustryPack, index: number): SjtItem {
  const n = attr.name.toLowerCase();
  return {
    id: `sjt-${index + 1}-${rand()}`,
    scenario: `${SJT_SCENARIOS[industry]} The situation turns on your ${n}.`,
    mediaKind: "text",
    options: [
      { id: `o-${index + 1}-a`, text: "Raise it immediately with the people affected, state the facts and the options, and propose a course of action.", keyScore: 3 },
      { id: `o-${index + 1}-b`, text: "Handle it quietly yourself first, and mention it afterwards if anyone asks.", keyScore: 1 },
      { id: `o-${index + 1}-c`, text: "Gather more information before acting, and set a clear time limit for the decision.", keyScore: 2 },
      { id: `o-${index + 1}-d`, text: "Escalate it upward and wait for instructions before doing anything.", keyScore: 0 },
    ],
    attributeId: attr.id,
    smeReviewed: false, // generated items require the SME checklist before they become scoreable (R-I.8)
  };
}

/* —— Describe mode: plain text → full VacancyV2 draft (§4.1 entry C) —— */

const SENIORITY_MARKERS: [RegExp, Seniority][] = [
  [/chief|c-level|\bceo\b|\bcto\b|\bcoo\b|founder|директор по/i, "Executive"],
  [/\bhead\b|head of|руководитель отдела|руководитель направления/i, "Head"],
  [/\blead\b|тимлид|team ?lead|ведущ/i, "Lead"],
  [/senior|синьор|сеньор|старш/i, "Senior"],
  [/junior|джун|младш/i, "Junior"],
  [/intern|стажер|стажёр|практикант/i, "Intern"],
];

const INDUSTRY_MARKERS: [RegExp, IndustryPack][] = [
  [/developer|engineer|программист|разработ|devops|frontend|backend|\bqa\b|data|product manager|продакт|\bit\b/i, "tech"],
  [/sales|продаж|account manager|customer success|\bsdr\b|\bbdr\b/i, "sales_cs"],
  [/nurse|врач|медиц|clinic|health|фармацевт/i, "healthcare"],
  [/финанс|financ|бухгалт|accountant|accounting|audit|аудит|банк|\bbank/i, "finance"],
  [/retail|магазин|кассир|store|продавец/i, "retail_hourly"],
  [/производств|manufactur|завод|plant|станк/i, "manufacturing"],
  [/логист|logist|warehouse|склад|courier|курьер|driver|водител/i, "logistics"],
  [/дизайн|design|copywrit|маркетолог|marketing|бренд|brand|content|контент/i, "creative"],
  [/государ|public sector|муницип|госуслуг/i, "public_sector"],
  [/учитель|teacher|препода|tutor|education|образователь/i, "education"],
];

const RE_CREDENTIAL = /диплом|degree|сертифи|certif|licen[cs]e|лиценз|высшее образование|образование обязательно/i;
const RE_MIN_YEARS = /(?:от|минимум|не менее|at least|minimum(?: of)?)\s*(\d{1,2})\s*(?:лет|год(?:а|ов)?|years?)|(\d{1,2})\+?\s*(?:лет|год(?:а|ов)?|years?)\s*(?:опыта|of experience|experience|relevant experience)/i;

export function nlToVacancyDraft(title: string, description: string): VacancyV2 {
  const draft = createEmptyDraft();
  const text = `${title}. ${description}`;
  const ru = /[а-яё]/i.test(description); // same language detection as nlToConfigStub

  const seniority = SENIORITY_MARKERS.find(([re]) => re.test(text))?.[1] ?? "Middle";
  const industryPack = INDUSTRY_MARKERS.find(([re]) => re.test(text))?.[1] ?? "custom";

  const sentences = description.split(/(?<=[.!?])\s+/).map((s) => s.trim()).filter((s) => s.length > 8);
  const mission = sentences.slice(0, 2).join(" ") || description.trim();
  const responsibilities = sentences.slice(2, 8).length ? sentences.slice(2, 8) : [mission];

  const profile: PositionProfile = {
    ...draft.profile,
    title,
    seniority,
    industryPack,
    mission,
    responsibilities,
    languages: { primary: ru ? "ru" : "en", alternates: ru ? ["en"] : [] },
  };

  const categories = suggestCriteria(profile);
  const allAttrs = categories.flatMap((c) => c.attributes);
  const interviewAttrs = [
    ...allAttrs.filter((a) => a.focus),
    ...allAttrs.filter((a) => !a.focus),
  ].slice(0, 6); // one question per attribute, max 6, focus first

  const credentialHit = RE_CREDENTIAL.test(text);
  const yearsMatch = text.match(RE_MIN_YEARS);
  const minYears = yearsMatch ? Number(yearsMatch[1] ?? yearsMatch[2] ?? 0) : 0;

  const pipeline: PipelineBlock[] = [];
  let order = 1;

  /* knockout only when the employer states hard requirements — neutral wording (§4.3.2) */
  if (credentialHit || minYears > 0) {
    const items: KnockoutItem[] = [];
    if (minYears > 0) {
      items.push({
        id: "ko-years",
        question: `How many years have you worked in roles like this one?`,
        type: "numeric_threshold",
        threshold: minYears,
        immediate: false, // routes to the knockout review tray, never the void
        rejectionText: `This role asks for at least ${minYears} year${minYears > 1 ? "s" : ""} of relevant experience. If your background covers the ground differently, you can explain — a person will read it.`,
        allowAppeal: true,
      });
    }
    if (credentialHit) {
      items.push({
        id: "ko-credential",
        question: "Do you hold the formal qualification named in the role description?",
        type: "yes_no",
        passValue: true,
        immediate: false,
        rejectionText: "This role names a formal qualification. If you have an equivalent, tell us — a person reviews every case.",
        allowAppeal: true,
      });
    }
    const ko = createBlock("knockout", order++);
    ko.title = "Basic requirements";
    ko.candidateIntro = "Two quick factual questions about the role's stated requirements. A person reviews every borderline answer — nothing here disappears into a void.";
    ko.scored = false;
    ko.estimatedMinutes = 2;
    ko.measures = [];
    ko.settings = { kind: "knockout", items, placement: "before_form" };
    pipeline.push(ko);
  }

  const cv = createBlock("cv_intake", order++);
  cv.title = "CV intake";
  cv.candidateIntro = "Upload your CV so we can pre-fill your answers and log the claims we should verify later. It is reviewed anonymized — names and photos are masked.";
  cv.scored = false;
  cv.estimatedMinutes = 3;
  cv.measures = [];
  cv.settings = {
    kind: "cv_intake",
    acceptedFormats: ["pdf", "docx"],
    maxSizeMb: 10,
    parseTargets: ["employment", "education", "certifications", "skills", "links"],
    anonymizeForReview: true,
    extractClaims: true,
    portfolioUrlField: industryPack === "creative" || industryPack === "tech",
  };
  pipeline.push(cv);

  const questions = interviewAttrs.map((a) =>
    draftQuestion(a, a.kind === "knowledge" ? "job_knowledge" : "behavioral", seniority)
  );
  const shares = normalizeTo100(interviewAttrs.map((a) => (a.focus ? 2 : 1)));
  const interview = createBlock("async_interview", order++);
  interview.title = "Structured interview";
  interview.candidateIntro = `Recorded interview: ${questions.length} questions, each tied to one published criterion — you can see exactly what is measured and why it is job-relevant. 30 seconds to think, up to 3 minutes to answer, one re-record.`;
  interview.scored = true;
  interview.estimatedMinutes = questions.length * 3 + 2;
  interview.measures = interviewAttrs.map((a, i) => ({ attributeId: a.id, share: shares[i] }));
  interview.settings = {
    kind: "async_interview",
    questions,
    followUpPolicy: 1,
    order: "fixed",
    introVideo: "none",
    practiceQuestion: true,
    pauseAllowance: 1,
    reviewBeforeSubmit: false,
  };
  pipeline.push(interview);

  if (credentialHit) {
    const doc = createBlock("doc_verification", order++);
    doc.title = "Document verification";
    doc.candidateIntro = "The role names a formal qualification, so we verify the document you referenced. Sources are checked, then deleted per the retention notice — a mismatch flags a human, it never auto-rejects.";
    doc.scored = false;
    doc.estimatedMinutes = 5;
    doc.measures = [];
    doc.settings = {
      kind: "doc_verification",
      requiredDocuments: [{ id: "doc-qual", label: "Diploma or certification named in the role description" }],
      acceptedFormats: ["pdf", "jpg", "png"],
      mode: "auto_extract_match",
      idCheck: false,
      placement: "post_shortlist",
    };
    pipeline.push(doc);
  }

  return { ...draft, profile, categories, pipeline };
}
