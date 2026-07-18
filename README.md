# WhiteBox AI — Explainable AI Hiring OS (prototype)

> *"Not a faster black box — a white one you can see into."*

Working front-end prototype built from **WhiteBoxAIMASTERDOC.md** (the single source of truth).
Implements Phase **P0 (foundation)** and **P1 (core differentiator)** of Book V's build sequence,
plus the first candidate-side screens, against typed fixtures (Book V rule 5: mock the AI/backend
until its ticket lands).

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

Screenshots of every surface are in [`screenshots/`](screenshots).

## What's built

| Surface | Route | Spec |
| --- | --- | --- |
| HR app shell — 264px sidebar (3 zones), 52px top bar, ⌘K palette | all HR routes | Book III · §0 |
| Global Dashboard — KPI strip, vacancy cards, HITL attention queue, cube anchor | `/dashboard` | Book III · §1 |
| Candidate Ranking — 10-column table, expandable rows, bulk bar, tiers, contour-HUD bg | `/vacancies/vac-001/ranking` | Book III · §5 |
| Candidate Scorecard — 6 tabs; **ranked drivers, confidence-as-phrase, evidence chips, collapsible trace**; HITL inspector with equal-weight Accept/Change/Recompute/Reject + reason → append-only hash-chained activity log | `/vacancies/vac-001/candidates/CND-4A19` | Book III · §6, Book I · Part VIII |
| Create Vacancy wizard — NL→config with per-field "why" chips, weight sum=100 validation, publish → competition code | `/vacancies/new` | Book III · §2 |
| Candidate Code Entry — calm register, cube-lit, disabled-until-valid | `/` | Book IV · §1 |
| System Check gate — checks + consent, Start disabled until all pass | `/interview/check` | Book IV · §4 |
| AI Interview — cube-as-presence, adaptive follow-ups, gentle progress | `/interview/live` | Book IV · §5 |
| Candidate Status — progress rail, dignified copy, inverted white-box trust panel | `/status` | Book IV · §7 |

**Demo codes:** `WBX-3N8D` — new competition (goes into the interview flow); `WBX-7Q4K` — already-submitted application (goes to status). Codes published from the wizard also work (stored in localStorage).

**AI stubs:** [`lib/ai.ts`](lib/ai.ts) + `/api/ai/nl-to-config` + `/api/ai/interview` implement the exact
typed contracts from Book V · §V.3 (per-field rationale; stateless interview-step agent). Swapping the
stub heuristics for real LLM calls (FastAPI + Instructor + LangGraph) changes nothing outside those files.
`node e2e-test.mjs` drives both flows end-to-end and regenerates the new screenshots.
| Empty-state placeholders for P2–P3 surfaces | all other nav routes | Book III · §0.5 |

Try in the ⌘K palette: `Ctrl/⌘+K` — tabs Candidates / Vacancies / Actions, `Tab` switches.

## Design system

- **Tokens:** [`styles/tokens.css`](styles/tokens.css) — every token from Book I · Part III as CSS
  custom properties. The `.wb` scope is the inverted "white box you can see into." Accent swap is a
  single variable (`--accent-primary` → `--dune-gold` / `--ember`).
- **Elevation = 1px hairlines**, not shadows. Mono HUD labels, tabular numerals, corner-bracket
  hover marks, iris focus rings.
- **Materials as textures:** the 27-image mood set lives on in [`public/textures/`](public/textures)
  — topographic contour + HUD maps as work-surface backgrounds (6%), the halftone hand behind the
  HITL / trust moments, grain on white-box panels.
- **Two registers:** HR = dense keyboard-first instrument (graph-paper, contour maps); candidate =
  calm, spacious, single-action, reassuring. Never blurred.

## Deviations from the locked stack (deliberate, prototype-stage)

- shadcn/ui, TanStack Table/Query, GSAP, r3f are **not yet installed** — components are hand-rolled
  on the same tokens to keep the prototype dependency-light. They slot in at P2+ without visual
  change (tokens are law).
- The glowing cube is an inline SVG (the spec's static-fallback path); the r3f GLB hero is ticket T4.1.
- `shoot.mjs` is a dev-only Playwright script that regenerates `screenshots/`.
