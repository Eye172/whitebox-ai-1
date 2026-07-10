"use client";

import React from "react";
import { RoleProvider } from "./RoleContext";
import Sidebar from "./Sidebar";
import TopBar from "./TopBar";
import CommandPalette from "./CommandPalette";

export default function HRShell({ children }: { children: React.ReactNode }) {
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
