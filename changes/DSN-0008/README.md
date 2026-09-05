# DSN-0008 — Idea detail and status

Status: in progress. Branch: `codex/dsn-0008-idea-detail`.

## Intent and persona
Inventor checks feedback, status and the next step. Workspace Admin decides from a concise brief. Case Owner and Photon Admin receive a scoped filing brief and attachments. The product object is one idea, its disclosure revision, review history and related patent. Success is confidence after submission and an efficient, accurate handoff.

## Three directions before implementation
| Direction | What leads / recedes / flow | Character and hypothesis | Cognitive cost and risk | Choice |
|---|---|---|---|---|
| A · Status brief | Status, next-step sentence and one primary action; ownership and brief follow; disclosure/evidence/history open on demand | Calm and clear; supports the occasional Inventor while the same brief serves operators | Lowest reading/recall cost; long sections require scrolling after expansion | Selected |
| B · Working dossier | Persistent section index and two-pane disclosure/evidence comparison | Precise research workspace; makes deep review fast | Requires choosing a section and scanning two panes before understanding the next step | Rejected |
| C · Event journal | Full timeline leads with the latest decision; disclosure and files are linked from events | Reassuring history; explains how the idea arrived here | Must reconstruct current ownership and content from events; inefficient for filing | Rejected |

Low-fidelity renders: directions/a.png, b.png, c.png. All preserve one Workspace Admin review stage and the same permissions.

## Cognitive-load roleplay
1. Reference/title, current status and next-step sentence lead.
2. One dominant action for the current persona and state: update, decide/send, record filing, open patent or read disclosure. Its consequence is stated once.
3. Read the concise brief and ownership; skip collapsed disclosure/evidence/files/history until needed.
4. Decisions remain with their actor, revision and date. Score appears once; no cross-pane comparison is needed.
5. No Inventor dates/Actions, technical review stage, filing-in-progress state, colleague ranking or legal workflow menu.
6. State who owns the next step, distinguish Inventor and Submitted by, and route editable drafts to the existing disclosure workspace.

## Initial reconciliation
Linked patent hydration, attachment access and real review history need to match the existing backend vocabulary. Rejected ideas must permit author revision and reconsideration under WORKFLOWS section 4. The shared evaluation display band must use PRODUCT-VOCABULARY thresholds ≥8/≥6/≥4. These are corrections toward existing product truth, not new product behaviour.
