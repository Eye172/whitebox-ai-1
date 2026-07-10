import React from "react";

/**
 * WhiteBox logo mark — a small luminous white isometric cube outline.
 * White edges + faint face highlight + iris refractive accent + glow.
 * All instances are identical, so they share fixed gradient ids (hydration-safe,
 * no hooks) — renders correctly in both server and client components.
 */
export default function CubeMark({ size = 22, glow = true }: { size?: number; glow?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
      style={glow ? { filter: `drop-shadow(0 0 3px rgba(180,200,255,0.55))` } : undefined}
    >
      <defs>
        <linearGradient id="wb-cm-top" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffffff" stopOpacity="0.9" />
          <stop offset="1" stopColor="#ffffff" stopOpacity="0.35" />
        </linearGradient>
        <linearGradient id="wb-cm-edge" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#8fb0ff" />
          <stop offset="0.5" stopColor="#c77bff" />
          <stop offset="1" stopColor="#ff8ad8" />
        </linearGradient>
      </defs>
      {/* isometric cube: top rhombus + two side faces */}
      <path d="M20 4 L34 12 L20 20 L6 12 Z" fill="url(#wb-cm-top)" fillOpacity="0.5" />
      <path d="M6 12 L20 20 L20 36 L6 28 Z" fill="#ffffff" fillOpacity="0.08" />
      <path d="M34 12 L20 20 L20 36 L34 28 Z" fill="#ffffff" fillOpacity="0.14" />
      {/* edges (bright white) */}
      <g stroke="#ffffff" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" opacity="0.92">
        <path d="M20 4 L34 12 L20 20 L6 12 Z" />
        <path d="M6 12 L6 28 L20 36 L34 28 L34 12" />
        <path d="M20 20 L20 36" />
      </g>
      {/* iris refractive edge accent */}
      <path d="M20 4 L34 12 L34 28" stroke="url(#wb-cm-edge)" strokeWidth="1.4" strokeLinejoin="round" strokeLinecap="round" opacity="0.75" fill="none" />
    </svg>
  );
}
