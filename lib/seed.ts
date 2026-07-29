"use client";

/* ============================================================
   STARTER COMPETITIONS

   The store is localStorage, so a vacancy published in one browser
   does not exist in another. These starters are built on first load
   in whatever browser opens the app, through the same builder the
   Studio's "Describe" entry mode uses (nlToVacancyDraft) and the same
   publish path (publishDraft) — a real VacancyV2 with real criteria,
   pipeline, questions and rubrics, not a display stub.

   The code is fixed so it can be handed out and typed in anywhere.
   Editing or deleting a starter sticks: we only create one when no
   vacancy with that code is present.
   ============================================================ */

import { draftQuestion, nlToVacancyDraft } from "./ai";
import { estimateMinutes } from "./blocks";
import { listVacancies, publishDraft } from "./store";
import type { AttributeSpec, CategorySpec, VacancyV2 } from "./types";

interface Starter {
  code: string;
  title: string;
  description: string;
  /* Without a model configured, suggestCriteria falls back to a generic
     managerial KSAO set that fits almost any office role and almost no
     hands-on one. A starter meant to be tried by hand carries the criteria a
     recruiter would actually have written in step 02. */
  categories?: CategorySpec[];
}

const anchors = (a: string, b: string, c: string, d: string, e: string) =>
  [a, b, c, d, e] as AttributeSpec["scale"]["anchors"];

export const STARTERS: Starter[] = [
  {
    code: "WBX-8F2M",
    title: "Barista — Specialty Coffee Bar",
    description:
      "We are hiring a barista for a busy specialty coffee bar. The work is hands-on: dialling in espresso through the day, keeping drink quality consistent under a morning rush, and reading what a guest actually wants. We care about care for the craft, steady judgment when the queue is long, and how someone handles a guest whose order went wrong. Prior speciality experience helps but attitude and willingness to learn matter more.",
    categories: [
      {
        id: "cat-craft",
        name: "Craft & consistency",
        weight: 45,
        rationale: "The product is the job. Everything else supports it.",
        attributes: [
          {
            id: "attr-extraction",
            name: "Espresso judgment",
            kind: "skill",
            definition: "Diagnoses a bad shot and adjusts grind, dose or time for a reason they can name.",
            weight: 55,
            focus: true,
            scale: { anchors: anchors(
              "Follows a recipe; cannot tell a good shot from a bad one.",
              "Notices something is off but guesses at the fix.",
              "Corrects common faults and explains the variable they changed.",
              "Dials in reliably across the day and predicts how a change will taste.",
              "Diagnoses roast, grinder and water together; teaches the reasoning to others.",
            ) },
            verification: "interview",
          },
          {
            id: "attr-consistency",
            name: "Consistency under volume",
            kind: "trait",
            definition: "Holds drink quality and sequence when the queue is long.",
            weight: 45,
            scale: { anchors: anchors(
              "Quality collapses as soon as the bar gets busy.",
              "Keeps up but drops steps under pressure.",
              "Maintains the standard through a normal rush.",
              "Paces the bar and protects quality when it is genuinely slammed.",
              "Reorganises the workflow mid-rush so the whole bar holds up.",
            ) },
            verification: "interview",
          },
        ],
      },
      {
        id: "cat-guest",
        name: "Guest care",
        weight: 35,
        rationale: "Recovery from a bad drink predicts repeat custom more than the drink itself.",
        attributes: [
          {
            id: "attr-recovery",
            name: "Service recovery",
            kind: "skill",
            definition: "Turns a wrong order or unhappy guest into a resolved one without escalating.",
            weight: 60,
            focus: true,
            scale: { anchors: anchors(
              "Becomes defensive or hands the problem to someone else.",
              "Apologises but does not resolve the underlying issue.",
              "Fixes the drink and checks the guest is satisfied.",
              "Reads the real complaint, resolves it, and prevents the repeat.",
              "De-escalates hard cases and changes the process so it stops happening.",
            ) },
            verification: "interview",
          },
          {
            id: "attr-reading",
            name: "Reading the guest",
            kind: "trait",
            definition: "Works out what someone actually wants when they cannot name it.",
            weight: 40,
            scale: { anchors: anchors(
              "Takes every order literally, no questions.",
              "Asks a question only when the order is impossible.",
              "Clarifies unclear orders and suggests a fitting option.",
              "Guides a hesitant guest to something they enjoy.",
              "Builds regulars by remembering and anticipating preference.",
            ) },
            verification: "interview",
          },
        ],
      },
      {
        id: "cat-growth",
        name: "Reliability & growth",
        weight: 20,
        rationale: "Attitude and learning speed were stated as more important than prior experience.",
        attributes: [
          {
            id: "attr-learning",
            name: "Learning velocity",
            kind: "trait",
            definition: "Takes correction and applies it without needing the same note twice.",
            weight: 100,
            scale: { anchors: anchors(
              "Repeats the same mistake after feedback.",
              "Applies feedback once, inconsistently after.",
              "Takes a correction and it sticks.",
              "Seeks feedback out and practises deliberately.",
              "Builds their own drills and raises the bar for the team.",
            ) },
            verification: "interview",
          },
        ],
      },
    ],
  },
];

/* Build and store any starter whose code is not already present.
   Returns the vacancies that were created this call (empty on repeat loads). */
export function ensureStarters(): VacancyV2[] {
  if (typeof window === "undefined") return [];
  const present = new Set(listVacancies().map((v) => v.code.toUpperCase()));
  const created: VacancyV2[] = [];

  for (const starter of STARTERS) {
    if (present.has(starter.code.toUpperCase())) continue;
    const draft = nlToVacancyDraft(starter.title, starter.description);
    draft.id = `vac-${starter.code.slice(4).toLowerCase()}`;
    draft.code = starter.code; // publishDraft keeps a code that is already set
    if (starter.categories) applyCategories(draft, starter.categories);
    created.push(publishDraft(draft));
  }
  return created;
}

/* Swap in authored criteria and re-point everything that referenced the old
   ones: each scored block re-measures the new attributes, and interview
   questions are redrafted so every question still binds to a real attribute
   with its own rubric. Leaving stale ids behind would trip preflight. */
function applyCategories(draft: VacancyV2, categories: CategorySpec[]): void {
  draft.categories = categories;
  const attrs = categories.flatMap((c) => c.attributes);
  if (attrs.length === 0) return;

  const base = Math.floor(100 / attrs.length);
  const remainder = 100 - base * attrs.length;
  const measures = attrs.map((a, i) => ({
    attributeId: a.id,
    share: base + (i < remainder ? 1 : 0),
  }));

  /* focus attributes first — they need two scored blocks for triangulation */
  const ordered = [...attrs.filter((a) => a.focus), ...attrs.filter((a) => !a.focus)];

  for (const block of draft.pipeline) {
    if (!block.scored) continue;
    block.measures = measures;
    if ("questions" in block.settings) {
      block.settings.questions = ordered.map((a) =>
        draftQuestion(a, a.kind === "knowledge" ? "job_knowledge" : "behavioral", draft.profile.seniority),
      );
      block.estimatedMinutes = estimateMinutes(block);
    }
  }
}
