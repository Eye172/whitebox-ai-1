import React from "react";

/* ---------- Score gauge (arc + tabular number) ---------- */
export function Gauge({ score, threshold = 70, size = 132 }: { score: number; threshold?: number; size?: number }) {
  const stroke = 8;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const sweep = 0.75; // 270deg arc
  const arcLen = c * sweep;
  const filled = arcLen * (score / 100);
  const pass = score >= threshold;
  const color = pass ? "var(--pos)" : score >= threshold - 12 ? "var(--warn)" : "var(--neg)";
  const rot = 135; // start angle
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-0">
        <g transform={`rotate(${rot} ${size / 2} ${size / 2})`}>
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.07)"
            strokeWidth={stroke}
            strokeDasharray={`${arcLen} ${c}`}
            strokeLinecap="round"
          />
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke={color}
            strokeWidth={stroke}
            strokeDasharray={`${filled} ${c}`}
            strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.8s cubic-bezier(0.22,1,0.36,1)" }}
          />
          {/* threshold tick */}
          <circle
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            stroke="rgba(255,255,255,0.5)"
            strokeWidth={stroke + 2}
            strokeDasharray={`1.5 ${c}`}
            strokeDashoffset={-arcLen * (threshold / 100)}
          />
        </g>
      </svg>
      <div className="absolute flex flex-col items-center">
        <span className="metric text-[34px] leading-none" style={{ color: "var(--text-hi)" }}>
          {score}
        </span>
        <span className="mono-label mt-1">/ 100</span>
      </div>
    </div>
  );
}

/* ---------- Radar / spider chart ---------- */
export function Radar({
  data,
  size = 260,
  series,
}: {
  data?: { axis: string; value: number }[];
  size?: number;
  series?: { name: string; color: string; values: { axis: string; value: number }[] }[];
}) {
  const sets = series ?? (data ? [{ name: "score", color: "var(--iris-b)", values: data }] : []);
  if (!sets.length) return null;
  const axes = sets[0].values.map((v) => v.axis);
  const n = axes.length;
  const cx = size / 2;
  const cy = size / 2;
  const radius = size / 2 - 46;
  const angleFor = (i: number) => (Math.PI * 2 * i) / n - Math.PI / 2;
  const point = (i: number, val: number) => {
    const a = angleFor(i);
    const rr = (val / 100) * radius;
    return [cx + rr * Math.cos(a), cy + rr * Math.sin(a)];
  };
  const rings = [25, 50, 75, 100];
  return (
    <svg width={size} height={size} className="overflow-visible">
      {/* rings */}
      {rings.map((ring) => (
        <polygon
          key={ring}
          points={axes.map((_, i) => point(i, ring).join(",")).join(" ")}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth={1}
        />
      ))}
      {/* spokes + labels */}
      {axes.map((ax, i) => {
        const [x, y] = point(i, 100);
        const [lx, ly] = point(i, 118);
        return (
          <g key={ax}>
            <line x1={cx} y1={cy} x2={x} y2={y} stroke="rgba(255,255,255,0.05)" />
            <text
              x={lx}
              y={ly}
              fontSize={9}
              fontFamily="var(--font-mono)"
              fill="var(--text-lo)"
              textAnchor={Math.abs(lx - cx) < 12 ? "middle" : lx > cx ? "start" : "end"}
              dominantBaseline="middle"
            >
              {ax.length > 14 ? ax.slice(0, 12) + "…" : ax}
            </text>
          </g>
        );
      })}
      {/* series */}
      {sets.map((s) => (
        <g key={s.name}>
          <polygon
            points={s.values.map((v, i) => point(i, v.value).join(",")).join(" ")}
            fill={s.color}
            fillOpacity={0.12}
            stroke={s.color}
            strokeWidth={1.5}
          />
          {s.values.map((v, i) => {
            const [x, y] = point(i, v.value);
            return <circle key={i} cx={x} cy={y} r={2.5} fill={s.color} />;
          })}
        </g>
      ))}
    </svg>
  );
}

/* ---------- Horizontal bar chart ---------- */
export function BarRow({ label, value, max = 100, color = "var(--iris-b)", suffix }: { label: string; value: number; max?: number; color?: string; suffix?: string }) {
  return (
    <div className="flex items-center gap-3 py-1.5">
      <div className="w-40 shrink-0 truncate text-[13px] text-text-mid">{label}</div>
      <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-white/5">
        <div className="absolute inset-y-0 left-0 rounded-full" style={{ width: `${(value / max) * 100}%`, background: color }} />
      </div>
      <div className="tnum mono w-12 text-right text-[12px] text-text-hi">
        {suffix ? `${value}${suffix}` : value}
      </div>
    </div>
  );
}
