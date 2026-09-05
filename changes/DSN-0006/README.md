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
