# DSN-0010 — Review decision

## Intent and scope
Workspace Admin Leah Feldman needs enough evidence to make a defensible client decision without losing her place. The product object is the submitted disclosure and recorded decision. Send to Photon Legal leads; a confirmation makes the filing handoff explicit. Requests/rejections carry useful reasons, and a competing decision must show the real outcome and actor. Success signal: review completion/time with suitable handoffs and attributable decisions as guardrails; no new analytics.

The approved two-pane queue stays. This is state coverage plus defects demonstrated in those states, not a new reference design. Existing route and API flow remain; no adapter, auth, analytics or shared-query-hook changes.

## Three state-handling directions
| Direction | Leads / recedes | Task flow and character | Cognitive-load tradeoff | Choice |
|---|---|---|---|---|
| A · Existing confirmation | Selected brief stays beneath the existing dialog; evidence recedes | Same decision footer opens a focused confirmation/reason, pending and retry stay there; recorded outcome stays by the brief | One focused decision, no layout relocation, reason persists beside recovery. Calm and explicit | Selected |
| B · Inline decision section | Reason and confirmation expand in the brief | Footer moves focus to an inline decision section; evidence stays above | Less overlay but more scrolling, selected evidence and decision compete at laptop height | Exploration only |
| C · Decision side panel | A reason panel replaces the queue temporarily | Evidence remains alongside a decision rail | Gives more space to the reason but removes queue context and changes the approved composition | Exploration only |

A has the lowest load and preserves the reference interaction. Low-fidelity renders document all three; only A is built. Business hypothesis: explicit consequence and recoverable reasons reduce abandoned or repeated decisions. Main risk: long reasons at 200% zoom; inspect dialog scrolling and footer visibility.

## Cognitive-load roleplay before build
1. First glance: selected invention, inventor and assessment.
2. One thing: Send to Photon Legal, with a filing confirmation.
3. Read: score/meaning, what differs and mechanism; disclose the questionnaire and prior art only if needed.
4. Remember: nothing carried across a new preview screen; selected context, reason and outcome stay together.
5. Never needed: an editor, committee stages, score cutoff, generic confirmation or synthetic actor.
6. Anxiety: whether a decision saved or someone else already acted; display the real outcome/actor and preserve failed reasons.

## Initial state defects to verify
- Confirmation currently says “Send” instead of the specified action.
- Mutations have no inline error/retry or pending protection.
- Recorded success attribution is hard-coded, and activity uses obsolete review-stage copy.
- No-evaluation, partial/missing disclosure, concurrent decision and attachment-context states need concrete scenarios and interaction evidence.

## Validation and evaluator
Pending. Coverage remains null until the required evidence and independent PASS.

## What changed and what stayed
The existing two-pane reference, queue filters, brief sections, decision footer, route, adapter and mutation routes stay. Defect corrections add pending protection and an inline recoverable error to the existing confirmation; the reason survives failure. Saved/competing decisions retain the selected idea and show the recorded outcome and actor from the existing transitions endpoint. The exact approval button is “Send to Photon Legal.” Request/rejection prompts ask for a specific reason and reject blank input. No score gates a review.

The queue now reads the API's files field and separate submitted-by attribution. Attachments download in place; full evaluation opens in a named new-tab link, preserving the brief. Partial scores are identified as provisional; no-evaluation/missing-answer states are explicit. Activity removes obsolete committee/counsel copy and the unsupported filing-time estimate. Selected-row age uses the existing secondary text token to correct a contrast failure. No new visual values, dependency, route or proposed contract was needed; existing BF-8 files data remains conceptual as already declared.

## Story and scenario coverage
All twelve intended `surfaces-review-decision--` ids are present: typical, no-evaluation, partial-evaluation, long-disclosure, missing-detail, decision-in-progress, concurrent-decision-completed, approve-confirmation, request-changes, reject, success, failure-retry. Scenarios: `v0/idea-detail/under-review`, `missing-evaluation`, `partial-evaluation`, `long-content`, and new `v0/review/missing-detail`. All use Workspace Admin (`LEGAL_COUNSEL`). Pending/failure use the mock's supported latency/write-failure flags. The concurrent interaction records Noor Rahman's real synthetic transition before the current Admin submits and receives 409. Success uses the real mock review mutation. Retry is additionally exercised to successful persistence by the supplemental browser check.

The replaced legacy ReviewQueue story file and eight baseline/actual PNGs are removed. The retired committee journey is removed and the legal-counsel journey retains only its not-yet-replaced Actions steps. The smoke review step now uses the V0 handoff; the isolation probe targets two V0 stories and remains informational (shared-cookie identity is not isolated, so serial tests remain required).

Visual inspection caught a missing canonical novelty answer (`adv1`) in the brief fallback and a recommendation claiming complete disclosure while answers were missing. The brief now reads that inventor answer; the existing recommendation is shown only for fully answered, non-partial evidence. The decision itself remains available at every score and completeness level.

