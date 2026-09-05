# DSN-0007 — Evaluation result

Status: in progress. Branch: `codex/dsn-0007-evaluation`.

## Intent and persona
Anika Sharma wants to understand the assessment and strengthen her disclosure, without learning patent drafting. Workspace Admin reads the same evidence in decision context. The object is an evaluation of one disclosure revision. Return to disclosure supports editing; Submit for review remains available at every score. Success is stronger completed submissions without reducing submission volume.

## Three directions before implementation
| Direction | Hierarchy and character | Cognitive cost | Choice |
|---|---|---|---|
| A · Assessment brief | A readable single column: score/band/meaning, two or three differences, concrete strengthening prompts, references closed below | Read one continuous argument; evidence costs a click only when wanted; no cross-pane recall | Selected: lowest load for the occasional Inventor |
| B · Evidence desk | Assessment at left, ranked references and comparison at right | Requires scanning two panes and deciding which reference to open before understanding the conclusion | Rejected: better suited to intensive reviewer research |
| C · Guided improvement | Assessment first, then a one-at-a-time improvement carousel with next/back | Short first view but hides comparison and requires remembering previous prompts | Rejected: unnecessary navigation and recall |

Low-fidelity renders: directions/a.png, b.png, c.png.

## Pre-build cognitive-load roleplay
1. Score, band and plain meaning lead the first glance.
2. Return to disclosure to improve technical detail is the result task; submission remains available at any score in the workspace.
3. Read assessment, differences and concrete questions; skip references until evidence is needed.
4. Reference overlap, difference and evidence remain together. No remembered score across views.
5. No legal drafting instruction, repeated scores, cutoff, due dates or named rankings.
6. One advisory sentence; revision freshness and clear return navigation explain ownership and consequences.

## Current findings
The report currently expands detailed evidence before strengthening advice, styles recommendations as an expert warning card and repeats reference-level numeric novelty. EvaluationProgress invents timed progress messages and counts; replace with honest server state. The existing envelope declares per-reference differences and overlap, so verify actual scenario data before claiming no backend gap. Preserve caller props, route, adapter and data flow.

## What moved and what stayed
- `ShowScoreReport.tsx` now leads with Assessment, What appears different, How to strengthen. Prior art and each ranked reference start closed. Evidence shows similarity, analysis, overlaps, differences, abstract and coverage/provenance together. Reference enrichment joins by publication number rather than array position; all returned references remain accessible.
- DraftWorkspace uses the same report and offers Open detailed report / Return to disclosure. Its server status distinguishes queued, running, partial, failed and timed out; retry and submission remain available. Re-evaluation clears the previous result through the existing mutation flow. A loading/error state reads the existing query, without changing its key, route or fetching function.
- EvaluationProgress no longer manufactures search counts or stage progress. Its original props remain accepted; server state is optional for callers that only know RUNNING.
- The existing report mutation and content-free analytics remain unchanged. No adapter, auth, analytics module, shared query hook, dependency, token source or approved reference screen changed. IdeaDetailsContent retains its route and report props; the surrounding detail screen is the next surface, DSN-0008.
- Legal drafting wording in recommendations becomes a concrete disclosure prompt. Empty differences/recommendations are explicit rather than blank sections. No score cutoff or submission gate.

## Mock and retirement
Eleven focused `v0/evaluation/*` scenarios use the existing evaluation envelope. Their synthetic cable references have coherent titles, abstracts and comparisons. No routes/fields were added. R-04/BF-2 checked: per-reference `distinctDifferences`, `overlappingConcepts`, `keySimilarities`, `analysis` and abstract already exist, so no proposed-field declaration is needed.

Retired the three legacy evaluation-only IdeaDetails stories and matching baselines: InventorEvaluationRunning, CommitteePartialEvaluation, CommitteeFailedEvaluation. The remaining IdeaDetails stories belong to DSN-0008. The inventor journey was retired in DSN-0006; no remaining QA journey contains an evaluation-specific step to replace.

