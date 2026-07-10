import { CANDIDATES } from "@/lib/fixtures";
import { shortHash } from "@/lib/hash";
import { PageHeader, Section } from "@/components/hr/PageHeader";
import { FileCheck2, GitBranch, Share2 } from "lucide-react";

const ACTION_LABEL: Record<string, string> = {
  AI_SCORED: "AI scored",
  APPROVED: "Approved",
  REJECTED: "Rejected",
  ESCALATED: "Escalated",
  OVERRIDDEN: "Overridden",
  RECOMPUTED: "Recomputed",
  IDENTITY_REVEALED: "Identity revealed",
  INVITED: "Invited",
};
const ACTION_COLOR: Record<string, string> = {
  AI_SCORED: "var(--iris-b)",
  APPROVED: "var(--pos)",
  REJECTED: "var(--neg)",
  ESCALATED: "var(--warn)",
  OVERRIDDEN: "var(--ember)",
  RECOMPUTED: "var(--iris-c)",
  IDENTITY_REVEALED: "var(--warn)",
  INVITED: "var(--pos)",
};

const CONFIG_VERSIONS = [
  { v: 4, date: "2026-07-08", author: "R. Alvarez", change: "Raised stress-resilience weight 10→12; lowered ownership 10→8." },
  { v: 3, date: "2026-06-28", author: "R. Alvarez", change: "Added conflict-resolution as a focus attribute." },
  { v: 2, date: "2026-06-22", author: "T. Okafor", change: "Threshold 68→70 after first candidate cohort." },
  { v: 1, date: "2026-06-20", author: "WhiteBox AI", change: "Generated from natural-language brief." },
];

export default function AuditPage() {
  // aggregate the org audit trail from all candidates
  const entries = CANDIDATES.flatMap((c) => c.audit.map((a) => ({ ...a, cid: c.internalId })))
    .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
    .slice(0, 30);

  return (
    <div className="p-6 md:p-8">
      <PageHeader
        title="Audit & versioning"
        sub="Append-only, hash-chained. Tamper-evident by construction."
        right={
          <span className="mono flex items-center gap-1.5 rounded-full border border-hairline bg-surface px-2.5 py-1 text-[11px] text-text-mid">
            <FileCheck2 className="h-3.5 w-3.5 text-iris-b" /> chain intact
          </span>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <Section title="Audit log" desc="Every AI score & human decision — with model/prompt/rubric versions">
          <div className="overflow-x-auto rounded-md border border-hairline bg-surface">
            <table className="w-full min-w-[720px] text-left text-[12.5px]">
              <thead>
                <tr className="border-b border-hairline">
                  <th className="mono-label px-3 py-2.5 font-normal">Time</th>
                  <th className="mono-label px-3 py-2.5 font-normal">Actor</th>
                  <th className="mono-label px-3 py-2.5 font-normal">Action</th>
                  <th className="mono-label px-3 py-2.5 font-normal">Target</th>
                  <th className="mono-label px-3 py-2.5 font-normal">Prev</th>
                  <th className="mono-label px-3 py-2.5 font-normal">Hash</th>
                  <th className="mono-label px-3 py-2.5 font-normal">Share</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((a) => (
                  <tr key={a.hash} className="border-b border-hairline last:border-0 hover:bg-white/[0.02]">
                    <td className="mono whitespace-nowrap px-3 py-2.5 text-text-lo">{a.timestamp.slice(0, 16)}</td>
                    <td className="px-3 py-2.5 text-text-mid">{a.actor}</td>
                    <td className="px-3 py-2.5">
                      <span className="mono rounded-[4px] px-1.5 py-0.5 text-[10px] uppercase" style={{ color: ACTION_COLOR[a.action], background: "rgba(255,255,255,0.04)" }}>
                        {ACTION_LABEL[a.action]}
                      </span>
                    </td>
                    <td className="mono px-3 py-2.5 text-text-mid">{a.cid}</td>
                    <td className="mono px-3 py-2.5 text-text-lo">{shortHash(a.prevHash)}</td>
                    <td className="mono px-3 py-2.5" style={{ color: "var(--iris-b)" }}>{shortHash(a.hash)}</td>
                    <td className="px-3 py-2.5">
                      <Share2 className="h-3.5 w-3.5 text-text-lo hover:text-text-hi" />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="mono mt-3 text-[11px] text-text-lo">Field-level &ldquo;share with auditor&rdquo; flags control external visibility (Vanta model).</p>
        </Section>

        <Section title="Config change history" desc="Versioned with diffs">
          <div className="space-y-2">
            {CONFIG_VERSIONS.map((c) => (
              <div key={c.v} className="rounded-md border border-hairline bg-surface p-3">
                <div className="mb-1 flex items-center gap-2">
                  <GitBranch className="h-3.5 w-3.5 text-iris-c" />
                  <span className="mono text-[12px] text-text-hi">v{c.v}</span>
                  <span className="mono ml-auto text-[11px] text-text-lo">{c.date}</span>
                </div>
                <p className="text-[12.5px] text-text-mid">{c.change}</p>
                <p className="mono mt-1 text-[10px] text-text-lo">by {c.author}</p>
              </div>
            ))}
          </div>
        </Section>
      </div>
    </div>
  );
}
