"use client";

/**
 * The WhiteBox brand object — a 3D volume built from a STACK of white plates
 * (ref: DAILYMINIMAL No.639 fanned plates + exploded-cube layers, Book II §2.5).
 * Layers of white receding in depth = "you can see the layers the AI reasoned in."
 * Viewed at an angle and slowly turning so the depth between layers is obvious.
 * `pulse` = the calm listening/thinking state for the candidate interview.
 */
export default function Cube({
  size = 120,
  pulse = false,
  layers = 8,
  className = "",
}: {
  size?: number;
  pulse?: boolean;
  layers?: number;
  className?: string;
}) {
  const gap = size * 0.19;
  const mid = (layers - 1) / 2;

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
        {Array.from({ length: layers }).map((_, i) => {
          const z = (i - mid) * gap;
          const t = i / (layers - 1); // 0 back → 1 front
          // near-transparent fills + bright crisp white EDGES → you clearly see
          // every stacked layer receding in depth (never one solid square)
          const fill = 0.04 + t * 0.07;
          const edge = 0.5 + t * 0.5;
          return (
            <div
              key={i}
              className="cube-plate"
              style={{
                transform: `translateZ(${z}px)`,
                background: `linear-gradient(145deg, rgba(255,255,255,${fill + 0.03}), rgba(255,255,255,${fill * 0.5}))`,
                borderColor: `rgba(255,255,255,${edge})`,
                boxShadow: `0 0 ${size * 0.06}px rgba(200,215,255,${0.1 + t * 0.16})`,
              }}
            />
          );
        })}
        {/* luminous iridescent core between the layers */}
        <div className="cube-core" style={{ width: size * 0.34, height: size * 0.34, top: size * 0.33, left: size * 0.33 }} />
      </div>
    </div>
  );
}
