import { chainHash } from "./hash";
import type {
  Vacancy,
  Candidate,
  CompetencyScore,
  AuditEntry,
  BiasGroupMetric,
  BiasAlert,
  ReviewerConsistency,
  Tier,
  ConfidenceBand,
  TranscriptLine,
} from "./types";

/* ============================================================
   COMPETENCY TAXONOMY — the Team Lead vacancy config
   ============================================================ */
export const TEAMLEAD_CATEGORIES = [
  {
    name: "Leadership & People",
    weight: 34,
    attributes: [
      { id: "leadership", name: "Leadership potential", category: "Leadership & People", weight: 14, focus: true, type: "trait" as const },
      { id: "conflict", name: "Conflict resolution", category: "Leadership & People", weight: 10, focus: true, type: "trait" as const },
      { id: "communication", name: "Communication", category: "Leadership & People", weight: 10, type: "skill" as const },
    ],
  },
  {
    name: "Judgement & Thinking",
    weight: 33,
    attributes: [
      { id: "decision", name: "Decision-making", category: "Judgement & Thinking", weight: 13, focus: true, type: "trait" as const },
      { id: "critical", name: "Critical thinking", category: "Judgement & Thinking", weight: 11, type: "trait" as const },
      { id: "knowledge", name: "Professional knowledge", category: "Judgement & Thinking", weight: 9, type: "qualification" as const },
    ],
  },
  {
    name: "Resilience & Growth",
    weight: 33,
    attributes: [
      { id: "stress", name: "Stress-resilience", category: "Resilience & Growth", weight: 12, focus: true, type: "trait" as const },
      { id: "growth", name: "Growth potential", category: "Resilience & Growth", weight: 13, focus: true, type: "trait" as const },
      { id: "ownership", name: "Ownership & initiative", category: "Resilience & Growth", weight: 8, type: "trait" as const },
    ],
  },
];

const ALL_COMPETENCIES = TEAMLEAD_CATEGORIES.flatMap((c) => c.attributes);

/* ============================================================
   Believable driver / evidence libraries per competency
   ============================================================ */
const LIB: Record<
  string,
  {
    driversPos: string[];
    driversNeg: string[];
    evidence: { fragment: string; timestamp: string; speaker: "AI" | "Candidate" }[];
  }
