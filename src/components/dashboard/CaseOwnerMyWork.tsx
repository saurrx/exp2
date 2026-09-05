import React, { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import API_CONFIG from "@/lib/apiConfig";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/DashboardChrome";
import PatentWorldMap from "@/components/PatentWorldMap";
import { ActionsNavigation, actionDate, actionPrimary } from "@/components/actions/ActionsWorkspace";

type WorkItem = {
  id: string; kind: "idea" | "action" | "date" | "setup" | "access";
  client_id: string; client_name: string; title: string; reference: string;
  occurred_at: string | null; due_at: string | null; state_label: string;
  next_step: string; action_label: string; href: string | null; requested_at?: string | null;
};
export type CaseOwnerWork = {
  approved: WorkItem[]; urgent: WorkItem[]; setup: WorkItem[];
  totals: { approved: number; urgent: number; clients: number };
  clients: Array<{ client_id: string; client_name: string; assigned_at: string | null; health: string; href: string }>;
  updates: Array<{ id: string; client_name: string; reference: string; state_label: string; occurred_at: string; href: string }>;
  map: { total_active_patents: number; jurisdictions: Array<{ publication_country: string; granted_patents: number; pending_patents: number }> };
};
const age = (value: string | null) => {
  if (!value || Number.isNaN(Date.parse(value))) return "Date not recorded";
  const days = Math.max(0, Math.floor((Date.now() - Date.parse(value)) / 86400000));
  return days === 0 ? "Today" : days === 1 ? "1 day ago" : `${days} days ago`;
};
const timing = (item: WorkItem) => {
  if (item.kind === "action" || item.kind === "date") {
    if (!item.due_at) return "Date needs confirmation";
    const days = Math.round((Date.parse(item.due_at.slice(0,10)) - Date.parse(new Date().toISOString().slice(0,10))) / 86400000);
    return days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? "Due today" : `Due in ${days} days`;
  }
  return `${item.kind === "idea" ? "Sent to Photon" : item.kind === "access" ? "Ended" : "Assigned"} · ${age(item.occurred_at)}`;
};

/** The existing scoped dashboard query supplies the work; all actions open existing records. */
export default function CaseOwnerMyWork({ data, loading, error, retry }: { data?: CaseOwnerWork; loading: boolean; error: boolean; retry: () => void }) {
  const [params, setParams] = useSearchParams();
  const selectedId = params.get("work");
  const [mapOpen, setMapOpen] = useState(false);
  const [chooseWork, setChooseWork] = useState(false);
  const brief = useRef<HTMLElement>(null);
  const items = data ? [...data.approved, ...data.urgent, ...data.setup] : [];
  const selected = items.find(item => item.id === selectedId) || items[0];
  const groups = data ? [{ label: "Approved ideas", items: data.approved }, { label: "Urgent events", items: data.urgent }, { label: "Client setup and access", items: data.setup }] : [];
  const select = (item: WorkItem) => {
    const next = new URLSearchParams(params); next.set("work", item.id); setParams(next, { replace: true }); setChooseWork(false);
    requestAnimationFrame(() => { brief.current?.focus({ preventScroll: true }); brief.current?.scrollIntoView({ block: "nearest" }); });
  };
  return <>
    <PageHeader title="My work" actions={<ActionsNavigation />} />
    <div data-case-owner-work className="mx-auto w-full max-w-screen-2xl px-6 pb-10 pt-4 text-pl-ink md:px-8 md:pt-6">
      <header className="mb-5 hidden border-b border-pl-border pb-4 md:block">
        <h1 className="text-2xl font-semibold tracking-tight">Work from your assigned clients</h1>
        <p className="mt-2 text-sm text-pl-text-2">Approved ideas first, then urgent events and client setup.</p>
      </header>
      {loading && !error ? <p role="status" className="py-10 text-sm text-pl-text-2">Loading your assigned-client work…</p> : error || !data ? <div className="py-8">
        <p className="text-sm text-pl-text-2">Your assigned clients</p><h2 className="mt-3 text-lg font-semibold">My work could not be loaded</h2>
        <p className="mt-3 text-sm text-pl-text-2">Reload to retrieve the latest work and client access.</p><Button size="sm" className={`mt-5 ${actionPrimary}`} onClick={retry}>Reload my work</Button>
      </div> : <>
        {selected ? <>
          <div className="mb-4 flex gap-3 md:hidden"><Button size="sm" variant="outline" onClick={() => setChooseWork(!chooseWork)} aria-expanded={chooseWork}>Choose work</Button><Button size="sm" variant="outline" asChild><a href="#assigned-clients">Assigned clients</a></Button></div>
          <div className="grid min-w-0 gap-6 md:grid-cols-3">
            <nav aria-label="Assigned-client work" className={`${chooseWork ? "block" : "hidden"} min-w-0 md:block`}>
              {groups.filter(group => group.items.length).map(group => <section key={group.label} className="mb-5">
                <h2 className="mb-2 text-xs font-medium text-pl-text-2">{group.label}</h2>
                <ul className="divide-y divide-pl-border">{group.items.map(item => <li key={item.id}>
                  <button type="button" onClick={() => select(item)} aria-current={selected.id === item.id ? "true" : undefined} className={`w-full min-w-0 border-l-2 px-3 py-3 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-pl-brand ${selected.id === item.id ? "border-pl-brand" : "border-transparent hover:bg-pl-bg-subtle"}`}>
                    {selected.id === item.id ? <span>Selected work →</span> : <><span className="block text-xs text-pl-text-2">{item.client_name}</span><span className="mt-1 block break-words font-medium">{item.title}</span><span className="mt-2 block text-xs text-pl-text-2">{timing(item)}</span>{(item.kind === "action" || item.kind === "date") && <span className="mt-1 block break-words text-xs text-pl-text-2">{item.reference} · {item.kind === "action" ? "Review client instruction" : "Check recorded event"}</span>}</>}
                  </button>
                </li>)}</ul>
              </section>)}
              {(data.totals.approved > data.approved.length || data.totals.urgent > data.urgent.length) && <p className="text-xs text-pl-text-2">Showing {data.approved.length} of {data.totals.approved} approved ideas and {data.urgent.length} of {data.totals.urgent} urgent events. Open the full lists below for the rest.</p>}
            </nav>
            <section ref={brief} tabIndex={-1} aria-label="Selected work brief" className={`${chooseWork ? "hidden" : "block"} min-w-0 focus-visible:outline-none md:col-span-2 md:block`}>
              <WorkBrief key={selected.id} item={selected} />
            </section>
          </div>
        </> : <section className="py-8"><h2 className="text-lg font-semibold">{data.totals.clients ? "No work needs attention right now" : "No clients assigned yet"}</h2><p className="mt-3 text-sm text-pl-text-2">{data.totals.clients ? "New approved ideas and urgent events will appear here. Your assigned clients remain available below." : "A Photon Admin can assign your clients. Their work will appear here after assignment."}</p></section>}
        <nav aria-label="Full work lists" className="mt-6 flex flex-wrap gap-x-6 gap-y-3 border-t border-pl-border pt-4 text-sm">
          <Link className="underline underline-offset-4" to="/ideas?status=SEND_TO_OC">All approved ideas →</Link><Link className="underline underline-offset-4" to="/actions">All client instructions →</Link><Link className="underline underline-offset-4" to="/due-dates">All recorded events →</Link>
        </nav>
        <section id="assigned-clients" aria-labelledby="assigned-clients-heading" className="mt-8 border-t border-pl-border pt-5">
          <h2 id="assigned-clients-heading" className="text-base font-semibold">Assigned clients</h2>
          {!data.clients.length ? <p className="mt-3 text-sm text-pl-text-2">No current assignments.</p> : <ul className="mt-3 divide-y divide-pl-border">{data.clients.map(client => <li key={client.client_id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div className="min-w-0"><p className="break-words font-medium">{client.client_name}</p>{!(selected?.kind === "setup" && selected.client_id === client.client_id) && <p className="mt-1 text-xs text-pl-text-2">{client.health}{client.assigned_at && <> · Assigned {age(client.assigned_at).toLowerCase()}</>}</p>}</div><Link to={client.href} className="underline underline-offset-4">Open client workspace →</Link></li>)}</ul>}
        </section>
        <section aria-labelledby="lifecycle-updates-heading" className="mt-8 border-t border-pl-border pt-5">
          <h2 id="lifecycle-updates-heading" className="text-base font-semibold">Recent lifecycle updates</h2>
          {!data.updates.length ? <p className="mt-3 text-sm text-pl-text-2">Filing updates for your assigned clients will appear here.</p> : <ul className="mt-3 divide-y divide-pl-border">{data.updates.map(update => <li key={update.id} className="flex flex-wrap items-center justify-between gap-3 py-3 text-sm"><div><p>{update.client_name} · {update.reference}</p><p className="mt-1 text-xs text-pl-text-2">{update.state_label} · {actionDate(update.occurred_at)}</p></div><Link to={update.href} className="underline underline-offset-4">Open idea →</Link></li>)}</ul>}
        </section>
        <section aria-label="Assigned-client portfolio" className="mt-8 border-t border-pl-border pt-5">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3"><p className="text-sm text-pl-text-2">Portfolio context · your assigned clients only</p><Link to="/patents" className="text-sm underline underline-offset-4">Open patent portfolio →</Link></div>
          <PatentWorldMap jurisdictionStats={data.map.jurisdictions} isPatentDialogOpen={false} setIsPatentDialogOpen={() => setMapOpen(true)} v0={{ title: "Active patents worldwide", subtitle: `${data.map.total_active_patents} active patents · ${data.map.jurisdictions.length} jurisdictions · assigned clients`, heading: "h2" }} />
        </section>
        <Dialog open={mapOpen} onOpenChange={setMapOpen}><DialogContent className="max-h-full overflow-y-auto bg-pl-bg text-pl-ink sm:max-w-screen-xl"><DialogTitle>Assigned-client portfolio map</DialogTitle><PatentWorldMap jurisdictionStats={data.map.jurisdictions} isPatentDialogOpen={false} setIsPatentDialogOpen={() => setMapOpen(false)} v0={{ title: "Active patents worldwide", subtitle: "Your assigned clients only", heading: "h2" }}/><Button size="sm" variant="outline" onClick={() => setMapOpen(false)}>Close map</Button></DialogContent></Dialog>
      </>}
    </div>
  </>;
}

function WorkBrief({ item }: { item: WorkItem }) {
  const cache = useQueryClient();
  const access = useMutation({ mutationFn: async () => (await API_CONFIG.post(`/api/v1/clients/${item.client_id}/request-access`)).data, onSuccess: () => cache.invalidateQueries({ queryKey: ["dashboard"] }) });
  const requested = !!item.requested_at || access.isSuccess;
  return <article className="min-w-0">
    <header className="border-b border-pl-border pb-3 md:pb-4"><p className="text-xs font-medium text-pl-text-2 md:text-sm">{item.client_name}</p><p className="mt-1 text-xs text-pl-text-2 md:mt-2">{timing(item)}{item.due_at && <> · {actionDate(item.due_at)}</>}</p><h2 className="mt-2 break-words text-base font-semibold leading-tight md:mt-3 md:text-2xl">{item.title}</h2>{(item.kind === "idea" || item.kind === "action" || item.kind === "date") && <p className="mt-2 break-words text-xs text-pl-text-2 md:mt-3 md:text-sm">{item.reference}</p>}</header>
    {item.kind === "action" && <p className="mt-4 hidden text-sm font-medium md:block">{item.state_label}</p>}
    <p className="mt-3 hidden max-w-prose text-sm leading-relaxed text-pl-text-2 md:block">{item.next_step}</p>
    <div className="mt-3 flex flex-wrap items-start gap-3 md:mt-5">
      {item.kind === "access" ? <>{requested ? <p role="status" className="text-sm">Access requested. A Photon Admin will review your request.</p> : <Button size="sm" className={actionPrimary} disabled={access.isPending} onClick={() => access.mutate()}>{access.isPending ? "Requesting access…" : item.action_label}</Button>}{access.isError && <p role="alert" className="w-full text-sm">Access could not be requested. Try again.</p>}</> : item.href && <Button size="sm" asChild className={actionPrimary}><Link to={item.href}>{item.action_label}</Link></Button>}
    </div>
    <details className="mt-4 border-t border-pl-border pt-3 md:hidden"><summary className="cursor-pointer text-sm text-pl-text-2">What happens next</summary>{item.kind === "action" && <p className="mt-3 text-sm">{item.state_label}</p>}<p className="mt-2 text-sm text-pl-text-2">{item.next_step}</p></details>
    {item.kind !== "access" && item.kind !== "setup" && <div className="mt-6 border-t border-pl-border pt-4"><Link className="text-sm underline underline-offset-4" to={`/clients/${item.client_id}`}>Open this client workspace →</Link><p className="mt-2 text-xs text-pl-text-2">Client view is available from the client record.</p></div>}
  </article>;
}
