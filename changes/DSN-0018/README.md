# DSN-0018 · Clients and onboarding

## Intent and persona frame
Tobias Berg configures the firm's clients and assigns responsibility; Devika Nair supports assigned clients. Both must find the right client, understand what is missing and complete onboarding without guessing which controls work or which workspace they affect. The existing card/table switch, metrics and repeated details scatter this job. The primary object is the client workspace, with its domain, owners, people, invitation method, import evidence and upcoming work. Intended signal: less time between client creation and completed setup, guarded by accurate scope, recoverable input and honest readiness. No measured improvement is claimed.

## Cognitive-load roleplay
1. First glance: the client and its next setup responsibility, before portfolio totals.
2. One thing: open the relevant client and complete that next step.
3. Read: client, owner, setup state and the action's consequence; skip details until needed.
4. Remember: no cross-section counts, emails or statuses; each task keeps its context together.
5. Never needed: plan/price, decorative client cards, two duplicate list modes, repeated identity or a control from another persona.
6. Anxiety: which client's data I am changing, whether an invitation/import worked and whether access is authorized. Keep source status, preserved edits and recovery next to the action.

## Three directions
| Direction | Leads / recedes / task flow | Character and business hypothesis | Risk and choice |
| --- | --- | --- | --- |
| A · Client brief | Compact client rows and one selected setup brief; client record leads with the next incomplete step and discloses supporting groups | Calm and accountable; fewer comparisons before opening the right responsibility | Lowest reading and memory cost for both onboarding and ongoing support. Selected after opening all three low-fi renders. |
| B · Onboarding rail | Ordered setup checklist dominates every client record; each step opens its own panel | Guided and reassuring; helps first-time setup | A ready client still appears to be an onboarding task, and daily support recedes too far. |
| C · Client ledger | Wide comparative rows show setup, participation, work and portfolio across clients | Precise inventory; helps firm-wide allocation | More columns and competing values than either persona needs before opening one client. |

## What changed and what stayed
The existing `/clients` list and `/clients/:clientId` record now use a compact list/selected brief and one next setup step. Search, page and selection use the URL; the explicit Back to clients link restores the search. Create client asks for the organization name, then opens the record to configure domain, assign ownership, invite the first Workspace Admin, establish an inventor invitation method, import a portfolio and review readiness. The editor preserves values on failure. Domain and duplicate-domain errors stay next to the save flow.

The client identity/owner header stays visible while scrolling. Supporting setup evidence, people/invitations, ideas/portfolio/upcoming work, imports and client settings use disclosure. The portfolio tab opens the existing full portfolio with client scope. Approved/filed ideas, the exact upcoming Action, and all client dates use their existing scoped routes. Client-view entry retains the existing mutation; the prior approved exit restoration remains unchanged. Owner assignment uses the existing assignment mutation and preserves existing assignments. Relationship and inactive-record controls belong to Photon Admin. Inactive records never claim that user accounts were revoked.

Route identities, existing query keys/hooks, adapter, auth, analytics, dependencies, product context and both visual reference screens are unchanged. Creation's legacy plan value remains an internal payload default; there is no plan/price UI. Client logos and reference-prefix editing remain available in information settings. The legacy Clients stories, their eight baseline/actual images and ten accessibility fingerprints are retired. The Case Owner and Photon Admin legacy client journeys are removed; the superadmin journey's client-screen assertion is retired while unrelated legacy API checks remain.

## Mock evidence
BF-16 in proposed-fields.json adds derived `onboarding` evidence to the existing client response and an attributed readiness check on the existing PATCH route. The mock reads actual domain, active Case Owner assignments, active/invited people, live inventor invitation methods, scoped patents, latest import results, idea counts and upcoming dates/Actions. The first missing setup step always leads; an older readiness timestamp cannot hide a current gap. Confirmation rechecks these requirements and caller scope. No access gate, endpoint, persona or lifecycle status is introduced. The proposal remains conceptual until backend verification; no real service was contacted.

## Stories and capture contract
All story IDs use `surfaces-clients-and-onboarding--` under `Surfaces/Clients and onboarding`. Suffixes: photon-admin, case-owner, potential-client, new-client, no-owner, no-admin, no-inventors, no-portfolio, import-in-progress, import-errors, ready, ready-case-owner, disabled, access-request, loading, error, empty, long-title, invite-admin, invite-link, import-result, confirm-readiness, edit-domain, save-failed, client-support, client-settings, shared-invitation and owner-assignment. Every story selects a deterministic `v0/clients/` scenario. The 12 intended ledger IDs are included.

Each story has 1280×720 and 1440×900 captures. Both personas' default list and ready record also have 1366×768, 1920×1080 and 640×360@2 captures. Long title has an additional zoom capture: 69 images total. All 69 story images plus two full-app zoom chooser images were opened and inspected. Corrections include list spacing, repeated status, the persistent identity header and canonical import-history totals/date/actor. Coverage records DSN-0018 following independent PASS.

## Validation
All 383 repository interaction tests passed after the four supplemental support/settings/link/ownership stories were added. The current 28-story scope passes. V0 53/53, both builds, roles/tokens and the first required serial gate set 7/7 pass. The previous 69-capture set was stable with no egress; 56 accessibility/overflow contexts passed. The final required serial set also passed 7/7. Exact 69-story re-baselining passed twice, with no egress. A subsequent visual review caught import-history field-name mismatches; that display is corrected and the refreshed two import-result images are stable and inspected. All 28 scoped interaction tests and 56 current accessibility/overflow contexts pass after the correction. The final round-2 serial required gates pass 7/7, with all 56 current accessibility/overflow contexts clean. The broad repository run and exact final baseline refresh remain in progress.

