"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Cube } from "@/components/ui/primitives";
import { competitions } from "@/lib/fixtures";

/* Code Entry — Book IV · §1. One action, calm, cube-lit. */
export default function CodeEntry() {
  const [code, setCode] = useState("");
  const [notFound, setNotFound] = useState(false);
  const router = useRouter();
  const valid = useMemo(() => /^WBX-[A-Z0-9]{4}$/.test(code), [code]);

  const enter = () => {
    if (!valid) return;
    const published = JSON.parse(localStorage.getItem("wbx-published") ?? "{}");
    const comp = competitions[code] ?? published[code];
    if (!comp) { setNotFound(true); return; }
    router.push(comp.entry === "status" ? "/status" : `/interview/check?code=${code}`);
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

      <button className="mt-5 text-[13px] text-lo hover:text-mid">I don’t have a code</button>
      <p className="mt-10 max-w-[42ch] text-center font-mono text-[10.5px] leading-relaxed tracking-[0.06em] text-lo">
        WHITEBOX EVALUATES CANDIDATES FAIRLY AND TRANSPARENTLY.
        <br />
        YOUR IDENTITY STAYS HIDDEN FROM EVALUATORS UNTIL THE FINAL STAGE.
      </p>
      <p className="mt-4 font-mono text-[10px] text-lo">TRY: WBX-3N8D (NEW COMPETITION · INTERVIEW) · WBX-7Q4K (SUBMITTED · STATUS)</p>
    </div>
  );
}
