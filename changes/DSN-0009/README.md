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
