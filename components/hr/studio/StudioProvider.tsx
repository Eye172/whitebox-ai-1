"use client";

/* Vacancy Studio state — SPEC §4. One draft VacancyV2, persisted locally,
   consumed by every step surface via useStudio(). Steps are a left rail,
   not a forced wizard: `step` is navigation only; the preflight validator
   (lib/studio.ts) is the only gatekeeper to publishing.

   Everything a half-finished vacancy needs to survive a page change lives in
   this one persisted envelope — the draft itself, which entry mode was chosen,
   which step was open, and whether the candidate preview has been reviewed.
   Leaving for another surface and coming back resumes exactly where you were. */

import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import type { VacancyV2 } from "@/lib/types";
import { STORE_KEYS } from "@/lib/types";
import { createEmptyDraft } from "@/lib/studio";

export { createEmptyDraft };

interface StudioSession {
  draft: VacancyV2;
  entered: boolean;
  step: number;
  /* Publishing requires the author to have looked at what candidates see.
     Persisted with the draft so navigating away never silently revokes it. */
  previewedAt?: string;
  savedAt?: string;
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
  previewedAt: string | null;
  markPreviewed: () => void;
  /* null until the first local save of this session — drives the "saved" chip */
  savedAt: string | null;
  /* false during the first paint, before localStorage has been read */
  hydrated: boolean;
}

const Ctx = createContext<StudioCtx | null>(null);

export function useStudio(): StudioCtx {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useStudio must be used inside <StudioProvider>");
  return ctx;
}

/* Read the persisted session without mounting the provider — lets other
   surfaces (vacancy list, dashboard) offer "resume your draft". */
export function readStudioSession(): StudioSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STORE_KEYS.draft);
    if (!raw) return null;
    const saved = JSON.parse(raw) as Partial<StudioSession>;
    return saved?.draft ? { entered: false, step: 1, ...saved, draft: saved.draft } : null;
  } catch {
    return null; // corrupted draft — behave as if there is none
  }
}

export function clearStudioSession(): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(STORE_KEYS.draft);
  } catch {
    /* storage unavailable — nothing to clear */
  }
}

export default function StudioProvider({ children }: { children: React.ReactNode }) {
  const [draft, setDraft] = useState<VacancyV2>(createEmptyDraft);
  const [step, setStep] = useState(1);
  const [entered, setEntered] = useState(false);
  const [previewedAt, setPreviewedAt] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<string | null>(null);
  const [hydrated, setHydrated] = useState(false);
  /* Guards the save effect. A ref, not state, because the save effect must see
     the flip in the very same commit that restores the draft — otherwise the
     empty initial draft is written over the saved one before React re-renders. */
  const canSave = useRef(false);

  useEffect(() => {
    const saved = readStudioSession();
    if (saved) {
      setDraft(saved.draft);
      setEntered(saved.entered ?? false);
      setStep(saved.step ?? 1);
      setPreviewedAt(saved.previewedAt ?? null);
      setSavedAt(saved.savedAt ?? null);
    }
    setHydrated(true);
  }, []);

  /* Persist on every change, but never before hydration has produced its
     re-render — the first pass after hydration is the restored state itself,
     so writing it back is a no-op rather than a clobber. */
  useEffect(() => {
    if (!hydrated) return;
    if (!canSave.current) {
      canSave.current = true;
      return; // this commit is the restored (or untouched empty) state
    }
    const at = new Date().toISOString();
    const session: StudioSession = { draft, entered, step, previewedAt: previewedAt ?? undefined, savedAt: at };
    try {
      window.localStorage.setItem(STORE_KEYS.draft, JSON.stringify(session));
      setSavedAt(at);
    } catch {
      /* storage full/unavailable — draft lives in memory only */
    }
  }, [draft, entered, step, previewedAt, hydrated]);

  const update = useCallback((mutate: (d: VacancyV2) => VacancyV2) => {
    setDraft((d) => mutate(d));
  }, []);

  const replace = useCallback((d: VacancyV2) => setDraft(d), []);

  const markPreviewed = useCallback(() => setPreviewedAt(new Date().toISOString()), []);

  const resetBlank = useCallback(() => {
    setDraft(createEmptyDraft());
    setStep(1);
    setEntered(false);
    setPreviewedAt(null);
    setSavedAt(null);
    clearStudioSession();
  }, []);

  return (
    <Ctx.Provider
      value={{
        draft, update, replace, resetBlank,
        step, setStep, entered, setEntered,
        previewedAt, markPreviewed, savedAt, hydrated,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
