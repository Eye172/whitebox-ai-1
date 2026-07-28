/* ============================================================
   BLOCK LIBRARY — SPEC §4.4 (19 block kinds, grouped A–E)
   Metadata + factories for the Pipeline Composer. Validity league
   table embedded from Sackett et al. 2022 (R-I.1); subgroup d where
   known. Pure TS — no React, no side effects.
   ============================================================ */

import type {
  BlockGroup,
  BlockKind,
  BlockSettings,
  EvidenceLevel,
  PipelineBlock,
} from "./types";

/* ---------- metadata shape (UI compiles against this) ---------- */

export interface BlockMeta {
  kind: BlockKind;
  group: BlockGroup;
  label: string; // e.g. "Structured Async Interview"
  methodName: string; // named HR method, e.g. "Structured interview"
  methodBasis: string; // one-liner, e.g. "Campion's 15 components by construction"
  validity?: number; // operational validity ρ (Sackett 2022, R-I.1)
  subgroupD?: string; // e.g. "d ≈ .2–.3"
  evidenceLevel: EvidenceLevel;
  defaultMinutes: number;
  description: string; // 1–2 sentences for the library card
  candidateIntroTemplate: string; // states what it measures + why job-relevant (justice rule, R-I.7)
  researchRef: string; // e.g. "R-I.1, R-I.2"
}

/* ---------- the library (SPEC §4.4.1–4.4.19) ---------- */

