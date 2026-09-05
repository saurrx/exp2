# DSN-0000 — V0 preflight

Status: in progress on `codex/dsn-0000-preflight`.

Restore the two explicitly named prerequisites for the screen run. The Inventor must be able to submit a complete idea without evaluation; Case Owner and Photon Admin navigation must not badge Ideas.

## Changes

- Add a deterministic complete, unevaluated Inventor draft to the existing V0 Northwind scenario builder, preserving its other draft and evaluation states.
- Remove the review count from the shared operational Ideas navigation item.
- Keep routes, permissions, query hooks, adapter, auth, analytics and both reference screen components unchanged.

This is a defect correction, not a material surface redesign; three layout directions and a surface coverage entry do not apply.

## Evidence from 2026-09-05

- Before: `npm run test:v0` failed its complete unevaluated draft assertion (32/33 passed).
- After: `npm run test:v0` passes 33/33 tests in three files.
- `npm run typecheck`, `npm run lint:roles`, `node tools/tokens.mjs --check` pass.
- `npm run storybook:build` succeeds.
- Initial `shots.mjs --twice` validation is in progress. Opened the current and committed Workspace Admin typical screenshots: the existing baseline shows older navigation, map shading and dashboard content. The reference source was not edited by this change. Baseline reconciliation and stability results remain pending.

Environment: clean `npm ci --no-audit --no-fund`; existing Playwright Chromium 1234. Host Node is 25.2.1 while the repository requests 22; npm reports an engine warning. No dependency or lockfile changes.
