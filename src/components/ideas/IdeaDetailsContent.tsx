import { PageHeader } from "@/components/DashboardChrome";
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
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import useUserCookie from "@/hooks/use-auth";
import API_CONFIG, { assetUrl, rawApi } from "@/lib/apiConfig";
import appConfig from "@/lib/appConfig";
import ideaDraftQuestions from "@/lib/IdeaDraftQuestion";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import axios from "axios";
import {
  ChevronDown,
  Check,
  CheckCircle,
  Copy,
  Download,
  Eye,
  File,
  FileEdit,
  FileLineChart,
  Lightbulb,
  Pencil,
  Send,
  UserPlus,
  X,
  Circle,
  Info,
  Clock,
  CircleCheck,
  FileTextIcon,
  Calendar,
  Plus,
  Users,
  Trash2,
  RefreshCcw,
  Upload,
  FileText,
  User,
  MessageSquare,
  TriangleAlert,
  MoreHorizontal,
} from "lucide-react";
import moment from "moment";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import ReactSelect from "react-select/creatable";
import { toast } from "@/lib/toast";
import Loader from "../Loader";
import { Textarea } from "../ui/textarea";
import ConciseEvaluationReport from "./DownloadReport";
import FileIdeaModal from "./FileIdeaModal";
import RequestUpdate from "./RequestUpdate";
import PatentNoveltyReport from "./ShowScoreReport";
import ViewRequestUpdate from "./ViewRequestUpdate";
import { Section } from "./draftSections";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { FileUp, PlusCircle, ArrowRight, LoaderCircle } from "lucide-react";
import EmptyDraftsView from "./EmptyDraftsView";
import PatentPaperView from "./PatentPaperView";
import StatusChip from "@/components/ui/StatusChip";
import StatusTimeline from "./StatusTimeline";
import { isOutsideCounselRole } from "@/lib/roleAccess";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import OCDraftView from "./OCDraftView";
import DraftListView from "./DraftListView";
import { useTheme } from "@/hooks/useTheme";
import { motion } from "framer-motion";
import { SendToOCModal } from "./SendToOCModal";
import { RejectIdeaModal } from "./RejectIdeaModal";
import { cn } from "@/lib/utils";
import { MAX_FILE_SIZE } from "@/utils/constants";

interface Inventor {
  id: string;
  name: string;
  employeeId: string;
  country: string;
  phone: string;
  email: string;
  address: string;
  isPrimary: boolean;
}

interface AnalysisStep {
  id: string;
  label: string;
  status: "pending" | "active" | "completed";
}

interface IdeaDetailsContentProps {
  ideaId?: string;
}

type OCWorkflowStatus =
  | "UNDER_REVIEW"
  | "PRIOR_ART_SEARCH"
  | "DRAFTING_INITIATED"
  | "FILED";

const OC_WORKFLOW_OPTIONS: Array<{
  value: OCWorkflowStatus;
  label: string;
}> = [
  { value: "UNDER_REVIEW", label: "Under Review" },
  { value: "PRIOR_ART_SEARCH", label: "Prior Art Search" },
  { value: "DRAFTING_INITIATED", label: "Drafting Initiated" },
  { value: "FILED", label: "Filed" },
];

