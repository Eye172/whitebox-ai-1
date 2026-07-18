/* Typed fixtures matching the data model — MASTERDOC · Book I · Part XII.
   UI is built against these until the AI/backend tickets land (Book V rule 5). */

export type ConfidenceBand = "High" | "Medium" | "Low";
export type Tier = "Top" | "Mid" | "Bottom";
export type VerificationStatus = "VERIFIED" | "PENDING" | "—";
export type VacancyStatus = "DRAFT" | "LIVE" | "CLOSED";

export interface EvidenceSpan {
  quote: string;
  timestamp: string; // mm:ss into interview
  question: string;
}

export interface Driver {
  text: string;
  impact: number; // 0..1, principal reason first
  direction: "pos" | "neg";
}

export interface CompetencyScore {
  id: string;
  name: string;
  score: number; // 0..100
  weight: number; // % of overall
  drivers: Driver[]; // ranked, top 3–5, FICO reason-code model
  confidence: ConfidenceBand;
  confidenceReason: string; // confidence is a phrase, never a bare number
  evidence: EvidenceSpan[];
  trace: string[]; // plain-language reasoning steps, collapsed by default
  docVerified?: boolean;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action: "SCORED" | "APPROVED" | "REJECTED" | "ESCALATED" | "OVERRIDDEN" | "REVEALED";
  target: string;
  reason?: string;
  modelVer: string;
  hash: string;
}

export interface Candidate {
  internalId: string;
  rank: number;
  overall: number;
  tier: Tier;
  confidence: ConfidenceBand;
  confidencePhrase: string;
  verification: VerificationStatus;
  divergence: boolean; // human overrode AI
  integrityAdvisory: boolean; // advisory only, never a verdict
  appliedAt: string;
  competencies: CompetencyScore[];
  strengths: string[];
  weaknesses: string[];
  audit: AuditEntry[];
}

export interface Vacancy {
  id: string;
  title: string;
  status: VacancyStatus;
  code: string;
  configVersion: number;
  candidates: number;
  needReview: number;
  funnel: number[]; // code → registration → profile → interview → verification → shortlist
}

export const vacancies: Vacancy[] = [
  { id: "vac-005", title: "Product Manager — Marketplace", status: "LIVE", code: "WBX-3N8D", configVersion: 1, candidates: 1, needReview: 0, funnel: [1, 1, 0, 0, 0, 0] },
  { id: "vac-001", title: "Team Lead — Core Platform", status: "LIVE", code: "WBX-7Q4K", configVersion: 3, candidates: 214, needReview: 12, funnel: [214, 186, 171, 128, 96, 41] },
  { id: "vac-002", title: "Senior Product Designer", status: "LIVE", code: "WBX-2M9F", configVersion: 1, candidates: 158, needReview: 4, funnel: [158, 140, 122, 87, 63, 22] },
  { id: "vac-003", title: "Data Engineer (Analytics)", status: "DRAFT", code: "WBX-5T1C", configVersion: 1, candidates: 0, needReview: 0, funnel: [0, 0, 0, 0, 0, 0] },
  { id: "vac-004", title: "Customer Success Manager", status: "CLOSED", code: "WBX-9K2R", configVersion: 5, candidates: 302, needReview: 0, funnel: [302, 270, 244, 190, 141, 58] },
];

export const kpis = [
  { label: "ACTIVE VACANCIES", value: 2, trend: 0, spark: [1, 1, 2, 2, 2, 2, 2] },
  { label: "TOTAL CANDIDATES", value: 674, trend: 12.4, spark: [420, 480, 512, 555, 590, 640, 674] },
  { label: "PASSED THRESHOLD", value: 96, trend: 8.1, spark: [40, 52, 61, 70, 78, 88, 96] },
  { label: "IN INVITED LIST", value: 41, trend: 5.2, spark: [12, 18, 22, 27, 31, 36, 41] },
  { label: "AVG SCORE", value: 71.3, trend: 1.8, spark: [66, 67, 68, 69, 70, 71, 71.3] },
  { label: "OPEN BIAS FLAGS", value: 1, trend: -50, spark: [4, 3, 3, 2, 2, 2, 1], alert: true },
];

