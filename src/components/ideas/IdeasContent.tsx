import React, { useEffect, useMemo, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Search, Plus, ChevronDown } from "lucide-react";
import { PageHeader } from "@/components/DashboardChrome";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import useUserCookie from "@/hooks/use-auth";
import API_CONFIG from "@/lib/apiConfig";
import { isOutsideCounselRole } from "@/lib/roleAccess";
import IdeaSubmissionModal from "./IdeaSubmissionModal";

type SortOption = "newest" | "oldest" | "recently_updated";
const states = [
  ["IN_DRAFT", "In draft"], ["SENT_TO_IHC", "Awaiting review"],
  ["UPDATE_REQUEST", "Changes requested"], ["REJECT_BY_IHC", "Rejected"],
  ["SEND_TO_OC", "Sent to Photon Legal"], ["FILED", "Filed"],
];
const stateLabel = (idea: any) => states.find(([code]) => code === idea.status)?.[1] ?? "Awaiting review";
const nextStep = (idea: any, photon: boolean) => {
  if (idea.status === "IN_DRAFT") return "Continue draft";
  if (idea.status === "UPDATE_REQUEST") return photon ? "Inventor updates disclosure next" : "Update disclosure";
  if (idea.status === "REJECT_BY_IHC" || idea.status === "REJECT_BY_OC") return "Read decision and feedback";
  if (idea.status === "SEND_TO_OC") return photon ? "Open filing brief" : "Photon Legal handles filing next";
  if (idea.status === "FILED") return "View filing and patent";
  return "Workspace Admin reviews next";
};
const dateLabel = (date?: string) => date ? new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "Not recorded";

