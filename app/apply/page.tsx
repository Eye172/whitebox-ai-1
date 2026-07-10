"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CandidateShell from "@/components/candidate/CandidateShell";
import Cube from "@/components/ui/Cube";
import { Button } from "@/components/ui/primitives";

export default function CodeEntry() {
  const router = useRouter();
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const valid = /^WBX-[A-Z0-9]{4}$/.test(code.trim());

  const submit = () => {
    if (!valid) {
      setError("Check the code and try again — it looks like WBX-7Q4K.");
      return;
    }
    router.push("/apply/register");
  };

  return (
    <CandidateShell step="code">
      <div className="flex flex-col items-center pt-6 text-center">
        <div className="mb-8 animate-cube-float">
          <Cube size={84} />
        </div>
        <h1 className="h2 mb-2 text-text-hi">Enter your competition code</h1>
        <p className="mb-8 text-[14px] text-text-mid">Your employer shared a code for this role.</p>

        <div className="w-full max-w-sm">
          <input
            value={code}
            onChange={(e) => {
              setCode(e.target.value.toUpperCase());
              setError(null);
            }}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder="WBX-7Q4K"
            className="mono w-full rounded-[10px] border border-hairline bg-surface px-4 py-4 text-center text-[22px] tracking-[0.15em] text-text-hi outline-none placeholder:text-text-disabled focus:border-hairline-strong"
            style={error ? { borderColor: "var(--neg)" } : undefined}
          />
          {error && <p className="mt-2 text-[12.5px]" style={{ color: "var(--neg)" }}>{error}</p>}
          <Button className="mt-4 w-full" size="lg" disabled={!valid} onClick={submit}>
            Continue
          </Button>
          <button className="mono mt-4 text-[12px] text-text-lo hover:text-text-mid">I don&rsquo;t have a code</button>
        </div>

        <p className="mono mt-10 text-[11px] text-text-lo">WhiteBox evaluates candidates fairly and transparently.</p>
      </div>
    </CandidateShell>
  );
}
