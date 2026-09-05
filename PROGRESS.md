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

- DSN-0005 · Inventor home · 2026-09-05 · In progress on `codex/dsn-0005-inventor-home`; DSN-0000 merged and pushed as ce33ded. Persona frame: Anika Sharma, an occasional Inventor returning to scattered ideas after engineering work. Object: her own/credited idea, in draft or a review/filing state. Job: find what happened and the next step, or start another idea. Primary action: Submit an idea, opening the existing start flow; consequence: a draft, not immediate submission to review. Success signal: more starts and completed submissions without confusion about review ownership.
  Roleplay before build: (1) First glance must be My ideas and the primary action. (2) One thing is starting an idea, with each existing idea's next step adjacent. (3) Read title and one next-step sentence; skip pipeline and company context until needed. (4) Remember no score/status across panels. (5) Never show due dates, Actions, named rankings or firm metrics. (6) Explain once that starting creates a draft and review follows when the inventor submits. Directions and state coverage will be recorded before UI edits.

- DSN-0005 · Inventor home checkpoint · 2026-09-05 · Built and rendered all 10 states, 23 baselines plus company context. Stories 214/214, V0 33/33 and selected gates 7/7 passed. Evaluator round 1 NEEDS_WORK: missing zoom navigation and non-persistent primary action. Both corrected through the existing sticky header slot; navigation menu and primary-action persistence measured at five widths with no horizontal overflow. Second evaluation pending; coverage dsn remains null until PASS.

- DSN-0005 · Inventor home · 2026-09-05 01:23 UTC · COMPLETE: merged with --no-ff as b2ee9b5 and pushed to main. All 10 intended stories exist; 214/214 story tests, 33/33 V0 tests, typecheck, role lint, tokens, app/Storybook builds and final selected gates 7/7 pass. Evaluator: NEEDS_WORK ×1, then VERDICT: PASS with every score 4 and no findings. 23 refreshed baselines plus 3 supplemental screenshots; all five viewport checks pass, primary action persists, zoom navigation is available. Coverage records DSN-0005 (2/17 surfaces now have a dsn). Preflight DSN-0000 also merged this run. Next surface: DSN-0006 Start an idea + Invention disclosure workspace; no surface remains in progress.

- Autonomous firing · 2026-09-05 01:45 UTC · Yielded under the 25-minute concurrency rule: another run committed e8bdae6 (DSN-0006 disclosure directions) 17 minutes before this check; DSN-0006 remains in progress on `codex/dsn-0006-disclosure-workspace`. Existing uncommitted surface work preserved.
- DSN-0006 · Start an idea + Invention disclosure workspace · 2026-09-05 · In progress on `codex/dsn-0006-disclosure-workspace`. Previous turn completed and merged DSN-0005; this turn advances the next surface. Persona: Anika Sharma, an occasional Inventor bringing engineering notes; Workspace Admin may capture on behalf of an inventor. Object: one active disclosure draft. Job: turn supported source material into a credible disclosure, fill the gaps, submit it for Workspace Admin review. Primary action: Continue to disclosure at capture, Submit for review in the workspace. Consequence: starting saves a draft; submitting freezes the reviewed revision. Success: higher start, completion and completed-to-submitted conversion without fabricated answers.
  Roleplay: (1) First glance is paste/upload for a thin draft, otherwise the next missing answer. (2) Submission leads once required answers exist, independent of evaluation. (3) Read invitation, source, title; then one open narrative section and adjacent readiness. (4) No score or gap must be remembered across screens. (5) No filing stages, scores repeated in the footer, administrative dates or metrics. (6) One visible save state and a plain sentence explain who receives the disclosure. Existing code gates submission behind scoring and clears pasted text after extraction failure; these brief-covered defects will be corrected in place.

