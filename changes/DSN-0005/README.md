# DSN-0005 — Inventor home

Status: approved; awaiting merge.

## Persona and intent

Anika Sharma is an occasional Inventor returning after engineering work. She needs to find her idea and know what to do next, or start with material she already has. The idea is the object; its draft, review or filing state determines the next step. **Submit an idea** starts the existing draft flow, not a review submission. The desired business signal is increased starts and completed submissions, guarded by understanding of review ownership and no accidental submissions.

Required states: first run, invited inactive, no ideas, one draft, several statuses, requested changes, recent submission, evaluation available, loading and error. Preserve the existing route, query hooks, adapter and modal flow. Company momentum and patent map follow personal work. No Inventor rankings, Actions or due dates.

## Three directions

| Direction | Leads and flow | Recedes | Character / business hypothesis | Cognitive cost / risk | Choice |
|---|---|---|---|---|---|
| A — A simple idea list | My ideas header and Submit an idea; full-width rows pair title with the next step | Pipeline, collective momentum and map below the list | Calm and direct; easy recognition brings inventors back to unfinished work | Read one title and next step; no selection state or remembered comparison | Selected: fewest decisions and smallest reading cost |
| B — List and selected brief | My ideas in a left pane; selected idea's status and action in a right pane | Company context below both panes | Focused; more detail could speed a return to an idea | Select before seeing the next step; title/status repeat and sparse detail consumes space | Not selected |
| C — Grouped work stages | Drafts, review and filing grouped into separate columns | Company context below the board | Encouraging; progress across stages may motivate participation | Compare columns and scan categories before locating a title; too much density for an occasional user | Not selected |

Low-fidelity renders: `directions/a.png`, `directions/b.png`, `directions/c.png`. These are synthetic wireframes, not production screenshots.

## Cognitive-load roleplay before build

1. First glance: My ideas and Submit an idea, rather than a number or the map.
2. One thing: start an idea; the sentence beside the primary action explains that it starts a draft.
3. Read a title and its next step; skip summary counts and company context until needed.
4. Remember nothing between panels: action and state stay together in the idea row.
5. No firm metrics, Actions, dates, rankings or detailed evaluation evidence here.
6. Anxiety: starting is not sending to review; existing ideas name who acts next in one sentence.

## What moved and what stayed

Restyled the existing `MyIdeas` component and its placement in `Index`. Full-width rows show a reference number, one state, title and next-step sentence. Requested changes and drafts precede passive review states. The list shows five ideas and retains the all-ideas destination. An evaluated draft keeps its existing submission affordance, now secondary and confirmed; failed submission leaves the draft and confirmation recoverable.

Personal pipeline, collective company momentum, and the existing patent map follow the ideas. Removed the equal-weight personal dashboard cards, stale-activity nudge and isolated score. The main start flow, route, data hooks, adapter, auth, analytics and reference components are unchanged. Existing Button and Dialog primitives are reused. Colors use the existing tokens; no token additions or new primitive.

The global 1024px body floor initially clipped the start action at 200% zoom. A `body:has([data-inventor-home])` rule lets only this surface reflow and removes the layout's legacy minimum height so the bottom remains reachable. The device access gate and other surfaces are unchanged. All five measured document/main widths and main heights fit their viewport with no horizontal scrolling.

The single primary action is in the existing sticky `PageHeader` slot, so it remains available after scrolling. At widths where the sidebar is hidden, a secondary Navigation menu exposes Home, My ideas, Patents and Profile. Successful home submission refreshes both the existing idea list and the new pipeline summary.

## Mock additions

`Dashboard.inventor_home` is declared as BF-6 in `mock/proposed-fields.json`: full-scope personal pipeline counts and company-only aggregate submissions this calendar quarter / ideas that reached filing all time. It uses the existing dashboard query and adapter pass-through. No colleague names or idea details cross the Inventor's read scope. Six focused V0 scenarios cover states the previous portfolio scenario did not isolate. Existing first-run and slow-network scenarios are reused; the error story overrides the registered ideas route with a failed response.

## Story and screenshot coverage

All ids are under `surfaces-inventor-home--`:

| Suffix | Scenario | Viewports |
|---|---|---|
| first-run | v0/inventor/first-run | 1280×720, 1440×900 |
| invited-inactive | v0/inventor/first-run, invited persona | 1280×720, 1440×900 |
| no-ideas | v0/inventor/no-ideas | 1280×720, 1440×900 |
| active-draft | v0/inventor/active-draft | 1280×720, 1440×900 |
| several-statuses (default review state) | v0/inventor/several-statuses | 1280×720, 1366×768, 1440×900, 1920×1080, 640×360@2 |
| requested-changes | v0/inventor/requested-changes | 1280×720, 1440×900 |
| recent-submission | v0/inventor/recent-submission | 1280×720, 1440×900 |
| evaluation-available | v0/inventor/evaluation-available, score 2.3/10 | 1280×720, 1440×900 |
| loading | v0/shape/slow | 1280×720, 1440×900 |
| error | v0/inventor/several-statuses, failed ideas read | 1280×720, 1440×900 |

