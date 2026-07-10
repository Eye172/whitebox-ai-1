"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import CandidateShell from "@/components/candidate/CandidateShell";
import { Button } from "@/components/ui/primitives";
import { UploadCloud, FileText, Check, Loader2, Trash2 } from "lucide-react";

type FileState = "uploading" | "verifying" | "verified" | "deleted";
interface Doc { name: string; state: FileState }

export default function Documents() {
  const router = useRouter();
  const [docs, setDocs] = useState<Doc[]>([]);

  const addDoc = () => {
    const names = ["diploma_msc.pdf", "aws_cert.pdf", "reference_letter.pdf"];
    const name = names[docs.length % names.length];
    const idx = docs.length;
    setDocs((d) => [...d, { name, state: "uploading" }]);
    setTimeout(() => setDocs((d) => d.map((x, i) => (i === idx ? { ...x, state: "verifying" } : x))), 900);
    setTimeout(() => setDocs((d) => d.map((x, i) => (i === idx ? { ...x, state: "verified" } : x))), 2200);
    setTimeout(() => setDocs((d) => d.map((x, i) => (i === idx ? { ...x, state: "deleted" } : x))), 3400);
  };

  return (
    <CandidateShell step="documents">
      <div className="pt-2">
        <h1 className="h3 mb-1 text-text-hi">Support your claims (optional)</h1>
        <p className="mb-6 text-[13px] text-text-mid">
          If you mentioned a diploma, certificates, experience, or achievements, you can upload proof.
        </p>

        {/* upload zone */}
        <button
          onClick={addDoc}
          className="flex w-full flex-col items-center justify-center rounded-md border border-dashed border-hairline bg-surface py-10 transition-colors hover:border-hairline-strong"
        >
          <UploadCloud className="mb-3 h-6 w-6 text-text-lo" />
          <span className="text-[13.5px] text-text-hi">Drag & drop or click to upload</span>
          <span className="mono mt-1 text-[11px] text-text-lo">PDF, PNG, JPG · up to 10MB each</span>
        </button>

        {/* files */}
        {docs.length > 0 && (
          <div className="mt-4 space-y-2">
            {docs.map((d, i) => (
              <div key={i} className="flex items-center gap-3 rounded-md border border-hairline bg-surface px-4 py-3">
                <FileText className="h-4 w-4 text-text-lo" />
                <span className="mono flex-1 truncate text-[12.5px] text-text-hi">{d.name}</span>
                {d.state === "uploading" && <Badge icon={Loader2} spin text="Uploading" />}
                {d.state === "verifying" && <Badge icon={Loader2} spin text="Verifying" />}
                {d.state === "verified" && <Badge icon={Check} text="Verified" color="var(--pos)" />}
                {d.state === "deleted" && (
                  <span className="mono flex items-center gap-1 text-[11px] text-text-lo">
                    <Trash2 className="h-3 w-3" /> Verified · source deleted
                  </span>
                )}
              </div>
            ))}
          </div>
        )}

        {/* privacy notice */}
        <div className="mt-4 flex items-start gap-2 rounded-md border border-hairline bg-void-2 p-3">
          <Trash2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-text-lo" />
          <p className="text-[12.5px] leading-relaxed text-text-mid">
            After verification, your documents are <span className="text-text-hi">automatically deleted</span>. Only the verification
            result and structured info are kept — never the source files.
          </p>
        </div>

        <div className="mt-6 flex gap-2">
          <Button className="flex-1" size="lg" onClick={() => router.push("/apply/status")}>
            Continue
          </Button>
          <Button variant="secondary" size="lg" onClick={() => router.push("/apply/status")}>
            Skip — rely on my interview
          </Button>
        </div>
      </div>
    </CandidateShell>
  );
}

function Badge({ icon: Icon, text, color = "var(--text-mid)", spin }: { icon: React.ElementType; text: string; color?: string; spin?: boolean }) {
  return (
    <span className="mono flex items-center gap-1 text-[11px]" style={{ color }}>
      <Icon className={`h-3 w-3 ${spin ? "animate-spin" : ""}`} /> {text}
    </span>
  );
}
