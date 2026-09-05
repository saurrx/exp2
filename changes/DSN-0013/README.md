# DSN-0013 — Patent detail

## Persona, job and consequence
Inventor Anika Sharma wants to understand a company patent and its connection to an invention without learning an operations system. Workspace Admin Leah Feldman checks the asset and an upcoming responsibility. Case Owner Devika Nair maintains a reliable record for an assigned client; Photon Admin Tobias Berg corrects firm-wide data quality. The product object is one patent record. Identity and recorded legal state lead. The primary operational action is Edit patent, followed by Save patent changes; the read-only variants lead with the record and the relevant existing disclosure/Actions destination when available. Changes must be attributable to the right client and persist without hiding failed edits. Success signal: accurate record comprehension and fewer correction/retrieval errors; permissions, faithful dates, complete documents and retained work guard against superficial speed. No new analytics.

The existing screen spreads the record across equally weighted cards and duplicated document areas. It contains unused hardcoded patent/person data, references legacy field names that the mock does not return, and treats loading as its only request state. The desired outcome is a calm, trustworthy record with optional evidence and an operational editor. Required states: four persona variants, pending, filed, granted, inactive, closed, incomplete import, multiple family members, absent originating idea, many documents, upcoming event, loading and unavailable record.

## Three directions
| Direction | What leads / recedes | Flow and character | Business hypothesis / main risk | Decision |
|---|---|---|---|---|
| A · Record brief with progressive evidence | Identity, state and compact key facts lead; family, documents, timeline and maintenance detail unfold below | Read the record in one place; follow its related idea or contextual Action; enter a focused editor when permitted | Lowest retrieval cost and no repeated identity; long evidence must remain navigable at zoom | Selected: least reading and remembering for all four personas |
| B · Lifecycle-led record | Recorded milestones lead beside identity; metadata and evidence sit below | Trace how the asset reached its state before opening supporting fields | Useful for progress questions but distracts from ordinary identity lookup and overweights incomplete histories | Rejected: timeline is supporting evidence, not the universal task |
| C · Tabbed record workspace | Identity stays above separate Details, Family, Documents and History views | Pick a category, read it, switch to the next | Compact initial screen but makes the reader remember facts across tabs and discover empty categories | Rejected: more navigation and memory for the same record |

All three preserve the current route and persona boundaries. A uses whitespace, rules, compact controls and existing primitives from the reference language. No reference-screen change is planned. The existing query identity, API route and update flow remain; transport/model gaps necessary for the brief will be recorded explicitly, with proposed mock fields/routes only when required.

## Cognitive-load roleplay
1. First glance: the patent title, application/reference number, status and jurisdiction identify the asset immediately.
2. One thing: understand the record; for an operator, Edit patent leads into an explicit save. For the Workspace Admin, the next event leads to its existing Actions area; for the Inventor, the accessible originating disclosure is supporting context.
3. Read: identity/state, brief key facts and abstract. Open family, documents and recorded history only when needed; maintenance fields are for operators.
4. Remember: identity and legal state remain together; no parallel duplicate preview or status summary. Edits and failures stay on the record. Related routes retain usable return context.
5. Never needed: Inventor due dates/Actions, raw IDs, unused hardcoded people/patent facts, duplicate attachments, flags as data, or a milestone claimed complete without evidence.
6. Anxiety: missing imported fields say not recorded, dates come from recorded data, documents name the file, and failed saves preserve inputs. An unavailable record offers a specific recovery without rendering its internal identifier.

## Validation
Implementation and required checks are complete; final independent review is pending. Coverage remains null until the evaluator returns PASS.

## Transport and navigation defects exposed by the surface
Canonical detail reads retain missing dates and patent inventors rather than the legacy adapter's inferred creation-date fallback and idea-inventor substitution. The query key, patent prop and existing GET/update routes remain. Same-client document association is modeled as BF-11; canonical assignee/family/history fields are now honored by the existing mock update handler. Patent-file downloads alone opt into native byte responses; legacy file routes retain their existing behavior. No adapter, auth, analytics or shared query-hook file changed.