- DSN-0006 · implementation checkpoint · 2026-09-05 · Both surfaces built in place with 27 V0 stories and 60 refreshed baselines plus two zoom interaction screenshots. Full story suite 234/234; V0 33/33; typecheck, roles, tokens, builds and selected gates 7/7 pass. Browser probes proved unevaluated and low-score submission, frozen versions and on-behalf attribution; five-width probes found no horizontal overflow and primary actions within the viewport. Replaced legacy draft stories, baselines and disclosure journey removed. Fresh evaluator pending; both coverage entries remain null.

- DSN-0006 · Start an idea + Invention disclosure workspace · 2026-09-05 02:06 UTC · COMPLETE: merged with --no-ff as 55e1c7c and pushed to main. Material-first intake, supported extraction, autosave/recovery, revision comparison, on-behalf attribution and score-independent submission now have 27 V0 stories. Evaluator NEEDS_WORK ×2 then PASS, all scores 4, no findings or missing states. Final story suite 234/234, V0 33/33, builds, roles, tokens and selected gates 7/7 pass; 60 baselines and 12 supplemental screenshots inspected. Both coverage entries record DSN-0006 (4/17 surfaces). Preserved the concurrent firing’s yield entry during merge. Next: DSN-0007 Evaluation result; no surface remains in progress.

- DSN-0007 · Evaluation result · 2026-09-05 · In progress on `codex/dsn-0007-evaluation`. Previous turn made concrete progress by merging DSN-0006. Persona: Anika Sharma, an occasional Inventor checking whether her disclosure explains the distinction clearly; Workspace Admin reads the same evidence in decision context. Object: advisory evaluation of a disclosure revision. Job: understand the assessment and strengthen technical detail before submitting. Primary action: Return to disclosure to improve it; Submit for review remains available at every score. Consequence: edits change the draft and can make the evaluation stale; re-evaluation is optional. Success: stronger completed submissions without reducing submission volume.
  Roleplay: (1) First glance is score, band and plain meaning. (2) One thing is understanding what to improve, then returning to the disclosure. (3) Read assessment, two or three differences and concrete questions; skip detailed references until needed. (4) Keep each reference’s overlaps, differences and supporting evidence together. (5) No legal drafting instructions, duplicated scores, cutoff, dates or ranking of inventors. (6) State once that the assessment is AI-assisted/advisory and preserve submitted ownership and draft edits. Three directions and rendered sketches precede UI changes.

### DSN-0007 implementation checkpoint
Assessment brief implemented in the existing report and draft rail. Shared report order is score/band/meaning, differences, strengthening prompts, closed prior art. Server status replaces simulated progress; submission remains available for all states. Focused synthetic evaluation scenarios and twelve required states plus Workspace Admin coverage are in place. Three evaluation-only legacy stories/baselines retired. Full stories 244/244, V0 33/33, typecheck, role/token checks, both builds and stable scoped screenshots passed; final selected gate underway. Five default viewports and expanded evidence/zoom return paths inspected. Independent evaluator next; coverage dsn remains null until PASS.

### DSN-0007 evaluator correction checkpoint
Round 1 NEEDS_WORK identified action emphasis, offscreen re-evaluation confirmation, and ambiguous loading recovery. Return to disclosure now has primary emphasis with initial focus on the dialog heading; re-evaluation brings its actual status into view; loading failure offers Reload evaluation without a competing start action. Updated story assertions cover the status viewport position and explicit recovery. Refreshed screenshot evidence inspected: confirmation is visible at both widths, default report at all five viewports, and return/submit at 200% zoom. Final selected gates 8/8, design build, Storybook build, and screenshots pass. Storybook's transient generated-font EEXIST copy failure passed on retry. Fresh evaluator round 2 running; coverage remains pending.

### DSN-0007 ready to merge — evaluator PASS
Round 2 inspected all 39 V0 PNGs and returned PASS: all seven scorecard categories 4; cognitive load pass; findings none; missing states none; reference match yes. Final output is pasted verbatim in changes/DSN-0007/README.md. All eight selected gates pass; full stories 244/244 and V0 33/33, both builds pass, refreshed screenshots stable with no egress. Evaluation result coverage now points to DSN-0007. No product-context, adapter, auth, analytics, query-hook, dependency or approved-reference edits. Merge and final recap next.

