import React from "react";
import type { ConfidenceBand, Tier, DocStatus, VacancyStatus } from "@/lib/types";
import { ShieldCheck, ShieldAlert, ShieldQuestion } from "lucide-react";

/* ---------- Section label (mono uppercase) ---------- */
export function MonoLabel({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  return <div className={`mono-label ${className}`}>{children}</div>;
}

/* ---------- Status pill (pastel tint + leading dot + mono) ---------- */
const PILL: Record<string, { fg: string; bg: string; dot: string }> = {
  DRAFT: { fg: "#c8c8ce", bg: "rgba(200,200,206,0.10)", dot: "#9a9a9e" },
  LIVE: { fg: "#7fe3b0", bg: "rgba(70,208,138,0.12)", dot: "#46d08a" },
  CLOSED: { fg: "#a6a6ab", bg: "rgba(120,120,128,0.10)", dot: "#6a6a70" },
  VERIFIED: { fg: "#7fe3b0", bg: "rgba(70,208,138,0.12)", dot: "#46d08a" },
  PENDING: { fg: "#f0cf87", bg: "rgba(232,169,59,0.12)", dot: "#e8a93b" },
  NOT_VERIFIED: { fg: "#f0a0a2", bg: "rgba(229,72,77,0.10)", dot: "#e5484d" },
  FLAGGED: { fg: "#f0a0a2", bg: "rgba(229,72,77,0.12)", dot: "#e5484d" },
  CONNECTED: { fg: "#7fe3b0", bg: "rgba(70,208,138,0.12)", dot: "#46d08a" },
  ERROR: { fg: "#f0a0a2", bg: "rgba(229,72,77,0.12)", dot: "#e5484d" },
  NONE: { fg: "#6a6a70", bg: "rgba(120,120,128,0.08)", dot: "#55555a" },
};

export function StatusPill({ status, label }: { status: string; label?: string }) {
  const s = PILL[status] ?? PILL.DRAFT;
  const text = label ?? status.replace("_", " ");
  return (
    <span
      className="mono inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] uppercase tracking-wide"
      style={{ color: s.fg, background: s.bg }}
    >
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.dot }} />
      {text}
    </span>
  );
}

export function DocPill({ status }: { status: DocStatus }) {
  if (status === "NONE") return <span className="mono text-[11px] text-text-lo">—</span>;
  return <StatusPill status={status} />;
}

/* ---------- Tier badge ---------- */
export function TierBadge({ tier }: { tier: Tier }) {
  const map = {
    Top: { fg: "#7fe3b0", bd: "rgba(70,208,138,0.4)" },
    Mid: { fg: "#c8c8ce", bd: "rgba(255,255,255,0.16)" },
    Bottom: { fg: "#9a9a9e", bd: "rgba(255,255,255,0.10)" },
  }[tier];
  return (
    <span
      className="mono rounded-[4px] border px-1.5 py-0.5 text-[10px] uppercase tracking-wider"
      style={{ color: map.fg, borderColor: map.bd }}
    >
      {tier}
    </span>
  );
}

/* ---------- Confidence badge (color + icon + WORD, never bare number) ---------- */
export function ConfidenceBadge({ band, size = "sm" }: { band: ConfidenceBand; size?: "sm" | "md" }) {
  const map = {
    High: { fg: "var(--pos)", Icon: ShieldCheck, bg: "rgba(70,208,138,0.10)" },
    Med: { fg: "var(--warn)", Icon: ShieldQuestion, bg: "rgba(232,169,59,0.10)" },
    Low: { fg: "var(--neg)", Icon: ShieldAlert, bg: "rgba(229,72,77,0.10)" },
  }[band];
  const { Icon } = map;
  const label = band === "Med" ? "Medium" : band;
  return (
    <span
      className={`mono inline-flex items-center gap-1.5 rounded-full ${size === "md" ? "px-2.5 py-1 text-[12px]" : "px-2 py-0.5 text-[11px]"} uppercase tracking-wide`}
      style={{ color: map.fg, background: map.bg }}
    >
      <Icon className={size === "md" ? "h-3.5 w-3.5" : "h-3 w-3"} />
      {label}
    </span>
  );
}

