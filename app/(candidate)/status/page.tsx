import { Check } from "lucide-react";
import { Cube } from "@/components/ui/primitives";
import { candidateStatus } from "@/lib/fixtures";

/* Status / Results — Book IV · §7. Calm, dignified, no scores, no ranks. */
export default function StatusPage() {
  const s = candidateStatus;
  return (
    <div className="flex flex-1 flex-col items-center px-6 pt-6">
      {/* progress rail — the candidate's map */}
      <div className="flex items-center gap-0">
        {s.steps.map((st, i) => (
          <div key={st.label} className="flex items-center">
            <div className="flex flex-col items-center">
              <span
                className={`flex size-6 items-center justify-center rounded-full border text-[10px] ${
                  st.done ? "border-hairline-strong bg-surface2 text-pos" : "border-irisb/50 text-mid"
                }`}
              >
                {st.done ? <Check className="size-3" /> : i + 1}
              </span>
              <span className={`mt-1.5 font-mono text-[9px] tracking-[0.08em] uppercase ${st.done ? "text-mid" : "text-hi"}`}>
                {st.label}
              </span>
            </div>
            {i < s.steps.length - 1 && <span className={`mx-2 mb-5 h-px w-10 ${st.done ? "bg-hairline-strong" : "bg-hairline"}`} />}
          </div>
        ))}
      </div>

      <div className="flex flex-1 flex-col items-center justify-center pb-16">
        <Cube size={104} />
        <div className="hud-label mt-9">{s.code} · {s.vacancyTitle.toUpperCase()}</div>
        <h1 className="mt-3 font-display text-[clamp(24px,3vw,34px)] font-medium tracking-[-0.015em] text-hi">
          Your application is under review
        </h1>
        <p className="mt-3 max-w-[52ch] text-center text-[15px] leading-relaxed text-mid">
          Your interview and documents are in. The AI has structured its assessment, and a{" "}
          <span className="font-serif text-hi">human</span> reviewer makes every final decision. We’ll email you the
          moment your status changes.
        </p>

        {/* trust moment — inverted white-box panel: the box you can see into */}
        <div className="wb grain relative mt-10 w-full max-w-[520px] overflow-hidden rounded-xl p-6">
          <div className="font-mono text-[10px] tracking-[0.1em] uppercase" style={{ color: "var(--text-lo)" }}>
            Inside the white box
          </div>
          <ul className="mt-3 space-y-2 text-[13.5px] leading-relaxed" style={{ color: "var(--wb-text)" }}>
            <li>· You were evaluated on your answers — not your name, photo, gender, or age.</li>
            <li>· Your documents were verified, then automatically deleted.</li>
            <li>· Every score carries its reasoning, and a human signed off on it.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
