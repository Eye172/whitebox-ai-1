import { NextResponse } from "next/server";
import { nlToConfigStub, type NlToConfigRequest } from "@/lib/ai";

/* POST /api/ai/nl-to-config — Book V · §V.3 call #1.
   Real implementation: forward to the FastAPI AI core (Claude + Instructor,
   JSON schema with per-field rationale). Contract stays identical. */
export async function POST(req: Request) {
  const body = (await req.json()) as NlToConfigRequest;
  if (!body?.description || body.description.trim().length < 20) {
    return NextResponse.json({ error: "Describe the role in at least a couple of sentences." }, { status: 422 });
  }
  await new Promise((r) => setTimeout(r, 900)); // simulate model latency for the determinate progress UI
  return NextResponse.json(nlToConfigStub(body));
}
