// WhiteBox AI — typed data model (Book I · Part XII).
// The whole product renders from these types; AI/backend are mocked as fixtures per Book V.

export type VacancyStatus = "DRAFT" | "LIVE" | "CLOSED";
export type Tier = "Top" | "Mid" | "Bottom";
export type ConfidenceBand = "High" | "Med" | "Low";
export type DocStatus = "VERIFIED" | "PENDING" | "NOT_VERIFIED" | "NONE";
export type CandidateStage =
  | "submitted"
  | "under_review"
  | "invited"
  | "not_moving_forward";

export type Role = "HR" | "Head" | "Technical" | "Observer";

export interface CompetencyConfig {
  id: string;
  name: string;
  category: string;
  weight: number; // percentage points
  focus?: boolean;
  type?: "skill" | "trait" | "qualification";
}

export interface CategoryConfig {
  name: string;
  weight: number; // sums to 100 across categories
  attributes: CompetencyConfig[];
}

export interface Vacancy {
  id: string;
  title: string;
  code: string; // competition code
  status: VacancyStatus;
  applicants: number;
  configVersion: number;
  department: string;
  created: string;
  updated: string;
  passed: number;
  invited: number;
  avgScore: number;
  biasFlags: number;
  needReview: number;
  categories: CategoryConfig[];
  threshold: number;
  funnel: { label: string; value: number }[];
}

export interface Driver {
  text: string;
  impact: number; // 0..1, ordered desc (principal reason first)
  direction: "pos" | "neg";
}

export interface EvidenceChip {
  fragment: string;
  timestamp: string; // mm:ss
  speaker: "AI" | "Candidate";
}

export interface ReasoningStep {
  label: string;
  detail: string;
  latencyMs: number;
  tokens: number;
}

export interface CompetencyScore {
  id: string;
  name: string;
  category: string;
  score: number; // 0..100
  weight: number;
  confidence: ConfidenceBand;
  confidenceReason: string;
  confidenceFactors: { label: string; value: string }[];
  drivers: Driver[];
  evidence: EvidenceChip[];
  reasoning: ReasoningStep[];
  docVerified?: boolean;
}

export interface IntegritySignal {
  label: string;
  level: "none" | "low" | "medium";
  note: string;
}

export interface DocumentVerification {
  claim: string;
  result: "VERIFIED" | "NOT_VERIFIED";
  extracted: string;
  confidence: ConfidenceBand;
}

export interface AuditEntry {
  id: string;
  timestamp: string;
  actor: string;
  action:
    | "AI_SCORED"
    | "APPROVED"
    | "REJECTED"
    | "ESCALATED"
    | "OVERRIDDEN"
    | "RECOMPUTED"
    | "IDENTITY_REVEALED"
    | "INVITED";
  target: string;
  reason: string;
  versions: string; // model/prompt/rubric
  prevHash: string;
  hash: string;
}

export interface TranscriptLine {
  t: string; // mm:ss
  speaker: "AI" | "Candidate";
  text: string;
  flag?: "integrity" | "key";
}

export interface Candidate {
  internalId: string;
  rank: number;
  tier: Tier;
  overall: number;
  confidence: ConfidenceBand;
  confidencePhrase: string;
  docStatus: DocStatus;
  divergence: boolean; // human overrode AI
  integrity: IntegritySignal;
  appliedDate: string;
  stage: CandidateStage;
  aiScore: number; // original AI score before any override
  strengths: string[];
  weaknesses: string[];
  competencies: CompetencyScore[];
  documents: DocumentVerification[];
  transcript: TranscriptLine[];
  audit: AuditEntry[];
  vacancyId: string;
  // PII (locked until final stage) — for the reveal demo
  pii: { name: string; location: string; years: number };
}

export interface BiasGroupMetric {
  group: string;
  passRate: number;
  avgScore: number;
  n: number;
  anomaly: boolean;
}

export interface BiasAlert {
  id: string;
  metric: string;
  severity: "warn" | "neg";
  message: string;
  affected: number;
}

export interface ReviewerConsistency {
  reviewer: string;
  agreement: number; // 0..1 with panel
  overrideRate: number; // 0..1 vs AI
  reviews: number;
}
