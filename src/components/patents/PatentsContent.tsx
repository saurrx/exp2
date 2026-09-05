import React, { useState, useMemo, useEffect } from "react";
import { track } from "@/lib/analytics";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Filter,
  Search,
  ChevronDown,
  FileSearch,
  ChevronsRight,
  ChevronRight,
  ChevronLeft,
  ChevronsLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Building2,
  Plus,
  Pencil,
  X,
  Loader2,
  Tags as TagsIcon,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/lib/toast";
import { isOutsideCounselRole } from "@/lib/roleAccess";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { ProductChip } from "@/components/ui/product-chip";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import API_CONFIG, { assetUrl, rawApi } from "@/lib/apiConfig";
import useUserCookie from "@/hooks/use-auth";
import Cookies from "js-cookie";
import Loader from "../Loader";
import moment from "moment";
import { useTheme } from "@/hooks/useTheme";
import PortfolioImport from "./PortfolioImport";
import PatentTagsCell from "./PatentTagsCell";
import DateRangeFilter from "@/components/patents/DateRangeFilter";
import { resolveDateRange, dateFilterLabel, type DatePreset } from "@/lib/dateRange";
import LinkedIdeaBadge from "@/components/patents/LinkedIdeaBadge";
import { FilterButton } from "@/components/ui/filter-button";
import { MenuRadioItem } from "@/components/ui/menu-radio-item";
import { Columns3 } from "lucide-react";
import { PATENT_LEGAL_STATUS_META, PATENT_LEGAL_STATUS_VALUES, type PatentLegalStatus } from "@/utils/patentLegalStatus";

interface Patent {
  id: string;
  application_number: string;
  title: string;
  abstract: string;
  assignee_original: string;
  current_assignee: string;
  inventors: string[]; // Stored as a single string (joining array entries)
  publicationDate: string;
  application_date: string;
  priority_details: string;
  publication_country: string;
  current_status: string;
  issue_date: string;
  simpleFamilyMembers: string[];
  ipcAllVersions: string[];
  fileHistoryId: string;
  createdAt: string;
  updatedAt: string;
  prn: string;
  oc: string;
  legal_current_status?: string;
  tags?: string[];
  // patentEvents: PatentEvent[];
  // fileHistory: FileHistory;
}

// interface PatentEvent {
//   id: string;
//   eventName: string;
//   eventDate: string;
//   patentId: string;
//   createdAt: string;
//   updatedAt: string;
// }

// interface FileHistory {
//   id: string;
//   fileName: string;
//   filePath: string;
//   size: number;
//   type: string;
//   uploadedBy: string;
//   clientId: string;
//   createdAt: string;
//   updatedAt: string;
//   user: {
//     id: string;
//     name: string;
//     email: string;
//   };
// }

// Filter values are PATENT_LEGAL_STATUS enum members. Legacy bucket labels
// (granted/pending/rejected) are still accepted by the backend so old
// bookmarked URLs keep working, but the UI no longer surfaces them.
type FilterOption = PatentLegalStatus;
type SortOption = "newest" | "oldest" | "titleAZ" | "titleZA";

interface SortConfig {
  sortBy: string;
  sortOrder: "asc" | "desc";
}

interface Column {
  id: string;
  label: string;
  width: string;
  accessor: keyof Patent | ((patent: Patent) => React.ReactNode);
  visible: boolean;
  sticky?: boolean;
  // DB column the backend sorts by when this header is clicked. Omitted for
  // columns that can't be server-sorted (row index, array fields like tags
  // and inventors).
  sortField?: string;
}

type PatentsContentProps = {
  patentStatus?: any;
  setTotalPatents?: (x: number) => void;
  // Parent registers its export-trigger ref via this callback. We re-register
  // every time the filter closure changes so the parent button always fires
  // an export against the latest filter state.
  setExportTrigger?: (fn: (() => Promise<void> | void) | null) => void;
};

const STATUS_KEYS: Record<string, string> = { ACTIVE_GRANTED: "GRANTED", ACTIVE_APPLIED: "APPLIED", ACTIVE_EXAMINATION: "EXAMINATION", INACTIVE_EXPIRED: "EXPIRED", INACTIVE_WITHDRAWN: "WITHDRAWN", INACTIVE_REJECTED: "REJECTED", INACTIVE_ABANDONED: "ABANDONED", INACTIVE_NONPAYMENT: "NONPAYMENT" };
const backendStatus = (status: string) => STATUS_KEYS[status] || status;
const legalStatus = (status: string): PatentLegalStatus => (Object.keys(STATUS_KEYS).find(key => STATUS_KEYS[key] === status) || status) as PatentLegalStatus;
const dateText = (value?: string) => value && moment(value).isValid() ? moment(value).format("D MMM YYYY") : "Not recorded";
const jurisdictionName = (code: string) => ({ EP: "Europe", WO: "International" }[code] || (() => { try { return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code; } catch { return code || "Not recorded"; } })());

const COLUMN_VISIBILITY_KEY_PREFIX = "patents-portfolio-column-visibility-v6";

const CORE_COLUMN_WIDTHS: Record<string, string> = {
  prn: "160px",
  title: "320px",
  legal_current_status: "170px",
  publicationCountry: "170px",
  dateOfFiling: "140px",
  tags: "220px",
};

const getColumnVisibilityStorageKey = (userId: string | undefined): string =>
  userId
    ? `${COLUMN_VISIBILITY_KEY_PREFIX}:${userId}`
    : COLUMN_VISIBILITY_KEY_PREFIX;

