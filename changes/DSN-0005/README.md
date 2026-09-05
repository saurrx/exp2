# DSN-0005 — Inventor home

Status: in progress.

## Persona and intent

Anika Sharma is an occasional Inventor returning after engineering work. She needs to find her idea and know what to do next, or start with material she already has. The idea is the object; its draft, review or filing state determines the next step. **Submit an idea** starts the existing draft flow, not a review submission. The desired business signal is increased starts and completed submissions, guarded by understanding of review ownership and no accidental submissions.

Required states: first run, invited inactive, no ideas, one draft, several statuses, requested changes, recent submission, evaluation available, loading and error. Preserve the existing route, query hooks, adapter and modal flow. Company momentum and patent map follow personal work. No Inventor rankings, Actions or due dates.

## Three directions

| Direction | Leads and flow | Recedes | Character / business hypothesis | Cognitive cost / risk | Choice |
|---|---|---|---|---|---|
| A — A simple idea list | My ideas header and Submit an idea; full-width rows pair title with the next step | Pipeline, collective momentum and map below the list | Calm and direct; easy recognition brings inventors back to unfinished work | Read one title and next step; no selection state or remembered comparison | Selected: fewest decisions and smallest reading cost |
| B — List and selected brief | My ideas in a left pane; selected idea's status and action in a right pane | Company context below both panes | Focused; more detail could speed a return to an idea | Select before seeing the next step; title/status repeat and sparse detail consumes space | Not selected |
| C — Grouped work stages | Drafts, review and filing grouped into separate columns | Company context below the board | Encouraging; progress across stages may motivate participation | Compare columns and scan categories before locating a title; too much density for an occasional user | Not selected |

Low-fidelity renders: `directions/a.png`, `directions/b.png`, `directions/c.png`. These are synthetic wireframes, not production screenshots.

## Cognitive-load roleplay before build

1. First glance: My ideas and Submit an idea, rather than a number or the map.
2. One thing: start an idea; the sentence beside the primary action explains that it starts a draft.
3. Read a title and its next step; skip summary counts and company context until needed.
4. Remember nothing between panels: action and state stay together in the idea row.
5. No firm metrics, Actions, dates, rankings or detailed evaluation evidence here.
6. Anxiety: starting is not sending to review; existing ideas name who acts next in one sentence.

Implementation, rendered critique, story ids and evidence are pending.
