"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Users, Briefcase, Zap, CornerDownLeft } from "lucide-react";
import { candidates, vacancies } from "@/lib/fixtures";

const Ctx = createContext<{ open: () => void }>({ open: () => {} });
export const useCommandK = () => useContext(Ctx);

type Item = { icon: "user" | "vacancy" | "action"; label: string; hint?: string; href: string };
type Tab = "Candidates" | "Vacancies" | "Actions";

const actions: Item[] = [
  { icon: "action", label: "Create vacancy", hint: "C V", href: "/vacancies/new" },
  { icon: "action", label: "Open bias dashboard", href: "/bias" },
  { icon: "action", label: "Open audit log", href: "/audit" },
  { icon: "action", label: "Review queue", href: "/dashboard" },
];

export default function CommandKProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [tab, setTab] = useState<Tab>("Candidates");
  const [q, setQ] = useState("");
  const [active, setActive] = useState(0);
  const router = useRouter();

  const open = useCallback(() => { setIsOpen(true); setQ(""); setActive(0); }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") {
        e.preventDefault();
        setIsOpen((v) => !v);
        setQ("");
        setActive(0);
      }
      if (e.key === "Escape") setIsOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  const items = useMemo<Item[]>(() => {
    const pool: Item[] =
      tab === "Candidates"
        ? candidates.map((c) => ({ icon: "user" as const, label: c.internalId, hint: `rank ${c.rank} · ${c.overall}`, href: `/vacancies/vac-001/candidates/${c.internalId}` }))
        : tab === "Vacancies"
          ? vacancies.map((v) => ({ icon: "vacancy" as const, label: v.title, hint: v.code, href: `/vacancies/${v.id}/ranking` }))
          : actions;
    const needle = q.trim().toLowerCase();
    return needle ? pool.filter((i) => i.label.toLowerCase().includes(needle) || i.hint?.toLowerCase().includes(needle)) : pool;
  }, [tab, q]);

  const go = (item: Item) => { setIsOpen(false); router.push(item.href); };

  return (
    <Ctx.Provider value={{ open }}>
      {children}
      {isOpen && (
        <div className="fixed inset-0 z-50 bg-black/60" onClick={() => setIsOpen(false)}>
          <div
            className="mx-auto mt-[14vh] w-[640px] overflow-hidden rounded-xl border border-hairline-strong bg-surface2 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="h-px w-full iris-line opacity-70" />
            <input
              autoFocus
              value={q}
              onChange={(e) => { setQ(e.target.value); setActive(0); }}
              onKeyDown={(e) => {
                if (e.key === "ArrowDown") setActive((a) => Math.min(a + 1, items.length - 1));
                if (e.key === "ArrowUp") setActive((a) => Math.max(a - 1, 0));
                if (e.key === "Enter" && items[active]) go(items[active]);
                if (e.key === "Tab") {
                  e.preventDefault();
                  const order: Tab[] = ["Candidates", "Vacancies", "Actions"];
                  setTab(order[(order.indexOf(tab) + 1) % 3]);
                  setActive(0);
                }
              }}
              className="w-full border-b border-hairline bg-transparent px-5 py-4 font-mono text-[14px] text-hi placeholder:text-lo focus:outline-none"
              placeholder="Type a command or search…"
            />
            <div className="flex gap-1 border-b border-hairline px-3 py-2">
              {(["Candidates", "Vacancies", "Actions"] as Tab[]).map((t) => (
                <button
                  key={t}
                  onClick={() => { setTab(t); setActive(0); }}
                  className={`rounded px-2.5 py-1 text-[12px] ${t === tab ? "bg-white/5 text-hi" : "text-lo hover:text-mid"}`}
                >
                  {t}
                </button>
              ))}
              <span className="ml-auto self-center font-mono text-[10px] text-lo">TAB SWITCHES · ↑↓ · ↵</span>
            </div>
            <div className="max-h-[320px] overflow-y-auto py-1.5">
              {items.length === 0 && <div className="px-5 py-6 text-center text-[13px] text-lo">Nothing matches “{q}”.</div>}
              {items.map((item, i) => (
                <button
                  key={item.label}
                  onClick={() => go(item)}
                  onMouseEnter={() => setActive(i)}
                  className={`flex w-full items-center gap-3 px-5 py-2.5 text-left text-[13px] ${i === active ? "bg-white/5 text-hi" : "text-mid"}`}
                >
                  {item.icon === "user" ? <Users className="size-4 text-lo" /> : item.icon === "vacancy" ? <Briefcase className="size-4 text-lo" /> : <Zap className="size-4 text-lo" />}
                  <span className={item.icon === "user" ? "font-mono" : ""}>{item.label}</span>
                  {item.hint && <span className="ml-auto font-mono text-[11px] text-lo">{item.hint}</span>}
                  {i === active && <CornerDownLeft className="size-3.5 text-lo" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </Ctx.Provider>
  );
}
