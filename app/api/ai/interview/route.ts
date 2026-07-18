import { NextResponse } from "next/server";
import { interviewStepStub, type InterviewStepRequest } from "@/lib/ai";

/* POST /api/ai/interview — Book V · §V.3 call #2 (adaptive interview agent).
   Real implementation: LiveKit Agents loop → STT → LangGraph stateful agent → TTS.
   This handler keeps the same request/response contract so the client UI
   does not change when the realtime stack lands. */
export async function POST(req: Request) {
  const body = (await req.json()) as InterviewStepRequest;
  if (!body?.competencies?.length) {
    return NextResponse.json({ error: "Missing interview config." }, { status: 422 });
  }
  await new Promise((r) => setTimeout(r, 700)); // "thinking" pause — cube pulses meanwhile
  return NextResponse.json(interviewStepStub(body));
}
