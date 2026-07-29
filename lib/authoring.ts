/* ============================================================
   AUTHORING CHAIN — server-side prompt definitions (SPEC §4.1, §4.3.3).

   Shared by /api/ai/vacancy-draft and /api/ai/suggest-criteria so that a
   described role and a manually-typed one converge on identical structures.
   Ids and the 5-level BARS shape are assembled here rather than asked of
   the model, so the result always satisfies the studio's invariants.
   ============================================================ */

import { suggestCriteria } from "./ai";
import { generateJson, isLlmConfigured, localMeta, LlmError } from "./llm";
import type { LlmMeta } from "./llm";
import { ATTRIBUTE_KINDS } from "./types";
import type { AttributeSpec, CategorySpec, PositionProfile } from "./types";

export const CRITERIA_PROMPT_ID = "authoring.criteria";
export const CRITERIA_PROMPT_VERSION = "1";

const CRITERIA_SYSTEM = `You design selection criteria for hiring, following evidence-based I/O psychology.

Rules:
- Produce 2-4 categories whose weights sum to exactly 100.
- Within each category, attribute weights sum to exactly 100.
- Every attribute needs a one-sentence definition written as an OBSERVABLE behaviour, not a personality label.
- Write 5 BARS anchors per attribute, ascending from level 1 (no evidence) to level 5 (exceptional). Each anchor describes what a candidate would actually say or do.
- Every attribute carries a short "rationale" explaining why it belongs and why it is weighted that way.
- Mark at most 5 attributes as focus: the ones that most separate a strong hire from an adequate one.
- Prefer criteria that a structured interview or work sample can actually measure.
- Never propose criteria that proxy for age, gender, ethnicity, nationality, disability, or family status.
- Write in the same language as the role description.`;

const CRITERIA_SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: ["categories"],
  properties: {
    categories: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["name", "description", "weight", "rationale", "attributes"],
        properties: {
          name: { type: "string" },
          description: { type: "string" },
          weight: { type: "integer" },
          rationale: { type: "string" },
          attributes: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "kind", "definition", "weight", "focus", "rationale", "anchors"],
              properties: {
                name: { type: "string" },
                kind: { type: "string", enum: [...ATTRIBUTE_KINDS] },
                definition: { type: "string" },
                weight: { type: "integer" },
                focus: { type: "boolean" },
                rationale: { type: "string" },
                anchors: { type: "array", items: { type: "string" } },
              },
            },
          },
        },
      },
    },
  },
};

interface DraftedCategory {
  name: string;
  description: string;
  weight: number;
  rationale: string;
  attributes: {
    name: string;
    kind: string;
    definition: string;
    weight: number;
    focus: boolean;
    rationale: string;
    anchors: string[];
  }[];
}

const uid = (p: string) => `${p}-${Math.random().toString(36).slice(2, 9)}`;

/* Pad or trim to exactly five — the type is a 5-tuple and the rubric
   editor renders levels 1..5 unconditionally. */
function toAnchors(raw: string[]): AttributeSpec["scale"]["anchors"] {
  const five = Array.isArray(raw) ? [...raw].slice(0, 5) : [];
  while (five.length < 5) five.push("");
  return five as AttributeSpec["scale"]["anchors"];
}

function toCategories(drafted: DraftedCategory[]): CategorySpec[] {
  return drafted.map((cat) => ({
    id: uid("cat"),
    name: cat.name,
    description: cat.description,
    weight: Math.round(cat.weight),
    rationale: cat.rationale,
    attributes: cat.attributes.map((attr) => ({
      id: uid("attr"),
      name: attr.name,
      kind: attr.kind as AttributeSpec["kind"],
      definition: attr.definition,
      weight: Math.round(attr.weight),
      focus: attr.focus || undefined,
      rationale: attr.rationale,
      scale: { anchors: toAnchors(attr.anchors) },
      verification:
        attr.kind === "knowledge" ? "test" : attr.kind === "qualification" ? "document" : "interview",
    })),
  }));
}

export function describeProfile(profile: PositionProfile): string {
  const lines = [
    `Role title: ${profile.title}`,
    `Seniority: ${profile.seniority}`,
    `Employment: ${profile.employmentType} · ${profile.workMode}`,
    `Industry: ${profile.industryPack}`,
  ];
  if (profile.department) lines.push(`Team: ${profile.department}`);
  if (profile.mission) lines.push(`Mission: ${profile.mission}`);
  if (profile.responsibilities.length > 0) {
    lines.push(`Responsibilities:\n${profile.responsibilities.map((r) => `- ${r}`).join("\n")}`);
  }
  if (profile.teamContext) lines.push(`Team context: ${profile.teamContext}`);
  lines.push(`Primary language: ${profile.languages.primary}`);
  return lines.join("\n");
}

export interface CriteriaResult {
  categories: CategorySpec[];
  meta: LlmMeta;
  warning?: string;
}

/* Draft the criteria architecture for a profile. Falls back to the local
   generator on any non-refusal failure so the studio stays usable; a
   refusal propagates, because only the author can resolve it. */
export async function draftCriteria(profile: PositionProfile): Promise<CriteriaResult> {
  if (!isLlmConfigured()) {
    return {
      categories: suggestCriteria(profile),
      meta: localMeta(CRITERIA_PROMPT_ID, CRITERIA_PROMPT_VERSION),
    };
  }

  try {
    const { data, meta } = await generateJson<{ categories: DraftedCategory[] }>({
      promptId: CRITERIA_PROMPT_ID,
      promptVersion: CRITERIA_PROMPT_VERSION,
      system: CRITERIA_SYSTEM,
      prompt: `Design the selection criteria for this role.\n\n${describeProfile(profile)}`,
      schema: CRITERIA_SCHEMA,
    });
    return { categories: toCategories(data.categories), meta };
  } catch (e) {
    if (e instanceof LlmError && e.kind === "refusal") throw e;
    return {
      categories: suggestCriteria(profile),
      meta: localMeta(CRITERIA_PROMPT_ID, CRITERIA_PROMPT_VERSION),
      warning:
        e instanceof Error
          ? e.message
          : "The model was unreachable — showing a locally generated draft.",
    };
  }
}
