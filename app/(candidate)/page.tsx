"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Cube } from "@/components/ui/primitives";
import { competitions } from "@/lib/fixtures";
import { findCompetitionByCode } from "@/lib/store";

/* Code Entry — Book IV · §1. One action, calm, cube-lit. */
export default function CodeEntry() {
  const [code, setCode] = useState("");
  const [notFound, setNotFound] = useState(false);
  const [help, setHelp] = useState(false);
  const router = useRouter();
  const valid = useMemo(() => /^WBX-[A-Z0-9]{4}$/.test(code), [code]);

  const enter = () => {
    if (!valid) return;
    const fixture = competitions[code];
    const stored = findCompetitionByCode(code);
    if (!fixture && !stored) { setNotFound(true); return; }
    const goesToStatus =
      fixture?.entry === "status" ||
      (!fixture && stored && "legacy" in stored && stored.legacy.entry === "status");
    router.push(goesToStatus ? "/status" : `/interview/check?code=${code}`);
  };

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-6 pb-16">
      <Cube size={120} />
      <h1 className="mt-10 font-display text-[clamp(24px,3vw,36px)] font-medium tracking-[-0.015em] text-hi">
        Enter your competition code
      </h1>
      <p className="mt-2.5 text-[15px] text-mid">Your employer shared a code for this role.</p>

      <form
        className="mt-9 w-full max-w-[440px]"
        onSubmit={(e) => {
          e.preventDefault();
          enter();
        }}
      >
        <input
          value={code}
          onChange={(e) => { setCode(e.target.value.toUpperCase()); setNotFound(false); }}
          placeholder="WBX-XXXX"
          maxLength={8}
          className="iris-focus w-full rounded-lg border border-hairline bg-surface px-5 py-4 text-center font-mono text-[20px] tracking-[0.35em] text-hi placeholder:text-lo"
          aria-label="competition code"
        />
        {code.length >= 8 && !valid && (
          <p className="mt-2.5 text-center text-[13px] text-neg">Check the code and try again — format is WBX-XXXX.</p>
        )}
        {notFound && (
          <p className="mt-2.5 text-center text-[13px] text-warn">
            We couldn't find a competition for this code. Double-check it with your employer.
          </p>
        )}
        <button
          type="submit"
          disabled={!valid}
          className="mt-4 w-full rounded-lg border border-hairline-strong bg-surface2 py-3.5 text-[15px] text-hi transition-colors hover:border-irisb/50 disabled:cursor-not-allowed disabled:opacity-35"
        >
          Continue
        </button>
      </form>

      <button onClick={() => setHelp(true)} className="mt-5 text-[13px] text-lo hover:text-mid">I don’t have a code</button>
      {help && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/70 p-6" onMouseDown={(e) => { if (e.target === e.currentTarget) setHelp(false); }}>
          <div className="w-full max-w-md rounded-xl border border-hairline-strong bg-surface2 p-6">
            <h2 className="font-display text-[21px] text-hi">Where to find your code</h2>
            <p className="mt-3 text-[13px] leading-relaxed text-mid">Your employer includes the eight-character code in the invitation email, SMS, job post, or QR landing page. It starts with WBX-.</p>
            <p className="mt-3 text-[12px] text-lo">If it is missing or expired, ask the recruiter who invited you. WhiteBox cannot identify the vacancy from personal details.</p>
            <button onClick={() => setHelp(false)} className="mt-5 rounded-lg border border-hairline-strong px-4 py-2 text-[12px] text-hi">Got it</button>
          </div>
        </div>
      )}
      <p className="mt-10 max-w-[42ch] text-center font-mono text-[10.5px] leading-relaxed tracking-[0.06em] text-lo">
        WHITEBOX EVALUATES CANDIDATES FAIRLY AND TRANSPARENTLY.
        <br />
        YOUR IDENTITY STAYS HIDDEN FROM EVALUATORS UNTIL THE FINAL STAGE.
      </p>
      <p className="mt-4 font-mono text-[10px] text-lo">TRY: WBX-3N8D (NEW COMPETITION · INTERVIEW) · WBX-7Q4K (SUBMITTED · STATUS)</p>
    </div>
  );
}
