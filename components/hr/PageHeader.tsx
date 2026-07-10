import React from "react";

export function PageHeader({
  title,
  sub,
  right,
  children,
}: {
  title: React.ReactNode;
  sub?: React.ReactNode;
  right?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <div className="mb-6 flex flex-wrap items-start justify-between gap-4">
      <div>
        <h1 className="h2 text-text-hi">{title}</h1>
        {sub && <p className="mt-1 text-sm text-text-mid">{sub}</p>}
        {children}
      </div>
      {right && <div className="flex items-center gap-2">{right}</div>}
    </div>
  );
}

export function Section({
  title,
  desc,
  right,
  children,
  className = "",
}: {
  title?: string;
  desc?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={`mb-8 ${className}`}>
      {(title || right) && (
        <div className="mb-3 flex items-center justify-between">
          <div>
            {title && <h2 className="text-[15px] font-medium text-text-hi">{title}</h2>}
            {desc && <p className="text-[12.5px] text-text-lo">{desc}</p>}
          </div>
          {right}
        </div>
      )}
      {children}
    </section>
  );
}