const readUserIdFromCookie = (): string | undefined => {
  try {
    const raw = Cookies.get("pl_user");
    if (!raw) return undefined;
    const parsed = JSON.parse(raw);
    return typeof parsed?.id === "string" ? parsed.id : undefined;
  } catch {
    return undefined;
  }
};

const defaultColumns: Column[] = [
  {
    id: "index",
    label: "#",
    width: "w-10",
    accessor: "id",
    visible: false,
    sticky: true,
  },
  {
    id: "applicationNo",
    label: "Application No.",
    width: "w-36",
    accessor: "application_number",
    visible: false,
    sticky: true,
    sortField: "application_number",
  },
  {
    id: "prn",
    label: "PRN",
    width: "w-40",
    accessor: "prn",
    visible: true,
    sticky: true,
    sortField: "prn",
  },
  {
    id: "title",
    label: "Invention Title",
    width: "w-96",
    accessor: "title",
    visible: true,
    sortField: "title",
  },
  {
    id: "legal_current_status",
    label: "Current Status",
    width: "w-36",
    accessor: "legal_current_status",
    visible: true,
    sortField: "legal_current_status",
  },
  {
    id: "publicationCountry",
    label: "Publication Country",
    width: "w-36",
    accessor: "publication_country",
    visible: true,
    sortField: "publication_country",
  },
  {
    id: "dateOfFiling",
    label: "Filed",
    width: "w-36",
    accessor: (patent) =>
      moment(patent?.application_date).format("YYYY-MM-DD"),
    visible: true,
    sortField: "application_date",
  },
  {
    id: "assigneeOriginal",
    label: "Assignee Original",
    width: "w-40",
    accessor: "assignee_original",
    visible: false,
    sortField: "assignee_original",
  },
  {
    id: "tags",
    label: "Tags",
    width: "w-64",
    accessor: "tags" as keyof Patent,
    visible: false,
  },
  {
    id: "abstract",
    label: "Abstract",
    width: "w-96",
    accessor: "abstract",
    visible: false,
    sortField: "abstract",
  },
  {
    id: "priority",
    label: "Priority Details",
    width: "w-96",
    accessor: "priority_details",
    visible: false,
    sortField: "priority_details",
  },
  {
    id: "currentAssignee",
    label: "Current Assignee",
    width: "w-40",
    accessor: "current_assignee",
    visible: false,
    sortField: "current_assignee",
  },
  {
    id: "inventors",
    label: "Inventors",
    width: "w-72",
    accessor: "inventors",
    visible: false,
  },
  {
    id: "publication_date",
    label: "Pub. Date",
    width: "w-36",
    accessor: (patent) => moment(patent?.issue_date).format("YYYY-MM-DD") || "-",
    visible: false,
    sortField: "issue_date",
  },
];

const loadColumnsFromStorage = (userId: string | undefined): Column[] => {
  try {
    const stored = localStorage.getItem(getColumnVisibilityStorageKey(userId));
    if (!stored) return defaultColumns;
    const overrides = JSON.parse(stored) as Record<string, unknown>;
    return defaultColumns.map((col) => {
      if (col.sticky) return col;
      const v = overrides?.[col.id];
      return typeof v === "boolean" ? { ...col, visible: v } : col;
    });
  } catch {
    return defaultColumns;
  }
};

