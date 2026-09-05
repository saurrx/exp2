# DSN-0014 · Actions

## Intent and persona frame
Leah, Workspace Admin, arrives to decide and send an instruction for an upcoming patent event. Devika, Case Owner, and Tobias, Photon Admin, arrive to process submitted client requests. The object is one event and its instruction; the consequence is a clear handoff to Photon Legal or a recorded operational status. Inventors have no access. The current wide tables scatter deadline, selected instruction and ownership; the client Due dates route keeps selections only in local state. Desired outcome: one coherent brief with a visible next step and durable saved/submitted state. Business signal: shorter instruction-to-response delay, guarded by preserved work, explicit countries/notes and correct client scope. This is an intended outcome, not a measured gain.

## Three directions
| Direction | Leads / recedes | Flow and character | Hypothesis and risk | Choice |
| --- | --- | --- | --- | --- |
| A · Urgency queue and focused instruction brief | A compact event queue leads into one selected instruction; metadata and past details recede | Choose an event, read deadline and current ownership, then save/send or advance status; calm and deliberate | Fewer facts to retain across a decision; the selected row must avoid repeating the brief title/status | Selected: lowest reading and remembering cost for both client and operator |
| B · Expandable event rows | Each event/date leads with an inline task button; expanded editing displaces later rows | Work down a single vertical queue; direct and compact | Good quick scanning, but long country/note choices push adjacent work and controls away | Rejected: unstable reading position and higher recovery cost |
| C · Status-grouped work board | Submission/processing state columns lead; deadlines live inside items | Find work in a stage, open a focused form; operational | Makes queue stages clear, but Workspace Admin first has to classify the task and laptop columns compete for space | Rejected: state grouping delays the event decision and weakens urgency scanning |

Three low-fidelity renders accompany these descriptions. Selection is pre-authorized under the cognitive-load charter.

## Cognitive-load roleplay
1. First glance: Leah sees the next event and deadline; Devika/Tobias see urgent submitted work with client scope.
2. One thing: send the selected instruction to Photon Legal, or record the next operational step. The dominant control names that consequence.
3. Read: event, patent reference, date/days, instruction options and required countries/note; details beyond the decision unfold on demand.
4. Remember: the event and its current instruction stay together; selected queue rows do not repeat the brief title/status. Client scope remains visible for operators.
5. Never needed: column selectors, raw IDs, a dropdown per row, pricing, calendar decoration, Inventor access or badges.
6. Anxiety: a plain ownership sentence explains who acts next; draft and submitted states differ truthfully, and failed work stays available to retry.

## Implementation boundaries and open issues
Keep the existing routes, components, query identities and adapter. Add only brief-required mock behavior through recorded proposed fields/routes when necessary. Existing client route selection is local-only; saved drafts/submission are explicitly authorized by the brief and WORKFLOWS. Endpoint/transport gaps will be traced before implementation. Do not redesign Photon Due dates during this surface; that is DSN-0015. The references, auth, analytics, shared query-hook files and dependencies remain untouched.

## Validation
Independent review round 2 returned PASS. Revised required gates pass 8/8, all 58 captures are stable, and all 22 states pass accessibility and zoom checks. Coverage is DSN-0014; broad regression follow-ups are recorded below.

## First implementation and flow verification
The main client view stays inside DueDatesContent with the existing all_due_dates query. The /actions client alias and operator component retain their query identities and canonical existing Actions routes. Canonical reads preserve event_type, saved instruction and requested_by that the legacy translation dropped. Draft save and selective send use existing decide/submit-all routes; the latter accepts declared BF-12 action_ids so other drafts remain unsent. BF-12 also supplies opt-in queue pagination and a separate decline response. Scope enforcement follows the four-persona brief. The references, adapter, auth, analytics source and shared query hooks are unchanged.
Twenty-two initial stories pass. Full-app checks verified durable saved drafts, one-instruction send, reload, changed instruction returned as UPDATED/NEW/version 2, and Case Owner acknowledgment, work start and completion. Unsent drafts do not enter the Photon queue. Initial render review prompted persistent operator controls and a focused send confirmation; client scope stays in the header and local choices survive event switching. Later verification will supersede these initial results.

## What moved and what stayed
The client and operator tables become a deadline-ordered event queue and a selected instruction brief. Client choices are readable radio options; country selection and required notes appear only when relevant. A draft remains unsent until the explicit handoff confirmation. Operators see the client, instruction, submitter and next permitted status action, with decline and its required response behind More. Saved state, submission state and processing state use plain text with a next-owner sentence. Errors retain choices and offer retry; filtered empty results can clear every active filter. Local unsaved edits survive switching events within the mounted workspace.

