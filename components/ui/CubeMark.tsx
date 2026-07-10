import React from "react";

/**
 * WhiteBox logo mark — a SOLID WHITE isometric cube (white faces, dark edges),
 * with a faint iris core showing "through" it. Predominantly white, as the brand
 * demands. Fixed gradient ids (hydration-safe, no hooks).
 */
export default function CubeMark({ size = 22, glow = true }: { size?: number; glow?: boolean }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      aria-hidden
      style={glow ? { filter: `drop-shadow(0 0 3px rgba(200,215,255,0.6))` } : undefined}
    >
      {/* solid faces — top brightest, right mid, left slightly darker (3D shading) */}
      <path d="M20 3 L35 11.5 L20 20 L5 11.5 Z" fill="#ffffff" />
      <path d="M35 11.5 L35 28.5 L20 37 L20 20 Z" fill="#d7dbe4" />
      <path d="M5 11.5 L5 28.5 L20 37 L20 20 Z" fill="#eef0f5" />
      {/* iris core seen through the translucent front */}
      <circle cx="20" cy="21" r="4.2" fill="#c77bff" opacity="0.5" />
      <circle cx="20" cy="21" r="2.2" fill="#ffffff" opacity="0.8" />
      {/* dark edges (vice-versa of the old outline) */}
      <g stroke="#0a0a0c" strokeWidth="1.1" strokeLinejoin="round" strokeLinecap="round" opacity="0.55">
        <path d="M20 3 L35 11.5 L20 20 L5 11.5 Z" />
        <path d="M5 11.5 L5 28.5 L20 37 L35 28.5 L35 11.5" />
        <path d="M20 20 L20 37" />
      </g>
    </svg>
  );
}
