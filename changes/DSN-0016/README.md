# DSN-0016 · Case Owner my work

## Intent and persona frame
Devika Nair starts her day responsible for Northwind Instruments and Beacon Health Systems. Her job is to identify which assigned client needs attention and move approved ideas into organised Photon work. The object is an approved idea, a patent-event instruction or recorded date, or a client setup/access responsibility. Opening the highest-priority work item is the primary action; its consequence is entering the existing brief or operational record with the client already identified. The intended business signal is lower coordination delay after client approval, guarded by accurate assigned scope and truthful work age. No measured improvement is claimed.

The current home leads with aggregate portfolio panels and a client ranking, then buries dates below the map. It does not put approved work, onboarding or access tasks into a useful priority order. The redesign keeps /, the dashboard data flow and scoped query identity, uses the existing downstream routes and models missing dashboard context in the mock.

## Cognitive-load roleplay
1. First glance: the approved idea that needs Photon attention, named with its client and age.
2. One thing: open the next relevant work item to move it forward in its existing workspace.
3. Read: client, object/reference, age or urgency and the next step. Skip portfolio totals until considering context.
4. Remember: nothing across a client column and a separate chart; identity and next step stay together. Client view must remain distinguishable from operational work.
5. Never needed: global rankings, vanity counts, repeated cards, generic review-decision controls or a leading map.
6. Anxiety: which scope is shown, whether access is current, and what failed to load. Name the restriction or recovery once, with no false zero totals.

## Three directions
| Direction | Leads / recedes / flow | Character and hypothesis | Risk and choice |
| --- | --- | --- | --- |
| A · Prioritised work brief | Approved idea queue leads into one selected brief; urgent dates/instructions and setup follow, map last | Calm and prepared; a coherent next step lowers handoff delay | Lowest memory cost; selected identity appears once. Chosen after low-fi review. |
| B · Client-by-client agenda | Each assigned client contains its tasks; client grouping leads, urgency spans groups | Familiar account ownership; speeds client-focused catch-up | Devika must compare clients to find the newly approved or urgent work. |
| C · Work lanes | Parallel lanes for approved ideas, urgent events and client setup; map below | Fast broad scanning when work types are balanced | Three competing starting points and narrow items cost more at laptop widths. |

## Validation
Approved after independent round 3. Coverage records DSN-0016; required checks and rendered evidence pass, with the disclosed optional reference-edge rasterization limitation.

All three low-fidelity renders were opened before UI changes. A is selected: the stable focused brief avoids comparing client groups or three lanes. The map follows assigned-client work. BF-14 adds scoped dashboard context on the existing route; no adapter or shared hook changes.

## What moved and what stayed
The Case Owner branch of the existing home component now renders the priority queue and selected brief instead of aggregate panels and a ranking. Assigned clients, filing updates and the scoped map follow operational work. Selection is stored in the URL so Back restores the brief; exact downstream record links preserve event/instruction identity. Long titles reflow at 200% zoom and supporting explanation moves into progressive disclosure. Empty, loading and failed data reads remain distinct; an access request exposes pending, stored-success and retry states.

The route, dashboard query, adapter, shared hooks, analytics module, reference components and token source stay intact. The user explicitly authorized the client-view auth exception on 2026-09-05; its bounded changes are recorded below. The map receives an optional supplied jurisdiction summary; existing consumers keep their original behavior. The only shared navigation change renames the Case Owner home to My work, without a badge. The legacy Case Owner Dashboard story/capture and its two accessibility fingerprints are retired. The existing client journey belongs to Clients and onboarding and remains for DSN-0018.

## Mock additions
BF-14 supplies the assigned-client dashboard summary and stored access-request timestamp using existing routes. Approval age comes from the actual recorded transition, pending events use their own recorded dates, and health comes from workspace/person membership. Previously expired access carries only assignment metadata and a request action; the client GET still returns 403. Active-patent geography excludes unassigned clients. All added scenarios are deterministic synthetic V0 scenarios. See the BF-14 reconciliation entry; no real backend compatibility is claimed.

