# WhiteBox AI

**An Explainable AI Hiring Operating System — not a faster black box, a white one you can see into.**

A two-sided product: a dense recruiter **HR Workspace** and a calm **Candidate Portal**. The moat is transparency, auditability, and a human-final decision — not automation.

## The one differentiator

Every score surfaces:

- **Ranked drivers** — FICO/VantageScore reason-code structure, principal reason first
- **Confidence as a phrase** — never a bare number
- **Evidence chips** — tied to the exact interview fragments
- **A collapsible reasoning trace** — "Completed N steps"
- **A mandatory human exit** — Accept / Change / Recompute / Reject, reason required, written to an **append-only, hash-chained audit log**

## Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** + a CSS-custom-property token system (dark base, invertible white-box panels, iridescent accent that re-skins to dune-gold / ember from one variable)
- All data from typed fixtures (`lib/`) — the AI/backend is mocked, as the spec prescribes
- The brand cube is CSS 3D (no WebGL); respects `prefers-reduced-motion`
- No runtime network dependencies (system font stack)

## Run

```bash
npm install
npm run dev
```

Open **http://localhost:4311**.

- HR Workspace → `/hr/dashboard`
- Candidate Portal → `/apply`

## Structure

```
app/            routes (hr/*, apply/*)
components/ui   design-system primitives (cube, gauge, radar, white-box panel, explainability)
components/hr   recruiter surfaces (shell, ranking table, scorecard, HITL, charts)
components/candidate  candidate shell + progress rail
lib/            types, fixtures, hash-chain
```
