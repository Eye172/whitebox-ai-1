/**
 * Topographic contour + HUD-node texture (Book II · §2.2, "data-map layer").
 * Procedural organic contours + navigation dots/crosses/dashed paths, at low opacity.
 * The background language of "the map of a decision."
 */
export default function ContourBg({ opacity = 0.06 }: { opacity?: number }) {
  return (
    <svg
      className="pointer-events-none absolute inset-0 h-full w-full"
      viewBox="0 0 1200 700"
      preserveAspectRatio="xMidYMid slice"
      style={{ opacity }}
      aria-hidden
    >
      <g fill="none" stroke="var(--line-strong)" strokeWidth="1">
        {/* nested contour rings — island A */}
        <path d="M180,120 C320,60 520,90 560,220 C600,350 460,420 320,400 C180,380 80,300 120,220 C140,170 150,140 180,120 Z" />
        <path d="M215,155 C325,110 470,135 500,235 C525,330 425,380 320,365 C215,350 140,290 165,230 Z" />
        <path d="M255,190 C335,160 425,180 450,250 C470,315 400,345 325,335 C250,325 200,285 220,240 Z" />
        <path d="M290,225 C345,205 400,220 415,265 C428,305 385,325 335,318 C285,311 255,285 270,255 Z" />
        {/* island B */}
        <path d="M760,300 C900,240 1080,290 1090,430 C1098,560 940,610 820,570 C700,530 640,420 690,350 C715,320 735,310 760,300 Z" />
        <path d="M800,340 C910,300 1040,340 1048,450 C1055,545 930,580 835,548 C740,516 700,430 740,380 Z" />
        <path d="M845,380 C925,352 1010,382 1015,460 C1020,525 935,552 862,528 C790,505 762,442 795,406 Z" />
        {/* ridge lines */}
        <path d="M0,540 C200,500 380,560 560,520 C740,480 920,540 1200,500" strokeDasharray="1 6" />
        <path d="M0,90 C220,140 420,80 640,120 C860,160 1020,100 1200,150" strokeDasharray="1 6" />
      </g>
      {/* HUD nodes */}
      <g fill="var(--iris-b)">
        <circle cx="320" cy="290" r="2.5" />
        <circle cx="890" cy="440" r="2.5" />
        <circle cx="560" cy="220" r="2" />
      </g>
      <g stroke="var(--line-mid)" strokeWidth="1">
        {[[440, 180], [700, 360], [980, 300], [150, 430], [620, 560]].map(([x, y], i) => (
          <g key={i}>
            <line x1={x - 5} y1={y} x2={x + 5} y2={y} />
            <line x1={x} y1={y - 5} x2={x} y2={y + 5} />
          </g>
        ))}
      </g>
      {/* dashed connection paths */}
      <g stroke="var(--iris-c)" strokeWidth="1" strokeDasharray="3 5" opacity="0.6">
        <path d="M320,290 L560,220 L890,440" fill="none" />
      </g>
    </svg>
  );
}
