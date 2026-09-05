import React, { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { actionDate, actionPrimary } from "@/components/actions/ActionsWorkspace";

export type ClientSetup = {
  owners: Array<{id:string;name:string}>;
  steps: Array<{key:string;label:string;done:boolean}>;
  next: {key:string;title:string;detail:string};
  admins: {active:number;invited:number}; inventors: {active:number;invited:number};
  invitation_method:boolean; patents:number;
  ideas: {in_review:number;approved:number;filed:number};
  upcoming: Array<{title:string;due_at:string|null;reference:string;href:string}>;
  latest_import: {status:string;created:number;updated:number;unchanged:number;duplicates:number;failed:number;at:string;errors:Array<{row:number;message:string}>}|null;
  confirmed_at:string|null;confirmed_by:string|null;
};
export type ClientRecord = {id:string;name:string;domain?:string;allowed_domain?:string;type:string;is_active:boolean;updated_at?:string;updatedAt?:string;onboarding?:ClientSetup;_count?:{patents?:number;Patent?:number};[key:string]:any};
export const clientOwners = (client:ClientRecord) => client.onboarding?.owners.map(owner=>owner.name).join(", ") || "Case Owner not assigned";
export const clientRelationship = (client:ClientRecord) => !client.is_active ? "Inactive client" : client.type === "POTENTIAL" ? "Potential client" : "Existing client";

export default function ClientBook({clients,loading,error,search,onSearch,openClient,createClient,isCaseOwner,page,totalPages,total,onPage,retry}:{clients:ClientRecord[];loading:boolean;error:boolean;search:string;onSearch:(value:string)=>void;openClient:(id:string)=>void;createClient:()=>void;isCaseOwner:boolean;page:number;totalPages:number;total:number;onPage:(page:number)=>void;retry:()=>void}) {
  const [params,setParams]=useSearchParams();
  const [chooseClient,setChooseClient]=useState(false);
  const selected=clients.find(client=>client.id===params.get("client")) || clients[0];
  const select=(id:string)=>{const next=new URLSearchParams(params);next.set("client",id);setParams(next,{replace:true});setChooseClient(false);};
  return <div data-client-workspace className="mx-auto w-full max-w-screen-2xl px-6 pb-10 pt-3 text-pl-ink md:px-8 md:pt-6">
    <header className="mb-5 hidden md:block"><h1 className="text-2xl font-semibold tracking-tight">{isCaseOwner?"Your assigned clients":"Client workspaces"}</h1><p className="mt-2 text-sm text-pl-text-2">Find a client and complete the next setup or support step.</p></header>
    <label className="mb-5 block max-w-md text-xs font-medium text-pl-text-2"><span className="sr-only">Search clients</span><Input aria-label="Search clients" placeholder="Search by client name or domain" value={search} onChange={event=>{onSearch(event.target.value);const next=new URLSearchParams(params);next.set("q",event.target.value);next.delete("client");next.delete("page");setParams(next,{replace:true});}} className="h-9 border-pl-border bg-pl-bg text-sm text-pl-ink"/></label>
    {error?<section className="border-t border-pl-border py-6"><h2 className="text-lg font-semibold">Clients could not be loaded</h2><p className="mt-3 text-sm text-pl-text-2">Your search is preserved. Reload to find the client workspace.</p><Button size="sm" onClick={retry} className={`mt-5 ${actionPrimary}`}>Reload clients</Button></section>:loading?<p role="status" className="border-t border-pl-border py-8 text-sm text-pl-text-2">Loading client workspaces…</p>:!selected?<section className="border-t border-pl-border py-8"><h2 className="text-lg font-semibold">{search?"No clients match this search":isCaseOwner?"No clients assigned yet":"No clients yet"}</h2><p className="mt-3 text-sm text-pl-text-2">{search?"Try another client name or domain.":isCaseOwner?"A Photon Admin can assign a client so you can complete its setup and support its work.":"Create the client workspace, then configure its domain, ownership and people."}</p>{search?<Button size="sm" className={`mt-5 ${actionPrimary}`} onClick={()=>{onSearch("");const next=new URLSearchParams(params);next.delete("q");next.delete("page");setParams(next,{replace:true});}}>Clear search</Button>:!isCaseOwner&&<Button size="sm" className={`mt-5 ${actionPrimary}`} onClick={createClient}>Create client</Button>}</section>:<>
      <div className="mb-3 flex items-center gap-3 md:hidden"><Button size="sm" variant="outline" onClick={()=>setChooseClient(!chooseClient)} aria-expanded={chooseClient}>Choose client</Button><span className="text-xs text-pl-text-2">{isCaseOwner?"Assigned clients":"All clients"}</span></div>
      <div className="grid min-w-0 gap-6 border-t border-pl-border pt-5 md:grid-cols-3">
        <nav aria-label="Client workspaces" className={`${chooseClient?"block":"hidden"} min-w-0 md:block`}><ul className="divide-y divide-pl-border">{clients.map(client=><li key={client.id}><button type="button" onClick={()=>select(client.id)} aria-current={selected.id===client.id?"true":undefined} className={`w-full min-w-0 border-l-2 px-3 py-3 text-left text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-pl-brand ${selected.id===client.id?"border-pl-brand":"border-transparent hover:bg-pl-bg-subtle"}`}>{selected.id===client.id?<span>Selected client →</span>:<><span className="block break-words font-medium">{client.name}</span><span className="mt-1 block text-xs text-pl-text-2">{clientRelationship(client)}</span><span className="mt-2 block break-words text-xs text-pl-text-2">{clientOwners(client)}</span><span className="mt-1 block text-xs text-pl-text-2">{client.onboarding?.next.title || "Open client details"}</span><span className="mt-2 block text-xs text-pl-text-2">{client.onboarding?.patents ?? client._count?.patents ?? client._count?.Patent ?? 0} patents · Updated {actionDate(client.updated_at || client.updatedAt)}</span></>}</button></li>)}</ul></nav>
        <section aria-label="Selected client brief" className={`${chooseClient?"hidden":"block"} min-w-0 md:col-span-2 md:block`}>
          <p className="text-xs text-pl-text-2">{clientRelationship(selected)}</p><h2 className="mt-2 break-words text-lg font-semibold leading-tight md:text-2xl">{selected.name}</h2><p className="mt-2 break-words text-xs text-pl-text-2 md:text-sm">{clientOwners(selected)}</p>
          <h3 className="mt-4 text-base font-semibold md:mt-6 md:text-lg">{selected.onboarding?.next.title || "Review client setup"}</h3><p className="mt-3 hidden max-w-prose text-sm leading-relaxed text-pl-text-2 md:block">{selected.onboarding?.next.detail || "Open the client record to review its people, portfolio and setup."}</p>
          <Button size="sm" className={`mt-4 ${actionPrimary}`} onClick={()=>openClient(selected.id)}>{["ready","inactive"].includes(selected.onboarding?.next.key || "")?"Open client workspace":"Open client setup"}</Button>
          <dl className="mt-8 hidden grid-cols-2 gap-5 border-t border-pl-border pt-5 text-sm md:grid"><div><dt className="text-xs text-pl-text-2">Allowed domain</dt><dd className="mt-2 break-words">{selected.domain || selected.allowed_domain || "Not configured"}</dd></div><div><dt className="text-xs text-pl-text-2">Portfolio</dt><dd className="mt-2">{selected.onboarding?.patents ?? selected._count?.patents ?? selected._count?.Patent ?? 0} patents</dd></div></dl>
        </section>
      </div>
      <nav aria-label="Client pages" className="mt-8 flex flex-wrap items-center justify-between gap-3 border-t border-pl-border pt-4 text-xs text-pl-text-2"><span>{total} {isCaseOwner?"assigned":"client"} workspaces · Page {page} of {totalPages}</span><div className="flex gap-2"><Button size="sm" variant="outline" disabled={page<=1} onClick={()=>onPage(page-1)}>Previous</Button><Button size="sm" variant="outline" disabled={page>=totalPages} onClick={()=>onPage(page+1)}>Next</Button></div></nav>
    </>}
  </div>;
}