const PatentsContent = (props: PatentsContentProps) => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  
  // Initialize state from URL params
  const getInitialSearchQuery = () => searchParams.get("search") || "";
  const getInitialFilterOption = (): FilterOption[] => {
    const statusParam = searchParams.get("status");
    if (statusParam) {
      const statuses = statusParam.split(",").filter(Boolean) as FilterOption[];
      return statuses;
    }
    return props.patentStatus ? [props.patentStatus] : [];
  };
  const getInitialSortOption = (): SortOption => {
    const sortParam = searchParams.get("sort") || "newest";
    return (["newest", "oldest", "titleAZ", "titleZA"].includes(sortParam) 
      ? sortParam 
      : "newest") as SortOption;
  };
  const getInitialPage = () => {
    const pageParam = searchParams.get("page");
    return pageParam ? parseInt(pageParam, 10) : 1;
  };
  const getInitialItemsPerPage = () => {
    const limitParam = searchParams.get("limit");
    return limitParam ? parseInt(limitParam, 10) : 10;
  };
  const getInitialSelectedClientId = (): string[] => {
    const clientParam = searchParams.get("client");
    return clientParam ? clientParam.split(",").filter(Boolean) : [];
  };
  const getInitialSelectedTags = (): string[] => {
    const tagsParam = searchParams.get("tags");
    return tagsParam ? tagsParam.split(",").filter(Boolean) : [];
  };
  const getInitialSortConfig = (): SortConfig => {
    const sortBy = searchParams.get("sortBy") || "application_date";
    const sortOrder = (searchParams.get("sortOrder") || "desc") as "asc" | "desc";
    return { sortBy, sortOrder };
  };
  const getInitialDatePreset = (): DatePreset => {
    const param = searchParams.get("date");
    return (["last30", "last60", "last90", "custom"].includes(param || "")
      ? param
      : "all") as DatePreset;
  };
  const getInitialCustomFrom = () => searchParams.get("date_from") || "";
  const getInitialCustomTo = () => searchParams.get("date_to") || "";

  const jurisdiction = searchParams.get("jurisdiction") || "";
  const [searchInput, setSearchInput] = useState(getInitialSearchQuery);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [importOpen, setImportOpen] = useState(false);
  const [viewMode, setViewMode] = useState<string>("list");
  const [rowHeight, setRowHeight] = useState<string>("large"); // Default to large for abstracts
  const [searchQuery, setSearchQuery] = useState<string>(getInitialSearchQuery);
  const [filterOption, setFilterOption] = useState<FilterOption[]>(getInitialFilterOption);
  const [sortOption, setSortOption] = useState<SortOption>(getInitialSortOption);
  const [currentPage, setCurrentPage] = useState<number>(getInitialPage);
  const [itemsPerPage, setItemsPerPage] = useState<number>(getInitialItemsPerPage);
  const [selectedClientId, setSelectedClientId] = useState<string[]>(getInitialSelectedClientId);
  const [clientSearchQuery, setClientSearchQuery] = useState<string>("");
  const [selectedTags, setSelectedTags] = useState<string[]>(getInitialSelectedTags);
  const [tagSearchQuery, setTagSearchQuery] = useState<string>("");
  const [sortConfig, setSortConfig] = useState<SortConfig>(getInitialSortConfig);
  const [datePreset, setDatePreset] = useState<DatePreset>(getInitialDatePreset);
  const [customFrom, setCustomFrom] = useState<string>(getInitialCustomFrom);
  const [customTo, setCustomTo] = useState<string>(getInitialCustomTo);

  // Concrete from/to bounds sent to the API, recomputed whenever the preset
  // or custom inputs change.
  const dateRange = useMemo(
    () => resolveDateRange(datePreset, customFrom, customTo),
    [datePreset, customFrom, customTo],
  );

  // Inline-edit state for the Current Status cell. PHOTON_ADMIN clicks the
  // pencil → row id goes into editingPatentId → cell renders a Select of
  // the 7 PATENT_LEGAL_STATUS enum values. Saving fires the mutation below.
  const [editingPatentId, setEditingPatentId] = useState<string | null>(null);

  // Ref to track if we're updating from URL params to prevent loops
  const isUpdatingFromUrl = React.useRef(false);

  // Sync state changes to URL params
  useEffect(() => {
    // Skip if we're updating from URL params
    if (isUpdatingFromUrl.current) {
      return;
    }
    const newParams = new URLSearchParams(searchParams);
    
    if (searchQuery) {
      newParams.set("search", searchQuery);
    } else {
      newParams.delete("search");
    }
    
    if (filterOption.length > 0) {
      newParams.set("status", filterOption.join(","));
    } else {
      newParams.delete("status");
    }
    
    if (sortOption !== "newest") {
      newParams.set("sort", sortOption);
    } else {
      newParams.delete("sort");
    }
    
    if (currentPage > 1) {
      newParams.set("page", currentPage.toString());
    } else {
      newParams.delete("page");
    }
    
    if (itemsPerPage !== 10) {
      newParams.set("limit", itemsPerPage.toString());
    } else {
      newParams.delete("limit");
    }
    
    if (selectedClientId.length > 0) {
      newParams.set("client", selectedClientId.join(","));
    } else {
      newParams.delete("client");
    }

    if (selectedTags.length > 0) {
      newParams.set("tags", selectedTags.join(","));
    } else {
      newParams.delete("tags");
    }

    if (sortConfig.sortBy !== "application_date" || sortConfig.sortOrder !== "desc") {
      newParams.set("sortBy", sortConfig.sortBy);
      newParams.set("sortOrder", sortConfig.sortOrder);
    } else {
      newParams.delete("sortBy");
      newParams.delete("sortOrder");
    }

    if (datePreset !== "all") {
      newParams.set("date", datePreset);
    } else {
      newParams.delete("date");
    }

    if (datePreset === "custom" && customFrom) {
      newParams.set("date_from", customFrom);
    } else {
      newParams.delete("date_from");
    }

    if (datePreset === "custom" && customTo) {
      newParams.set("date_to", customTo);
    } else {
      newParams.delete("date_to");
    }

    setSearchParams(newParams, { replace: true });
  }, [searchQuery, filterOption, sortOption, currentPage, itemsPerPage, selectedClientId, selectedTags, sortConfig, datePreset, customFrom, customTo, setSearchParams]);

  // Download the current filtered patent list as a CSV. Builds the URL from
  // the same filter state the list query uses, then streams the response as
  // a blob and triggers a save. Backend returns text/csv with Content-
  // Disposition so the filename is set there.
  const portfolioParams = (paged = true) => {
    const params = new URLSearchParams();
    const cid = selectedClientId[0] || (!isOutsideCounselRole(user?.role) ? user?.client_id : "");
    if (cid) params.set("client_id", cid);
    if (searchQuery) params.set("search", searchQuery);
    if (filterOption[0]) params.set("status", backendStatus(filterOption[0]));
    if (jurisdiction) params.set("jurisdiction", jurisdiction);
    if (selectedTags.length) params.set("tags", selectedTags.join(","));
    if (dateRange.from) params.set("date_from", dateRange.from);
    if (dateRange.to) params.set("date_to", dateRange.to);
    params.set("sort", sortConfig.sortBy === "application_date" ? "filing_date" : sortConfig.sortBy);
    params.set("order", sortConfig.sortOrder);
    if (paged) { params.set("page", String(currentPage)); params.set("limit", String(itemsPerPage)); }
    return params;
  };
  const handleExportCsv = async () => {
    try {
      const response = await rawApi.get(
        `/v1/patents/export?${portfolioParams(false)}`,
        { responseType: "blob" },
      );
      const blob = new Blob([response.data], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `patents-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success("CSV exported");
    } catch (err: any) {
      const message =
        err?.response?.data?.message ?? err?.message ?? "Export failed";
      toast.error(message);
    }
  };

  // Re-register the export trigger every time the filter closure changes so
  // the parent's button fires against the latest filters.
  useEffect(() => {
    props.setExportTrigger?.(handleExportCsv);
    return () => {
      props.setExportTrigger?.(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchQuery, filterOption, selectedClientId, selectedTags, sortConfig, dateRange, jurisdiction, props.setExportTrigger]);

  // Sync state from URL params when they change externally (e.g., browser back/forward)
  useEffect(() => {
    isUpdatingFromUrl.current = true;
    
    const urlSearch = searchParams.get("search") || "";
    const urlStatus = searchParams.get("status");
    const urlSort = searchParams.get("sort") || "newest";
    const urlPage = searchParams.get("page");
    const urlLimit = searchParams.get("limit");
    const urlClient = searchParams.get("client");
    const urlTags = searchParams.get("tags");
    const urlSortBy = searchParams.get("sortBy");
    const urlSortOrder = searchParams.get("sortOrder");
    const urlDate = searchParams.get("date");
    const urlDateFrom = searchParams.get("date_from") || "";
    const urlDateTo = searchParams.get("date_to") || "";

    if (urlSearch !== searchQuery) {
      setSearchInput(urlSearch);
      setSearchQuery(urlSearch);
    }
    
    if (urlStatus) {
      const statuses = urlStatus.split(",").filter(Boolean) as FilterOption[];
      if (JSON.stringify(statuses.sort()) !== JSON.stringify(filterOption.sort())) {
        setFilterOption(statuses);
      }
    } else if (filterOption.length > 0 && !props.patentStatus) {
      setFilterOption([]);
    }
    
    if (urlSort !== sortOption && ["newest", "oldest", "titleAZ", "titleZA"].includes(urlSort)) {
      setSortOption(urlSort as SortOption);
    }
    
    if (urlPage) {
      const page = parseInt(urlPage, 10);
      if (page !== currentPage && page > 0) {
        setCurrentPage(page);
      }
    } else if (currentPage !== 1) {
      setCurrentPage(1);
    }
    
    if (urlLimit) {
      const limit = parseInt(urlLimit, 10);
      if (limit !== itemsPerPage && limit > 0) {
        setItemsPerPage(limit);
      }
    } else if (itemsPerPage !== 10) {
      setItemsPerPage(10);
    }
    
    if (urlClient) {
      const clients = urlClient.split(",").filter(Boolean);
      if (JSON.stringify(clients.sort()) !== JSON.stringify(selectedClientId.sort())) {
        setSelectedClientId(clients);
      }
    } else if (selectedClientId.length > 0) {
      setSelectedClientId([]);
    }

    if (urlTags) {
      const tags = urlTags.split(",").filter(Boolean);
      if (JSON.stringify(tags.sort()) !== JSON.stringify(selectedTags.sort())) {
        setSelectedTags(tags);
      }
    } else if (selectedTags.length > 0) {
      setSelectedTags([]);
    }

    if (urlSortBy && urlSortOrder) {
      if (sortConfig.sortBy !== urlSortBy || sortConfig.sortOrder !== urlSortOrder) {
        setSortConfig({ sortBy: urlSortBy, sortOrder: urlSortOrder as "asc" | "desc" });
      }
    } else if (sortConfig.sortBy !== "application_date" || sortConfig.sortOrder !== "desc") {
      setSortConfig({ sortBy: "application_date", sortOrder: "desc" });
    }

    const nextDatePreset = (["last30", "last60", "last90", "custom"].includes(
      urlDate || "",
    )
      ? urlDate
      : "all") as DatePreset;
    if (nextDatePreset !== datePreset) {
      setDatePreset(nextDatePreset);
    }
    if (urlDateFrom !== customFrom) {
      setCustomFrom(urlDateFrom);
    }
    if (urlDateTo !== customTo) {
      setCustomTo(urlDateTo);
    }

    // Reset flag in next tick to allow state updates to complete
    requestAnimationFrame(() => {
      isUpdatingFromUrl.current = false;
    });
  }, [searchParams]); // Only depend on searchParams to avoid loops

  const userId = useMemo(() => readUserIdFromCookie(), []);

  const [columns, setColumns] = useState<Column[]>(() =>
    loadColumnsFromStorage(userId),
  );

  useEffect(() => {
    const key = getColumnVisibilityStorageKey(userId);
    const handleStorage = (e: StorageEvent) => {
      if (e.key !== key) return;
      setColumns(loadColumnsFromStorage(userId));
    };
    window.addEventListener("storage", handleStorage);
    return () => window.removeEventListener("storage", handleStorage);
  }, [userId]);

  const { user } = useUserCookie();
  const { theme } = useTheme();
  const queryClient = useQueryClient();

  const canEditStatus = isOutsideCounselRole(user?.role);

  const { mutate: updatePatentStatus, isPending: isUpdatingStatus } =
    useMutation({
      mutationFn: async ({
        id,
        status,
      }: {
        id: string;
        status: PatentLegalStatus;
      }) => {
        const response = await API_CONFIG.put(
          `/api/v1/patent/update-single/${id}`,
          { status: backendStatus(status) },
        );
        return response?.data;
      },
      onSuccess: () => {
        setEditingPatentId(null);
        queryClient.invalidateQueries({ queryKey: ["patents"] });
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message || "Failed to update status",
        );
      },
    });

  const patentsQueryKey = useMemo(
    () => [
      "patents",
      user?.client_id,
      currentPage,
      itemsPerPage,
      searchQuery,
      filterOption,
      sortConfig,
      selectedClientId,
      selectedTags,
      dateRange,
      jurisdiction,
    ],
    [
      user?.client_id,
      currentPage,
      itemsPerPage,
      searchQuery,
      filterOption,
      sortConfig,
      selectedClientId,
      selectedTags,
      dateRange,
      jurisdiction,
    ],
  );

  const {
    data: patentData,
    isFetching: isFetchingPatents,
    isPending: isPendingPatents,
    isError: isErrorPatents,
    refetch,
  } = useQuery({
    queryKey: patentsQueryKey,
    queryFn: async () => {
      const response = await rawApi.get(`/v1/patents?${portfolioParams()}`);

      if (response.status === 200) {
        props?.setTotalPatents?.(response.data?.pagination?.total ?? 0);
        return response?.data;
      }
    },
    enabled: !!user,
    refetchOnMount: true,
  });

  const {
    data: clientsData,
    isLoading: isLoadingClients,
    isError: isErrorClients,
    error: clientsError,
  } = useQuery({
    queryKey: ["fetch_clients"],
    // The client filter only exists for Photon-side roles; client-side users
    // hold no client:read capability and would just collect a 403.
    enabled: isOutsideCounselRole(user?.role),
    queryFn: async () => {
      try {
        const response = await API_CONFIG.get("/api/v1/clients?limit=500&sort=name&order=asc");
        return response?.data;
      } catch (error) {
        throw error;
      }
    },
  });

  // Distinct tags for the Tags filter dropdown. Shares the cache key with
  // PatentTagsCell so editing a patent's tags refreshes these options too.
  const { data: tagOptionsData } = useQuery({
    queryKey: ["patent-tags", user?.client_id],
    queryFn: async () => {
      const response = await API_CONFIG.get(
        `/api/v1/patent/distinct-tags/client/${user?.client_id}`,
      );
      return (response?.data?.data ?? []) as string[];
    },
    enabled: !!user?.client_id,
    staleTime: 60_000,
  });
  const tagOptions = tagOptionsData ?? [];

  const paginationMeta = patentData?.pagination || {};

  const totalItems = paginationMeta.total || 0;
  const currentPageFromApi = paginationMeta.page || currentPage;
  const startIndex = (currentPageFromApi - 1) * itemsPerPage;

  // Derive the header metric from the exact response rendering this table.
  // This avoids the page header briefly or permanently showing zero while
  // populated rows and pagination are already visible.
  useEffect(() => {
    const resolvedTotal =
      Number(paginationMeta.total) || Number(patentData?.data?.length) || 0;
    props.setTotalPatents?.(resolvedTotal);
  }, [paginationMeta.total, patentData?.data?.length, props.setTotalPatents]);

  const visibleColumns = useMemo(() => {
    return columns.filter((column) => column.visible);
  }, [columns]);

  const toggleColumnVisibility = (columnId: string) => {
    setColumns((prevColumns) => {
      const next = prevColumns.map((column) =>
        column.id === columnId
          ? { ...column, visible: !column.visible }
          : column,
      );
      try {
        const overrides = next.reduce<Record<string, boolean>>((acc, col) => {
          if (!col.sticky) acc[col.id] = col.visible;
          return acc;
        }, {});
        localStorage.setItem(
          getColumnVisibilityStorageKey(userId),
          JSON.stringify(overrides),
        );
      } catch {
        /* empty */
      }
      return next;
    });
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case "Granted":
        return "bg-green-50 text-green-600 min-w-[10px] w-fit text-center truncate";
      case "Pending":
        return "bg-blue-50 text-blue-600 min-w-[10px] w-fit text-center truncate";
      case "Failed":
        return "bg-red-50 text-red-600 min-w-[10px] w-fit text-center truncate";
      default:
        return "bg-gray-50 text-gray-600 min-w-[10px] w-fit text-center truncate";
    }
  };

  const handleSortChange = (value: SortOption) => {
    track("list_sorted", { list: "patents" });
    let newSortConfig: SortConfig;

    switch (value) {
      case "newest":
        newSortConfig = { sortBy: "application_date", sortOrder: "desc" };
        break;
      case "oldest":
        newSortConfig = { sortBy: "application_date", sortOrder: "asc" };
        break;
      case "titleAZ":
        newSortConfig = { sortBy: "title", sortOrder: "asc" };
        break;
      case "titleZA":
        newSortConfig = { sortBy: "title", sortOrder: "desc" };
        break;
      default:
        newSortConfig = { sortBy: "application_date", sortOrder: "desc" };
    }

    setSortConfig(newSortConfig);
    setSortOption(value);
    setCurrentPage(1); // Reset to first page when sort changes
  };

  // Clicking a column header sorts by that DB field. First click on a new
  // column sorts ascending; clicking the already-active column toggles
  // asc/desc. Sorting is applied server-side via sortConfig in the query.
  const handleHeaderSort = (field: string) => {
    track("list_sorted", { list: "patents" });
    setSortConfig((prev) => {
      const sortOrder =
        prev.sortBy === field && prev.sortOrder === "asc" ? "desc" : "asc";
      return { sortBy: field, sortOrder };
    });
    setCurrentPage(1);
  };

  // Reflect the live sortConfig in the preset dropdown. When the user sorts via
  // a column header that doesn't map to one of the 4 presets, no preset shows
  // as selected.
  const activeSortPreset: SortOption | "" =
    sortConfig.sortBy === "application_date"
      ? sortConfig.sortOrder === "desc"
        ? "newest"
        : "oldest"
      : sortConfig.sortBy === "title"
        ? sortConfig.sortOrder === "asc"
          ? "titleAZ"
          : "titleZA"
        : "";

  const renderSortIndicator = (field?: string) => {
    if (!field) return null;
    if (sortConfig.sortBy !== field) {
      return <ArrowUpDown className="w-3 h-3 opacity-40 shrink-0" />;
    }
    return sortConfig.sortOrder === "asc" ? (
      <ArrowUp className="w-3 h-3 shrink-0" />
    ) : (
      <ArrowDown className="w-3 h-3 shrink-0" />
    );
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1); // Reset to first page when search changes
  };

  // Apply a date preset (or switch to custom). Custom keeps whatever from/to
  // the user has already typed; switching away from custom clears them.
  const handleDatePresetChange = (preset: DatePreset) => {
    // The PRESET is an enum. The search box next to it is not wired, on purpose:
    // a patent search query is free text and can name an unfiled invention.
    track("list_filtered", { list: "patents" });
    setDatePreset(preset);
    if (preset !== "custom") {
      setCustomFrom("");
      setCustomTo("");
    }
    setCurrentPage(1);
  };

  const clearDateFilter = () => {
    setDatePreset("all");
    setCustomFrom("");
    setCustomTo("");
    setCurrentPage(1);
  };

  const dateFilterActive = datePreset !== "all";

  const getDateFilterLabel = (): string => dateFilterLabel(datePreset, customFrom, customTo);

  const getSortLabel = (sort: SortOption): string => {
    switch (sort) {
      case "newest":
        return "Newest First";
      case "oldest":
        return "Oldest First";
      case "titleAZ":
        return "Title (A-Z)";
      case "titleZA":
        return "Title (Z-A)";
      default:
        return "Newest First";
    }
  };

  const handleRowClick = (patentId: string) => {
    navigate(`/patents/${patentId}`);
  };

  const handleItemsPerPageChange = async (value: string) => {
    track("list_paginated", { list: "patents" });
    await setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
    refetch();
  };

  const scopeClient = selectedClientId[0] || (!canEditStatus ? user?.client_id : "");
  const stats = useQuery({ queryKey: ["portfolio-stats", user?.id, scopeClient], enabled: !!user, queryFn: async () => (await rawApi.get(`/v1/patents/stats${scopeClient ? `?client_id=${encodeURIComponent(scopeClient)}` : ""}`)).data as { total: number; granted: number; applied: number; examination: number; inactive: number; byJurisdiction: Array<{ jurisdiction: string; count: number }> } });
  const clients: Array<{ id: string; name: string }> = clientsData?.data || [];
  const rows: any[] = patentData?.data || [];
  const optionalIds = ["assigneeOriginal", "currentAssignee", "inventors", "tags", "abstract", "priority", "publication_date"];
  const extraColumns = canEditStatus ? columns.filter(column => optionalIds.includes(column.id) && column.visible) : [];
  const emptyPortfolio = !isPendingPatents && !isErrorPatents && stats.data?.total === 0;
  const hasFilters = !!(searchQuery || filterOption.length || jurisdiction || selectedTags.length || dateFilterActive);
  const setJurisdiction = (value: string) => { const next = new URLSearchParams(searchParams); if (value) next.set("jurisdiction", value); else next.delete("jurisdiction"); next.delete("page"); setCurrentPage(1); setSearchParams(next, { replace: true }); };
  const clearFilters = () => { setSearchQuery(""); setSearchInput(""); setFilterOption([]); setSelectedTags([]); clearDateFilter(); setJurisdiction(""); };
  const fieldValue = (column: string, patent: any) => {
    if (column === "tags") return <PatentTagsCell patentId={patent.id} tags={patent.tags || []} patentsQueryKey={patentsQueryKey} />;
    const value = column === "assigneeOriginal" ? patent.assignee_original : column === "currentAssignee" ? patent.current_assignee : column === "inventors" ? patent.inventors?.join(", ") : column === "abstract" ? patent.abstract : column === "priority" ? patent.priority_details : dateText(patent.publication_date || patent.issue_date);
    return typeof value === "string" && value.trim() ? value : "Not recorded";
  };
  const controlClass = "h-9 min-w-0 rounded-sm border border-pl-border bg-pl-bg px-3 text-sm text-pl-text-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pulse-focus)]";
  return <div data-patent-portfolio className="min-h-0 min-w-0 flex-1 overflow-y-auto bg-pl-bg p-4 font-sans text-pl-ink md:p-6">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-pl-border pb-4">
      <p className="text-sm text-pl-text-2">{canEditStatus ? scopeClient ? clients.find(client => client.id === scopeClient)?.name || "Selected client" : user?.role === "CASE_OWNER" ? "Assigned-client portfolio" : "All client portfolios" : "Company portfolio"}{stats.data && <span className="ml-2 text-pl-text-3">· {stats.data.total.toLocaleString()} patents</span>}</p>
      {canEditStatus && !emptyPortfolio && <Button size="sm" variant="outline" onClick={() => setImportOpen(true)}>Import patents</Button>}
    </div>
    {(!emptyPortfolio || canEditStatus) && <>
      <form onSubmit={event => { event.preventDefault(); handleSearchChange(searchInput.trim()); }} className="mt-4 flex items-center gap-2 [&>div]:min-w-0 [&>div]:flex-1" role="search">
        <label htmlFor="patent-search" className="sr-only">Title or application number</label><Input id="patent-search" value={searchInput} onChange={event => setSearchInput(event.target.value)} placeholder="Title or application number" className="h-9 min-w-0 flex-1" />
        <Button type="submit" size="sm" variant={isErrorPatents || emptyPortfolio ? "outline" : "default"} className={isErrorPatents || emptyPortfolio ? "" : "bg-pl-brand text-pl-ink hover:bg-pl-brand-deep"}>Search patents</Button>
        <Button type="button" size="sm" variant="outline" className="md:hidden" aria-expanded={filtersOpen} onClick={() => setFiltersOpen(open => !open)}>Filters</Button>
      </form>
      <div className={`${filtersOpen ? "flex" : "hidden"} mt-3 flex-wrap items-center gap-2 md:flex`}>
        {canEditStatus && <select aria-label="Portfolio client" value={selectedClientId[0] || ""} onChange={event => { setSelectedClientId(event.target.value ? [event.target.value] : []); setCurrentPage(1); }} className={controlClass}><option value="">{user?.role === "CASE_OWNER" ? "All assigned clients" : "All clients"}</option>{clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select>}
        <select aria-label="Patent status" value={filterOption[0] || ""} onChange={event => { setFilterOption(event.target.value ? [event.target.value as FilterOption] : []); setCurrentPage(1); }} className={controlClass}><option value="">All statuses</option>{PATENT_LEGAL_STATUS_VALUES.map(status => <option key={status} value={status}>{PATENT_LEGAL_STATUS_META[status].label}</option>)}</select>
        <select aria-label="Jurisdiction" value={jurisdiction} onChange={event => setJurisdiction(event.target.value)} className={controlClass}><option value="">All jurisdictions{stats.data ? ` · ${stats.data.byJurisdiction.length}` : ""}</option>{stats.data?.byJurisdiction.map(item => <option key={item.jurisdiction} value={item.jurisdiction}>{jurisdictionName(item.jurisdiction)} · {item.count.toLocaleString()}</option>)}</select>
        <select aria-label="Sort patents" value={activeSortPreset || "newest"} onChange={event => handleSortChange(event.target.value as SortOption)} className={controlClass}><option value="newest">Newest filing first</option><option value="oldest">Oldest filing first</option><option value="titleAZ">Title A–Z</option><option value="titleZA">Title Z–A</option></select>
        <DateRangeFilter preset={datePreset} from={customFrom} to={customTo} onPresetChange={handleDatePresetChange} onFromChange={setCustomFrom} onToChange={setCustomTo} onClear={clearDateFilter} title="Filing date" label="Filed" />
        {tagOptions.length > 0 && <select aria-label="Patent tag" value={selectedTags[0] || ""} onChange={event => { setSelectedTags(event.target.value ? [event.target.value] : []); setCurrentPage(1); }} className={controlClass}><option value="">All tags</option>{tagOptions.map(tag => <option key={tag} value={tag}>{tag}</option>)}</select>}
        {canEditStatus && <Popover><PopoverTrigger asChild><Button size="sm" variant="outline"><Columns3 aria-hidden="true" />Columns</Button></PopoverTrigger><PopoverContent align="end" className="bg-pl-bg text-pl-ink"><p className="mb-3 text-sm font-semibold">Optional record fields</p><div className="space-y-3">{columns.filter(column => optionalIds.includes(column.id)).map(column => <label key={column.id} className="flex items-center gap-2 text-sm"><Checkbox checked={column.visible} onCheckedChange={() => toggleColumnVisibility(column.id)} />{column.label}</label>)}</div></PopoverContent></Popover>}
        {hasFilters && <Button size="sm" variant="ghost" onClick={clearFilters}>Clear filters</Button>}
      </div>
      {stats.isError && <p className="mt-3 text-sm text-pl-text-2">Jurisdiction totals could not be loaded. <button type="button" onClick={() => stats.refetch()} className="underline">Retry totals</button></p>}
      {isErrorClients && canEditStatus && <p role="alert" className="mt-3 text-sm">Client scopes could not be loaded.</p>}
    </>}
    {isPendingPatents ? <div role="status" className="space-y-4 py-8"><p className="text-sm text-pl-text-2">Loading patents…</p>{[1,2,3].map(row => <div key={row} aria-hidden="true" className="h-16 rounded-sm bg-pl-bg-muted" />)}</div>
      : isErrorPatents ? <div role="alert" className="py-12 text-center"><h2 className="text-lg font-semibold">Patents could not be loaded</h2><p className="mt-2 text-sm text-pl-text-2">Your filters are retained.</p><Button size="sm" className="mt-4 bg-pl-brand text-pl-ink hover:bg-pl-brand-deep" onClick={() => refetch()}>Reload patents</Button></div>
      : emptyPortfolio ? <div className="py-12 text-center"><h2 className="text-lg font-semibold">No patents have been added</h2><p className="mx-auto mt-2 max-w-xl text-sm text-pl-text-2">{canEditStatus ? "Import a portfolio file for this client to make its patent records available." : "Photon Legal will add the company’s patent records here."}</p>{canEditStatus && <Button size="sm" className="mt-4 bg-pl-brand text-pl-ink hover:bg-pl-brand-deep" onClick={() => setImportOpen(true)}>Import patents</Button>}</div>
      : rows.length === 0 ? <div className="py-12 text-center"><h2 className="text-lg font-semibold">No patents match these filters</h2><p className="mt-2 text-sm text-pl-text-2">Try another title, application number or jurisdiction.</p><Button size="sm" variant="outline" className="mt-4" onClick={clearFilters}>Clear filters</Button></div>
      : <>
        <div className="mt-4 flex items-center justify-between gap-2 text-sm text-pl-text-2"><p aria-live="polite">{hasFilters ? `${totalItems.toLocaleString()} matching patents` : "Patent records"}{isFetchingPatents ? " · Refreshing…" : ""}</p><label className="flex items-center gap-2">Rows <select aria-label="Rows per page" value={itemsPerPage} onChange={event => handleItemsPerPageChange(event.target.value)} className={controlClass}>{[10,20,50].map(count => <option key={count} value={count}>{count}</option>)}</select></label></div>
        <table className="mt-3 w-full table-fixed border-collapse text-left text-sm"><caption className="sr-only">Patent records in the selected portfolio</caption><colgroup className="hidden md:table-column-group"><col className="w-1/2"/><col className="w-1/6"/><col className="w-1/6"/><col className="w-1/6"/></colgroup><thead className="hidden border-y border-pl-border text-pl-text-3 md:table-header-group"><tr><th scope="col" className="py-2 pr-4 font-medium">Application / title</th><th scope="col" className="py-2 pr-3 font-medium">Status</th><th scope="col" className="py-2 pr-3 font-medium">Jurisdiction</th><th scope="col" className="py-2 font-medium">Filed</th></tr></thead><tbody>{rows.map(patent => { const status = legalStatus(patent.status || patent.legal_current_status), label = PATENT_LEGAL_STATUS_META[status]?.label?.replace(/^(Active|Inactive) – /, "") || "Not recorded"; const due = patent.due_dates?.[0]; return <React.Fragment key={patent.id}><tr className="block border-b border-pl-border py-4 md:table-row md:py-0"><td className="block break-words py-2 pr-4 align-top md:table-cell md:py-4"><p className="mb-1 font-mono text-xs text-pl-text-3">{patent.application_number || patent.prn || "Application number not recorded"}</p><Link to={`/patents/${patent.id}${searchParams.toString() ? `?${searchParams.toString()}` : ""}`} className="font-semibold text-pl-navy hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--pulse-focus)]">{patent.title || "Untitled patent"}</Link>{canEditStatus && <p className="mt-1 text-xs text-pl-text-2">{patent.client?.name || "Client not recorded"}</p>}</td><td className="inline-block py-2 pr-3 align-top md:table-cell md:py-4">{editingPatentId === patent.id ? <select autoFocus aria-label={`Status for ${patent.application_number}`} value={status} disabled={isUpdatingStatus} onChange={event => updatePatentStatus({ id: patent.id, status: event.target.value as PatentLegalStatus })} className={`${controlClass} w-full`}>{PATENT_LEGAL_STATUS_VALUES.map(key => <option key={key} value={key}>{PATENT_LEGAL_STATUS_META[key].label}</option>)}</select> : <div className="flex flex-wrap items-center gap-1"><ProductChip tone={status === "ACTIVE_GRANTED" ? "success" : status === "ACTIVE_EXAMINATION" ? "info" : "neutral"}>{label}</ProductChip>{canEditStatus && <button type="button" aria-label={`Edit status for ${patent.application_number || "patent"}`} onClick={() => setEditingPatentId(patent.id)} className="rounded-sm p-1 text-pl-text-3 hover:text-pl-ink"><Pencil aria-hidden="true" className="h-3 w-3"/></button>}</div>}</td><td className="inline-block py-2 pr-3 align-top text-pl-text-2 md:table-cell md:py-4">{jurisdictionName(patent.jurisdiction || patent.publication_country)}</td><td className="block py-2 align-top text-pl-text-2 md:table-cell md:py-4"><span className="mr-1 md:hidden">Filed</span>{dateText(patent.filing_date || patent.application_date)}{user?.role !== "INVENTOR" && due && <p className="mt-1 text-xs text-pl-text-2">Next date · {dateText(due.due_at)}</p>}</td></tr>{extraColumns.length > 0 && <tr className="block border-b border-pl-border md:table-row"><td colSpan={4} className="block py-3 md:table-cell"><dl className="grid gap-4 md:grid-cols-2">{extraColumns.map(column => <div key={column.id} className="min-w-0 text-sm"><dt className="text-xs font-medium text-pl-text-3">{column.label}</dt><dd className="mt-1 break-words text-pl-text-2">{column.id === "abstract" || column.id === "priority" ? <details><summary className="cursor-pointer">Show {column.label.toLowerCase()}</summary><p className="mt-2">{fieldValue(column.id,patent)}</p></details> : fieldValue(column.id,patent)}</dd></div>)}</dl></td></tr>}</React.Fragment>; })}</tbody></table>
        <nav aria-label="Patent pages" className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-pl-border py-3"><p className="text-sm text-pl-text-2">{startIndex + 1}–{Math.min(startIndex + rows.length,totalItems)} of {totalItems.toLocaleString()}</p><div className="flex items-center gap-2"><Button size="sm" variant="outline" disabled={currentPage <= 1 || isFetchingPatents} onClick={() => setCurrentPage(page => page-1)}>Previous</Button><span className="text-sm">Page {currentPage} of {paginationMeta.totalPages || 1}</span><Button size="sm" variant="outline" disabled={currentPage >= (paginationMeta.totalPages || 1) || isFetchingPatents} onClick={() => setCurrentPage(page => page+1)}>Next</Button></div></nav>
      </>}
    {canEditStatus && <PortfolioImport open={importOpen} onOpenChange={setImportOpen} clients={clients} selectedClientId={selectedClientId[0]} onImported={() => { queryClient.invalidateQueries({ queryKey: ["patents"] }); queryClient.invalidateQueries({ queryKey: ["portfolio-stats"] }); }} />}
  </div>;
};

export default PatentsContent;
