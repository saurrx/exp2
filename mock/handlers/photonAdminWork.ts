import { getDb } from "../runtime/db";
import { clock } from "../runtime/clock";
import { allDueDates, allPatents, patentById } from "../runtime/store";
import type { Idea } from "../runtime/types";

/** BF-15: the controller's firm-wide exceptions, derived from existing records. */
export function photonAdminWork() {
  const db = getDb(), now = clock.now(), day = 86_400_000;
  const clients = db.clients;
  const base = (clientId: string) => ({
    client_id: clientId,
    client_name: clients.find(c => c.id === clientId)?.name || "Client unavailable",
    owners: db.users.filter(u => u.role === "CASE_OWNER" && u.status === "ACTIVE" && u.assigned_client_ids.includes(clientId)).map(u => u.name),
  });
  const sent = (idea: Idea) => db.transitions.filter(t => t.idea_id === idea.id && t.to_state === "SENT_TO_PHOTON").sort((a,b) => b.created_at.localeCompare(a.created_at))[0]?.created_at || idea.updated_at;
  const ownership = clients.filter(c => c.is_active && !base(c.id).owners.length).sort((a,b) => a.created_at.localeCompare(b.created_at)).map(c => ({
    ...base(c.id), id: `ownership:${c.id}`, kind: "ownership" as const, title: "Assign client ownership", reference: null,
    occurred_at: c.created_at, due_at: null, timing_label: "Client created", next_step: "Open the client record to choose the Case Owner who will support this workspace.", action_label: "Open client record", href: `/clients/${c.id}`,
  }));
  const approved = db.ideas.filter(i => i.state === "SENT_TO_PHOTON").sort((a,b) => sent(a).localeCompare(sent(b)) || a.reference.localeCompare(b.reference)).map(i => ({
    ...base(i.client_id), id: `idea:${i.id}`, kind: "idea" as const, title: i.title, reference: i.reference,
    occurred_at: sent(i), due_at: null, timing_label: "Sent to Photon", next_step: "Read the approved brief and review history to organise the next filing step with the Case Owner.", action_label: "Open approved idea", href: `/ideas/${i.id}`,
  }));
  const horizon = new Date(now + 7 * day).toISOString().slice(0,10);
  const urgent = allDueDates(null).filter(d => d.status === "PENDING" && (!d.due_at || d.due_at.slice(0,10) <= horizon)).sort((a,b) => (a.due_at || "").localeCompare(b.due_at || "") || a.id.localeCompare(b.id)).map(d => {
    const request = db.actionRequests.filter(a => a.due_date_id === d.id && a.submission_state !== "DRAFT" && !["COMPLETED", "DECLINED"].includes(a.status)).sort((a,b) => b.updated_at.localeCompare(a.updated_at))[0];
    return { ...base(d.client_id), id:`event:${d.id}`, kind:request ? "action" as const : "date" as const, title:d.title, reference:patentById(d.patent_id)?.application_number || "Application number not recorded", occurred_at:request?.requested_at || d.updated_at, due_at:d.due_at, timing_label:"Due", next_step:request ? "Review the client's instruction to acknowledge or progress the requested work." : "Check the recorded event and maintain its date or completion state.", action_label:request ? "Open client instruction" : "Open recorded event", href:request ? `/actions?request=${encodeURIComponent(request.id)}` : `/due-dates?client=${encodeURIComponent(d.client_id)}&event=${encodeURIComponent(d.id)}&filter=all` };
  });
  const configuration = clients.filter(c => c.is_active).flatMap(c => {
    const members = db.users.filter(u => u.client_id === c.id && u.status !== "SUSPENDED");
    const task = !c.domain ? "Add the workspace domain" : !members.some(u => u.role === "LEGAL_COUNSEL") ? "Add a Workspace Admin" : !members.some(u => u.role === "LEGAL_COUNSEL" && u.status === "ACTIVE") ? "Check the Workspace Admin invitation" : null;
    return task ? [{...base(c.id),id:`configuration:${c.id}`,kind:"configuration" as const,title:task,reference:null,occurred_at:c.updated_at,due_at:null,timing_label:"Client updated",next_step:"Open the client record to complete workspace setup and check access.",action_label:"Open client setup",href:`/clients/${c.id}`}] : [];
  });
  const unavailable = db.flags.photonDashboardUnavailable || [];
  // A later successful import supersedes an older failed attempt for that client.
  const latestImports = clients.map(c => db.imports.filter(i => i.client_id === c.id).sort((a,b) => b.created_at.localeCompare(a.created_at))[0]).filter(i => i && (i.status === "FAILED" || i.failed_count > 0));
  const imports = unavailable.includes("imports") ? null : latestImports.map(i => ({...base(i.client_id),id:`import:${i.id}`,kind:"import" as const,title:"Correct the patent import",reference:null,occurred_at:i.completed_at || i.created_at,due_at:null,timing_label:"Import attempted",next_step:`${i.failed_count} of ${i.rows_total} rows were not imported. Correct the reported rows in the source file, then open this client's portfolio to import the corrected file.`,action_label:"Open client portfolio",href:`/patents?client=${encodeURIComponent(i.client_id)}`,errors:i.errors,unmapped_columns:i.unmapped_columns}));
  const patents = allPatents(null);
  const active = patents.filter(p => ["GRANTED","APPLIED","EXAMINATION"].includes(p.status));
  const jurisdictions = new Map<string,{publication_country:string;granted_patents:number;pending_patents:number}>();
  for(const p of active) {const row=jurisdictions.get(p.jurisdiction)||{publication_country:p.jurisdiction,granted_patents:0,pending_patents:0};if(p.status==="GRANTED")row.granted_patents++;else row.pending_patents++;jurisdictions.set(p.jurisdiction,row);}
  const end = clock.iso().slice(0,10), start = new Date(Date.parse(end) - 29 * day).toISOString().slice(0,10);
  const previousStart = new Date(Date.parse(start) - 30 * day).toISOString().slice(0,10);
  const filings = patents.filter(p => p.filing_date && p.filing_date.slice(0,10) >= start && p.filing_date.slice(0,10) <= end).length;
  const previousFilings = patents.filter(p => p.filing_date && p.filing_date.slice(0,10) >= previousStart && p.filing_date.slice(0,10) < start).length;
  return {ownership,approved,urgent,configuration,imports,unavailable_sources:unavailable,
    context:{clients:clients.length,active_patents:unavailable.includes("portfolio") ? null : active.length,filings:unavailable.includes("portfolio") ? null : {count:filings,previous_count:previousFilings,from:start,to:end}},
    map:unavailable.includes("portfolio") ? null : {total_active_patents:active.length,jurisdictions:[...jurisdictions.values()]},
  };
}
