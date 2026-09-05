import React, { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import Cookies from "js-cookie";
import { useLocation } from "react-router-dom";
import { track } from "@/lib/analytics";
import API_CONFIG from "@/lib/apiConfig";
import useUserCookie from "@/hooks/use-auth";
import { isOutsideCounselRole } from "@/lib/roleAccess";
import ActionsWorkspace from "@/components/actions/ActionsWorkspace";
import PhotonDueDatesWorkspace from "./PhotonDueDatesWorkspace";

export type DueDatesViewType = "list" | "calendar";
export type DueDatesHeaderState = { viewType: DueDatesViewType; total: number; onViewChange: (view: DueDatesViewType) => void };
export default function DueDatesContent({ initialView = "list", onHeaderStateChange }: { initialView?: DueDatesViewType; onHeaderStateChange?: (state: DueDatesHeaderState) => void }) {
  const location = useLocation();
  const initialParams = useMemo(() => new URLSearchParams(location.search || window.location.search), []);
  const isOC = (() => { try { return isOutsideCounselRole(JSON.parse(Cookies.get("pl_user") || "null")?.role); } catch { return false; } })();
  const { user } = useUserCookie();
  const [searchQuery, setSearchQuery] = useState(initialParams.get("search") || "");
  const [searchTerm, setSearchTerm] = useState(searchQuery.trim());
  const [filterOption, setFilterOption] = useState(isOC ? "open" : "all");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>([]);
  const [clientSearchInput, setClientSearchInput] = useState("");
  const [debouncedClientSearch, setDebouncedClientSearch] = useState("");
  const [month, setMonth] = useState("");
  const [viewType, setViewType] = useState<DueDatesViewType>(initialView);
  const itemsPerPage = 10, sortOption = "oldest";
  useEffect(() => { const timer = setTimeout(() => { setSearchTerm(searchQuery.trim()); setCurrentPage(1); }, 350); return () => clearTimeout(timer); }, [searchQuery]);
  useEffect(() => { const timer = setTimeout(() => setDebouncedClientSearch(clientSearchInput), 300); return () => clearTimeout(timer); }, [clientSearchInput]);
  const query = useQuery({ queryKey: ["all_due_dates", currentPage, searchTerm, filterOption, itemsPerPage, sortOption, selectedClientIds, month], queryFn: async () => {
    const params = new URLSearchParams({ page: String(currentPage), limit: String(itemsPerPage), order: "asc", sort: "due_at", search: searchTerm, filter: filterOption, filter_client_id: selectedClientIds.join(",") });
    if (month) { params.set("year", month.slice(0,4)); params.set("month", String(Number(month.slice(5,7)))); }
    const response = await API_CONFIG.get(`/api/v1/patent/fetch/all-due-dates?${params}`);
    if (response.status === 200) return response.data;
  }, enabled: !!user && (!!user.client_id || isOutsideCounselRole(user.role)), refetchOnMount: true });
  useEffect(() => { const last = query.data?.pagination?.totalPages; if (last && currentPage > last) setCurrentPage(last); }, [query.data?.pagination?.totalPages, currentPage]);
  const total = Number(query.data?.pagination?.total) || 0;
  useEffect(() => { onHeaderStateChange?.({ viewType, total, onViewChange: setViewType }); }, [viewType, total, onHeaderStateChange]);
  const clients = useQuery({ queryKey: ["clients_lookup_for_due_dates", debouncedClientSearch], queryFn: async () => (await API_CONFIG.get(`/api/v1/clients/lookup?${new URLSearchParams({search:debouncedClientSearch,limit:"20"})}`)).data, enabled: isOutsideCounselRole(user?.role) });
  const onFilter = (value: string) => { track("list_filtered", { list: "due_dates" }); setFilterOption(value); setCurrentPage(1); };
  const props = { rows: (query.data?.data || []).map((row: any) => ({ ...row, title: row.event_name, due_at: row.event_date, action: row.action || null })), loading: query.isLoading, error: query.isError, retry: () => query.refetch(), search: searchQuery, onSearch: setSearchQuery, filter: filterOption, onFilter, pagination: query.data?.pagination, onPage: setCurrentPage };
  if (!isOC) return <ActionsWorkspace header={false} {...props}/>;
  return <PhotonDueDatesWorkspace {...props} focusedApplication={initialParams.get("focus")} clients={clients.data?.data || []} clientId={selectedClientIds[0] || ""} onClient={id => { setSelectedClientIds(id ? [id] : []); setCurrentPage(1); }} clientSearch={clientSearchInput} onClientSearch={setClientSearchInput} clientsError={clients.isError} retryClients={() => clients.refetch()} month={month} onMonth={value => {setMonth(value); setCurrentPage(1);}} initialPlanning={initialView === "calendar"}/>;
}