export const BLOCK_LIBRARY: Record<BlockKind, BlockMeta> = {
  /* —— Group A · Screening & background —— */

  application_form: {
    kind: "application_form",
    group: "screening",
    label: "Structured Application Form",
    methodName: "Structured biodata collection",
    methodBasis: "Empirically keyed biodata reaches ρ ≈ .38 with modest subgroup differences; rational keys at launch.",
    validity: 0.38,
    subgroupD: "d ≈ .3",
    evidenceLevel: "meta-analytic",
    defaultMinutes: 6,
    description:
      "Collects contact details and structured application data. Choice questions can carry rational scoring keys — keyed biodata is one of the strongest low-adverse-impact predictors.",
    candidateIntroTemplate:
      "This short form collects the basics we need to process your application. Only clearly marked questions are scored, and contact details are never part of the evaluation.",
    researchRef: "R-I.1",
  },

  knockout: {
    kind: "knockout",
    group: "screening",
    label: "Knockout Questionnaire",
    methodName: "Minimum-qualifications screen",
    methodBasis: "Uniform Guidelines-safe screen: job-related, documented, and always human-recoverable.",
    evidenceLevel: "vendor-validated",
    defaultMinutes: 3,
    description:
      "Checks documented minimum requirements before anyone invests time. Every failed knockout lands in a human-review tray — never the void.",
    candidateIntroTemplate:
      "A few quick questions to confirm the minimum requirements stated in the job description. If something doesn't match, a person reviews it before anything is final.",
    researchRef: "R-III.13",
  },

  cv_intake: {
    kind: "cv_intake",
    group: "screening",
    label: "CV / Résumé Intake",
    methodName: "Credential & history extraction",
    methodBasis: "Experience and education alone predict ≤ .10 — the CV is context and verification, not a score.",
    validity: 0.1,
    evidenceLevel: "meta-analytic",
    defaultMinutes: 4,
    description:
      "Parses the CV into structured history and a claims ledger that feeds interview probes and document checks. Low standalone validity, so it informs rather than scores.",
    candidateIntroTemplate:
      "Upload your CV so we can understand your experience. It provides context and verification for later steps — it is not scored on its own, and identifying details are hidden from reviewers by default.",
    researchRef: "R-I.1, R-I.6",
  },

  /* —— Group B · Interviews —— */

  async_interview: {
    kind: "async_interview",
    group: "interviews",
    label: "Structured Async Interview",
    methodName: "Structured interview",
    methodBasis: "Campion's 15 components by construction; transcript-only scoring.",
    validity: 0.42,
    subgroupD: "d ≈ .2–.3",
    evidenceLevel: "meta-analytic",
    defaultMinutes: 20,
    description:
      "The flagship block: fixed questions, per-question BARS rubrics, anchored probing, transcript-only scoring. The best validity-to-adverse-impact ratio of any selection method.",
    candidateIntroTemplate:
      "This structured interview asks every candidate for this role the same questions about real situations from your experience. Your answers are scored against published, job-related criteria — what you say, never how you look or sound.",
    researchRef: "R-I.1, R-I.2",
  },

  live_ai_interview: {
    kind: "live_ai_interview",
    group: "interviews",
    label: "Live AI Interview",
    methodName: "Structured interview (live AI)",
    methodBasis: "Same structured base plan with real-time anchored probing; free-form question generation not offered.",
    validity: 0.42,
    subgroupD: "d ≈ .2–.3",
    evidenceLevel: "meta-analytic",
    defaultMinutes: 20,
    description:
      "A real-time conversation with a disclosed AI interviewer, constrained to the base question plan plus pre-approved probes. Recommended as the verification follow-up for flagged async candidates.",
    candidateIntroTemplate:
      "You'll have a live conversation with an interviewer that is always disclosed as AI. It asks the same core questions as every candidate, with clarifying follow-ups. Only the transcript is scored, against job-related criteria — and you can request a human alternative at any time.",
    researchRef: "R-I.2, R-I.8",
  },

  chat_interview: {
    kind: "chat_interview",
    group: "interviews",
    label: "Structured Chat Interview",
    methodName: "Structured interview (text)",
    methodBasis: "Structured interview in text — camera-free, untimed, no bandwidth barrier.",
    validity: 0.42,
    subgroupD: "d ≈ .2–.3",
    evidenceLevel: "meta-analytic",
    defaultMinutes: 15,
    description:
      "Camera-free, untimed structured interview in text. Highest accessibility and the best applicant reactions in text-first populations.",
    candidateIntroTemplate:
      "A text-based interview — no camera needed. Every candidate answers the same job-related questions, and your written answers are scored against the same criteria for everyone.",
    researchRef: "R-I.2, R-II.2",
  },

  /* —— Group C · Tests & questionnaires —— */

  sjt: {
    kind: "sjt",
    group: "tests",
    label: "Situational Judgment Test",
    methodName: "Situational judgment test",
    methodBasis: "Low-fidelity simulation of role dilemmas; hybrid scoring keys yield the highest item validities.",
    validity: 0.26,
    evidenceLevel: "meta-analytic",
    defaultMinutes: 8,
    description:
      "Realistic role dilemmas with keyed response options — a low-fidelity simulation of the judgment calls the job actually requires.",
    candidateIntroTemplate:
      "You'll see realistic situations from this job and choose how you'd respond. There are no trick questions — the scenarios reflect the judgment the role actually requires.",
    researchRef: "R-I.4",
  },

  cognitive: {
    kind: "cognitive",
    group: "tests",
    label: "Cognitive Ability Test",
    methodName: "General mental ability test",
    methodBasis: "Valid but the largest adverse-impact driver — suggested weight ≤ 15% and late placement.",
    validity: 0.31,
    subgroupD: "d ≈ .7–.8 (adverse-impact caution)",
    evidenceLevel: "meta-analytic",
    defaultMinutes: 18,
    description:
      "Reasoning subtests with optional adaptive difficulty. Valid, but carries the largest subgroup differences of any method — keep the weight low and the placement late.",
    candidateIntroTemplate:
      "Short reasoning exercises related to the problem-solving this role involves. Two practice items come first and are never scored.",
    researchRef: "R-I.1, R-I.6",
  },

  personality: {
    kind: "personality",
    group: "tests",
    label: "Personality Questionnaire",
    methodName: "Personality self-report (Big Five / HEXACO)",
    methodBasis: "Conscientiousness ρ ≈ .19–.22 with near-zero d; forced-choice format resists faking.",
    validity: 0.19,
    subgroupD: "d ≈ 0–.1",
    evidenceLevel: "meta-analytic",
    defaultMinutes: 10,
    description:
      "Work-contextualized Big Five / HEXACO questionnaire, forced-choice by default to resist faking. A fit signal capped at 20% of the composite — never a filter.",
    candidateIntroTemplate:
      "A questionnaire about how you prefer to work. There are no right or wrong answers; it adds context to the overall picture and is never used on its own to reject anyone.",
    researchRef: "R-I.4",
  },

  integrity_test: {
    kind: "integrity_test",
    group: "tests",
    label: "Integrity & Reliability",
    methodName: "Overt integrity test",
    methodBasis: "Overt tests predict counterproductive behavior with near-zero subgroup differences.",
    validity: 0.31,
    subgroupD: "d ≈ 0",
    evidenceLevel: "meta-analytic",
    defaultMinutes: 6,
    description:
      "Overt integrity questionnaire for roles with cash, safety, or compliance exposure. Respectable validity with near-zero subgroup differences.",
    candidateIntroTemplate:
      "A questionnaire about workplace situations involving rules and reliability — relevant because this role carries real responsibility for assets, safety, or compliance. It is never the sole reason for a decision.",
    researchRef: "R-I.4",
  },

  job_knowledge: {
    kind: "job_knowledge",
    group: "tests",
    label: "Job Knowledge Test",
    methodName: "Job-knowledge test",
    methodBasis: "ρ ≈ .40 — the highest-validity test block; the default pick over cognitive.",
    validity: 0.4,
    evidenceLevel: "meta-analytic",
    defaultMinutes: 12,
    description:
      "Tests the knowledge the role actually uses day to day — the highest-validity test block and the recommended alternative to cognitive testing.",
    candidateIntroTemplate:
      "Questions about knowledge this role uses day to day. Knowing this material is directly tied to doing the job well.",
    researchRef: "R-I.1",
  },

  language_test: {
    kind: "language_test",
    group: "tests",
    label: "Language Proficiency",
    methodName: "CEFR-aligned proficiency assessment",
    methodBasis: "CEFR descriptors as the rubric; scored per skill against the attribute's target level.",
    evidenceLevel: "vendor-validated",
    defaultMinutes: 20,
    description:
      "CEFR-aligned check of the language skills the role requires, scored per skill against the target level set on the language attribute.",
    candidateIntroTemplate:
      "A short check of the language skills this role requires, measured against the level stated in the job description.",
    researchRef: "R-III.1",
  },

  /* —— Group D · Simulations & work —— */

  work_sample: {
    kind: "work_sample",
    group: "simulations",
    label: "Work Sample / Take-Home",
    methodName: "Work-sample test",
    methodBasis: "Samples over signs — direct observation of the work itself.",
    validity: 0.33,
    evidenceLevel: "meta-analytic",
    defaultMinutes: 120,
    description:
      "A bounded piece of real work graded anonymously against a BARS rubric. Strong validity and the best-liked method among candidates.",
    candidateIntroTemplate:
      "A small piece of real work, close to what the role actually involves — the fairest way to show what you can do. It is graded anonymously against a published rubric, and the AI-use policy is stated up front.",
    researchRef: "R-I.1, R-I.7",
  },

  coding: {
    kind: "coding",
    group: "simulations",
    label: "Coding Assessment",
    methodName: "Work-sample test (software)",
    methodBasis: "Work sample for software roles: hidden tests + quality rubric + defense probes.",
    validity: 0.33,
    evidenceLevel: "meta-analytic",
    defaultMinutes: 60,
    description:
      "A work sample for software roles: hidden tests for correctness, rubric-scored quality, and defense probes as the anti-outsourcing measure.",
    candidateIntroTemplate:
      "A hands-on coding task similar to this role's day-to-day work, graded on published criteria. The AI-use policy for this task is stated before you start.",
    researchRef: "R-I.1, R-III.7",
  },

  case_exercise: {
    kind: "case_exercise",
    group: "simulations",
    label: "Case / In-Basket Exercise",
    methodName: "Assessment-center exercise",
    methodBasis: "Exercise effect: variance clusters by exercise — score exercises, aggregate mechanically.",
    validity: 0.29,
    evidenceLevel: "meta-analytic",
    defaultMinutes: 45,
    description:
      "Case analysis, in-basket, role-play, or presentation. Scored at the exercise level — the assessment-center approach that actually replicates.",
    candidateIntroTemplate:
      "A realistic job scenario to work through — the kind of situation this role handles. Your response is scored on the quality of the outcome, against a published rubric.",
    researchRef: "R-I.4",
  },

  /* —— Group E · Verification & human —— */

  doc_verification: {
    kind: "doc_verification",
    group: "verification",
    label: "Documents & Credentials",
    methodName: "Credential verification",
    methodBasis: "Automated extraction and claim match; mismatches flag confidence, never auto-reject.",
    evidenceLevel: "vendor-validated",
    defaultMinutes: 6,
    description:
      "Automated extraction and matching of diplomas, certifications, and licenses against claims. Mismatches flag confidence for human adjudication — never an auto-reject.",
    candidateIntroTemplate:
      "Upload the documents that confirm the qualifications listed for this role. A mismatch never rejects you automatically — a person reviews every case.",
    researchRef: "R-IV.2",
  },

  reference_check: {
    kind: "reference_check",
    group: "verification",
    label: "Reference Check",
    methodName: "Structured reference check",
    methodBasis: "Structured questionnaires reach ρ ≈ .26; unstructured calls predict almost nothing.",
    validity: 0.26,
    evidenceLevel: "meta-analytic",
    defaultMinutes: 5,
    description:
      "Structured referee questionnaires on the vacancy's own attributes, with fraud controls. Structure is what makes references worth anything.",
    candidateIntroTemplate:
      "We'll ask the referees you nominate a short, structured set of job-related questions — the same set for every candidate at this stage.",
    researchRef: "R-I.1, R-II.10",
  },

  human_stage: {
    kind: "human_stage",
    group: "verification",
    label: "Human Interview Stage",
    methodName: "Structured panel interview",
    methodBasis: "Structured-interview method (ρ ≈ .42): same BARS, independent ratings before discussion.",
    validity: 0.42,
    subgroupD: "d ≈ .2–.3",
    evidenceLevel: "meta-analytic",
    defaultMinutes: 45,
    description:
      "A live human round inside the same pipeline: auto-generated interview kits target AI-flagged weak spots, and panelists rate independently on the same BARS before discussing.",
    candidateIntroTemplate:
      "An interview with people from the team, using the same criteria as every earlier step. You book a time that works for you.",
    researchRef: "R-I.2, R-III.4",
  },

  custom: {
    kind: "custom",
    group: "verification",
    label: "Custom Block",
    methodName: "Author-defined instrument",
    methodBasis: "No validity evidence until locally validated — experimental by default.",
    evidenceLevel: "experimental",
    defaultMinutes: 10,
    description:
      "An author-defined instrument built from raw primitives. Ships with an experimental evidence badge until you validate it locally.",
    candidateIntroTemplate:
      "An additional exercise specific to this role. What it measures and how it is scored is described before you start.",
    researchRef: "R-I.4",
  },
};