> = {
  leadership: {
    driversPos: [
      "Describes delegating ownership rather than tasks — set outcomes, let the team choose the path",
      "Gave two concrete examples of growing a junior into a senior over 18 months",
      "Frames leadership as removing blockers, not directing work",
    ],
    driversNeg: ["Limited evidence of leading through a reorg or ambiguity"],
    evidence: [
      { fragment: "I stopped assigning tickets and started assigning problems — the team's velocity and morale both went up within a quarter.", timestamp: "07:42", speaker: "Candidate" },
      { fragment: "When a senior left, I paired their context onto two mids deliberately so the bus factor never dropped to one.", timestamp: "12:15", speaker: "Candidate" },
    ],
  },
  conflict: {
    driversPos: [
      "Walked through a specific two-engineer architecture disagreement and how they mediated to a decision",
      "Separates the person from the position — attacks the problem, not the people",
    ],
    driversNeg: ["One example resolved by escalation rather than direct mediation"],
    evidence: [
      { fragment: "I had them each write the strongest version of the *other's* proposal first. The heat dropped immediately.", timestamp: "19:03", speaker: "Candidate" },
    ],
  },
  communication: {
    driversPos: [
      "Answers are structured — claim, example, result — consistently across the interview",
      "Adjusts technical depth when asked to explain to a non-technical stakeholder",
    ],
    driversNeg: ["Occasionally long-winded before reaching the point"],
    evidence: [
      { fragment: "For the exec I'd say 'it buys us two weeks'; for the team I'd say 'it removes the migration lock on the users table'.", timestamp: "22:48", speaker: "Candidate" },
    ],
  },
  decision: {
    driversPos: [
      "Uses reversible-vs-irreversible framing to decide how much analysis a call deserves",
      "Made a costly call under incomplete data and owned the trade-off explicitly",
    ],
    driversNeg: ["Tends to over-index on consensus for reversible decisions"],
    evidence: [
      { fragment: "It was a one-way door, so I spent the extra day. If it had been reversible I'd have shipped and watched the metrics.", timestamp: "15:30", speaker: "Candidate" },
    ],
  },
  critical: {
    driversPos: [
      "Challenged the premise of a hypothetical rather than accepting it at face value",
      "Distinguishes correlation from causation unprompted when reasoning about metrics",
    ],
    driversNeg: ["Second hypothetical answered with a pattern-match rather than first-principles"],
    evidence: [
      { fragment: "Before optimising that query I'd ask whether we even need to read it that often — the fix might be upstream.", timestamp: "26:11", speaker: "Candidate" },
    ],
  },
  knowledge: {
    driversPos: [
      "Depth on distributed systems trade-offs (consistency, back-pressure, idempotency) is current and specific",
      "Cited a recent post-incident change with correct root-cause reasoning",
    ],
    driversNeg: ["Front-end platform knowledge is shallower than back-end"],
    evidence: [
      { fragment: "We made the consumer idempotent with a dedupe key so at-least-once delivery stopped double-charging.", timestamp: "29:57", speaker: "Candidate" },
    ],
  },
  stress: {
    driversPos: [
      "Recounts a Sev-1 incident with a calm, sequenced response and clear comms cadence",
      "Separates urgency from panic — protected the team from thrash during the outage",
    ],
    driversNeg: ["Admits recovery time after intense periods is longer than ideal"],
    evidence: [
      { fragment: "I set a 20-minute comms rhythm so leadership stopped DMing individuals and the team could actually work.", timestamp: "33:20", speaker: "Candidate" },
    ],
  },
  growth: {
    driversPos: [
      "Actively sought feedback that contradicted their self-image and acted on it",
      "Moved from IC to lead by deliberately practising the weakest skill first",
    ],
    driversNeg: [],
    evidence: [
      { fragment: "My reviews said I was a bottleneck, so I spent six months making myself unnecessary. It was the best thing I did.", timestamp: "38:04", speaker: "Candidate" },
    ],
  },
  ownership: {
    driversPos: [
      "Takes responsibility for a failed launch without deflecting to circumstances",
      "Initiated a reliability project no one asked for that cut on-call pages by 40%",
    ],
    driversNeg: ["Ownership examples are strong but concentrated in one past role"],
    evidence: [
      { fragment: "Nobody owned flaky tests, so I did. Page volume on that service dropped by about 40% in two months.", timestamp: "41:37", speaker: "Candidate" },
    ],
  },
};

const REASONING_TEMPLATES: Record<string, { label: string; detail: string }[]> = {
  default: [
    { label: "Retrieved rubric anchors", detail: "Loaded the vacancy-pinned rubric for this competency (rubric v3)." },
    { label: "Located candidate answers", detail: "Selected transcript spans where the competency was demonstrably exercised." },
    { label: "Scored against anchors", detail: "Mapped evidence to rubric levels; required at least one concrete example or abstained." },
    { label: "Ranked drivers by impact", detail: "Ordered reason codes principal-first (FICO/VantageScore structure)." },
    { label: "Calibrated confidence", detail: "Adjusted self-reported confidence against held-out reviewer agreement." },
  ],
};

/* ============================================================
   Candidate generation
   ============================================================ */
const NAMES = [
  { name: "Amara Okonkwo", location: "Lagos, NG", years: 9 },
  { name: "Daniel Reyes", location: "Austin, US", years: 11 },
  { name: "Mei-Lin Chen", location: "Singapore, SG", years: 8 },
  { name: "Sofia Marchetti", location: "Milan, IT", years: 10 },
  { name: "Yusuf Demir", location: "Berlin, DE", years: 7 },
  { name: "Priya Nair", location: "Bengaluru, IN", years: 12 },
  { name: "Lukas Novak", location: "Prague, CZ", years: 6 },
  { name: "Ana Beltran", location: "Bogotá, CO", years: 9 },
  { name: "Kenji Watanabe", location: "Tokyo, JP", years: 13 },
  { name: "Fatima Al-Sayed", location: "Dubai, AE", years: 8 },
  { name: "Oliver Grant", location: "Manchester, UK", years: 7 },
  { name: "Nadia Petrova", location: "Almaty, KZ", years: 10 },
];