## Client-view boundary — blocked pending authorization
The existing client record exposes View as client. A full-app probe successfully enters Northwind Instruments as its Workspace Admin, then selects Exit client view. The original Case Owner is not restored: client mode remains true and role remains LEGAL_COUNSEL. The mock's parameterized view-as route precedes its literal exit route; the literal handler also hardcodes Photon Admin. This violates the brief's easy-exit rule. RUN-GOALS.md explicitly excludes auth changes; authorization for this specific fix has been requested. No pass or completion is claimed while this boundary remains unresolved. Evidence: client-view3.log.

The response trace confirms entry HTTP 200 and exit HTTP 404 (`client-view-trace3.log`); `client-view-exit-failure.png` was opened and shows the client Overview after attempted exit. The final repeated functional probe (`functional4.log`) passes the implemented work queue, stored requests, exact links/Back, map controls and primary-action visibility at 200% zoom.

## Rendered review checkpoint
Opened all 34 current captures individually, including the default at 1280×720, 1366×768, 1440×900, 1920×1080 and 640×360@2. The work record stays prominent, the primary action fits even with the long title at 200%, and urgent items distinguish a client instruction from a recorded event. Access error keeps both retry and explanation visible. Setup and no-assignment states name the responsible next step. The map remains below work and names assigned scope. These captures were collected from the broad runner's current render; the explicit scoped re-baseline is queued after that runner releases its capture server.

Repeated accessibility review passes all 28 main-content/overflow contexts (14 stories × 1440 and 640) with zero findings. This validates the new content, not the defective external client-view boundary.

### Scorecard — provisional, not ready
| Category | Score | Rendered evidence / remaining gap |
| --- | --- | --- |
| Product fit | 4 | Assigned work leads; the client-view round trip now restores the original persona. |
| Hierarchy | 4 | One selected brief and primary action lead; map and client context follow. |
| Usability | 4 | Exact links, Back, retained requests, persistent client-view exit and recovery pass. |
| Trust | 4 | Dates and scope are grounded; failed restoration retains client mode and offers retry or sign-in. |
| Craft | 4 | Token-based typography, hairline groups and consistent controls across the inspected widths. |
| Accessibility and resilience | 4 | Long-title and error zoom controls remain visible; 28 axe/overflow contexts pass. |
| Business | 4 | New approvals and urgent events lead into existing records; no measured outcome claim. |

### Cognitive-load check on the render
As Devika, I first see the selected newly approved idea, with client and reference adjacent. I read its client, approval age, title and next step before Open approved idea; I skip the lower map, filing history and client roster. I retain no cross-column values because the selected queue row yields to the coherent brief. I do not see rankings, general metrics or a badge. Work-level uncertainty has a named next action. The revised check is **pass**: client mode names the viewed workspace, exit remains visible even at 200% zoom, and a failed restoration retains an explicit recovery path.

### Story and viewport evidence
Every ID starts `surfaces-case-owner-my-work--`: no-assigned-clients, newly-assigned-client, new-approved-idea, urgent-action, overdue-date, onboarding-incomplete, access-expired, data-error, loading, long-title, quiet, access-request-error, access-requested, portfolio-context. All select synthetic `v0/` scenarios as Case Owner. Every state has 1280×720 and 1440×900 captures; new-approved-idea also has 1366×768, 1920×1080 and 640×360@2; long-title, access-expired and access-request-error add 640×360@2. The client-view failure screenshot is separate boundary evidence, outside the new-content shots directory.

Shared-navigation baseline checkpoint: 19 completed broad captures differ from their prior baseline only by the reviewed My work label: 490 pixels, bounds [54,124,116,137]. Representative Actions, idea detail, patent detail and portfolio images were opened. These exact current captures were accepted; mixed or other-surface differences remain unaccepted. The file list and pixel evidence are in sidebar-diffs-initial.json.

