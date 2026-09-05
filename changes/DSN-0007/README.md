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
