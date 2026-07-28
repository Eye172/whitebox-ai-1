/* ============================================================
   VACANCY STUDIO LOGIC — pure TS, no React.
   Weight rebalancing (SPEC §4.3.1), coverage matrix (§4.3.4),
   effective weights (§4.5), impact summary + preflight (§4.8),
   competition-code minting (§4.8 Publish, §6).
   The preflight validator is the ONLY gatekeeper to publishing;
   the step rail is navigation, never a wizard lock (§4.1).
   ============================================================ */

import type { PipelineBlock, PreflightIssue, VacancyV2 } from "./types";
import { BLOCK_LIBRARY, estimateMinutes } from "./blocks";

const round1 = (n: number): number => Math.round(n * 10) / 10;
const round2 = (n: number): number => Math.round(n * 100) / 100;

/* ---------- empty draft (mirrors components/hr/studio/StudioProvider) ---------- */

export function createEmptyDraft(): VacancyV2 {
  return {
    id: "vac-draft",
    code: "",
    status: "DRAFT",
    configVersion: 1,
    profile: {
      title: "",
      openings: 1,
      seniority: "Middle",
      employmentType: "full_time",
      workMode: "hybrid",
      locations: [],
      mission: "",
      responsibilities: [],
      industryPack: "tech",
      languages: { primary: "en", alternates: [] },
    },
    categories: [],
    pipeline: [],
    scoring: {
      topology: "hybrid",
      weighting: "rational",
      threshold: 65,
      banding: { enabled: false, sedWidth: 4 },
      tieBreakers: ["focus_attributes"],
      anonymization: { maskPII: true, revealAtStage: "decision" },
      abstainPolicy: { minEvidencePerAttribute: 1, onAbstain: "flag_human" },
      normalization: "absolute_rubric",
    },
    experience: {
      landing: { showCompensation: false, companyBlurb: "" },
      notices: {
        jurisdictionProfile: "EU",
        aiDisclosure:
          "Parts of this process are AI-assisted. Only the language content of your answers is scored — never your face, voice tone, appearance, or emotion. A named human reviews and decides.",
        retentionDays: 180,
        consentCheckpoints: ["entry", "recorded_blocks"],
        version: 1,
      },
      comms: {
        confirmationEnabled: true,
        reminderCadence: 2,
        dispositionSlaDays: 5,
        feedbackOffer: true,
        senderIdentity: "org",
      },
      tone: "neutral",
    },
    governance: {
      roles: [{ userId: "u-ar", name: "a.rakhimova", role: "Owner", piiReveal: true }],
      reviewPolicy: { independentReviews: 1, assignment: "round_robin" },
      calibrationRequired: true,
      dualControlThreshold: 25,
      slaTargets: { reviewQueueHours: 48, dispositionDays: 5 },
      changeControl: { editLive: ["Owner"], pauseClose: ["Owner", "HiringManager"] },
    },
    distribution: [],
    window: { opensAt: "", closesAt: "", timezone: "Asia/Almaty" },
    rollingReview: true,
    audit: [],
    createdAt: "",
  };
}

/* ---------- weight editing (SPEC §4.3.1: locks + proportional rebalance) ---------- */

/* Set one item's weight, keep locked items untouched, scale the remaining
   unlocked items proportionally so the total stays exactly 100 (integers;
   rounding remainder goes to the largest unlocked item). */
export function rebalanceWeights<T extends { id: string; weight: number }>(
  items: T[],
  changedId: string,
  newWeight: number,
  lockedIds: Set<string>,
): T[] {
  if (!items.some((i) => i.id === changedId)) return items;

  const lockedSum = items
    .filter((i) => i.id !== changedId && lockedIds.has(i.id))
    .reduce((a, i) => a + i.weight, 0);
  const available = Math.max(0, 100 - lockedSum);
  const others = items.filter((i) => i.id !== changedId && !lockedIds.has(i.id));
  /* no unlocked neighbors: the changed item must absorb all remaining budget */
  const target = others.length === 0 ? available : Math.min(available, Math.max(0, Math.round(newWeight)));
  const remaining = available - target;
  const otherSum = others.reduce((a, i) => a + i.weight, 0);

  const scaled = new Map<string, number>();
  let acc = 0;
  for (const o of others) {
    const raw = otherSum > 0 ? (o.weight / otherSum) * remaining : remaining / others.length;
    const w = Math.floor(raw);
    scaled.set(o.id, w);
    acc += w;
  }
  const rem = remaining - acc;
  if (rem > 0 && others.length > 0) {
    const largest = [...others].sort(
      (a, b) => (scaled.get(b.id) ?? 0) - (scaled.get(a.id) ?? 0) || b.weight - a.weight,
    )[0];
    scaled.set(largest.id, (scaled.get(largest.id) ?? 0) + rem);
  }

  return items.map((i) => {
    if (i.id === changedId) return { ...i, weight: target };
    if (lockedIds.has(i.id)) return { ...i };
    return { ...i, weight: scaled.get(i.id) ?? i.weight };
  });
}

