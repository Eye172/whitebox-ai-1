import React from "react";

/**
 * Topographic contour / HUD-node background — the "map of a decision" (Book II · §2.2).
 * Uses the real dense reference maps from /materials, desaturated + radially faded so
 * they read as a rich texture layer, never sterile. `variant`: "hud" (dots/crosses) or
 * "contour" (dense lines) or "ink" (hand-flow, human-touch).
 */
export default function ContourBg({
  opacity = 0.06,
  variant = "hud",
  fade = "top",
  className = "",
}: {
  opacity?: number;
  variant?: "hud" | "contour" | "ink";
  fade?: "top" | "center" | "none";
  className?: string;
}) {
  const src =
    variant === "contour" ? "/textures/contour-a.jpg" : variant === "ink" ? "/textures/ink-flow.jpg" : "/textures/contour-hud.jpg";
  const mask =
    fade === "center"
      ? "radial-gradient(70% 60% at 50% 45%, #000 0%, transparent 78%)"
      : fade === "top"
      ? "linear-gradient(180deg, #000 0%, rgba(0,0,0,0.35) 55%, transparent 100%)"
      : "none";
  return (
    <div className={`pointer-events-none absolute inset-0 overflow-hidden ${className}`} aria-hidden>
      <div
        className="absolute inset-0 bg-cover bg-center"
        style={{
          backgroundImage: `url(${src})`,
          opacity,
          filter: "grayscale(1) contrast(1.15) brightness(1.1)",
          mixBlendMode: "screen",
          WebkitMaskImage: mask === "none" ? undefined : mask,
          maskImage: mask === "none" ? undefined : mask,
        }}
      />
    </div>
  );
}
