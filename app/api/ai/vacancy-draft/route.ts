import { NextResponse } from "next/server";
import { nlToVacancyDraft } from "@/lib/ai";

/* POST /api/ai/vacancy-draft — SPEC §4.1 entry C (Describe mode).
   Plain-language role description → full VacancyV2 draft: profile, criteria
   with BARS scales, and a pipeline where every generated field explains itself.
   Real implementation: authoring.* prompt chain; contract stays identical. */
export async function POST(req: Request) {
  const body = (await req.json()) as { title?: string; description?: string };
  if (!body?.description || body.description.trim().length < 20) {
    return NextResponse.json({ error: "Describe the role in at least a couple of sentences." }, { status: 422 });
  }
  await new Promise((r) => setTimeout(r, 1100)); // simulate model latency for the determinate progress UI
  return NextResponse.json({
    draft: nlToVacancyDraft(body.title?.trim() || "Untitled role", body.description),
    modelVer: "stub-vacancy-draft-0.1",
    promptVer: "v0-heuristic",
  });
}