const IdeaDetailsContent: React.FC<IdeaDetailsContentProps> = ({
  ideaId,
}): JSX.Element => {
  const { theme } = useTheme();
  const navigate = useNavigate();
  const [selectedDraftId, setSelectedDraftId] = useState<string | null>(null);
  const [openInventors, setOpenInventors] = useState<Record<string, boolean>>(
    {},
  );
  const [isScoreLoading, setIsScoreLoading] = useState(false);
  const [submittedDraftId, setSubmittedDraftId] = useState<string | null>(null);
  const [openEvaluatePopup, setOpenEvaluatePopup] = useState(false);
  const [patentInput, setPatentInput] = useState("");

  const [inventors, setInventors] = useState<any[]>([]);
  const [showRequestUpdateModal, setShowRequestUpdateModal] = useState(false);
  const [showViewContentsModal, setShowViewContentsModal] = useState(false);
  const [showPatentReportModal, setShowPatentReportModal] = useState(false);
  const [showFileIdeaModal, setShowFileIdeaModal] = useState(false);
  const [selectedDraftForReport, setSelectedDraftForReport] = useState<
    string | null
  >(null);
  const [sections, setSections] = useState<Section[]>([]);
  const [draftReport, setDraftReport] = useState<any>(null);
  const [draftApiEvaluationId, setDraftApiEvaluationId] = useState<
    string | null
  >(null);

  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [title, setTitle] = useState<string>("");
  const [summary, setSummary] = useState<string>("");
  const [isCalculatingScore, setIsCalculatingScore] = useState(false);
  const [scoreVisible, setScoreVisible] = useState(false);
  const [ideaScore, setIdeaScore] = useState<number | null>(null);
  const [scoreCalculationError, setScoreCalculationError] = useState<any>("");
  const [scoreDialogOpen, setScoreDialogOpen] = useState(false);
  const [runningInBackground, setRunningInBackground] = useState(false);
  const [isDisableScoreTransition, setIsDisableScoreTransition] =
    useState<boolean>(false);
  const [extraInventors, setExtraInventors] = useState<
    { id: string; name: string; email: string }[]
  >([]);
  const [deletedInventorIds, setDeletedInventorIds] = useState<string[]>([]);
  const [originalInventorIds, setOriginalInventorIds] = useState<string[]>([]);
  const [openSendToOCModal, setOpenSendToOCModal] = useState<boolean>(false);
  const [openRejectIdeaModal, setOpenRejectIdeaModal] =
    useState<boolean>(false);
  const [reason, setReason] = useState("");
  const [instructions, setInstructions] = useState("");

  const [isScoreCalculateError, setIsScoreCalculateError] =
    useState<boolean>(false);
  const [analysisSteps, setAnalysisSteps] = useState<AnalysisStep[]>([
    {
      id: "prior-art",
      label: "Retrieving prior art",
      status: "pending",
    },
    {
      id: "similarities",
      label: "Analyzing similarities",
      status: "pending",
    },
    {
      id: "novelty",
      label: "Calculating novelty score",
      status: "pending",
    },
    {
      id: "report",
      label: "Generating report",
      status: "pending",
    },
  ]);
  const [enableScorePolling, setEnableScorePolling] = useState<boolean>(false);

  const queryClient = useQueryClient();

  const { user } = useUserCookie();

  const [deletingFileId, setDeletingFileId] = useState<string | null>(null);

  const [reEvalOpen, setReEvalOpen] = React.useState(false);

  const [inventorIdeas, setInventorIdeas] = useState<any[]>([]);

  const isUpdatingDraftRef = useRef(false);

  const handleEdit = () => {
    setIsEditing(true);
    setTitle(mainIdeaData?.title || "");
    setSummary(
      mainIdeaData?.about ||
      "This is a newly submitted idea. Add more details by creating and editing drafts below.",
    );
    // Store original inventor IDs to track deletions
    const originalIds =
      mainIdeaData?.IdeaInventor?.map((idea: any) => idea.id) || [];
    setOriginalInventorIds(originalIds);
    setDeletedInventorIds([]);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setExtraInventors([]);
    setDeletedInventorIds([]);
    setOriginalInventorIds([]);
    setTitle(mainIdeaData?.title || "");
    setSummary(
      mainIdeaData?.about ||
      "This is a newly submitted idea. Add more details by creating and editing drafts below.",
    );
  };

  const { data: mainIdeaData, isPending: isFetchingIdea, refetch: reloadIdea } = useQuery({
    queryKey: ["ideaDetails", ideaId],
    queryFn: async () => {
      try {
        const response = await API_CONFIG.get(`/api/v1/idea/fetch/${ideaId}`);

        if (response.status === 200) {
          return response?.data?.data;
        }
      } catch (error) {
        console.error("Error fetching idea details:", error);
      }
    },
    enabled: !!ideaId, // Only run query when ideaId is available
    refetchOnMount: true, // Refetch when navigating back to this page
    refetchOnWindowFocus: false, // Don't refetch on window focus
    staleTime: 0, // Always consider data stale to ensure fresh fetch on navigation
  });

  const { mutate: updateOCWorkflowStatus, isPending: isUpdatingOCStatus } =
    useMutation({
      mutationFn: async (status: Exclude<OCWorkflowStatus, "FILED">) => {
        const response = await API_CONFIG.put(
          `/api/v1/idea/${ideaId}/oc-workflow-status`,
          { status },
        );
        return response?.data?.data;
      },
      onSuccess: (idea) => {
        queryClient.setQueryData(["ideaDetails", ideaId], idea);
        queryClient.invalidateQueries({ queryKey: ["fetch_ideas"] });
      },
      onError: (error: any) => {
        toast.error(
          error?.response?.data?.message || "Unable to update status",
        );
      },
    });

  // Initialize title and summary when mainIdeaData loads
  useEffect(() => {
    if (mainIdeaData && !isEditing) {
      setTitle(mainIdeaData?.title || "");
      setSummary(
        mainIdeaData?.summary ||
        "This is a newly submitted idea. Add more details by creating and editing drafts below.",
      );
    }
  }, [mainIdeaData, isEditing]);

  const { mutate: removeInventorMutation, isPending: isRemovingInventor } =
    useMutation({
      mutationKey: ["removeInventor"],
      mutationFn: async (idea_inventor_id: string) => {
        try {
          const response = await API_CONFIG.delete(
            `/api/v1/idea/remove/inventor/${idea_inventor_id}`,
          );

          if (response?.status === 200) {
            return response?.data?.data;
          }
        } catch (error) {
          console.error("Error removing inventor:", error);
          toast.error(
            error?.response?.data?.message || "Error removing inventor", { position: "top-center" }
          );
        }
      },
      onSuccess: () => {
        if (dialogRef.current) {
          dialogRef.current.click();
        }
        queryClient.invalidateQueries({
          queryKey: ["ideaDetails", ideaId],
        });
      },
    });

  const { mutate: addNewInventor, isPending } = useMutation({
    mutationKey: ["add_new_inventor"],
    mutationFn: async (invite_payload: {

      email: string;
      role: string;
    }) => {
      try {
        const response = await API_CONFIG.post(
          "/api/v1/auth/ihc/invite-user",
          invite_payload,
        );

        if (response?.status === 200) {
          setInventors((prev) => [
            ...prev,
            {
              id: response?.data?.data?.id,

              email: invite_payload?.email,
            },
          ]);
        }
      } catch (error) {
        console.error("Error inviting user:", error);
        toast.error(error?.response?.data?.message || "Error inviting user", { position: "top-center" });
      }
    },
  });

  const {
    isLoading: isFechingIdeaDraft,
    data: ideaDraft,
    refetch: refetchIdeaDraft,
  } = useQuery({
    queryKey: ["idea_draft", ideaId],
    queryFn: async () => {
      try {
        const response = await API_CONFIG.get(
          `/api/v1/idea/fetch-drafts/${ideaId}`,
        );

        setInventorIdeas(response?.data?.data);

        return response?.data?.data;
      } catch (error) {
        console.error("Error fetching idea drafts:", error);
        toast.error(
          error?.response?.data?.message || "Error fetching idea drafts", { position: "top-center" }
        );
      }
    },
    enabled: !!ideaId, // Only run query when ideaId is available
    refetchOnMount: true, // Refetch when navigating back to this page
    refetchOnWindowFocus: true, // Refetch on window focus
    staleTime: 0, // Always consider data stale to ensure fresh fetch on navigation
  });

  const dialogRef = useRef<HTMLButtonElement>(null);

  useQuery({
    queryKey: ["fetch_inventors", user?.client_id],
    // The roster feeds the co-inventor picker — an inventor affordance.
    // Photon-side roles lack the capability and would only collect a 403.
    enabled: user?.role === "INVENTOR" && !!user?.client_id,
    queryFn: async () => {
      try {
        const response = await API_CONFIG.get(
          `/api/v1/clients/fetch-all-inventors/${user?.client_id}`,
        );

        if (response.status === 200) {
          const data = response?.data?.data;

          const formattedData = data.map((inventor: any) => ({
            id: inventor?.id,
            name: inventor?.email,
          }));

          setInventors(formattedData);
        }
      } catch (error) {
        // Handle error
        console.error("Error fetching inventors:", error);
        toast.error(
          error?.response?.data?.message || "Error fetching inventors", { position: "top-center" }
        );
      }
    },
    refetchOnMount: true,
  });

  const { mutate: createDraftMutate, isPending: isAddingDraft } = useMutation({
    mutationKey: ["add_draft"],
    mutationFn: async (payload) => {
      try {
        const response = await API_CONFIG.post(
          "/api/v1/idea/create-new/draft",
          payload,
        );

        if (response?.status === 201) {
          navigate(
            `/ideas/${ideaId}/draft?draftId=${response?.data?.data?.id}`,
          );
          return response?.data?.data;
        }
      } catch (error) {
        console.error("Error adding draft:", error);
        toast.error(error?.response?.data?.message || "Error adding draft", { position: "top-center" });
      }
    },
  });

  const { mutate: updateIdeaMutation, mutateAsync: updateIdeaMutationAsync } =
    useMutation({
      mutationKey: ["update_idea", ideaId],
      mutationFn: async (data: any) => {
        try {
          const response = await API_CONFIG.put(
            `/api/v1/idea/update-idea/${ideaId}`,
            data,
          );

          if (response.status == 200) {
            return response?.data?.data;
          }
        } catch (error) {
          console.error("Failed to update idea!");
          throw error;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["ideaDetails", ideaId],
        });
      },
    });

  const { mutate: rejectIdeaByIHC, isPending: isRejectingIdeaByIHC } =
    useMutation({
      mutationKey: ["reject_idea_by_ihc"],
      mutationFn: async (payload?: { reject_reason?: string | null }) => {
        try {
          const response = await API_CONFIG.post(
            `/api/v1/idea/reject-from-ihc/${ideaId}`,
            {
              reject_reason:
                payload?.reject_reason !== undefined
                  ? payload.reject_reason
                  : null,
            }
          );

          if (response?.status === 200) {
            return response?.data?.data;
          }
        } catch (error) {
          console.error("Error rejecting idea by IHC:", error);
          toast.error(
            error?.response?.data?.message || "Error rejecting idea", { position: "top-center" }
          );
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["ideaDetails", ideaId],
        });
        queryClient.invalidateQueries({
          queryKey: ["idea_draft", ideaId],
        });
      },
    });

  const handleDraftSelection = (draftId: string) => {
    setSelectedDraftId(draftId);
  };

  const handleCreateDraft = () => {
    // navigate(`/ideas/${ideaId}/draft`);
    const payload: any = {
      meta_data: ideaDraftQuestions,
      idea_id: ideaId,
    };
    createDraftMutate(payload);
  };
  const handleEditDraft = (draftId: string) => {
    navigate(`/ideas/${ideaId}/draft?draftId=${draftId}`);
  };
  const { mutate: cloneDraftMutation, isPending: isCloningDraft } = useMutation(
    {
      mutationKey: ["clone_draft"],
      mutationFn: async (draftId: string) => {
        try {
          const response = await API_CONFIG.post(
            `/api/v1/idea/clone-draft/${draftId}`,
          );
          if (response.status === 200) {
            return response?.data?.data;
          }
        } catch (error) {
          console.error("Error cloning draft:", error);
          throw error;
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["idea_draft", ideaId],
        });
      },
      onError: (error: any) => {
        toast.error(error?.response?.data?.message || "Error cloning draft", { position: "top-center" });
      },
    },
  );

  const handleCopyDraft = (draftId: string) => {
    const confirm = window.confirm(
      "Are you sure you want to clone this draft?",
    );
    if (confirm) {
      cloneDraftMutation(draftId);
    }
  };

  const {
    mutate: sendToIHC,
    isPending: isSendingToIHC,
    variables: sendToIHCVariables,
  } = useMutation({
    mutationKey: ["send_to_ihc"],
    mutationFn: async (payload: { draft_id: string; ihc_id: string }) => {
      // An appeal must say why — collected here so every send path (including
      // the co-inventor prompt) gathers it; the chain enforces it server-side.
      let appealComment: string | undefined;
      if (mainIdeaData?.status === "REJECT_BY_IHC") {
        const why = window.prompt("This idea was rejected. Say why it should be reconsidered:");
        if (!why || !why.trim()) return;
        appealComment = why.trim();
      }
      try {
        const response = await API_CONFIG.post(
          `/api/v1/idea/send-to-ihc/${payload.draft_id}/${payload.ihc_id}`,
          { ...payload, comment: appealComment },
        );

        if (response?.status === 200) {
        }
      } catch (error) {
        console.error("Error sending to IHC:", error);
        toast.error(error?.response?.data?.message || "Error sending for review", { position: "top-center" });
      }
    },
    onSuccess: () => {
      setSelectedDraftId(null);

      queryClient.invalidateQueries({
        queryKey: ["ideaDetails", ideaId],
      });

      queryClient.invalidateQueries({
        queryKey: ["idea_draft", ideaId],
      });
    },
  });

  const { mutate: sendToOC, isPending: isLoadingToOC } = useMutation({
    mutationKey: ["send_to_oc"],
    mutationFn: async () => {
      try {
        const response = await API_CONFIG.post(
          `/api/v1/idea/send-to-oc/${selectedDraftId || inventorIdeas?.[0]?.id
          }/oc`,
          {
            instructions,
          },
        );
        if (response?.status === 200) {
          setInstructions("");
        }
      } catch (error) {
        console.error("Error sending to OC:", error);
        toast.error(error?.response?.data?.message || "Error sending to OC", { position: "top-center" });
      }
    },
    onSuccess: () => {
      setSelectedDraftId(null);

      queryClient.invalidateQueries({
        queryKey: ["ideaDetails", ideaId],
      });

      queryClient.invalidateQueries({
        queryKey: ["idea_draft", ideaId],
      });
    },
  });

  // Non-blocking co-inventor nudge shown once at submission when the idea
  // lists no co-inventors. Inventors can always skip.
  const [coInventorPromptDraftId, setCoInventorPromptDraftId] = useState<
    string | null
  >(null);

  const submitDraftToIHC = (targetDraftId: string) => {
    sendToIHC({
      ihc_id: user?.client_id ?? "",
      draft_id: targetDraftId,
    });
  };

  const handleSendToIHC = (draftId?: string) => {
    const targetDraftId = draftId ?? selectedDraftId;
    if (!targetDraftId) return;
    const hasCoInventors =
      (mainIdeaData?.IdeaInventor || []).filter(
        (x: any) => x?.inventor?.id !== user?.id,
      ).length > 0;
    if (user?.role === "INVENTOR" && !hasCoInventors) {
      setCoInventorPromptDraftId(targetDraftId);
      return;
    }
    submitDraftToIHC(targetDraftId);
  };

  const getStatusBadgeStyle = (status: string) => {
    if (status.includes("sent to IHC")) {
      return "dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30 bg-green-100 text-green-700 border-green-300";
    }
    switch (status) {
      case "In-Draft":
        return " dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30 bg-blue-100 text-blue-700 border-blue-300";
      case "Idea Rejected":
        return "dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30 bg-red-100 text-red-700 border-red-300";
      default:
        return "dark:bg-orange-500/20 dark:text-orange-400 dark:border-orange-500/30 bg-orange-100 text-orange-700 border-orange-300";
    }
  };

  // Capitalize first letter of each word
  const capitalize = (str: string): string => {
    if (!str) return "";
    return str
      .toLowerCase()
      .split("_")
      .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
      .join(" ");
  };

  const handleStatusChange = (e: string) => {
    if (e === "REJECTED" && user?.role === "LEGAL_COUNSEL") {
      rejectIdeaByIHC({});
    } else if (e === "UPDATE_REQUEST" && user?.role === "LEGAL_COUNSEL") {
      setShowRequestUpdateModal(true);
    }
  };

  const handleSave = async () => {
    try {
      // Prepare update payload
      const updatePayload: any = {};

      // Add title if changed
      if (title !== mainIdeaData?.title) {
        updatePayload.title = title;
      }

      // Add summary if changed
      if (
        summary !==
        (mainIdeaData?.about ||
          "This is a newly submitted idea. Add more details by creating and editing drafts below.")
      ) {
        updatePayload.about = summary;
      }

      // Save title and summary first
      if (Object.keys(updatePayload).length > 0) {
        await updateIdeaMutationAsync(updatePayload);
      }

      // Check if there are any inventor changes
      const hasInventorChanges =
        deletedInventorIds.length > 0 || extraInventors.length > 0;

      if (hasInventorChanges) {
        // Validate all inventor emails before proceeding
        if (extraInventors.length > 0) {
          const invalidEmails = extraInventors.filter(
            (inv) => inv.email.trim() && !validateEmail(inv.email.trim()),
          );

          if (invalidEmails.length > 0) {
            toast.error(
              `Please fix invalid email addresses: ${invalidEmails
                .map((inv) => inv.email)
                .join(", ")}`, { position: "top-center" }
            );
            return; // Stop saving if there are invalid emails
          }
        }

        // First, handle deletions
        if (deletedInventorIds.length > 0) {
          for (const ideaInventorId of deletedInventorIds) {
            try {
              await API_CONFIG.delete(
                `/api/v1/idea/remove/inventor/${ideaInventorId}`,
              );
            } catch (error: any) {
              console.error("Error removing inventor:", error);
              toast.error(
                error?.response?.data?.message || "Error removing inventor", { position: "top-center" }
              );
            }
          }
        }

        // Then, handle adding new inventors
        if (extraInventors.length > 0) {
          // Filter out inventors with empty email, and validate email format
          const validInventors = extraInventors.filter((inv) => {
            const hasEmail = inv.email.trim();
            const isValidEmail = hasEmail && validateEmail(inv.email.trim());

            if (hasEmail && !isValidEmail) {
              toast.error(
                `Invalid email format for ${inv.name || inv.email}`,
                { position: "top-center" },
              );
            }

            return hasEmail && isValidEmail;
          });

          if (validInventors.length > 0) {
            // Add each new inventor
            for (const inventor of validInventors) {
              try {
                let inventorId: string | null = null;
                const normalizedEmail = inventor.email.trim().toLowerCase();

                // First, check if the user already exists in the local list
                let existingInventor = inventors.find(
                  (inv) => inv.name?.toLowerCase() === normalizedEmail,
                );

                // If not found locally, fetch from API to get the latest data
                if (!existingInventor) {
                  try {
                    const inventorsResponse = await API_CONFIG.get(
                      `/api/v1/clients/fetch-all-inventors/${user?.client_id}`,
                    );
                    if (inventorsResponse?.status === 200) {
                      const data = inventorsResponse?.data?.data;
                      const formattedData = data.map((inv: any) => ({
                        id: inv?.id,
                        name: inv?.name,
                        email: inv?.email,
                      }));
                      setInventors(formattedData);
                      existingInventor = formattedData.find(
                        (inv) => inv.email?.toLowerCase() === normalizedEmail,
                      );
                    }
                  } catch (fetchError) {
                    console.error("Error fetching inventors:", fetchError);
                  }
                }

                // If user exists, use their ID
                if (existingInventor) {
                  inventorId = existingInventor.id;
                } else {
                  // User doesn't exist, invite them
                  try {
                    const inviteResponse = await API_CONFIG.post(
                      "/api/v1/auth/ihc/invite-user",
                      {

                        email: inventor.email,
                        role: "INVENTOR",
                      },
                    );

                    if (inviteResponse?.status === 200) {
                      inventorId = inviteResponse?.data?.data?.id;
                      // Update the inventors list with the new user
                      setInventors((prev) => [
                        ...prev,
                        {
                          id: inventorId!,

                        },
                      ]);
                    }
                  } catch (inviteError: any) {
                    // Check if error response contains user ID (user exists but wasn't in our list)
                    const errorData = inviteError?.response?.data;
                    if (errorData?.data?.id) {
                      inventorId = errorData.data.id;
                    } else if (errorData?.id) {
                      inventorId = errorData.id;
                    } else if (errorData?.user?.id) {
                      inventorId = errorData.user.id;
                    } else {
                      console.error("Error inviting user:", inviteError);
                      toast.error(
                        inviteError?.response?.data?.message ||
                        "Error inviting user", { position: "top-center" }
                      );
                      continue; // Skip to next inventor
                    }
                  }
                }

                // Add the inventor to the idea
                if (inventorId) {
                  try {
                    const addResponse = await API_CONFIG.post(
                      `api/v1/idea/add/inventor/${ideaId}/${inventorId}`,
                    );
                    if (addResponse?.status === 200) {
                    }
                  } catch (addError: any) {
                    console.error("Error adding inventor to idea:", addError);
                    // Check if it's because they're already added
                    if (
                      addError?.response?.status === 400 ||
                      addError?.response?.status === 409
                    ) {
                      toast.info(
                        `Inventor ${inventor.email} is already associated with this idea`, { position: "top-center" }
                      );
                    } else {
                      toast.error(
                        addError?.response?.data?.message ||
                        "Error adding inventor to idea", { position: "top-center" }
                      );
                    }
                  }
                }
              } catch (error: any) {
                console.error("Unexpected error adding inventor:", error);
                toast.error(
                  error?.response?.data?.message || "Error adding inventor", { position: "top-center" }
                );
              }
            }
          }
        }

        // Invalidate queries after inventor changes
        queryClient.invalidateQueries({
          queryKey: ["ideaDetails", ideaId],
        });
      }

      // Reset editing state
      setIsEditing(false);
      setExtraInventors([]);
      setDeletedInventorIds([]);
      setOriginalInventorIds([]);
    } catch (error) {
      console.error("Error saving changes:", error, { position: "top-center" });
      toast.error("Failed to save changes", { position: "top-center" });
    }
  };

  const mapStatusCodeToLabel = (status: string) => {
    switch (status) {
      case "IN_DRAFT":
        return "In Draft";
      case "UNDER_REVIEW":
        if (user?.role === "INVENTOR")
          return "Under Review";
        else
          return "Review Pending";
      case "REJECT_BY_IHC":
        return "Rejected in Client Review";
      case "UPDATE_REQUEST":
        if (user?.role === "INVENTOR")
          return "Update Requested by Reviewers"
        else
          return "Sent back to Inventor";
      case "SEND_TO_OC":
        if (user?.role === "INVENTOR" || user?.role === "LEGAL_COUNSEL")
          return "Sent to Photon Legal";
        else
          return "Sent by Legal Counsel"
      case "REJECT_BY_OC":
        return "Rejected by OC";
      case "REJECTED":
        return "Rejected";
      case "SENT_TO_IHC":
        return user?.role === "INVENTOR" ? "Under Review" : "Review Pending";
      case "UPDATE_REQUEST_BY_OC":
        if (user?.role === "INVENTOR" || user?.role === "LEGAL_COUNSEL")
          return "Update Requested by OC";
        else
          return "Update Requested";
      case "FILED":
        return "Filed";
      default:
        return capitalize(status);
    }
  };

  const handleDownloadFiles = async () => {
    try {
      if (!selectedDraftId && !ideaDraft?.[0]?.id) {
        toast.error("No drafts available to download", { position: "top-center" });
        return;
      }

      // Using axios directly to handle binary data
      const response = await axios({
        url: `${appConfig.API_HOST_URL}/api/v1/idea/download-draft-files/${selectedDraftId || ideaDraft?.[0]?.id
          }`,
        method: "GET",
        responseType: "blob",
        withCredentials: true,
      });

      // Create a blob from the response data
      const blob = new Blob([response.data]);

      // Create a download link and trigger the download
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;

      // Get filename from content-disposition header or use default name
      const contentDisposition = response.headers["content-disposition"];
      const fileName = contentDisposition
        ? contentDisposition.split("filename=")[1].replace(/"/g, "")
        : `draft-files-${ideaDraft?.[0]?.id}.zip`;

      link.setAttribute("download", fileName);
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);

      // Surface any files the server couldn't include in the zip.
      const failedRaw = response.headers["x-failed-files"];
      if (failedRaw) {
        try {
          const failed: string[] = JSON.parse(decodeURIComponent(failedRaw));
          if (failed.length) {
            toast.error(
              `Some files could not be downloaded: ${failed.join(", ")}`,
              { position: "top-center" },
            );
          }
        } catch {
          // Header malformed — ignore.
        }
      }

      // Also download the patent report if available
      const selectedDraft = ideaDraft?.find(
        (draft) => draft.id === (selectedDraftId || ideaDraft?.[0]?.id),
      );
      if (selectedDraft?.CheckDraftSoreLog?.[0]?.score_meta_data) {
        const reportData = selectedDraft.CheckDraftSoreLog[0].score_meta_data;

        // Create a result object expected by the PDF generator
        const reportResult = {
          // The PDF footer prints this as "Document ID". A draft's uuid means
          // nothing to whoever opens the file months later; the idea's
          // reference is what the workspace files it under.
          id: mainIdeaData?.reference_number || selectedDraft.id,
          score: reportData.scoringResult?.score || 0,
          report: JSON.stringify(reportData),
          scoringResult: reportData.scoringResult || {},
          status: "completed",
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
          evaluations: reportData.evaluations || [],
          recommendations: reportData.recommendations || [],
        };

        const { generatePatentReportPDFReact } = await import("./patentReportPdf");
        const pdfOutput = await generatePatentReportPDFReact(
          reportResult,
          reportData.priorArt || [],
          user,
        );
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        pdfOutput.save(`patent-evaluation-report-${timestamp}.pdf`);

        toast.success("Patent report downloaded", { position: "top-center" });
      }
    } catch (error) {
      console.error("Error downloading files:", error);
      if (error?.response?.status === 404 || error?.response?.status === 500) {
        toast.error("No files found for this draft", { position: "top-center" });
      } else {
        toast.error("Error occured!", { position: "top-center" });
      }
    }
  };

  const { mutate: calculateScoreMutation, isPending: isAddingEvaluation } =
    useMutation({
      mutationKey: ["calculate_score"],
      mutationFn: async () => {
        try {
          const response = await API_CONFIG.get(
            `/api/v1/idea/check-score/${ideaDraft?.[0]?.id}`,
          );

          if (response.status === 200) {
            const data = response?.data?.data;
            setIsDisableScoreTransition(false);
            setEnableScorePolling(true);
          }
        } catch (error) {
          console.error("Error calculating score:", error);
          toast.error(
            error?.response?.data?.message || "Error calculating score", { position: "top-center" }
          );
        }
      },
    });

  const {
    mutate: reEvalMutate,
    isPending: isReEvalLoading,
    error: reEvalError,
    reset: resetReEval,
  } = useMutation({
    mutationKey: ["re_evaluate_patent", draftApiEvaluationId],
    mutationFn: async (patentNumbers: string[]) => {
      const response = await API_CONFIG.post(
        `/api/v1/idea/re-evaluate/${draftApiEvaluationId}`,
        { patent_numbers: patentNumbers },
      );
      return response.data;
    },
    onSuccess: () => {
      setOpenEvaluatePopup(false);
      setPatentInput("");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
        "Failed to re-evaluate. Please try again.", { position: "top-center" }
      );
    },
  });

  // Check if score_meta_data is null to enable polling
  const shouldPollForScore = useMemo(() => {
    const scoreMetaData =
      ideaDraft?.[0]?.CheckDraftSoreLog?.[0]?.score_meta_data;
    return scoreMetaData === null || scoreMetaData === undefined;
  }, [ideaDraft]);

  // Check if score calculation is complete (should stop polling)
  const isScoreCalculationComplete = useMemo(() => {
    const scoreMetaData =
      ideaDraft?.[0]?.CheckDraftSoreLog?.[0]?.score_meta_data;
    if (!scoreMetaData) return false;
    return (
      scoreMetaData.status === "completed" || scoreMetaData.status === "error"
    );
  }, [ideaDraft]);

  // Track previous score_meta_data to detect when score is received
  const prevScoreMetaDataRef = useRef(
    ideaDraft?.[0]?.CheckDraftSoreLog?.[0]?.score_meta_data,
  );

  // Refetch idea data when score is received
  useEffect(() => {
    const currentScoreMetaData =
      ideaDraft?.[0]?.CheckDraftSoreLog?.[0]?.score_meta_data;
    const prevScoreMetaData = prevScoreMetaDataRef.current;

    // Check if score_meta_data changed from null/undefined to having a value
    if (
      (prevScoreMetaData === null || prevScoreMetaData === undefined) &&
      currentScoreMetaData !== null &&
      currentScoreMetaData !== undefined &&
      refetchIdeaDraft
    ) {
      refetchIdeaDraft();
    }

    // Update the ref for next comparison
    prevScoreMetaDataRef.current = currentScoreMetaData;
  }, [ideaDraft, refetchIdeaDraft]);

  useQuery({
    queryKey: ["fetch_score_status", ideaDraft?.[0]?.id],
    queryFn: async () => {
      // Don't fetch if we're updating the draft
      if (isUpdatingDraftRef.current) {
        return;
      }

      try {
        const response = await API_CONFIG.get(
          `/api/v1/idea/fetch-score/${localStorage.getItem("selectedDraftID") ? localStorage.getItem("selectedDraftID") : ideaDraft?.[0]?.id}`,
        );
        if (response.status !== 200) return;
        const data = response?.data?.data;
        if (!data) {
          return;
        }

        const isExists = localStorage.getItem(`run-bg-score-${ideaId}`);

        if (
          data?.score_meta_data &&
          data?.score_meta_data?.status !== "completed"
        ) {
          setIsCalculatingScore(true);
          setIsDisableScoreTransition(true);
          setAnalysisSteps([
            {
              id: "prior-art",
              label: "Retrieving prior art",
              status: "completed",
            },
            {
              id: "similarities",
              label: "Analyzing similarities",
              status: "completed",
            },
            {
              id: "novelty",
              label: "Calculating novelty score",
              status: "completed",
            },
            {
              id: "report",
              label: "Generating report",
              status: "active",
            },
          ]);
          setScoreDialogOpen(false);
        }

        if (data.score_meta_data === null) {
          setIsCalculatingScore(true);
          setIsDisableScoreTransition(true);
          setAnalysisSteps([
            {
              id: "prior-art",
              label: "Retrieving prior art",
              status: "completed",
            },
            {
              id: "similarities",
              label: "Analyzing similarities",
              status: "completed",
            },
            {
              id: "novelty",
              label: "Calculating novelty score",
              status: "completed",
            },
            {
              id: "report",
              label: "Generating report",
              status: "active",
            },
          ]);
        }

        // Update cache whenever score_meta_data is available (not null)
        if (
          data.score_meta_data !== null &&
          data.score_meta_data !== undefined
        ) {
          if (ideaDraft?.[0]) {
            const updatedDraft = {
              ...ideaDraft[0],
              CheckDraftSoreLog: [
                {
                  ...ideaDraft[0].CheckDraftSoreLog?.[0],
                  score: data.score,
                  score_meta_data: data.score_meta_data,
                },
              ],
            };
            queryClient.setQueryData(["idea_draft", ideaId], [updatedDraft]);
          }
        }

        if (data.score !== null) {
          setIdeaScore(data.score);
          setScoreVisible(true);
          setIsCalculatingScore(false);
          setEnableScorePolling(false);
          localStorage.removeItem("selectedDraftID");
          setAnalysisSteps((prev) =>
            prev.map((step) => ({
              ...step,
              status: "completed",
            })),
          );
        }

        // Stop polling if score_meta_data is filled and calculation is done (completed/errored)
        // But keep polling if score_meta_data exists but calculation is still in progress
        if (
          data.score_meta_data !== null &&
          data.score_meta_data !== undefined &&
          (data.score_meta_data?.status === "completed" ||
            data.score_meta_data?.status === "error")
        ) {
          setEnableScorePolling(false);
        }

        if (
          data.score_meta_data !== null &&
          data.score === null &&
          data?.score_meta_data?.status === "completed"
        ) {
          setIsCalculatingScore(false);
          setIsCalculatingScore(false);
          setScoreDialogOpen(false);
          setEnableScorePolling(false);
          setIsDisableScoreTransition(true);
          setScoreCalculationError("Failed to calculate score");
        }

        if (
          data?.score_meta_data !== null &&
          data?.score === null &&
          data?.score_meta_data?.status === "error"
        ) {
          setIsScoreCalculateError(true);
        }

        if (isExists) {
          setScoreDialogOpen(false);
        }

        return response?.data?.data;
      } catch (error) {
        console.error("Error fetching score status:", error);
      }
    },
    // Enable polling when:
    // 1. enableScorePolling is true (explicit calculation)
    // 2. score_meta_data is null (waiting for score to be calculated)
    // 3. User is LEGAL_COUNSEL (but only if score calculation is not complete)
    refetchInterval:
      ((enableScorePolling || shouldPollForScore) &&
        !isUpdatingDraftRef.current) ||
        (user?.role === "LEGAL_COUNSEL" && !isScoreCalculationComplete)
        ? 5000
        : false,
    enabled:
      !!ideaDraft?.[0]?.id &&
      (((enableScorePolling || shouldPollForScore) &&
        !isUpdatingDraftRef.current) ||
        (user?.role === "LEGAL_COUNSEL" && !isScoreCalculationComplete)),
    staleTime: Infinity, // Prevent automatic refetches
  });

  const { mutate: updateDraftMutation, isPending: isUpdatingDraft } =
    useMutation({
      mutationKey: ["update_draft"],
      mutationFn: async (data: any) => {
        isUpdatingDraftRef.current = true;
        try {
          const response = await API_CONFIG.post(
            `/api/v1/idea/update/draft/${ideaDraft?.[0]?.id}`,
            data,
          );

          if (response.status === 201) {
            // Update local state with new data
            if (ideaDraft?.[0]) {
              const updatedDraft = {
                ...ideaDraft[0],
                ...data,
                updatedAt: new Date().toISOString(),
                // Preserve the existing score data
                CheckDraftSoreLog: ideaDraft[0].CheckDraftSoreLog,
              };
              queryClient.setQueryData(["idea_draft", ideaId], [updatedDraft]);
            }
            return response?.data?.data;
          }
        } catch (error) {
          console.error("Error updating draft:", error);
          toast.error(error?.response?.data?.message || "Error updating draft", { position: "top-center" });
        } finally {
          isUpdatingDraftRef.current = false;
        }
      },
      onSuccess: () => {
        // No need to invalidate queries since we're using local state
      },
    });

  // Update useEffect to only check for background score calculation
  useEffect(() => {
    if (ideaDraft?.[0]?.id) {
      const isExists = localStorage.getItem(`run-bg-score-${ideaId}`);
      if (isExists) {
        setEnableScorePolling(true);
        setIsCalculatingScore(true);
      }
    }
  }, [ideaDraft, ideaId]);

  const handleCheckScore = () => {
    localStorage.removeItem(`run-bg-score-${ideaId}`);
    setIsCalculatingScore(true);
    if (selectedDraftId) localStorage.setItem("selectedDraftID", selectedDraftId);
    // setScoreDialogOpen(true);
    setRunningInBackground(false);
    setIsDisableScoreTransition(false);
    setEnableScorePolling(true);
    setShowPatentReportModal(false);
    setAnalysisSteps([
      {
        id: "prior-art",
        label: "Retrieving prior art",
        status: "pending",
      },
      {
        id: "similarities",
        label: "Analyzing similarities",
        status: "pending",
      },
      {
        id: "novelty",
        label: "Calculating novelty score",
        status: "pending",
      },
      {
        id: "report",
        label: "Generating report",
        status: "pending",
      },
    ]);
    calculateScoreMutation();
  };

  const handleRunInBackground = () => {
    setRunningInBackground(true);
    setScoreDialogOpen(false);
    localStorage.setItem(`run-bg-score-${ideaId}`, "YES");
    toast.info("Score calculation running in background", { position: "top-center" });
  };

  const addExtraInventor = () => {
    setExtraInventors((prev) => [
      ...prev,
      { id: crypto.randomUUID(), name: "", email: "" },
    ]);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const updateInventor = (
    id: string,
    field: "name" | "email",
    value: string,
  ) => {
    setExtraInventors((prev) =>
      prev.map((inv) => (inv.id === id ? { ...inv, [field]: value } : inv)),
    );
  };

  const removeInventor = (id: string) => {
    setExtraInventors((prev) => prev.filter((inv) => inv.id !== id));
  };

  const markInventorForDeletion = (ideaInventorId: string) => {
    setDeletedInventorIds((prev) => [...prev, ideaInventorId]);
  };

  const unmarkInventorForDeletion = (ideaInventorId: string) => {
    setDeletedInventorIds((prev) => prev.filter((id) => id !== ideaInventorId));
  };

  const { mutate: updateFileMutation, isPending: isUploadingFile } =
    useMutation({
      mutationKey: ["upload_idea_file"],
      mutationFn: async (files: File[]) => {
        try {
          const { s3UploadForImport } = await import("@/lib/api-service/s3Upload");
          const uploadedFiles: { key: string; originalName: string; size: number; contentType: string }[] = [];
          for (const file of files) {
            const uploaded = await s3UploadForImport(file, "idea");
            uploadedFiles.push(uploaded);
          }
          const response = await API_CONFIG.post(
            `/api/v1/idea/upload-idea-file/${ideaId}`,
            { files: uploadedFiles },
          );

          if (response?.status === 201) {
          }
          return response?.data;
        } catch (error) {
          console.error("upload file Error", error);
          toast.error(
            error?.response?.data?.message || "Failed to upload file!", { position: "top-center" }
          );
        }
      },
      onSuccess: () => {
        queryClient.invalidateQueries({
          queryKey: ["ideaDetails", ideaId],
        });
      },
    });

  const { mutate: removeDraftFile, isPending: isDeletingFile } = useMutation({
    mutationKey: ["delete_idea_file", ideaId],
    mutationFn: async (ideaFileId: string) => {
      try {
        const response = await API_CONFIG.delete(
          `/api/v1/idea/remove-idea-file/${ideaFileId}`,
        );

        if (response.status === 200) {
          queryClient.invalidateQueries({
            queryKey: ["ideaDetails", ideaId],
          });
        }
      } catch (error) {
        console.error("Error deleting file:", error);
        toast.error(
          error?.response?.data?.message || "Error deleting file", { position: "top-center" }
        );
      } finally {
        setDeletingFileId(null);
      }
    },
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    for (const file of files) {
      if (file?.size >= MAX_FILE_SIZE) {
        toast.error("File must be less than 1GB", { position: "top-center" });
        return;
      }
      validFiles.push(file);
    }

    updateFileMutation(validFiles);
  };

  const handleRemoveFile = (fileId: string) => {
    setDeletingFileId(fileId);
    removeDraftFile(fileId);
  };

  useEffect(() => {
    if (!Array.isArray(ideaDraft) || !ideaDraft.length) return;
    // The disclosure pane must show the draft that was SENT, not whichever row
    // the API returned first. An idea can carry several drafts, and reading
    // [0] rendered an empty 0%-complete one beside a populated summary —
    // "the disclosure is blank" with the content sitting right there.
    const preferred =
      ideaDraft.find((d: any) => d?.status === "SUBMITTED") ??
      [...ideaDraft].sort(
        (a: any, b: any) =>
          new Date(b?.updatedAt || b?.updated_at || 0).getTime() -
          new Date(a?.updatedAt || a?.updated_at || 0).getTime(),
      )[0];
    if (preferred?.meta_data) setSections(preferred.meta_data);
  }, [ideaDraft]);

  // Autosave must only run after a real user edit — `sections` also changes
  // when it is initialized from the fetched draft on mount, and saving then
  // fires a spurious "Draft updated successfully" toast on page load.
  const hasUserEditedRef = useRef(false);

  const handleAnswerChange = (
    sectionId: string,
    questionId: string,
    value: string,
  ) => {
    hasUserEditedRef.current = true;
    setSections((prevSections) =>
      prevSections.map((section) =>
        section.id === sectionId
          ? {
            ...section,
            questions: section.questions.map((question) =>
              question.id === questionId
                ? {
                  ...question,
                  answer: value,
                }
                : question,
            ),
          }
          : section,
      ),
    );
  };

  useEffect(() => {
    // Calculate completion percentage
    if (!mainIdeaData || !user) return;
    if (!hasUserEditedRef.current) return;

    if (user?.role !== "INVENTOR" && !isOutsideCounselRole(user?.role)) {
      if (
        user?.role === "LEGAL_COUNSEL" &&
        mainIdeaData?.created_by_id !== user?.id
      ) {
        const saveTimer = setTimeout(() => {
          const totalQuestions = sections.reduce(
            (acc, section) => acc + section.questions.length,
            0,
          );
          const answeredQuestions = sections.reduce((acc, section) => {
            return (
              acc +
              section.questions.filter((q) => q.answer.trim().length > 0).length
            );
          }, 0);
          const percentage = Math.round(
            (answeredQuestions / totalQuestions) * 100,
          );
          if (
            mainIdeaData?.created_by_id !== user?.id &&
            mainIdeaData?.status === "UNDER_REVIEW"
          ) {
            updateDraftMutation({
              meta_data: sections,
              completion_percentage: Number(percentage),
            });
          }
        }, 1500);

        return () => clearTimeout(saveTimer);
      }
    }
  }, [sections, user, mainIdeaData]);

  const handleReEvalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetReEval();
    // Split by comma or newline, trim, and filter empty
    const patentNumbers = patentInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (patentNumbers.length === 0) {
      toast.error("Please enter at least one patent number.", { position: "top-center" });
      return;
    }
    reEvalMutate(patentNumbers);
  };

  const renderAnalysisStep = (step: AnalysisStep, index: number) => {
    const stepIcon = () => {
      switch (step.status) {
        case "completed":
          return <CheckCircle className="h-4 w-4 text-green-500" />;
        case "active":
          return <Circle className="h-4 w-4 text-photon-light animate-pulse" />;
        default:
          return <Circle className="h-4 w-4 text-gray-300" />;
      }
    };
    return (
      <div
        key={step.id}
        className={`flex items-center gap-3 p-3 rounded-sm ${step.status === "active" ? "bg-primary/10" : ""
          }`}
      >
        {stepIcon()}
        <span
          className={`${step.status === "active"
            ? "text-photon-light font-medium"
            : step.status === "completed"
              ? "text-gray-700"
              : "text-gray-400"
            }`}
        >
          {step.label}
        </span>
      </div>
    );
  };

  const getSupportingFilesSection = () => {
    return (
      <div
        id="supporting-files"
        className={`mb-10 border rounded-md ${theme === "dark" ? "bg-zinc-900 border-[#cccccc20]" : "bg-white"
          }`}
      >
        <div className="px-6 py-4">
          <h2
            className={`text-md font-semibold tracking-wide ${theme === "dark" ? "text-zinc-200" : "text-zinc-900"
              }`}
          >
            Supporting FIles
          </h2>
          <div
            className={`text-xs font-sans mt-1 uppercase font-normal ${theme === "dark" ? "text-zinc-400" : "text-zinc-500"
              }`}
          >
            Optional • Diagrams, documents, etc.
          </div>
        </div>
        <Separator
          className={`mb-6 h-[0.5px] opacity-50 ${theme === "dark" ? "bg-[#cccccc20]" : "bg-gray-400"
            }`}
        />

        <div className="px-6 py-4 mb-5">
          <p
            className={`text-xs mb-3 ${theme === "dark" ? "text-neutral-400" : "text-neutral-500"
              }`}
          >
            Visible across all drafts of this idea.
          </p>
          {!["SEND_TO_OC", "UNDER_REVIEW"]?.includes(
            mainIdeaData?.status,
          ) && (
              <>
                <div
                  onClick={() => document.getElementById("file-upload")?.click()}
                  className={`w-full border-2 border-dashed cursor-pointer ${theme === "dark"
                    ? "bg-[#cccccc20] border-[#cccccc20]"
                    : "bg-[#cccccc10] border-gray-300 hover:bg-gray-50"
                    } rounded-md p-6 text-center transition-colors`}
                >
                  <Upload className="mx-auto h-6 w-6 text-gray-500 mb-3" />
                  <p
                    className={`${theme === "dark" ? "text-gray-300" : "text-gray-700"
                      } mb-2 text-sm`}
                  >
                    Click to upload supporing documents
                  </p>
                  <p
                    className={`${theme === "dark" ? "text-gray-400" : "text-gray-500"
                      } text-xs mb-4`}
                  >
                    PDF, DOC,images, diagrams, etc.
                  </p>
                  <div>
                    <input
                      id="file-upload"
                      type="file"
                      className="hidden"
                      multiple
                      onChange={handleFileUpload}
                      accept=".pdf,.png,.jpg,.jpeg,.doc,.docx,.xls,.xlsx"
                    />
                  </div>
                </div>
              </>
            )}

          {mainIdeaData?.IdeaFiles?.length > 0 && (
            <div className="space-y-2 w-full mt-4">
              {mainIdeaData?.IdeaFiles?.map((file: any, index: number) => (
                <div
                  key={file?.id ?? index}
                  className={`flex w-full items-center justify-between p-3 rounded-md border ${theme === "dark"
                    ? "border-white/10 bg-white/5"
                    : "border-neutral-200 bg-neutral-50"
                    }`}
                >
                  <div className="flex items-center gap-3">
                    <FileText
                      className={`w-4 h-4 ${theme === "dark"
                        ? "text-neutral-400"
                        : "text-neutral-600"
                        }`}
                    />
                    <span
                      className={`text-sm ${theme === "dark"
                        ? "text-neutral-300"
                        : "text-neutral-700"
                        }`}
                    >
                      {file.original_name}
                    </span>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() =>
                        window.open(
                          assetUrl(file.file_path),
                          "_blank",
                        )
                      }
                      className={`p-1.5 rounded-sm transition-colors ${theme === "dark"
                        ? "hover:bg-white/10 text-neutral-400 hover:text-neutral-200"
                        : "hover:bg-neutral-200 text-neutral-500 hover:text-neutral-700"
                        }`}
                    >
                      <Eye className="w-4 h-4" />
                    </button>
                    {!["SEND_TO_OC", "UNDER_REVIEW"]?.includes(
                      mainIdeaData?.status,
                    ) && (
                        <button
                          onClick={() => {
                            const confirmDelete = window.confirm(
                              "Are you sure you want to delete this file?",
                            );
                            if (confirmDelete) {
                              handleRemoveFile(file?.id);
                            }
                          }}
                          disabled={isDeletingFile && deletingFileId === file?.id}
                          className={`p-1.5 rounded-sm transition-colors ${theme === "dark"
                            ? "hover:bg-red-500/10 text-neutral-400 hover:text-red-400"
                            : "hover:bg-red-50 text-neutral-500 hover:text-red-600"
                            }`}
                        >
                          {isDeletingFile && deletingFileId === file?.id ? (
                            <LoaderCircle className="h-4 w-4 text-gray-500 animate-spin" />
                          ) : (
                            <Trash2 className="w-4 h-4" />
                          )}
                        </button>
                      )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    );
  };

  // The disclosure under review is the most recently updated draft.
  //
  // This used to require EXACTLY one draft. That held for the design's mock
  // data, where every idea has a single draft, but a real disclosure is often
  // revised: 30 of the imported ideas carry several, 9 of them sitting in a
  // review state. For those, a reviewer fell through to the inventor's
  // draft-card layout and had no approve, request-changes or reject at all —
  // the idea simply could not be actioned.
  const reviewDraft = (() => {
    if (!Array.isArray(ideaDraft) || !ideaDraft.length) return undefined;
    const byRecency = [...ideaDraft].sort(
      (a: any, b: any) =>
        new Date(b?.updatedAt || b?.updated_at || 0).getTime() -
        new Date(a?.updatedAt || a?.updated_at || 0).getTime(),
    );
    // Prefer the draft the inventor actually SENT. An inventor may keep working
    // on another draft after submitting one, so "most recent" is not the same
    // thing — it picks the wrong draft in 4 of the 14 imported multi-draft
    // ideas, showing the reviewer something that was never submitted.
    return byRecency.find((d: any) => d?.status === "SUBMITTED") ?? byRecency[0];
  })();

  const isReviewWorkspace =
    !!reviewDraft &&
    reviewDraft?.idea?.status !== "IN_DRAFT" &&
    reviewDraft?.idea?.clientId === user?.client_id &&
    ["LEGAL_COUNSEL", "TECH_COMMITTEE"].includes(user?.role ?? "") &&
    user?.id !== reviewDraft?.idea?.created_by_id;

  // Two-stage chain: the committee acts at UNDER_REVIEW, counsel at
  // SENT_TO_IHC. Counsel used to be offered UNDER_REVIEW as well, on the
  // theory that a client with no committee needs it — but an idea only ever
  // REACHES that state when the client HAS a committee (review-chain
  // firstStage), so the concession bought nothing and every decision taken
  // through it came back 403 "You cannot review at this stage". The queue has
  // gated this correctly since the last round; the detail page, which is what
  // every link in the product opens, did not. See findings.md F-045.
  const isUnderCommitteeReview =
    mainIdeaData?.status?.toUpperCase() === "UNDER_REVIEW";
  const isReviewPending =
    user?.role === "TECH_COMMITTEE"
      ? isUnderCommitteeReview
      : mainIdeaData?.status?.toUpperCase() === "SENT_TO_IHC";

  const isOCReadOnlyWorkspace =
    isOutsideCounselRole(user?.role) &&
    mainIdeaData?.status?.toUpperCase() !== "IN_DRAFT";
  const isInventorDraftWorkspace =
    (user?.role === "INVENTOR" || mainIdeaData?.submitted_by_id === user?.id) &&
    mainIdeaData?.status?.toUpperCase() === "IN_DRAFT";
  const isInventorOverview =
    user?.role === "INVENTOR" && !isInventorDraftWorkspace;
  const useDisclosureWorkspace =
    isReviewWorkspace || isOCReadOnlyWorkspace;

  const inventorDrafts = Array.isArray(ideaDraft)
    ? [...ideaDraft].sort(
        (a: any, b: any) =>
          new Date(b?.updatedAt || 0).getTime() -
          new Date(a?.updatedAt || 0).getTime(),
      )
    : [];
  const latestInventorDraft = inventorDrafts[0];
  const latestScoreReport =
    latestInventorDraft?.CheckDraftSoreLog?.[0]?.score_meta_data;

  useEffect(() => {
    if (
      isInventorDraftWorkspace &&
      latestInventorDraft?.id &&
      ideaId
    ) {
      navigate(
        `/ideas/${ideaId}/draft?draftId=${latestInventorDraft.id}`,
        { replace: true },
      );
    }
  }, [ideaId, isInventorDraftWorkspace, latestInventorDraft?.id, navigate]);

  const inventorStatus = (() => {
    switch (mainIdeaData?.status?.toUpperCase()) {
      case "UNDER_REVIEW":
      case "SENT_TO_IHC":
        return {
          eyebrow: "No action needed",
          title: "Your idea is in review",
          description:
            "They are reviewing the submission. We’ll email you when a decision is made.",
          needsAction: false,
        };
      case "SEND_TO_OC":
        return {
          eyebrow: "No action needed",
          title: "Your idea is with Photon Legal",
          description:
            "Photon Legal is assessing the next filing steps. We’ll email you when the review progresses.",
          needsAction: false,
        };
      case "UPDATE_REQUEST":
      case "UPDATE_REQUEST_BY_OC":
        return {
          eyebrow: "Your input is needed",
          title: "More information has been requested",
          description:
            "Review the request and update your draft so the evaluation can continue.",
          needsAction: true,
        };
      case "FILED":
        return {
          eyebrow: "No action needed",
          title: "Your patent application has been filed",
          description:
            "Examination can take time. We’ll keep you informed as the application progresses.",
          needsAction: false,
        };
      case "GRANTED":
        return {
          eyebrow: "Complete",
          title: "Your idea is now a granted patent",
          description:
            "The application has completed prosecution and the patent has been granted.",
          needsAction: false,
        };
      case "REJECT_BY_IHC":
      case "REJECT_BY_OC":
      case "REJECTED":
        return {
          eyebrow: "Review complete",
          title: "This idea will not proceed at this time",
          description:
            "You can review the record and evaluation for the decision context.",
          needsAction: false,
        };
      default:
        return {
          eyebrow: "Status update",
          title: "Your idea is being processed",
          description: "We’ll notify you when the status changes.",
          needsAction: false,
        };
    }
  })();

  const ocWorkflowStatus: OCWorkflowStatus =
    mainIdeaData?.status?.toUpperCase() === "FILED"
      ? "FILED"
      : mainIdeaData?.oc_workflow_status || "UNDER_REVIEW";
  const ocWorkflowLabel =
    OC_WORKFLOW_OPTIONS.find(
      (option) => option.value === ocWorkflowStatus,
    )?.label || "Under Review";

  const handleOCWorkflowChange = (next: string) => {
    const status = next as OCWorkflowStatus;
    if (status === ocWorkflowStatus) return;
    if (status === "FILED") {
      setShowFileIdeaModal(true);
      return;
    }
    // There IS no free status write on the photon side — the API's one OC
    // transition is SENT_TO_PHOTON -> FILED, through the filing flow above.
    // The old branch PUT to a rule the adapter answers with a read, so the
    // toast said "Status updated" while nothing changed and the next refetch
    // put the real state back. Say so instead of pretending.
    toast.info("Status moves on its own as the idea progresses — the one action here is filing it.");
  };

  const [disclosureOpen, setDisclosureOpen] = useState(false);
  const disclosureRef = useRef<HTMLDetailsElement>(null);
  const [decisionOpen, setDecisionOpen] = useState<"APPROVED" | "CHANGES_REQUESTED" | "REJECTED" | null>(null);
  const [decisionNote, setDecisionNote] = useState("");
  const [downloadError, setDownloadError] = useState("");
  const [downloading, setDownloading] = useState<string | null>(null);
  const activity = useQuery({ queryKey: ["idea_activity", ideaId], staleTime: 0, refetchOnMount: "always", enabled: !!mainIdeaData?.id, queryFn: async () => (await rawApi.get(`/v1/ideas/${ideaId}/transitions`)).data });
  const events: any[] = Array.isArray(activity.data) ? activity.data : [];
  const decisionMutation = useMutation({
    mutationFn: async () => rawApi.post(`/v1/ideas/${ideaId}/review`, { decision: decisionOpen, comment: decisionNote.trim() || undefined }),
    onSuccess: () => { setDecisionOpen(null); setDecisionNote(""); for (const key of [["ideaDetails", ideaId], ["idea_draft", ideaId], ["idea_activity", ideaId], ["fetch_ideas"], ["pulse-review-workspace"]]) queryClient.invalidateQueries({ queryKey: key }); },
  });
  const downloadFile = async (file: any) => {
    setDownloading(file.id); setDownloadError("");
    try { const response = await rawApi.get(`/v1/files/${file.id}/raw`, { responseType: "blob" }); const url = URL.createObjectURL(response.data); const anchor = document.createElement("a"); anchor.href = url; anchor.download = file.original_name || "Supporting document"; anchor.click(); URL.revokeObjectURL(url); }
    catch { setDownloadError("Could not download this attachment. Try downloading it again."); }
    finally { setDownloading(null); }
  };
  const state = mainIdeaData?.state ?? ({ IN_DRAFT: "DRAFT", SENT_TO_IHC: "LEGAL_REVIEW", UNDER_REVIEW: "LEGAL_REVIEW", UPDATE_REQUEST: "CHANGES_REQUESTED", SEND_TO_OC: "SENT_TO_PHOTON", REJECT_BY_IHC: "REJECTED" } as Record<string, string>)[mainIdeaData?.status] ?? mainIdeaData?.status;
  const linkedPatent = mainIdeaData?.patent_link?.patent ?? mainIdeaData?.IdeaPatentLink?.[0]?.patent;
  const closed = ["EXPIRED", "WITHDRAWN", "REJECTED", "ABANDONED", "NONPAYMENT"].includes(linkedPatent?.status);
  const statusLabel = linkedPatent?.status === "GRANTED" ? "Granted" : closed ? "Closed" : ({ DRAFT: "In draft", LEGAL_REVIEW: "Awaiting Workspace Admin review", CHANGES_REQUESTED: "Changes requested", REJECTED: "Rejected", SENT_TO_PHOTON: "Sent to Photon Legal", FILED: "Filed" } as Record<string, string>)[state] ?? "Status unavailable";
  const authorCanEdit = mainIdeaData && (mainIdeaData.author_id === user?.id || (user?.role === "LEGAL_COUNSEL" && mainIdeaData.submitted_by_id === user?.id));
  const canRevise = authorCanEdit && ["DRAFT", "CHANGES_REQUESTED", "REJECTED"].includes(state);
  const canDecide = user?.role === "LEGAL_COUNSEL" && mainIdeaData?.client_id === user.client_id && state === "LEGAL_REVIEW";
  const photon = isOutsideCounselRole(user?.role);
  const canFile = photon && state === "SENT_TO_PHOTON";
  const selectedDisclosure = reviewDraft ?? latestInventorDraft;
  const report = selectedDisclosure?.CheckDraftSoreLog?.[0]?.score_meta_data;
  const score = typeof report?.scoringResult?.score === "number" ? report.scoringResult.score / 10 : null;
  const scoreBand = score === null ? "Not evaluated" : score >= 8 ? "Highly novel" : score >= 6 ? "Moderately novel" : score >= 4 ? "Marginally novel" : "Closely matched";
  const files = mainIdeaData?.files ?? mainIdeaData?.IdeaFiles ?? [];
  const fullBrief = selectedDisclosure?.brief_summary || mainIdeaData?.summary || "No brief is available. Read the disclosure sections below.";
  const brief = mainIdeaData?.title && fullBrief.startsWith(`${mainIdeaData.title}: `) ? fullBrief.slice(mainIdeaData.title.length + 2) : fullBrief;
  const owner = mainIdeaData?.author?.name ?? mainIdeaData?.created_by?.name;
  const coInventors = (mainIdeaData?.IdeaInventor ?? []).filter((credit: any) => credit.role !== "PRIMARY" && credit.inventor?.id !== mainIdeaData?.author_id);
  const feedback = events.find((event) => event.decision && event.comment);
  const nextStep = canRevise ? state === "REJECTED" ? "You can revise this disclosure and resubmit with a note explaining what changed." : "Update your answers, then submit this revision for Workspace Admin review." : canDecide ? "Review this disclosure and decide whether to send it to Photon Legal for filing." : canFile ? "Photon Legal handles drafting and filing outside Pulse. Record the filing here once it is complete." : linkedPatent ? closed ? "The linked patent is no longer active. Open the patent record for its recorded status." : "Open the linked patent to follow its recorded progress." : state === "LEGAL_REVIEW" ? "Your Workspace Admin owns the next decision. You will receive an email when they respond." : state === "SENT_TO_PHOTON" ? "Photon Legal owns the next step and will update the record after filing." : "Read the disclosure and review history for the recorded decision and next step.";
  const actionLabel = canRevise ? state === "REJECTED" ? "Revise and resubmit" : "Update disclosure" : canDecide ? "Send to Photon Legal" : canFile ? "Record filing" : linkedPatent ? "View patent" : "Read disclosure";
  const primaryAction = () => { if (canRevise) navigate(`/ideas/${ideaId}/draft?draftId=${selectedDisclosure?.id}`); else if (canDecide) { decisionMutation.reset(); setDecisionOpen("APPROVED"); } else if (canFile) setShowFileIdeaModal(true); else if (linkedPatent) navigate(`/patents/${linkedPatent.id}`); else { setDisclosureOpen(true); requestAnimationFrame(() => disclosureRef.current?.scrollIntoView({ block: "start" })); } };
  const eventLabel = (event: any) => event.decision === "CHANGES_REQUESTED" ? "Changes requested" : event.decision === "REJECTED" ? "Idea rejected" : event.decision === "APPROVED" ? "Sent to Photon Legal" : event.to_state === "FILED" ? "Filing recorded" : event.is_appeal ? "Resubmitted for reconsideration" : event.from_state === "CHANGES_REQUESTED" ? "Revised disclosure submitted" : "Submitted for review";
  const dateLabel = (date: string) => new Date(date).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

  if (isFetchingIdea) return <div data-idea-detail className="flex min-h-0 flex-1 flex-col"><PageHeader title="Idea detail" /><p role="status" className="p-6 text-sm text-pl-text-3">Loading idea…</p></div>;
  if (!mainIdeaData) return <div data-idea-detail className="flex min-h-0 flex-1 flex-col"><PageHeader title="Idea detail" /><div className="p-6"><h1 className="text-xl font-semibold">This idea is unavailable</h1><p role="alert" className="mt-2 text-sm text-pl-text-2">It may be outside your workspace, or the record could not be loaded.</p><div className="mt-4 flex gap-2"><Button size="sm" onClick={() => reloadIdea()}>Reload idea</Button><Button size="sm" variant="outline" onClick={() => navigate("/ideas")}>Back to ideas</Button></div></div></div>;
  return <div data-idea-detail className="pulse-product-page flex min-h-0 flex-1 flex-col bg-background text-foreground">
    <PageHeader title={photon && mainIdeaData.client?.name ? mainIdeaData.client.name : "Idea detail"} />
    <div className="min-h-0 flex-1 overflow-y-auto">
    <header className="shrink-0 border-b border-pl-border px-6 py-4"><div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0 flex-1"><p className="text-xs text-pl-text-3">{mainIdeaData.reference_number}</p><h1 className="mt-1 break-words text-xl font-semibold">{mainIdeaData.title}</h1></div><Button size="sm" variant="ghost" onClick={() => navigate("/ideas")}>Back to ideas</Button></div></header>
    <div className="px-6 py-5">
      <div className="mx-auto max-w-5xl space-y-5">
        <section className="border-b border-pl-border pb-5"><div className="flex flex-wrap items-start justify-between gap-4"><div className="min-w-0 flex-1"><h2 className="text-lg font-semibold">{statusLabel}</h2><p className="mt-2 max-w-3xl text-sm text-pl-text-2">{nextStep}</p></div></div></section>
        <div className="flex flex-wrap gap-x-8 gap-y-2 text-sm"><p><span className="text-pl-text-3">Inventor</span> · {owner || "Not recorded"}</p>{mainIdeaData.submitted_by && <p><span className="text-pl-text-3">Submitted by</span> · {mainIdeaData.submitted_by.name}</p>}{coInventors.length > 0 && <p><span className="text-pl-text-3">Co-inventors</span> · {coInventors.map((credit: any) => credit.inventor?.name).filter(Boolean).join(", ")}</p>}</div>
        {feedback && ["CHANGES_REQUESTED", "REJECTED"].includes(state) && <section className="border-l-2 border-pl-blue pl-4"><h2 className="text-sm font-semibold">Review feedback</h2><p className="mt-2 whitespace-pre-wrap text-sm text-pl-text-2">{feedback.comment}</p><p className="mt-2 text-xs text-pl-text-3">{feedback.actor?.name || "Workspace Admin"} · {dateLabel(feedback.created_at)}</p></section>}
        <section><h2 className="text-sm font-semibold">Invention brief</h2><p className="mt-2 text-sm text-pl-text-2">{brief}</p></section>
        <details ref={disclosureRef} open={disclosureOpen} onToggle={(event) => setDisclosureOpen(event.currentTarget.open)} className="scroll-mt-4 border-t border-pl-border pt-4"><summary className="cursor-pointer text-sm font-medium">Full disclosure · revision {mainIdeaData.revision || 1}</summary>{isFechingIdeaDraft ? <p role="status" className="mt-3 text-sm">Loading disclosure…</p> : <div className="mt-3 divide-y divide-pl-border">{(selectedDisclosure?.meta_data ?? sections).map((section: any) => <details key={section.id} className="py-3"><summary className="cursor-pointer text-sm font-medium">{section.id === "advantages" ? "Novelty" : section.id === "implementation" ? "Application" : section.title}</summary><dl className="mt-3 space-y-4">{section.questions?.map((question: any) => <div key={question.id}><dt className="text-xs font-medium text-pl-text-3">{question.text || question.question}</dt><dd className="mt-1 whitespace-pre-wrap break-words text-sm text-pl-text-2">{question.answer || "No answer recorded."}</dd></div>)}</dl></details>)}</div>}</details>
        <section className="border-t border-pl-border pt-4"><h2 className="text-sm font-semibold">Evaluation</h2>{report?.scoringResult ? <><p className="mt-2 text-xl font-semibold tabular-nums">{score?.toFixed(1) ?? "—"}<span className="text-sm font-normal text-pl-text-3"> /10 · {scoreBand}</span></p>{report.raw?.state === "PARTIAL" && <p className="mt-2 text-sm text-pl-amber-text">Partial result · the score is provisional</p>}<p className="mt-2 text-sm text-pl-text-2">{score !== null && score < 4 ? "The search found close overlap. Review the differences and the explanation." : "Review the comparison to understand the features that appear different."}</p><p className="mt-2 text-xs text-pl-text-3">AI-assisted and advisory. No score is required to submit for review.</p><details className="mt-3"><summary className="cursor-pointer text-sm font-medium">What differs and supporting evidence</summary><div className="mt-3"><PatentNoveltyReport embedded hideAssessment title={mainIdeaData.title} api_evaluation_id={report.id} scoringResult={report.scoringResult} priorArt={report.priorArt ?? []} report={report} reference={mainIdeaData.reference_number} /></div></details></> : <p className="mt-2 text-sm text-pl-text-2">No evaluation is available. This disclosure can be reviewed on its own merits.</p>}</section>
        <details className="border-t border-pl-border pt-4"><summary className="cursor-pointer text-sm font-medium">Source material and attachments · {files.length}</summary>{selectedDisclosure?.answers?.__source?.text && <details className="mt-3"><summary className="cursor-pointer text-sm">Original source text</summary><p className="mt-2 whitespace-pre-wrap text-sm text-pl-text-2">{selectedDisclosure.answers.__source.text}</p></details>}<div className="mt-3 divide-y divide-pl-border">{files.length ? files.map((file: any) => <div key={file.id} className="flex items-center justify-between gap-3 py-3"><p className="min-w-0 break-words text-sm">{file.original_name}</p><Button size="sm" variant="outline" disabled={downloading === file.id} onClick={() => downloadFile(file)}>{downloading === file.id ? "Downloading…" : "Download"}</Button></div>) : <p className="text-sm text-pl-text-3">No attachments were provided.</p>}</div>{downloadError && <p role="alert" className="mt-2 text-sm text-pl-red-text">{downloadError}</p>}</details>
        <details className="border-t border-pl-border pt-4"><summary className="cursor-pointer text-sm font-medium">Review history and activity</summary>{activity.isLoading ? <p role="status" className="mt-3 text-sm">Loading history…</p> : activity.isError ? <div role="alert" className="mt-3"><p className="text-sm">Could not load history.</p><Button size="sm" variant="outline" onClick={() => activity.refetch()}>Reload history</Button></div> : events.length ? <ol className="mt-3 divide-y divide-pl-border">{events.map((event) => <li key={event.id} className="py-3"><p className="text-sm font-medium">{eventLabel(event)}</p><p className="mt-1 text-xs text-pl-text-3">{event.actor?.name || "Recorded activity"} · revision {event.revision} · {dateLabel(event.created_at)}</p>{event.comment && <p className="mt-2 whitespace-pre-wrap text-sm text-pl-text-2">{event.comment}</p>}</li>)}</ol> : <p className="mt-3 text-sm text-pl-text-3">No review activity has been recorded.</p>}</details>
        {linkedPatent && <section className="border-t border-pl-border pt-4"><h2 className="text-sm font-semibold">Related patent</h2><p className="mt-2 text-sm text-pl-text-2">{linkedPatent.application_number || "Application number not recorded"} · {linkedPatent.jurisdiction}</p></section>}
      </div>
    </div>
    </div>
    <footer className="shrink-0 border-t border-pl-border bg-background px-6 py-3"><div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-2">{canDecide && <div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => { decisionMutation.reset(); setDecisionOpen("CHANGES_REQUESTED"); }}>Request changes</Button><DropdownMenu><DropdownMenuTrigger asChild><Button size="sm" variant="ghost" aria-label="More decision options"><MoreHorizontal /></Button></DropdownMenuTrigger><DropdownMenuContent><DropdownMenuItem onSelect={() => { decisionMutation.reset(); setDecisionOpen("REJECTED"); }}>Reject idea</DropdownMenuItem></DropdownMenuContent></DropdownMenu></div>}<Button className="ml-auto" size="sm" onClick={primaryAction} disabled={isFechingIdeaDraft}>{actionLabel}</Button></div></footer>
    <Dialog open={!!decisionOpen} onOpenChange={(open) => { if (!open) setDecisionOpen(null); }}><DialogContent><DialogHeader><DialogTitle>{decisionOpen === "APPROVED" ? "Send to Photon Legal for filing?" : decisionOpen === "CHANGES_REQUESTED" ? "Request changes to this disclosure" : "Reject this idea?"}</DialogTitle><DialogDescription>{decisionOpen === "APPROVED" ? "Photon Legal will receive this disclosure and its supporting files." : decisionOpen === "CHANGES_REQUESTED" ? "The inventor will receive your feedback and can update this disclosure." : "The inventor will receive your reason and may revise and resubmit for reconsideration."}</DialogDescription></DialogHeader><label className="text-sm font-medium" htmlFor="idea-decision-note">{decisionOpen === "APPROVED" ? "Instructions for Photon Legal (optional)" : "Your reason (required)"}</label><Textarea id="idea-decision-note" value={decisionNote} onChange={(event) => setDecisionNote(event.target.value)} />{decisionMutation.isError && <p role="alert" className="text-sm text-pl-red-text">Could not save this decision. Your note remains here; try again.</p>}<DialogFooter><Button size="sm" variant="outline" onClick={() => setDecisionOpen(null)}>Keep reviewing</Button><Button size="sm" disabled={decisionMutation.isPending || !canDecide || (decisionOpen !== "APPROVED" && !decisionNote.trim())} onClick={() => decisionMutation.mutate()}>{decisionMutation.isPending ? "Saving decision…" : decisionOpen === "APPROVED" ? "Send to Photon Legal" : decisionOpen === "CHANGES_REQUESTED" ? "Request changes" : "Reject idea"}</Button></DialogFooter></DialogContent></Dialog>
    {showFileIdeaModal && <FileIdeaModal open={showFileIdeaModal} onOpenChange={setShowFileIdeaModal} ideaId={ideaId ?? ""} defaultTitle={mainIdeaData.title} defaultInventors={(mainIdeaData.IdeaInventor ?? []).map((credit: any) => credit.inventor?.name).filter(Boolean)} onFiled={() => { for (const key of [["ideaDetails", ideaId], ["idea_activity", ideaId], ["fetch_ideas"], ["dashboard"], ["patents"], ["fetch_clients"]]) queryClient.invalidateQueries({ queryKey: key }); }} />}
  </div>;
};
export default IdeaDetailsContent;
