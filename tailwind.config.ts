import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "./lib/**/*.{ts,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Dark base
        void: "var(--void)",
        "void-2": "var(--void-2)",
        surface: "var(--surface)",
        "surface-2": "var(--surface-2)",
        // Text & lines
        paper: "var(--paper)",
        "text-hi": "var(--text-hi)",
        "text-mid": "var(--text-mid)",
        "text-lo": "var(--text-lo)",
        "text-disabled": "var(--text-disabled)",
        "line-strong": "var(--line-strong)",
        "line-mid": "var(--line-mid)",
        "line-soft": "var(--line-soft)",
        // Inverted white-box
        "wb-paper": "var(--wb-paper)",
        "wb-ink": "var(--wb-ink)",
        "wb-text": "var(--wb-text)",
        // Semantic
        pos: "var(--pos)",
        neg: "var(--neg)",
        warn: "var(--warn)",
        info: "var(--info)",
        // Accents
        ember: "var(--ember)",
        "dune-gold": "var(--dune-gold)",
        "iris-a": "var(--iris-a)",
        "iris-b": "var(--iris-b)",
        "iris-c": "var(--iris-c)",
        "iris-d": "var(--iris-d)",
      },
      borderColor: {
        hairline: "var(--hairline)",
        "hairline-strong": "var(--hairline-strong)",
      },
      fontFamily: {
        display: "var(--font-display)",
        body: "var(--font-body)",
        mono: "var(--font-mono)",
      },
      borderRadius: {
        xs: "4px",
        sm: "8px",
        md: "12px",
      },
      maxWidth: {
        reading: "1200px",
      },
      transitionTimingFunction: {
        wb: "cubic-bezier(0.22, 1, 0.36, 1)",
      },
      keyframes: {
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
        "prism-drift": {
          "0%,100%": { filter: "hue-rotate(0deg)" },
          "50%": { filter: "hue-rotate(40deg)" },
        },
        "spin-slow": {
          to: { transform: "rotate(360deg)" },
        },
        "cube-float": {
          "0%,100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-8px)" },
        },
        "pulse-ring": {
          "0%": { transform: "scale(0.9)", opacity: "0.7" },
          "100%": { transform: "scale(1.6)", opacity: "0" },
        },
        "fade-in-up": {
          from: { opacity: "0", transform: "translateY(16px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 1.4s infinite",
        "prism-drift": "prism-drift 8s ease-in-out infinite",
        "spin-slow": "spin-slow 24s linear infinite",
        "cube-float": "cube-float 6s ease-in-out infinite",
        "pulse-ring": "pulse-ring 2.4s ease-out infinite",
        "fade-in-up": "fade-in-up 0.6s cubic-bezier(0.22,1,0.36,1) both",
      },
    },
  },
  plugins: [],
};

export default config;
