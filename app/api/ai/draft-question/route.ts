import { NextResponse } from "next/server";
import { draftQuestion } from "@/lib/ai";
import type { AttributeSpec, QuestionType, Seniority } from "@/lib/types";

/* POST /api/ai/draft-question — SPEC §8.4 authoring.question prompt (studio-side,
   never runs on candidates). Drafts one question tied to exactly one attribute,
   with its rubric and pre-approved probes. Contract stays identical when the
   real model lands. */
export async function POST(req: Request) {
  const body = (await req.json()) as { attribute?: AttributeSpec; type?: QuestionType; seniority?: Seniority };
  if (!body?.attribute?.id || !body.attribute.scale?.anchors?.length) {
    return NextResponse.json({ error: "Pass a full attribute (with its BARS scale) to draft against." }, { status: 422 });
  }
  await new Promise((r) => setTimeout(r, 700)); // "drafting" pause — same rhythm as the interview agent
  return NextResponse.json({
    question: draftQuestion(body.attribute, body.type ?? "behavioral", body.seniority ?? "Middle"),
    modelVer: "stub-authoring-0.1",
    promptVer: "v0-heuristic",
  });
}
