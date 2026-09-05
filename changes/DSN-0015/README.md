# DSN-0015 · Photon due dates

## Intent and persona frame
Devika, Case Owner, arrives to find the next responsibility across her assigned clients. Tobias, Photon Admin, arrives to catch overdue work and ownership or data-quality gaps across the firm. The object is a recorded patent event with a deadline, owner and related instruction. The job is to keep that event visible and accurate. The primary consequence is saving a corrected event; completion removes it from upcoming work without silently completing a separate Action. The intended success signal is fewer unresolved or missed responsibilities, guarded by client scope, truthful missing/disputed dates and retained edits. No measured improvement is claimed.

## Cognitive-load roleplay
1. First glance: urgency and the next event, with its client scope immediately visible.
2. One thing: open the relevant event and maintain its accurate date or completion state; Edit event leads the selected record.
3. Read: event, urgency/date, patent reference, client, Case Owner and current state. Source details and related Action evidence unfold when needed.
4. Remember: identity, deadline and edit/confirmation stay together. Preserve filtering when returning from related records.
5. Never needed: spreadsheet decoration, patent legal-state columns, a large calendar before the queue, a badge, client instruction controls, docketing integrations or Inventor access.
6. Anxiety: missing dates and import issues are named honestly; saving and completion have separate explicit consequences; failed changes remain available to retry.

## Three directions
| Direction | What leads and recedes | Hypothesis and risk | Choice |
| --- | --- | --- | --- |
| A · Urgency queue and focused event record | Urgency/event list leads into one coherent record/editor; source and calendar context recede | Lowest memory cost when correcting a date; the selected row must avoid duplicating the record | Selected after visual review |
| B · Day-grouped agenda with expanding rows | Work grouped by day, with editing inside a row | Strong same-day scanning, but a large day or open editor displaces subsequent work | Rejected: less stable reading position during correction |
| C · Month navigator with an urgent side list | Calendar capacity leads while urgent work remains alongside | Helps distribution planning but delays the everyday event correction and competes at laptop widths | Rejected: calendar is secondary to the brief's urgency job |

The choice is pre-authorized by the run's cognitive-load contract. All three low-fidelity HTML/PNG renders in `directions/` were opened before UI changes. A keeps a stable event identity while editing; B displaces the agenda and C makes the calendar compete. The calendar may remain a small secondary planning aid; it must never hide the actionable queue.

## Boundaries
Keep /due-dates and the scoped all_due_dates query, existing adapter and shared hooks. Workspace Admin continues into the completed Actions design on the same technical route. Inventor receives the existing blocked-redirect behavior instead of any due-date content. Photon manual maintenance and spreadsheet import follow the brief; any missing fields or routes are declared in the mock. References, product context, auth, analytics and dependencies remain unchanged.

## Validation
Independent evaluator round 2 PASS, seven scores of 4, no findings or missing states. Final required serial gate passes 7/7 (`gates-final2.log`), including typecheck, tokens, V0, current coverage and all story interactions; lint:roles separately passes. Both final builds pass. V0 API/semantic tests pass 43/43. All 20 surface stories exist. Fifty-one captures pass two-clean-render stability with no egress (`shots3.log`, targeted save recovery `shots-save-final.log`, completed/Workspace Admin refresh `shots-review2.log`). The initial refresh had one intermittent save-error zoom difference; the targeted two-render rerun passed. All 40 accessibility/zoom contexts are clean (`axe4.log`). Full-app correction, recovery, import, scope and exact Action/Back navigation checks pass (`functional2.log`, `extra1.log`, `recovery1.log`, `navigation1.log`).

## What changed and what stayed
The 1,800-line legacy table wrapper is replaced in place by the same scoped query feeding a token-based urgency list and focused event record. Source and latest correction recede; missing dates and disputed records remain honest. Date edits require a correction note and retain source/row provenance. Completion has its own confirmation and preserves the related Action. Existing spreadsheet import is reused with a due-date count and return label. A month filter acts on the server's full result set, replacing the misleading page-only calendar. The old calendar and unused reminder component, two legacy stories/captures and their accessibility fingerprints are retired.

