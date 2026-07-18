import Link from "next/link";
import { Globe } from "lucide-react";

/* Candidate shell — Book IV · §0: minimal top bar, calm canvas, no dense nav */
export default function CandidateLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="contour-bg contour-bg-soft flex min-h-screen flex-col">
      <header className="flex h-14 items-center justify-between px-8">
        <Link href="/" className="flex items-center gap-3">
          <span className="flex size-5 items-center justify-center border border-hairline-strong">
            <span className="size-2 border border-line-strong bg-white/90" />
          </span>
          <span className="font-display text-[13px] font-light tracking-[0.28em] text-hi">WHITEBOX</span>
        </Link>
        <button className="flex items-center gap-1.5 font-mono text-[11px] tracking-[0.08em] text-lo hover:text-mid">
          <Globe className="size-3.5" /> EN
        </button>
      </header>
      <main className="flex flex-1 flex-col">{children}</main>
      <footer className="flex items-center justify-between px-8 py-5">
        <span className="font-mono text-[10px] tracking-[0.08em] text-lo">
          FAIR · TRANSPARENT · HUMAN-DECIDED
        </span>
        <Link href="/dashboard" className="font-mono text-[10px] tracking-[0.08em] text-lo hover:text-mid">
          HR WORKSPACE →
        </Link>
      </footer>
    </div>
  );
}
