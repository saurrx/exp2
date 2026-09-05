import React, { useState, useRef } from "react";
import { MainClass, PageHeader } from "@/components/DashboardChrome";
import ClientDetails, {
  ClientDetailsRef,
} from "@/components/clients/ClientDetails";
import ClientTabs from "@/components/clients/ClientTabs";
import ClientLogo from "@/components/clients/ClientLogo";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { ActionsNavigation, actionPrimary } from "@/components/actions/ActionsWorkspace";
import { clientRelationship } from "@/components/clients/ClientBook";
import BlockedRedirect from "@/lib/BlockedRedirect";
import { User, Pen, X, Save, Globe2, BriefcaseBusiness } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import API_CONFIG, { assetUrl } from "@/lib/apiConfig";
import Loader from "@/components/Loader";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { toast } from "@/lib/toast";
import Cookies from "js-cookie";
import { useTheme } from "@/hooks/useTheme";
import useUserCookie from "@/hooks/use-auth";
import { isOutsideCounselRole } from "@/lib/roleAccess";
import { track, identifyUser, useTrackOnce } from "@/lib/analytics";

const ClientDetailPage: React.FC = () => {
  const { theme } = useTheme();
  const { clientId } = useParams();
  const [params] = useSearchParams();
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);
  const { user } = useUserCookie();
  // V0 limits client records to the Case Owner’s current assignments.
  // An old direct link retains the existing request-access recovery.
  const isUnassignedCaseOwner =
    user?.role === "CASE_OWNER" &&
    !((user as any)?.assigned_client_ids ?? []).includes(clientId);
  const requestAccessMutation = useMutation({
    mutationFn: async () =>
      (await API_CONFIG.post(`/api/v1/clients/${clientId}/request-access`))?.data,
    onSuccess: () => toast.success("Access request sent."),
    onError: () => toast.error("Couldn't send the request. Try again."),
  });
  const isCaseOwner = user?.role === "CASE_OWNER";
  const canViewClient = user?.role === "PHOTON_ADMIN" || isCaseOwner;
  const [isEditMode, setIsEditMode] = useState(false);
  // Only once the role check below has passed — a record the caller is bounced
  // off was never opened, it was refused, and redirect_blocked says that.
  useTrackOnce("client_record_opened", { client_id: clientId }, !!user && canViewClient);
  const [isClientModeModalOpen, setIsClientModeModalOpen] = useState(false);
  const [isOwnerDialogOpen, setIsOwnerDialogOpen] = useState(false);
  const clientDetailsRef = useRef<ClientDetailsRef>(null);
  const queryClient = useQueryClient();

  const {
    data: clientData,
    isLoading,
    isError,
    error,
    isFetching,
    refetch: refetchClientData,
  } = useQuery({
    queryKey: ["client", clientId],
    queryFn: async () => {
      const response = await API_CONFIG.get(`/api/v1/clients/${clientId}`);

      if (response.status === 200) {
        return response?.data;
      }
    },
    enabled: !!clientId && !!user && canViewClient,
    refetchOnMount: true,
  });

  const { data: accessData } = useQuery({
    queryKey: ["case-owners"],
    queryFn: async () => {
      const response = await API_CONFIG.get("/api/v1/case-owners");
      return response.data.data;
    },
    enabled: user?.role === "PHOTON_ADMIN",
  });
  const caseOwners = (accessData?.owners || []).filter(
    (member: any) => member.role === "CASE_OWNER",
  );
  const assignedOwner = isCaseOwner
    ? user
    : caseOwners.find((owner: any) =>
        owner.assigned_client_ids?.includes(clientId),
      );

  const ownerMutation = useMutation({
    mutationFn: async (owner: any) =>
      API_CONFIG.put(`/api/v1/case-owners/${owner.id}/assignments`, {
        clientIds: Array.from(
          new Set([...(owner.assigned_client_ids || []), clientId]),
        ),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["case-owners"] });
      setIsOwnerDialogOpen(false);
    },
  });

  const { mutate: loginAsClient, isPending: isLoggingInAsClient, error: clientViewError } = useMutation(
    {
      mutationKey: ["login_as_client", clientId],
      mutationFn: async () => {
        try {
          const response = await API_CONFIG.post(
            `/api/v1/auth/login-as-client/${clientId}`,
          );

          // Handle response structure
          const userData = response?.data?.data?.user || response?.data?.user;

          if (userData) {
            // Save original admin user info before switching to client mode
            // (admin token is saved server-side as pl_admin_token HttpOnly cookie)
            const originalAdminUser = Cookies.get("pl_user");

            if (originalAdminUser) {
              sessionStorage.setItem("pl_original_admin_user", originalAdminUser);
              sessionStorage.setItem("pl_client_mode", "true");
            }

            // Update pl_user cookie with client user data
            // (pl_access_token is set server-side as HttpOnly cookie)
            Cookies.remove("pl_user", { path: "/" });
            Cookies.set("pl_user", JSON.stringify(userData), { secure: true, sameSite: "lax", path: "/" });


            // Entering a view-as session: re-identify as the viewed user with the
            // view flag, and record the transition. Ids/enums only, never name/email.
            if (userData.id) {
              identifyUser(userData.id, {
                role: userData.role,
                client_id: userData.client_id ?? userData.clientId ?? clientId,
                view: true,
              });
            }
            track("view_as_entered", { client_id: clientId });

            // Force a full page reload
            window.location.replace("/");
          } else {
            console.error("Missing user in response");
            toast.error("Invalid response from server");
          }
          return response?.data;
        } catch (error: any) {
          console.error("Error logging in as client", error);
          toast.error(
            error?.response?.data?.message || "Error entering client mode"
          );
          throw error;
        }
      },
    },
  );

  const handleProceedToClientMode = () => {
    if (clientId) {
      loginAsClient();
    }
  };

     // Case owners may only open clients explicitly assigned to their session.
     const allowedRoles = ["PHOTON_ADMIN", "CASE_OWNER"];
     if (!user) {
       return <Loader />;
     }
     if (user && !allowedRoles.includes(user.role)) {
       return <BlockedRedirect from="/clients/:id" to="/" />;
     }
     if (user && !canViewClient) {
       return <BlockedRedirect from="/clients/:id" to="/clients" />;
     }

  const client = clientData?.data;
  const back = params.get("back")?.startsWith("/clients?") ? params.get("back")! : "/clients";
  const owners = client?.onboarding?.owners?.map((owner:any)=>owner.name).join(", ") || assignedOwner?.name || "Not assigned";
  const enterView = () => { track("view_as_prompted", {client_id:clientId});setIsClientModeModalOpen(true); };
  return <>
    <PageHeader title="Client workspace" actions={<div className="flex items-center gap-3">{isEditMode?<><Button size="sm" variant="outline" disabled={saving} onClick={()=>setIsEditMode(false)}>Cancel</Button><Button size="sm" className={actionPrimary} disabled={saving} onClick={async()=>{setSaving(true);try{await clientDetailsRef.current?.saveChanges();}finally{setSaving(false);}}}>{saving?"Saving…":"Save client"}</Button></>:client&&!isError&&<Button size="sm" variant="outline" onClick={()=>refetchClientData()}>Refresh client</Button>}<ActionsNavigation/></div>}/>
    <div data-client-workspace className="mx-auto w-full max-w-screen-2xl px-6 pb-10 pt-3 text-pl-ink md:px-8 md:pt-6 [&_input]:scroll-mt-56 [&_select]:scroll-mt-56 [&_button]:scroll-mt-56 [&_a]:scroll-mt-56">
      {isEditMode && saveError && <p role="alert" className="mb-4 text-sm text-pl-red-text">{saveError} Choose Save client to try again.</p>}
      <Link to={back} className="text-xs text-pl-text-2 underline underline-offset-4">Back to clients</Link>
      {isLoading&&!client?<p role="status" className="py-8 text-sm text-pl-text-2">Loading client workspace…</p>:isUnassignedCaseOwner?<section className="py-8"><h1 className="text-xl font-semibold">Client access is not assigned</h1><p className="mt-3 max-w-prose text-sm text-pl-text-2">Ask a Photon Admin for access before opening this client's information or work.</p>{requestAccessMutation.isSuccess?<p role="status" className="mt-5 text-sm">Access request sent. A Photon Admin must assign access before you can open this client.</p>:<Button size="sm" className={`mt-5 ${actionPrimary}`} disabled={requestAccessMutation.isPending} onClick={()=>requestAccessMutation.mutate()}>{requestAccessMutation.isPending?"Sending request…":"Request client access"}</Button>}{requestAccessMutation.isError&&<p role="alert" className="mt-3 text-sm text-pl-red-text">The access request could not be sent. Try again.</p>}</section>:isError||!client?<section className="py-8"><h1 className="text-xl font-semibold">Client workspace could not be loaded</h1><p className="mt-3 text-sm text-pl-text-2">Reload to check the client's information and setup.</p><Button size="sm" className={`mt-5 ${actionPrimary}`} onClick={()=>refetchClientData()}>Reload client</Button></section>:<>
        <header className="sticky top-16 z-10 my-2 border-b border-pl-border bg-pl-bg-subtle pb-2 md:my-5 md:pb-4"><p className="hidden text-xs text-pl-text-2 md:block">{clientRelationship(client)}</p><h1 className="mt-1 break-words text-lg font-semibold leading-tight md:mt-2 md:text-2xl">{client.name}</h1><div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-pl-text-2 md:mt-3 md:gap-3">{user.role==="PHOTON_ADMIN"?<Button size="sm" variant="outline" onClick={()=>setIsOwnerDialogOpen(true)}>Case Owner: {owners}</Button>:<p>Case Owner · {owners}</p>}{!isEditMode&&<Button size="sm" variant="outline" onClick={enterView} title={!client.is_active?"Client view is unavailable for an inactive client record.":client.onboarding?.admins.active===0?"A Workspace Admin must activate their invitation before client view is available.":undefined} disabled={!client.is_active || (client.onboarding && client.onboarding.admins.active===0)}>Enter client view</Button>}</div></header>
        {isEditMode?<ClientDetails ref={clientDetailsRef} clientData={client} clientId={clientId!} refetchClientData={refetchClientData} isEditMode onSaveError={setSaveError} onSaveComplete={()=>setIsEditMode(false)} onCancel={()=>setIsEditMode(false)}/>:<ClientTabs clientId={clientId!} clientData={client} clientTeam={client.User} caseOwnerName={owners} onChangeCaseOwner={user.role==="PHOTON_ADMIN"?()=>setIsOwnerDialogOpen(true):undefined} canManageTeam={!isUnassignedCaseOwner} onEditClient={()=>{setSaveError(null);setIsEditMode(true);}}/>}
      </>}
    </div>
    <Dialog open={isOwnerDialogOpen} onOpenChange={setIsOwnerDialogOpen}><DialogContent className="max-h-full overflow-y-auto border-pl-border bg-pl-bg text-pl-ink sm:max-w-md"><DialogHeader><DialogTitle>Assign Case Owner</DialogTitle><DialogDescription>Add a support owner for {client?.name}. Existing client assignments stay in place.</DialogDescription></DialogHeader><div className="divide-y divide-pl-border">{caseOwners.map((owner:any)=><Button key={owner.id} variant="ghost" className="h-auto w-full justify-between gap-3 rounded-none px-0 py-3 text-left" disabled={ownerMutation.isPending || owner.assigned_client_ids?.includes(clientId) || owner.status!=="ACTIVE"} onClick={()=>ownerMutation.mutate(owner,{onSuccess:()=>refetchClientData()})}><span className="min-w-0"><span className="block break-words text-sm font-medium">{owner.name}</span><span className="mt-1 block break-all text-xs text-pl-text-2">{owner.email}</span></span>{owner.assigned_client_ids?.includes(clientId)&&<span className="text-xs">Assigned</span>}</Button>)}</div>{ownerMutation.isError&&<p role="alert" className="text-sm text-pl-red-text">The assignment could not be saved. Select the Case Owner to try again.</p>}</DialogContent></Dialog>
    <Dialog open={isClientModeModalOpen} onOpenChange={setIsClientModeModalOpen}><DialogContent className="max-h-full overflow-y-auto border-pl-border bg-pl-bg text-pl-ink sm:max-w-lg"><DialogHeader><DialogTitle>Enter client view</DialogTitle><DialogDescription>Open {client?.name} as its Workspace Admin. Use Exit client view to return to your Photon Legal role.</DialogDescription></DialogHeader><p className="text-sm text-pl-text-2">Actions in client view are recorded with that workspace context.</p>{clientViewError&&<p role="alert" className="text-sm text-pl-red-text">Client view could not be opened. Your current role is unchanged; try again.</p>}<div className="flex justify-end gap-3"><Button size="sm" variant="outline" disabled={isLoggingInAsClient} onClick={()=>setIsClientModeModalOpen(false)}>Cancel</Button><Button size="sm" className={actionPrimary} disabled={isLoggingInAsClient} onClick={handleProceedToClientMode}>{isLoggingInAsClient?"Opening client view…":"Enter client view"}</Button></div></DialogContent></Dialog>
  </>;
};
export default ClientDetailPage;