## Independent review round 1
```text
VERDICT: NEEDS_WORK
SURFACE: case-owner-my-work  PERSONA: Case Owner
SCORECARD: product-fit 3 · hierarchy 4 · usability 3 · trust 3 · craft 4 · accessibility 4 · business 4
COGNITIVE LOAD: fail — At 1280×720 and 1440×900, the selected idea supports the builder’s first-glance, action and reading claims, but urgent rows require additional selection to identify the work, and client-view exit leaves scope unresolved.
FINDINGS (most severe first, max 7):

1. Client-view exit — The confirmed failed exit leaves Devika in Northwind’s Workspace Admin view; the failure screenshot shows Leah Feldman’s identity without a visible client-mode indicator or exit control — Restore the original Case Owner identity and scope on exit, retain an explicit client-view indicator and recovery control on failure, and verify the complete round trip once the auth exception is authorized.
2. Urgent-event rows in the default state — “Patent renewal” and “Response to examination report” identify client and urgency but omit the patent reference and whether the next step concerns a client instruction or recorded event; Devika must select each to discover that distinction — Include the reference and concise next-step distinction in each unselected row.
3. Newly assigned/onboarding states — “Invite inventors” or “Add a Workspace Admin” and assignment age appear in both the selected brief and assigned-client roster at both review widths; Devika rereads the same responsibility, contrary to the charter’s no-repeated-title/status rule — Keep the task and age in the brief and avoid repeating them in the supporting roster.

STATES MISSING: Successful client-view exit/restored Case Owner evidence; all eight named brief states are pictured. All 34 shots and the separate failure image were inspected.
REFERENCE MATCH: yes — Typography, restrained amber primary controls, hairline separation and list/detail composition follow the reference language; the three directions and chosen tradeoff are recorded.
```

Findings 2 and 3 are addressed in source: unselected urgent rows now show the patent reference and Review client instruction/Check recorded event distinction; the selected setup task and assignment age are suppressed from the supporting roster. The queued capture/gate continuation was stopped before it ran because these corrections require a new static build. The broad runner continues against its unchanged earlier build. Revised validation and captures are pending. Finding 1 still requires the specific auth authorization; no readiness claim.

Second shared-navigation review: 16 additional portfolio/due-date captures have the identical isolated 490-pixel label change, documented in sidebar-diffs-second.json. Opened representative empty portfolio and upcoming due-date full captures, then accepted those current renders. Total navigation-only updates: 35. Other differences remain unaccepted.

Final shared-navigation review found two remaining legacy client captures with the same exact 490-pixel label-only change. Both full images were opened and accepted; sidebar-diffs-final.json records them. Total verified navigation-only baseline updates: 37.

Two durable V0 API tests now guard BF-14 boundaries: foreign client filters cannot widen the work summary or its map, no-assignment summaries are empty, and requesting expired access stores its timestamp while client GET remains 403 and assignments remain unchanged. `npm run test:v0` passes 45/45 including both new tests (v0-boundaries.log). No auth code changed.

## Pre-authorization validation and blocked completion audit (historical)
The revised build:design and Storybook builds pass. `shots2.log` records all 34 scoped captures stable across two clean contexts with no egress. All were copied into shots; the five final default viewports and all material revisions (long title, selected setup states and map captures) were opened. The seven other changed PNGs differ by only 2–8 pixels; revision-shot-diffs.json records the comparison to the prior fully inspected set. Revised axe/overflow checks pass all 28 contexts (`axe3.log`). Final condition gate passes 7/7 (`gates-required1.log`), lint:roles passes (`roles2.log`), and V0 passes 45/45 including the two new boundary tests.

The full broad runner finished 18/23 before the reviewer UI corrections. Its recorded failures are older documentation-host allowlist entries, 99 visual differences and three unstable other-surface captures, 27 new accessibility fingerprints plus one reference Ideas age-label contrast block, 54 layout violations, and 1,257 historical conformance deviations. Of the visual differences, 22 are superseded by the final My work captures and 37 are the separately inspected navigation-label updates; 40 other/mixed differences remain unaccepted. No My work accessibility or unstable-capture finding occurred. See broad-gate-details for the full results. The runtime graph, reproducible lockfile, smoke, crawl, desktop and visible-identifier checks pass.

