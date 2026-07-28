"use client";

import { usePathname } from "next/navigation";
import { Search, Bell, HelpCircle } from "lucide-react";
import { useCommandK } from "./CommandK";
import { useState } from "react";

function pageName(pathname: string): string {
  if (pathname.includes("/candidates/CND")) return "Candidate";
  if (pathname.includes("/ranking")) return "Candidates";
  if (pathname.includes("/compare")) return "Compare";
  if (pathname.includes("/invitations")) return "Messages";
  if (pathname.includes("/config")) return "Setup";
  if (pathname.startsWith("/dashboard")) return "Dashboard";
  if (pathname.startsWith("/bias")) return "Fairness";
  if (pathname.startsWith("/calibration")) return "Review quality";
  if (pathname.startsWith("/audit")) return "Activity log";
  const segment = pathname.split("/").filter(Boolean)[0] ?? "Dashboard";
  return segment.charAt(0).toUpperCase() + segment.slice(1);
}

export default function TopBar() {
  const pathname = usePathname();
  const { open } = useCommandK();
  const [panel, setPanel] = useState<"notifications" | "help" | null>(null);

  return (
    <header className="sticky top-0 z-20 flex h-[52px] items-center gap-4 border-b border-hairline bg-void/80 px-6 backdrop-blur">
      <div className="w-36 text-[13px] font-medium text-hi">{pageName(pathname)}</div>

      <div className="ml-2 flex h-8 w-full max-w-md items-center gap-2 rounded-lg border border-hairline bg-surface px-3 iris-focus">
        <Search className="size-3.5 text-lo" />
        <input
          className="w-full bg-transparent text-[13px] text-hi placeholder:text-lo focus:outline-none"
          placeholder="Search or jump to…"
          onFocus={open}
          readOnly
        />
        <button onClick={open} aria-label="Open quick navigation" className="rounded border border-hairline px-1.5 py-0.5 font-mono text-[10px] text-lo hover:text-hi">⌘K</button>
      </div>

      <div className="ml-auto flex items-center gap-4">
        <button aria-label="Notifications" onClick={() => setPanel(panel === "notifications" ? null : "notifications")} className="relative text-mid hover:text-hi">
          <Bell className="size-[18px]" strokeWidth={1.5} />
          <span className="absolute -right-0.5 -top-0.5 size-1.5 rounded-full bg-ember" />
        </button>
        <button aria-label="Help" onClick={() => setPanel(panel === "help" ? null : "help")}><HelpCircle className="size-[18px] text-lo" strokeWidth={1.5} /></button>
      </div>
      {panel && (
        <div className="absolute right-5 top-12 w-80 rounded-xl border border-hairline-strong bg-surface2 p-4 shadow-2xl">
          {panel === "notifications" ? (
            <>
              <div className="hud-label">Notifications · 1 new</div>
              <div className="mt-3 rounded-lg border border-hairline bg-surface p-3">
                <div className="text-[12px] text-hi">Bias review requires attention</div>
                <div className="mt-1 text-[10px] leading-relaxed text-mid">VAC-002 shortlist ratio fell below the 0.80 guideline.</div>
              </div>
            </>
          ) : (
            <>
              <div className="hud-label">WhiteBox help</div>
              <p className="mt-3 text-[11px] leading-relaxed text-mid">Use ⌘K to navigate. Every score opens to evidence, drivers and the reasoning trace. Decisions always require a named human.</p>
              <a href="mailto:support@whitebox.local" className="mt-3 inline-block text-[11px] text-irisc">Contact support</a>
            </>
          )}
        </div>
      )}
    </header>
  );
}
