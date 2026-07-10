"use client";

import React, { useState } from "react";
import type { Candidate } from "@/lib/types";
import { Button, TierBadge } from "@/components/ui/primitives";
import { Sparkles, Send, Check, CalendarClock } from "lucide-react";

const TEMPLATE = (id: string) =>
  `Hi,\n\nCongratulations — after a transparent, human-reviewed evaluation, you've been shortlisted for the next stage of the Team Lead — Platform Engineering role.\n\nWe'd love to schedule a live conversation. Please pick a time that works for you.\n\nWarmly,\nThe Acme hiring team`;

export default function Invitations({ invited, pending }: { invited: Candidate[]; pending: Candidate[] }) {
  const [selected, setSelected] = useState<string>(invited[0]?.internalId ?? "");
  const [body, setBody] = useState(TEMPLATE(invited[0]?.internalId ?? ""));
  const [sent, setSent] = useState<Set<string>>(new Set());
  const [confirm, setConfirm] = useState(false);
  const [generating, setGenerating] = useState(false);

  const generate = () => {
    setGenerating(true);
    setTimeout(() => {
      setBody(TEMPLATE(selected) + "\n\nP.S. Your interview showed real strength in decision-making under ambiguity — we're keen to go deeper there.");
      setGenerating(false);
    }, 900);
  };

  const send = () => {
    setSent((s) => new Set(s).add(selected));
    setConfirm(false);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
      {/* invited list */}
      <div>
        <div className="mono-label mb-2">Invited list · {invited.length}</div>
        <div className="space-y-2">
          {invited.map((c) => (
            <button
              key={c.internalId}
              onClick={() => { setSelected(c.internalId); setBody(TEMPLATE(c.internalId)); }}
              className={`flex w-full items-center gap-3 rounded-md border px-3 py-2.5 text-left ${selected === c.internalId ? "border-hairline-strong bg-white/[0.03]" : "border-hairline bg-surface hover:bg-white/[0.02]"}`}
            >
              <span className="mono text-[12.5px] text-text-hi">{c.internalId}</span>
              <TierBadge tier={c.tier} />
              <span className="mono ml-auto text-[12px] text-text-mid">{c.overall}</span>
              {sent.has(c.internalId) && <Check className="h-3.5 w-3.5" style={{ color: "var(--pos)" }} />}
            </button>
          ))}
        </div>

        <div className="mono-label mb-2 mt-5">Pending — not yet invited</div>
        <div className="space-y-1.5">
          {pending.map((c) => (
            <div key={c.internalId} className="flex items-center gap-3 rounded-md border border-hairline bg-void-2/50 px-3 py-2">
              <span className="mono text-[12px] text-text-mid">{c.internalId}</span>
              <span className="mono ml-auto text-[11px] text-text-lo">{c.overall}</span>
              <button className="mono text-[11px] text-iris-b hover:underline">move ↑</button>
            </div>
          ))}
        </div>
      </div>

      {/* composer */}
      <div>
        <div className="mb-2 flex items-center justify-between">
          <span className="mono-label">Invitation composer · {selected}</span>
          <button onClick={generate} className="mono flex items-center gap-1.5 rounded-[6px] border border-hairline px-2.5 py-1.5 text-[11px] text-text-mid hover:text-text-hi">
            <Sparkles className="h-3 w-3 text-iris-b" /> {generating ? "generating…" : "AI-generate"}
          </button>
        </div>
        <textarea
          value={body}
          onChange={(e) => setBody(e.target.value)}
          rows={12}
          className="w-full resize-none rounded-md border border-hairline bg-surface p-4 text-[13.5px] leading-relaxed text-text-hi outline-none focus:border-hairline-strong"
        />
        <div className="mt-3 flex items-center gap-2">
          <Button onClick={() => setConfirm(true)} disabled={sent.has(selected)}>
            {sent.has(selected) ? <><Check className="h-4 w-4" /> Sent</> : <><Send className="h-4 w-4" /> Send invitation</>}
          </Button>
          <Button variant="secondary">
            <CalendarClock className="h-4 w-4" /> Schedule via Teams / Zoom / Meet
          </Button>
          <span className="mono ml-auto text-[11px] text-text-lo">preview · variables filled</span>
        </div>

        {confirm && (
          <div className="fixed inset-0 z-50 flex items-center justify-center">
            <div className="absolute inset-0 bg-black/60" onClick={() => setConfirm(false)} />
            <div className="relative w-[380px] rounded-md border border-hairline-strong bg-surface-2 p-5">
              <div className="mb-1 text-[15px] font-medium text-text-hi">Send this invitation?</div>
              <p className="mb-4 text-[13px] text-text-mid">This emails {selected} and writes an entry to the audit log. It can&rsquo;t be unsent.</p>
              <div className="flex gap-2">
                <Button className="flex-1" onClick={send}><Send className="h-4 w-4" /> Confirm & send</Button>
                <Button variant="ghost" onClick={() => setConfirm(false)}>Cancel</Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
