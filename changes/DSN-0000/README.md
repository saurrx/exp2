# DSN-0000 — V0 preflight

Status: verified for merge from `codex/dsn-0000-preflight`.

Restore the two explicitly named prerequisites for the screen run. The Inventor must be able to submit a complete idea without evaluation; Case Owner and Photon Admin navigation must not badge Ideas.

## Changes

- Add a deterministic complete, unevaluated Inventor draft to the existing V0 Northwind scenario builder, preserving its other draft and evaluation states.
- Remove the review count from the shared operational Ideas navigation item.
- Keep routes, permissions, query hooks, adapter, auth, analytics and both reference screen components unchanged.
- Remove the retired fingerprint and export-path checks from the active gate runner, as required by CLAUDE.md. The historical files remain untouched.

This is a defect correction, not a material surface redesign; three layout directions and a surface coverage entry do not apply.

## Evidence from 2026-09-05

- Before: `npm run test:v0` failed its complete unevaluated draft assertion (32/33 passed).
- After: `npm run test:v0` passes 33/33 tests in three files.
- `npm run typecheck`, `npm run lint:roles`, `node tools/tokens.mjs --check` pass.
- `npm run storybook:build` succeeds.
- `npm run test:stories` passes all 206 tests in 51 files. Existing selectors required repair: scope Submitted to its column header, wait for the asynchronously populated score header, match the toggle's lowercase accessible names, and assert the legacy navigation's current Ideas label and destination. No product component was changed for those assertions.
- Initial `shots.mjs --twice` completed all 171 screenshots: 82 baseline differences, zero unstable renders and no reported egress. Opened the current and committed Workspace Admin typical screenshots, Case Owner and Photon Admin dashboards, and contact sheets of the comparison artifacts. The existing baselines show older navigation, map shading and dashboard/review compositions. Reference source was not edited by this change. `shots.mjs --update --only <82 differing story ids>` succeeded; unchanged baselines were retained. The three badge-related dashboards were compared again across two renders: operational dashboards matched; Workspace Admin initially differed by 498 pixels between renders while other verification ran, then passed alone on retry without a tolerance change.
- `node tools/design/gates.mjs --only typecheck --only v0 --only tokens --only stories`: **7/7 passed**. The informational isolation probe warns that parallel story frames share identity; story tests remain serial.

## Follow-ups for the planned surface work

The reference dashboard at 200% zoom visibly clips its wide stat grid. Legacy screens retain old vocabulary and draft progress problems. These are not fixed in preflight; the surface run's scope and reference-screen rules remain authoritative. Updating initial baselines records the current source and is not a design approval of these states.

Environment: clean `npm ci --no-audit --no-fund`; existing Playwright Chromium 1234. Host Node is 25.2.1 while the repository requests 22; npm reports an engine warning. No dependency or lockfile changes.