/* ---------- library grouping (drawer order, SPEC §4.4) ---------- */

export const BLOCK_GROUPS: { id: BlockGroup; label: string; kinds: BlockKind[] }[] = [
  { id: "screening", label: "Screening & background", kinds: ["application_form", "knockout", "cv_intake"] },
  { id: "interviews", label: "Interviews", kinds: ["async_interview", "live_ai_interview", "chat_interview"] },
  { id: "tests", label: "Tests & questionnaires", kinds: ["sjt", "cognitive", "personality", "integrity_test", "job_knowledge", "language_test"] },
  { id: "simulations", label: "Simulations & work", kinds: ["work_sample", "coding", "case_exercise"] },
  { id: "verification", label: "Verification & human", kinds: ["doc_verification", "reference_check", "human_stage", "custom"] },
];

/* ---------- per-kind default settings (SPEC §4.4.1–19) ---------- */
/* Item arrays start empty where content is generated from criteria. */

export function defaultSettings(kind: BlockKind): BlockSettings {
  switch (kind) {
    case "application_form":
      return {
        kind,
        fields: [
          /* contact block is locked in the builder and feeds the PII vault (§4.4.1) */
          { id: "fld-name", label: "Full name", type: "short_text", required: true, pii: true, scored: false },
          { id: "fld-email", label: "Email", type: "short_text", required: true, pii: true, scored: false },
          { id: "fld-phone", label: "Phone number", type: "short_text", required: false, pii: true, scored: false },
        ],
        prefillFromCv: true,
        dedupeRule: "email_vacancy_resume",
      };
    case "knockout":
      return { kind, items: [], placement: "before_form" };
    case "cv_intake":
      return {
        kind,
        acceptedFormats: ["pdf", "docx"],
        maxSizeMb: 10,
        parseTargets: ["employment", "education", "certifications", "skills", "links"],
        anonymizeForReview: true, // ON by default (R-I.6)
        extractClaims: true,
        portfolioUrlField: false,
      };
    case "async_interview":
      return {
        kind,
        questions: [],
        followUpPolicy: 1,
        order: "fixed",
        introVideo: "ai_presenter",
        practiceQuestion: true, // non-removable — tech-check equity
        pauseAllowance: 1,
        reviewBeforeSubmit: false, // off for video (spontaneity), on for text
      };
    case "live_ai_interview":
      return {
        kind,
        durationCapMin: 20,
        persona: { name: "Nova", voice: "neutral", disclosedAsAi: true },
        questions: [],
        adaptivity: "probe_only",
        latencyFallback: "async",
        bargeInAllowed: true,
      };
    case "chat_interview":
      return {
        kind,
        questions: [],
        minAnswerWords: 30,
        maxAnswerWords: 200,
        typingTelemetry: true,
        pastePolicy: "warn",
        followUpPolicy: 1,
        tone: "neutral",
      };
    case "sjt":
      return {
        kind,
        instruction: "behavioral_tendency", // lower cognitive loading by default (R-I.4)
        format: "pick_best",
        keyType: "hybrid", // highest item validities (R-I.4)
        items: [],
        timing: "untimed",
        randomizeOrder: false,
        pilotMode: false,
      };
    case "cognitive":
      return {
        kind,
        subtests: ["numerical", "verbal", "logical"],
        itemsPerSubtest: 8,
        adaptive: false,
        totalTimeMin: 18,
        calculatorAllowed: false,
        practiceItems: 2,
      };
    case "personality":
      return {
        kind,
        model: "big_five",
        lengthItems: 60,
        format: "forced_choice", // faking-resistant default (R-I.4)
        contextualizedAtWork: true,
        traitMappings: [],
        candidateFeedbackReport: true, // Sapia-style "My Insights"
      };
    case "integrity_test":
      return { kind, domains: ["rule_adherence", "dependability"], lengthItems: 24, format: "likert" };
    case "job_knowledge":
      return {
        kind,
        items: [],
        timing: "total",
        totalTimeMin: 15,
        difficultyMix: { easy: 30, medium: 50, hard: 20 },
        openBook: false,
      };
    case "language_test":
      return { kind, language: "English", skills: ["reading", "listening"], targetLevel: "B2", minutesPerSkill: 10 };
    case "work_sample":
      return {
        kind,
        brief: "",
        deliverables: ["file"],
        timeModel: "honesty_window",
        timeBudgetHours: 2,
        aiPolicy: "disclosed",
        originalityCheck: true,
        anonymizedGrading: true,
        rubricDimensions: [],
        defenseFollowUp: true, // strongest anti-outsourcing measure (R-IV.4)
      };
    case "coding":
      return {
        kind,
        environment: "browser_ide",
        languages: [],
        taskSource: "bank",
        brief: "",
        scoringSplit: { correctness: 50, quality: 30, approach: 20 },
        timeCapMin: 60,
        aiPolicy: "disclosed",
        similarityCheck: true,
        rubricDimensions: [],
      };
    case "case_exercise":
      return { kind, format: "case_analysis", materials: "", timeBoxMin: 45, rubricDimensions: [] };
    case "doc_verification":
      return {
        kind,
        requiredDocuments: [],
        acceptedFormats: ["pdf", "jpg", "png"],
        mode: "auto_extract_match",
        idCheck: false,
        placement: "post_shortlist", // reduce candidate burden by default (§4.4.16)
      };
    case "reference_check":
      return {
        kind,
        referees: { count: 2, relationships: ["manager", "peer"] },
        questionnaire: [],
        collectionWindowDays: 7,
        fraudControls: true,
        anonymizedAggregation: false, // only meaningful at ≥3 referees
      };
    case "human_stage":
      return {
        kind,
        panel: [],
        selfBooking: true,
        interviewKitAuto: true,
        independentBeforeDiscussion: true, // R-I.2 #13
        aiNotetaker: true, // consented; drafts a scorecard for the human to edit
      };
    case "custom":
      return { kind, instructions: "", primitives: ["text"], rubricDimensions: [] };
  }
}

