# WhiteBox: keep the assessment bound to its evidence

WhiteBox is a paused hiring-assessment project. Its public studio source and
retained development demo document an implemented workflow, while the National
Founder Cup deck documents the earlier pitch. Participation did not result in a
prize. [The event/version record](HACKATHON.md) separates those claims.

## A version is the reference point

Job analysis, criteria, evidence methods, assessment blocks, scoring anchors,
weights and governance are frozen when an assessment is published. A candidate
application and later review remain bound to the version they used. Updating a
vacancy does not redefine the evidence or rubric of an already submitted application.

The current public source uses Next.js and PostgreSQL, with isolated local demo
persistence for development. Ordered schema migrations, application versions
and tenant-scoped operations are part of the implementation, not just a UI plan.

## Recording, transcript and score have different jobs

The candidate can record and re-record locally before choosing an upload. The
server validates allowed media and attaches a receipt to the application and
turn. Production recording storage is private S3-compatible storage; playback
passes through an authenticated, tenant-scoped API.

Provider transcription is retained separately from a candidate's correction.
Hashes and receipts bind the selected text to its recording. Corrected/manual
text requires verification by an authorized reviewer; the current server also
requires that reviewer to open the exact recording before verifying its transcript.
The evaluation path receives the approved text and rubric, rather than using
appearance, gaze, accent or inferred personality as scoring features.

## Human action remains independently accountable

Evidence citations connect the review to answer passages. A human disposition
requires a reason and an audit event. An incomplete block or missing verification
must not become a fabricated completed assessment. Version binding, current
application state and reviewer access are checked on the server.

Retention is also a workflow: removing relational material and deleting storage
objects are tracked separately, with pending states and retry information. A
deployment still needs actual provider/storage configuration and operational
retention checks; a screenshot does not prove those operations have occurred.

## Public source and inspection route

- [Eye172 synchronization and local verification](../../PORTFOLIO-SYNC-2026-10-12.md): the imported dependency/test maintenance, 207 unit tests, production build and synthetic browser journey.

- [Studio source and quick start](https://github.com/pip00sya/whitebox-ai).
- [Development guide](https://github.com/pip00sya/whitebox-ai/blob/main/DEVELOPMENT.md):
  demo accounts, candidate journey, routes and existing tests.
- [Source-publication record](https://github.com/pip00sya/whitebox-ai/blob/main/docs/SOURCE-PUBLICATION.md):
  imported studio commit, original public head and publication maintenance.
- [Validation record](https://github.com/pip00sya/whitebox-ai/blob/main/docs/VALIDATION.md):
  207 unit tests, the browser journey, production build and the separately scoped dependency audit.
- [Deployment](https://github.com/pip00sya/whitebox-ai/blob/main/DEPLOYMENT.md) and
  [security boundary](https://github.com/pip00sya/whitebox-ai/blob/main/SECURITY.md).

The publication checks are dated 12 October 2026. They establish a tested code
path with synthetic records; they do not establish hiring validity, bias reduction
or legal certification. The included pitch's market figures and savings model
remain historical pitch material with their own assumptions and source labels.