Existing routes, redirects, persona permissions, query identities, data flow and UI primitives remain. The main Workspace Admin Actions route is still /due-dates; /actions remains its working alias. Photon Due dates is retained for DSN-0015. References, product context, token source, adapter, auth, analytics source, shared hook files and dependencies are unchanged. A scoped CSS exception reuses the earlier surfaces' zoom reflow approach without changing the desktop access gate.

BF-12 records selective submission on the existing submit-all route, opt-in queue pagination and separate response_note storage. No endpoint was added; canonical action templates, event_type and requested_by are read directly where the legacy translation omitted fields. V0 mock writes validate client ownership, configured options, required countries/reasons and forward operational transitions. These declared contract capabilities remain conceptual until verified against the real backend; no real service was contacted.

## Coverage and legacy retirement
All fourteen intended coverage IDs are present in Surfaces/Actions. Twenty-two stories also cover Case Owner incoming work, an empty operator queue, 35 requests, selected countries, long titles, confirmation, decline response and load failure. Every story has 1280×720 and 1440×900 captures. Workspace Admin action required, Case Owner incoming and Photon acknowledged also have 1366×768, 1920×1080 and 640×360@2 captures. Countries, long title, submission error, confirmation and decline response have supplemental zoom captures.

Legacy Actions stories, their visual baselines and inherited accessibility fingerprints were removed. Client/committee/empty/large legacy Due dates stories and baselines were removed; the Case Owner and Photon Admin Due dates stories remain for DSN-0015. The obsolete client Actions journey was deleted, and the old queue-table step was removed from the Case Owner journey while preserving its client-assignment checks. The V0 stories and local mock-only functional probes replace those Actions expectations.

## Builder scorecard and rendered cognitive-load check
| Category | Score | Evidence |
| --- | --- | --- |
| Product fit | 4 | Both authorized jobs and all brief states; no Inventor Actions or new purchase/score scope |
| Hierarchy | 4 | One selected event, deadline, ownership and consequence-labelled primary control; metadata and secondary responses recede |
| Usability | 4 | Selective durable send, retained draft/failed work, explicit confirmation, visible operator controls and clear filter recovery |
| Trust | 4 | Submission and processing remain distinct; submitter and response are preserved; no implied measured gains |
| Craft | 4 | Existing token typography, amber actions, restrained hairlines and whitespace match the reference language |
| Accessibility and resilience | 4 | Native labelled controls, keyboard focus, reduced motion, country search, long-title wrapping and scoped zoom reflow |
| Business | 4 | Direct instruction handoff reduces steps toward processing; intended signal is instruction-to-response delay with retained-work and scope guardrails |

Rendered roleplay: (1) the event and date lead the selected brief, with client context for operators; (2) the next control names sending, acknowledgment, starting or completion; (3) the reader needs only the selected event, instruction and required country/reason details; (4) the brief and retained choices keep that decision together without repeating selected-row identity; (5) raw IDs, column configuration, pricing, badges and Inventor operations are absent; (6) explicit ownership, saved/submitted distinctions, retry and confirmation address handoff anxiety. At 200% zoom the queue is available through Choose event and the brief scrolls vertically. The compact controls remain reachable; long forms intentionally require vertical scrolling.

## Validation evidence before independent review
The required selected gate run passes 7/7 (typecheck, tokens, V0 semantics, current matrix and full serial stories plus runtime check); the final Actions interaction suite passes 22/22. The design and Storybook builds pass. All 58 Actions viewport captures pass the unchanged two-render 40-pixel stability tolerance with no egress (`shots2.log`), with the Inventor refusal recaptured after replacing the harness-only navigation marker with the real redirected Inventor home. All three default personas were opened and inspected at each of the five required viewports. The earlier blank navigation marker is not a product screenshot and was replaced.

`functional2.log` verifies two persisted drafts, selective submission, reload, updated instruction version/state, operator acknowledgment/start/completion and unsent-draft exclusion. `functional-extra.log` verifies local edit retention, country requirements/persistence, decline response preservation and 20/15 pagination plus filter recovery. Initial zoom review caught the inherited desktop width floor; scoped reflow fixes it. The accessibility/overflow pass over all Actions content states at 1440 and 640 has no findings; final verification also includes the real redirected home. Error and confirmation screenshots show retained controls with explicit consequences. Full repository gates are running; unrelated failures will be recorded without claiming a fully green suite.

Verification probes ran locally against the mock app and static Storybook, blocked external egress, and selected named synthetic V0 scenarios. Their logs preserve the results; no additional repository test suite was added.