const mkAudit = (cid: string): AuditEntry[] => [
  { id: "AE-0091", timestamp: "2026-07-16 09:12:04", actor: "model v2.3", action: "SCORED", target: `${cid} · all competencies`, modelVer: "wbx-score-2.3 / prompt v11 / rubric v3", hash: "9f4e2ab1…c07d" },
  { id: "AE-0114", timestamp: "2026-07-16 14:47:31", actor: "a.rakhimova (HR)", action: "OVERRIDDEN", target: `${cid} · Communication`, reason: "Answer at 24:10 shows structured conflict handling the model under-weighted.", modelVer: "wbx-score-2.3", hash: "b21c88fe…19aa" },
  { id: "AE-0117", timestamp: "2026-07-16 14:49:02", actor: "a.rakhimova (HR)", action: "APPROVED", target: `${cid} · overall`, modelVer: "wbx-score-2.3", hash: "77d0c4e9…f3b2" },
];

const leadership: CompetencyScore = {
  id: "leadership",
  name: "Leadership",
  score: 84,
  weight: 25,
  confidence: "High",
  confidenceReason: "High confidence — consistent evidence across 5 answers, low variance between episodes.",
  drivers: [
    { text: "Described leading a 6-person team through a failed release with a concrete recovery plan", impact: 0.42, direction: "pos" },
    { text: "Took ownership of an unpopular decision and explained the trade-off to stakeholders", impact: 0.31, direction: "pos" },
    { text: "Delegation examples were secondhand rather than personally driven", impact: 0.14, direction: "neg" },
  ],
  evidence: [
    { quote: "I told the team the rollback was my call — we lost two days, but we shipped a stable build and I walked sales through why.", timestamp: "12:40", question: "Tell me about a difficult decision you made under pressure." },
    { quote: "I split the incident into three tracks and assigned owners before the postmortem, not after.", timestamp: "18:22", question: "How do you organize a team in a crisis?" },
  ],
  trace: [
    "Collected 5 answer segments tagged leadership-relevant",
    "Matched segments against rubric v3 anchors (ownership, delegation, direction-setting)",
    "Weighted personally-driven episodes above secondhand reports",
    "Cross-checked consistency with answers at 12:40 and 18:22 — no contradiction",
    "Assigned band 80–85, settled 84 on evidence density",
  ],
  docVerified: true,
};

const decisionMaking: CompetencyScore = {
  id: "decision-making",
  name: "Decision-Making",
  score: 78,
  weight: 20,
  confidence: "High",
  confidenceReason: "High confidence — 4 independent episodes, all with verifiable outcomes.",
  drivers: [
    { text: "Consistently framed decisions as reversible vs irreversible before committing", impact: 0.38, direction: "pos" },
    { text: "Quantified trade-offs in two of four examples", impact: 0.27, direction: "pos" },
    { text: "One example lacked a stated outcome — depth unverified", impact: 0.18, direction: "neg" },
  ],
  evidence: [
    { quote: "For reversible calls I decide same-day; for the migration I ran a one-week spike because you can't easily walk that back.", timestamp: "24:10", question: "How do you decide how long to deliberate?" },
  ],
  trace: [
    "Identified 4 decision episodes in transcript",
    "Scored each against rubric anchors (framing, information use, outcome)",
    "Discounted episode 3 — no outcome stated after follow-up",
    "Aggregated to 78 with weight on recency",
  ],
};

const communication: CompetencyScore = {
  id: "communication",
  name: "Communication",
  score: 72,
  weight: 20,
  confidence: "Medium",
  confidenceReason: "Medium confidence — clear structure, but only 2 stakeholder-facing episodes to draw on.",
  drivers: [
    { text: "Answers followed situation → action → result structure without prompting", impact: 0.35, direction: "pos" },
    { text: "Adapted register when asked to explain a technical topic to a non-technical audience", impact: 0.29, direction: "pos" },
    { text: "Limited evidence of upward communication with executives", impact: 0.2, direction: "neg" },
  ],
  evidence: [
    { quote: "With the CFO I dropped the architecture and led with the two numbers that would change her decision.", timestamp: "31:05", question: "Explain a technical trade-off to a non-technical stakeholder." },
  ],
  trace: [
    "Segmented 12 answers for structural clarity",
    "Rated register-shift exercise at 31:05 as strong",
    "Flagged low episode count for stakeholder communication → confidence Medium",
  ],
};

const stressResilience: CompetencyScore = {
  id: "stress-resilience",
  name: "Stress-Resilience",
  score: 61,
  weight: 15,
  confidence: "Low",
  confidenceReason: "Low confidence — answers shortened notably under the pressure sequence; evidence is thin and mixed.",
  drivers: [
    { text: "Stayed composed and structured during rapid follow-up sequence", impact: 0.3, direction: "pos" },
    { text: "Answer length dropped 60% under pressure questions vs baseline", impact: 0.28, direction: "neg" },
    { text: "Recovery example described avoidance rather than management of the stressor", impact: 0.22, direction: "neg" },
  ],
  evidence: [
    { quote: "Honestly, I just took the weekend off and came back to it.", timestamp: "38:47", question: "What did you do after the incident escalated?" },
  ],
  trace: [
    "Compared answer dynamics baseline vs pressure sequence",
    "Two of three episodes scored below rubric anchor 3",
    "Evidence density below threshold → confidence Low, human review recommended",
  ],
};

