import { getDb } from "../runtime/db";
import { clock } from "../runtime/clock";
import { allDueDates, allPatents, patentById } from "../runtime/store";
import type { Idea, User } from "../runtime/types";

/** BF-14: one scoped read for the Case Owner's next work, never a client ranking. */
export function caseOwnerWork(user: User, ideas: Idea[]) {
  const db = getDb(), now = clock.now(), day = 86_400_000;
  const scope = user.assigned_client_ids;
  const clients = db.clients.filter(client => scope.includes(client.id));
  const name = (id: string) => clients.find(client => client.id === id)?.name || "Client unavailable";
  const sent = (idea: Idea) => db.transitions.filter(t => t.idea_id === idea.id && t.to_state === "SENT_TO_PHOTON").sort((a,b) => b.created_at.localeCompare(a.created_at))[0]?.created_at || idea.updated_at;
  const approved = ideas.filter(idea => scope.includes(idea.client_id) && idea.state === "SENT_TO_PHOTON").sort((a,b) => sent(b).localeCompare(sent(a)) || a.reference.localeCompare(b.reference));
  const base = (clientId: string) => ({ client_id: clientId, client_name: name(clientId) });
  const approvedItems = approved.slice(0, 6).map(idea => ({ ...base(idea.client_id), id: `idea:${idea.id}`, kind: "idea", title: idea.title, reference: idea.reference, occurred_at: sent(idea), due_at: null, state_label: "Sent to Photon Legal", next_step: "Read the approved brief and attachments to organise the next filing step.", action_label: "Open approved idea", href: `/ideas/${idea.id}` }));
  const today = clock.iso().slice(0,10);
  const inSevenDays = new Date(now + 7 * day).toISOString().slice(0,10);
  const due = allDueDates(scope).filter(d => d.status === "PENDING" && (!d.due_at || d.due_at.slice(0,10) <= inSevenDays)).sort((a,b) => (a.due_at || "").localeCompare(b.due_at || "") || a.id.localeCompare(b.id));
  const urgentItems = due.slice(0,6).map(d => {
    const request = db.actionRequests.filter(a => a.due_date_id === d.id && a.submission_state !== "DRAFT" && !["COMPLETED", "DECLINED"].includes(a.status)).sort((a,b) => b.updated_at.localeCompare(a.updated_at))[0];
    const p = patentById(d.patent_id);
    return { ...base(d.client_id), id: `event:${d.id}`, kind: request ? "action" : "date", title: d.title, reference: p?.application_number || "Application number not recorded", occurred_at: request?.requested_at || d.updated_at, due_at: d.due_at, state_label: request ? ({NEW:"Submitted",ACKNOWLEDGED:"Acknowledged",IN_PROGRESS:"In progress"}[request.status] || "Submitted") : !d.due_at ? "Date needs confirmation" : d.due_at.slice(0,10) < today ? "Overdue" : "Upcoming", next_step: request ? "Open the client's instruction to acknowledge or progress the requested work." : "Check the recorded event and maintain its date or completion state.", action_label: request ? "Open client instruction" : "Open recorded event", href: request ? `/actions?request=${encodeURIComponent(request.id)}` : `/due-dates?client=${encodeURIComponent(d.client_id)}&event=${encodeURIComponent(d.id)}&filter=all` };
  });
  const clientRows = clients.map(client => {
    const members = db.users.filter(member => member.client_id === client.id && member.status !== "SUSPENDED");
    const access = db.access.filter(a => a.user_id === user.id && a.client_id === client.id && !a.revoked_at).sort((a,b) => b.granted_at.localeCompare(a.granted_at))[0];
    const admins = members.filter(member => member.role === "LEGAL_COUNSEL");
    const setup = !admins.length ? "Add a Workspace Admin" : !admins.some(a => a.status === "ACTIVE") ? "Workspace Admin invitation pending" : !members.some(member => member.role === "INVENTOR") ? "Invite inventors" : null;
    return { ...base(client.id), assigned_at: access?.granted_at || null, health: !client.is_active ? "Workspace inactive" : setup || "Setup ready", task: !client.is_active ? "Check workspace access" : setup, href: `/clients/${client.id}` };
  });
  const setupItems = clientRows.filter(c => c.task).map(client => ({ ...base(client.client_id), id: `client:${client.client_id}`, kind: "setup", title: client.task!, reference: "Client workspace", occurred_at: client.assigned_at, due_at: null, state_label: "Setup needs attention", next_step: "Open the client record to check people, invitations and workspace setup.", action_label: "Open client workspace", href: client.href }));
  const expired = db.access.filter(a => a.user_id === user.id && !a.revoked_at && a.expires_at && Date.parse(a.expires_at) <= now && !scope.includes(a.client_id)).filter((a,index,rows) => rows.findIndex(b => b.client_id === a.client_id) === index);
  const accessItems = expired.map(a => ({ client_id: a.client_id, client_name: db.clients.find(c => c.id === a.client_id)?.name || "Previous client", id: `access:${a.id}`, kind: "access", title: "Access expired", reference: "Client access", occurred_at: a.expires_at, due_at: null, state_label: "Assignment ended", next_step: "Request access from a Photon Admin before opening this client's work.", action_label: "Request client access", href: null, requested_at: a.requested_at || null }));
  const updates = db.transitions.filter(t => t.to_state === "FILED" && ideas.some(i => i.id === t.idea_id && scope.includes(i.client_id))).sort((a,b) => b.created_at.localeCompare(a.created_at)).slice(0,5).map(t => { const idea = ideas.find(i => i.id === t.idea_id)!; return { ...base(idea.client_id), id:t.id, reference:idea.reference, state_label:"Filed", occurred_at:t.created_at, href:`/ideas/${idea.id}` }; });
  const patents = allPatents(scope);
  const jurisdiction = new Map<string,{publication_country:string;granted_patents:number;pending_patents:number}>();
  for(const p of patents) { if(!["GRANTED","APPLIED","EXAMINATION"].includes(p.status)) continue; const row=jurisdiction.get(p.jurisdiction)||{publication_country:p.jurisdiction,granted_patents:0,pending_patents:0}; if(p.status==="GRANTED")row.granted_patents++;else row.pending_patents++;jurisdiction.set(p.jurisdiction,row); }
  return { approved: approvedItems, urgent: urgentItems, setup: [...accessItems,...setupItems], totals:{approved:approved.length,urgent:due.length,clients:clients.length}, clients:clientRows, updates, map:{total_active_patents:[...jurisdiction.values()].reduce((n,j)=>n+j.granted_patents+j.pending_patents,0),jurisdictions:[...jurisdiction.values()]} };
}
