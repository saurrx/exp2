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
Pending. Coverage remains null until implementation, required renders/checks and fresh evaluator PASS.

## Transport and navigation defects exposed by the surface
Canonical detail reads retain missing dates and patent inventors rather than the legacy adapter's inferred creation-date fallback and idea-inventor substitution. The query key, patent prop and existing GET/update routes remain. Same-client document association is modeled as BF-11; canonical assignee/family/history fields are now honored by the existing mock update handler. Patent-file downloads alone opt into native byte responses; legacy file routes retain their existing behavior. No adapter, auth, analytics or shared query-hook file changed.

Full-app verification exposed two required navigation defects. Portfolio return context existed only in navigation state, which the mock bootstrap clears on reload; the record URL now retains the existing portfolio query and the single header Back link restores it. The existing Due dates component disabled its query for Photon-side users with no personal client_id, although those roles are authorized by assigned/all-client scope. A minimal prerequisite fix enables the existing scoped query for those existing roles. No new route, query endpoint, permissions, or due-date redesign is introduced; that surface remains DSN-0015.
