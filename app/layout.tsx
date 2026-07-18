import type { Metadata } from "next";
import { Inter, JetBrains_Mono, Space_Grotesk, Instrument_Serif } from "next/font/google";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains" });
const space = Space_Grotesk({ subsets: ["latin"], variable: "--font-space" });
const instrument = Instrument_Serif({ subsets: ["latin"], weight: "400", style: "italic", variable: "--font-instrument" });

export const metadata: Metadata = {
  title: "WhiteBox AI — Explainable AI Hiring OS",
  description: "Not a faster black box — a white one you can see into.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${inter.variable} ${jetbrains.variable} ${space.variable} ${instrument.variable}`}>
      <body className="bg-void text-hi antialiased">{children}</body>
    </html>
  );
}
