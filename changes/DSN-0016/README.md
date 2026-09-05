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
In progress; coverage stays null until rendered evidence, required checks and independent PASS.

All three low-fidelity renders were opened before UI changes. A is selected: the stable focused brief avoids comparing client groups or three lanes. The map follows assigned-client work. BF-14 adds scoped dashboard context on the existing route; no adapter or shared hook changes.

## What moved and what stayed
The Case Owner branch of the existing home component now renders the priority queue and selected brief instead of aggregate panels and a ranking. Assigned clients, filing updates and the scoped map follow operational work. Selection is stored in the URL so Back restores the brief; exact downstream record links preserve event/instruction identity. Long titles reflow at 200% zoom and supporting explanation moves into progressive disclosure. Empty, loading and failed data reads remain distinct; an access request exposes pending, stored-success and retry states.

The route, dashboard query, adapter, shared hooks, auth, analytics, reference components and token source stay intact. The map receives an optional supplied jurisdiction summary; existing consumers keep their original behavior. The only shared navigation change renames the Case Owner home to My work, without a badge. The legacy Case Owner Dashboard story/capture and its two accessibility fingerprints are retired. The existing client journey belongs to Clients and onboarding and remains for DSN-0018.

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
| Product fit | 3 | Work hierarchy and assigned scope fit; the required client-view exit fails. |
| Hierarchy | 4 | One selected brief and primary action lead; map and client context follow. |
| Usability | 3 | Exact links, Back, retained requests and recovery pass; client-view exit blocks overall readiness. |
| Trust | 3 | Dates and scope are grounded; a failed identity restoration remains unresolved. |
| Craft | 4 | Token-based typography, hairline groups and consistent controls across the inspected widths. |
| Accessibility and resilience | 4 | Long-title and error zoom controls remain visible; 28 axe/overflow contexts pass. |
| Business | 4 | New approvals and urgent events lead into existing records; no measured outcome claim. |

### Cognitive-load check on the render
As Devika, I first see the selected newly approved idea, with client and reference adjacent. I read its client, approval age, title and next step before Open approved idea; I skip the lower map, filing history and client roster. I retain no cross-column values because the selected queue row yields to the coherent brief. I do not see rankings, general metrics or a badge. Work-level uncertainty has a named next action. The overall check remains **fail** because entering client view currently leaves me without a working exit; that cannot be waived by the quality of My work itself.

### Story and viewport evidence
Every ID starts `surfaces-case-owner-my-work--`: no-assigned-clients, newly-assigned-client, new-approved-idea, urgent-action, overdue-date, onboarding-incomplete, access-expired, data-error, loading, long-title, quiet, access-request-error, access-requested, portfolio-context. All select synthetic `v0/` scenarios as Case Owner. Every state has 1280×720 and 1440×900 captures; new-approved-idea also has 1366×768, 1920×1080 and 640×360@2; long-title, access-expired and access-request-error add 640×360@2. The client-view failure screenshot is separate boundary evidence, outside the new-content shots directory.

Shared-navigation baseline checkpoint: 19 completed broad captures differ from their prior baseline only by the reviewed My work label: 490 pixels, bounds [54,124,116,137]. Representative Actions, idea detail, patent detail and portfolio images were opened. These exact current captures were accepted; mixed or other-surface differences remain unaccepted. The file list and pixel evidence are in sidebar-diffs-initial.json.
