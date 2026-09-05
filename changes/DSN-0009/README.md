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
- **Reference defect fixed:** the Workspace Admin queue overflowed at 640×360@2 and clipped its decision pane. A compact queue/brief switch and navigation menu now expose the same controls at that size. Desktop two-pane arrangement and review mutations remain intact; later evaluator corrections to content and duplication are recorded below. `WorkspaceAdminOverview` was not edited.

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

Legacy retirement: deleted the four `Legacy reference/Screens/Ideas` stories and their four baselines and four stale actual captures. No remaining QA journey step exercises the replaced Inventor/Photon Ideas list. The remaining legacy review-queue journey steps belong to the next Review decision surface and are retained for that change.

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
- Decision failure states remain the next DSN-0010 scope. This change also corrects the reference content/repetition defects found by the evaluator, as recorded below.
- Existing dashboard date-window forwarding is retained; date-window contract reconciliation is outside this list visual change.

## Independent evaluator
Fresh-context evaluator PASS in round 3; verdicts and corrections are recorded below.

Final visual inspection: all four persona defaults opened at all five sizes. The empty, drafts-only, long-title, loading, error, filtered-empty and large-queue renders were also opened. At zoom, the first Inventor idea now exposes its status and score immediately; Case Owner/client attribution remains in the row. There are 34 story baselines plus 11 supplemental screenshots (45 PNGs total). Reload ideas is secondary to the persistent start action, avoiding two primary controls on the error state.


## Evaluator round 1 — NEEDS_WORK
```text
VERDICT: NEEDS_WORK
SURFACE: ideas.md  PERSONA: Inventor, Workspace Admin, Case Owner, Photon Admin
SCORECARD: product-fit 4 · hierarchy 3 · usability 3 · trust 3 · craft 4 · accessibility 2 · business 4
COGNITIVE LOAD: fail — At 1280×720 and 1440×900, status and ownership support retrieval, but the independent roleplay finds repeated reading and unresolved review evidence that contradict the record’s claimed pass.
FINDINGS (most severe first, max 7):

1. Zoom navigation, all personas — menu labels appear faint and overlap underlying titles, ownership, and evaluation text, forcing readers to disentangle destinations from content — render an opaque, legible menu above page content and capture its settled state.
2. Workspace Admin brief — “A short inventor-written summary…” supplies no substantive summary, while the mechanism is missing and the assessment asserts novelty; Leah must open further evidence before understanding the proposed invention — render meaningful synthetic disclosure content and a consistent assessment before claiming decision readiness.
3. Workspace Admin selected record — its score repeats in the queue and assessment, and its title repeats across the queue, heading, assessment, and summary; Leah rereads the same information, violating the charter’s explicit repetition rule — remove redundant score/title occurrences while preserving selection context.
4. Inventor first-run empty state — search, status, and sort precede the explanation despite there being no ideas to retrieve; the Inventor must skip controls irrelevant to starting — hide retrieval controls for the genuinely empty first-run state.

STATES MISSING: none — all ten brief states are represented across the 45 inspected PNGs.
REFERENCE MATCH: no — desktop typography, restrained color, hairlines, and review panes broadly match; the overlapping, faint zoom navigation does not preserve the reference’s legibility.
```

## Round 2 corrections
- Navigation menus explicitly use opaque token colors and respect reduced motion. Supplemental screenshots now wait for the settled menu and its dismissal. The first captures caught the transition before it settled.
- The reference queue now reads canonical problem/solution question IDs as well as its older IDs. It avoids placeholder inventor summaries and consumes meaningful synthetic evidence for the pending and large queue scenarios. The assessment describes the returned overlap/difference consistently with the band, without repeating the title. No review mutation or decision rule changed.
- The selected queue row shows its reference/selection cue instead of repeating the detail title and score. Other rows retain their scan columns; the compact queue shows the selected title when the brief is hidden. This is the evaluator-exposed repetition defect in the approved reference, not a new queue direction.
- Genuinely empty Inventor first-run state omits retrieval controls. Search/filter-empty recovery still exposes them.

Round 2 completed; the remaining advisory-label finding is recorded below.

Round 2 validation: full stories 263/263, V0 38/38, selected gates 7/7, both builds and refreshed stable screenshots pass. All twenty primary-action/overflow probes pass, zoom filters open and close, and eight focused axe contexts have no findings. Settled navigation captures were reopened and show opaque legible menus. Required Storybook build twice failed with a public-assets mkdir race; `.storybook/main.ts` now disables Vite’s duplicate public-directory copy while retaining Storybook staticDirs. The next build passed. The initial unchanged-desktop comparison log predates the evaluator’s repetition/content corrections; remaining legacy review baselines are refreshed for those documented defects.

## Evaluator round 2 — NEEDS_WORK
```text
VERDICT: NEEDS_WORK
SURFACE: ideas.md  PERSONA: Inventor, Workspace Admin, Case Owner, Photon Admin
SCORECARD: product-fit 4 · hierarchy 4 · usability 4 · trust 3 · craft 4 · accessibility 4 · business 4
COGNITIVE LOAD: fail — At 1280×720 and 1440×900, retrieval, ownership and next steps support the recorded roleplays, but the Workspace Admin must still infer whether the assessment is advisory before deciding.
FINDINGS (most severe first, max 7):

1. Workspace Admin assessment — “AI evaluated” identifies its source but never states its advisory nature in the pending or large-queue brief; Leah must infer how much authority to give the score before sending the idea to Photon Legal — state once beside the assessment that it is AI-assisted and advisory.

STATES MISSING: none — all ten brief states are represented across the 45 inspected PNGs.
REFERENCE MATCH: yes — restrained typography, hairline separation, compact controls and the desktop review panes preserve the reference language; settled zoom menus are now legible.
```

## Round 3 correction
The Workspace Admin assessment now says “AI-assisted and advisory” once beside the assessment and full-evaluation link. This corrects the evaluator-exposed trust defect without changing review behavior.

## Evaluator round 3 — PASS
```text
VERDICT: PASS
SURFACE: ideas.md  PERSONA: Inventor, Workspace Admin, Case Owner, Photon Admin
SCORECARD: product-fit 4 · hierarchy 4 · usability 4 · trust 4 · craft 4 · accessibility 4 · business 4
COGNITIVE LOAD: pass — Independent six-question roleplays at 1280×720 and 1440×900 agree with the record: tasks lead, relevant context stays adjacent, unnecessary evidence recedes, and next steps and advisory status are explicit.
FINDINGS (most severe first, max 7):
None.
STATES MISSING: none — all ten required states are represented across the 45 inspected screenshots.
REFERENCE MATCH: yes — restrained typography, compact controls, hairline separation, and the review panes preserve the reference language; zoom navigation remains legible.
```

Final verification: the advisory-copy change passes typecheck, both builds, stable affected-story screenshots and all twenty geometry/interaction probes. Reopened all five Workspace Admin defaults plus the large queue and zoom selection. Prior full stories (263/263), V0 (38/38), role/token checks, focused axe and selected gates remain the broader validation evidence.

After setting coverage: final gates 6/6 pass (typecheck, roles, tokens, V0, coverage and runtime graph).
