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
Pending. Coverage stays null until the required render review, checks and independent PASS.