/* "Distribute equally" — unit weighting is defensible (R-I.5). */
export function distributeEqually<T extends { id: string; weight: number }>(items: T[]): T[] {
  if (items.length === 0) return [];
  const base = Math.floor(100 / items.length);
  const rem = 100 - base * items.length;
  return items.map((i, idx) => ({ ...i, weight: base + (idx < rem ? 1 : 0) }));
}

/* ---------- coverage matrix (SPEC §4.3.4 — the traceability artifact) ---------- */

export interface CoverageCell {
  attributeId: string;
  attributeName: string;
  focus: boolean;
  blockIds: string[]; // every block that maps this attribute (dot in the matrix)
  ok: boolean; // ≥1 scored block; focus attributes need ≥2 (triangulation)
}

export function coverageMatrix(draft: VacancyV2): CoverageCell[] {
  const cells: CoverageCell[] = [];
  for (const cat of draft.categories) {
    for (const attr of cat.attributes) {
      const measuring = draft.pipeline.filter((b) =>
        b.measures.some((m) => m.attributeId === attr.id),
      );
      const scoredCount = measuring.filter((b) => b.scored).length;
      cells.push({
        attributeId: attr.id,
        attributeName: attr.name,
        focus: !!attr.focus,
        blockIds: measuring.map((b) => b.id),
        ok: attr.focus ? scoredCount >= 2 : scoredCount >= 1,
      });
    }
  }
  return cells;
}

/* ---------- effective weights (SPEC §4.5 — catches silent double-counting) ---------- */

export interface EffectiveWeights {
  attributes: { attributeId: string; name: string; pct: number }[];
  blocks: { blockId: string; title: string; pct: number }[];
}

/* True % of the final composite: category weight × attribute weight within
   category, distributed over the scored blocks measuring that attribute in
   proportion to their measure shares. */
export function effectiveWeights(draft: VacancyV2): EffectiveWeights {
  const scoredBlocks = draft.pipeline.filter((b) => b.scored);
  const blockPct = new Map<string, number>(scoredBlocks.map((b) => [b.id, 0]));
  const attributes: EffectiveWeights["attributes"] = [];

  for (const cat of draft.categories) {
    for (const attr of cat.attributes) {
      const pct = (cat.weight / 100) * attr.weight; // (cat/100) × (attr/100) × 100
      attributes.push({ attributeId: attr.id, name: attr.name, pct: round1(pct) });

      const measuring = scoredBlocks
        .map((b) => ({ b, share: b.measures.find((m) => m.attributeId === attr.id)?.share ?? 0 }))
        .filter((x) => x.share > 0);
      const shareTotal = measuring.reduce((a, x) => a + x.share, 0);
      for (const { b, share } of measuring) {
        blockPct.set(b.id, (blockPct.get(b.id) ?? 0) + pct * (share / shareTotal));
      }
    }
  }

  return {
    attributes,
    blocks: scoredBlocks.map((b) => ({
      blockId: b.id,
      title: b.title,
      pct: round1(blockPct.get(b.id) ?? 0),
    })),
  };
}

/* ---------- shared caution computations (SPEC §4.8, R-I.1/I.6) ---------- */

function effectivePctByKind(draft: VacancyV2, kind: PipelineBlock["kind"]): number {
  const ew = effectiveWeights(draft);
  const kindOf = new Map(draft.pipeline.map((b) => [b.id, b.kind]));
  return round1(
    ew.blocks.filter((b) => kindOf.get(b.blockId) === kind).reduce((a, b) => a + b.pct, 0),
  );
}