## DSN-0007 merged recap
Evaluation result is complete and merged to main with --no-ff (dbcd679), pushed to origin. Assessment, differences and strengthening prompts lead; prior-art evidence is progressively disclosed; actual status, explicit reload and visible re-evaluation confirmation support recovery without gating submission. Evaluator round 2 PASS, all seven scores 4, no findings or missing states; 39 V0 screenshots inspected. Full stories 244/244, V0 33/33, selected gates 8/8, design/Storybook builds and stable screenshots pass. Coverage is now 5/17 surfaces complete. No founder decision required.

Next surface: **DSN-0008 — Idea detail and status** (`product-context/surfaces/idea-detail.md`), all four personas. Overall RUN COMPLETE condition remains unmet; continue after the normal steering and concurrency check.

- DSN-0008 · Idea detail and status · In progress on `codex/dsn-0008-idea-detail`. Previous goal turn is progress: DSN-0007 merged and coverage reached 5/17. Persona frame: Anika (Inventor) checks feedback and her next step; Leah (Workspace Admin) needs a decision-ready brief; Devika (Case Owner) and Photon Admin need scoped ownership, attachments and a usable filing brief. Object: one idea and its reviewed disclosure revision. Primary action changes with the legitimate next step: update disclosure, decide/send to Photon Legal, record filing, or open the linked patent; otherwise read the disclosure. Consequence is stated next to the action. Success: confidence after submission, efficient review and an accurate filing handoff.
  Cognitive roleplay: (1) First glance must be reference/title, current status and next-step sentence. (2) One primary action for the current persona/state, with no implied completed stages. (3) Read a concise brief and ownership; open disclosure, evidence, attachments and history only when needed. (4) Keep each decision/comment with its actor, revision and date; do not compare repeated scores across panes. (5) Inventors never need due dates, Actions, legal workflow internals or named rankings. (6) Explain who owns the next step and whether the current version is editable; distinguish the real inventor from the submitter.
  Pre-build findings: detail currently shows legacy stages and a large questionnaire. Mock patent_link is always null despite stored links; attachments/history need real route-backed data. Rejected disclosures currently cannot be edited, contrary to WORKFLOWS section 4; correct that within the existing author scope and require a reconsideration note on resubmission. The shared evaluation band thresholds are 7/4/2 but PRODUCT-VOCABULARY requires 8/6/4; correct this exposed defect and refresh affected evidence. No product-context changes are required.

- Autonomous firing · 2026-09-05T02:45:32.281037+00:00 · Yielded under the 25-minute concurrency rule: another run committed 82ae40b (DSN-0008 idea detail directions) within the exclusion window; DSN-0008 remains active on `codex/dsn-0008-idea-detail`. Existing uncommitted surface work preserved; yield recorded from an isolated main worktree.

### DSN-0008 implementation checkpoint
Status brief built in place. All 17 intended state stories plus Photon Admin, long content and recovery states. Mock links, scoped files/history and rejected revision flow implemented; BF-8 declared. First full stories 254/254; semantic checks 36/36. Render review caught and corrected desktop zoom overflow, action visibility and cached resubmission history. Final render/evaluator review pending.

### DSN-0008 evaluator PASS
Round 2 inspected all 77 PNGs and returned PASS across Inventor, Workspace Admin, Case Owner and Photon Admin; every scorecard category 4, no findings or missing states. Assessment and saved-revision freshness are explicit; access recovery is inline. BF-8 file association and BF-9 evaluation attribution are declared. Full stories 256/256, V0 38/38, final active gates 7/7 with stories run separately, builds and stable screenshots pass, focused axe has zero findings. Coverage set to DSN-0008 (6/17). Ready to merge; no founder decision required.