/* ---------- Corner-bracket card ---------- */
export function CornerCard({
  children,
  className = "",
  as: Tag = "div",
  ...rest
}: {
  children: React.ReactNode;
  className?: string;
  as?: React.ElementType;
  [key: string]: unknown;
}) {
  return (
    <Tag
      className={`hud-card rounded-md border border-hairline bg-surface transition-all duration-300 ${className}`}
      {...rest}
    >
      {children}
    </Tag>
  );
}

/* ---------- KPI tile ---------- */
export function KpiTile({
  label,
  value,
  unit,
  trend,
  negative,
  spark,
}: {
  label: string;
  value: string | number;
  unit?: string;
  trend?: number;
  negative?: boolean;
  spark?: number[];
}) {
  return (
    <div className="rounded-md border border-hairline bg-surface p-4">
      <div className="mono-label mb-2 truncate">{label}</div>
      <div className="flex items-end justify-between gap-2">
        <div className="flex items-baseline gap-1">
          <span
            className="metric text-[28px] leading-none"
            style={{ color: negative ? "var(--neg)" : "var(--text-hi)" }}
          >
            {value}
          </span>
          {unit && <span className="mono text-xs text-text-lo">{unit}</span>}
        </div>
        {typeof trend === "number" && (
          <span
            className="mono text-[11px]"
            style={{ color: trend >= 0 ? "var(--pos)" : "var(--neg)" }}
          >
            {trend >= 0 ? "▲" : "▼"} {Math.abs(trend)}%
          </span>
        )}
      </div>
      {spark && <Sparkline data={spark} className="mt-3 h-6 w-full" />}
    </div>
  );
}

/* ---------- Sparkline ---------- */
export function Sparkline({ data, className = "", color = "var(--iris-b)" }: { data: number[]; className?: string; color?: string }) {
  if (!data.length) return null;
  const w = 100;
  const h = 24;
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const pts = data
    .map((d, i) => `${(i / (data.length - 1)) * w},${h - ((d - min) / range) * h}`)
    .join(" ");
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={className}>
      <polyline points={pts} fill="none" stroke={color} strokeWidth="1.5" vectorEffect="non-scaling-stroke" />
    </svg>
  );
}

/* ---------- Score cell (micro-bar + tabular number, threshold-colored) ---------- */
export function ScoreCell({ score, threshold = 70, width = 84 }: { score: number; threshold?: number; width?: number }) {
  const pass = score >= threshold;
  const color = pass ? "var(--pos)" : "var(--text-mid)";
  return (
    <div className="flex items-center gap-2">
      <div className="relative h-1.5 overflow-hidden rounded-full bg-white/5" style={{ width }}>
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${score}%`, background: color, opacity: pass ? 1 : 0.7 }} />
        <div className="absolute inset-y-0 w-px bg-white/25" style={{ left: `${threshold}%` }} />
      </div>
      <span className="tnum mono w-7 text-right text-[13px]" style={{ color: pass ? "var(--text-hi)" : "var(--text-mid)" }}>
        {score}
      </span>
    </div>
  );
}

/* ---------- Skeleton primitives ---------- */
export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`skeleton ${className}`} />;
}

/* ---------- Button ---------- */
export function Button({
  children,
  variant = "primary",
  size = "md",
  className = "",
  ...rest
}: {
  children: React.ReactNode;
  variant?: "primary" | "secondary" | "ghost" | "destructive";
  size?: "sm" | "md" | "lg";
} & React.ButtonHTMLAttributes<HTMLButtonElement>) {
  const sizes = { sm: "h-8 px-3 text-[13px]", md: "h-9 px-4 text-sm", lg: "h-11 px-5 text-sm" };
  const base =
    "inline-flex items-center justify-center gap-2 rounded-[4px] font-medium transition-all duration-150 disabled:opacity-40 disabled:pointer-events-none whitespace-nowrap";
  const variants = {
    primary:
      "bg-surface-2 border border-hairline-strong text-text-hi hover:iris-border hover:text-white",
    secondary: "border border-hairline text-text-mid hover:text-text-hi hover:border-hairline-strong",
    ghost: "text-text-mid hover:text-text-hi hover:bg-white/5",
    destructive: "text-neg border border-transparent hover:bg-[rgba(229,72,77,0.08)]",
  };
  return (
    <button className={`${base} ${sizes[size]} ${variants[variant]} ${className}`} {...rest}>
      {children}
    </button>
  );
}

/* ---------- Vacancy status alias ---------- */
export function VacancyStatusPill({ status }: { status: VacancyStatus }) {
  return <StatusPill status={status} />;
}