function seeded(seed: number) {
  let s = seed % 2147483647;
  if (s <= 0) s += 2147483646;
  return () => (s = (s * 16807) % 2147483647) / 2147483647;
}

function bandFor(score: number, jitter: number): ConfidenceBand {
  const v = score + jitter;
  if (v >= 78) return "High";
  if (v >= 62) return "Med";
  return "Low";
}

function confidenceReason(band: ConfidenceBand, evidenceCount: number): string {
  if (band === "High") return `High confidence — consistent evidence across ${evidenceCount + 3} answers`;
  if (band === "Med") return `Medium confidence — supported, but ${evidenceCount === 1 ? "a single strong" : "limited"} example`;
  return "Low confidence — sparse evidence; recommend human review";
}

function makeCompetency(compId: string, base: number, rnd: () => number): CompetencyScore {
  const meta = ALL_COMPETENCIES.find((c) => c.id === compId)!;
  const score = Math.max(28, Math.min(97, Math.round(base + (rnd() - 0.5) * 26)));
  const lib = LIB[compId];
  const evidenceCount = score > 70 ? 2 : 1;
  const band = bandFor(score, (rnd() - 0.5) * 14);
  const drivers = [
    ...lib.driversPos.slice(0, score > 75 ? 3 : 2).map((text, i) => ({ text, impact: 0.9 - i * 0.22, direction: "pos" as const })),
    ...(score < 74 ? lib.driversNeg.slice(0, 1).map((text) => ({ text, impact: 0.34, direction: "neg" as const })) : []),
  ].sort((a, b) => b.impact - a.impact);

  return {
    id: compId,
    name: meta.name,
    category: meta.category,
    score,
    weight: meta.weight,
    confidence: band,
    confidenceReason: confidenceReason(band, evidenceCount),
    confidenceFactors: [
      { label: "Evidence count", value: `${evidenceCount + 2} spans` },
      { label: "Answer consistency", value: band === "High" ? "High" : band === "Med" ? "Moderate" : "Mixed" },
      { label: "Data quality", value: score > 60 ? "Clean audio, full answers" : "Some short answers" },
    ],
    drivers,
    evidence: lib.evidence.slice(0, evidenceCount),
    reasoning: REASONING_TEMPLATES.default.map((r) => ({
      ...r,
      latencyMs: Math.round(140 + rnd() * 900),
      tokens: Math.round(220 + rnd() * 1400),
    })),
    docVerified: compId === "knowledge" && score > 70,
  };
}

const STRENGTHS_POOL = [
  "Delegates outcomes, not tasks",
  "Calm, sequenced incident response",
  "Structures answers claim-example-result",
  "Reversible/irreversible decision framing",
  "Actively grows people around them",
  "Mediates conflict to a decision",
];
const WEAKNESS_POOL = [
  "Over-indexes on consensus for small calls",
  "Front-end platform depth is thinner",
  "Long recovery after intense periods",
  "Ownership concentrated in one past role",
  "Occasionally reaches the point slowly",
];

function integrityFor(rnd: () => number) {
  const r = rnd();
  if (r > 0.86) return { label: "2 signals", level: "medium" as const, note: "Longer-than-usual pauses on 2 answers; one window-switch. Advisory only." };
  if (r > 0.62) return { label: "1 signal", level: "low" as const, note: "One brief gaze shift detected. Advisory context, not a verdict." };
  return { label: "Clear", level: "none" as const, note: "No integrity signals raised." };
}