Full-app verification exposed two required navigation defects. Portfolio return context existed only in navigation state, which the mock bootstrap clears on reload; the record URL now retains the existing portfolio query and the single header Back link restores it. The existing Due dates component disabled its query for Photon-side users with no personal client_id, although those roles are authorized by assigned/all-client scope. A minimal prerequisite fix enables the existing scoped query for those existing roles. No new route, query endpoint, permissions, or due-date redesign is introduced; that surface remains DSN-0015.

## What moved and what stayed
Identity, recorded status, jurisdiction, filing/grant dates, inventors and assignee now form one brief, followed by the abstract. Family, documents, lifecycle and additional details are progressive disclosures. Operational notes and corrections appear only for Case Owner and Photon Admin. Their client remains in the persistent header, and Edit patent leads to a focused form with persistent Save/Cancel controls. Workspace Admin dates and Actions lead the context column; the originating disclosure recedes. At zoom, the read-only primary context precedes supporting facts in both visual and reading order. Unknown dates stay unknown. There is one document list, with download, retained upload retry and a removal confirmation.

The route, patentId prop, detail query key, canonical status vocabulary, existing same-origin upload and update flows, four-persona permissions and company portfolio visibility remain. No new dependency or token was added; controls use the existing 36px button variant. The reference components, adapter, auth, analytics and shared query-hook files are unchanged. The unrelated legacy global style injection and unused hardcoded patent/person data were removed from this surface. The parent layout changes apply only to patent detail title/Back context; the tiny Due dates prerequisite is recorded above.

## Stories, states and retirement
All 15 intended `surfaces-patent-detail--` IDs exist: inventor, workspace-admin-upcoming-event, case-owner-editor, photon-admin-editor, pending, filed, granted, inactive, closed, incomplete-imported-record, multiple-family-members, no-originating-idea, many-documents, loading and error. Supplemental states: case-owner-record, photon-admin-record, save-failure, saving, save-success, document-failure, remove-document and long-title. All 23 select V0 scenarios. Pending and filed both use the existing APPLIED status, distinguished by a recorded filing date; inactive uses EXPIRED and closed uses WITHDRAWN. No status enum or workflow stage was invented.

The two replaced legacy patent-detail stories, their three baseline/actual PNGs and two accessibility fingerprints were removed. No four-persona legacy patent-detail UI journey existed. The independent legacy superadmin API scope journey remains regression coverage. Two operational Due dates baselines were refreshed for the prerequisite query correction and are retained until DSN-0015; those captures live in prerequisite-shots, outside the patent review set.

## Render review and scorecard
The record includes every story at 1280×720 and 1440×900. Inventor, Workspace Admin, both operational record variants and both editor variants also have 1366×768, 1920×1080 and 640×360@2 captures: 68 standard captures. Four supplemental zoom captures show primary links, notes with a visible Save control, and successful retained-file retry. Default layouts were opened and inspected; the header, full title and single primary control remain legible, and evidence scrolls without horizontal overflow. Buttons use the reference's 36px variant. Screenshot stability is checked with the unchanged 40-pixel tolerance; a borderline antialiasing pair is recaptured rather than loosening the gate.

Builder scorecard: product-fit **4**, hierarchy **4**, usability **4**, trust **4**, craft **4**, accessibility **4**, business **4**. Identity/state lead without card decoration; authorized actions stay explicit, and empty/failed work has usable recovery. Dates and inventors come from the actual record, and client scope remains visible. Functional verification establishes correct retrieval/correction behavior, not a measured user-productivity gain. Accurate lookup and correction with fewer errors is the intended success signal; saved data, permission fidelity and preserved work are its guardrails.

Post-render cognitive-load check: (1) title, application number and recorded state are the first glance; (2) operators see Edit then Save, Workspace Admin sees the next dated Action, Inventor sees the available disclosure link; (3) the reader scans identity and the short facts/abstract, opening evidence only when needed; (4) the persistent client/editor controls and URL-preserved return filters reduce memory across edits/navigation; (5) Inventors have no operational dates, Actions or maintenance fields, and no reader sees raw IDs or duplicated document areas; (6) missing imported data is named, failed edits/files are retained, pending controls are protected and successful changes are acknowledged. A read-only record with no originating idea promotes no invented workflow action; the existing portfolio Back control is its exit.

