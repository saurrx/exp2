# DSN-0009 — Ideas list

Status: in progress. Branch: `codex/dsn-0009-ideas-list`.

## Intent
Inventors find own/credited drafts and submissions, understand the next step and start an idea. Case Owners find received ideas for assigned clients; Photon Admin oversees received ideas across clients. Each row opens the existing record directly. Workspace Admin keeps the approved queue and receives V0 stories only.

## Three directions
| Direction | Leads / recedes | Persona adaptation | Cognitive cost and tradeoff | Choice |
|---|---|---|---|---|
| A · Task list | Compact direct-opening rows; title, state and next step; optional filters | Inventor: update and advisory score. Photon: client and owner, oldest received first | One stable scan path; no group selection or status reconstruction; columns reflow at zoom | Selected |
| B · Status lanes | Ideas grouped by existing status | Inventor: with you/review/Photon. Photon: received/filed grouping | Makes distribution visible but requires scanning several lanes; status groups cost laptop width and zoom height | Rejected |
| C · Recent activity | Recency groups and change descriptions | Inventor: last updates. Photon: most recent handoffs | Reassures on change, but readers must reconstruct current status and older received work recedes | Rejected |

All three low-fidelity renders use synthetic content and link rows directly to records. Task list has the lowest reading and recall cost for these jobs. The reference queue is not redesigned.

## Persona frame and cognitive-load check
Object: one idea, either the Inventor's own/credited disclosure or a record received by Photon. Consequence: a row opens the existing detail route; drafts continue through its existing disclosure redirect. Primary action starts an idea for Inventor and opens the first visible received record for Photon roles. The Workspace Admin continues to decide in the reference queue.

| Roleplay | Inventor · Anika | Case Owner · Devika / Photon Admin · Tobias | Workspace Admin · Leah |
|---|---|---|---|
| First glance | Own ideas and the start action; then title, state, update and score | Received work, client and Case Owner beside the record | Existing oldest-first queue and selected brief |
| One thing | Start an idea; existing rows describe their next step | Open the first relevant filing brief | Send to Photon Legal after review |
| Read / skip | Title and next step; filters when looking for something; detailed evidence stays in the record | Client, ownership and submission age; no inventor score columns | List title/age, selected brief and decision |
| Remember | No score or state across panels; each is adjacent to its idea | No client/owner lookup on another screen | Selected title remains above its brief |
| Never need here | Density/card toggles, decorative score chips, duplicate menu, nonfunctional Delete, report popup, due dates or Actions | Draft authoring, unapproved ideas or evaluation detail before opening a brief | An extra preview before the existing decision pane |
| Anxiety resolved | One advisory note; next owner named; evaluation running/failed/stale is explicit | Current client and Case Owner are named; unassigned is stated rather than blank | At zoom, queue selection returns to the same brief and keeps the decision visible |

The task list passes the charter at the four laptop sizes. At 200% zoom, filters are disclosed through Filters and sort; rows reflow, navigation remains available, and the primary action stays in the header. The reference queue's existing two panes switch at zoom through Choose idea / Back to brief. No permission or decision mutation changed.

## What moved and what stayed
- Rebuilt the existing `IdeasContent` view in place around direct-opening rows, neutral text, hairline separation and existing token/primitives. Removed the alternate card/density presentation, inline report popup, unsupported Duplicate and nonfunctional Delete menu entries. No authorized permission affordance depended on those menu entries.
- Preserved `/ideas`, `/ideas/:id`, the existing draft redirect, `fetch_ideas`, client lookup, draft/score endpoints, and the shared adapter/auth/query hooks. Corrected the local draft query to read the response envelope and key drafts by current idea IDs. Evaluation status is fetched from the existing endpoint and polled while running; no simulated progress.
- Inventor default is Recently updated. Photon default is Sent to Photon Legal, Oldest submitted, using the API's submission timestamp and naming it accurately. All received ideas includes filed records. These views do not offer unapproved drafts; the underlying client access is unchanged.
- Search is URL-encoded; sort and page are reflected in the URL. Browser Back restores search and results. Error recovery retains filters. Draft/evaluation fetch failure is distinct from Not evaluated.
- BF-10 adds V0 `Idea.case_owners`, derived from existing Case Owner assignments. No new endpoint, permission, status or persona. Three focused V0 scenarios supply drafts-only, mixed (including requested changes and running evaluation), and long titles; existing scenarios supply the other states.
- **Reference defect fixed:** the Workspace Admin queue overflowed at 640×360@2 and clipped its decision pane. A compact queue/brief switch and navigation menu now expose the same controls at that size. Desktop two-pane styling and review data/mutations remain intact. `WorkspaceAdminOverview` was not edited.

