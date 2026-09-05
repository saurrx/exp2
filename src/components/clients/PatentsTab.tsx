import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { actionPrimary } from "@/components/actions/ActionsWorkspace";
import { Link, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import API_CONFIG from "@/lib/apiConfig";
import Loader from "../Loader";
import _ from "lodash";
import { FileSearch, FileText } from "lucide-react";
import { useTheme } from "@/hooks/useTheme";

// Define the completion status types
type CompletionStatus = "completed" | "partially_completed" | "incomplete";

// Extend the patent type to include completion status
interface Patent {
  id: number;
  applicationNumber: string;
  title: string;
  completionStatus: CompletionStatus;
}

const PatentsTab: React.FC = () => {
  const { theme } = useTheme();
  const { clientId } = useParams();
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage, setItemsPerPage] = useState<number>(30);

  const { isFetching: isFetchingPatents, data: patentData, isError, refetch } = useQuery({
    queryKey: ["patents", clientId, currentPage, itemsPerPage],
    queryFn: async () => {
      const response = await API_CONFIG.get(
        `/api/v1/patent/fetch-all-patents/client/${clientId}?page=${currentPage}&limit=${itemsPerPage}`,
      );

      if (response.status === 200) {
        return response?.data;
      }
    },
    enabled: !!clientId,
    refetchOnMount: true,
  });

  const totalPatents =
    patentData?.pagination?.total || patentData?.data?.length || 0;

  return <section className="py-4"><h2 className="text-lg font-semibold">Client patent portfolio</h2>{isFetchingPatents?<p role="status" className="mt-3 text-sm text-pl-text-2">Loading portfolio summary…</p>:isError?<><p role="alert" className="mt-3 text-sm text-pl-text-2">Portfolio summary could not be loaded.</p><Button size="sm" className={`mt-5 ${actionPrimary}`} onClick={()=>refetch()}>Reload portfolio summary</Button></>:<><p className="mt-3 text-sm text-pl-text-2">{totalPatents} patents recorded for this client. Open the portfolio to search, import or maintain its records.</p><Button size="sm" asChild className={`mt-5 ${actionPrimary}`}><Link to={`/patents?client=${clientId}`}>Open client portfolio</Link></Button></>}</section>;
};
export default PatentsTab;
