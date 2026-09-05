import { useLocation } from "react-router-dom";
import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import API_CONFIG, { rawApi } from "@/lib/apiConfig";
import { track } from "@/lib/analytics";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import ActionsWorkspace, { actionField, type EventRow } from "./ActionsWorkspace";

export default function OCActionsContent() {
  const location = useLocation();
  const [searchQuery,setSearchQuery]=useState(() => new URLSearchParams(location.search).get("search") || "");
  const [requestFocus,setRequestFocus]=useState(() => new URLSearchParams(location.search).get("request") || "");
  const [filterOption,setFilterOption]=useState("all");
  const [statusFilter,setStatusFilter]=useState("all");
  const [clientFilter,setClientFilter]=useState("all");
  const [clientSearch,setClientSearch]=useState("");
  const [currentPage,setCurrentPage]=useState(1);
  const itemsPerPage=20,sortOption="oldest";
  const query=useQuery({queryKey:["oc_action_queue",currentPage,itemsPerPage,searchQuery,filterOption,statusFilter,clientFilter,sortOption,requestFocus],queryFn:async()=>{
    const params=new URLSearchParams({page:String(currentPage),limit:String(itemsPerPage),sort:sortOption,search:searchQuery,filter:filterOption,page_info:"1"});
    if(requestFocus)params.set("request_id",requestFocus);
    if(statusFilter!=="all")params.set("request_status",statusFilter);
    if(clientFilter!=="all")params.set("client_id",clientFilter);
    // Retain the canonical submitter and saved instruction: the old translation dropped both.
    return (await rawApi.get(`/v1/actions/queue?${params}`)).data;
  },refetchOnMount:true,retry:false});
  const clients=useQuery({queryKey:["clients_lookup_for_actions",clientSearch],queryFn:async()=>{const params=new URLSearchParams({search:clientSearch,limit:"20"});return (await API_CONFIG.get(`/api/v1/clients/lookup?${params}`)).data;},retry:false});
  const rows: EventRow[]=(query.data?.data||[]).map((r:any)=>({id:r.due_date?.id||r.due_date_id,title:r.due_date?.title||"Event not recorded",event_type:r.due_date?.event_type||"",due_at:r.due_date?.due_at||null,status:r.due_date?.status,patent:r.due_date?.patent||{id:"",title:"Patent not recorded",application_number:null},client:r.client,action:{...r,requested_by:r.requested_by}}));
  return <ActionsWorkspace operator hasExtraFilters={statusFilter!=="all" || clientFilter!=="all" || !!requestFocus} clearExtraFilters={()=>{setRequestFocus("");setStatusFilter("all");setClientFilter("all");setClientSearch("");setCurrentPage(1);}} rows={rows} loading={query.isLoading} error={query.isError} retry={()=>query.refetch()} search={searchQuery} onSearch={v=>{setRequestFocus("");setSearchQuery(v);setCurrentPage(1);}} filter={filterOption} onFilter={v=>{track("list_filtered",{list:"actions"});setFilterOption(v);setCurrentPage(1);}} pagination={query.data?.pagination} onPage={setCurrentPage} extraFilters={<>
    {requestFocus && <Button size="sm" variant="outline" onClick={()=>{setRequestFocus("");setSearchQuery("");setCurrentPage(1);}}>Show all instructions</Button>}
    <div><Label htmlFor="actions-status" className="text-xs text-pl-text-2">Request status</Label><select id="actions-status" value={statusFilter} onChange={e=>{setStatusFilter(e.target.value);setCurrentPage(1);}} className={`mt-2 block h-9 rounded-md border px-3 text-sm ${actionField}`}><option value="all">All statuses</option><option value="NEW">Submitted</option><option value="ACKNOWLEDGED">Acknowledged</option><option value="IN_PROGRESS">In progress</option><option value="COMPLETED">Completed</option><option value="DECLINED">Declined</option></select></div>
    <details className="min-w-0"><summary className="cursor-pointer rounded-sm py-2 text-sm">Client scope</summary><div className="mt-2 space-y-2"><Label htmlFor="actions-client-search" className="text-xs text-pl-text-2">Find a client</Label><Input id="actions-client-search" className={`h-9 ${actionField}`} value={clientSearch} onChange={e=>setClientSearch(e.target.value)}/><Label htmlFor="actions-client" className="text-xs text-pl-text-2">Client</Label><select id="actions-client" value={clientFilter} onChange={e=>{setClientFilter(e.target.value);setCurrentPage(1);}} className={`block h-9 w-full rounded-md border px-3 text-sm ${actionField}`}><option value="all">All accessible clients</option>{(clients.data?.data||[]).map((c:any)=><option value={c.id} key={c.id}>{c.name}</option>)}</select>{clients.isError && <p role="alert" className="text-xs">Clients could not be loaded. <button type="button" className="underline" onClick={()=>clients.refetch()}>Retry client lookup</button></p>}</div></details>
  </>}/>;
}
