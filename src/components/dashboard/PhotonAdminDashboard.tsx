import React, { useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { PageHeader } from "@/components/DashboardChrome";
import PatentWorldMap from "@/components/PatentWorldMap";
import { ActionsNavigation, actionDate, actionPrimary } from "@/components/actions/ActionsWorkspace";

type Exception = {
  id: string;
  kind: "ownership" | "idea" | "action" | "date" | "configuration" | "import";
  client_id: string;
  client_name: string;
  owners: string[];
  title: string;
  reference: string | null;
  occurred_at: string;
  due_at: string | null;
  timing_label: string;
  next_step: string;
  action_label: string;
  href: string;
  errors?: Array<{ row: number; message: string }>;
  unmapped_columns?: string[];
};
export type PhotonAdminWork = {
  ownership: Exception[];
  approved: Exception[];
  urgent: Exception[];
  configuration: Exception[];
  imports: Exception[] | null;
  unavailable_sources: Array<"imports" | "portfolio">;
  context: { clients: number; active_patents: number | null; filings: { count: number; previous_count: number; from: string; to: string } | null };
  map: { total_active_patents: number; jurisdictions: Array<{ publication_country: string; granted_patents: number; pending_patents: number }> } | null;
};
const timing = (item: Exception) => {
  if (item.kind === "action" || item.kind === "date") {
    if (!item.due_at) return "Date needs confirmation";
    const days = Math.round((Date.parse(item.due_at.slice(0,10)) - Date.parse(new Date().toISOString().slice(0,10))) / 86400000);
    return days < 0 ? `${Math.abs(days)} days overdue` : days === 0 ? "Due today" : `Due in ${days} days`;
  }
  const days = Math.max(0, Math.floor((Date.now() - Date.parse(item.occurred_at)) / 86400000));
  return `${item.timing_label} · ${days === 0 ? "Today" : days === 1 ? "1 day ago" : `${days} days ago`}`;
};
const owner = (item: Exception) => item.owners.length ? `Case Owner · ${item.owners.join(", ")}` : "Case Owner not assigned";

/** Read from the existing scoped dashboard query; every action opens its existing operational record. */
export default function PhotonAdminDashboard({ data, loading, error, retry }: { data?: PhotonAdminWork; loading: boolean; error: boolean; retry: () => void }) {
  const [params, setParams] = useSearchParams();
  const [chooseWork, setChooseWork] = useState(false);
  const [mapOpen, setMapOpen] = useState(false);
  const brief = useRef<HTMLElement>(null);
  const groups = data ? [
    { label: "Ownership gaps", items: data.ownership },
    { label: "Approved ideas", items: data.approved },
    { label: "Urgent events", items: data.urgent },
    { label: "Client configuration", items: data.configuration },
    { label: "Patent imports", items: data.imports || [] },
  ] : [];
  const items = groups.flatMap(group => group.items);
  const selected = items.find(item => item.id === params.get("exception")) || items[0];
  const select = (item: Exception) => {
    const next = new URLSearchParams(params);
    next.set("exception", item.id);
    setParams(next, { replace: true });
    setChooseWork(false);
    requestAnimationFrame(() => { brief.current?.focus({ preventScroll: true }); brief.current?.scrollIntoView({ block: "nearest" }); });
  };
  return <>
    <PageHeader title="Overview" actions={<div className="flex items-center gap-3">{data && !error && !data.unavailable_sources.length && <Button size="sm" variant="outline" onClick={retry}>Refresh operations</Button>}<ActionsNavigation /></div>} />
    <div data-photon-dashboard className="mx-auto w-full max-w-screen-2xl px-6 pb-10 pt-3 text-pl-ink md:px-8 md:pt-6">
      <header className="mb-5 hidden border-b border-pl-border pb-4 md:block">
        <h1 className="text-2xl font-semibold tracking-tight">Operations across your clients</h1>
        <p className="mt-2 text-sm text-pl-text-2">Ownership first, then incoming work and operational exceptions.</p>
      </header>
      {loading && !error ? <p role="status" className="py-10 text-sm text-pl-text-2">Checking firm-wide work and ownership…</p> : error || !data ? <section className="py-8">
        <h2 className="text-lg font-semibold">Operations could not be loaded</h2>
        <p className="mt-3 text-sm text-pl-text-2">Reload to check client ownership, incoming work and portfolio context.</p>
        <Button size="sm" className={`mt-5 ${actionPrimary}`} onClick={retry}>Reload operations</Button>
      </section> : <>
        {!!data.unavailable_sources.length && <section aria-label="Incomplete operational check" className="mb-2 border-b border-pl-border pb-2 md:mb-5 md:pb-4">
          <div className="flex flex-wrap items-center gap-3 text-sm text-pl-text-2">
            <p role="status">{data.unavailable_sources.map(source => source === "imports" ? "Patent imports" : "Portfolio records").join(" and ")} unavailable.<span className="hidden md:inline"> Other client work is shown below.</span></p>
            <Button size="sm" variant="outline" onClick={retry}>Reload missing sources</Button>
          </div>
        </section>}
        {selected ? <>
          <div className="mb-3 flex flex-wrap gap-3 md:hidden">
            <Button size="sm" variant="outline" onClick={() => setChooseWork(!chooseWork)} aria-expanded={chooseWork}>Choose work</Button>
            <span className="self-center text-xs text-pl-text-2">All client workspaces</span>
          </div>
          <div className="grid min-w-0 gap-6 md:grid-cols-3">
            <nav aria-label="Firm-wide work" className={`${chooseWork ? "block" : "hidden"} min-w-0 md:block`}>
              {groups.filter(group => group.items.length).map(group => <section key={group.label} className="mb-5">
                <h2 className="mb-2 text-xs font-medium text-pl-text-2">{group.label}</h2>
                <ul className="divide-y divide-pl-border">{group.items.map(item => <li key={item.id}>
                  <button type="button" onClick={() => select(item)} aria-current={selected.id === item.id ? "true" : undefined} className={`w-full min-w-0 border-l-2 px-3 py-3 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-pl-brand ${selected.id === item.id ? "border-pl-brand" : "border-transparent hover:bg-pl-bg-subtle"}`}>
                    {selected.id === item.id ? <span>Selected work →</span> : <>
                      <span className="block break-words text-xs text-pl-text-2">{item.client_name}</span>
                      <span className="mt-1 block break-words font-medium">{item.title}</span>
                      <span className="mt-2 block break-words text-xs text-pl-text-2">{owner(item)}</span>
                      <span className="mt-1 block text-xs text-pl-text-2">{timing(item)}</span>
                      {item.reference && <span className="mt-1 block break-words text-xs text-pl-text-2">{item.reference}{(item.kind === "action" || item.kind === "date") && <> · {item.kind === "action" ? "Review client instruction" : "Check recorded event"}</>}</span>}
                    </>}
                  </button>
                </li>)}</ul>
              </section>)}
            </nav>
            <section ref={brief} tabIndex={-1} aria-label="Selected operational brief" className={`${chooseWork ? "hidden" : "block"} min-w-0 focus-visible:outline-none md:col-span-2 md:block`}>
              <article className="min-w-0">
                <header className="border-b border-pl-border pb-3 md:pb-4">
                  <p className="break-words text-xs font-medium text-pl-text-2 md:text-sm">{selected.client_name}</p>
                  <p className="mt-1 break-words text-xs text-pl-text-2 md:mt-2">{owner(selected)}</p>
                  <h2 className="mt-2 break-words text-base font-semibold leading-tight md:mt-3 md:text-2xl">{selected.title}</h2>
                  {selected.reference && <p className="mt-2 break-words text-xs text-pl-text-2 md:mt-3 md:text-sm">{selected.reference}</p>}
                  <p className="mt-2 text-xs text-pl-text-2 md:mt-3">{timing(selected)}{selected.due_at && <> · {actionDate(selected.due_at)}</>}</p>
                </header>
                <p className="mt-3 hidden max-w-prose text-sm leading-relaxed text-pl-text-2 md:block">{selected.next_step}</p>
                <Button size="sm" asChild className={`mt-3 md:mt-5 ${actionPrimary}`}><Link to={selected.href}>{selected.action_label}</Link></Button>
                <details className="mt-4 border-t border-pl-border pt-3 md:hidden"><summary className="cursor-pointer text-sm text-pl-text-2">What happens next</summary><p className="mt-3 text-sm text-pl-text-2">{selected.next_step}</p></details>
                {!!selected.errors?.length && <details key={selected.id} className="mt-5 border-t border-pl-border pt-4">
                  <summary className="cursor-pointer text-sm font-medium">Rows to correct</summary>
                  <ul className="mt-3 space-y-2 text-sm text-pl-text-2">{selected.errors.map(issue => <li key={issue.row}>Row {issue.row}: {issue.message}</li>)}</ul>
                  {!!selected.unmapped_columns?.length && <p className="mt-3 text-sm text-pl-text-2">Columns not mapped: {selected.unmapped_columns.join(", ")}</p>}
                </details>}
              </article>
            </section>
          </div>
        </> : <section className="py-8">
          <h2 className="text-lg font-semibold">{data.unavailable_sources.length ? "No exceptions in the available sources" : "No work needs attention right now"}</h2>
          <p className="mt-3 max-w-prose text-sm text-pl-text-2">{data.unavailable_sources.length ? "Reload the missing sources to finish the operational check." : "Client ownership and configuration are in place. New approved ideas and urgent events will appear here."}</p>
          <Button size="sm" asChild className={`mt-5 ${actionPrimary}`}><Link to="/clients">Open clients</Link></Button>
        </section>}
        <nav aria-label="Firm context" className="mt-8 grid gap-5 border-t border-pl-border pt-5 text-sm sm:grid-cols-3">
          <div><Link to="/clients" className="underline underline-offset-4">{data.context.clients} client workspaces →</Link></div>
          <div>{data.context.active_patents === null ? <p>Active patents not available</p> : <Link to="/patents?status=ACTIVE_GRANTED,ACTIVE_APPLIED,ACTIVE_EXAMINATION" className="underline underline-offset-4">{data.context.active_patents} active patents →</Link>}</div>
          <div>{data.context.filings ? <><Link to={`/patents?date=custom&date_from=${data.context.filings.from}&date_to=${data.context.filings.to}`} className="underline underline-offset-4">{data.context.filings.count} patents filed · last 30 days →</Link><p className="mt-2 text-xs text-pl-text-2">{data.context.filings.previous_count} in the previous 30 days</p></> : <p>Recent filings not available</p>}</div>
        </nav>
        {data.map && <section aria-label="Firm-wide portfolio" className="mt-8 border-t border-pl-border pt-5">
          <PatentWorldMap jurisdictionStats={data.map.jurisdictions} isPatentDialogOpen={false} setIsPatentDialogOpen={() => setMapOpen(true)} v0={{ title: "Patent geography", subtitle: "Active patents · all client workspaces", heading: "h2" }} />
          <Dialog open={mapOpen} onOpenChange={setMapOpen}><DialogContent className="max-h-full overflow-y-auto bg-pl-bg text-pl-ink sm:max-w-screen-xl"><DialogTitle>Firm-wide portfolio map</DialogTitle><PatentWorldMap jurisdictionStats={data.map.jurisdictions} isPatentDialogOpen={false} setIsPatentDialogOpen={() => setMapOpen(false)} v0={{ title: "Patent geography", subtitle: "Active patents · all client workspaces", heading: "h2" }}/><Button size="sm" variant="outline" onClick={() => setMapOpen(false)}>Close map</Button></DialogContent></Dialog>
        </section>}
      </>}
    </div>
  </>;
}
