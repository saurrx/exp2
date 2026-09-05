import React, { useState, useEffect } from "react";
import { track, useTrackOnce } from "@/lib/analytics";
import {
  Plus,
  Calendar,
  File,
  Search,
  Filter,
  SortAsc,
  SortDesc,
  Trash2,
  LayoutGrid,
  Table as TableIcon,
  Clock,
  Building2,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  FileText,
  ArrowUpDown,
  ChevronDown,
  LayoutGridIcon,
} from "lucide-react";
import { useNavigate, useSearchParams } from "react-router-dom";
import ClientBook from "@/components/clients/ClientBook";
import { ActionsNavigation, actionPrimary } from "@/components/actions/ActionsWorkspace";
import BlockedRedirect from "@/lib/BlockedRedirect";
import { isOutsideCounselRole } from "@/lib/roleAccess";
import { MainClass, PageHeader } from "@/components/DashboardChrome";
import { Button } from "@/components/ui/button";
import OnboardClientModal from "@/components/clients/OnboardClientModal";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useFormik } from "formik";
import * as Yup from "yup";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import Loader from "@/components/Loader";
import API_CONFIG, { assetUrl } from "@/lib/apiConfig";
import moment from "moment";
import DuplicatePatentsModal from "@/components/clients/DuplicatePatentsModal";
import ClientLogo from "@/components/clients/ClientLogo";
import { useTheme } from "@/hooks/useTheme";
import useUserCookie from "@/hooks/use-auth";

type SortField = "name" | "type" | "patents" | "updatedAt";
type SortDirection = "asc" | "desc";
type ViewType = "card" | "table";

type ClientType = "EXISTING" | "POTENTIAL" | "";

const clientOnboardSchema = Yup.object().shape({
  name: Yup.string().required("Name is required"),
  type: Yup.string().required("Type is required"),
  logo: Yup.mixed().optional(),
  admin_users: Yup.array().optional(),
  allowed_domain: Yup.string().optional(),
  patent_file: Yup.mixed().optional(),
});

export interface iClientOnboardForm {
  name: string;
  type?: ClientType;
  logo?: any;
  allowed_domain: string;
  admin_users: string[];
  patent_file?: any;
}

const clientOnboardInitialValues: iClientOnboardForm = {
  name: "",
  type: "EXISTING",
  logo: "",
  allowed_domain: "",
  admin_users: [""],
  patent_file: "",
};

export interface iClientOnboardModal {
  open: boolean;
  data: iClientOnboardForm;
}

const initialValuesClientOnboardModal: iClientOnboardModal = {
  open: false,
  data: clientOnboardInitialValues,
};

const getTypeBadgeVariant = (type: string) => {
  const upperType = type?.toUpperCase();
  switch (upperType) {
    case "POTENTIAL":
      return "default";
    case "EXISTING":
      return "outline";
    default:
      return "outline";
  }
};

