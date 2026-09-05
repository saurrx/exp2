# DSN-0006 — Start an idea and invention disclosure workspace

Status: in progress. Branch: `codex/dsn-0006-disclosure-workspace`.

## Intent and persona
Anika Sharma brings existing notes after engineering work. She needs to turn those notes into a supported disclosure, supply the human conception, and send it for review. A Workspace Admin can capture for a selected inventor with separate attribution. Starting creates a draft; submission freezes the reviewed revision. Success signals are submission starts, completed drafts and completed-to-submitted conversion; unsupported answers must not increase.

## Directions explored before implementation
| Direction | What leads and how it flows | What recedes | Character and hypothesis | Cognitive cost / risk | Choice |
|---|---|---|---|---|---|
| A · Material then narrative | Paste/upload first; title below; one open narrative section beside readiness | Evaluation, sources and history open on demand | Calm, familiar document editing; less blank-page hesitation | Read source and title, then current answer and adjacent gap; no extra stage to remember | Selected: lowest load, preserves the brief’s one-column/one-panel structure |
| B · Guided interview | One question per page after material capture; Next advances | Full narrative and optional context | Supportive step-by-step interview | Requires remembering previous answers and navigation to compare; feels like a questionnaire | Rejected |
| C · Source comparison | Source always visible beside generated answers, readiness below | Optional evaluation tucked away | Auditable source review | Three competing reading regions once readiness is included; source dominates even after review | Rejected |

Low-fidelity renders: directions/a.png, b.png and c.png.

## Cognitive-load roleplay before build
1. First glance: bring existing material for a thin draft; otherwise current answer and remaining gaps.
2. One thing: Continue to disclosure at intake, Submit for review in the workspace. Evaluation is optional.
3. Read invitation, source and title, then one narrative section; skip sources and history until needed.
4. Remember no score or section status across separate screens.
5. Never need reached filing stages, administrative dates, duplicate score, or firm metrics.
6. Save state stays visible; submission names the next owner.

## Scope
Restyle existing IdeaSubmissionModal and DraftWorkspace; preserve routes, adapter and existing API flow. Fix draft lifecycle display, evaluation gate, and material-loss errors under the briefs. Reference components remain unchanged.

## Evidence and validation
Pending implementation, state stories, rendered inspection, gates and fresh evaluator. Coverage remains null.

## Implementation and preserved contracts
Material now leads in IdeaSubmissionModal. The same create-idea/create-draft calls retain completed steps across retry; source extraction uses the existing document reader and autofill route. Workspace Admin on-behalf creation uses the already exported raw API for the existing /v1/ideas body because the historical adapter drops inventor_id. The adapter is unchanged. Duplicate titles offer opening the existing idea or deliberately creating another. Closing a titled intake saves it; extraction errors retain the open material.

DraftWorkspace remains on its route with existing query/mutation flows. Its narrative accordions use hairlines; one side panel carries required-answer readiness and optional evaluation. Submit for review remains primary without a score and at a low score. The incorrect reached lifecycle stepper is gone. Required answers save before evaluation or submission. Requested-change feedback appears alongside the active revision. Submitted or unauthorised drafts are read-only. Co-inventors, source files, original material and frozen revisions expand on demand.

Unsaved disclosure answers are retained per user/draft in session storage and restored after navigation. Save failures remain editable; conflicts offer the latest saved version for comparison and an explicit choice. Successful saves clear the local recovery copy. A submitted revision is frozen in the mock.

The two reference components, product-context, adapter, authentication and analytics modules, route table and dependencies were not edited. Existing analytics call sites remain. UI uses Button, Input and Dialog primitives plus tokens.

## Mock additions and compromises
BF-7 declares draft version, frozen history, original source and per-answer provenance; existing routes carry them. BF-1 already declares on-behalf creation and separate attribution. Eight focused v0/disclosure scenarios select the canonical questionnaire. The V0 mock copies explicitly labelled source passages only; it never invents missing technical content and never authors novelty. Unlabelled material stays as source for manual completion. This deterministic extraction models supported prefill, not a production semantic extractor. Slides use pasted text because the existing browser reader supports PDF, DOCX, TXT and Markdown.

The preliminary signal reads the canonical answer keys as well as the older narrative keys; per-field assistance gives grounded follow-up prompts rather than fabricated suggested facts. The full evaluation-result redesign belongs to DSN-0007. Session recovery lasts for the browser tab session; successful server saves are the durable record.

## State and visual coverage
All 11 intended Start an idea stories and all 15 intended Invention disclosure workspace stories exist, plus WorkspaceAdminReadOnly for the permission state. All select v0 scenarios. Seven replaced legacy draft stories, their baselines/comparisons and the old deployed-host Inventor disclosure journey were removed.

60 baseline screenshots cover every story at 1280×720 and 1440×900, plus both empty defaults at 1366×768, 1920×1080 and 640×360@2. Two additional screenshots show the intake title and writing field reached by scrolling at 200%. Default screenshots were opened individually at all five widths; state contact sheets and recovery/feedback screenshots were inspected. No horizontal overflow; primary controls remain within each viewport.

## Scorecard after visual inspection
| Product fit | Hierarchy | Usability | Trust | Craft | Accessibility | Business |
|---|---|---|---|---|---|---|
| 4 | 4 | 4 | 4 | 4 | 4 | 4 |
The task and next owner are explicit, material leads, evaluation recedes and cannot gate review. Failure recovery and provenance are readable in context. Keyboard controls and focus states use existing primitives. At 200%, the body scrolls while the submission action remains visible. Scores are a design check, not measured conversion evidence.

## Cognitive-load check on the render
1. First glance: source invitation in an empty disclosure; a current answer in a populated disclosure. The original material is first in intake.
2. One thing: Continue to disclosure or Submit for review. The latter remains amber regardless of evaluation.
3. Read the source invitation/title, then one answer with its helper and the required gaps alongside. Supporting source files and history remain closed.
4. No score or gap needs to be remembered across views; requested-change feedback is beside the revision.
5. No reached filing stage, due dates, Actions, named rankings, repeated score, or administrative metrics.
6. Save status is explicit; errors preserve work, conflicts name the choice, and submission names the Workspace Admin.

## Validation
Typecheck, role lint, token check, app build, Storybook build and V0 33/33 passed. Full story suite: 234/234 passed across 53 files after replacing legacy coverage. Functional browser probes submitted an unevaluated draft and a low-scoring draft; both reached LEGAL_REVIEW with SUBMITTED draft status and one frozen revision. On-behalf submission reached LEGAL_REVIEW with distinct author/submitter attribution. All probes blocked egress and attempted none. Width probes verified both surfaces at all five viewports. See logs/.

Selected gates passed 7/7. Fresh evaluator is pending. Coverage remains null until PASS.