Full-app browser evidence: the complete creation-to-readiness sequence passes. It saves a new synthetic client/domain, assigns a Case Owner, sends the mock Workspace Admin invitation, creates an inventor link, imports 12 patent records and six dates from the existing synthetic export, then records readiness. The explicit Back link restores search. Case Owner client view enters and exits back to assigned scope. Additional browser checks pass exact client-filtered approved/filed idea links, all client dates and the specific upcoming Action. The two initial probe failures were a duplicate Back-link selector and a transient development reload; the corrected complete run passes (functional3.log, links1.log).

Known compromises: readiness confirms operational setup rather than account activation; client view requires an active Workspace Admin. The inactive client flag is a record setting, with account access managed separately. The shared header's generic Back arrow returns to the unfiltered client list; the explicit Back to clients link preserves the search/page. The full portfolio remains a destination rather than a second large table inside the client record. Business impact is a hypothesis, not a measured result.

## Builder scorecard and final cognitive-load check
| Category | Score | Rendered evidence |
| --- | --- | --- |
| Product fit | 4 | Both persona scopes and every onboarding step are represented; support remains available after readiness. |
| Hierarchy | 4 | Selected client and one next responsibility lead; evidence and settings recede into disclosure. |
| Usability | 4 | Named recovery, preserved edits/search, scoped destinations, and the complete creation-to-readiness browser sequence. |
| Trust | 4 | Readiness cites saved evidence; import counts, actor and date use canonical response fields. Record inactivity and actual access remain explicit. |
| Craft | 4 | Reference typography, amber action, hairline groups and shared controls; no decorative metric cards. |
| Accessibility | 4 | Visible focus and text states, all five review sizes, long-name wrapping and current automated accessibility checks. |
| Business | 4 | Shorter time to completed client setup is the intended signal, guarded by real ownership, source evidence and recoverable imports; not yet measured. |

Post-render roleplay for Tobias and Devika agrees with the six opening answers: first the selected client and next setup/support responsibility; open that record with one dominant action; read client, owner and consequence together and skip disclosed details; remember no separated counts/status; no unrelated firm metrics or people rankings; explicit source/recovery copy resolves ownership and save anxiety. Hard rules pass: one primary action per context; destructive record/link changes disclosed or confirmed; no metric without scoped work/evidence; no decorative cards, horizontal scroll, invented lifecycle stage, repeated default title/status, or unauthorized badge. Supporting details are disclosed. Client identity persists while scrolling. Both personas' zoom chooser retains the selected client's name. Known compromises above are unchanged.

## Independent review — round 1
```text
VERDICT: NEEDS_WORK
SURFACE: clients-and-onboarding  PERSONA: Case Owner and Photon Admin
SCORECARD: product-fit 4 · hierarchy 4 · usability 3 · trust 3 · craft 4 · accessibility 4 · business 4
COGNITIVE LOAD: fail — Both personas’ default-state roleplays at 1280×720 and 1440×900 support the recorded hierarchy and scope, but import recovery requires guessing and save failure repeats a status.
FINDINGS (most severe first, max 7):

1. Import result, both widths — “1 duplicates” gives neither the affected row nor its disposition; the operator must guess whether to remove, correct, or retain it when importing the corrected file — identify the duplicate row and state what happened to it and what to do next.
2. Save failure — at 1440×900 the identical failure status appears inline and in a toast, breaking the no-repeated-status hard rule; at 1280×720 only the toast is visible, separating recovery feedback from Save — show one persistent failure message beside the save action, with the retry instruction.

STATES MISSING: none
REFERENCE MATCH: yes — restrained typography, amber primary actions, hairline separation, compact controls, and two-pane client selection follow the reference language.
```

Round 1 corrections: import evidence now identifies row 11 as a skipped duplicate of row 4 and instructs the operator to retain one row for that application number. The count explains that duplicates were skipped. Save failure has one persistent message directly under the header controls, with a Save client retry instruction; the duplicate toast is removed. Inputs remain intact. These are display/recovery corrections; existing mutations and access rules are preserved. The four refreshed import-result/save-failure captures are stable and opened at both widths; all 28 scoped interaction tests pass. Current screenshots are ready for independent round 2.

## Independent review — round 2
```text
VERDICT: PASS
SURFACE: clients-and-onboarding  PERSONA: Case Owner and Photon Admin
SCORECARD: product-fit 4 · hierarchy 4 · usability 4 · trust 4 · craft 4 · accessibility 4 · business 4
COGNITIVE LOAD: pass — Independent six-question roleplays for both personas at 1280×720 and 1440×900 agree with the record: client, ownership and next step lead, supporting evidence recedes, and recovery requires no avoidable guessing.
FINDINGS (most severe first, max 7):
None. All 71 images inspected; import corrections identify affected rows and disposition, and save failure provides one visible message with preserved inputs and retry guidance.
STATES MISSING: none
REFERENCE MATCH: yes — restrained typography, amber primary actions, compact controls, hairline separation and two-pane client selection follow the approved reference language.
```
