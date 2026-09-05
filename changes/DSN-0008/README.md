# DSN-0008 — Idea detail and status

Status: complete; independent evaluator PASS. Branch: `codex/dsn-0008-idea-detail`.

## Intent and persona
Inventor checks feedback, status and the next step. Workspace Admin decides from a concise brief. Case Owner and Photon Admin receive a scoped filing brief and attachments. The product object is one idea, its disclosure revision, review history and related patent. Success is confidence after submission and an efficient, accurate handoff.

## Three directions before implementation
| Direction | What leads / recedes / flow | Character and hypothesis | Cognitive cost and risk | Choice |
|---|---|---|---|---|
| A · Status brief | Status, next-step sentence and one primary action; ownership and brief follow; disclosure/evidence/history open on demand | Calm and clear; supports the occasional Inventor while the same brief serves operators | Lowest reading/recall cost; long sections require scrolling after expansion | Selected |
| B · Working dossier | Persistent section index and two-pane disclosure/evidence comparison | Precise research workspace; makes deep review fast | Requires choosing a section and scanning two panes before understanding the next step | Rejected |
| C · Event journal | Full timeline leads with the latest decision; disclosure and files are linked from events | Reassuring history; explains how the idea arrived here | Must reconstruct current ownership and content from events; inefficient for filing | Rejected |

Low-fidelity renders: directions/a.png, b.png, c.png. All preserve one Workspace Admin review stage and the same permissions.

## Cognitive-load roleplay
1. Reference/title, current status and next-step sentence lead.
2. One dominant action for the current persona and state: update, decide/send, record filing, open patent or read disclosure. Its consequence is stated once.
3. Read the concise brief and ownership; skip collapsed disclosure/evidence/files/history until needed.
4. Decisions remain with their actor, revision and date. Score appears once; no cross-pane comparison is needed.
5. No Inventor dates/Actions, technical review stage, filing-in-progress state, colleague ranking or legal workflow menu.
6. State who owns the next step, distinguish Inventor and Submitted by, and route editable drafts to the existing disclosure workspace.

## Initial reconciliation
Linked patent hydration, attachment access and real review history need to match the existing backend vocabulary. Rejected ideas must permit author revision and reconsideration under WORKFLOWS section 4. The shared evaluation display band must use PRODUCT-VOCABULARY thresholds ≥8/≥6/≥4. These are corrections toward existing product truth, not new product behaviour.

## What moved and stayed
The existing IdeaDetailsContent now leads with reference, status and next-step sentence, then ownership and a concise brief. Disclosure sections, detailed evaluation, original source, attachments and review history open on demand. The single current action remains in a footer while the content scrolls, including at desktop zoom; Request changes is secondary and Reject stays behind the decision menu and confirmation. Photon users retain client scope in the persistent page header. The brief omits an identical title prefix.

Routes, existing adapter, auth, analytics, shared query hooks and the two reference screens are unchanged. Existing detail/draft data queries and filing form remain in place. Local canonical transition reads and review decisions serve the new presentation; activity reloads on return from revision so the latest transition is visible. Draft and evaluated records redirect into the existing disclosure workspace. Granted and Closed come from the linked patent, with no added idea status or legal workflow stage.

Corrections exposed by this surface: the shared evaluation bands now use the product thresholds 8/6/4; evaluation baselines from DSN-0006/0007 were refreshed. Rejected disclosures can be revised and resubmitted with a required reconsideration note, preserving the previous decision and revision history. FileIdeaModal uses Record filing and explains the recorded consequence, while retaining its shared patent form and payload.

## Mock contracts and retirement
BF-8 declares the missing stored-file association (`POST /v1/ideas/:id/files`, `Idea.files`, `StoredFile.idea_id`). Uploads use the existing same-origin presign/content flow. Association requires an editable idea owned by the author or recorded on-behalf submitter, a stored file from that actor and the same client. V0 idea, draft, transition and associated-file reads enforce the existing visibility rules; another inventor cannot resubmit the idea. Focused scenarios use the deterministic scenario builder, synthetic cable disclosures, synthetic source text and a JSON attachment (the mock raw-file endpoint returns its synthetic file marker). No production data or network was used.

Deleted all ten remaining legacy IdeaDetails stories and their baselines. Removed the replaced full-record step from the legacy tech-committee journey; its queue-specific steps remain for the review surface. The remaining legal-counsel and Photon journeys do not exercise this detail surface. Inventor detail coverage had already left the legacy journey in DSN-0006.

## Final cognitive-load roleplay at 1280×720 and 1440×900
| Question | Inventor: Submitted | Workspace Admin: Under review | Case Owner: Sent to Photon | Photon Admin: Sent to Photon |
|---|---|---|---|---|
| First glance | My title, Awaiting Workspace Admin review, who owns the next decision | Idea awaiting my decision and a brief | Client, idea and the external filing next step | Client and incoming filing brief |
| One thing | Read disclosure; if feedback is requested, Update disclosure replaces it | Send to Photon Legal, with the consequence confirmed | Record the completed filing | Record the completed filing |
| Read / skip | Read status and one next-step sentence; skip evidence and history | Read ownership and brief; open only necessary sections/evidence | Read ownership, brief, source files; evidence is optional | Read client and handoff brief; source files open on demand |
| Remember | No stage sequence or score to recall | No score cutoff; reason and consequence stay in the dialog | Client stays in the header while content scrolls | Client stays in the header while content scrolls |
| Never needed | Actions, due dates, rankings, operator controls | Filing form or a second review stage | Inventor editing or review decisions | Inventor editing or review decisions |
| Anxiety answered | Workspace Admin owns the next decision; an email follows | Decision saves with actor, revision and history; failure retains the note | Legal work happens outside Pulse; record it once completed | The linked patent follows the saved filing |

