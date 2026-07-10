import React from "react";

/**
 * The inverted "white box" panel (Book I · Part IV — signature).
 * Flips to --wb-paper with --wb-ink content, subtle grain, and a thin
 * wireframe motif visible "inside" it. Transparency rendered as layout:
 * a light panel you can see into. Used for explainability / trust moments.
 */
export function WhiteBoxPanel({
  children,
  className = "",
  label,
}: {
  children: React.ReactNode;
  className?: string;
  label?: string;
}) {
  return (
    <div className={`wb tex-grain rounded-md ${className}`}>
      {/* wireframe overlay — transparent overlapping planes seen "inside" */}
      <svg className="wb-wire" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden>
        <g stroke="rgba(10,10,12,0.10)" strokeWidth="1" fill="none">
          <path d="M60 40 L300 40 L340 90 L100 90 Z" />
          <path d="M60 40 L60 220 L100 270 L100 90" />
          <path d="M300 40 L300 220 L340 270 L340 90" />
          <path d="M60 220 L300 220 L340 270 L100 270 Z" />
          <line x1="100" y1="90" x2="100" y2="270" />
          <line x1="340" y1="90" x2="340" y2="270" />
        </g>
      </svg>
      <div className="relative">
        {label && (
          <div className="mono px-6 pt-5 text-[11px] uppercase tracking-[0.08em]" style={{ color: "rgba(23,23,26,0.5)" }}>
            {label}
          </div>
        )}
        {children}
      </div>
    </div>
  );
}