## DSN-0008 merged recap — 2026-09-05 03:15 UTC
Idea detail and status is complete and merged to main with --no-ff (fba4fe3), pushed to origin. Status, ownership and the current action lead for all four personas; disclosure, evaluation evidence, files and history open on demand. Recorded evaluation freshness survives revision and resubmission. Review decisions, reconsideration with history, file download, and filing-to-patent linkage were exercised. Evaluator NEEDS_WORK once, then PASS with all seven scores 4, no findings or missing states, and 77 screenshots inspected. Full stories 256/256, V0 38/38, final active gates 7/7 plus the separately passing stories, both builds, stable screenshots and focused axe pass. Coverage is 6/17. Preserved the concurrent firing's yield entry during the PROGRESS-only merge conflict. No founder decision required.

Next surface: **DSN-0009 — Ideas list** (`product-context/surfaces/ideas.md`): Inventor, Case Owner and Photon Admin variants; the Workspace Admin reference receives its V0 stories. No surface remains in progress. The overall RUN COMPLETE condition remains unmet.

- Autonomous firing · 2026-09-05T03:45:02.770589+00:00 · Yielded under the 25-minute concurrency rule: another run committed 51b4e02 (DSN-0009 Ideas list implementation) within the exclusion window; DSN-0009 remains active on `codex/dsn-0009-ideas-list`. Existing uncommitted baseline deletions preserved; yield recorded from an isolated main worktree.

## DSN-0009 — Ideas list in progress
Previous goal turn made progress: DSN-0008 merged, coverage 6/17. Steering empty; recent commits are this run's own DSN-0008 checkpoints. Persona: occasional Inventor Anika finds her drafts and submissions; Case Owner Devika locates received work for assigned clients; Photon Admin Tobias oversees received ideas across clients. Workspace Admin Leah continues to clear the approved reference queue. Product object: an idea row linking directly to its disclosure/status. Primary action: Submit an idea for Inventor; open the next received idea for Photon roles; the reference keeps its decision action. Consequence: rows open the existing record, editable drafts continue in disclosure. Success: quicker retrieval and fewer unclear handoffs, without exposing another inventor's ideas or expanding client scope.
Roleplay: (1) First glance is title and status/next step for Inventor, client and received work for Photon. (2) One primary action starts an idea or opens the next relevant record. (3) Read the row title, status, update, score and next action; Photon instead prioritizes client and owner. (4) Keep attribution and client beside the idea; preserve filters when navigating. (5) No Inventor dates due, Actions, rankings, operator stage controls, density settings or preview pane. (6) Name who owns the next step and explain empty/filtered/error states inline. Three directions precede UI changes. Brief path is surfaces/ideas.md (the prior recap used the slug as its path; corrected).

### DSN-0009 implementation checkpoint
Ideas list built in place with eleven V0 stories. Inventor state/score/next step and Photon client/Case Owner context lead; local draft query envelope and URL-encoded search corrected. BF-10 declares derived Case Owner names. Full stories 263/263, V0 38/38, required selected gates 7/7, roles/tokens/builds pass; focused axe eight contexts zero. Browser probes verify direct routes, search restoration, filtering and all twenty viewport/action bounds without egress. Reference queue exception: fixed the demonstrated 200% zoom clipping with compact queue/brief selection and navigation; its desktop design and mutations remain. Final compact-filter screenshots and independent evaluator pending. Coverage remains 6/17.

### DSN-0009 evaluator corrections
Round 1 NEEDS_WORK: transient menu captures, placeholder/missing review content, repeated selected title/score, and first-run retrieval controls. All corrected: opaque reduced-motion menus with settled captures; canonical disclosure field reads and substantive scenario evidence; selected reference cue; genuinely empty first-run controls omitted. The reference changes fix those documented defects and preserve the two-pane arrangement and decision mutations. Repeated Storybook public-copy race fixed in its build configuration after two failures. Round 2 verification: stories 263/263, V0 38/38, selected gates 7/7, builds, stable captures, twenty geometry probes and focused axe pass. Fresh evaluator round 2 next; coverage remains pending.

