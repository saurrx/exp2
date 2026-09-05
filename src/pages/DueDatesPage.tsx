import React from "react";
import { useLocation } from "react-router-dom";
import { useTrackOnce } from "@/lib/analytics";
import useUserCookie from "@/hooks/use-auth";
import BlockedRedirect from "@/lib/BlockedRedirect";
import { canReadDocket } from "@/lib/roleAccess";
import { PageHeader } from "@/components/DashboardChrome";
import { ActionsNavigation } from "@/components/actions/ActionsWorkspace";
import DueDatesContent from "@/components/due-dates/DueDatesContent";
export default function DueDatesPage() {
  useTrackOnce("due_dates_viewed");
  const location = useLocation();
  const {user} = useUserCookie();
  if (!user) return null;
  if (!canReadDocket(user.role)) return <BlockedRedirect from="/due-dates" to="/"/>;
  return <><PageHeader title={user?.role === "LEGAL_COUNSEL" ? "Actions" : "Due dates"} actions={<ActionsNavigation/>}/><DueDatesContent initialView={location.state?.initialView || "list"}/></>;
}
