import Link from "next/link";
import Cube from "@/components/ui/Cube";

export default function NotFound() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-void px-6 text-center">
      <div className="mb-6 opacity-80">
        <Cube size={80} />
      </div>
      <div className="mono-label mb-3">error · 404</div>
      <h1 className="h2 mb-2 text-text-hi">This box is empty</h1>
      <p className="mb-6 max-w-sm text-sm text-text-mid">
        The page you&rsquo;re looking for doesn&rsquo;t exist — but everything else is transparent.
      </p>
      <div className="flex gap-2">
        <Link href="/hr/dashboard" className="rounded-[4px] border border-hairline-strong bg-surface-2 px-4 py-2 text-sm text-text-hi hover:iris-border">
          HR Workspace
        </Link>
        <Link href="/apply" className="rounded-[4px] border border-hairline px-4 py-2 text-sm text-text-mid hover:text-text-hi">
          Candidate Portal
        </Link>
      </div>
    </main>
  );
}
