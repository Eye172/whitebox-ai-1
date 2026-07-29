import type { Metadata } from "next";
import "./globals.css";
import Starters from "@/components/Starters";

export const metadata: Metadata = {
  title: "WhiteBox AI — Explainable AI Hiring OS",
  description: "Not a faster black box — a white one you can see into.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="bg-void text-hi antialiased">
        <Starters />
        {children}
      </body>
    </html>
  );
}