const growthPotential: CompetencyScore = {
  id: "growth",
  name: "Growth Potential",
  score: 81,
  weight: 20,
  confidence: "Medium",
  confidenceReason: "Medium confidence — strong learning narrative, partially self-reported and not yet document-verified.",
  drivers: [
    { text: "Self-taught distributed-systems track with a shipped side project as proof", impact: 0.4, direction: "pos" },
    { text: "Sought and acted on critical feedback in the last review cycle", impact: 0.26, direction: "pos" },
    { text: "Certification claim pending document verification", impact: 0.12, direction: "neg" },
  ],
  evidence: [
    { quote: "The first design review tore my proposal apart. The second one passed — I kept both docs, the diff is the learning.", timestamp: "44:12", question: "Tell me about something you were bad at and got good at." },
  ],
  trace: [
    "Extracted learning-velocity signals from 3 answers",
    "Cross-referenced claimed certification — verification pending",
    "Scored 81; confidence held at Medium until documents verify",
  ],
};

export const candidates: Candidate[] = [
  {
    internalId: "CND-4A19", rank: 1, overall: 84, tier: "Top", confidence: "High",
    confidencePhrase: "High confidence — consistent evidence across competencies",
    verification: "VERIFIED", divergence: true, integrityAdvisory: false,
    appliedAt: "2026-07-02",
    competencies: [leadership, decisionMaking, communication, stressResilience, growthPotential],
    strengths: ["Owns decisions publicly and explains trade-offs", "Reversible/irreversible decision framing", "Fast, evidenced learning loop"],
    weaknesses: ["Thin evidence under pressure sequences", "Limited executive-level communication", "Delegation partly secondhand"],
    audit: mkAudit("CND-4A19"),
  },
  { internalId: "CND-7C02", rank: 2, overall: 81, tier: "Top", confidence: "High", confidencePhrase: "High confidence — 6 corroborated episodes", verification: "VERIFIED", divergence: false, integrityAdvisory: false, appliedAt: "2026-07-03", competencies: [{ ...leadership, score: 79 }, { ...decisionMaking, score: 83 }, { ...communication, score: 80 }, { ...stressResilience, score: 70, confidence: "Medium" }, { ...growthPotential, score: 77 }], strengths: ["Strong stakeholder narrative"], weaknesses: ["Fewer crisis episodes"], audit: mkAudit("CND-7C02") },
  { internalId: "CND-2F44", rank: 3, overall: 77, tier: "Top", confidence: "Medium", confidencePhrase: "Medium confidence — good depth, few verifiable outcomes", verification: "PENDING", divergence: false, integrityAdvisory: true, appliedAt: "2026-07-01", competencies: [{ ...leadership, score: 74 }, { ...decisionMaking, score: 80 }, { ...communication, score: 76 }, { ...stressResilience, score: 72 }, { ...growthPotential, score: 82 }], strengths: ["High learning velocity"], weaknesses: ["Outcomes hard to verify"], audit: mkAudit("CND-2F44") },
  { internalId: "CND-9B71", rank: 4, overall: 74, tier: "Mid", confidence: "High", confidencePhrase: "High confidence — consistent but mid-band evidence", verification: "VERIFIED", divergence: false, integrityAdvisory: false, appliedAt: "2026-07-05", competencies: [{ ...leadership, score: 71 }, { ...decisionMaking, score: 75 }, { ...communication, score: 78 }, { ...stressResilience, score: 69 }, { ...growthPotential, score: 76 }], strengths: ["Clear communicator"], weaknesses: ["Few leadership episodes"], audit: mkAudit("CND-9B71") },
  { internalId: "CND-5E28", rank: 5, overall: 72, tier: "Mid", confidence: "Medium", confidencePhrase: "Medium confidence — variance between early and late answers", verification: "VERIFIED", divergence: true, integrityAdvisory: false, appliedAt: "2026-07-04", competencies: [{ ...leadership, score: 70 }, { ...decisionMaking, score: 72 }, { ...communication, score: 74 }, { ...stressResilience, score: 68 }, { ...growthPotential, score: 75 }], strengths: ["Steady under follow-ups"], weaknesses: ["Inconsistent early answers"], audit: mkAudit("CND-5E28") },
  { internalId: "CND-1D93", rank: 6, overall: 69, tier: "Mid", confidence: "Medium", confidencePhrase: "Medium confidence — solid but shallow episode pool", verification: "—", divergence: false, integrityAdvisory: false, appliedAt: "2026-07-06", competencies: [{ ...leadership, score: 66 }, { ...decisionMaking, score: 70 }, { ...communication, score: 71 }, { ...stressResilience, score: 65 }, { ...growthPotential, score: 73 }], strengths: ["Practical examples"], weaknesses: ["Shallow episode pool"], audit: mkAudit("CND-1D93") },
  { internalId: "CND-8H56", rank: 7, overall: 63, tier: "Mid", confidence: "Low", confidencePhrase: "Low confidence — short answers, few follow-up recoveries", verification: "PENDING", divergence: false, integrityAdvisory: true, appliedAt: "2026-07-07", competencies: [{ ...leadership, score: 60 }, { ...decisionMaking, score: 64 }, { ...communication, score: 66 }, { ...stressResilience, score: 58 }, { ...growthPotential, score: 68 }], strengths: ["Concise"], weaknesses: ["Low evidence density"], audit: mkAudit("CND-8H56") },
  { internalId: "CND-3J07", rank: 8, overall: 58, tier: "Bottom", confidence: "Medium", confidencePhrase: "Medium confidence — consistent, but below threshold on 3 of 5", verification: "VERIFIED", divergence: false, integrityAdvisory: false, appliedAt: "2026-07-02", competencies: [{ ...leadership, score: 55 }, { ...decisionMaking, score: 59 }, { ...communication, score: 62 }, { ...stressResilience, score: 54 }, { ...growthPotential, score: 61 }], strengths: ["Honest self-assessment"], weaknesses: ["Below threshold on core competencies"], audit: mkAudit("CND-3J07") },
];

