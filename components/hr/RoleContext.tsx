"use client";

import React, { createContext, useContext, useState } from "react";
import type { Role } from "@/lib/types";

interface RoleCtx {
  role: Role;
  setRole: (r: Role) => void;
  paletteOpen: boolean;
  setPaletteOpen: (b: boolean) => void;
}

const Ctx = createContext<RoleCtx | null>(null);

export function RoleProvider({ children }: { children: React.ReactNode }) {
  const [role, setRole] = useState<Role>("HR");
  const [paletteOpen, setPaletteOpen] = useState(false);
  return <Ctx.Provider value={{ role, setRole, paletteOpen, setPaletteOpen }}>{children}</Ctx.Provider>;
}

export function useRole() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useRole must be used within RoleProvider");
  return c;
}
