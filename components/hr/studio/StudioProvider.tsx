"use client";

/* Vacancy Studio state — SPEC §4. One draft VacancyV2, persisted locally,
   consumed by every step surface via useStudio(). Steps are a left rail,
   not a forced wizard: `step` is navigation only; the preflight validator
   (lib/studio.ts) is the only gatekeeper to publishing. */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { VacancyV2 } from "@/lib/types";
import { STORE_KEYS } from "@/lib/types";

export function createEmptyDraft(): VacancyV2 {
  return {
    id: "vac-draft",
    code: "",
    status: "DRAFT",
    configVersion: 1,
    profile: {
      title: "",
      openings: 1,
      seniority: "Middle",
      employmentType: "full_time",
      workMode: "hybrid",
      locations: [],
      mission: "",
      responsibilities: [],
      industryPack: "tech",
      languages: { primary: "en", alternates: [] },
    },
    categories: [],
    pipeline: [],
    scoring: {
      topology: "hybrid",
      weighting: "rational",
      threshold: 65,
      banding: { enabled: false, sedWidth: 4 },
      tieBreakers: ["focus_attributes"],
      anonymization: { maskPII: true, revealAtStage: "decision" },
      abstainPolicy: { minEvidencePerAttribute: 1, onAbstain: "flag_human" },
      normalization: "absolute_rubric",
    },
    experience: {
      landing: { showCompensation: false, companyBlurb: "" },
      notices: {
        jurisdictionProfile: "EU",
        aiDisclosure:
          "Parts of this process are AI-assisted. Only the language content of your answers is scored — never your face, voice tone, appearance, or emotion. A named human reviews and decides.",
        retentionDays: 180,
        consentCheckpoints: ["entry", "recorded_blocks"],
        version: 1,
      },
      comms: {
        confirmationEnabled: true,
        reminderCadence: 2,
        dispositionSlaDays: 5,
        feedbackOffer: true,
        senderIdentity: "org",
      },
      tone: "neutral",
    },
    governance: {
      roles: [{ userId: "u-ar", name: "a.rakhimova", role: "Owner", piiReveal: true }],
      reviewPolicy: { independentReviews: 1, assignment: "round_robin" },
      calibrationRequired: true,
      dualControlThreshold: 25,
      slaTargets: { reviewQueueHours: 48, dispositionDays: 5 },
      changeControl: { editLive: ["Owner"], pauseClose: ["Owner", "HiringManager"] },
    },
    distribution: [],
    window: { opensAt: "", closesAt: "", timezone: "Asia/Almaty" },
    rollingReview: true,
    audit: [],
    createdAt: "",
  };
}

interface StudioCtx {
  draft: VacancyV2;
  /* immutable-update helper: update((d) => ({ ...d, profile: { ...d.profile, title } })) */
  update: (mutate: (d: VacancyV2) => VacancyV2) => void;
  replace: (d: VacancyV2) => void;
  resetBlank: () => void;
  step: number; // 1..7
  setStep: (n: number) => void;
  /* false until the user picks an entry mode (Describe / Manual / Preset / Clone) */
  entered: boolean;
  setEntered: (b: boolean) => void;
}

const Ctx = createContext<StudioCtx | null>(null);

export function useStudio(): StudioCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStudio must be used inside <StudioProvider>");
  return ctx;
}

export default function StudioProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<VacancyV2>(createEmptyDraft);
  const [step, setStep] = useState(1);
  const [entered, setEntered] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEYS.draft);
      if (raw) {
        const saved = JSON.parse(raw) as { draft: VacancyV2; entered: boolean; step: number };
        if (saved?.draft) {
          setDraft(saved.draft);
          setEntered(saved.entered ?? false);
          setStep(saved.step ?? 1);
        }
      }
    } catch {
      /* corrupted draft — start clean */
    }
    hydrated.current = true;
  }, []);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(STORE_KEYS.draft, JSON.stringify({ draft, entered, step }));
    } catch {
      /* storage full/unavailable — draft lives in memory only */
    }
  }, [draft, entered, step]);

  const update = useCallback((mutate: (d: VacancyV2) => VacancyV2) => {
    setDraft((d) => mutate(d));
  }, []);

  const replace = useCallback((d: VacancyV2) => setDraft(d), []);

  const resetBlank = useCallback(() => {
    setDraft(createEmptyDraft());
    setStep(1);
    setEntered(false);
    try {
      localStorage.removeItem(STORE_KEYS.draft);
    } catch {}
  }, []);

  return (
    <Ctx.Provider value={{ draft, update, replace, resetBlank, step, setStep, entered, setEntered }}>
      {children}
    </Ctx.Provider>
  );
}