## Story and screenshot coverage
`surfaces-evaluation-result--{not-run,queued,running,succeeded,partial,no-close-prior-art,failed,timed-out,stale-after-edits,re-evaluating,loading,error,workspace-admin}` selects focused V0 scenarios. Every state has 1280×720 and 1440×900 screenshots; Succeeded also has 1366×768, 1920×1080 and 640×360@2. Supplemental screenshots show expanded reference evidence/coverage for succeeded and partial results, plus scrolling to Return to disclosure and Submit for review at 200% zoom. The shared disclosure evaluation baselines are refreshed in this change.

## Rendered scorecard and cognitive-load check
Builder review: product-fit 4 · hierarchy 4 · usability 4 · trust 4 · craft 4 · accessibility 4 · business 4.
- The first glance gives 2.3/10, Marginally novel and close-overlap meaning. Two differences and two concrete prompts fit together at the ordinary laptop widths.
- The result task is to strengthen the disclosure. Return to disclosure is explicit; Submit for review stays enabled outside the modal for every score and status.
- Reading follows one continuous column; evidence is behind one disclosure, reference detail behind another. No comparison depends on remembered text from a different pane.
- In-progress text reports actual server state. Partial and stale results are labelled. Unavailable data is stated plainly; no invented precision or legal promise.
- Token typography, neutral hairline separators, small radius and 36px primitive buttons match the approved reference language. No visual token literals added.
- At 200% zoom the dialog scrolls vertically; both the strengthening prompts and Return to disclosure remain accessible, and returning exposes Submit for review. Native details retain keyboard operation and visible focus.
- This is rendered design evidence, not proof of increased disclosure quality or submission conversion.

## Validation
Initial full stories: 243 passed / four visibility checks failed during dialog animation. Visibility waits corrected; full rerun: **244/244 passed**. V0 semantics: **33/33 passed**. Typecheck and both design / Storybook builds passed. Final selected gates: **8/8 passed** (including role lint, tokens, V0 semantics, coverage, stories and runtime graph). The informational isolation probe remains contaminated through the shared cookie; story tests run serially as required. Both final builds passed; Storybook required one retry after a transient generated-font copy EEXIST. Stable screenshots reported zero egress. Logs accompany this record.

## Known compromises
The optional evaluation rail reuses the complete assessment; on a short laptop the strengthening section is below the fold, and the detailed-report dialog gives it a readable full-width view. No report download was newly invented; the supported action here is Open detailed report. The readonly idea-detail shell remains the next brief's work.

## Independent evaluation
Round 1 requested three fixes: primary emphasis/focus for Return to disclosure, visible re-evaluation confirmation after the rail shrinks, and an explicit Reload evaluation recovery action without a competing Evaluate idea action. All three are addressed; regenerated evidence and round 2 review follow.

```text
VERDICT: NEEDS_WORK
SURFACE: evaluation  PERSONA: Inventor, Workspace Admin
SCORECARD: product-fit 4 · hierarchy 3 · usability 3 · trust 4 · craft 4 · accessibility 4 · business 4
COGNITIVE LOAD: fail — At both default review widths, both personas can follow the assessment without unnecessary recall, but the focused prior-art disclosure dominates Return to disclosure, contrary to the builder’s claimed action hierarchy.
FINDINGS (most severe first, max 7):

1. Return to disclosure — Both personas encounter a subdued outlined action beneath prominently focused optional evidence; the charter requires the primary action to dominate — Give Return to disclosure primary emphasis and set initial dialog focus without promoting prior art.
2. Re-evaluating — Both screenshots show a blank evaluation column at the captured scroll position, leaving the Inventor guessing whether the request started — Keep confirmation visible after starting re-evaluation and capture its actual status at both widths.
3. Evaluation loading error — “Try again” and “Evaluate idea” appear together with equal emphasis, requiring the Inventor to guess whether recovery reloads an existing result or starts another evaluation — Label the recovery action explicitly and distinguish it from starting a new evaluation.

STATES MISSING: Re-evaluating is not visually demonstrated by its supplied screenshots; all other brief states are represented.
REFERENCE MATCH: no — Typography, neutral separators and restrained styling match, but the dialog lacks the reference screens’ clearly dominant primary action.

```
