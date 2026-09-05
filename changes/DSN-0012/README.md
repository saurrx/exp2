# DSN-0012 — Patent portfolio

## Persona, job and consequence
Inventor Anika Sharma wants to find a company patent and understand its status without operational administration. Workspace Admin Leah Feldman wants a clear view of company assets and upcoming responsibilities. Case Owner Devika Nair searches within assigned clients and maintains portfolio data. Photon Admin Tobias Berg maintains the firm-wide portfolio with client scope visible. The product object is a patent record; the leading action is Search patents, followed by opening the matching record. Import is a secondary operational task and the primary recovery for an empty operational portfolio. Success signal: faster accurate retrieval and fewer scope/filter errors, with permission and export fidelity as guardrails; no new analytics.

## Three directions
| Direction | Leads and recedes | Interaction and character | Business hypothesis / risk | Cognitive-load choice |
|---|---|---|---|---|
| A · Compact search list | Search and scope lead; record number/title, status, jurisdiction and filed date remain; optional fields recede | Filter then open the existing detail route; one calm aligned list, responsive rows at zoom | Faster lookup without spreadsheet scanning; must keep client attribution and optional evidence readable | Selected: least reading before retrieval and no extra selection/preview step |
| B · List and selected brief | Search list beside a read-only preview; metadata unfolds in the preview | Select, inspect, then open record | Helps comparisons but repeats title/state and adds a preview decision before the existing detail route | Rejected: more remembering and an unnecessary intermediate view |
| C · Jurisdiction overview | Jurisdiction/status groups lead above a compact list | Choose a geography, then find a record | Explains distribution but delays a specific lookup and duplicates dashboard geography | Rejected: the brief makes jurisdiction a filter, not the main task |

A preserves the route, existing component props, query state/cache contract, permission checks, export registration and supported upload/import flow. No reference-screen change is planned. The adapter, authentication and analytics files stay unchanged. Any existing transport defects that prevent required filtering/export are recorded separately and corrected only within this surface's authorized contract.

## Cognitive-load roleplay
1. First glance: search and visible company/client scope; the matching records follow.
2. One thing: Search patents, then open the identified record. Import leads only for an empty operational portfolio.
3. Read: application/reference number, title, status, jurisdiction and filing date. Operational readers also see client and next date; optional fields are requested through Columns.
4. Remember: no number/title copied into a preview; the record link carries context to its existing route, and filters remain in the URL for return.
5. Never needed: row numbers, flags as data, a map competing with search, default abstracts, or Inventor due dates/import controls.
6. Anxiety: scope and matching totals are explicit; failures offer retry; import results name the affected client and distinguish created, unchanged and failed rows.

## Validation
Complete after fresh evaluator round 2 PASS; the coverage matrix records DSN-0012.

## What moved and stayed
The existing list is now four aligned columns: application/title, status, jurisdiction and filed date. Operational readers get client attribution and a status editor; authorized readers get the next pending date. Optional fields unfold under records through Columns. Search leads, jurisdiction counts live in its filter, and empty/error states give a specific recovery. Import has client/file selection, a protected pending state, row-level results and retained-input retry. Export shares the exact list filter interpretation. Laptop content reflows into stacked records at desktop zoom with a navigation menu; the desktop access gate is unchanged.

The `/patents` and `/patents/:patentId` routes, component props, URL state, cache invalidation, permission checks and existing status/upload/import endpoints remain. No adapter, auth, analytics, shared query-hook or reference-screen file changed. The detail screen's existing rendering is retained for DSN-0013. Transport fixes are recorded separately in `transport-defects.md`.

## Mock and coverage
No new endpoint, field, status or permission. Existing list/export handlers now share search, status, tag, jurisdiction, date and sorting semantics. Paging precedes row enrichment so large lists only enrich the requested page. Native CSV Response handling is opt-in to this export endpoint. V0 Inventor list rows omit due dates; operational import enforces stored-file/client scope. Added only two uncovered scenarios: `v0/portfolio/long-titles` and `v0/portfolio/import-result`. Other stories select existing V0 company, assigned-client, firm, large, empty and failure scenarios.

All twelve intended `surfaces-patent-portfolio--` IDs exist, plus `import-failure`, `import-in-progress`, `empty-case-owner` and `empty-photon-admin`. Five legacy portfolio stories and their ten baseline/actual PNGs and four a11y fingerprints are retired. The two legacy patent-detail stories stay for DSN-0013. No four-persona legacy portfolio UI journey remains; the independent legacy superadmin API scope journey is not replaced by this surface and remains regression-only.