| Completion condition | Evidence / status |
| --- | --- |
| 1 Persona frame and roleplay | Recorded before implementation in PROGRESS and this record. |
| 2 Three directions | Written, rendered, opened and selected by cognitive load before UI work. |
| 3 Built in place | Work summary implemented and validated; required client-view boundary remains blocked. |
| 4 Intended V0 stories | Fourteen stories cover all nine intended IDs; all stories pass. |
| 5 Legacy retirement | Case Owner home story, capture and two accessibility fingerprints retired. |
| 6 Visual evidence | 34 scoped stable captures; required widths and 200% reviewed. |
| 7 Required checks | 7/7 serial gate, roles, both builds, V0 45/45; 28 axe/overflow checks clean. |
| 8 Independent PASS | Not achieved. Round 1 NEEDS_WORK; two UI findings fixed, exit defect unresolved. |
| 9 Ledger and scorecard | Ledger deliberately null; fit/usability/trust remain 3 because of exit failure. |
| 10 Merge and recap | Checkpoint committed on branch; no merge or completion recap. |

The auth exception remains pending. Once authorized, fix original-persona restoration and show an explicit client-view/recovery boundary, verify entry and exit including failure, refresh affected evidence, and obtain independent PASS before updating coverage or merging. The overall run is not complete.


## Authorized client-view correction — 2026-09-05
The user explicitly approved the requested exception with “yes fix that and continue the goal.” This addresses independent finding 1. The Case Owner must know which workspace is being viewed and return to their own assigned-client work without acquiring Photon Admin permissions. A compact persistent client-view strip places the workspace and Exit client view together above scrolling content; the existing menu exit invokes the same callback. The normal dashboard DOM is unchanged outside client mode.

The mock resolves the literal exit route before the client-ID route, restores the saved tab origin against the seeded database and returns that user's current assigned scope. It refuses missing, malformed or non-Photon-side origins rather than substituting a Photon Admin. The UI reads the existing adapter's nested user envelope, verifies original ID and role before setting the cookie or clearing mode state, and preserves the existing analytics calls. On failure the viewed identity, mode and saved origin remain intact, with an inline explanation, retry through Exit client view, and Sign in again recovery. The adapter, auth hooks, analytics module and reference components remain untouched.

Five additional durable API tests cover Case Owner and Photon Admin restoration plus missing, malformed and invalid original identity. The full-app browser journey entered client view, checked the strip at all five widths, retained client mode after a damaged origin, retried successfully, and verified exact original ID, role and assigned-client IDs on /clients. Both personas pass. The existing adapter retains its Photon-side client sentinel; no client workspace object survives restoration.

Two additional V0 stories exercise the real dashboard chrome: client-view-active (all five widths) and client-view-exit-error (1280, 1440 and 200%). The failure story returns HTTP 503 from the exit route and verifies an enabled retry, Sign in again, and retained mode. The 34 prior My work captures plus these eight boundary captures comprise the revised 42-image story set. Separate full-app screenshots corroborate the actual entry journey. Final gates, captures and independent round 2 follow below.

### Revised validation for independent round 2
Both builds and lint:roles pass; the required serial gate passes 7/7 including all story tests and V0 50/50. Axe and horizontal-overflow checks pass 32/32 contexts, including the entire client-view column. All 42 scoped story captures are re-baselined and copied; all eight new client-view images were opened and inspected. The prior 34 content captures are unchanged except 1–8 grayscale edge pixels in eleven images (auth-render-audit.json).

The optional two-context stability check passes the 34 My work images and seven of eight new boundary images. The remaining 1440 client-view failure pair differs at 53 grayscale edge pixels in the unchanged shared chrome/reference cards, with zero changed pixels in the client-mode/recovery notice. Both full images were opened; geometry confirms no page scroll or overflow. This is a recorded capture-rasterization limitation, not a waived product defect. The required single-capture update passes all three failure-state widths with no egress (auth-shots-final.log). No screenshot threshold or reference component was changed.

