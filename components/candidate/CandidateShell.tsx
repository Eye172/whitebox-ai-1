import React from "react";
import Link from "next/link";
import { Globe, ShieldCheck } from "lucide-react";
import ProgressRail from "./ProgressRail";
import CubeMark from "@/components/ui/CubeMark";
import ContourBg from "@/components/ui/ContourBg";

export default function CandidateShell({
  children,
  step,
  reassure = true,
  wide = false,
}: {
  children: React.ReactNode;
  step?: string;
  reassure?: boolean;
  wide?: boolean;
}) {
  return (
    <div className="relative min-h-screen bg-void text-text-hi">
      {/* calm background — subtle ink-flow contour (human-touch register), no graph-paper */}
      <ContourBg variant="ink" opacity={0.05} fade="center" className="fixed" />
      <div className="pointer-events-none fixed inset-0 bg-[radial-gradient(70%_50%_at_50%_-10%,rgba(123,147,255,0.08),transparent_60%)]" />

      {/* minimal top bar */}
      <header className="relative flex h-14 items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2.5">
          <CubeMark size={22} />
          <span className="wordmark text-[13px] text-text-hi">WhiteBox</span>
        </Link>
        <button className="mono flex items-center gap-1.5 text-[12px] text-text-lo hover:text-text-hi">
          <Globe className="h-3.5 w-3.5" /> EN
        </button>
      </header>

      {step && <ProgressRail current={step} />}

      <main className={`relative mx-auto px-6 py-10 ${wide ? "max-w-5xl" : "max-w-xl"}`}>
        {children}
      </main>

      {reassure && (
        <div className="pointer-events-none fixed inset-x-0 bottom-0 flex justify-center pb-4">
          <div className="mono flex items-center gap-2 rounded-full border border-hairline bg-surface/80 px-3 py-1.5 text-[11px] text-text-lo glass-blur">
            <ShieldCheck className="h-3.5 w-3.5" style={{ color: "var(--pos)" }} />
            Your identity is hidden from evaluators. You&rsquo;re assessed on your answers.
          </div>
        </div>
      )}
    </div>
  );
}