const ClientsPage: React.FC = () => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useUserCookie();
  const isCaseOwner = user?.role === "CASE_OWNER";
  // Keep the existing analytics call; the V0 mock supplies assignment-scoped client records.
  useTrackOnce("client_book_viewed", { scope: "all" },
    !!user && isOutsideCounselRole(user.role));
  const [isOnboardModalOpen, setIsOnboardModalOpen] =
    useState<iClientOnboardModal>(initialValuesClientOnboardModal);
  const [searchQuery, setSearchQuery] = useState(searchParams.get("q") || "");
  const [debouncedSearchQuery, setDebouncedSearchQuery] = useState(searchParams.get("q") || "");
  const [clientTypeFilter, setClientTypeFilter] = useState<ClientType>("");
  const [sortField, setSortField] = useState<SortField>("name");
  const [sortDirection, setSortDirection] = useState<SortDirection>("asc");
  const [viewType, setViewType] = useState<ViewType>("card");
  const [currentPage, setCurrentPage] = useState(Math.max(1, Number(searchParams.get("page")) || 1));
  const [isDuplicatePatentsModalOpen, setIsDuplicatePatentsModalOpen] =
    useState(false);
  const [duplicatePatents, setDuplicatePatents] = useState<any[]>([]);
  const [excelDuplicateEntries, setExcelDuplicateEntries] = useState<any[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [clientToDelete, setClientToDelete] = useState<number | null>(null);
  const [itemsPerPage, setItemsPerPage] = useState<number>(10);

  const queryClient = useQueryClient();

  const {
    mutate,
    isPending,
    data: addClientData,
  } = useMutation({
    mutationKey: ["add_client"],
    mutationFn: async (data: any) => {
      try {
        const response = await API_CONFIG.post("/api/v1/clients", data);

        if (response?.status === 201) {
          // call get all clients query to refresh the list
          setIsOnboardModalOpen(initialValuesClientOnboardModal);
          formik.resetForm();
        }
        return response?.data;
      } catch (error) {
        formik.setStatus(error?.response?.data?.message || "Client could not be created. Your name is preserved; try again.");
        console.error("Error adding client", error);
        toast.error(error?.response?.data?.message || "Error adding client");
      }
    },
    onSuccess: (data: any) => {
      queryClient.invalidateQueries({
        queryKey: ["fetch_clients"],
      });

      if (data?.data?.patentFile?.data) {
        const patentData = data.data.patentFile.data;
        setDuplicatePatents(patentData.duplicate_patents || []);
        setExcelDuplicateEntries(patentData.excel_duplicate_entries || []);
        setErrorCount(patentData.error_count || 0);
        setSuccessCount(patentData.success_count || 0);
        setIsDuplicatePatentsModalOpen(true);

        if (patentData.duplicate_entry_count > 0) {
          toast.warning(
            `Client added successfully but ${patentData.duplicate_entry_count} patents were found to be duplicate entries.`
            
          );
        }
      }
    },
  });

  const { mutate: deleteClient, isPending: isDeleting } = useMutation({
    mutationKey: ["delete_client"],
    mutationFn: async (clientId: number) => {
      try {
        const response = await API_CONFIG.delete(
          `/api/v1/clients/remove/${clientId}`,
        );

        if (response?.status === 200 || response?.status === 204) {
          setClientToDelete(null);
        }
        return response?.data;
      } catch (error) {
        console.error("Error deleting client", error);
        toast.error(error?.response?.data?.message || "Error deleting client");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["fetch_clients"],
      });
    },
  });

  const formik = useFormik({
    validationSchema: clientOnboardSchema,
    initialValues: isOnboardModalOpen.data,
    enableReinitialize: true,
    onSubmit: async (values: iClientOnboardForm) => {
      formik.setStatus(undefined);
      const payload: any = {
        name: values.name,
        type: values.type,
        allowed_domain: values.allowed_domain,
        admin_users: values.admin_users,
        plan: "FREE",
      };
      if (values.logo) {
        payload.logo = values.logo?.id;
      }
      // If patent file attached, upload to S3 first
      if (values.patent_file) {
        try {
          const { s3UploadForImport } = await import("@/lib/api-service/s3Upload");
          const uploaded = await s3UploadForImport(values.patent_file, "patent");
          payload.patent_file_key = uploaded.key;
          payload.patent_file_name = uploaded.originalName;
          payload.patent_file_size = uploaded.size;
          payload.patent_file_type = uploaded.contentType;
        } catch (err) {
          toast.error("Failed to upload patent file");
          return;
        }
      }
      mutate(payload, { onSuccess: (result: any) => { if (result?.data?.id) navigate(`/clients/${result.data.id}?tab=overview`); } });
    },
  });

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      if (searchQuery !== debouncedSearchQuery) setCurrentPage(1);
      setDebouncedSearchQuery(searchQuery);
      // // Reset to first page when search changes
    }, 500);

    return () => clearTimeout(timer);
  }, [searchQuery]);



  const { data, isLoading, isError, error, refetch } = useQuery({
    queryKey: [
      "fetch_clients",
      itemsPerPage,
      currentPage,
      debouncedSearchQuery,
      clientTypeFilter,
      sortField,
      sortDirection,
      user?.role,
    ],
    queryFn: async () => {
      try {
        const params = new URLSearchParams();
        params.append("page", currentPage.toString());
        // itemsPerPage was in the query key and in the row numbering but never
        // actually sent, so the API fell back to its 500 cap and returned all
        // 82 workspaces — 79 logo streams on one page load, and the S.No column
        // numbered from a page size the server had never heard of.
        params.append("limit", itemsPerPage.toString());

        if (debouncedSearchQuery) {
          params.append("search", debouncedSearchQuery);
        }

        if (clientTypeFilter) {
          params.append("client_type", clientTypeFilter);
        }

        if (sortField) {
          params.append("sort", sortField);
          params.append("order", sortDirection);
        }

        const response = await API_CONFIG.get(
          `/api/v1/clients?${params.toString()}`,
        );
        return response?.data;
      } catch (error) {
        console.error("Error getting clients", error);
        throw error;
      }
    },
  });

  // Extract data from API response
  // API response structure: { message, data: [...], pagination: { page, totalPages, total, limit } }
  const clientsData: any[] = Array.isArray(data?.data) ? data.data : [];
  const paginationMeta = data?.pagination || {};

  const totalItems = paginationMeta.total || 0;
  const totalPages = paginationMeta.totalPages || 1;
  const currentPageFromApi = paginationMeta.page || currentPage;
  const startIndex = (currentPageFromApi - 1) * itemsPerPage;

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1); // Reset to first page when changing items per page
  };

  const toggleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  const handleClientClick = (clientId: string) => {
    navigate(`/clients/${clientId}?tab=overview&back=${encodeURIComponent(`/clients?${searchParams.toString()}`)}`);
  };

  const handleDeleteClick = (e: React.MouseEvent, clientId: number) => {
    e.stopPropagation(); // Prevent card click navigation
    setClientToDelete(clientId);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = () => {
    if (clientToDelete) {
      deleteClient(clientToDelete);
      setIsDeleteConfirmOpen(false);
    }
  };

  const openCreate = () => { track("client_onboard_opened"); setIsOnboardModalOpen(prev=>({...prev,open:true})); };
  if (user && !isOutsideCounselRole(user.role)) return <BlockedRedirect from="/clients" to="/" />;
  return <>
    <PageHeader title="Clients" actions={<div className="flex items-center gap-3">{!isCaseOwner && clientsData.length>0 && <Button size="sm" variant="outline" onClick={openCreate}>Create client</Button>}<ActionsNavigation /></div>}/>
    <ClientBook clients={clientsData} loading={isLoading} error={isError} search={searchQuery} onSearch={setSearchQuery} openClient={handleClientClick} createClient={openCreate} isCaseOwner={isCaseOwner} page={currentPageFromApi} totalPages={totalPages} total={totalItems} onPage={page=>{setCurrentPage(page);const next=new URLSearchParams(searchParams);next.set("page",String(page));setSearchParams(next,{replace:true});}} retry={()=>refetch()}/>
    <OnboardClientModal formik={formik} open={isOnboardModalOpen.open} isSubmitting={isPending} onOpenChange={()=>{setIsOnboardModalOpen(initialValuesClientOnboardModal);formik.resetForm();}}/>
    <DuplicatePatentsModal open={isDuplicatePatentsModalOpen} onOpenChange={setIsDuplicatePatentsModalOpen} duplicatePatents={duplicatePatents} excelDuplicateEntries={excelDuplicateEntries} errorCount={errorCount} successCount={successCount}/>
  </>;
};
export default ClientsPage;
