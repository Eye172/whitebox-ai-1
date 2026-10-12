# Companion update and local verification — 12 October 2026

This update imports presentation material and maintenance from
[pip00sya/whitebox-ai at fd75cf6](https://github.com/pip00sya/whitebox-ai/commit/fd75cf6e9dcee56751bff83ce93d3741b5c9ae87)
and its companion showcase. QwertyS authorship remains Shakhnazar Akhmer / Eye172
and Nurkhan Aimukatov / pip00sya.

The dependency manifests bring Next.js and its ESLint configuration to 15.5.27
and retain the upstream PostCSS override. The browser test now follows the
current connection-recovery message, requires actual recording playback before
transcript verification, and locates the evaluated candidate by the pseudonymous
candidate identifier. Production application logic is unchanged by this sync.

## Verified in a fresh local checkout

| Check | Result |
|---|---|
| Locked dependency installation | Passed |
| ESLint and TypeScript | Passed |
| Unit tests | 207 passed, 0 failed |
| Retention state-machine dry verification | Passed |
| Next.js production build | Passed, 15.5.27 |
| Browser journey | Passed: six synthetic recorded answers, 722,378 uploaded bytes; private playback, transcript verification and audited human decision |
| Showcase links and media hashes | Checked against retained source materials |

The browser journey ran against an isolated local development server with
`WBX_DEMO_MODE=true` and `AI_PROVIDER=disabled`. It did not use a live AI provider
or real applicant records. Generated recordings, local data, dependencies and
screenshots are not part of the published repository.

On this Windows machine the default temporary directory contains an inaccessible
system folder. The build passed with process-local `TEMP` and `TMP` pointing to
an isolated writable directory; no system permissions or project source were
changed to work around that environment issue.

These checks establish the preserved development workflow, not production
deployment, hiring validity or a completed external-service integration.
