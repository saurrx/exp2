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
In progress. Coverage remains null until the required evidence and independent PASS.

## Implementation checkpoint
The 1,800-line legacy table wrapper is replaced in place by the same scoped query feeding a token-based urgency list and focused event record. Source and latest correction recede; missing dates and disputed records remain honest. Date edits require a correction note and retain source/row provenance. Completion has its own confirmation and preserves the related Action. Existing spreadsheet import is reused with a due-date count and return label. A month filter acts on the server's full result set, replacing the misleading page-only calendar. The old calendar and unused reminder component, two legacy stories/captures and their accessibility fingerprints are retired.

BF-13 declares nullable dates, owner derived from existing Case Owner assignments, source and correction metadata, operator-only existing PATCH corrections and additional date filters. Missing dates are excluded from overdue checks in dependent mock readers. No adapter, shared hook, auth, analytics, product-context, reference screen or dependency changes. The /actions component now honors a supplied application search so the related Action link is useful. At 200%, client/reference/date stay in the compact record and secondary owner/status/patent title can be expanded. This surface joins the existing desktop-zoom CSS exceptions; the device gate is unchanged.

Eighteen new stories and all 332 story tests passed in the first full run; V0 38/38. API/UI probes pass for saved corrections with source row and named updater, event completion independent of Action status, reopening, scoped writes for all four roles, invalid-date refusal, missing-date filtering, retained edits across selection, spreadsheet import and 200% editing/navigation. A later serial gate exposed a focus timing race; synchronous layout focus now fixes it. Final validation remains in progress.
