"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { createEmptyDraft } from "@/lib/studio";
import type { Role, VacancyV2 } from "@/lib/types";
import { STORE_KEYS } from "@/lib/types";

interface InitialReviewer {
  userId: string;
  name: string;
  role: Role;
  piiReveal: boolean;
}

interface StudioCtx {
  draft: VacancyV2;
  update: (mutate: (draft: VacancyV2) => VacancyV2) => void;
  replace: (draft: VacancyV2) => void;
  resetBlank: () => void;
  step: number;
  setStep: (step: number) => void;
  entered: boolean;
  setEntered: (entered: boolean) => void;
}

const Ctx = createContext<StudioCtx | null>(null);

function withCurrentReviewer(
  draft: VacancyV2,
  reviewer: InitialReviewer,
): VacancyV2 {
  const roles = draft.governance.roles.filter(
    (role) =>
      role.userId !== "u-ar" &&
      role.name.trim().toLowerCase() !== "a.rakhimova",
  );
  const exists = roles.some((role) => role.userId === reviewer.userId);
  return {
    ...draft,
    governance: {
      ...draft.governance,
      roles: exists
        ? roles.map((role) =>
            role.userId === reviewer.userId ? reviewer : role,
          )
        : [reviewer, ...roles],
    },
  };
}

export function useStudio(): StudioCtx {
  const context = useContext(Ctx);
  if (!context) {
    throw new Error("useStudio must be used inside <StudioProvider>");
  }
  return context;
}

export default function StudioProvider({
  children,
  initialReviewer,
}: {
  children: React.ReactNode;
  initialReviewer: InitialReviewer;
}) {
  const stableReviewer = useMemo(
    () => ({
      userId: initialReviewer.userId,
      name: initialReviewer.name,
      role: initialReviewer.role,
      piiReveal: initialReviewer.piiReveal,
    }),
    [
      initialReviewer.name,
      initialReviewer.piiReveal,
      initialReviewer.role,
      initialReviewer.userId,
    ],
  );
  const [draft, setDraft] = useState<VacancyV2>(() =>
    withCurrentReviewer(createEmptyDraft(), stableReviewer),
  );
  const [step, setStep] = useState(1);
  const [entered, setEntered] = useState(false);
  const hydrated = useRef(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORE_KEYS.draft);
      if (raw) {
        const saved = JSON.parse(raw) as {
          draft: VacancyV2;
          entered: boolean;
          step: number;
        };
        if (saved?.draft) {
          setDraft(withCurrentReviewer(saved.draft, stableReviewer));
          setEntered(saved.entered ?? false);
          setStep(saved.step ?? 1);
        }
      }
    } catch {
      // Invalid local state is ignored; the fresh server-linked draft remains.
    }
    hydrated.current = true;
  }, [stableReviewer]);

  useEffect(() => {
    if (!hydrated.current) return;
    try {
      localStorage.setItem(
        STORE_KEYS.draft,
        JSON.stringify({ draft, entered, step }),
      );
    } catch {
      // The in-memory draft remains usable when browser storage is unavailable.
    }
  }, [draft, entered, step]);

  const update = useCallback(
    (mutate: (current: VacancyV2) => VacancyV2) => {
      setDraft((current) => mutate(current));
    },
    [],
  );

  const replace = useCallback(
    (next: VacancyV2) =>
      setDraft(withCurrentReviewer(next, stableReviewer)),
    [stableReviewer],
  );

  const resetBlank = useCallback(() => {
    setDraft(withCurrentReviewer(createEmptyDraft(), stableReviewer));
    setStep(1);
    setEntered(false);
    try {
      localStorage.removeItem(STORE_KEYS.draft);
    } catch {
      // No persisted draft to remove.
    }
  }, [stableReviewer]);

  return (
    <Ctx.Provider
      value={{
        draft,
        update,
        replace,
        resetBlank,
        step,
        setStep,
        entered,
        setEntered,
      }}
    >
      {children}
    </Ctx.Provider>
  );
}
