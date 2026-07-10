"use client";

import React, { useState, useEffect } from "react";
import { StatusPill, Button } from "@/components/ui/primitives";
import { ROLES } from "./shell-data";
import { Plug, Users, Languages, Scale, FileText, Cpu, Palette, Check } from "lucide-react";

const SECTIONS = [
  { key: "integrations", label: "Integrations", icon: Plug },
  { key: "roles", label: "Roles & permissions", icon: Users },
  { key: "appearance", label: "Appearance", icon: Palette },
  { key: "languages", label: "Languages", icon: Languages },
  { key: "compliance", label: "Compliance", icon: Scale },
  { key: "reports", label: "Reports", icon: FileText },
  { key: "model", label: "Model settings", icon: Cpu },
];

const INTEGRATIONS = [
  { name: "Greenhouse (ATS)", status: "CONNECTED" },
  { name: "Microsoft Teams", status: "CONNECTED" },
  { name: "Zoom", status: "CONNECTED" },
  { name: "Google Meet", status: "ERROR" },
  { name: "Workday (HRIS)", status: "PENDING" },
];

const COMPLIANCE = [
  { law: "NYC LL144 (AEDT bias audit)", on: true },
  { law: "Illinois AIVIA (video consent)", on: true },
  { law: "GDPR (EU)", on: true },
  { law: "Kazakhstan personal-data law", on: true },
  { law: "EU AI Act — high-risk logging & oversight", on: true },
];

