"use client";

import { usePathname } from "next/navigation";
import { Search, Bell, HelpCircle } from "lucide-react";
import { useCommandK } from "./CommandK";

function crumbs(pathname: string): string[] {
  if (pathname.includes("/candidates/CND")) return ["Acme Org", "Team Lead — Core Platform", "Candidate"];
  if (pathname.includes("/ranking")) return ["Acme Org", "Team Lead — Core Platform", "Ranking"];
  if (pathname.startsWith("/dashboard")) return ["Acme Org", "Dashboard"];
  return ["Acme Org", pathname.split("/")[1] ?? ""];
}

export default function TopBar() {
  const pathname = usePathname();
  const { open } = useCommandK();

  return (
    <header className="sticky top-0 z-20 flex h-[52px] items-center gap-4 border-b border-hairline bg-void/80 px-6 backdrop-blur">
      <nav className="flex items-center gap-2 text-[13px]">
        {crumbs(pathname).map((c, i, arr) => (
          <span key={c} className="flex items-center gap-2">
            <span className={i === arr.length - 1 ? "text-hi" : "text-mid"}>{c}</span>
            {i < arr.length - 1 && <span className="text-lo">›</span>}
          </span>
        ))}
      </nav>

      <div className="ml-4 flex h-8 w-80 items-center gap-2 rounded-lg border border-hairline bg-surface px-3 iris-focus">
        <Search className="size-3.5 text-lo" />
        <input
          className="w-full bg-transparent text-[13px] text-hi placeholder:text-lo focus:outline-none"
          placeholder="Search candidates, vacancies…"
          onFocus={open}
          readOnly
        />
      </div>

      <div className="ml-auto flex items-center gap-4">
        <button
          onClick={open}
          className="rounded border border-hairline bg-surface px-1.5 py-0.5 font-mono text-[11px] text-mid hover:text-hi"
        >
          ⌘K
        </button>
        <span className="flex items-center gap-2 rounded-full border border-hairline bg-surface px-2.5 py-1 font-mono text-[10px] tracking-[0.06em] text-mid">
          <span className="pulse-dot size-1.5 rounded-full iris-line" />
          AI PROCESSING 3 INTERVIEWS
        </span>
        <button className="relative text-mid hover:text-hi">
          <Bell className="size-[18px]" strokeWidth={1.5} />
          <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-ember" />
        </button>
        <HelpCircle className="size-[18px] text-lo" strokeWidth={1.5} />
      </div>
    </header>
  );
}
