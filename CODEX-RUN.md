# Codex lane — GPT-6 Astra runs this repository

This repository (`saurrx/exp2`) is the GPT-6 Astra twin of the Claude Fable
run on `saurrx/pulse-design-review-decision`. Same product context, same
surface briefs, same coverage ledger, same cognitive-load charter, same
definition of done (RUN-GOALS.md). Different model, different scheduler,
different branch prefix (`codex/dsn-NNNN-<slug>`), separate PROGRESS.md and
DSN records, so the two lanes never touch each other's work. At the end the
two `main` branches are compared surface by surface.

## How it runs

A **Codex app scheduled task** on the founder's Mac, worktree mode, effort
medium, model GPT-6 Astra. The app is the scheduler: every firing is a fresh
Codex session that reads PROGRESS.md and continues. Codex has no
repo-committed Stop hook (the `.claude/settings.json` hooks are Claude-only
and inert here), so the completion contract lives in the prompt below and
in `/goal`, which Codex checks against evidence each turn.

### Create the scheduled task (once)

1. Codex CLI 0.128+ with goals on: `codex features enable goals`
   (or `[features] goals = true` in `~/.codex/config.toml`).
2. In the Codex desktop app: **Scheduled tasks → New**. Project: this repo's
   checkout. Mode: **worktree** (keeps each run off your working copy).
   Model: **GPT-6 Astra**. Reasoning effort: **medium**. Sandbox:
   **workspace-write**; approvals: **never** (the run is unattended).
   Schedule: hourly (`RRULE:FREQ=HOURLY;INTERVAL=1`). Prompt: the block below,
   verbatim.
3. Keep the Mac awake while it runs: `caffeinate -dims` in a terminal, lid
   open or on power with sleep disabled. The Mac is the server for this lane.
4. Pause with a file named `AGENT_STOP` at the repo root on `main` (the prompt
   checks it), or by pausing the scheduled task in the app.

### Prompt (paste verbatim)

```
/goal Every surface in design/v0/coverage.json has a non-null dsn, each landed under the definition of complete in RUN-GOALS.md, and PROGRESS.md ends with "RUN COMPLETE". Work toward that one surface at a time; stop this session only when a surface is complete and merged, when AGENT_STOP exists, when another run committed in the last 25 minutes, or when blocked after two retries with the block recorded in PROGRESS.md.

You are one firing of the Pulse V0 autonomous screen run, Codex lane (see CODEX-RUN.md). Read AGENTS.md, CLAUDE.md, .claude/rules/autonomous-run.md, RUN-GOALS.md, PROGRESS.md and STEER.md first. Then:

0. Environment: `git fetch --all && git checkout main && git pull --ff-only`. If `node_modules/.bin/vite` is missing run `npm ci --no-audit --no-fund`. If `node -e "require('playwright').chromium.executablePath()"` points at a missing file run `npx playwright install chromium`. If a file named AGENT_STOP exists at the repo root, stop.

1. Concurrency: `git log --all --since='25 minutes ago' --format='%h %cr %s'`. If any commit in the last 25 minutes came from another run (a codex/dsn-* branch or main with a DSN-numbered message you did not write), append one line to PROGRESS.md saying you yielded, commit, push, and stop.

2. Pick the surface: if STEER.md names a DSN to reopen, do that first on its branch (delete the STEER line when acted on, say so in PROGRESS.md). Else if PROGRESS.md names a surface in progress on a codex/dsn-* branch, check it out and resume from its last entry and changes/DSN-NNNN/README.md. Otherwise take the first surface in RUN-GOALS.md lane A whose dsn in design/v0/coverage.json is null (lane B after lane A), create branch codex/dsn-NNNN-<slug> from main, and write the persona frame into PROGRESS.md before touching code. Before the first surface, if `npm run test:v0` is red on main or the Ideas navigation badge renders for Photon Admin or Case Owner, fix those on branch codex/dsn-0000-preflight, merge to main, push, record it in PROGRESS.md.

3. Complete that surface exactly as the condition template in RUN-GOALS.md defines complete: three directions and the one chosen by cognitive load (design/v0/COGNITIVE-LOAD.md) recorded as a table in the DSN README; built in place in src/ to the visual language of the two reference screens (Workspace Admin Overview, Workspace Admin Ideas queue), using tokens and src/components/ui primitives, extending mock/ where the screen needs a route or field (declared in mock/proposed-*.json); every intended story id for the surface present under design/stories/surfaces/ and `npm run test:stories` shown passing; the legacy stories, QA journeys and baselines it replaces deleted; screenshots re-baselined with `node tools/design/shots.mjs --update --only <regex>` and copied into changes/DSN-NNNN/shots/, and the default-state shots opened and inspected; `npm run typecheck`, `npm run lint:roles`, `node tools/tokens.mjs --check`, `npm run test:v0` shown green; the evaluator run in a fresh context with `codex exec --sandbox read-only "$(cat .claude/agents/evaluator.md) Surface: <brief>. Persona: <persona>. Record: changes/DSN-NNNN/README.md."` until it prints VERDICT: PASS, at most three rounds, then mark needs-founder in PROGRESS.md and move on; dsn set in coverage.json, `node tools/design/v0-coverage.mjs --write` re-run; scorecard and cognitive-load check in the README.

4. Commit at every checkpoint on the codex/dsn-* branch and push it. When the surface is complete, merge into main with --no-ff, push main, append the recap to PROGRESS.md naming the next surface, and continue with the next surface in this session until stopped.

5. If every surface has a dsn, sweep the needs-founder surfaces once more, record what remains under "Needs the founder", write "RUN COMPLETE" at the end of PROGRESS.md, push, stop.

Rules that override anything else: never edit product-context/; never edit the two reference screens except to fix a defect this surface exposes, and say so; never add a dependency; never touch src/lib/realAdapter.ts, auth or analytics; unrelated bugs go under Follow-ups in PROGRESS.md; questions only the founder can answer go under "Needs the founder" with the assumption you proceeded on; no force-push or history rewrite on main; do not delete or rewrite AGENTS.md, RUN-GOALS.md or CODEX-RUN.md. Evidence is tool output in this session, never a description of work.
```

## Cost note

Effort medium on the founder's ChatGPT plan quota. A surface with 10–17
stories is a few hours of Codex time; one published report put 6.5 hours of
`/goal` at ~20% of a $100-plan weekly quota. If the weekly quota runs out
the scheduled task simply fails until it resets; nothing is lost because
every checkpoint is pushed.