## Verification and limits
Final required gates passed 8/8 (`gates-review2-final.log`), including typecheck, role lint, token freshness, V0 semantics/coverage and the complete serial story suite. Both design and Storybook builds passed. The focused accessibility pass covers all 23 patent-detail states plus the two affected legacy Due dates states: zero findings; all 23 patent states have no page overflow at zoom (`a11y-review2.log`). Keyboard scrolling remains available while Save disables form controls.

Full-app tests cover all four personas: canonical assignee/family updates survive refresh, patent inventors remain faithful, read-only writes are rejected, uploads/downloads round-trip original bytes, removal can be canceled/confirmed, Back preserves the portfolio search after reload, and contextual links render the matching due-date event (`functional-review2-final.log`). Foreign/unassigned patent reads return 404 and the Inventor's originating disclosure opens the existing detail route (`boundaries.log`). Retained save/upload retry and zoom notes editing with Save visible pass (`zoom-review2.log`).

BF-11 document association remains conceptual until the real backend contract is verified; no real service was contacted. The broad all-story accessibility ratchet is **not green**: its attempt reported unrelated unnamed-landmark and contrast findings on earlier disclosure/evaluation/idea/client/reference stories. These are recorded in PROGRESS.md for the run sweep and not baseline-whitelisted. The three findings attributable to this change were fixed and the focused 25-state pass is green. Required surface gates remain green. Fresh independent evaluator verdict is pending below; coverage stays 9/17 until PASS.

## Independent review round 1 and corrections
The reviewer identified three task-level defects: removal confirmation below the viewport, repeated title/status in the operational editor, and contradictory native/retained file-selection text. The editor now starts with one compact Edit patent record heading under the persistent client header; title and status appear only in editable fields. Document removal replaces its own row with the complete question and decisions, receives keyboard focus and scrolls the complete prompt into view. File selection now uses one named Choose/Change document control and one authoritative selected filename. Removal now has a supplemental zoom capture and a viewport assertion for its decision control.

Round 1 verdict, verbatim:

```text
VERDICT: NEEDS_WORK
SURFACE: patent-detail  PERSONA: Inventor, Workspace Admin, Case Owner, Photon Admin
SCORECARD: product-fit 4 · hierarchy 3 · usability 3 · trust 3 · craft 4 · accessibility 4 · business 4
COGNITIVE LOAD: fail — Default views at both review widths support the builder’s roleplay, but operator editing repeats identity/status and document recovery requires avoidable guessing.
FINDINGS (most severe first, max 7):

1. Document removal, Photon Admin — At 1280×720 the confirmation is outside the viewport; at 1440×900 its question appears at the bottom with the decision controls below it, requiring the operator to hunt after clicking Delete — Place confirmation beside the selected document or bring the complete confirmation into view.
2. Operator editors, both personas — At 1280×720 and 1440×900 the patent title and status appear in both the header and editable fields, breaking the charter’s explicit no-repetition rule and requiring comparison between saved and edited values — Use a compact editing header retaining client context, with title and status shown once in their fields.
3. Failed document upload, Case Owner — “No file chosen” contradicts “Selected: synthetic-evidence.txt” and the retained-file reassurance, including at 200% zoom; the operator must decide which message to trust before retrying — Present one authoritative retained-file state with a clear retry control.

STATES MISSING: none of the brief’s named states; the removal confirmation controls are not visible in either supplied removal capture.
REFERENCE MATCH: yes — Typography, compact amber controls, restrained borders, whitespace and hairline separation match the reference language.
```

Revised captures were inspected at both review widths and zoom: removal question and both decisions are visible together; the editor retains client context without repeated saved fields; upload retry has one selected filename. Focused accessibility is clean in all 25 contexts, retained save/upload retry passes at zoom, and full-app four-persona verification confirms cancel/confirmed removal against stored data as well as document byte integrity. The 49-pixel antialiasing pair in Photon Admin editor was recaptured at the unchanged tolerance and passed.

Final revision validation: `gates-review2-final.log` passes 8/8, both revised builds pass, and the 23 patent stories pass within the complete serial suite. The first revised suite run had a transient prior-surface Patent Portfolio / Multiple Jurisdictions selection failure; the unchanged rerun passed. The isolation probe remains informational and is not counted as a passing test. Current evidence logs are committed with this record.