function makeTranscript(top: boolean): TranscriptLine[] {
  const base: TranscriptLine[] = [
    { t: "00:04", speaker: "AI", text: "Thanks for joining. To start — tell me about a time you led a team through real ambiguity." },
    { t: "00:22", speaker: "Candidate", text: "Sure. When our roadmap got cut in half mid-quarter, I reset the team around outcomes instead of the original tickets." },
    { t: "07:42", speaker: "Candidate", text: "I stopped assigning tickets and started assigning problems — the team's velocity and morale both went up within a quarter.", flag: "key" },
    { t: "12:15", speaker: "Candidate", text: "When a senior left, I paired their context onto two mids deliberately so the bus factor never dropped to one." },
    { t: "15:30", speaker: "Candidate", text: "It was a one-way door, so I spent the extra day. If it had been reversible I'd have shipped and watched the metrics.", flag: "key" },
    { t: "19:03", speaker: "Candidate", text: "I had them each write the strongest version of the other's proposal first. The heat dropped immediately." },
    { t: "24:10", speaker: "AI", text: "Let's go back to something you said earlier about velocity — how did you actually measure the morale change?" },
    { t: "24:31", speaker: "Candidate", text: "Fair. Honestly it was qualitative first — retro sentiment — then it showed up in lower attrition." },
    { t: "33:20", speaker: "Candidate", text: "I set a 20-minute comms rhythm so leadership stopped DMing individuals and the team could actually work.", flag: "key" },
    { t: "38:04", speaker: "Candidate", text: "My reviews said I was a bottleneck, so I spent six months making myself unnecessary. It was the best thing I did." },
  ];
  if (!top) {
    base.splice(6, 0, { t: "20:05", speaker: "Candidate", text: "…I think… it depends, but usually I'd defer to whoever has the most context.", flag: "integrity" });
  }
  return base;
}

function makeDocuments(compScores: CompetencyScore[]) {
  return [
    { claim: "M.Sc. Computer Science — verified degree", result: "VERIFIED" as const, extracted: "Degree conferred 2016; institution confirmed via registry.", confidence: "High" as const },
    { claim: "Led team of 8 at previous employer", result: compScores[0].score > 70 ? ("VERIFIED" as const) : ("NOT_VERIFIED" as const), extracted: compScores[0].score > 70 ? "Reference letter corroborates span and headcount." : "Could not corroborate headcount from provided document.", confidence: compScores[0].score > 70 ? ("High" as const) : ("Low" as const) },
    { claim: "AWS Solutions Architect certification", result: "VERIFIED" as const, extracted: "Credential ID validated; active, expires 2027.", confidence: "High" as const },
  ];
}

/* Build the append-only, hash-chained audit trail for a candidate */
function makeAudit(internalId: string, overall: number, divergence: boolean): AuditEntry[] {
  const versions = "model claude-scoring-4 · prompt sc-v7 · rubric r3";
  const rows: Omit<AuditEntry, "prevHash" | "hash" | "id">[] = [
    { timestamp: "2026-07-06 09:14:02Z", actor: "WhiteBox AI", action: "AI_SCORED", target: `${internalId} · all competencies`, reason: `Initial multimodal scoring complete. Overall ${overall}.`, versions },
    { timestamp: "2026-07-06 09:14:03Z", actor: "WhiteBox AI", action: "AI_SCORED", target: `${internalId} · confidence calibration`, reason: "Post-hoc calibration applied against held-out agreement data.", versions },
  ];
  if (divergence) {
    rows.push({ timestamp: "2026-07-08 14:22:41Z", actor: "R. Alvarez (HR)", action: "OVERRIDDEN", target: `${internalId} · Communication`, reason: "Two strong stakeholder-comms examples the model under-weighted; raised 71→78.", versions });
  }
  rows.push({ timestamp: "2026-07-08 14:25:10Z", actor: "R. Alvarez (HR)", action: overall > 75 ? "APPROVED" : "ESCALATED", target: `${internalId} · overall`, reason: overall > 75 ? "Consistent evidence; advancing to shortlist." : "Borderline on focus competency; escalating to Dept. Head.", versions });

  let prev = "genesis00000";
  return rows.map((r, i) => {
    const hash = chainHash(prev, { timestamp: r.timestamp, actor: r.actor, action: r.action, target: r.target, reason: r.reason, versions: r.versions });
    const entry: AuditEntry = { ...r, id: `a${i + 1}`, prevHash: prev, hash };
    prev = hash;
    return entry;
  });
}

function tierFor(rank: number, total: number): Tier {
  if (rank <= Math.ceil(total * 0.25)) return "Top";
  if (rank <= Math.ceil(total * 0.7)) return "Mid";
  return "Bottom";
}

