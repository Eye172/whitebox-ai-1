"use client";

/**
 * The WhiteBox brand object — a real CUBE (equal width/height/depth) whose
 * interior is filled with a stack of white layer-panels: "you can see the
 * layers the AI reasoned in, inside a transparent white box."
 * The outer 6-face frame makes the cube read as a cube; the inner panels are
 * the layers. Slowly turns so all three dimensions are visible.
 * `pulse` = the calm listening/thinking state for the candidate interview.
 */
export default function Cube({
  size = 120,
  pulse = false,
  layers = 6,
  className = "",
}: {
  size?: number;
  pulse?: boolean;
  layers?: number;
  className?: string;
}) {
  const half = size / 2;

  // outer cube frame — 6 faces of an equal-sided cube
  const faces = [
    `translateZ(${half}px)`,
    `rotateY(180deg) translateZ(${half}px)`,
    `rotateY(90deg) translateZ(${half}px)`,
    `rotateY(-90deg) translateZ(${half}px)`,
    `rotateX(90deg) translateZ(${half}px)`,
    `rotateX(-90deg) translateZ(${half}px)`,
  ];

  // inner layer-panels, stacked through the cube's depth, inset from the walls
  const innerSide = size * 0.62;
  const innerOffset = (size - innerSide) / 2;
  const innerDepth = size * 0.74;
  const mid = (layers - 1) / 2;
  const gap = innerDepth / (layers - 1);

  return (
    <div className={`cube-scene ${className}`} style={{ width: size * 1.9, height: size * 1.9 }} aria-hidden>
      <div className="cube-bloom" style={{ width: size * 2, height: size * 2 }} />
      <div className="cube-iris-halo" style={{ width: size * 1.7, height: size * 1.7 }} />

      {pulse && (
        <>
          <span className="cube-ring animate-pulse-ring" style={{ width: size * 1.3, height: size * 1.3 }} />
          <span className="cube-ring animate-pulse-ring" style={{ width: size * 1.3, height: size * 1.3, animationDelay: "1.4s" }} />
        </>
      )}

      <div className="cube-stack" style={{ width: size, height: size }}>
        {/* outer cube frame (equal sides) */}
        {faces.map((t, i) => (
          <div key={`f${i}`} className="cube-face" style={{ transform: t }} />
        ))}

        {/* inner white layers, inside the cube */}
        {Array.from({ length: layers }).map((_, i) => {
          const z = (i - mid) * gap;
          const t = i / (layers - 1); // 0 back → 1 front
          const fill = 0.05 + t * 0.07;
          const edge = 0.55 + t * 0.4;
          return (
            <div
              key={`p${i}`}
              className="cube-plate"
              style={{
                width: innerSide,
                height: innerSide,
                left: innerOffset,
                top: innerOffset,
                transform: `translateZ(${z}px)`,
                background: `linear-gradient(145deg, rgba(255,255,255,${fill + 0.03}), rgba(255,255,255,${fill * 0.5}))`,
                borderColor: `rgba(255,255,255,${edge})`,
                boxShadow: `0 0 ${size * 0.05}px rgba(200,215,255,${0.1 + t * 0.14})`,
              }}
            />
          );
        })}

        {/* luminous iridescent core at the cube's center */}
        <div className="cube-core" style={{ width: size * 0.28, height: size * 0.28, top: size * 0.36, left: size * 0.36 }} />
      </div>
    </div>
  );
}
