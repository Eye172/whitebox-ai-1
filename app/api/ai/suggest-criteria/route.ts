import { NextResponse } from "next/server";
import { suggestCriteria } from "@/lib/ai";
import type { PositionProfile } from "@/lib/types";

/* POST /api/ai/suggest-criteria — SPEC §4.3.3 suggestion engine.
   Real implementation: authoring.criteria prompt over the Position Profile
   + taxonomy mapping (Claude + Instructor). Contract stays identical —
   every suggested row carries its own one-line "why". */
export async function POST(req: Request) {
  const body = (await req.json()) as { profile?: PositionProfile };
  if (!body?.profile?.title) {
    return NextResponse.json({ error: "Fill in the position profile first — at least a title." }, { status: 422 });
  }
  await new Promise((r) => setTimeout(r, 900)); // simulate model latency for the determinate progress UI
  return NextResponse.json({
    categories: suggestCriteria(body.profile),
    modelVer: "stub-criteria-0.1",
    promptVer: "v0-heuristic",
  });
}