function buildCandidates(vacancyId: string): Candidate[] {
  // base skill levels per candidate to make ranking believable
  const bases = [92, 88, 85, 81, 78, 74, 70, 66, 61, 57, 52, 47];
  const raw = bases.map((base, i) => {
    const rnd = seeded(1000 + i * 37);
    const comps = ALL_COMPETENCIES.map((c) => makeCompetency(c.id, base, rnd));
    // weighted overall
    const overall = Math.round(comps.reduce((s, c) => s + c.score * (c.weight / 100), 0));
    const divergence = i === 3 || i === 6;
    const aiScore = divergence ? overall - 3 : overall;
    const band = bandFor(overall, 0);
    const person = NAMES[i];
    const st: Candidate["stage"] = i < 3 ? "invited" : i < 8 ? "under_review" : "submitted";
    return {
      internalId: `CND-${(0x4a19 + i * 0x1d).toString(16).toUpperCase()}`,
      overall,
      aiScore,
      confidence: band,
      confidencePhrase:
        band === "High"
          ? `High confidence — consistent across ${5} answers`
          : band === "Med"
          ? "Medium confidence — supported by limited examples"
          : "Low confidence — recommend human review",
      docStatus: (i % 5 === 4 ? "PENDING" : i % 7 === 6 ? "NOT_VERIFIED" : "VERIFIED") as Candidate["docStatus"],
      divergence,
      integrity: integrityFor(rnd),
      appliedDate: `2026-07-0${(i % 5) + 1}`,
      stage: st,
      strengths: [STRENGTHS_POOL[i % STRENGTHS_POOL.length], STRENGTHS_POOL[(i + 2) % STRENGTHS_POOL.length], STRENGTHS_POOL[(i + 4) % STRENGTHS_POOL.length]],
      weaknesses: [WEAKNESS_POOL[i % WEAKNESS_POOL.length], WEAKNESS_POOL[(i + 2) % WEAKNESS_POOL.length]],
      competencies: comps,
      documents: makeDocuments(comps),
      transcript: makeTranscript(i < 4),
      audit: makeAudit(`CND-${(0x4a19 + i * 0x1d).toString(16).toUpperCase()}`, overall, divergence),
      vacancyId,
      pii: NAMES[i],
      rank: 0,
      tier: "Mid" as Tier,
    };
  });

  raw.sort((a, b) => b.overall - a.overall);
  raw.forEach((c, i) => {
    c.rank = i + 1;
    c.tier = tierFor(i + 1, raw.length);
  });
  return raw;
}

/* ============================================================
   VACANCIES
   ============================================================ */
