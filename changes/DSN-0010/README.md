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

The queue now reads the API's files field and separate submitted-by attribution. Attachments download in place; full evaluation opens in a named new-tab link, preserving the brief. Partial scores are identified as provisional; no-evaluation/missing-answer states are explicit. Activity removes obsolete committee/counsel copy and the unsupported filing-time estimate. Selected-row age uses the existing secondary text token to correct a contrast failure. No new visual values, dependency, route or proposed contract was needed; existing BF-0010 files data remains conceptual as already declared.

## Story and scenario coverage
All twelve intended `surfaces-review-decision--` ids are present: typical, no-evaluation, partial-evaluation, long-disclosure, missing-detail, decision-in-progress, concurrent-decision-completed, approve-confirmation, request-changes, reject, success, failure-retry. Scenarios: `v0/idea-detail/under-review`, `missing-evaluation`, `partial-evaluation`, `long-content`, and new `v0/review/missing-detail`. All use Workspace Admin (`LEGAL_COUNSEL`). Pending/failure use the mock's supported latency/write-failure flags. The concurrent interaction records Noor Rahman's real synthetic transition before the current Admin submits and receives 409. Success uses the real mock review mutation. Retry is additionally exercised to successful persistence by the supplemental browser check.

The replaced legacy ReviewQueue story file and eight baseline/actual PNGs are removed. The retired committee journey is removed and the legal-counsel journey retains only its not-yet-replaced Actions steps. The smoke review step now uses the V0 handoff; the isolation probe targets two V0 stories and remains informational (shared-cookie identity is not isolated, so serial tests remain required).