export default function Settings() {
  const [section, setSection] = useState("integrations");
  return (
    <div className="grid gap-6 lg:grid-cols-[220px_1fr]">
      <nav className="space-y-1">
        {SECTIONS.map((s) => {
          const Icon = s.icon;
          const active = section === s.key;
          return (
            <button
              key={s.key}
              onClick={() => setSection(s.key)}
              className={`flex w-full items-center gap-2.5 rounded-[6px] px-3 py-2 text-left text-[13px] ${active ? "bg-white/[0.05] text-text-hi" : "text-text-mid hover:text-text-hi"}`}
            >
              <Icon className="h-4 w-4" /> {s.label}
            </button>
          );
        })}
      </nav>

      <div className="min-w-0">
        {section === "integrations" && (
          <Panel title="Integrations" desc="Connect ATS/HRIS and live-interview providers.">
            <div className="overflow-hidden rounded-md border border-hairline bg-surface">
              {INTEGRATIONS.map((i) => (
                <div key={i.name} className="flex items-center justify-between border-b border-hairline px-4 py-3 last:border-0">
                  <span className="text-[13.5px] text-text-hi">{i.name}</span>
                  <div className="flex items-center gap-3">
                    <StatusPill status={i.status} />
                    <button className="mono text-[11px] text-text-lo hover:text-text-hi">test</button>
                  </div>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {section === "roles" && (
          <Panel title="Roles & permissions" desc="Each role sees a different module set and PII visibility.">
            <div className="space-y-2">
              {ROLES.map((r) => (
                <div key={r} className="flex items-center justify-between rounded-md border border-hairline bg-surface px-4 py-3">
                  <div>
                    <div className="text-[13.5px] text-text-hi">{r}</div>
                    <div className="mono text-[11px] text-text-lo">
                      {r === "HR" && "Full pipeline · HITL edits · invites"}
                      {r === "Head" && "Read + comment + final approve"}
                      {r === "Technical" && "Assigned candidates · blind until submit"}
                      {r === "Observer" && "Read-only · no scores · compliance"}
                    </div>
                  </div>
                  <select className="mono rounded-[6px] border border-hairline bg-void-2 px-2 py-1 text-[11px] text-text-mid">
                    <option>Feedback: after own submission</option>
                    <option>Feedback: always</option>
                    <option>Feedback: never</option>
                  </select>
                </div>
              ))}
            </div>
          </Panel>
        )}

        {section === "appearance" && <AppearancePanel />}

        {section === "languages" && (
          <Panel title="Languages" desc="Multi-language interviews & UI.">
            <div className="flex flex-wrap gap-2">
              {["English", "Русский", "Қазақша", "Español", "Deutsch", "日本語"].map((l, i) => (
                <span key={l} className={`mono rounded-full border px-3 py-1.5 text-[12px] ${i === 0 ? "border-hairline-strong text-text-hi" : "border-hairline text-text-mid"}`}>
                  {l}{i === 0 && " ✓"}
                </span>
              ))}
            </div>
          </Panel>
        )}

        {section === "compliance" && (
          <Panel title="Compliance" desc="Per-jurisdiction allowable criteria, consent & retention.">
            <div className="overflow-hidden rounded-md border border-hairline bg-surface">
              {COMPLIANCE.map((c) => (
                <div key={c.law} className="flex items-center justify-between border-b border-hairline px-4 py-3 last:border-0">
                  <span className="text-[13px] text-text-hi">{c.law}</span>
                  <span className="mono flex items-center gap-1 text-[11px]" style={{ color: "var(--pos)" }}>
                    <Check className="h-3 w-3" /> enforced
                  </span>
                </div>
              ))}
            </div>
            <p className="mono mt-3 text-[11px] text-text-lo">Data residency: region-pinned (EU + KZ). Documents auto-delete after verification. Not legal advice.</p>
          </Panel>
        )}

        {section === "reports" && (
          <Panel title="Reports" desc="Per-interview report generation config.">
            <div className="rounded-md border border-hairline bg-surface p-4 text-[13px] text-text-mid">
              Configure which sections appear in exported candidate reports — scorecard, drivers, evidence, audit trail.
            </div>
          </Panel>
        )}

        {section === "model" && (
          <Panel title="Model settings" desc="Pin versions for reproducibility & adverse-action defensibility.">
            <div className="space-y-2">
              {[["Scoring model", "claude-scoring-4"], ["Prompt version", "sc-v7"], ["Rubric version", "r3"]].map(([k, v]) => (
                <div key={k} className="flex items-center justify-between rounded-md border border-hairline bg-surface px-4 py-3">
                  <span className="text-[13px] text-text-mid">{k}</span>
                  <span className="mono rounded-[4px] border border-hairline px-2 py-1 text-[12px] text-text-hi">{v}</span>
                </div>
              ))}
              <p className="mono mt-2 text-[11px] text-text-lo">Every score logs all three versions for reproducibility.</p>
            </div>
          </Panel>
        )}
      </div>
    </div>
  );
}

function AppearancePanel() {
  const [accent, setAccent] = useState("iris");
  useEffect(() => {
    const cur = document.documentElement.getAttribute("data-accent");
    setAccent(cur === "dune" ? "dune" : cur === "ember" ? "ember" : "iris");
  }, []);
  const set = (a: string) => {
    setAccent(a);
    if (a === "iris") document.documentElement.removeAttribute("data-accent");
    else document.documentElement.setAttribute("data-accent", a);
  };
  const OPTIONS = [
    { key: "iris", label: "Iridescent", desc: "Brand light — refracted through the cube", grad: "linear-gradient(120deg,#6EE7F0,#7B93FF,#C77BFF,#FF8AD8)" },
    { key: "dune", label: "Dune gold", desc: "Quieter, premium, enterprise-serious", grad: "linear-gradient(120deg,#c9a86a,#b8935a,#d8c090)" },
    { key: "ember", label: "Ember", desc: "Hotter, more human, energetic", grad: "linear-gradient(120deg,#ff8a4c,#ff6a2e,#ff4d2e)" },
  ];
  return (
    <Panel title="Appearance" desc="The whole product is token-driven — flip the primary accent with one variable.">
      <div className="grid gap-3 sm:grid-cols-3">
        {OPTIONS.map((o) => (
          <button
            key={o.key}
            onClick={() => set(o.key)}
            className={`rounded-md border p-4 text-left transition-all ${accent === o.key ? "border-hairline-strong" : "border-hairline hover:border-hairline-strong"}`}
          >
            <div className="mb-3 h-10 w-full rounded-[6px]" style={{ background: o.grad }} />
            <div className="flex items-center gap-1.5 text-[13.5px] text-text-hi">
              {o.label} {accent === o.key && <Check className="h-3.5 w-3.5" style={{ color: "var(--pos)" }} />}
            </div>
            <div className="text-[11.5px] text-text-lo">{o.desc}</div>
          </button>
        ))}
      </div>
      <p className="mono mt-4 text-[11px] text-text-lo">Try it — the iris accents across the product re-skin live.</p>
    </Panel>
  );
}

function Panel({ title, desc, children }: { title: string; desc: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-[16px] font-medium text-text-hi">{title}</h2>
      <p className="mb-4 text-[12.5px] text-text-lo">{desc}</p>
      {children}
    </div>
  );
}
