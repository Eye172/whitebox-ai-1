import React from "react";
import { Button } from "./primitives";
import { Inbox, AlertTriangle, RotateCw } from "lucide-react";

/* Three states for every container (Book III · §0.5) */

export function EmptyState({
  icon: Icon = Inbox,
  title,
  body,
  cta,
}: {
  icon?: React.ElementType;
  title: string;
  body?: string;
  cta?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-dashed border-hairline bg-void-2/40 px-6 py-16 text-center">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full border border-hairline bg-surface">
        <Icon className="h-5 w-5 text-text-lo" />
      </div>
      <div className="h3 mb-1 text-text-hi">{title}</div>
      {body && <p className="mb-5 max-w-sm text-sm text-text-mid">{body}</p>}
      {cta}
    </div>
  );
}

export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-md border border-hairline bg-void-2/40 px-6 py-12 text-center">
      <AlertTriangle className="mb-3 h-6 w-6" style={{ color: "var(--neg)" }} />
      <p className="mb-4 text-sm text-text-mid">{message ?? "Something went wrong loading this view."}</p>
      <div className="flex gap-2">
        <Button size="sm" variant="secondary" onClick={onRetry}>
          <RotateCw className="h-3.5 w-3.5" /> Retry
        </Button>
        <Button size="sm" variant="ghost">
          Contact support
        </Button>
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-2">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex items-center gap-4 rounded-[6px] border border-hairline bg-surface px-4 py-3">
          <div className="skeleton h-4 w-8" />
          <div className="skeleton h-4 w-24" />
          <div className="skeleton h-4 flex-1" />
          <div className="skeleton h-4 w-16" />
        </div>
      ))}
    </div>
  );
}
