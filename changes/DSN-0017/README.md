# DSN-0017 · Photon Admin dashboard

## Intent and persona frame
Tobias Berg must keep ownership and incoming client work under control across Photon Legal. The existing home leads with portfolio charts and broad metrics, so ownership gaps and failed imports do not lead to a clear next step. The job is to open the highest-priority operational record with its client, owner and consequence clear. The object is a client responsibility, approved idea, client instruction/date or import correction. Intended business signal: shorter time with an unassigned client or approved work waiting for attention, guarded by accurate source availability and useful scoped links. No measured improvement is claimed.

## Cognitive-load roleplay
1. First glance: an unassigned client and the ownership responsibility.
2. One thing: open the relevant record to resolve the next exception.
3. Read: client, owner, object, age/date and what happens next; skip firm portfolio totals until needed.
4. Remember: no numbers across panels; the selected brief brings all decision context together.
5. Never needed: client rankings, cost/revenue metrics, a map before work, duplicated responsibilities or client-review controls.
6. Anxiety: whether anything is missing from the check, which client is affected and who owns it. Name a missing source and provide reload; do not imply an all-clear from incomplete data.

## Three directions
| Direction | Leads / recedes / task flow | Character and business hypothesis | Main risk and choice |
| --- | --- | --- | --- |
| A · Exception brief | Ownership gaps then incoming work in a grouped queue; one coherent brief and action; firm context below | Calm control; reduces the time to identify an accountable next step | Lowest reading and memory cost, with scope and owner beside the action. Selected after opening all three low-fi renders. |
| B · Client control ledger | Client rows compare ownership, incoming work and next responsibility; details open from a row | Precise inventory; supports client-by-client allocation | Tobias must compare clients and columns to decide what should lead. |
| C · Daily operations digest | A short narrative explains today's highest-priority gap; category disclosures follow | Calm orientation; speeds a small daily check | Work becomes harder to scan when exceptions grow, and the narrative repeats queue facts. |

## Validation status
The final implementation and rendered evidence are available for independent review. Required serial checks are queued behind the ongoing broad runner; no coverage or merge claim is made yet.

## Implementation and preserved boundaries
The existing Index route and dashboard query feed a presentational PhotonAdminDashboard. Ownership gaps lead, then approved ideas (oldest waiting first), urgent client instructions/dates, configuration and failed imports. Each selected brief brings client, Case Owner, reference, age/date and a specific record-opening action together. Selection survives navigation in the URL. A secondary Refresh operations control uses the existing refetch callback after work on another route; it resolves the five-minute cache without changing query policy.

The mock adds declared aggregate field BF-15 on the existing dashboard response, derived from client assignments, actual approval transitions, events/instructions, workspace members and latest import attempts. Failed imports reveal row errors on demand. Missing sources stay null and named, never zero. Active patent and recent-filing totals drill into matching portfolio filters; the existing map uses firm-wide active jurisdictions below work. No adapter, shared query hook, auth, analytics, reference component, dependency or product-context edits.

Retired the Photon Admin legacy Dashboard story, its baseline and its two accessibility fingerprints. The legacy client journey remains for DSN-0018, since it covers client management rather than this dashboard.

## Stories and rendered review
Prefix: `surfaces-photon-admin-dashboard--`. Suffixes: healthy-operations, unassigned-client, aging-approved-ideas, urgent-actions, failed-import, missing-client-configuration, no-exceptions, partial-data, loading, data-error, long-title and portfolio-context. All select deterministic v0/photon-admin scenarios. Each state has 1280×720 and 1440×900 captures. Healthy operations also has 1366×768, 1920×1080 and 640×360@2; partial data and long title have extra zoom captures. All 29 images in shots/ were opened individually. After adding Refresh operations and the previous-period filing link, a separate final Storybook build produced all 29 current captures with the repository capture algorithm and two-render stability. These now replace shots/. All five final default viewports were opened and inspected again; layout and primary action remain sound. The exact repository re-baseline command is queued behind the broad runner.

Rendered roleplay confirms the task leads: healthy operations opens the incoming approved idea; ownership-gap state opens assignment first. Read client, Case Owner, title/reference, elapsed time and consequence; no comparison of totals is needed. Other work is grouped and the selected title is not repeated. Map/totals recede. At zoom the work chooser collapses the queue and leaves the current client, owner and primary action visible; detailed next-step prose is disclosed. Failed import identifies the affected client and specific rows. Partial data names the missing check and retains known work. No false all-clear is shown.

## Builder scorecard
| Category | Score | Rendered evidence |
| --- | --- | --- |
| Product fit | 4 | Firm operations, ownership and incoming work lead; four-persona boundaries preserved. |
| Hierarchy | 4 | One selected operational brief and amber primary action; compact firm context and map below. |
| Usability | 4 | Exact destination links, retained selection, refresh/reload recovery, clear long/empty/error states. |
| Trust | 4 | Source-based ages, named owners and missing sources; no fabricated zero or implied approval. |
| Craft | 4 | Reference typography, token spacing, 36px controls and hairline list/detail separation. |
| Accessibility | 4 | Final isolated-build 24 accessibility/overflow contexts clean; long/partial zoom actions fully visible. |
| Business | 4 | Direct ownership and work handoff reduce coordination steps; no unmeasured success claim. |

Cognitive-load check: pass on inspected captures. No leading map/metric, duplicate selected title, extra lifecycle stage, badge, destructive action or horizontal scroll. Final review and checks remain pending.

## Validation checkpoint
Both builds, all 360 interaction tests, V0 53/53, required gate 7/7 and 29 scoped two-render captures pass before the refresh-control addition. Full-app functional probe passes assignment plus dashboard refresh, approved-idea navigation and Back selection, firm totals and filtered portfolio destinations, map expansion/close, exact urgent instruction/date destinations, failed-import context and partial-data reload (functional3.log). Full broad gate remains running. Final capture refresh, required checks and independent evaluator will be recorded before coverage or merge.

Final isolated-build evidence: storybook-isolated-final.log, shots-isolated-final.log (29 captures, stable within 40 pixels, zero egress), axe-isolated-final.log (24 contexts, zero violations/overflow) and functional-final.log (all five workflows pass, including prior-period date-range navigation). Independent review follows against the current shots/.

## Independent evaluator · round 1
```text
VERDICT: PASS
SURFACE: photon-admin-dashboard  PERSONA: Photon Admin
SCORECARD: product-fit 4 · hierarchy 4 · usability 4 · trust 4 · craft 4 · accessibility 4 · business 4
COGNITIVE LOAD: pass — At both default widths, incoming work leads, one clear action follows adjacent client/owner/context, totals can be skipped, and no cross-panel memory is required, matching the record’s rendered roleplay.
FINDINGS (most severe first, max 7):
None.
STATES MISSING: none; all 29 screenshots inspected.
REFERENCE MATCH: yes — Consistent typography, restrained amber primary controls, hairline separation and list/detail hierarchy; firm totals and geography remain below operational work.
```