## Independent review round 2
```text
VERDICT: NEEDS_WORK
SURFACE: case-owner-my-work  PERSONA: Case Owner
SCORECARD: product-fit 4 · hierarchy 4 · usability 4 · trust 4 · craft 4 · accessibility 4 · business 4
COGNITIVE LOAD: fail — At 1280×720 and 1440×900, my default-state roleplay agrees with the builder’s six answers, but repeated setup responsibilities in other current renders still break the charter’s no-repeated-title/status rule.
FINDINGS (most severe first, max 7):

1. Setup task and assigned-client roster — The selected-state duplication is fixed, but urgent-action and overdue-date at 1440×900 still repeat Beacon’s “Invite inventors” and assignment age in both locations; new-approved-idea at 1920×1080 does likewise, requiring Devika to reconcile two presentations of one responsibility — Suppress roster task and age whenever that responsibility already appears in the work queue, regardless of selection.

STATES MISSING: none — All 49 current screenshots inspected; browser evidence confirms restoration of both original personas and scopes, supported by passing API tests; exit failure retains visible recovery.
REFERENCE MATCH: yes — Typography, amber primary controls, hairline separation and list/detail composition follow the reference language; three directions and the chosen tradeoff are recorded; the disclosed 53 grayscale edge pixels have no visible effect on readability, layout, scope or recovery.
```

The sole round-2 finding is corrected: the supporting client roster now suppresses setup task and assignment age whenever that client has a setup responsibility in the work queue, independently of which item is selected. The primary queue retains the responsibility and age. Client-view restoration and its error boundary are accepted by the reviewer. Sign-in recovery also attempts the existing logout endpoint before clearing local auth state. Revised captures and final review follow.

### Final review evidence
After the roster correction, both builds pass, all 34 core captures pass two-context stability/no-egress and are copied into the record, and the required gates pass 7/7. Axe/overflow remains clean in all 32 contexts. Opened the five final default viewports and all materially changed urgent, overdue and map captures. round3-render-diffs.json identifies the five material changes; all other differences are small rendering noise or unchanged. A separate full-app test confirms Sign in again calls logout, reaches /login and clears both saved client-mode keys (signin-recovery.log).

## Independent review round 3 — approved
```text
VERDICT: PASS
SURFACE: case-owner-my-work  PERSONA: Case Owner
SCORECARD: product-fit 4 · hierarchy 4 · usability 4 · trust 4 · craft 4 · accessibility 4 · business 4
COGNITIVE LOAD: pass — At 1280×720 and 1440×900, my six answers agree with the record: approved work leads, Open approved idea dominates, necessary context stays together, nothing requires cross-pane memory, secondary content recedes, and scope and recovery are clear.
FINDINGS (most severe first, max 7):
None. Setup responsibility and age appear only in the queue in urgent/overdue 1440 and default 1920; the roster duplication is resolved.
STATES MISSING: none — All 42 story images and 7 supplementary boundary images inspected; latest validation records successful persona restoration and sign-in recovery.
REFERENCE MATCH: yes — Typography, amber primary controls, hairline separation and list/detail composition follow the approved language; three directions and the chosen tradeoff are recorded.
```

## Completion
All ten surface conditions are satisfied for merge: persona/roleplay and three rendered directions recorded; selected implementation built in place; all intended stories and boundary states covered; replaced legacy home coverage retired; required viewports captured and opened; both builds, 7/7 required gates, roles, 50 V0 tests and 32 accessibility/overflow contexts pass; independent PASS received within three rounds; scorecard all 4 and cognitive-load pass; coverage records DSN-0016. Merged into main with --no-ff as b76468e and pushed; the concurrent firing yield notes were preserved. The earlier full broad-gate findings remain documented follow-ups and are not claimed clean.
