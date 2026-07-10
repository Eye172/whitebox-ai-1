"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { CANDIDATES, VACANCIES } from "@/lib/fixtures";
import { PRIMARY_NAV } from "./shell-data";
import { useRole } from "./RoleContext";
import { Search, CornerDownLeft, Users, Briefcase, Zap } from "lucide-react";

type Item = { id: string; label: string; sub: string; href: string; group: "Candidates" | "Vacancies" | "Actions" };

export default function CommandPalette() {
  const { paletteOpen, setPaletteOpen } = useRole();
  const router = useRouter();
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  const items: Item[] = useMemo(() => {
    const c: Item[] = CANDIDATES.slice(0, 8).map((x) => ({
      id: x.internalId,
      label: x.internalId,
      sub: `Rank ${x.rank} · ${x.tier} · overall ${x.overall}`,
      href: `/hr/vacancies/${x.vacancyId}/candidates/${x.internalId}`,
      group: "Candidates",
    }));
    const v: Item[] = VACANCIES.map((x) => ({
      id: x.id,
      label: x.title,
      sub: `${x.code} · ${x.status}`,
      href: `/hr/vacancies/${x.id}/ranking`,
      group: "Vacancies",
    }));
    const a: Item[] = [
      { id: "new", label: "Create vacancy", sub: "Natural language or manual", href: "/hr/vacancies/new", group: "Actions" },
      { id: "bias", label: "Open bias dashboard", sub: "Fairness metrics & anomalies", href: "/hr/bias", group: "Actions" },
      { id: "audit", label: "Open audit log", sub: "Hash-chained, append-only", href: "/hr/audit", group: "Actions" },
      ...PRIMARY_NAV.map((n) => ({ id: n.href, label: `Go to ${n.label}`, sub: n.href, href: n.href, group: "Actions" as const })),
    ];
    return [...c, ...v, ...a];
  }, []);

  const filtered = useMemo(() => {
    if (!q.trim()) return items;
    const t = q.toLowerCase();
    return items.filter((i) => (i.label + i.sub).toLowerCase().includes(t));
  }, [q, items]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setPaletteOpen(!paletteOpen);
      }
      if (e.key === "Escape") setPaletteOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [paletteOpen, setPaletteOpen]);

  useEffect(() => {
    if (paletteOpen) {
      setQ("");
      setActive(0);
      setTimeout(() => inputRef.current?.focus(), 30);
    }
  }, [paletteOpen]);

  if (!paletteOpen) return null;

  const go = (item: Item) => {
    setPaletteOpen(false);
    router.push(item.href);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center pt-[14vh]" role="dialog" aria-modal>
      <div className="absolute inset-0 bg-black/60 glass-blur" onClick={() => setPaletteOpen(false)} />
      <div className="relative w-[640px] max-w-[92vw] overflow-hidden rounded-md border border-hairline-strong bg-surface-2 shadow-2xl">
        <div className="iris-bar h-px w-full opacity-70" />
        <div className="flex items-center gap-3 border-b border-hairline px-4 py-3">
          <Search className="h-4 w-4 text-text-lo" />
          <input
            ref={inputRef}
            value={q}
            onChange={(e) => {
              setQ(e.target.value);
              setActive(0);
            }}
            onKeyDown={(e) => {
              if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, filtered.length - 1));
              if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
              if (e.key === "Enter" && filtered[active]) go(filtered[active]);
            }}
            placeholder="Type a command or search…"
            className="mono flex-1 bg-transparent text-sm text-text-hi outline-none placeholder:text-text-lo"
          />
          <span className="mono rounded-[4px] border border-hairline px-1.5 py-0.5 text-[10px] text-text-lo">ESC</span>
        </div>
        <div className="max-h-[52vh] overflow-y-auto py-2">
          {(["Candidates", "Vacancies", "Actions"] as const).map((group) => {
            const rows = filtered.filter((i) => i.group === group);
            if (!rows.length) return null;
            const Icon = group === "Candidates" ? Users : group === "Vacancies" ? Briefcase : Zap;
            return (
              <div key={group} className="mb-1">
                <div className="mono-label px-4 py-1.5">{group}</div>
                {rows.map((item) => {
                  const gi = filtered.indexOf(item);
                  const isActive = gi === active;
                  return (
                    <button
                      key={item.id + item.href}
                      onMouseEnter={() => setActive(gi)}
                      onClick={() => go(item)}
                      className={`flex w-full items-center gap-3 px-4 py-2 text-left ${isActive ? "bg-white/[0.05]" : ""}`}
                    >
                      <Icon className={`h-4 w-4 ${isActive ? "text-iris-b" : "text-text-lo"}`} />
                      <div className="min-w-0 flex-1">
                        <div className="truncate text-[13.5px] text-text-hi">{item.label}</div>
                        <div className="mono truncate text-[11px] text-text-lo">{item.sub}</div>
                      </div>
                      {isActive && <CornerDownLeft className="h-3.5 w-3.5 text-text-lo" />}
                    </button>
                  );
                })}
              </div>
            );
          })}
          {!filtered.length && <div className="px-4 py-8 text-center text-sm text-text-lo">No results for &ldquo;{q}&rdquo;</div>}
        </div>
      </div>
    </div>
  );
}