## Rendered scorecard and cognitive-load check
Builder scores: product-fit 4 · hierarchy 4 · usability 4 · trust 4 · craft 4 · accessibility 4 · business 4. Search is the dominant action; import and export recede. The same row carries the identifying number and title, with no intermediate preview or repeated status. Client scope and jurisdiction counts are explicit. Whitespace and hairlines separate records. Default fields fit each review width, and optional fields wrap rather than adding horizontal scrolling. No invented metrics, guarantees or due dates for Inventors. These are design-review scores, not evidence of measured user/business improvement.

Rendered roleplay confirms the six frame answers above: search and current scope lead for each persona, only identification/status/geography/date need scanning, and the existing detail link is the next step. Optional evidence costs one explicit Columns choice. Back retains the filter. Failure keeps the source file/client; import results separate added, updated, unchanged and failed rows. Initial zoom review exposed the inherited body minimum width, now corrected only for this surface. Fresh evaluator round 1 requested clearer import recovery, error-action hierarchy and operational empty-state evidence; corrections are described below. Round 2 returned PASS.

## Evidence
`shots/` includes every story at 1280×720 and 1440×900; all four default personas also at 1366×768, 1920×1080 and 640×360@2. Supplemental zoom captures cover long titles, optional fields and import result/failure/pending. Default renders were opened and inspected. Eight focused axe contexts have zero findings; their zoom probes have no page or table overflow (`a11y2.log`). Four-persona actual CSV downloads equal the matching status/jurisdiction count, and clear/paging work (`functional.log`). Full-app navigation opens the existing detail route and browser Back preserves jurisdiction (`navigation.log`). Retained-input import retry completes, pending cannot close with Escape, and optional fields fit zoom (`ops.log`). Required gates and independent evaluation are recorded below when complete.

## Known limits and follow-ups
The existing mock import is a deterministic result simulation, not a spreadsheet parser; its partial-error result now lists all nineteen failed rows. Backend implementation still needs to honor the existing route's exact query semantics described in the transport record. Large lists use server-style paging; no real customer corpus was used. The existing parallel-story isolation probe remains informational and fails because shared cookie identity leaks between frames; the required story suite runs serially. No founder decision is needed.


## Evaluator round 1 corrections
The fresh read-only evaluator returned NEEDS_WORK (full output: `evaluator-round1.log`). Corrected all four findings: the source filename renders explicitly through pending/failure; the row-error disclosure contains all 19 failed row numbers/messages and is collapsed until requested; Reload patents is dominant after load failure; and Case Owner/Photon Admin empty portfolios have both review-width screenshots and zoom coverage. Import is dominant in the operational empty states. Supplemental checks confirm both empty states can switch back to all allowed clients, and the full error list/return control can be reached at zoom. No product-boundary or reference-match finding was reported.

The first repeated capture also exposed a jurisdiction story that did not await its filtered records. The state now initializes the existing jurisdiction URL filter and asserts US rows; the separate four-persona functional probe exercises changing the dropdown. Required checks pass after the corrections; the revised screenshot states render twice in clean contexts for stability (`shots5.log`, with the jurisdiction state superseded by `shots7.log`). The required gate run passes 8/8 (`gates5.log`), and the final focused stories pass 16/16 (`focused7.log`).


## Independent evaluator round 2 — verbatim
```text
VERDICT: PASS
SURFACE: patent-portfolio  PERSONA: Inventor, Workspace Admin, Case Owner, Photon Admin
SCORECARD: product-fit 4 · hierarchy 4 · usability 4 · trust 4 · craft 4 · accessibility 4 · business 4
COGNITIVE LOAD: pass — At both default review widths, all four persona roleplays align with the record’s six answers: search leads, identification stays together, scope is explicit, and unrelated operational controls recede or are absent.
FINDINGS (most severe first, max 7):
None.
STATES MISSING: none — all 56 PNGs inspected; every brief state is represented.
REFERENCE MATCH: yes — restrained typography, compact controls, gold primary actions, hairline separation and consistent navigation match the reference language.
```

Final operational save verification exposed and corrected the canonical status payload in the component (see transport record). The actual existing PATCH response saves GRANTED and the refreshed list shows Granted (`status8.log`); both builds and typecheck pass after that payload-only correction. No rendered layout changed.

## Final validation
Final required gate run: 8/8 PASS (`final-gates.log`), including typecheck, role checks, token generation, V0 semantics, current coverage, full serial story interactions and runtime graph. Both builds pass after the status payload correction. Final focused portfolio stories pass 16/16. Revised visual states pass two-clean-context stability; final jurisdiction capture is in `shots7.log`. Focused axe remains zero, and the functional/export, existing-route navigation, import recovery and saved status checks pass. The parallel-frame isolation probe is informational and retains its documented pre-existing failure. Coverage is 9/17; next surface is Patent detail (DSN-0013).