BF-13 declares nullable dates, owner derived from existing Case Owner assignments, source and correction metadata, operator-only existing PATCH corrections and additional date filters. Missing dates are excluded from overdue checks in dependent mock readers. No adapter, shared hook, auth, analytics, product-context, reference screen or dependency changes. The /actions component now honors the exact related request as well as its application search. Browser Back restores client, month, deadline filter and selected event, including a patent with two instructions. At 200%, client/reference/date stay in the compact record and secondary owner/status/patent title can be expanded. This surface joins the existing desktop-zoom CSS exceptions; the device gate is unchanged.


## Rendered review and cognitive-load check
All 51 final captures have been reviewed (the original 47 were opened in full, followed by refreshed recovery, navigation, completed and Workspace Admin captures and defaults): every story at 1280×720 and 1440×900; Case Owner and Photon Admin defaults also at 1366×768, 1920×1080 and 640×360@2; editing, failure, confirmation, long content and import also at 200%. The first pass exposed the legacy body width floor and a save-error message below sticky controls. The surface now reflows at 200%; error recovery scrolls its message above the save controls and was functionally checked at 1280 and 640. Final captures show the recovery message and retry controls together.

| Scorecard | Score | Rendered evidence |
| --- | --- | --- |
| Product fit | 4 | Scoped patent-event maintenance; missing/disputed dates and unassigned ownership stay explicit. |
| Hierarchy | 4 | Event urgency and one selected record lead; Edit event is primary, completion secondary, provenance below. |
| Usability | 4 | Retained edits, retry, cancel and reopening; scoped search/month/pagination; matching Action link. |
| Trust | 4 | Recorded dates are never inferred; source row survives correction; named updater and distinct completion consequences. |
| Craft | 4 | Reference token/type/button language, hairline separation, bounded reading width and no ornamental data cards. |
| Accessibility | 4 | All 40 accessibility/zoom contexts have zero violations and zero horizontal overflow; keyboard and zoom recovery checked. |
| Business | 4 | Makes unresolved events easier to find and correct; completion and source checks guard against merely clearing a queue. |

Case Owner post-render roleplay: (1) I first see the next recorded event and urgency in my assigned scope. (2) Edit event leads, then Save event commits the correction. (3) I read the event, reference, client, date and owner; I skip source details unless checking a discrepancy. (4) Client/reference stay with the editor and confirmation; retained edits avoid remembering changes when selecting another event. (5) I do not need a full month grid, patent lifecycle columns, client-instruction controls or decoration. (6) The correction note, visible retry and explicit independent event completion tell me what is saved and what changes.

Photon Admin post-render roleplay: (1) The missing-date event leads, with Orbital Foods and Unassigned ownership visible at ordinary laptop widths. (2) I correct the recorded event. (3) I read urgency, event, client/owner and date; I open the Action or provenance only when required. (4) The same focused record prevents a cross-row comparison while editing. (5) There are no firm vanity totals, leading calendar or navigation badge. (6) The source remains traceable and completing an event cannot silently complete a client's Action. At 200%, client/reference/date and the primary action stay together; owner/status and full patent title use one compact disclosure.

Known compromises: the optional calendar is a server month filter with the actionable list preserved; it makes no day-grid capacity-count claim. The mock import models deterministic outcomes rather than parsing a real docketing system. Only the latest correction is exposed, labelled honestly; BF-13 is conceptual until backend verification. The existing Case Owner sidebar Overview label belongs to the upcoming My work surface and is not changed here. No founder decision is required.

## Story and capture inventory
Every ID below is prefixed `surfaces-photon-due-dates--`. Every state has 1280×720 and 1440×900 captures. Upcoming and photon-admin additionally have 1366×768, 1920×1080 and 640×360@2; edit-date, save-error, completion-confirmation, long-title and spreadsheet-import additionally have 640×360@2.