export const VACANCIES: Vacancy[] = [
  {
    id: "v-teamlead",
    title: "Team Lead — Platform Engineering",
    code: "WBX-7Q4K",
    status: "LIVE",
    applicants: 128,
    configVersion: 3,
    department: "Engineering",
    created: "2026-06-20",
    updated: "2026-07-08",
    passed: 41,
    invited: 3,
    avgScore: 68,
    biasFlags: 1,
    needReview: 12,
    categories: TEAMLEAD_CATEGORIES,
    threshold: 70,
    funnel: [
      { label: "Code entered", value: 128 },
      { label: "Registered", value: 119 },
      { label: "Profile", value: 111 },
      { label: "Interview", value: 96 },
      { label: "Verification", value: 88 },
      { label: "Shortlist", value: 41 },
      { label: "Invited", value: 3 },
    ],
  },
  {
    id: "v-pm",
    title: "Senior Product Manager — Growth",
    code: "WBX-2M8P",
    status: "LIVE",
    applicants: 214,
    configVersion: 2,
    department: "Product",
    created: "2026-06-12",
    updated: "2026-07-07",
    passed: 63,
    invited: 6,
    avgScore: 64,
    biasFlags: 0,
    needReview: 7,
    categories: TEAMLEAD_CATEGORIES,
    threshold: 68,
    funnel: [
      { label: "Code entered", value: 214 },
      { label: "Registered", value: 198 },
      { label: "Profile", value: 181 },
      { label: "Interview", value: 152 },
      { label: "Verification", value: 140 },
      { label: "Shortlist", value: 63 },
      { label: "Invited", value: 6 },
    ],
  },
  {
    id: "v-ds",
    title: "Staff Data Scientist — ML Platform",
    code: "WBX-9J1T",
    status: "DRAFT",
    applicants: 0,
    configVersion: 1,
    department: "Data",
    created: "2026-07-05",
    updated: "2026-07-05",
    passed: 0,
    invited: 0,
    avgScore: 0,
    biasFlags: 0,
    needReview: 0,
    categories: TEAMLEAD_CATEGORIES,
    threshold: 72,
    funnel: [],
  },
  {
    id: "v-designer",
    title: "Principal Product Designer",
    code: "WBX-5R3D",
    status: "CLOSED",
    applicants: 96,
    configVersion: 4,
    department: "Design",
    created: "2026-04-02",
    updated: "2026-06-01",
    passed: 22,
    invited: 4,
    avgScore: 71,
    biasFlags: 0,
    needReview: 0,
    categories: TEAMLEAD_CATEGORIES,
    threshold: 74,
    funnel: [
      { label: "Code entered", value: 96 },
      { label: "Registered", value: 90 },
      { label: "Profile", value: 84 },
      { label: "Interview", value: 71 },
      { label: "Verification", value: 66 },
      { label: "Shortlist", value: 22 },
      { label: "Invited", value: 4 },
    ],
  },
];

export const CANDIDATES: Candidate[] = buildCandidates("v-teamlead");

export function getVacancy(id: string) {
  return VACANCIES.find((v) => v.id === id);
}
export function getCandidate(internalId: string) {
  return CANDIDATES.find((c) => c.internalId === internalId);
}

/* ============================================================
   BIAS / CALIBRATION / ANALYTICS fixtures
   ============================================================ */
export const BIAS_GROUPS: BiasGroupMetric[] = [
  { group: "Group A", passRate: 0.34, avgScore: 69, n: 41, anomaly: false },
  { group: "Group B", passRate: 0.31, avgScore: 67, n: 38, anomaly: false },
  { group: "Group C", passRate: 0.19, avgScore: 61, n: 27, anomaly: true },
  { group: "Group D", passRate: 0.33, avgScore: 68, n: 22, anomaly: false },
];

export const BIAS_ALERTS: BiasAlert[] = [
  { id: "b1", metric: "Demographic parity", severity: "warn", message: "Pass-rate gap of 15pp for Group C vs. highest group. Post-hoc, anonymization-respecting.", affected: 27 },
];

export const REVIEWERS: ReviewerConsistency[] = [
  { reviewer: "R. Alvarez", agreement: 0.91, overrideRate: 0.12, reviews: 64 },
  { reviewer: "T. Okafor", agreement: 0.88, overrideRate: 0.09, reviews: 51 },
  { reviewer: "M. Bianchi", agreement: 0.72, overrideRate: 0.28, reviews: 47 },
  { reviewer: "K. Sato", agreement: 0.95, overrideRate: 0.02, reviews: 39 },
];

export const SCORE_DISTRIBUTION = [
  { bin: "30–39", count: 6 },
  { bin: "40–49", count: 11 },
  { bin: "50–59", count: 19 },
  { bin: "60–69", count: 27 },
  { bin: "70–79", count: 22 },
  { bin: "80–89", count: 13 },
  { bin: "90–100", count: 4 },
];

export const CRITERIA_EFFECTIVENESS = [
  { criteria: "Decision-making", predictive: 0.81 },
  { criteria: "Leadership potential", predictive: 0.77 },
  { criteria: "Stress-resilience", predictive: 0.69 },
  { criteria: "Growth potential", predictive: 0.64 },
  { criteria: "Communication", predictive: 0.52 },
  { criteria: "Professional knowledge", predictive: 0.48 },
];

/* Org-level KPIs for dashboard */
export const ORG_KPIS = {
  activeVacancies: 2,
  totalCandidates: 342,
  passedThreshold: 104,
  invited: 9,
  avgScore: 66,
  biasFlags: 1,
};