At 1366×768 and 1920×1080 the hierarchy is unchanged. At 200% zoom there is no horizontal overflow; the current action stays visible and content scrolls independently. Expanded details retain keyboard-native summary controls. Draft, evaluated, feedback, rejection, resubmission, linked patent, missing/partial evaluation, attribution, loading, failure and permission states are included.

## Scorecard after rendered review
Product fit **4** · hierarchy **4** · usability **4** · trust **4** · craft **4** · accessibility **4** · business **4**. One task leads, no score gates a decision, supporting material is collapsed, decisions are attributable, failure preserves work, and zoom keeps the action available. These are design-review assessments, not measured user outcomes. Intended outcome: fewer ambiguous status checks and more complete review-to-filing handoffs; assess time to the next valid transition while guarding against lost revision history or decisions made without the needed evidence.

## Verification
Initial full story run: 254/254. Expanded recovery coverage: 256 stories. Semantic suite: 36 checks including rejected revision history, scoped reads/resubmission and file association. Typecheck, role lint, tokens, coverage, design build and Storybook build pass. Initial selected gates passed 8/8. Final active checks passed 7/7 with the full 256-story suite run separately; final logs accompany this record. Informational isolation still reports shared-cookie contamination, so stories remain serial.

Browser checks exercised real Workspace Admin approval, rejected disclosure edit and resubmission with the new note and preserved decision, source expansion and same-origin attachment download, and filing creation with the linked patent at 1280 and 200% zoom. All five zoom checks have an onscreen action and no horizontal overflow. Supporting screenshots show expanded evidence, source, history, revision confirmation and filing form. A transient story-ready timeout on one Photon zoom screenshot was rerun successfully; final screenshot run is the evidence set.

## Screenshot inventory
All `surfaces-idea-detail-and-status--*.png` images in shots/ are copies of final story baselines. The four persona defaults cover 1280×720, 1366×768, 1440×900, 1920×1080 and 640×360 at device scale 2. Every remaining story has 1280×720 and 1440×900, plus a long-content zoom view. Supplemental images cover expanded sections/evidence/files/history, decisions and filing, with filenames naming the state and viewport.

## Independent evaluator
Round 1, verbatim:

```text
VERDICT: NEEDS_WORK
SURFACE: idea-detail  PERSONA: Inventor, Workspace Admin, Case Owner, Photon Admin
SCORECARD: product-fit 4 · hierarchy 4 · usability 3 · trust 3 · craft 4 · accessibility 4 · business 4
COGNITIVE LOAD: fail — At 1280×720 and 1440×900, status, actions and client scope support the recorded roleplay, but readers must still infer evaluation meaning and whether it covers the current revision.
FINDINGS (most severe first, max 7):

1. Evaluation after reconsideration — The editor says “Evaluated before your latest edits,” but reconsideration-saved-history presents the same 6.2 score without that qualification; readers must guess whether revision 2 was evaluated — Preserve evaluation freshness and revision attribution beside the score after resubmission.
2. Evaluation summary — Across all four defaults, “Review the comparison…” instructs readers to seek a conclusion instead of providing the required Assessment; Inventors must expand supporting evidence to understand the result — Show a substantive assessment before What appears different and How to strengthen, keeping detailed prior art collapsed.
3. Long-content invention brief — The title describes an interferometric displacement sensor while the brief describes a cable harness; the Workspace Admin must guess which invention the decision concerns — Make the synthetic title, brief, disclosure and evaluation describe the same invention.
4. Permission-denied recovery — The toast identifies an access restriction, but the page says the cause is uncertain and emphasizes Reload idea; the Inventor must remember the transient explanation and guess whether retrying helps — Keep the access explanation inline and make Back to ideas the primary recovery action.

STATES MISSING: none of the brief’s named states; all 77 PNGs inspected.
REFERENCE MATCH: yes — Typography, restrained colour, hairline separation and amber primary controls follow the reference language.
```

Round 1 corrections: BF-9 now captures the evaluated answer-text fingerprint and review revision, and shows the original revision/date plus saved-content freshness next to the score. Save metadata does not mark unchanged text stale; real answer edits do, and resubmission retains this qualification. A substantive report assessment now precedes expanded evidence. The long title describes the same cable mechanism. Access denial stays inline with Back to ideas leading and no retry. Local dialog descriptions use the secondary text token after a focused axe check found 4.34:1 contrast in the inherited muted description. Two new semantic checks cover answer-based freshness and re-evaluation attribution.

Round 2 verification: **256/256 stories**, **38/38 semantic checks**, both builds passed, **0 focused axe findings** across twelve detail/recovery states, all five zoom checks passed, filing and reconsideration browser flows passed, stable screenshots with zero egress. The story readiness check now awaits the domain action becoming enabled after the access-scoped disclosure load. Fresh-context verdict:

```text
VERDICT: PASS
SURFACE: idea-detail  PERSONA: Inventor, Workspace Admin, Case Owner, Photon Admin
SCORECARD: product-fit 4 · hierarchy 4 · usability 4 · trust 4 · craft 4 · accessibility 4 · business 4
COGNITIVE LOAD: pass — Independent roleplay at 1280×720 and 1440×900 agrees with the recorded answers: status, ownership and the primary action lead, evaluation freshness is explicit, and supporting information stays on demand.
FINDINGS (most severe first, max 7):
None.
STATES MISSING: none; all 77 PNGs inspected, including four persona defaults at all five viewports and supplemental interactions.
REFERENCE MATCH: yes — Typography, restrained colour, hairline separation, control sizing and amber primary actions follow the reference language.
```