## Independent review round 1 and corrections
The independent review found five task-level issues in the first captures: the complete client choice set did not fit at laptop size, compact confirmation lost event identity, unavailable configuration still used the generic client ownership sentence, zoom was dominated by introductory/filter UI, and sticky operator controls covered attribution. The revised layout removes redundant introductory copy, reduces vertical spacing, labels the number of available instructions, puts secondary filters behind disclosure at zoom, keeps event identity/date/reference sticky during a send or decline decision, states the configuration dependency truthfully, and returns operator controls to normal flow so they cannot cover instruction or submitter content.

Round 1 verdict, verbatim:

```text
VERDICT: NEEDS_WORK
SURFACE: actions  PERSONA: Workspace Admin, Case Owner, Photon Admin; Inventor refusal
SCORECARD: product-fit 4 · hierarchy 3 · usability 3 · trust 3 · craft 4 · accessibility 3 · business 4
COGNITIVE LOAD: fail — Unlike the record’s roleplay, the rendered layouts require discovering hidden choices and remembering event identity while acting.

FINDINGS (most severe first, max 7):

1. Instruction choices at 1280×720 — Workspace Admin sees only “Respond to the office action” above the sticky controls; extension and abandonment choices lack a visible continuation cue, making one option appear exhaustive — Reduce introductory spacing and keep the complete choice group visible or clearly indicate its continuation.
2. Confirmation and decline at 200% zoom — The patent reference, event and deadline are absent beside the final action, forcing Workspace Admin and operators to remember which request they are sending or declining — Keep a compact event identity and deadline with the confirmation.
3. Missing-template ownership — Workspace Admin is told to send an instruction while another sentence says Photon Legal must first configure unavailable options — Replace the generic ownership sentence with the actual configuration dependency and immediate contact step.
4. Default state at 200% zoom — All three personas see headings, filters and “Choose another event,” but no selected event, urgency, instruction or primary task control — Compact the introductory area and move secondary filters behind disclosure so the selected task leads.
5. Sticky operator controls — At 1280×720 the incoming request’s submitter is below the visible content; the long-title state clips “Client note,” and the 1440×900 decline form cuts through submitter text — Reserve space for the action area and keep attribution and relevant instruction context readable before processing.

STATES MISSING: none; all brief-listed states and Inventor refusal are represented across the 58 images.
REFERENCE MATCH: yes — Typography, amber controls, restrained borders and two-pane structure match the reference language; the spacing and compact-layout problems above weaken its task-first hierarchy.```

The broad gate attempt passed typecheck, role lint, routes, manifest, token freshness, fidelity, V0 semantics/matrix, both builds and the full serial story suite. It reported the pre-existing documentation-host allowlist issue in earlier DSN logs (rollupjs.org/reactrouter.com). Its repository-wide screenshot phase was deliberately stopped when the evaluator required product changes; it is not reported as a passing broad gate. Final revised surface gates, targeted stable captures and accessibility checks supersede that attempt.

## Revised verification
The revised required gate set passes 8/8 (`gates-review2.log`), including role lint and the full serial story suite. Both builds pass. Accessibility has zero findings and no page overflow across all 22 states at 1440 and 640 (`axe-review2.log`). The zoom recovery probe checks actual viewport bounds for the event heading, patent reference and final decision control together, then successfully retries the failed send and completes the decline (`recovery-zoom.log`). The laptop render now shows all three allowed choices together; the operator submitter and next action are visible without overlay. At zoom, event/date/reference lead instead of generic introductory copy. Missing configuration has one truthful dependency and contact step. Confirmation suppresses the earlier summary and holds one compact identity block while the reader acts.

All 58 revised captures passed two clean renders with the unchanged 40-pixel tolerance and no egress (`shots-review2.log`). They replace the first-review images in `shots/`. The revised defaults were opened at all five prescribed viewports; full choices and operator attribution fit at laptop widths, and the event leads at zoom.

## Independent review round 2 — PASS

```text
VERDICT: PASS
SURFACE: actions  PERSONA: Workspace Admin, Case Owner, Photon Admin; Inventor refusal
SCORECARD: product-fit 4 · hierarchy 4 · usability 4 · trust 4 · craft 4 · accessibility 4 · business 4
COGNITIVE LOAD: pass — At 1280×720 and 1440×900, all three personas can identify the event, read the necessary decision context, and understand the next action and owner without cross-screen recall, consistent with the record’s six answers.
FINDINGS (most severe first, max 7):
None.
STATES MISSING: none; all required states and Inventor refusal are represented across the 58 inspected images.
REFERENCE MATCH: yes — Typography, amber primary controls, restrained hairlines, whitespace and the two-pane queue/detail structure follow the Workspace Admin reference language.
```