## States and evidence
All eleven intended IDs exist under `Surfaces/Ideas list` and select a `v0/` scenario. Every story has 1280×720 and 1440×900 baselines; four persona defaults additionally have 1366×768, 1920×1080 and 640×360@2. Baselines and supplemental interaction screenshots are copied in `shots/`.

| Story suffix (`surfaces-ideas-list--`) | Scenario / state |
|---|---|
| inventor-empty | v0/inventor/first-run |
| inventor-drafts-only | v0/ideas/drafts-only |
| inventor-mixed | v0/ideas/mixed; requested changes, evaluation running, credited review, sent, rejected, draft |
| workspace-admin-pending | v0/workspace-admin/queue |
| workspace-admin-large-queue | v0/workspace-admin/large-aging-queue |
| workspace-admin-filtered-empty | v0/workspace-admin/queue, real search interaction |
| case-owner | v0/case-owner/my-work |
| photon-admin | v0/photon-admin/firm |
| long-titles | v0/ideas/long-titles |
| loading | v0/ideas/mixed with list latency |
| error | v0/ideas/mixed with list failure and retry |

Supplemental browser evidence: every persona at all five sizes has a visible primary action and no document overflow; zoom navigation, first-row reflow, reference queue selection, Inventor filtered-empty recovery and Case Owner client filtering. Full mock app checks prove direct detail navigation for Inventor and both Photon roles, plus browser Back preserving search. All probes blocked egress and recorded zero outbound requests.

Legacy retirement: deleted the four `Legacy reference/Screens/Ideas` stories and their four tracked baselines. No remaining QA journey step exercises the replaced Inventor/Photon Ideas list. The remaining legacy review-queue journey steps belong to the next Review decision surface and are retained for that change.

## Scorecard
| Category | Score | Evidence |
|---|---|---|
| Product fit | 4 | Persona-specific columns, approved received scope, direct record routes |
| Hierarchy | 4 | One primary action; each row keeps title/state/next step together; filters recede at zoom |
| Usability | 4 | Search, client/status/sort, paging, preserved URL, loading and explicit retry |
| Trust | 4 | Numeric 0–10 score with one band; real evaluation status; named ownership; advisory once |
| Craft | 4 | Reference type, token colors, small controls, neutral rows and hairlines |
| Accessibility | 4 | Keyboard links/controls, visible focus, zoom navigation and reflow; focused axe zero |
| Business | 4 | Faster retrieval and filing handoff; submission remains available without evaluation |

Success signal: retrieval-to-record and return-to-draft completion should improve; completed submissions remain the guardrail. No new analytics or metric was added, and these scores are a design critique rather than measured user outcomes.

## Validation
- Full story suite: 263/263 pass; V0 semantic suite: 38/38 pass.
- Typecheck, role lint, generated tokens, design build, Storybook build and required selected gates pass (7/7).
- Scoped screenshots stable within the existing 40-pixel tolerance, no egress.
- Focused axe: eight list contexts, zero findings. Full app navigation and 20 persona/viewport geometry probes pass.
- Initial build/test failures from a missing skeleton import and deleting a legacy file during build were corrected before the passing run.
- Product context, adapter, shared hooks, auth, analytics, dependencies and Workspace Admin Overview are unchanged.

## Known compromises / follow-ups
- Photon ordering uses the available submission timestamp, labelled Oldest submitted; a separate receipt timestamp is not invented.
- The reference review content, decision failure states and source-field completeness are the next DSN-0010 scope. This change fixes its demonstrated zoom defect only.
- Existing dashboard date-window forwarding is retained; date-window contract reconciliation is outside this list visual change.

## Independent evaluator
Pending fresh-context review. Coverage dsn remains null until PASS.

Final visual inspection: all four persona defaults opened at all five sizes. The empty, drafts-only, long-title, loading, error, filtered-empty and large-queue renders were also opened. At zoom, the first Inventor idea now exposes its status and score immediately; Case Owner/client attribution remains in the row. There are 34 story baselines plus 11 supplemental screenshots (45 PNGs total). Reload ideas is secondary to the persistent start action, avoiding two primary controls on the error state.
