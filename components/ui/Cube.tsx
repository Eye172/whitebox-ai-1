"use client";

/**
 * The WhiteBox brand object — a white, transparent, glowing GLASS cube (CSS 3D, no WebGL).
 * Really white and luminous, viewed from a corner so it always reads as a solid volume,
 * with a second nested cube visible inside (the "layers") and an iridescent refractive
 * halo (ref: iridescent glass keycap, Book II · §2.5). Gently rocks; never goes flat.
 * `pulse` = the calm "listening/thinking" state for the candidate interview.
 */
export default function Cube({
  size = 120,
  pulse = false,
  className = "",
}: {
  size?: number;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <div className={`cube-scene ${className}`} style={{ width: size * 1.9, height: size * 1.9 }} aria-hidden>
      <div className="cube-bloom" style={{ width: size * 2, height: size * 2 }} />
      <div className="cube-iris-halo" style={{ width: size * 1.7, height: size * 1.7 }} />

      {pulse && (
        <>
          <span className="cube-ring animate-pulse-ring" style={{ width: size * 1.25, height: size * 1.25 }} />
          <span className="cube-ring animate-pulse-ring" style={{ width: size * 1.25, height: size * 1.25, animationDelay: "1.4s" }} />
        </>
      )}

      <div className="cube-rock" style={{ width: size, height: size }}>
        <div className="cube" style={{ width: size, height: size }}>
          {/* outer glass shell */}
          <Shell size={size} parent={size} edge={0.85} solid />
          {/* inner nested cube — the visible "layer" */}
          <Shell size={size * 0.5} parent={size} edge={0.7} iris />
          {/* luminous core */}
          <div className="cube-core" style={{ width: size * 0.18, height: size * 0.18, top: size * 0.41, left: size * 0.41 }} />
        </div>
      </div>
    </div>
  );
}

// per-face shading so the volume reads as solid glass (top bright, sides mid, base dark)
const FACE_SHADE = [0.09, 0.05, 0.06, 0.07, 0.17, 0.03]; // front, right, back, left, top, bottom

function Shell({ size, parent, edge, solid, iris }: { size: number; parent: number; edge: number; solid?: boolean; iris?: boolean }) {
  const half = size / 2;
  const offset = (parent - size) / 2;
  const faces = [
    `rotateY(0deg) translateZ(${half}px)`,
    `rotateY(90deg) translateZ(${half}px)`,
    `rotateY(180deg) translateZ(${half}px)`,
    `rotateY(-90deg) translateZ(${half}px)`,
    `rotateX(90deg) translateZ(${half}px)`,
    `rotateX(-90deg) translateZ(${half}px)`,
  ];
  return (
    <div style={{ position: "absolute", top: offset, left: offset, width: size, height: size, transformStyle: "preserve-3d" }}>
      {faces.map((t, i) => {
        const a = FACE_SHADE[i];
        const bg = iris
          ? `linear-gradient(135deg, rgba(110,231,240,${0.10 + a}), rgba(199,123,255,${0.10 + a}), rgba(255,138,216,${0.10 + a}))`
          : `linear-gradient(150deg, rgba(255,255,255,${a + 0.05}), rgba(255,255,255,${a * 0.5}))`;
        return (
          <div
            key={i}
            className="cube-face"
            style={{
              width: size,
              height: size,
              transform: t,
              borderColor: `rgba(255,255,255,${edge})`,
              background: bg,
              boxShadow: solid ? `inset 0 0 ${size * 0.35}px rgba(255,255,255,0.12)` : `inset 0 0 ${size * 0.4}px rgba(200,215,255,0.22)`,
            }}
          />
        );
      })}
    </div>
  );
}