| Story suffix | Persona | Scenario |
| --- | --- | --- |
| `upcoming` | Case Owner | `v0/due-dates/upcoming` |
| `due-soon` | Case Owner | `v0/due-dates/due-soon` |
| `overdue` | Case Owner | `v0/due-dates/overdue` |
| `completed` | Case Owner | `v0/due-dates/completed` |
| `missing-date` | Case Owner | `v0/due-dates/missing-date` |
| `import-problem` | Case Owner | `v0/due-dates/import-problem` |
| `large-same-day-group` | Case Owner | `v0/due-dates/large-same-day-group` |
| `no-upcoming-dates` | Case Owner | `v0/due-dates/no-upcoming-dates` |
| `loading` | Case Owner | `v0/due-dates/upcoming` |
| `error` | Case Owner | `v0/due-dates/upcoming` |
| `photon-admin` | Photon Admin | `v0/due-dates/firm-scope` |
| `case-owner-scope` | Case Owner | `v0/due-dates/firm-scope` |
| `edit-date` | Case Owner | `v0/due-dates/missing-date` |
| `save-error` | Case Owner | `v0/due-dates/upcoming` |
| `completion-confirmation` | Case Owner | `v0/due-dates/upcoming` |
| `long-title` | Case Owner | `v0/due-dates/long-title` |
| `spreadsheet-import` | Case Owner | `v0/due-dates/upcoming` |
| `inventor-refused` | Inventor | `v0/inventor/portfolio` |
| `related-instruction` | Case Owner | `v0/due-dates/same-patent-events` |
| `workspace-admin-continuation` | Workspace Admin | `v0/actions/action-required` |

## Independent review, round 1
```text
VERDICT: NEEDS_WORK
SURFACE: due-dates  PERSONA: Case Owner and Photon Admin
SCORECARD: product-fit 4 · hierarchy 4 · usability 4 · trust 4 · craft 4 · accessibility 4 · business 4
COGNITIVE LOAD: pass — At 1280×720 and 1440×900, both personas can identify the event, urgency, client and owner, then edit without remembering information across screens; this supports the recorded roleplays.
FINDINGS (most severe first, max 7):
1. Completed-state evidence — Both completed captures show “No open patent events” with “Open events” selected, leaving completed-record status and reopening unreviewable — Capture the completed filter with a selected completed event at both review widths.
2. Workspace Admin continuation — No capture demonstrates this persona reaching Actions through /due-dates, leaving the stated permission boundary unverified visually — Capture that continuation with contextual dates and without Photon maintenance controls.
STATES MISSING: Completed-event list/detail; Workspace Admin continuation to Actions. Inventor refusal is present.
REFERENCE MATCH: yes — Consistent two-pane layout, hairline separation, restrained typography and amber primary controls.
```

Both requested evidence corrections are addressed: Completed now opens the completed filter directly, removing interaction timing from its initial capture; Workspace Admin continuation has an explicit V0 Actions scenario on the existing /due-dates route. No product change is required.


## Broad regression result
The full runner finished 18/23. It passed typecheck, role/routes, manifest, tokens, adapter fidelity, V0, coverage, both builds, 332 pre-final story tests, smoke, all-persona crawl, desktop gate, visible-UUID checks and lockfile/runtime graph. Required surface gates are evaluated separately below. Failures retained in `broad-gate-details/`: older-log documentation-host allowlist; 39 other-surface screenshot failures; accessibility ratchet (27 new fingerprints and one blocking Ideas reference contrast finding, none in due dates); layout (54 reports, principally screen-reader-only portfolio elements and other surfaces; due dates/Actions all checked combinations pass); 1,213 structural deviations against the historical mock baseline, including intentional redesign changes. The informational parallel-isolation probe also fails; story checks remain serial. These are recorded as run follow-ups; unrelated baselines are not accepted.

## Independent review, round 2
```text
VERDICT: PASS
SURFACE: due-dates  PERSONA: Case Owner and Photon Admin
SCORECARD: product-fit 4 · hierarchy 4 · usability 4 · trust 4 · craft 4 · accessibility 4 · business 4
COGNITIVE LOAD: pass — Independent six-question roleplays at 1280×720 and 1440×900 support the recorded answers: urgency leads, Edit event is clear, necessary context stays together, secondary evidence recedes, and correction and completion consequences are explicit.
FINDINGS (most severe first, max 7):
None.
STATES MISSING: none — All 51 screenshots inspected, including completed records, Inventor refusal and Workspace Admin continuation to Actions.
REFERENCE MATCH: yes — Two-pane list/detail, restrained typography, hairline separation and amber primary controls match the approved visual language.
```

Post-ledger validation: V0 passes 43/43 (`v0-ledger.log`); coverage is 12/17 with this surface recorded as DSN-0015.
