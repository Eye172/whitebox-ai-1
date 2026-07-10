"use client";

import React, { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useRole } from "./RoleContext";
import { ROLES } from "./shell-data";
import { getVacancy } from "@/lib/fixtures";
import { Search, Bell, HelpCircle, ChevronDown } from "lucide-react";

function useBreadcrumb() {
  const pathname = usePathname();
  const parts = pathname.split("/").filter(Boolean); // e.g. hr, vacancies, v-teamlead, ranking
  const crumbs: string[] = ["Acme Corp"];
  if (parts.includes("vacancies")) {
    const vid = parts[parts.indexOf("vacancies") + 1];
    const v = vid ? getVacancy(vid) : undefined;
    if (v) crumbs.push(v.title);
    const last = parts[parts.length - 1];
    if (last && last !== vid && last !== "vacancies") crumbs.push(cap(last));
    else if (!v && vid === "new") crumbs.push("New vacancy");
    else if (!vid) crumbs.push("Vacancies");
  } else if (parts[1]) {
    crumbs.push(cap(parts[1]));
  }
  return crumbs;
}
const cap = (s: string) => s.charAt(0).toUpperCase() + s.slice(1).replace(/-/g, " ");

export default function TopBar() {
  const { role, setRole, setPaletteOpen } = useRole();
  const crumbs = useBreadcrumb();
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "/" && document.activeElement?.tagName !== "INPUT" && document.activeElement?.tagName !== "TEXTAREA") {
        e.preventDefault();
        searchRef.current?.focus();
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <header className="sticky top-0 z-30 flex h-[52px] shrink-0 items-center gap-3 border-b border-hairline bg-void/80 px-4 glass-blur">
      {/* breadcrumb */}
      <div className="flex items-center gap-2 text-[13px]">
        {crumbs.map((c, i) => (
          <React.Fragment key={i}>
            {i > 0 && <span className="text-text-lo">›</span>}
            <span className={i === crumbs.length - 1 ? "text-text-hi" : "text-text-mid"}>{c}</span>
          </React.Fragment>
        ))}
      </div>

      {/* search */}
      <div className="relative ml-4 hidden md:block">
        <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-text-lo" />
        <input
          ref={searchRef}
          placeholder="Search candidates, vacancies…"
          className="h-8 w-[300px] rounded-[8px] border border-hairline bg-surface pl-8 pr-3 text-[13px] text-text-hi outline-none placeholder:text-text-lo focus:border-hairline-strong"
        />
        <span className="mono pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 text-[10px] text-text-lo">/</span>
      </div>

      <div className="ml-auto flex items-center gap-2">
        {/* AI processing chip */}
        <div className="hidden items-center gap-2 rounded-full border border-hairline bg-surface px-2.5 py-1 lg:flex">
          <span className="relative flex h-1.5 w-1.5">
            <span className="iris-bar absolute inline-flex h-full w-full animate-ping rounded-full opacity-60" />
            <span className="iris-bar relative inline-flex h-1.5 w-1.5 rounded-full" />
          </span>
          <span className="mono text-[11px] text-text-mid">AI processing 3 interviews</span>
        </div>

        {/* ⌘K */}
        <button
          onClick={() => setPaletteOpen(true)}
          className="mono flex items-center gap-1 rounded-[4px] border border-hairline bg-surface px-2 py-1 text-[11px] text-text-lo hover:text-text-hi"
        >
          ⌘K
        </button>

        {/* role switcher (demo affordance) */}
        <div className="relative">
          <select
            value={role}
            onChange={(e) => setRole(e.target.value as (typeof ROLES)[number])}
            className="mono appearance-none rounded-[4px] border border-hairline bg-surface py-1 pl-2 pr-6 text-[11px] text-text-mid outline-none hover:text-text-hi"
            title="Switch role (demo)"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {r}
              </option>
            ))}
          </select>
          <ChevronDown className="pointer-events-none absolute right-1.5 top-1/2 h-3 w-3 -translate-y-1/2 text-text-lo" />
        </div>

        {/* notifications */}
        <button className="relative text-text-lo hover:text-text-hi" title="Notifications">
          <Bell className="h-4 w-4" />
          <span className="absolute -right-0.5 -top-0.5 h-1.5 w-1.5 rounded-full" style={{ background: "var(--ember)" }} />
        </button>
        <button className="text-text-lo hover:text-text-hi" title="Help">
          <HelpCircle className="h-4 w-4" />
        </button>
      </div>
    </header>
  );
}
