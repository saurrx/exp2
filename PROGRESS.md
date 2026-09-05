# V0 run — progress log (Codex lane, GPT-6 Astra)

This is the `saurrx/exp2` lane. The Claude Fable lane runs in
`saurrx/pulse-design-review-decision`; the two never share branches, records
or this file. Read this file and `STEER.md` at the start of every run.
Append at the end of every surface. Newest entry last. Keep it factual: what
landed, what the gates printed, what the evaluator said, what is next.

## Ledger

`design/v0/coverage.json` (`dsn` per surface), rendered in
`design/v0/COVERAGE.md`. Done = `dsn` set, every intended story exists and
passes, evaluator PASS recorded in the DSN README.

## Known state at the start (2026-09-05)

- Reference screens: Workspace Admin Overview (DSN-0002) and Workspace Admin
  Ideas queue (DSN-0004). Not to be redesigned.
- `npm run test:v0` fails on main: the `v0/inventor/portfolio` scenario has
  no complete (100%), unevaluated DRAFT owned by `inventor@northwind.test`.
  Preflight (CODEX-RUN.md step 2) fixes it.
- Defect: Ideas navigation badge renders for Photon Admin and Case Owner
  (Workspace Admin only). Preflight fixes it.
- Defect: the draft workspace stepper shows "Submitted" on an In draft idea.
  Fixed inside DSN-0006.
- Legacy pages (Patents, Actions, Due Dates, Workspace, Clients, Login) are
  untouched production screens; full redesign per RUN-GOALS.md.
- Branch prefix for this lane: `codex/dsn-NNNN-<slug>`.

## Needs the founder

(Questions the run could not answer; each with the assumption it proceeded on.)

## Follow-ups

(Bugs and improvements noticed outside a surface's scope. Not fixed by the run.)

- Preflight inspection: the current reference dashboard stat grid clips at 200% zoom. Preserve reference UI during unrelated surfaces; address under the dashboard state run if authorised. Legacy screenshots retain old vocabulary and the already recorded draft stepper defect.

## Entries

<!-- DSN-NNNN · <surface> · <date> · gates: … · evaluator: PASS/NEEDS_WORK ×n · next: … -->

- DSN-0000 · preflight · 2026-09-05 · In progress on `codex/dsn-0000-preflight`. Main reproduced the missing complete unevaluated Inventor draft (32/33 V0 tests pass); operational Ideas navigation also carries the forbidden badge. Restore that scenario state and restrict the badge to the existing review navigation. No reference screen changes. Dependencies installed; Chromium is available. Recent commits are lane setup, not another surface run.

- DSN-0000 · preflight · 2026-09-05 · Verified for merge: V0 33/33; stories 206/206; typecheck, role lint, tokens and Storybook build pass; selected gate runner 7/7 passed. Restored the missing unevaluated draft and removed operational Ideas badges. Repaired stale story selectors and removed retired gate invocations. Full two-render pass found 82 stale baselines, no unstable renders; baseline refresh passed, badge dashboards rechecked (Workspace Admin passed isolated retry). Both reference components unchanged. Next: DSN-0005 Inventor home.
