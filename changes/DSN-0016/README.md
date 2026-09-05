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