/* GMA caution: effective weight > 15% OR placed in the first half of the
   pipeline — the largest Black–White subgroup gap of any method (d ≈ .7–.8). */
function cognitiveCaution(draft: VacancyV2): string | null {
  const ordered = [...draft.pipeline].sort((a, b) => a.order - b.order);
  const idx = ordered.findIndex((b) => b.kind === "cognitive");
  if (idx < 0) return null;
  const pct = effectivePctByKind(draft, "cognitive");
  const firstHalf = idx < ordered.length / 2;
  if (pct <= 15 && !firstHalf) return null;
  const cause =
    pct > 15 && firstHalf
      ? `carries ${pct}% of the composite and sits in the first half of the pipeline`
      : pct > 15
        ? `carries ${pct}% of the composite`
        : `sits in the first half of the pipeline`;
  return `Cognitive testing shows the largest subgroup gap of any method (d ≈ .7–.8). This block ${cause} — consider a later placement or a lower weight (R-I.1, R-I.6).`;
}

/* ---------- impact summary (Studio rail: time, validity, fairness, lint) ---------- */

export interface ImpactSummary {
  totalMinutes: number;
  validityBand: { lo: number; hi: number } | null;
  adverseImpactNotes: string[];
  lint: { blockers: number; warnings: number };
}

export function impactSummary(draft: VacancyV2): ImpactSummary {
  const totalMinutes = draft.pipeline
    .filter((b) => b.required)
    .reduce((a, b) => a + estimateMinutes(b), 0);

  /* Composite validity estimate from the meta-analytic ρ of each scored block
     (R-I.1): base = best single method; each additional distinct method adds
     30% of its ρ with diminishing returns; capped at .65; band ±.05. */
  let validityBand: ImpactSummary["validityBand"] = null;
  const byKind = new Map<string, number>();
  for (const b of draft.pipeline.filter((x) => x.scored)) {
    const rho = BLOCK_LIBRARY[b.kind].validity;
    if (typeof rho === "number") byKind.set(b.kind, Math.max(byKind.get(b.kind) ?? 0, rho));
  }
  const rhos = [...byKind.values()].sort((a, b) => b - a);
  if (rhos.length > 0) {
    let est = rhos[0];
    rhos.slice(1).forEach((rho, i) => {
      est += rho * 0.3 * Math.pow(0.5, i);
    });
    est = Math.min(0.65, est);
    validityBand = { lo: round2(Math.max(0, est - 0.05)), hi: round2(est + 0.05) };
  }

  const adverseImpactNotes: string[] = [];
  const cog = cognitiveCaution(draft);
  if (cog) adverseImpactNotes.push(cog);
  const persPct = effectivePctByKind(draft, "personality");
  if (persPct > 20) {
    adverseImpactNotes.push(
      `Personality carries ${persPct}% of the composite — meta-analytic guidance keeps it a supporting signal at or below 20% (R-I.1).`,
    );
  }

  const issues = preflight(draft);
  return {
    totalMinutes,
    validityBand,
    adverseImpactNotes,
    lint: {
      blockers: issues.filter((i) => i.severity === "blocker").length,
      warnings: issues.filter((i) => i.severity === "warning").length,
    },
  };
}

/* ---------- preflight validator (SPEC §4.8 — runs continuously) ---------- */

/* Scored items must bind to an attribute. Rubric dimensions (work sample /
   coding / case / custom) bind through the block's measures mapping — the
   frozen types carry no attributeId on RubricDimension by design. */
function checkBindings(b: PipelineBlock): { unbound: number; needsMeasures: boolean } {
  const s = b.settings;
  let unbound = 0;
  let needsMeasures = false;
  switch (s.kind) {
    case "async_interview":
    case "live_ai_interview":
    case "chat_interview":
      for (const q of s.questions) if (!q.attributeId || !q.rubric.attributeId) unbound++;
      break;
    case "sjt":
      for (const item of s.items) if (!item.attributeId) unbound++;
      break;
    case "job_knowledge":
      for (const item of s.items) if (!item.attributeId) unbound++;
      break;
    case "work_sample":
    case "coding":
    case "case_exercise":
    case "custom":
      needsMeasures = s.rubricDimensions.length > 0 && b.measures.length === 0;
      break;
    default:
      break;
  }
  return { unbound, needsMeasures };
}

