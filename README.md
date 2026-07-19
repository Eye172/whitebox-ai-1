# WhiteBox AI — Explainable AI Hiring Operating System

> *"Vertical AI, built for fair hiring. Not a faster black box — a white one you can see into."*

WhiteBox AI is a **two-sided hiring platform for the first screening stage** that replaces the opaque
algorithmic *black box* with an explainable, controllable, professionally-configurable evaluation
system — and keeps the human as the final decision-maker.

## The problem

Companies receive hundreds to thousands of applications per role and rely on AI/ATS screening that
decides who reaches a human — as a black box:

- Candidates never learn **why** they were rejected.
- Recruiters cannot see **which factors** drove a score.
- Different LLMs rank identical résumés differently, and hidden bias gets **replicated, not corrected**.
- Most tools over-index on résumé keywords while leadership, critical thinking, communication and
  growth potential are barely assessed.
- Regulators now treat hiring AI as high-risk (EU AI Act; NYC Local Law 144 bias audits), but
  companies have no auditable way to prove fair screening.

## The one differentiator

Competitors (HireVue, Mercor, BrightHire, Ashby scorecards) already solved per-competency scoring,
rubric-driven interviews and blind feedback. **None does the one thing WhiteBox exists for** — every
score ships with:

1. **Ranked drivers** — the top factors that pushed a score up or down, modeled on the
   FICO/VantageScore *reason-code* approach — the only legally tested model of explainable
   adverse action.
2. **Confidence as a phrase**, not a bare number.
3. **Evidence chips** tying each score to actual interview fragments.
4. A **collapsible reasoning trace** — the full path from answer to score.
5. A **mandatory human exit** (accept / change / recompute / reject with reason) written to an
   **append-only, hash-chained audit log**.

The AI never makes the final decision. It *structures information*; the human decides.
When any design decision is ambiguous, the tie-breaker is:
*does this make the reasoning more visible and more contestable?*

## What's built (working prototype, P0 + P1)

Built from **[WhiteBoxAIMASTERDOC.md](WhiteBoxAIMASTERDOC.md)** — the single source of truth
(Books I–V: product vision, visual system, HR spec, candidate spec, build sequence).

| Surface | Route | Spec |
| --- | --- | --- |
| HR app shell — 264px sidebar (3 zones), 52px top bar, ⌘K palette | all HR routes | Book III · §0 |
| Global Dashboard — KPI strip, vacancy cards, HITL attention queue, cube anchor | `/dashboard` | Book III · §1 |
| Candidate Ranking — 10-column table, expandable rows, bulk bar, tiers | `/vacancies/vac-001/ranking` | Book III · §5 |
| Candidate Scorecard — 6 tabs; **ranked drivers, confidence-as-phrase, evidence chips, collapsible trace**; HITL inspector with equal-weight Accept/Change/Recompute/Reject + reason → append-only hash-chained activity log | `/vacancies/vac-001/candidates/CND-4A19` | Book III · §6, Book I · Part VIII |
| Create Vacancy wizard — NL→config with per-field "why" chips, weight sum=100 validation, publish → competition code | `/vacancies/new` | Book III · §2 |
| Candidate Code Entry — calm register, cube-lit, disabled-until-valid | `/` | Book IV · §1 |
| System Check gate — device checks + consent, Start disabled until all pass | `/interview/check` | Book IV · §4 |
| AI Interview — cube-as-presence, adaptive follow-ups, gentle progress | `/interview/live` | Book IV · §5 |
| Candidate Status — progress rail, dignified copy, inverted white-box trust panel | `/status` | Book IV · §7 |

**Demo codes:** `WBX-3N8D` — new competition (interview flow); `WBX-7Q4K` — already-submitted
application (status). Codes published from the wizard also work.

## Run

```bash
npm install
npm run dev        # http://localhost:3000
```

Screenshots of every surface are in [`screenshots/`](screenshots).
`node e2e-test.mjs` drives both flows end-to-end and regenerates them.

## Design system

- **Brand object:** a white, transparent, glowing cube — light passes through = explainability in
  one image. Dark base (`--void #060608`), white-on-top dominant, **invertible white-box panels**
  ("a white box you can see into") for explainability and trust moments.
- **Tokens are law:** [`styles/tokens.css`](styles/tokens.css) — every token from Book I · Part III.
  Iridescent/prism primary accent, swap-ready to `--dune-gold` / `--ember` via one variable.
- **Elevation = 1px hairlines**, not shadows. Mono HUD labels, tabular numerals, corner-bracket
  hover marks, iris focus rings.
- **Two registers:** HR = dense, keyboard-first instrument (graph-paper, contour maps);
  candidate = calm, spacious, single-action, reassuring.

## Architecture & stack

**Now (prototype):** Next.js 15 (App Router) + TypeScript + Tailwind, hand-rolled components on the
token system, typed AI stubs in [`lib/ai.ts`](lib/ai.ts) implementing the exact contracts from
Book V · §V.3 — swapping stubs for real LLM calls changes nothing outside those files.

**Locked target stack (Book V):** FastAPI (Python) AI core + Next.js BFF · PostgreSQL + pgvector ·
Redis · Temporal durable workflows (interview → transcription → scoring → explainability) ·
Claude / GPT-4-class LLMs with task-based routing, open models via vLLM where data residency
requires · LangGraph orchestration · Instructor structured output · Langfuse observability ·
Fairlearn/Aequitas bias testing · WorkOS auth/SSO · S3-compatible storage with lifecycle
auto-delete.

## Roadmap

- **P0 — Foundation** ✅ tokens, app shell, states, white-box primitive
- **P1 — Core differentiator** ✅ ranking, scorecard (drivers/confidence/evidence/trace), HITL + audit log
- **P2** — vacancy wizard polish, competency builder, onboarding, full interview flow
- **P3** — real AI pipeline (FastAPI + LangGraph), transcription, scoring, bias monitoring
- **P4** — r3f glowing-cube hero, motion system, hardening

## Repository map

| File | Purpose |
| --- | --- |
| [WhiteBoxAIMASTERDOC.md](WhiteBoxAIMASTERDOC.md) | Single source of truth — Books I–V |
| [HRSpec.md](HRSpec.md) | HR-side screen spec (13 screens) |
| [CandidateSpec.md](CandidateSpec.md) | Candidate-side screen spec (7 screens) |
| [WhiteBoxAIResearch4.md](WhiteBoxAIResearch4.md) | Upstream research conspectus |
| `app/` `components/` `lib/` `styles/` | The working prototype |
