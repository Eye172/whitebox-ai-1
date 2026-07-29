import { NextResponse } from "next/server";
import { draftCriteria } from "@/lib/authoring";
import { LlmError } from "@/lib/llm";
import type { PositionProfile } from "@/lib/types";

/* POST /api/ai/suggest-criteria — SPEC §4.3.3 suggestion engine.
   Drafts a weighted KSAO architecture from the position profile. Every
   suggested row carries its own "why" so the author can argue with it. */
export async function POST(req: Request) {
  const body = (await req.json()) as { profile?: PositionProfile };
  const profile = body?.profile;
  if (!profile?.title?.trim()) {
    return NextResponse.json(
      { error: "Fill in the position profile first — at least a title." },
      { status: 422 },
    );
  }

  try {
    const { categories, meta, warning } = await draftCriteria(profile);
    return NextResponse.json({ categories, meta, warning });
  } catch (e) {
    /* Only a refusal reaches here — draftCriteria absorbs everything else. */
    const message =
      e instanceof LlmError ? e.message : "Could not draft criteria for this role.";
    return NextResponse.json({ error: message }, { status: 422 });
  }
}