/* ---------- factory (SPEC §4.4.0 common settings) ---------- */

const TIER1_KINDS: BlockKind[] = [
  "async_interview", "live_ai_interview", "chat_interview",
  "sjt", "cognitive", "personality", "integrity_test", "job_knowledge", "language_test",
];

const UNSCORED_BY_DEFAULT: BlockKind[] = ["application_form", "knockout", "cv_intake", "doc_verification"];

const mkId = (prefix: string): string => `${prefix}-${Math.random().toString(36).slice(2, 10)}`;

export function createBlock(kind: BlockKind, order: number): PipelineBlock {
  const meta = BLOCK_LIBRARY[kind];
  return {
    id: mkId("blk"),
    kind,
    order,
    title: meta.label,
    candidateIntro: meta.candidateIntroTemplate,
    required: true,
    scored: !UNSCORED_BY_DEFAULT.includes(kind),
    estimatedMinutes: meta.defaultMinutes,
    measures: [],
    settings: defaultSettings(kind),
    integrityTier: TIER1_KINDS.includes(kind) ? 1 : 0,
    accessibility: { extraTimeMultiplier: 1, captions: true, screenReaderMode: false, alternativeFormats: false },
    retakePolicy: 1,
  };
}

/* ---------- time estimation (feeds the composer's time rail, §4.4) ---------- */

