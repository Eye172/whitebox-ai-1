import { NextResponse } from "next/server";
import { evaluateApplication } from "@/lib/engine";
import type { ApplicationRecord, VacancyV2 } from "@/lib/types";

/* POST /api/engine/evaluate — SPEC §8 Stage A + Stage B in one call.
   Real implementation: per-block scorer.item runs (k=3, temperature 0) followed
   by the mechanical rollup and synth.* prompts, pinned per configVersion.
   The stub keeps the exact CandidateEvaluation contract, so the review
   workbench does not change when the real engine lands. */
export async function POST(req: Request) {
  const body = (await req.json()) as { vacancy?: VacancyV2; application?: ApplicationRecord };
  if (!body?.vacancy?.pipeline?.length || !body.application?.blockResults) {
    return NextResponse.json({ error: "Pass the vacancy and the application record to evaluate." }, { status: 422 });
  }
  await new Promise((r) => setTimeout(r, 1200)); // scoring pass — the cube pulses meanwhile
  return NextResponse.json({ evaluation: evaluateApplication(body.vacancy, body.application) });
}