23 baseline screenshots were generated with `node tools/design/shots.mjs --update --only '^surfaces-inventor-home--'` and copied to `shots/`. Each default viewport was opened and inspected; state contact sheets were also inspected. Supplemental company-context screenshots at 1280 and 1440 show the below-fold momentum and map. Removed the two replaced legacy Inventor dashboard stories, their three baseline/comparison files, and the home-start step from the legacy Inventor journey; the disclosure portion remains for DSN-0006.

## Scorecard after rendering

| Category | Score | Evidence / limit |
|---|---|---|
| Product fit | 4 | Personal work leads; company-only context follows; no Inventor dates, Actions or ranking. |
| Hierarchy | 4 | One amber start action, plain next-step actions, map below work. |
| Usability | 4 | State and next step stay together; explicit loading/retry and recoverable confirmation. |
| Trust | 4 | Start versus review consequence is explicit; optional low-score submission is enabled. |
| Craft | 4 | Reference typography, hairlines, navy context numbers and small-radius 36px actions. |
| Accessibility / resilience | 4 | Semantic lists/headings/buttons, descriptive action names, reduced-motion placeholders, measured reflow at five widths. |
| Business | 4 | Less interpretation before starting or returning; actual uplift needs usage research. |

## Cognitive-load roleplay on the render

1. At 1280 and 1440 my first glance is My ideas and the amber Submit an idea control. The map does not compete.
2. Starting a draft is the one dominant action; its consequence is explained beside it. Returning to an existing idea uses that row's quieter action.
3. I read the matching title and next-step sentence. References help recognition but need no interpretation. Pipeline and collective totals can be skipped.
4. I remember nothing across panels: each row keeps state, title and next action together. Pipeline counts summarize the population, not another rendition of an individual idea.
5. No named ranking, firm administration, due date, Action, or prior-art detail appears.
6. The review row names the Workspace Admin as next owner. The draft row says I can continue; starting does not send it. Submission has a confirmation and recoverable failure.

Hard-rule check: one primary action; no repeated individual score/title/status; no false reached stage; no horizontal scrolling; no unearned cards; conclusion and next action before detail; product exclusions absent. The brief intentionally puts a personal pipeline after the list.

## Verification

- `npm run typecheck`, `npm run lint:roles`, `node tools/tokens.mjs --check`: pass.
- `npm run test:v0`: 33/33 pass.
- `npm run test:stories`: 214/214 pass across 52 files.
- `npm run build:design`, `npm run storybook:build`: pass.
- Screenshots: 23/23 written, no egress.
- Browser layout measurements: document/main scroll widths fit at 1280, 1366, 1440, 1920 and 640 CSS pixels (200% device scale).
- Selected gate runner: 7/7 passed again after the final source and coverage updates (including 214/214 story tests).

## Evaluator iteration

Round 1 returned NEEDS_WORK: task hierarchy and cognitive load passed, but navigation was absent at 200% zoom and the start action scrolled away. The complete verdict is in `evaluator-round-1.txt`. Both were corrected through the existing page-header slot and dropdown primitive. All 23 baselines were regenerated. Supplemental screenshots now show the persistent action while scrolled and the open navigation menu at 200%. `layout-check.txt` records no horizontal overflow, a viewport-sized scroll area, a visible primary action at the bottom of the page, and no egress at all five widths. Round 2 returned PASS with all categories at 4, cognitive load passed, no findings and no missing states.

Known compromises: existing downstream start/disclosure/detail screens are scheduled separately. The home keeps their routes. Map expansion retains the existing dialog. The prototype's invited persona is represented by the existing mock session; real invitation acceptance remains the authentication surface. This is not a claim of measured business uplift or a user study.

## Final fresh-context verdict

```text
VERDICT: PASS
SURFACE: inventor-home  PERSONA: Inventor
SCORECARD: product-fit 4 · hierarchy 4 · usability 4 · trust 4 · craft 4 · accessibility 4 · business 4
COGNITIVE LOAD: pass — At 1280×720 and 1440×900, my six roleplay answers agree with the record: the task leads, starting is clear, rows pair ideas with next steps, nothing requires cross-panel memory, excluded content is absent, and review ownership is explicit.
FINDINGS (most severe first, max 7):
None.
STATES MISSING: none
REFERENCE MATCH: yes — Typography, amber primary action, restrained navy accents, compact controls and hairline separation match the reference language; the simpler list suits the Inventor’s task.
```
