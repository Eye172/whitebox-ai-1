"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import {
  LayoutDashboard, Briefcase, Users, BarChart3, Scale, GitCompareArrows,
  ScrollText, Settings, ChevronsUpDown,
} from "lucide-react";
import { Cube } from "@/components/ui/primitives";

const primaryNav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vacancies", label: "Vacancies", icon: Briefcase },
  { href: "/vacancies/vac-001/ranking", label: "Candidates", icon: Users, badge: 12 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
];

const reviewNav = [
  { href: "/bias", label: "Fairness", icon: Scale, badge: 1, badgeTone: "neg" },
  { href: "/calibration", label: "Review quality", icon: GitCompareArrows },
  { href: "/audit", label: "Activity log", icon: ScrollText },
];

const vacancySub = [
  { href: "/vacancies/vac-001/ranking", label: "Candidates" },
  { href: "/vacancies/vac-001/compare", label: "Compare" },
  { href: "/vacancies/vac-001/analytics", label: "Insights" },
  { href: "/vacancies/vac-001/config", label: "Setup" },
  { href: "/vacancies/vac-001/invitations", label: "Messages" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const inVacancy = pathname.startsWith("/vacancies/vac-");
  const [orgOpen, setOrgOpen] = useState(false);

  return (
    <aside className="grain fixed inset-y-0 left-0 z-30 flex w-[232px] flex-col border-r border-hairline bg-void">
      {/* Zone 1 — control */}
      <div className="flex h-14 items-center justify-between border-b border-hairline px-4">
        <button onClick={() => setOrgOpen((v) => !v)} aria-expanded={orgOpen} className="flex items-center gap-2.5 text-left">
          <span className="grid size-8 place-items-center">
            <Cube size={28} />
          </span>
          <span>
            <span className="block text-[13px] font-medium text-hi">WhiteBox</span>
            <span className="block text-[10px] text-lo">Acme Org</span>
          </span>
          <ChevronsUpDown className="size-3.5 text-lo" />
        </button>
        {orgOpen && (
          <div className="absolute left-3 top-14 z-40 w-[206px] rounded-lg border border-hairline-strong bg-surface2 p-2 shadow-2xl">
            <div className="rounded-md bg-white/5 px-3 py-2 text-[12px] text-hi">✓ Acme Org</div>
            <Link href="/settings" onClick={() => setOrgOpen(false)} className="mt-1 block rounded-md px-3 py-2 text-[12px] text-mid hover:bg-white/5 hover:text-hi">
              Organization settings
            </Link>
          </div>
        )}
      </div>

      {/* Zone 2 — primary nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {primaryNav.map((item) => {
          const active = pathname === item.href || (item.label === "Candidates" && pathname.includes("/candidates/"));
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group relative flex h-10 items-center gap-3 px-4 text-[14px] transition-colors duration-150 ${
                active ? "bg-irisa/10 text-hi" : "text-mid hover:bg-white/[0.03] hover:text-hi"
              }`}
            >
              {active && <span className="absolute inset-y-1.5 left-0 w-[2px] iris-line" />}
              <Icon className="size-[18px]" strokeWidth={1.5} />
              {item.label}
              {item.badge != null && (
                <span
                  className="ml-auto rounded-full bg-white/5 px-1.5 py-px font-mono text-[10px] text-mid"
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}
        <div className="mx-4 my-3 border-t border-hairline" />
        <div className="mb-1 px-4 text-[10px] text-lo">Review</div>
        {reviewNav.map((item) => {
          const active = pathname === item.href;
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group relative flex h-9 items-center gap-3 px-4 text-[13px] transition-colors ${
                active ? "bg-irisa/10 text-hi" : "text-mid hover:bg-white/[0.03] hover:text-hi"
              }`}
            >
              {active && <span className="absolute inset-y-1.5 left-0 w-[2px] iris-line" />}
              <Icon className="size-4" strokeWidth={1.5} />
              {item.label}
              {item.badge != null && (
                <span className="ml-auto rounded-full bg-neg/10 px-1.5 py-px font-mono text-[10px] text-neg">{item.badge}</span>
              )}
            </Link>
          );
        })}

        {/* Zone 3 — contextual (inside a vacancy) */}
        {inVacancy && (
          <div className="mt-5 border-t border-hairline pt-4">
            <div className="px-4 text-[10px] text-lo">This vacancy</div>
            <div className="mt-1.5">
              {vacancySub.map((s) => {
                const active = pathname === s.href || (s.label === "Detail" && pathname.includes("/candidates/"));
                return (
                  <Link
                    key={s.label}
                    href={s.href}
                    className={`relative flex h-8 items-center pl-6 pr-4 text-[13px] transition-colors ${
                      active ? "text-hi" : "text-lo hover:text-mid"
                    }`}
                  >
                    {active && <span className="absolute inset-y-1 left-0 w-[2px] iris-line" />}
                    {s.label}
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </nav>

      {/* Bottom — pinned */}
      <Link href="/settings" className="flex items-center gap-3 border-t border-hairline px-4 py-3 hover:bg-white/[0.03]">
        <Settings className="size-[18px] text-lo" strokeWidth={1.5} />
        <span className="flex size-8 items-center justify-center rounded-full border border-hairline bg-surface font-mono text-[11px] text-mid">
          AR
        </span>
        <div className="min-w-0"><div className="truncate text-[13px] text-hi">Aizhan Rakhimova</div><div className="text-[10px] text-lo">Settings</div></div>
      </Link>
    </aside>
  );
}
