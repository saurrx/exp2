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

## Entries

<!-- DSN-NNNN · <surface> · <date> · gates: … · evaluator: PASS/NEEDS_WORK ×n · next: … -->
