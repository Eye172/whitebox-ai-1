"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { PRIMARY_NAV, VACANCY_SUBNAV, Settings } from "./shell-data";
import { useRole } from "./RoleContext";
import { getVacancy } from "@/lib/fixtures";
import type { SessionUser } from "./HRShell";
import { PanelLeftClose, PanelLeftOpen, ChevronsUpDown, LogOut, User, Palette } from "lucide-react";
import CubeMark from "@/components/ui/CubeMark";

export default function Sidebar({ user }: { user: SessionUser }) {
  const pathname = usePathname();
  const router = useRouter();
  const { role } = useRole();
  const [collapsed, setCollapsed] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const displayName = user.name;
  const initials = displayName.split(/[\s@.]+/).map((s) => s[0]).slice(0, 2).join("").toUpperCase();

  const doSignOut = async () => {
    await fetch("/api/auth/logout", { method: "POST" });
    router.replace("/login");
    router.refresh();
  };

  const vidMatch = pathname.match(/\/vacancies\/([^/]+)\//);
  const vid = vidMatch?.[1];
  const vacancy = vid ? getVacancy(vid) : undefined;

  const width = collapsed ? 64 : 264;

  return (
    <aside
      className="relative z-20 flex shrink-0 flex-col border-r border-hairline bg-void transition-[width] duration-200"
      style={{ width }}
    >
      {/* Zone 1 — Control */}
      <div className="flex h-14 items-center gap-2 px-3">
        <Link href="/" className="flex items-center gap-2 overflow-hidden">
          <CubeMark size={26} />
          {!collapsed && <span className="wordmark truncate text-[12px] text-text-hi">WhiteBox</span>}
        </Link>
        {!collapsed && (
          <button className="ml-auto text-text-lo hover:text-text-hi" title="Switch workspace">
            <ChevronsUpDown className="h-4 w-4" />
          </button>
        )}
        <button
          onClick={() => setCollapsed((c) => !c)}
          className={`text-text-lo hover:text-text-hi ${collapsed ? "mx-auto" : ""}`}
          title={collapsed ? "Expand" : "Collapse"}
        >
          {collapsed ? <PanelLeftOpen className="h-4 w-4" /> : <PanelLeftClose className="h-4 w-4" />}
        </button>
      </div>

      {!collapsed && (
        <div className="mono-label px-4 pb-2 pt-1">Acme Corp · workspace</div>
      )}

      {/* Zone 2 — Primary nav */}
      <nav className="flex-1 overflow-y-auto px-2 py-1 no-scrollbar">
        {PRIMARY_NAV.filter((n) => !n.hideFor?.includes(role)).map((item) => {
          const active = pathname === item.href || pathname.startsWith(item.href + "/") ||
            (item.label === "Candidates" && pathname.includes("/candidates/"));
          const Icon = item.icon;
          return (
            <Link
              key={item.label}
              href={item.href}
              className={`group relative flex items-center gap-3 rounded-[6px] px-3 py-2 text-[14px] transition-colors ${
                active ? "bg-white/[0.04] text-text-hi" : "text-text-mid hover:bg-white/[0.03] hover:text-text-hi"
              }`}
              title={collapsed ? item.label : undefined}
            >
              {active && <span className="iris-bar absolute left-0 top-1/2 h-5 w-[2px] -translate-y-1/2 rounded-full" />}
              <Icon className="h-[18px] w-[18px] shrink-0" />
              {!collapsed && <span className="truncate">{item.label}</span>}
              {!collapsed && item.badge && (
                <span className="mono ml-auto rounded-full bg-white/[0.06] px-1.5 py-0.5 text-[10px] text-text-mid">
                  {item.badge}
                </span>
              )}
            </Link>
          );
        })}

        {/* Zone 3 — Contextual */}
        {vacancy && !collapsed && (
          <div className="mt-4 border-t border-hairline pt-3">
            <div className="mono-label truncate px-3 pb-1">This vacancy</div>
            <div className="truncate px-3 pb-2 text-[12px] text-text-lo">{vacancy.title}</div>
            {VACANCY_SUBNAV(vacancy.id).map((s) => {
              const active = pathname === s.href;
              return (
                <Link
                  key={s.href}
                  href={s.href}
                  className={`relative flex items-center rounded-[6px] py-1.5 pl-6 pr-3 text-[13px] transition-colors ${
                    active ? "text-text-hi" : "text-text-mid hover:text-text-hi"
                  }`}
                >
                  {active && <span className="iris-bar absolute left-2 top-1/2 h-4 w-[2px] -translate-y-1/2 rounded-full" />}
                  {s.label}
                </Link>
              );
            })}
          </div>
        )}
      </nav>

      {/* Bottom — settings + avatar + role */}
      <div className="border-t border-hairline p-2">
        <Link
          href="/hr/settings"
          className={`flex items-center gap-3 rounded-[6px] px-3 py-2 text-[14px] text-text-mid hover:bg-white/[0.03] hover:text-text-hi ${
            pathname.startsWith("/hr/settings") ? "text-text-hi" : ""
          }`}
          title="Settings"
        >
          <Settings className="h-[18px] w-[18px] shrink-0" />
          {!collapsed && <span>Settings</span>}
        </Link>
        <div className="relative">
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className={`mt-1 flex w-full items-center gap-2 rounded-[6px] px-3 py-2 hover:bg-white/[0.03] ${collapsed ? "justify-center" : ""}`}
          >
            <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-hairline bg-surface-2 text-[11px] text-text-hi">
              {initials}
            </span>
            {!collapsed && (
              <div className="min-w-0 flex-1 text-left">
                <div className="truncate text-[12.5px] text-text-hi">{displayName}</div>
                <div className="mono text-[10px] text-text-lo">{role}</div>
              </div>
            )}
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute bottom-full left-2 z-20 mb-1 w-48 overflow-hidden rounded-md border border-hairline-strong bg-surface-2 py-1 shadow-2xl">
                <MenuItem icon={User} label="Profile" onClick={() => setMenuOpen(false)} />
                {/* menu items */}
                <Link href="/hr/settings" onClick={() => setMenuOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-[13px] text-text-mid hover:bg-white/[0.04] hover:text-text-hi">
                  <Palette className="h-4 w-4" /> Appearance
                </Link>
                <div className="my-1 h-px bg-hairline" />
                <MenuItem icon={LogOut} label="Sign out" onClick={doSignOut} />
              </div>
            </>
          )}
        </div>
      </div>
    </aside>
  );
}

function MenuItem({ icon: Icon, label, onClick }: { icon: React.ElementType; label: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-[13px] text-text-mid hover:bg-white/[0.04] hover:text-text-hi">
      <Icon className="h-4 w-4" /> {label}
    </button>
  );
}