const PROXY_RISK = /zip|address|graduation year|age|born/i;
const DISCLOSURE = /record|camera|snapshot|identity|liveness/i;
const INTERVIEW_KINDS = new Set<PipelineBlock["kind"]>([
  "async_interview",
  "live_ai_interview",
  "chat_interview",
]);

export function preflight(draft: VacancyV2): PreflightIssue[] {
  const issues: PreflightIssue[] = [];
  const blocker = (id: string, step: PreflightIssue["step"], message: string) =>
    issues.push({ id, severity: "blocker", step, message, overridable: false });
  const warning = (id: string, step: PreflightIssue["step"], message: string) =>
    issues.push({ id, severity: "warning", step, message, overridable: true });

  const ordered = [...draft.pipeline].sort((a, b) => a.order - b.order);

  /* — step 1 · profile — */
  if (draft.profile.title.trim() === "") {
    blocker("pf-title", 1, "Give the position a title — prompts, the landing page, and notices are all generated from it.");
  }

  /* — step 2 · criteria weights sum to 100 at every level — */
  if (draft.categories.length === 0) {
    blocker("pf-categories-empty", 2, "No criteria defined yet — add at least one category of attributes so the pipeline has something to measure.");
  } else {
    const catSum = draft.categories.reduce((a, c) => a + c.weight, 0);
    if (catSum !== 100) {
      blocker("pf-category-weights", 2, `Category weights must sum to 100 — they currently sum to ${catSum}.`);
    }
    for (const cat of draft.categories) {
      const attrSum = cat.attributes.reduce((a, x) => a + x.weight, 0);
      if (attrSum !== 100) {
        blocker(`pf-attr-weights-${cat.id}`, 2, `Attribute weights in "${cat.name}" must sum to 100 — they currently sum to ${attrSum}.`);
      }
    }
  }

  /* — step 3 · pipeline exists — */
  if (draft.pipeline.length === 0) {
    blocker("pf-pipeline-empty", 3, "The pipeline is empty — add at least one block for candidates to complete.");
  }

  /* — step 3 · coverage: every scored attribute ≥1 scored block, focus ≥2 — */
  for (const cell of coverageMatrix(draft)) {
    const scoredCount = draft.pipeline.filter(
      (b) => b.scored && b.measures.some((m) => m.attributeId === cell.attributeId),
    ).length;
    if (scoredCount < 1) {
      blocker(`pf-coverage-${cell.attributeId}`, 3, `"${cell.attributeName}" is weighted but no scored block measures it — map it in a block's attribute mapping.`);
    } else if (cell.focus && scoredCount < 2) {
      blocker(`pf-coverage-focus-${cell.attributeId}`, 3, `Focus attribute "${cell.attributeName}" needs at least two scored blocks for triangulation — it currently has ${scoredCount}.`);
    }
  }

  /* — step 3 · every scored question / item / rubric dimension bound — */
  for (const b of ordered.filter((x) => x.scored)) {
    const { unbound, needsMeasures } = checkBindings(b);
    if (unbound > 0) {
      blocker(`pf-binding-${b.id}`, 3, `${unbound} scored item${unbound === 1 ? " is" : "s are"} not bound to an attribute in "${b.title}" — every scored item needs a rubric tied to exactly one attribute.`);
    }
    if (needsMeasures) {
      blocker(`pf-measures-${b.id}`, 3, `"${b.title}" scores rubric dimensions but measures no attribute — add an attribute mapping so its scores roll up.`);
    }
  }

  /* — step 3 · integrity tiers disclosed; tier 3 only on the final block — */
  for (const b of ordered) {
    if (b.integrityTier >= 2 && !DISCLOSURE.test(b.candidateIntro)) {
      blocker(`pf-integrity-disclosure-${b.id}`, 3, `"${b.title}" runs at integrity tier ${b.integrityTier} but its candidate intro does not mention recording or identity checks — candidates must know before they start (R-IV.4).`);
    }
    if (b.integrityTier === 3 && b.id !== ordered[ordered.length - 1]?.id) {
      blocker(`pf-tier3-final-${b.id}`, 3, `"${b.title}" uses integrity tier 3 (ID check), which is allowed only on the final block of the pipeline.`);
    }
  }

  /* — step 5 · notices pack complete — */
  if (
    draft.experience.notices.aiDisclosure.trim() === "" ||
    draft.experience.notices.jurisdictionProfile.trim() === ""
  ) {
    blocker("pf-notices", 5, "The notice pack is incomplete — set a jurisdiction profile and the AI-use disclosure before publishing.");
  }

  /* — step 6 · at least one human reviewer — */
  if (!draft.governance.roles.some((r) => r.role !== "Observer")) {
    blocker("pf-reviewer", 6, "Assign at least one human reviewer — every decision needs a named human, and Observers are read-only.");
  }

  /* — step 7 · window sanity — */
  if (draft.window.opensAt && draft.window.closesAt) {
    if (new Date(draft.window.closesAt).getTime() <= new Date(draft.window.opensAt).getTime()) {
      blocker("pf-window-order", 7, "The application window closes before it opens — check the dates.");
    }
  }

  /* — warnings (overridable with a logged reason) — */

  const totalMinutes = draft.pipeline
    .filter((b) => b.required)
    .reduce((a, b) => a + estimateMinutes(b), 0);
  if (totalMinutes > 45) {
    warning("pf-time-budget", 3, `Required blocks total ${fmtMinutes(totalMinutes)} — completion rates drop steeply past 45 min (abandonment data, R-I.7). Consider trimming or marking blocks optional.`);
  }

  const persPct = effectivePctByKind(draft, "personality");
  if (persPct > 20) {
    warning("pf-personality-weight", 4, `Personality carries ${persPct}% of the composite — keep it at or below 20% as a supporting signal (R-I.1).`);
  }

  const cog = cognitiveCaution(draft);
  if (cog) warning("pf-cognitive-caution", 4, cog);

  for (const b of ordered) {
    if (b.settings.kind !== "knockout") continue;
    for (const item of b.settings.items) {
      if (PROXY_RISK.test(item.question)) {
        const excerpt = item.question.length > 60 ? item.question.slice(0, 57) + "…" : item.question;
        warning(`pf-proxy-${item.id}`, 3, `Knockout item "${excerpt}" may proxy for a protected characteristic (address or age signals) — rephrase it or route it to human review (IL HB 3773).`);
      }
    }
  }

  if (draft.pipeline.length > 0 && !draft.pipeline.some((b) => INTERVIEW_KINDS.has(b.kind))) {
    warning("pf-no-interview", 3, "No interview block in the pipeline — the structured interview is the highest-validity, lowest-adverse-impact method available (R-I.1).");
  }

  return issues;
}