export function estimateMinutes(block: PipelineBlock): number {
  const s = block.settings;
  let minutes = BLOCK_LIBRARY[block.kind].defaultMinutes;

  switch (s.kind) {
    case "application_form":
      if (s.fields.length > 0) minutes = 1 + s.fields.length * 0.5;
      break;
    case "knockout":
      if (s.items.length > 0) minutes = s.items.length * 0.5;
      break;
    case "cv_intake":
      break; // upload + parse review — flat default
    case "async_interview":
      if (s.questions.length > 0) {
        const perQuestionSec = s.questions.reduce(
          (sum, q) => sum + (q.thinkTimeSec ?? 45) + q.answerCapSec + s.followUpPolicy * 45,
          0,
        );
        minutes = perQuestionSec / 60 + 3; // + intro and mandatory practice question
      }
      break;
    case "live_ai_interview":
      minutes = s.durationCapMin;
      break;
    case "chat_interview":
      if (s.questions.length > 0) {
        /* reading + typing toward the max answer length at ~40 words/min */
        minutes = s.questions.length * (0.5 + s.maxAnswerWords / 40) * (1 + 0.25 * s.followUpPolicy);
      }
      break;
    case "sjt":
      if (s.items.length > 0) minutes = s.items.length * 0.75;
      break;
    case "cognitive":
      minutes = s.totalTimeMin;
      break;
    case "personality":
      minutes = s.lengthItems * 0.15;
      break;
    case "integrity_test":
      minutes = s.lengthItems * 0.2;
      break;
    case "job_knowledge":
      if (s.timing === "total" && s.totalTimeMin) minutes = s.totalTimeMin;
      else if (s.items.length > 0) minutes = s.items.length * 0.75;
      break;
    case "language_test":
      minutes = s.skills.length * s.minutesPerSkill;
      break;
    case "work_sample":
      minutes = s.timeBudgetHours * 60;
      break;
    case "coding":
      minutes = s.timeCapMin;
      break;
    case "case_exercise":
      minutes = s.timeBoxMin;
      break;
    case "doc_verification":
      if (s.requiredDocuments.length > 0) minutes = 2 + s.requiredDocuments.length * 1.5;
      break;
    case "reference_check":
      minutes = 1 + s.referees.count * 2; // candidate side: nominating referees
      break;
    case "human_stage":
    case "custom":
      break; // flat defaults
  }

  return Math.max(1, Math.round(minutes));
}
