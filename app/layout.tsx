import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "WhiteBox AI — Explainable AI Hiring Operating System",
  description:
    "Not a faster black box — a white one you can see into. Ranked drivers, confidence-as-phrase, evidence chips, and a mandatory human exit written to a hash-chained audit log.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