### DSN-0009 final review checkpoint
Round 2 found one remaining trust issue: the Workspace Admin AI assessment did not explicitly state its advisory nature. Corrected its source label to “AI-assisted and advisory”; refreshed and opened the five default viewports, stable screenshot checks and twenty geometry/interaction probes pass. Fresh evaluator round 3 running; coverage remains 6/17 pending PASS.

### DSN-0009 complete — evaluator PASS
Fresh evaluator round 3 PASS: all seven categories 4, cognitive-load pass, no findings or missing states across 45 screenshots. Coverage now 7/17; final coverage-aware gates 6/6 pass (typecheck, roles, tokens, V0, matrix, runtime graph). Earlier full story suite 263/263 and focused axe/build/navigation checks pass. Ready for no-ff merge; next is DSN-0010 Review decision.

## DSN-0009 merged recap — 2026-09-05 04:02 UTC
Ideas list is complete and merged to main with --no-ff (7ce2bd4), pushed to origin. Inventor drafts/submissions expose state, advisory evaluation and next step; Photon lists show client and Case Owner with direct record navigation. Reference defects exposed by this run (zoom navigation, missing disclosure evidence, repeated selected information and advisory wording) are corrected and recorded. Evaluator round 3 PASS, all seven scores 4, no findings or missing states across 45 screenshots. Full stories 263/263, V0 38/38, final gates 6/6, builds, stable captures, focused axe and navigation checks pass. Coverage is 7/17. Preserved the concurrent firing’s yield entry in the PROGRESS-only merge conflict. No founder decision required.

Next surface: **DSN-0010 — Review decision** (`product-context/surfaces/review-decision.md`). No surface remains in progress. The overall RUN COMPLETE condition remains unmet.

## DSN-0010 — Review decision in progress
Previous goal turn completed DSN-0009, coverage 7/17. Main fetched and clean; steering empty; recent DSN commits are this run’s own (the other firing only recorded its yield). Workspace Admin Leah Feldman reviews a submitted invention between other legal responsibilities. Product object: the submitted disclosure and its recorded decision. Job: understand its substance and make a defensible client decision. Primary action: Send to Photon Legal; consequence: confirmation records the handoff for filing. Requests/rejections must preserve a useful reason. Success signal: shorter review time with suitable handoffs, guarded by attributable decisions and preserved inventor content. This reference surface needs state coverage and demonstrated defect fixes only.
Roleplay: (1) The selected invention and author lead. (2) Send to Photon Legal remains the dominant control; its confirmation names filing. (3) Read assessment and meaning, inventor’s difference, mechanism; open full disclosure/evidence only as needed. (4) Keep the selected idea, reason and outcome in place while sending or recovering. (5) No extra preview, editor, second review stage, score cutoff or invented actor. (6) Show the actual saved outcome/actor after a competing decision; preserve the reason and clearly offer retry after failure.

### DSN-0010 implementation checkpoint
Twelve intended Review decision stories pass through V0 scenarios and existing decision routes, including pending, competing Admin, missing/partial evaluation and retained failure reason. Corrected reference defects: exact filing confirmation/action, recorded actor/outcome, saved selection, pending protection, inline retry, attachment field/download and obsolete activity copy. Retired the four legacy review stories/baselines and replaced their journey coverage. Initial full suite exposed two queue assertions that did not await disclosure loading; corrected the assertions. Initial axe found age contrast on the selected row; corrected with the existing secondary text token. Zoom probes pass, including actual retry persistence and attachment download preserving context. Parallel-frame isolation still fails (informational, shared-cookie identity; story tests remain serial). Final checks/captures and independent review remain pending.
