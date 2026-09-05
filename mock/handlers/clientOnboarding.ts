import { getDb } from "../runtime/db";
import { clock } from "../runtime/clock";
import { allDueDates, allPatents, patentById } from "../runtime/store";
import type { Client } from "../runtime/types";

/** BF-16: source-derived client setup; readiness is an operational check, never an access gate. */
export function clientOnboarding(client: Client) {
  const db = getDb();
  const owners = db.users.filter(u => u.role === "CASE_OWNER" && u.status === "ACTIVE" && u.assigned_client_ids.includes(client.id)).map(u => ({ id:u.id, name:u.name }));
  const members = db.users.filter(u => u.client_id === client.id);
  const admins = members.filter(u => u.role === "LEGAL_COUNSEL" && u.status !== "SUSPENDED");
  const inventors = members.filter(u => u.role === "INVENTOR" && u.status !== "SUSPENDED");
  const invites = db.invites.filter(i => i.client_id === client.id && i.status === "PENDING" && Date.parse(i.expires_at) > clock.now());
  const invitationMethod = invites.some(i => i.role === "INVENTOR") || inventors.length > 0;
  const patents = allPatents([client.id]);
  const latestImport = db.imports.filter(i => i.client_id === client.id).sort((a,b) => b.created_at.localeCompare(a.created_at))[0];
  const importRunning = latestImport?.status === "RUNNING";
  const importErrors = !!latestImport && (latestImport.status === "FAILED" || latestImport.failed_count > 0);
  const steps = [
    { key:"organization", label:"Organization created", done:true },
    { key:"domain", label:"Allowed domain configured", done:!!client.domain },
    { key:"owner", label:"Case Owner assigned", done:owners.length > 0 },
    { key:"admin", label:"Workspace Admin invited", done:admins.length > 0 },
    { key:"inventors", label:"Inventor invitation method set", done:invitationMethod },
    { key:"portfolio", label:"Initial portfolio available", done:patents.length > 0 && !importRunning && !importErrors },
  ];
  const missing = steps.find(step => !step.done)?.key;
  const nextKey = !client.is_active ? "inactive" : missing === "portfolio" && importRunning ? "import-running" : missing === "portfolio" && importErrors ? "import-errors" : missing || (client.onboarding_confirmed_at ? "ready" : "confirm");
  const descriptions: Record<string,{title:string;detail:string}> = {
    inactive:{title:"Client is inactive",detail:"This client remains in Photon Legal's records. Review its information before making further setup changes."},
    domain:{title:"Configure the allowed domain",detail:"Save the company domain so eligible inventors have the correct workspace entry path."},
    owner:{title:"Assign a Case Owner",detail:"Choose the Photon Legal team member responsible for supporting this client."},
    admin:{title:"Invite the first Workspace Admin",detail:"Invite the person who will review ideas and help inventors participate."},
    inventors:{title:"Set up inventor invitations",detail:"Create a shareable invitation link or invite the first inventors by email."},
    portfolio:{title:"Import the initial patent portfolio",detail:"Add the client's existing patent records from a spreadsheet. Review the import result before confirming readiness."},
    "import-running":{title:"Patent import in progress",detail:"The portfolio is being processed. Refresh the import history to check the result before confirming readiness."},
    "import-errors":{title:"Correct the patent import",detail:"Review the rows that were not imported, then import the corrected file into this client's portfolio."},
    confirm:{title:"Check onboarding readiness",detail:"The domain, ownership, people, invitation method and portfolio are in place. Review the setup evidence, then record the readiness check."},
    ready:{title:"Ready for client support",detail:"Setup has been checked. Open the client's work or review the people and portfolio below."},
  };
  const ideas = db.ideas.filter(i => i.client_id === client.id);
  const nextEvents = allDueDates([client.id]).filter(d => d.status === "PENDING").sort((a,b)=>(a.due_at || "").localeCompare(b.due_at || "")).slice(0,3).map(d => {
    const request = db.actionRequests.find(a => a.due_date_id === d.id && a.submission_state !== "DRAFT" && !["COMPLETED","DECLINED"].includes(a.status));
    return {title:d.title,due_at:d.due_at,reference:patentById(d.patent_id)?.application_number || "Application number not recorded",href:request?`/actions?request=${encodeURIComponent(request.id)}`:`/due-dates?client=${encodeURIComponent(client.id)}&event=${encodeURIComponent(d.id)}&filter=all`};
  });
  return {owners,steps,next:{key:nextKey,...descriptions[nextKey]},admins:{active:admins.filter(u=>u.status==="ACTIVE").length,invited:admins.filter(u=>u.status==="INVITED").length},inventors:{active:inventors.filter(u=>u.status==="ACTIVE").length,invited:inventors.filter(u=>u.status==="INVITED").length},invitation_method:invitationMethod,patents:patents.length,ideas:{in_review:ideas.filter(i=>i.state==="LEGAL_REVIEW").length,approved:ideas.filter(i=>i.state==="SENT_TO_PHOTON").length,filed:ideas.filter(i=>i.state==="FILED").length},upcoming:nextEvents,latest_import:latestImport?{status:latestImport.status,created:latestImport.created_count,updated:latestImport.updated_count,duplicates:latestImport.duplicate_in_file,unchanged:latestImport.unchanged_count,failed:latestImport.failed_count,at:latestImport.completed_at || latestImport.created_at,errors:latestImport.errors}:null,confirmed_at:client.onboarding_confirmed_at || null,confirmed_by:db.users.find(u=>u.id===client.onboarding_confirmed_by)?.name || null};
}