const IdeasContent: React.FC = () => {
  const { user } = useUserCookie();
  const navigate = useNavigate();
  const isOC = isOutsideCounselRole(user?.role);
  const isInventor = user?.role === "INVENTOR";
  const availableStates = isOC ? states.filter(([code]) => ["SEND_TO_OC", "FILED"].includes(code)) : states;
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchQuery, setSearchQuery] = useState(searchParams.get("search") || "");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchQuery);
  const [statusFilters, setStatusFilters] = useState<string[]>(() => (searchParams.get("status") || "").split(",").filter(Boolean));
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>(() => (searchParams.get("client") || "").split(",").filter(Boolean));
  const [sortOption, setSortOption] = useState<SortOption>((searchParams.get("sort") as SortOption) || "recently_updated");
  const [currentPage, setCurrentPage] = useState(Number(searchParams.get("page")) || 1);
  const itemsPerPage = 10;
  const dateFilter = searchParams.get("date") || "";
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const initialized = React.useRef(false);
  useEffect(() => {
    if (!user?.id || initialized.current) return;
    initialized.current = true;
    if (isOC && !searchParams.has("status")) setStatusFilters(["SEND_TO_OC"]);
    if (isOC && !searchParams.has("sort")) setSortOption("oldest");
  }, [user?.id, isOC, searchParams]);
  useEffect(() => { const timer = setTimeout(() => setDebouncedSearchQuery(searchQuery), 350); return () => clearTimeout(timer); }, [searchQuery]);
  useEffect(() => {
    if (!initialized.current) return;
    const params = new URLSearchParams(searchParams);
    for (const [key, value] of Object.entries({ search: debouncedSearchQuery, status: statusFilters.join(","), client: selectedClientIds.join(","), sort: sortOption, page: String(currentPage) })) {
      if (value) params.set(key, value); else params.delete(key);
    }
    setSearchParams(params, { replace: true });
  }, [debouncedSearchQuery, statusFilters, selectedClientIds, sortOption, currentPage, setSearchParams]);
  const { data: clientLookupData } = useQuery({ queryKey: ["idea_client_lookup"], queryFn: async () => (await API_CONFIG.get("/api/v1/clients/lookup"))?.data?.data || [], enabled: isOC });
  const clientOptions: { id: string; name: string }[] = Array.isArray(clientLookupData) ? clientLookupData : [];
  const {
    data: ideaData,
    isPending: isFetchingIdeas,
    isError: ideasError,
    refetch: refetchIdeas,
  } = useQuery({
    queryKey: [
      "fetch_ideas",
      currentPage,
      itemsPerPage,
      debouncedSearchQuery,
      sortOption,
      statusFilters,
      selectedClientIds,
      dateFilter,
    ],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        params.append("page", currentPage.toString());
        params.set("limit", String(itemsPerPage));
        params.set("search", debouncedSearchQuery);
        const receivedStatuses = statusFilters.filter((status) => ["SEND_TO_OC", "FILED"].includes(status));
        const requestedStatuses = isOC ? (receivedStatuses.length ? receivedStatuses : ["SEND_TO_OC", "FILED"]) : statusFilters;
        const order = sortOption === "oldest" ? "asc" : "desc";
        const sort = (sortOption === "oldest" || sortOption === "newest") ? (isOC ? "submission_date" : "createdAt") : "updatedAt";
        const response = await API_CONFIG.get(
          `/api/v1/idea/fetch-by-user?${params?.toString()}&order=${order}&sort=${sort}${requestedStatuses?.length ? `&status=${requestedStatuses.join(",")}` : ""
          }${selectedClientIds.length ? `&filter_client_id=${selectedClientIds.join(",")}` : ""}${dateFilter ? `&date=${dateFilter}` : ""}`,
        );

        if (response.status === 200) {
          return response?.data;
        }
      } catch (error) {
        throw error;
      }
    },
    refetchOnMount: true,
    enabled: !!user?.id,
  });


  const ideas = useMemo(() => {
    const rows = Array.isArray(ideaData?.data) ? ideaData.data : [];
    return isInventor ? rows.filter((idea: any) => idea.created_by_id === user?.id || idea.IdeaInventor?.some((credit: any) => credit.inventor?.id === user?.id)) : rows;
  }, [ideaData, isInventor, user?.id]);
  // The list endpoint returns an envelope. Include its current IDs so paging
  // cannot reuse another page's drafts or silently skip this query.
  const { data: draftData, isError: draftError, refetch: reloadDrafts } = useQuery({
    queryKey: ["fetch_drafts", ideas.map((idea: any) => idea.id)],
    enabled: isInventor && ideas.length > 0,
    queryFn: async () => Promise.all(ideas.map(async (idea: any) => {
      const drafts = (await API_CONFIG.get(`/api/v1/idea/fetch-drafts/${idea.id}`)).data?.data || [];
      const draft = [...drafts].sort((a: any, b: any) => (b.updated_at || "").localeCompare(a.updated_at || ""))[0];
      const evaluation = draft ? (await API_CONFIG.get(`/api/v1/idea/fetch-score/${draft.id}`)).data?.data : null;
      return { ideaId: idea.id, draft, evaluation };
    })),
    refetchInterval: (query) => query.state.data?.some((row: any) => row.evaluation?.status === "RUNNING") ? 1500 : false,
  });
  const totalItems = ideaData?.pagination?.total || 0;
  const totalPages = ideaData?.pagination?.totalPages || 1;
  const hasFilters = !!(debouncedSearchQuery || statusFilters.length || selectedClientIds.length || dateFilter);
  const emptyFirstRun = isInventor && !isFetchingIdeas && !ideasError && !hasFilters && ideas.length === 0;
  const clearFilters = () => { setSearchQuery(""); setDebouncedSearchQuery(""); setStatusFilters([]); setSelectedClientIds([]); setCurrentPage(1); const params = new URLSearchParams(searchParams); params.delete("date"); setSearchParams(params, { replace: true }); };
  const firstIdea = ideas[0];
  const scoreCell = (idea: any) => {
    const record = draftData?.find((row: any) => row.ideaId === idea.id);
    if (draftError) return <span>Evaluation unavailable</span>;
    if (!record) return <span>Loading evaluation…</span>;
    if (record.evaluation?.status === "RUNNING") return <span role="status">Evaluation running</span>;
    if (record.evaluation?.status === "FAILED") return <span>Evaluation could not finish</span>;
    const rawScore = record.evaluation?.score;
    if (rawScore == null) return <span>Not evaluated</span>;
    const score = Number(rawScore) / 10;
    const band = score >= 8 ? "Highly novel" : score >= 6 ? "Moderately novel" : score >= 4 ? "Marginally novel" : "Closely matched";
    return <><span className="font-medium tabular-nums text-pl-ink">{score.toFixed(1)} / 10</span><span className="block">{band}</span>{record.draft?.evaluation_context?.is_current === false && <span className="block text-pl-amber-text">Before latest edits</span>}{record.evaluation?.state === "PARTIAL" && <span className="block">Partial result</span>}</>;
  };
  return <div data-ideas-list className="min-w-0 flex-1 bg-pl-bg-subtle p-6 text-pl-ink">
    <PageHeader title={isInventor ? "My ideas" : "Ideas"} actions={<DropdownMenu><DropdownMenuTrigger asChild><Button size="sm" variant="outline" className="md:hidden">Navigation <ChevronDown aria-hidden="true" /></Button></DropdownMenuTrigger><DropdownMenuContent align="end" className="bg-pl-bg text-pl-ink motion-reduce:!animate-none"><DropdownMenuItem asChild><Link to="/">{isInventor ? "Home" : user?.role === "CASE_OWNER" ? "My work" : "Dashboard"}</Link></DropdownMenuItem>{isOC && <DropdownMenuItem asChild><Link to="/clients">Clients</Link></DropdownMenuItem>}<DropdownMenuItem asChild><Link to="/ideas">{isInventor ? "My ideas" : "Ideas"}</Link></DropdownMenuItem><DropdownMenuItem asChild><Link to="/patents">Patents</Link></DropdownMenuItem>{isOC && <><DropdownMenuItem asChild><Link to="/due-dates">Due dates</Link></DropdownMenuItem><DropdownMenuItem asChild><Link to="/actions">Actions</Link></DropdownMenuItem></>}{user?.role === "PHOTON_ADMIN" && <DropdownMenuItem asChild><Link to="/workspace">Workspace</Link></DropdownMenuItem>}<DropdownMenuItem asChild><Link to="/profile">Profile</Link></DropdownMenuItem></DropdownMenuContent></DropdownMenu>} primaryAction={!isOC ? { label: "Submit an idea", onClick: () => setIsSubmitModalOpen(true), icon: <Plus className="h-4 w-4" /> } : firstIdea && !ideasError ? { label: "Open first idea", onClick: () => { navigate(`/ideas/${firstIdea.id}`); }, icon: <ArrowRight className="h-4 w-4" /> } : undefined} />
    <h1 className="text-xl font-semibold">{isInventor ? "Your ideas and next steps" : user?.role === "CASE_OWNER" ? "Ideas from your assigned clients" : "Ideas across clients"}</h1>
    <p className="mt-2 hidden text-sm text-pl-text-2 md:block">{isInventor ? "Find a draft, read review feedback, or follow an idea through filing." : "Open a received disclosure to review its filing brief and ownership."}</p>
    {!emptyFirstRun && <><Button size="sm" variant="outline" className="mt-4 md:hidden" aria-expanded={filtersOpen} aria-controls="ideas-filters" onClick={() => setFiltersOpen((open) => !open)}>Filters and sort <ChevronDown aria-hidden="true" /></Button>
    <div id="ideas-filters" className={`${filtersOpen ? "flex" : "hidden"} mt-5 flex-wrap items-end gap-3 md:flex`} aria-label="Idea filters">
      <label className="w-full min-w-0 text-xs text-pl-text-2 md:w-auto md:flex-1">Search ideas<div className="relative mt-1"><Search aria-hidden="true" className="pointer-events-none absolute left-3 top-3 h-4 w-4" /><Input className="pl-9" value={searchQuery} placeholder="Title or description" onChange={(event) => { setSearchQuery(event.target.value); setCurrentPage(1); }} /></div></label>
      <label className="text-xs text-pl-text-2">Status<Select value={statusFilters.join(",") || "all"} onValueChange={(value) => { setStatusFilters(value === "all" ? [] : value.split(",")); setCurrentPage(1); }}><SelectTrigger className="mt-1" aria-label="Idea status"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">{isOC ? "All received ideas" : "All statuses"}</SelectItem>{availableStates.map(([value, label]) => <SelectItem key={value} value={value}>{label}</SelectItem>)}{statusFilters.length > 1 && <SelectItem value={statusFilters.join(",")}>Selected statuses</SelectItem>}</SelectContent></Select></label>
      {isOC && <label className="text-xs text-pl-text-2">Client<Select value={selectedClientIds.join(",") || "all"} onValueChange={(value) => { setSelectedClientIds(value === "all" ? [] : value.split(",")); setCurrentPage(1); }}><SelectTrigger className="mt-1" aria-label="Idea client"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All clients</SelectItem>{clientOptions.map((client) => <SelectItem key={client.id} value={client.id}>{client.name}</SelectItem>)}{selectedClientIds.length > 1 && <SelectItem value={selectedClientIds.join(",")}>Selected clients</SelectItem>}</SelectContent></Select></label>}
      <label className="text-xs text-pl-text-2">Sort<Select value={sortOption} onValueChange={(value: SortOption) => { setSortOption(value); setCurrentPage(1); }}><SelectTrigger className="mt-1" aria-label="Sort ideas"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="recently_updated">Recently updated</SelectItem><SelectItem value="oldest">{isOC ? "Oldest submitted" : "Oldest created"}</SelectItem><SelectItem value="newest">{isOC ? "Newest submitted" : "Newest created"}</SelectItem></SelectContent></Select></label>
      {hasFilters && <Button size="sm" variant="ghost" onClick={clearFilters}>Clear filters</Button>}
    </div>
    </>}
    {dateFilter && <p className="mt-3 text-xs text-pl-text-2">A date filter from the dashboard is active.</p>}
    {isFetchingIdeas ? <div className="mt-6"><p role="status" className="text-sm">Loading ideas…</p><div aria-hidden="true" className="mt-3 space-y-4 rounded-md border border-pl-border bg-pl-bg p-5">{[0, 1, 2].map((row) => <div key={row} className="grid grid-cols-4 gap-4"><div className="h-10 rounded-sm bg-pl-bg-muted" /><div className="h-10 rounded-sm bg-pl-bg-muted" /><div className="h-10 rounded-sm bg-pl-bg-muted" /><div className="h-10 rounded-sm bg-pl-bg-muted" /></div>)}</div></div> : ideasError ? <div role="alert" className="mt-6 rounded-md border border-pl-border bg-pl-bg p-6"><h2 className="font-semibold">Ideas could not be loaded</h2><p className="mt-2 text-sm text-pl-text-2">Your filters are kept. Reload to try again.</p><Button className="mt-4" size="sm" variant="outline" onClick={() => refetchIdeas()}>Reload ideas</Button></div> : !ideas.length ? <div className="mt-6 rounded-md border border-pl-border bg-pl-bg p-6"><h2 className="text-lg font-semibold">{hasFilters ? "No ideas match these filters" : isInventor ? "Your first idea starts here" : "No ideas received yet"}</h2><p className="mt-2 text-sm text-pl-text-2">{hasFilters ? "Try another title or clear the filters to see more ideas." : isInventor ? "Bring your notes or describe a problem you have solved. Your work starts as a draft." : "Ideas appear here when a Workspace Admin sends them to Photon Legal."}</p>{hasFilters && <Button size="sm" variant="outline" className="mt-4" onClick={clearFilters}>Show all ideas</Button>}</div> : <>
      <p role="status" className="mt-5 text-xs text-pl-text-2">{totalItems} {totalItems === 1 ? "idea" : "ideas"} · {isInventor ? "Your own and credited ideas" : "Within your client access"}</p>
      {draftError && <p role="alert" className="mt-3 text-sm">Evaluation details could not load. <Button size="sm" variant="link" onClick={() => reloadDrafts()}>Reload evaluations</Button></p>}
      <div className="mt-3 overflow-hidden rounded-md border border-pl-border bg-pl-bg">
        <div aria-hidden="true" className="hidden grid-cols-4 gap-4 border-b border-pl-border bg-pl-bg-subtle px-5 py-3 text-xs font-medium text-pl-text-2 lg:grid"><span>Idea</span><span>{isInventor ? "Status · last updated" : "Client · ownership"}</span><span>{isInventor ? "Patentability score" : "Status · submitted"}</span><span>Next step</span></div>
        <ul className="divide-y divide-pl-border">{ideas.map((idea: any) => <li key={idea.id}><Link className="grid grid-cols-2 gap-3 px-5 py-4 hover:bg-pl-bg-subtle focus-visible:outline focus-visible:outline-2 focus-visible:outline-pl-brand lg:grid-cols-4 lg:gap-4" to={`/ideas/${idea.id}`}><div className="col-span-2 min-w-0 lg:col-span-1"><p className="text-xs text-pl-text-2">{idea.reference_number || "Reference pending"}</p><h2 className="mt-1 break-words text-sm font-semibold">{idea.title}</h2></div><div className="text-xs leading-relaxed text-pl-text-2">{isInventor ? <><p className="font-medium text-pl-ink">{stateLabel(idea)}</p><p>Updated {dateLabel(idea.updatedAt)}</p></> : <><p className="font-medium text-pl-ink">{idea.client?.name || "Client unavailable"}</p><p>Case Owner · {idea.case_owners?.map((owner: any) => owner.name).join(", ") || "Unassigned"}</p><p>Inventor · {idea.created_by?.name || "Not recorded"}</p></>}</div><div className="text-xs leading-relaxed text-pl-text-2">{isInventor ? scoreCell(idea) : <><p className="font-medium text-pl-ink">{stateLabel(idea)}</p><p>Submitted {dateLabel(idea.submitted_at)}</p></>}</div><div className="col-span-2 flex items-start justify-between gap-2 text-sm lg:col-span-1"><span>{nextStep(idea, isOC)}</span><ArrowRight aria-hidden="true" className="h-4 w-4 shrink-0" /></div></Link></li>)}</ul>
      </div>
      <div className="mt-4 flex flex-wrap items-center justify-between gap-3 text-xs text-pl-text-2"><p>Page {currentPage} of {totalPages}</p><div className="flex gap-2"><Button size="sm" variant="outline" disabled={currentPage <= 1} onClick={() => setCurrentPage((page) => page - 1)}>Previous page</Button><Button size="sm" variant="outline" disabled={currentPage >= totalPages} onClick={() => setCurrentPage((page) => page + 1)}>Next page</Button></div></div>
      {isInventor && <p className="mt-4 text-xs text-pl-text-2">Evaluation is AI-assisted and advisory. No score is required to submit for review.</p>}
    </>}
    <IdeaSubmissionModal open={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen} refetchIdeas={refetchIdeas} />
  </div>;
};
export default IdeasContent;
