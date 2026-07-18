import Link from "next/link";
import { Cube } from "@/components/ui/primitives";

/* Action-oriented empty state (Book III · §0.5) for surfaces not yet built in this prototype. */
export default async function Placeholder({ params }: { params: Promise<{ rest: string[] }> }) {
  const { rest } = await params;
  const name = rest[rest.length - 1]?.replace(/-/g, " ") ?? "";
  return (
    <div className="grid-paper flex min-h-[70vh] flex-col items-center justify-center p-8 text-center">
      <Cube size={72} dim />
      <div className="hud-label mt-8">{rest.join(" / ").toUpperCase()}</div>
      <h1 className="mt-2 font-display text-[22px] font-medium capitalize text-hi">{name}</h1>
      <p className="mt-2 max-w-[46ch] text-[13px] leading-relaxed text-mid">
        This surface ships in a later phase (P2–P3 of the build sequence). The core differentiator — ranking,
        scorecard, explainability, and the HITL audit chain — is live now.
      </p>
      <Link
        href="/vacancies/vac-001/candidates/CND-4A19"
        className="brackets mt-6 rounded border border-hairline-strong bg-surface2 px-4 py-2 text-[13px] text-hi hover:border-irisb/50"
      >
        Open the explainability scorecard
      </Link>
    </div>
  );
}
