import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "react-router-dom";
import { rawApi } from "@/lib/apiConfig";
import useUserCookie from "@/hooks/use-auth";
import { track } from "@/lib/analytics";
import ActionsWorkspace, { type EventRow } from "./ActionsWorkspace";

/** The existing /actions client alias; its query identity and canonical route stay intact. */
export default function IHCActionsContent() {
  const { user } = useUserCookie();
  const location = useLocation();
  const [searchQuery,setSearchQuery]=useState(new URLSearchParams(location.search).get("search") || "");
  const [filterOption,setFilterOption]=useState("all");
  const [currentPage,setCurrentPage]=useState(1);
  const itemsPerPage=20, statusFilter="all", sortOption="oldest", clientId=user?.client_id;
  const query=useQuery({queryKey:["ihc_actions",clientId,currentPage,itemsPerPage,searchQuery,filterOption,statusFilter,sortOption],queryFn:async()=>{
    const params=new URLSearchParams({page:String(currentPage),limit:String(itemsPerPage),search:searchQuery,filter:filterOption,status:statusFilter,sort:sortOption});
    if(clientId)params.set("client_id",clientId);
    // Canonical event_type is needed to resolve the allowed instruction catalogue.
    const r=await rawApi.get(`/v1/actions?${params}`);return r.data;
  },enabled:!!clientId,refetchOnMount:true,retry:false});
  const rows: EventRow[]=(query.data?.data||[]).map((row:any)=>({id:row.due_date_id,title:row.title,event_type:row.event_type,due_at:row.due_at,status:row.event_status,patent:row.patent,action:row.id?{id:row.id,template_id:row.template_id,instruction:row.instruction,submission_state:row.submission_state,status:row.status,selected_countries:row.selected_countries,note:row.note,version:row.version,requested_at:row.requested_at,response_note:row.response_note}:null}));
  return <ActionsWorkspace rows={rows} loading={query.isLoading} error={query.isError} retry={()=>query.refetch()} search={searchQuery} onSearch={v=>{setSearchQuery(v);setCurrentPage(1);}} filter={filterOption} onFilter={v=>{track("list_filtered",{list:"actions"});setFilterOption(v);setCurrentPage(1);}} pagination={query.data?.pagination} onPage={p=>{track("list_paginated",{list:"actions"});setCurrentPage(p);}}/>;
}
