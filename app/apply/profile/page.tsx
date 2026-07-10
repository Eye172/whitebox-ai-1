"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CandidateShell from "@/components/candidate/CandidateShell";
import { Button } from "@/components/ui/primitives";
import { Check, Plus } from "lucide-react";

export default function Profile() {
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [skills, setSkills] = useState<string[]>(["Leadership", "Distributed systems"]);
  const [skillInput, setSkillInput] = useState("");

  const autosave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 1600);
  };

  return (
    <CandidateShell step="profile">
      <div className="pt-2">
        <div className="mb-1 flex items-center justify-between">
          <h1 className="h3 text-text-hi">A short profile</h1>
          {saved && (
            <span className="mono flex items-center gap-1 text-[11px]" style={{ color: "var(--pos)" }}>
              <Check className="h-3 w-3" /> Saved
            </span>
          )}
        </div>
        <p className="mb-6 text-[13px] text-text-mid">Only what&rsquo;s needed. Your identity stays hidden from evaluators.</p>

        <div className="space-y-5">
          <Group label="Experience">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Title" onBlur={autosave} />
              <Input placeholder="Organization" onBlur={autosave} />
            </div>
            <Input placeholder="Dates (e.g. 2020 – present)" onBlur={autosave} />
          </Group>

          <Group label="Education">
            <div className="grid grid-cols-2 gap-2">
              <Input placeholder="Degree" onBlur={autosave} />
              <Input placeholder="Institution" onBlur={autosave} />
            </div>
          </Group>

          <Group label="Skills">
            <div className="flex flex-wrap gap-2">
              {skills.map((s) => (
                <span key={s} className="mono rounded-full border border-hairline bg-surface px-2.5 py-1 text-[12px] text-text-hi">
                  {s}
                </span>
              ))}
              <input
                value={skillInput}
                onChange={(e) => setSkillInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && skillInput.trim()) {
                    setSkills((s) => [...s, skillInput.trim()]);
                    setSkillInput("");
                    autosave();
                  }
                }}
                placeholder="add skill + enter"
                className="mono rounded-full border border-dashed border-hairline bg-transparent px-2.5 py-1 text-[12px] text-text-mid outline-none placeholder:text-text-lo"
              />
            </div>
          </Group>

          <Group label="Short bio">
            <textarea
              rows={3}
              onBlur={autosave}
              placeholder="A few sentences about yourself"
              className="w-full resize-none rounded-[8px] border border-hairline bg-surface px-3 py-2.5 text-[14px] text-text-hi outline-none placeholder:text-text-lo focus:border-hairline-strong"
            />
          </Group>

          <div className="flex items-center gap-2 rounded-[8px] border border-hairline bg-void-2 px-3 py-2.5">
            <span className="mono-label">Optional</span>
            <button className="mono flex items-center gap-1 text-[12px] text-text-lo hover:text-text-hi">
              <Plus className="h-3 w-3" /> Portfolio, GitHub, LinkedIn
            </button>
          </div>
        </div>

        <Button className="mt-6 w-full" size="lg" onClick={() => router.push("/apply/check")}>
          Save & continue
        </Button>
      </div>
    </CandidateShell>
  );
}

function Group({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="mono-label mb-2 block">{label}</label>
      <div className="space-y-2">{children}</div>
    </div>
  );
}
function Input(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className="w-full rounded-[8px] border border-hairline bg-surface px-3 py-2.5 text-[14px] text-text-hi outline-none placeholder:text-text-lo focus:border-hairline-strong"
    />
  );
}