## Render review and scorecard
Default inspected at 1280×720, 1366×768, 1440×900, 1920×1080 and 640×360 at device scale 2. The brief, attribution and single filing action remain readable; the compact queue opens separately at zoom. Other required states have 1280/1440 captures and supplemental zoom captures. Scrollable reason dialogs retain reachable actions at zoom. The reason-copy capture was changed to a paste interaction so a still-typing frame cannot masquerade as the failure state; supplemental recovery explicitly waits for the inline alert.

| Category | Score | Rendered evidence |
|---|---:|---|
| Product fit | 4 | Existing review workspace, one legal decision and exact filing confirmation |
| Hierarchy | 4 | Title/attribution, assessment, inventor distinction and disclosure; one dominant decision |
| Usability | 4 | Pending protected; failed reason retained; outcome stays on selected brief |
| Trust | 4 | Real recorded actor; missing/partial evidence explicit; no unsupported timing or completeness claim |
| Craft | 4 | Reference panes, hairlines, type and token palette preserved |
| Accessibility | 4 | Focused axe zero; labelled dialog/reason, status/alert feedback and zoom action reachability |
| Business | 4 | Clear filing consequence and recovery support defensible completion |

Cognitive-load check: first glance identifies the selected invention and inventor. One leading task is Send to Photon Legal. Substance comes before the full questionnaire and prior art; no second preview is introduced. Selection and reasons remain in place so the Admin need not remember them. Missing evaluation never blocks the decision; the saved outcome/actor resolves uncertainty. The partial result is explicitly provisional. The existing selected-reference cue avoids repeating the idea title and score.

Validation: full stories 271/271, focused review stories 12/12 after the capture-only adjustment; selected gates 6/6 (typecheck, role labels, tokens, V0, coverage and runtime graph); design and Storybook builds pass. Eight settled focused axe contexts have zero findings. Sixteen supplemental viewport/state checks pass; retry actually persists the retained reason, attachment download retains the brief, and the full-app evaluation link opens the existing detail route while preserving queue context, all without egress. Final screenshot stability evidence follows. The informational isolation probe still demonstrates shared-cookie contamination; tests remain serial. The broad roles substring initially also selected legacy layout QA; that unintended run was stopped and the exact lint:roles gate was run instead. No unresolved surface gate failure is waived.

Final capture evidence: `shots3.log` passes every changed/reference capture except the known still-typing retry at 1280; `shots4.log` supersedes all six reason-dialog captures and passes twice with the unchanged 40-pixel tolerance. All 27 review baselines are copied under shots, plus 17 supplemental views. Supplemental activity's original capitalized locator timed out after all sixteen viewport/state checks passed; the corrected case-insensitive locator passes in `activity.log` and its screenshot is included. Final default renders were reopened at all five sizes and the retry frame now visibly includes the complete reason and inline error. No source changes followed these captures.

## Evaluator round 1 — NEEDS_WORK
```text
VERDICT: NEEDS_WORK
SURFACE: review-decision.md  PERSONA: Workspace Admin
SCORECARD: product-fit 4 · hierarchy 4 · usability 3 · trust 4 · craft 4 · accessibility 3 · business 4
COGNITIVE LOAD: fail — My six default-state answers at 1280×720 and 1440×900 agree with the record, but the concurrent outcome repeats its status and long-disclosure review becomes cramped at 200% zoom.
FINDINGS (most severe first, max 7):

1. Long disclosure at 200% zoom — the fixed title, attribution, tabs and decision footer leave roughly 55 CSS pixels for disclosure content, forcing the Admin to read and remember fragments — allow the title and attribution to scroll away so expanded answers have usable reading space.
2. Concurrent-decision banner — “Sent to Photon Legal by Noor Rahman” immediately repeats as “Sent to Photon Legal for filing,” adding redundant reading and breaking the no-repeated-status hard rule — combine outcome, actor and filing consequence into one sentence.

STATES MISSING: none
REFERENCE MATCH: yes — preserves the approved two-pane queue, restrained typography, hairline separation and dominant filing action.
```

Round 2 corrections: at compact widths, the brief header and content share the scroll region while the existing decision footer remains sticky. The title and attribution can scroll away to release reading space. The outcome omits a boilerplate filing comment that merely repeats its status; useful recorded comments remain. Desktop composition and decision routes are unchanged.

Round 2 verification: full stories 271/271, gates 6/6, both builds, all changed-story captures stable within the unchanged 40-pixel tolerance (`shots5.log`), eight focused axe contexts zero findings, and all sixteen supplemental geometry/state checks pass. The additional zoom reading capture shows full paragraphs after the title scrolls away; the concurrent banner contains one outcome/actor line. There are now 45 PNGs. A final ordering guard keeps the pending dialog open until the refreshed outcome is available; focused review stories remain 12/12, with saved/competing/retry captures rechecked against the rebuilt result. No change to the API paths or permissions.
