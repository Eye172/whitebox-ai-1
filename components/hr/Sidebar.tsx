"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Briefcase, Users, BarChart3, Scale, GitCompareArrows,
  ScrollText, Settings, ChevronsUpDown, PanelLeftClose,
} from "lucide-react";

const nav = [
  { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { href: "/vacancies", label: "Vacancies", icon: Briefcase },
  { href: "/vacancies/vac-001/ranking", label: "Candidates", icon: Users, badge: 12 },
  { href: "/analytics", label: "Analytics", icon: BarChart3 },
  { href: "/bias", label: "Bias", icon: Scale, badge: 1, badgeTone: "neg" },
  { href: "/calibration", label: "Calibration", icon: GitCompareArrows },
  { href: "/audit", label: "Audit", icon: ScrollText },
];

const vacancySub = [
  { href: "/vacancies/vac-001/ranking", label: "Ranking" },
  { href: "/vacancies/vac-001/candidates/CND-4A19", label: "Detail" },
  { href: "/vacancies/vac-001/compare", label: "Compare" },
  { href: "/vacancies/vac-001/analytics", label: "Analytics" },
  { href: "/vacancies/vac-001/config", label: "Config" },
  { href: "/vacancies/vac-001/invitations", label: "Invitations" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const inVacancy = pathname.startsWith("/vacancies/vac-");

  return (
    <aside className="fixed inset-y-0 left-0 z-30 flex w-[264px] flex-col border-r border-hairline bg-void">
      {/* Zone 1 — control */}
      <div className="flex h-14 items-center justify-between border-b border-hairline px-4">
        <button className="flex items-center gap-2.5 text-left">
          <span className="flex size-6 items-center justify-center border border-hairline-strong">
            <span className="size-2.5 border border-line-strong bg-white/90" />
          </span>
          <span>
            <span className="block font-display text-[13px] font-medium tracking-[0.14em] text-hi">WHITEBOX</span>
            <span className="block font-mono text-[10px] tracking-[0.08em] text-lo">ACME ORG · HR</span>
          </span>
          <ChevronsUpDown className="size-3.5 text-lo" />
        </button>
        <PanelLeftClose className="size-4 text-lo" />
      </div>

      {/* Zone 2 — primary nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        {nav.map((item) => {
          const active = pathname === item.href || (item.label === "Candidates" && pathname.includes("/candidates/"));
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group relative flex h-10 items-center gap-3 px-4 text-[14px] transition-colors duration-150 ${
                active ? "bg-surface text-hi" : "text-mid hover:bg-white/[0.03] hover:text-hi"
              }`}
            >
              {active && <span className="absolute inset-y-1.5 left-0 w-[2px] iris-line" />}
              <Icon className="size-[18px]" strokeWidth={1.5} />
              {item.label}
              {item.badge != null && (
                <span
                  className={`ml-auto rounded-full px-1.5 py-px font-mono text-[10px] ${
                    item.badgeTone === "neg" ? "bg-neg/10 text-neg" : "bg-white/5 text-mid"
                  }`}
                >
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Zone 3 — contextual (inside a vacancy) */}
        {inVacancy && (
          <div className="mt-5 border-t border-hairline pt-4">
            <div className="hud-label px-4">This vacancy</div>
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
      <div className="flex items-center gap-3 border-t border-hairline px-4 py-3">
        <Settings className="size-[18px] text-lo" strokeWidth={1.5} />
        <span className="flex size-8 items-center justify-center rounded-full border border-hairline bg-surface font-mono text-[11px] text-mid">
          AR
        </span>
        <div className="min-w-0">
          <div className="truncate text-[13px] text-hi">a.rakhimova</div>
          <div className="font-mono text-[10px] tracking-[0.08em] text-lo">HR · RECRUITER</div>
        </div>
      </div>
    </aside>
  );
}