export const attentionQueue = [
  { id: "CND-8H56", reason: "Low-confidence scores await human review", kind: "review" as const },
  { id: "CND-2F44", reason: "Integrity advisory — window switching during Q7", kind: "flag" as const },
  { id: "CND-5E28", reason: "Calibration divergence between 2 reviewers", kind: "divergence" as const },
  { id: "VAC-002", reason: "Score distribution anomaly in group B", kind: "bias" as const },
];

export const threshold = 65;

/* ---- competitions the candidate side can join by code ------------------ */
/* WBX-3N8D was created through the NL→config wizard from this employer text: */
export const employerBrief = `Ищем Product Manager для маркетплейса. Важнее всего: умение принимать решения по данным и метрикам, коммуникация со стейкхолдерами и командой разработки, эмпатия к клиенту и пользователю. Постоянные дедлайны и конфликтующие приоритеты — нужна стрессоустойчивость. Опыт важен, но потенциал роста в приоритете. Высшее образование — плюс, диплом проверяем.`;

export interface Competition {
  vacancyId: string;
  title: string;
  code: string;
  competencies: { name: string; weight: number }[];
  /* where the code drops the candidate: fresh competition → interview flow,
     already-completed application (demo) → status page */
  entry: "interview" | "status";
}

export const competitions: Record<string, Competition> = {
  "WBX-3N8D": {
    vacancyId: "vac-005",
    title: "Product Manager — Marketplace",
    code: "WBX-3N8D",
    competencies: [
      { name: "Decision-Making", weight: 22 },
      { name: "Communication", weight: 22 },
      { name: "Customer Empathy", weight: 20 },
      { name: "Stress-Resilience", weight: 18 },
      { name: "Growth Potential", weight: 18 },
    ],
    entry: "interview",
  },
  "WBX-7Q4K": {
    vacancyId: "vac-001",
    title: "Team Lead — Core Platform",
    code: "WBX-7Q4K",
    competencies: [
      { name: "Leadership", weight: 25 },
      { name: "Decision-Making", weight: 20 },
      { name: "Communication", weight: 20 },
      { name: "Stress-Resilience", weight: 15 },
      { name: "Growth Potential", weight: 20 },
    ],
    entry: "status",
  },
};

export const candidateStatus = {
  code: "WBX-7Q4K",
  vacancyTitle: "Team Lead — Core Platform",
  status: "under_review" as const,
  steps: [
    { label: "Code", done: true },
    { label: "Register", done: true },
    { label: "Profile", done: true },
    { label: "System check", done: true },
    { label: "Interview", done: true },
    { label: "Documents", done: true },
    { label: "Done", done: false },
  ],
};
