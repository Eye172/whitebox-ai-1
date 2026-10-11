# WhiteBox AI

**Development paused.** Built by [Shakhnazar Akhmer / Eye172](https://github.com/Eye172)
and [Nurkhan Aimukatov / pip00sya](https://github.com/pip00sya), team **QwertyS**,
for National Founder Cup. Participation without a prize.

[Product showcase, screenshots and demo](https://github.com/Eye172/whitebox-ai-1)
· [Companion showcase](https://github.com/pip00sya/whitebox-ai-showcase)

The default `p0-p1-build` branch contains the assessment-studio implementation.
`master` retains the earlier prototype; `pitch-deck-demo-video` holds competition materials.

WhiteBox AI is an explainable, human-in-the-loop hiring application for
job-related, multi-stage assessment. A vacancy freezes its job analysis,
criteria, evidence methods, assessment stages, BARS rubrics, weights and
governance into one version. Candidate submissions and reviewer scores stay
bound to that exact version, every score must cite source evidence, and a named
human remains responsible for the employment decision.

## Current release

The repository contains a working Next.js application with PostgreSQL-backed
vacancy versions, candidate sessions, consent, a frozen assessment runtime for
all supported block kinds, private file/video storage, AI transcription and
evidence review, deterministic answer-key handling, tenant-scoped human review,
and a hash-chained audit trail.

Recorded video is one possible published stage:

1. The candidate opens an invitation code and accepts the disclosed notice.
2. The system check requests camera and microphone access.
3. The browser uses `getUserMedia` and `MediaRecorder` to capture one answer at a
   time. The candidate can stop, review, and re-record locally before choosing
   **Use recording**, which begins the secure upload.
4. Each multipart upload is limited to 24 MiB in total. The server accepts only
   `video/webm` or `video/mp4` and validates the declared type and container
   signature. Outside development demo mode, FFprobe must also find decodable
   video and audio tracks within the allowed duration before private storage.
5. `OPENAI_TRANSCRIBE_MODEL` (default: `gpt-4o-transcribe`) creates a transcript.
   The server stores that provider transcript immutably and signs its SHA-256 into
   the recording receipt. A candidate correction is stored separately with its
   own hash, reason, and compact diff metadata. Unchanged provider text is eligible
   for scoring; corrected or manually entered text must first be verified against
   the clip by an authorized human reviewer.
6. Production uses FFprobe only to verify that the upload has decodable audio
   and video tracks and fits the published duration. The application does not
   extract candidate frames or infer reading, gaze, emotion, appearance, accent,
   identity, or personality from camera/microphone data.

A text-only accessibility accommodation is available before and during the
interview. The selected mode is persisted in application state and mode changes
are audited. It uses the same questions and rubrics, is not penalized, disables
recording, and is enforced by the server. Video mode requires a valid recording
receipt for every submitted answer.

### Privacy boundary

- Production recordings go to a private S3-compatible bucket through server-side
  SigV4 requests. No bucket URL or presigned object URL is returned to the browser.
- HR playback is served through an authenticated, tenant-scoped, same-origin API
  proxy with private/no-store headers.
- Development demo mode can store files under `.data/recordings`. This local
  filesystem backend is deliberately unavailable in production and is ignored by
  Git.
- Appearance, voice characteristics, gaze, emotion, background, and alleged
  reading behavior are not collected as evaluation signals. The scoring provider receives only a
  server-selected provider-verified or human-verified transcript and the
  published rubric.
- Production media probing uses a private temporary directory. The temporary
  clip is deleted after FFprobe validation.
- Recording and provider retention must match the notice shown to the candidate.
  See the deletion workflow and operational requirements in
  [DEPLOYMENT.md](DEPLOYMENT.md#retention-and-deletion).

## Run the development demo

Requirements: Node.js 24 and npm. FFprobe is also required when exercising the
production media-validation path; the development demo does not require it.

Create `.env.local` with only development-safe settings:

```dotenv
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3100
WBX_DEMO_MODE=true
```

Then run:

```sh
npm ci
npm run dev -- --port 3100
```

Open `http://localhost:3100`.

- Candidate code: `WBX-3N8D`
- Already-submitted candidate code: `WBX-7Q4K`
- HR login: `admin@whitebox.local`
- HR password: `WhiteBox!2026`

The legacy demo records real browser media to the private local demo directory,
but its deterministic compatibility provider does not send it to OpenAI:
transcription is left for manual entry. Manual demo transcripts deliberately fail
closed until an HR reviewer opens **Review transcripts**, compares each clip, and
records a human verification. Use synthetic people and answers only.

### Real-AI rollout boundary

AI authoring endpoints are real-provider-only: they never return deterministic
vacancy, criteria, or question text when OpenAI is unavailable. In local
development, when `OPENAI_API_KEY` is not already set, the server may read a key
from an ignored root `API.md` line named `open_ai_api`. `API.md` is excluded from
both Git and the Docker build context; production never reads it and must receive
`OPENAI_API_KEY` from a managed server-side secret.

At first publication the server, not the browser, stamps a new vacancy ID with
the immutable `openai_required` policy. Its interview questions, adaptive turn
generation, transcription, and rubric evaluation fail closed if the real
provider is unavailable; no deterministic output is substituted. Vacancy configs
created before this rollout have no marker and deliberately retain their previous
deterministic behavior, even when a real key is configured. Later versions keep
the policy assigned to the original vacancy ID, so a client publish payload
cannot upgrade or downgrade historical results.

## Validate

```sh
npm run lint
npm run typecheck
npm run test
npm run build
```

With the application running on port 3100:

```sh
npm run test:e2e
```

The browser journey uses synthetic camera and microphone devices. It does not
access a developer's real camera. Screenshots go to the operating-system
temporary directory by default; set `WBX_E2E_OUTPUT` or pass a path argument to
keep them elsewhere.

## Production configuration

Production requires all of the following:

- PostgreSQL and every migration in `db/migrations/`, through
  `008_reference_checks.sql`;
- `WBX_DEMO_MODE=false`, independent signing secrets, and a bootstrap HR owner;
- `AI_PROVIDER=openai`, an OpenAI API key, an evaluation model, and a
  transcription model;
- FFprobe installed in the runtime image (or an explicit executable path in
  `WBX_FFPROBE_PATH`) so the readiness probe and server-side A/V verification
  can succeed;
- a trusted ingress that strips and overwrites the configured
  `WBX_TRUSTED_PROXY_HEADER`; PostgreSQL holds atomic shared rate-limit counters;
- an HTTPS S3-compatible endpoint, private bucket, narrowly scoped credentials,
  and server-side encryption;
- a verified recording deletion workflow and storage lifecycle safety net;
- legal/privacy approval for the candidate notice, retention period, assessment
  methods, and provider processing.

Use [DEPLOYMENT.md](DEPLOYMENT.md) as the production runbook and
[SECURITY.md](SECURITY.md) for the media and hiring-AI security boundary.

## Retention readiness

`npm run retention:run` atomically removes expired candidate identity, consent
telemetry, answer/transcript rows, reference responses, free-text decision
reasons, and evaluation output, then replaces application state with a minimal
tombstone. Audit records retain reason hashes rather than the free text. The
worker moves applications with outstanding objects to `object_delete_pending`. A
separate queue deletes private S3 or local objects with capped exponential
backoff. An application becomes `complete` and receives
`retention_completed_at` only after every associated recording row is `deleted`.
Failed object deletions preserve their attempt, next-attempt, and safe error
metadata and make the attempted run exit non-zero. `npm run retention:verify`
performs a read-only check of these state-machine invariants.

The Compose topology includes a dedicated non-root scheduler with a freshness
health check. Production still requires alerting on every non-zero run and
overdue `delete_pending` row, independent object/metadata reconciliation, a
backup aging policy, and a staging erasure drill. Passing those operational
checks is a go-live requirement; merely starting the worker is not evidence that
a deployed retention policy works.

Production startup is fail-closed: before importing the standalone HTTP server,
the launcher verifies non-placeholder environment values, required PostgreSQL
tables/columns and connectivity, FFprobe, and private-storage reachability.

## Main routes

| Surface | Route |
| --- | --- |
| Candidate code entry | `/` |
| Candidate device check and consent | `/interview/check` |
| Recorded interview | `/interview/live` |
| Candidate status | `/status` |
| Secure referee questionnaire | `/reference/:opaqueToken` |
| HR login | `/login` |
| HR dashboard | `/dashboard` |
| Vacancies | `/vacancies` |
| Candidate ranking | `/vacancies/:id/ranking` |
| HR transcript provenance review | `/vacancies/:id/applications/:applicationId/transcripts` |
| Candidate scorecard | `/vacancies/:id/candidates/:candidateId` |
| Liveness probe | `/api/health/live` |
| Production readiness probe | `/api/health/ready` |

## Repository map

| Path | Purpose |
| --- | --- |
| `app/` | Next.js pages and API routes |
| `lib/server/ai-provider.ts` | Vacancy authoring, interview routing, transcription, and evidence-evaluation providers |
| `lib/server/media.ts` | Upload validation, private storage, receipts, playback reads, and deletion primitives |
| `lib/server/transcript-provenance.ts` | Transcript hashing, correction diffing, fail-closed selection, and human verification |
| `lib/server/reference-checks.ts` | Expiring single-use referee invitations and immutable structured-response receipts |
| `lib/server/video-analysis.ts` | FFprobe A/V track and duration verification |
| `lib/server/repository.ts` | PostgreSQL and development-demo persistence |
| `db/migrations/` | Relational schema, recording metadata, and the video-only media constraint |
| `scripts/migrate.mjs` | Ordered transactional migrations and owner bootstrap |
| `scripts/retention-worker.mjs` | Current relational-data retention worker |
| `e2e-test.mjs` | Candidate and HR browser journey |
| `styles/tokens.css` | Visual design tokens |
| `WhiteBoxAIMASTERDOC.md` | Product and design reference |
