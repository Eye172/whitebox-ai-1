import { NextResponse } from "next/server";
import { nlToVacancyDraft } from "@/lib/ai";
import { draftCriteria } from "@/lib/authoring";
import { generateJson, isLlmConfigured, localMeta, LlmError } from "@/lib/llm";
import { createEmptyDraft } from "@/lib/studio";
import { EMPLOYMENT_TYPES, INDUSTRY_PACKS, SENIORITIES, WORK_MODES } from "@/lib/types";
import type { PositionProfile, VacancyV2 } from "@/lib/types";

/* POST /api/ai/vacancy-draft — SPEC §4.1 entry C (Describe mode).
   Plain-language role description → the position profile half of a
   VacancyV2 draft. Criteria and pipeline are drafted from that profile by
   the same code the "Suggest attributes" button uses, so a described role
   and a manually-typed one converge on identical structures. */

const PROMPT_ID = "authoring.profile";
const PROMPT_VERSION = "1";

const SYSTEM = `You turn a plain-language job description into a structured position profile.

Rules:
- Extract only what the description supports. Leave a field empty rather than inventing a detail.
- "mission" is 1-3 sentences describing what this role exists to achieve.
- "responsibilities" are concrete duties, one per entry, phrased as actions.
- Choose the closest seniority, employment type, work mode and industry from the allowed values.
- "languagePrimary" is the ISO-639-1 code of the language the DESCRIPTION is written in.
- Write mission and responsibilities in that same language.`;

const SCHEMA = {
  type: "object",
  additionalProperties: false,
  required: [
    "title", "mission", "responsibilities", "seniority", "employmentType",
    "workMode", "industryPack", "languagePrimary", "locations", "teamContext",
  ],
  properties: {
    title: { type: "string" },
    mission: { type: "string" },
    responsibilities: { type: "array", items: { type: "string" } },
    seniority: { type: "string", enum: [...SENIORITIES] },
    employmentType: { type: "string", enum: [...EMPLOYMENT_TYPES] },
    workMode: { type: "string", enum: [...WORK_MODES] },
    industryPack: { type: "string", enum: [...INDUSTRY_PACKS] },
    languagePrimary: { type: "string" },
    locations: { type: "array", items: { type: "string" } },
    teamContext: { type: "string" },
  },
};

interface DraftedProfile {
  title: string;
  mission: string;
  responsibilities: string[];
  seniority: string;
  employmentType: string;
  workMode: string;
  industryPack: string;
  languagePrimary: string;
  locations: string[];
  teamContext: string;
}

function toDraft(drafted: DraftedProfile, fallbackTitle: string): VacancyV2 {
  const base = createEmptyDraft();
  const profile: PositionProfile = {
    ...base.profile,
    title: drafted.title?.trim() || fallbackTitle,
    mission: drafted.mission,
    responsibilities: drafted.responsibilities.filter(Boolean),
    seniority: drafted.seniority as PositionProfile["seniority"],
    employmentType: drafted.employmentType as PositionProfile["employmentType"],
    workMode: drafted.workMode as PositionProfile["workMode"],
    industryPack: drafted.industryPack as PositionProfile["industryPack"],
    locations: drafted.locations.filter(Boolean),
    teamContext: drafted.teamContext || undefined,
    languages: { primary: drafted.languagePrimary || "en", alternates: [] },
  };
  return { ...base, profile };
}

export async function POST(req: Request) {
  const body = (await req.json()) as { title?: string; description?: string };
  const description = body?.description?.trim() ?? "";
  const title = body?.title?.trim() || "Untitled role";

  if (description.length < 20) {
    return NextResponse.json(
      { error: "Describe the role in at least a couple of sentences." },
      { status: 422 },
    );
  }

  if (isLlmConfigured()) {
    try {
      const { data, meta } = await generateJson<DraftedProfile>({
        promptId: PROMPT_ID,
        promptVersion: PROMPT_VERSION,
        system: SYSTEM,
        prompt: `Working title: ${title}\n\nDescription:\n${description}`,
        schema: SCHEMA,
      });
      const draft = toDraft(data, title);
      /* Second link in the chain: the profile we just extracted drives the
         same criteria drafting the "Suggest attributes" button calls, so
         Describe mode lands on a complete, editable architecture. */
      const criteria = await draftCriteria(draft.profile);
      return NextResponse.json({
        draft: { ...draft, categories: criteria.categories },
        meta,
        warning: criteria.warning,
      });
    } catch (e) {
      const err = e instanceof LlmError ? e : null;
      if (err?.kind === "refusal") {
        return NextResponse.json({ error: err.message }, { status: 422 });
      }
      return NextResponse.json({
        draft: nlToVacancyDraft(title, description),
        meta: localMeta(PROMPT_ID, PROMPT_VERSION),
        warning: err?.message ?? "The model was unreachable — showing a locally generated draft.",
      });
    }
  }

  return NextResponse.json({
    draft: nlToVacancyDraft(title, description),
    meta: localMeta(PROMPT_ID, PROMPT_VERSION),
  });
}