/* ---------- competition code (SPEC §4.8 Publish, §6) ---------- */

/* No vowels, no I/O/0/1 — unambiguous when spoken or printed, profanity-safe. */
const CODE_ALPHABET = "BCDFGHJKMNPQRSTVWXYZ23456789";

export function mintCode(existing: string[]): string {
  const taken = new Set(existing.map((c) => c.toUpperCase()));
  for (let attempt = 0; attempt < 1000; attempt++) {
    let code = "WBX-";
    for (let i = 0; i < 4; i++) {
      code += CODE_ALPHABET[Math.floor(Math.random() * CODE_ALPHABET.length)];
    }
    if (!taken.has(code)) return code;
  }
  /* store nearly saturated (28⁴ codes) — walk the space deterministically */
  for (const a of CODE_ALPHABET) {
    for (const b of CODE_ALPHABET) {
      for (const c of CODE_ALPHABET) {
        for (const d of CODE_ALPHABET) {
          const code = `WBX-${a}${b}${c}${d}`;
          if (!taken.has(code)) return code;
        }
      }
    }
  }
  return "WBX-FULL"; // unreachable in practice
}

/* ---------- candidate-facing time formatting ---------- */

export function fmtMinutes(min: number): string {
  const m = Math.max(0, Math.round(min));
  if (m === 0) return "0 min";
  if (m <= 90) return `about ${m} min`;
  const halfHours = Math.round(m / 30) / 2; // nearest half hour
  const h = Number.isInteger(halfHours) ? String(halfHours) : halfHours.toFixed(1);
  return `about ${h} h`;
}
