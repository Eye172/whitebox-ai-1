"use client";

/**
 * The WhiteBox brand object — a white, transparent, glowing cube (CSS 3D, no WebGL).
 * Light passes through = explainability in one image (Book II · §2.5).
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
  const half = size / 2;
  const faces: { transform: string }[] = [
    { transform: `rotateY(0deg) translateZ(${half}px)` },
    { transform: `rotateY(90deg) translateZ(${half}px)` },
    { transform: `rotateY(180deg) translateZ(${half}px)` },
    { transform: `rotateY(-90deg) translateZ(${half}px)` },
    { transform: `rotateX(90deg) translateZ(${half}px)` },
    { transform: `rotateX(-90deg) translateZ(${half}px)` },
  ];
  return (
    <div
      className={`cube-scene ${className}`}
      style={{ width: size * 1.6, height: size * 1.6 }}
      aria-hidden
    >
      <div
        className="cube-glow"
        style={{ width: size * 1.7, height: size * 1.7, position: "absolute" }}
      />
      {pulse && (
        <>
          <span
            className="absolute rounded-full animate-pulse-ring"
            style={{
              width: size,
              height: size,
              border: "1px solid var(--iris-b)",
              opacity: 0.4,
            }}
          />
          <span
            className="absolute rounded-full animate-pulse-ring"
            style={{
              width: size,
              height: size,
              border: "1px solid var(--iris-c)",
              animationDelay: "1.2s",
              opacity: 0.3,
            }}
          />
        </>
      )}
      <div className="cube" style={{ width: size, height: size }}>
        {faces.map((f, i) => (
          <div
            key={i}
            className="cube-face"
            style={{ width: size, height: size, transform: f.transform }}
          />
        ))}
        {/* inner core */}
        <div
          className="cube-face"
          style={{
            width: size * 0.42,
            height: size * 0.42,
            top: size * 0.29,
            left: size * 0.29,
            transform: "translateZ(0)",
            background:
              "radial-gradient(circle, rgba(255,255,255,0.5), rgba(123,147,255,0.25))",
            borderColor: "rgba(255,255,255,0.6)",
            filter: "blur(1px)",
          }}
        />
      </div>
    </div>
  );
}
