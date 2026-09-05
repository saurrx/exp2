# DSN-0014 · Actions

## Intent and persona frame
Leah, Workspace Admin, arrives to decide and send an instruction for an upcoming patent event. Devika, Case Owner, and Tobias, Photon Admin, arrive to process submitted client requests. The object is one event and its instruction; the consequence is a clear handoff to Photon Legal or a recorded operational status. Inventors have no access. The current wide tables scatter deadline, selected instruction and ownership; the client Due dates route keeps selections only in local state. Desired outcome: one coherent brief with a visible next step and durable saved/submitted state. Business signal: shorter instruction-to-response delay, guarded by preserved work, explicit countries/notes and correct client scope. This is an intended outcome, not a measured gain.

## Three directions
| Direction | Leads / recedes | Flow and character | Hypothesis and risk | Choice |
| --- | --- | --- | --- | --- |
| A · Urgency queue and focused instruction brief | A compact event queue leads into one selected instruction; metadata and past details recede | Choose an event, read deadline and current ownership, then save/send or advance status; calm and deliberate | Fewer facts to retain across a decision; the selected row must avoid repeating the brief title/status | Selected: lowest reading and remembering cost for both client and operator |
| B · Expandable event rows | Each event/date leads with an inline task button; expanded editing displaces later rows | Work down a single vertical queue; direct and compact | Good quick scanning, but long country/note choices push adjacent work and controls away | Rejected: unstable reading position and higher recovery cost |
| C · Status-grouped work board | Submission/processing state columns lead; deadlines live inside items | Find work in a stage, open a focused form; operational | Makes queue stages clear, but Workspace Admin first has to classify the task and laptop columns compete for space | Rejected: state grouping delays the event decision and weakens urgency scanning |

Three low-fidelity renders accompany these descriptions. Selection is pre-authorized under the cognitive-load charter.

## Cognitive-load roleplay
1. First glance: Leah sees the next event and deadline; Devika/Tobias see urgent submitted work with client scope.
2. One thing: send the selected instruction to Photon Legal, or record the next operational step. The dominant control names that consequence.
3. Read: event, patent reference, date/days, instruction options and required countries/note; details beyond the decision unfold on demand.
4. Remember: the event and its current instruction stay together; selected queue rows do not repeat the brief title/status. Client scope remains visible for operators.
5. Never needed: column selectors, raw IDs, a dropdown per row, pricing, calendar decoration, Inventor access or badges.
6. Anxiety: a plain ownership sentence explains who acts next; draft and submitted states differ truthfully, and failed work stays available to retry.

## Implementation boundaries and open issues
Keep the existing routes, components, query identities and adapter. Add only brief-required mock behavior through recorded proposed fields/routes when necessary. Existing client route selection is local-only; saved drafts/submission are explicitly authorized by the brief and WORKFLOWS. Endpoint/transport gaps will be traced before implementation. Do not redesign Photon Due dates during this surface; that is DSN-0015. The references, auth, analytics, shared query-hook files and dependencies remain untouched.

## Validation
In progress; coverage remains null.
