"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RoleProvider } from "./RoleContext";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import CommandPalette from "./CommandPalette";
import { isAuthed } from "@/lib/auth";
import Cube from "@/components/ui/Cube";

export default function HRShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [ok, setOk] = useState<boolean | null>(null);

  useEffect(() => {
    if (isAuthed()) {
      setOk(true);
    } else {
      router.replace("/login");
    }
  }, [router]);

  if (!ok) {
    return (
      <div className="flex h-screen flex-col items-center justify-center bg-void">
        <div className="opacity-70">
          <Cube size={72} />
        </div>
        <div className="mono-label mt-6">verifying session…</div>
      </div>
    );
  }

  return (
    <RoleProvider>
      <div className="flex h-screen overflow-hidden bg-void text-text-hi">
        <Sidebar />
        <div className="flex min-w-0 flex-1 flex-col">
          <TopBar />
          <main className="min-h-0 flex-1 overflow-y-auto">{children}</main>
        </div>
        <CommandPalette />
      </div>
    </RoleProvider>
  );
}
