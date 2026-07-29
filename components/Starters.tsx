"use client";

/* Installs the starter competitions into this browser's store on first load
   (lib/seed.ts). Renders nothing; runs once per mount, no-ops afterwards. */

import { useEffect } from "react";
import { ensureStarters } from "@/lib/seed";

export default function Starters() {
  useEffect(() => {
    try {
      ensureStarters();
    } catch {
      /* storage unavailable — the app still works, the starter code just won't resolve */
    }
  }, []);
  return null;
}
