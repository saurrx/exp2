import { Link } from "react-router-dom";
import { rawApi } from "@/lib/apiConfig";
import { actionPrimary, actionDate } from "@/components/actions/ActionsWorkspace";
import { colors } from "@/styles/tokens.tailwind";
import type { ClientSetup } from "./ClientBook";
import useUserCookie from "@/hooks/use-auth";
import { track } from "@/lib/analytics";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABEL } from "@/lib/roles";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useTheme } from "@/hooks/useTheme";
import API_CONFIG from "@/lib/apiConfig";
import { isUuid } from "@/lib/realAdapter";
import { MAX_FILE_SIZE } from "@/utils/constants";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Ban, BriefcaseBusiness, CalendarDays, Check, CircleAlert, CircleCheck, CircleX, Copy, Download, FileText, Globe2, Hash, History, Plus, RefreshCw, TrendingUp, Upload, UserPlus } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import React, { useRef, useState } from "react";
import { toast } from "@/lib/toast";
import AddPatentModal from "./AddPatentModal";
import DuplicatePatentsModal, { type MissingRequirement } from "./DuplicatePatentsModal";

type OverviewTabProps = {
  clientTeam: any[];
  clientId: string;
  clientData: any;
  caseOwnerName?: string;
  onChangeCaseOwner?: () => void;
  canManageTeam?: boolean;
  onEditClient?: () => void;
};

const OverviewTab: React.FC<OverviewTabProps> = ({ clientTeam = [], clientId, clientData, caseOwnerName, onChangeCaseOwner, canManageTeam, onEditClient }) => {
  const { user: sessionUser } = useUserCookie();
  // Off-assignment case owners see this page read-only: the server would 403
  // their writes anyway (client:configure is assignment-scoped through RLS),
  // and an editable field that cannot save is a lie.
  const readOnlyForCaseOwner =
    sessionUser?.role === "CASE_OWNER" &&
    !((sessionUser as any)?.assigned_client_ids ?? []).includes(clientId);
  // Import history comes from the PatentImport run records: one row per
  // portfolio upload, with the spreadsheet that produced it. (The predecessor
  // was a `patentFileHistory` prop reading a key the clean API has never
  // returned, so the button stayed hidden even right after an import; the prop
  // is gone.)
  const { data: importHistoryData, isError: historyError, refetch: refreshHistory } = useQuery({
    queryKey: ["client_import_history", clientId],
    queryFn: async () =>
      (await API_CONFIG.get(`/api/v1/clients/${clientId}/import-history`))?.data?.data,
  });
  const importHistory: any[] = Array.isArray(importHistoryData) ? importHistoryData : [];

  const { theme } = useTheme();
  const queryClient = useQueryClient();
  const [historyDialogOpen, setHistoryDialogOpen] = useState(false);
  const [showAddPatentModal, setShowAddPatentModal] = useState(false);
  const [duplicateModalOpen, setDuplicateModalOpen] = useState(false);
  const [duplicatePatents, setDuplicatePatents] = useState<any[]>([]);
  const [excelDuplicateEntries, setExcelDuplicateEntries] = useState<any[]>([]);
  const [errorCount, setErrorCount] = useState(0);
  const [successCount, setSuccessCount] = useState(0);
  const [updatedCount, setUpdatedCount] = useState(0);
  const [dueDatesCreated, setDueDatesCreated] = useState(0);
  const [unmappedColumns, setUnmappedColumns] = useState<string[]>([]);
  const [missingRequired, setMissingRequired] = useState<MissingRequirement[]>([]);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteMode, setInviteMode] = useState<"email" | "share">("email");
  const [inviteLinkCopied, setInviteLinkCopied] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<"INVENTOR" | "LEGAL_COUNSEL">("INVENTOR");
  const [referencePrefix, setReferencePrefix] = useState(
    clientData?.idea_reference_prefix || "IRN",
  );
  const qrCodeRef = useRef<SVGSVGElement>(null);

  React.useEffect(() => {
    setReferencePrefix(clientData?.idea_reference_prefix || "IRN");
  }, [clientData?.idea_reference_prefix]);

  const { data: metricsData } = useQuery({
    queryKey: ["client_metrics", clientId],
    queryFn: async () => {
      const response = await API_CONFIG.get(`/api/v1/clients/patent-metrics/${clientId}`);
      return response.status === 200 ? response.data : undefined;
    },
  });

  const { data: inviteLinkData } = useQuery({
    queryKey: ["client_invite_link", clientId],
    queryFn: async () => {
      const response = await API_CONFIG.get(`/api/v1/clients/${clientId}/invite-link`);
      return response.data.data;
    },
    // Photon roles carry the "photon-legal" sentinel rather than a client id;
    // asking for that client's link is a guaranteed 400.
    enabled: !!canManageTeam && isUuid(clientId),
  });

  const { mutate: uploadPatentFile, isPending: isUploadingPatentFile } = useMutation({
    mutationKey: ["upload_patent_file", clientId],
    mutationFn: async (file: File) => {
      const { s3UploadForImport } = await import("@/lib/api-service/s3Upload");
      const uploaded = await s3UploadForImport(file, "patent", clientId);
      // The API reads and parses the spreadsheet from storage, so all it needs
      // is which file. This used to send {key, originalName, size, contentType}
      // — none of which the endpoint declares, so the body was stripped to
      // nothing and every portfolio upload 400'd on a missing `rows` (F-060).
      const response = await API_CONFIG.post("/api/v1/patent/import", {
        file_id: uploaded.id, client_id: clientId,
      });
      return response.data;
    },
    onSuccess: (data: any) => {
      const patentData = data?.data;
      if (patentData) {
        setDuplicatePatents(patentData.duplicate_patents || []);
        setExcelDuplicateEntries(patentData.excel_duplicate_entries || []);
        setErrorCount(patentData.error_count || 0);
        setSuccessCount(patentData.success_count || 0);
        setUpdatedCount(patentData.updated_count || 0);
        setDueDatesCreated(patentData.due_dates_created || 0);
        setUnmappedColumns(patentData.unmapped_columns || []);
        setMissingRequired(patentData.missing_required || []);
        setDuplicateModalOpen(true);
      }
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client_metrics", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client_import_history", clientId] });
      // The deadlines this import just created are what the Due Dates and
      // Actions screens read; without this they show the pre-import docket
      // until something else happens to refetch.
      queryClient.invalidateQueries({ queryKey: ["due_dates"] });
      queryClient.invalidateQueries({ queryKey: ["actions"] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "An error occurred while uploading the file"),
  });

  const inviteMutation = useMutation({
    mutationFn: async () => API_CONFIG.post(`/api/v1/clients/${clientId}/invite-user`, { email: inviteEmail.trim(), role: inviteRole }),
    onSuccess: () => {
      toast.success(`${ROLE_LABEL[inviteRole] ?? "Inventor"} invitation sent`);
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("INVENTOR");
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
    },
    onError: (error: any) => toast.error(error?.response?.data?.message || "Could not send invitation"),
  });

  const regenerateInviteMutation = useMutation({
    mutationFn: async () => API_CONFIG.post(`/api/v1/clients/${clientId}/invite-link`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_invite_link", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
    },
  });

  const deactivateInviteMutation = useMutation({
    mutationFn: async () => // Revoke is by invite ID; `token` is the short CODE the URL/QR carry
      // — sending it here was the 'Invite not found' on every Deactivate.
      API_CONFIG.delete(`/api/v1/clients/${clientId}/invite-link/${inviteLinkData?.id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client_invite_link", clientId] });
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
    },
  });

  const referenceSettingsMutation = useMutation({
    mutationFn: async (prefix: string) =>
      API_CONFIG.put(`/api/v1/clients/${clientId}/reference-settings`, {
        prefix,
      }),
    onSuccess: (response: any) => {
      const savedPrefix = response?.data?.data?.idea_reference_prefix;
      if (savedPrefix) setReferencePrefix(savedPrefix);
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      queryClient.invalidateQueries({ queryKey: ["ideas"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard_ideas"] });
    },
    onError: (error: any) =>
      toast.error(
        error?.response?.data?.message || "Could not update the reference format",
      ),
  });

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size >= MAX_FILE_SIZE) {
      toast.error("File must be less than 1GB");
      return;
    }
    uploadPatentFile(file);
    event.target.value = "";
  };

  /**
   * Fetch the original spreadsheet behind an import.
   *
   * Goes through the API's presigned-download route rather than linking at the
   * bucket: the object is private, and the signed URL is short-lived by design.
   */
  const downloadImportFile = async (fileId: string, name: string) => {
    try {
      // rawApi, not the adapter: /v1/files/* is a new-style endpoint with
      // nothing to translate, and the adapter answers an unmapped path with a
      // synthetic 501 rather than passing it through.
      const { rawApi } = await import("@/lib/apiConfig");
      const { data } = await rawApi.get(`/v1/files/${fileId}/download`);
      const url = data?.url ?? data?.data?.url;
      if (!url) throw new Error("no url");
      const link = document.createElement("a");
      link.href = url;
      link.download = name || "portfolio";
      link.rel = "noopener";
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch {
      toast.error("Could not download that file");
    }
  };

  const formatDate = (value?: string) => value
    ? new Intl.DateTimeFormat("en-US", { year: "numeric", month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }).format(new Date(value))
    : "—";

  const inventorInviteLink = inviteLinkData?.token ? `${window.location.origin}/i/${inviteLinkData.token}` : "";
  const copyInventorInvite = async () => {
    await navigator.clipboard.writeText(inventorInviteLink);
    setInviteLinkCopied(true);
    toast.success("Inventor invite link copied");
    window.setTimeout(() => setInviteLinkCopied(false), 2000);
  };
  const qrCodeBlob = () => new Promise<Blob>((resolve, reject) => {
    const svg = qrCodeRef.current;
    if (!svg) return reject(new Error("QR unavailable"));
    const source = new XMLSerializer().serializeToString(svg);
    const image = new Image();
    const svgUrl = URL.createObjectURL(new Blob([source], { type: "image/svg+xml;charset=utf-8" }));
    image.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = 512;
      canvas.height = 512;
      const context = canvas.getContext("2d");
      if (!context) return reject(new Error("Canvas unavailable"));
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, canvas.width, canvas.height);
      context.drawImage(image, 24, 24, 464, 464);
      URL.revokeObjectURL(svgUrl);
      canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error("QR conversion failed")), "image/png");
    };
    image.onerror = reject;
    image.src = svgUrl;
  });
  const copyQrCode = async () => {
    try {
      const blob = await qrCodeBlob();
      await navigator.clipboard.write([new ClipboardItem({ "image/png": blob })]);
      toast.success("QR code copied as an image");
    } catch {
      toast.error("Your browser could not copy the QR image");
    }
  };
  const downloadQrCode = async () => {
    try {
      const blob = await qrCodeBlob();
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = `${clientData?.name || "client"}-inventor-invite.png`;
      anchor.click();
      URL.revokeObjectURL(url);
    } catch {
      toast.error("Could not download the QR code");
    }
  };
  const setup: ClientSetup | undefined = clientData?.onboarding;
  const uploadRef = useRef<HTMLInputElement>(null);
  const [readinessOpen, setReadinessOpen] = useState(false);
  const [clientSettingError, setClientSettingError] = useState("");
  const clientSettings = useMutation({
    mutationFn: async (changes: { confirm_onboarding?: boolean; is_active?: boolean; type?: string }) => {
      setClientSettingError("");
      return rawApi.patch(`/v1/clients/${clientId}`, changes);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["client", clientId] });
      queryClient.invalidateQueries({ queryKey: ["fetch_clients"] });
      setReadinessOpen(false);
    },
    onError: (error: any) => setClientSettingError(error?.response?.data?.message || "The change could not be saved. Try again."),
  });
  const openInvite = (role: "INVENTOR" | "LEGAL_COUNSEL", mode: "email" | "share" = "email") => {
    setInviteRole(role); setInviteMode(mode); setInviteDialogOpen(true); inviteMutation.reset();
  };
  const openHistory = () => { track("import_history_viewed", { client_id: clientId }); setHistoryDialogOpen(true); };
  const nextKey = setup?.next.key;
  const nextAction = () => {
    if (nextKey === "domain") onEditClient?.();
    else if (nextKey === "owner") onChangeCaseOwner?.();
    else if (nextKey === "admin") openInvite("LEGAL_COUNSEL");
    else if (nextKey === "inventors") openInvite("INVENTOR", "share");
    else if (nextKey === "portfolio") uploadRef.current?.click();
    else if (nextKey === "confirm") setReadinessOpen(true);
    else if (nextKey === "import-errors" || nextKey === "import-running") openHistory();
    else onEditClient?.();
  };
  const actionLabels: Record<string, string> = {domain:"Configure domain",owner:"Assign Case Owner",admin:"Invite Workspace Admin",inventors:"Set up invitations",portfolio:"Import portfolio",confirm:"Review readiness","import-errors":"Review import result","import-running":"Check import history",inactive:"Review client information"};
  const canChange = !readOnlyForCaseOwner;
  const detailClass = "border-t border-pl-border py-4";
  const summaryClass = "scroll-mt-56 cursor-pointer text-sm font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-pl-brand";
  const fieldClass = "mt-2 h-9 border-pl-border bg-pl-bg text-sm text-pl-ink";
  return <div className="min-w-0 text-pl-ink">
    <input ref={uploadRef} aria-label="Import client portfolio" type="file" className="hidden" accept=".xls,.xlsx,.csv" onChange={handleFileUpload} disabled={isUploadingPatentFile || !canChange}/>
    <section className="pb-6 pt-2">
      <h2 className="text-lg font-semibold">{setup?.next.title || "Review client setup"}</h2>
      <p className="mt-3 hidden max-w-prose text-sm leading-relaxed text-pl-text-2 md:block">{setup?.next.detail || "Review the domain, people and portfolio for this workspace."}</p>
      {nextKey === "ready" ? <Button asChild size="sm" className={`mt-4 ${actionPrimary}`}><Link to={`/patents?client=${encodeURIComponent(clientId)}`}>Open client portfolio</Link></Button> : nextKey === "owner" && !onChangeCaseOwner ? <p className="mt-4 text-sm text-pl-text-2">A Photon Admin can assign a Case Owner.</p> : <Button size="sm" onClick={nextAction} disabled={!canChange || isUploadingPatentFile} className={`mt-4 ${actionPrimary}`}>{isUploadingPatentFile ? "Importing portfolio…" : actionLabels[nextKey || ""] || "Review client information"}</Button>}
    </section>
    <details className={`${detailClass} scroll-mt-56`}>
      <summary className={summaryClass}>Setup evidence{setup ? ` · ${setup.steps.filter(step => step.done).length} of ${setup.steps.length} in place` : ""}</summary>
      <ul className="mt-4 space-y-3 text-sm">{setup?.steps.map(step => <li key={step.key} className="flex gap-3"><span className="text-pl-text-2">{step.done ? "✓" : "—"}</span><span>{step.label}<span className="ml-2 text-xs text-pl-text-2">{step.done ? "In place" : "Needed"}</span></span></li>)}</ul>
      {setup?.confirmed_at && <p className="mt-4 text-xs leading-relaxed text-pl-text-2">Readiness checked {actionDate(setup.confirmed_at)}{setup.confirmed_by ? ` by ${setup.confirmed_by}` : ""}. The steps above reflect the current workspace.</p>}
    </details>
    <details className={`${detailClass} scroll-mt-56`}>
      <summary className={summaryClass}>People and invitations{setup ? ` · ${setup.admins.active + setup.admins.invited} Workspace Admins · ${setup.inventors.active + setup.inventors.invited} inventors` : ""}</summary>
      <p className="mt-4 text-sm leading-relaxed text-pl-text-2">{setup ? `${setup.admins.active} active Workspace Admins, ${setup.admins.invited} invited. ${setup.inventors.active} active inventors, ${setup.inventors.invited} invited.` : "People invited to this workspace."}</p>
      {canManageTeam && <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => openInvite("LEGAL_COUNSEL")}>Invite Workspace Admin</Button><Button size="sm" variant="outline" onClick={() => openInvite("INVENTOR")}>Invite inventor</Button><Button size="sm" variant="outline" onClick={() => openInvite("INVENTOR", "share")}>Inventor invitation link</Button></div>}
      <ul className="mt-4 divide-y divide-pl-border">{clientTeam.map((member, index) => <li key={member.id || index} className="py-3 text-sm"><p className="break-words font-medium">{member.name || member.email}</p><p className="mt-1 break-words text-xs text-pl-text-2">{ROLE_LABEL[member.role] || "Inventor"} · {member.suspended || member.status === "SUSPENDED" ? "Inactive" : member.status === "INVITED" || member.active === false ? "Invited" : "Active"}</p><p className="mt-1 break-all text-xs text-pl-text-2">{member.email}</p></li>)}</ul>
    </details>
    <details className={`${detailClass} scroll-mt-56`}>
      <summary className={summaryClass}>Ideas, portfolio and upcoming work</summary>
      <p className="mt-4 text-sm text-pl-text-2">{setup ? `${setup.ideas.in_review} ideas in Workspace Admin review · ${setup.ideas.approved} approved · ${setup.ideas.filed} filed.` : "Review this client's portfolio and upcoming work."}</p>
      <div className="mt-4 flex flex-wrap gap-2"><Button asChild size="sm" variant="outline"><Link to={`/ideas?client=${encodeURIComponent(clientId)}&status=SEND_TO_OC`}>Open approved ideas</Link></Button><Button asChild size="sm" variant="outline"><Link to={`/ideas?client=${encodeURIComponent(clientId)}&status=FILED`}>Open filed ideas</Link></Button><Button asChild size="sm" variant="outline"><Link to={`/patents?client=${encodeURIComponent(clientId)}`}>View {setup?.patents ?? metricsData?.data?.total_patents ?? 0} patents</Link></Button></div>
      <h3 className="mt-6 text-sm font-medium">Upcoming Actions and dates</h3>
      {setup?.upcoming.length ? <ul className="mt-3 divide-y divide-pl-border">{setup.upcoming.map((event, index) => <li key={index} className="py-3"><Link to={event.href} className="text-sm underline decoration-pl-border-strong underline-offset-4">{event.title}</Link><p className="mt-2 text-xs text-pl-text-2">{event.reference} · {actionDate(event.due_at)}</p></li>)}</ul> : <p className="mt-3 text-sm text-pl-text-2">No upcoming dates recorded.</p>}
      <Button asChild size="sm" variant="outline" className="mt-4"><Link to={`/due-dates?client=${encodeURIComponent(clientId)}&filter=all`}>Open all client dates</Link></Button>
    </details>
    <details className={`${detailClass} scroll-mt-56`}>
      <summary className={summaryClass}>Portfolio imports</summary>
      <p className="mt-4 text-sm text-pl-text-2">{setup?.latest_import ? `${setup.latest_import.created} added · ${setup.latest_import.updated} updated · ${setup.latest_import.duplicates} duplicate rows · ${setup.latest_import.failed} failed` : "No import recorded. Upload a spreadsheet to add patent records and review any rows that need correction."}</p>
      <div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={openHistory}>Import history</Button>{canChange && <><Button size="sm" variant="outline" disabled={isUploadingPatentFile} onClick={() => uploadRef.current?.click()}>Import portfolio</Button><Button size="sm" variant="outline" onClick={() => setShowAddPatentModal(true)}>Add patent</Button></>}</div>
    </details>
    <details className={`${detailClass} scroll-mt-56`}>
      <summary className={summaryClass}>Client information and settings</summary>
      <dl className="mt-4 space-y-4 text-sm"><div><dt className="text-xs text-pl-text-2">Allowed domain</dt><dd className="mt-2 break-words">{clientData?.domain || clientData?.allowed_domain || "Not configured"}</dd></div><div><dt className="text-xs text-pl-text-2">About the client</dt><dd className="mt-2 whitespace-pre-wrap break-words">{clientData?.about || "No description recorded."}</dd></div></dl>
      {canChange && <Button size="sm" variant="outline" className="mt-4" onClick={onEditClient}>Edit client information</Button>}
      <div className="mt-6 border-t border-pl-border pt-4"><label htmlFor="reference-prefix" className="text-sm font-medium">Idea reference prefix</label><p className="mt-2 text-xs leading-relaxed text-pl-text-2">Used for new idea references. Existing references keep their number.</p><Input id="reference-prefix" value={referencePrefix} disabled={!canChange} onChange={event => setReferencePrefix(event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))} className={`${fieldClass} max-w-xs`}/><Button size="sm" variant="outline" className="mt-3" disabled={!canChange || referencePrefix.length < 2 || referencePrefix === clientData?.idea_reference_prefix || referenceSettingsMutation.isPending} onClick={() => referenceSettingsMutation.mutate(referencePrefix)}>{referenceSettingsMutation.isPending ? "Saving…" : "Save reference prefix"}</Button>{referenceSettingsMutation.isSuccess && <p role="status" className="mt-2 text-xs text-pl-text-2">Reference prefix saved.</p>}</div>
      {sessionUser?.role === "PHOTON_ADMIN" && <div className="mt-6 border-t border-pl-border pt-4"><label htmlFor="client-relationship" className="text-sm font-medium">Client relationship</label><select id="client-relationship" value={clientData?.type || "POTENTIAL"} onChange={event => clientSettings.mutate({type:event.target.value})} disabled={clientSettings.isPending} className="mt-2 block h-9 w-full max-w-xs rounded-sm border border-pl-border bg-pl-bg px-3 text-sm"><option value="POTENTIAL">Potential client</option><option value="EXISTING">Existing client</option></select><p className="mt-4 text-xs leading-relaxed text-pl-text-2">Inactive clients remain in client records. This record setting does not revoke existing user accounts.</p><Button size="sm" variant="outline" className="mt-3" disabled={clientSettings.isPending} onClick={() => clientSettings.mutate({is_active:!clientData?.is_active})}>{clientData?.is_active ? "Mark client inactive" : "Reactivate client record"}</Button></div>}
      {clientSettingError && <p role="alert" className="mt-3 text-sm text-pl-red-text">{clientSettingError}</p>}
    </details>
    <Dialog open={readinessOpen} onOpenChange={setReadinessOpen}><DialogContent className="max-h-screen overflow-y-auto border-pl-border bg-pl-bg text-pl-ink"><DialogHeader><DialogTitle>Confirm onboarding readiness</DialogTitle><DialogDescription>Record that the workspace setup has been reviewed. This check does not change anyone's access.</DialogDescription></DialogHeader><ul className="space-y-3 text-sm">{setup?.steps.map(step => <li key={step.key}>{step.done ? "✓" : "—"} {step.label}</li>)}</ul>{clientSettingError && <p role="alert" className="text-sm text-pl-red-text">{clientSettingError}</p>}<div className="flex flex-wrap justify-end gap-2"><Button size="sm" variant="outline" onClick={() => setReadinessOpen(false)}>Cancel</Button><Button size="sm" className={actionPrimary} disabled={clientSettings.isPending || !setup?.steps.every(step => step.done)} onClick={() => clientSettings.mutate({confirm_onboarding:true})}>{clientSettings.isPending ? "Saving…" : "Confirm readiness"}</Button></div></DialogContent></Dialog>
    <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
      <DialogContent className="max-h-screen overflow-y-auto border-pl-border bg-pl-bg text-pl-ink sm:max-w-xl">
        <DialogHeader><DialogTitle>{inviteMode === "share" ? "Inventor invitation link" : `Invite ${inviteRole === "LEGAL_COUNSEL" ? "Workspace Admin" : "inventor"}`}</DialogTitle><DialogDescription>{clientData?.name} · Allowed domain: {clientData?.domain || clientData?.allowed_domain || "not configured"}</DialogDescription></DialogHeader>
        {inviteMode === "email" ? <form onSubmit={event => {event.preventDefault(); inviteMutation.mutate();}} className="space-y-4"><label className="block text-sm font-medium" htmlFor="team-email">Email address<Input id="team-email" autoFocus type="email" required value={inviteEmail} onChange={event => setInviteEmail(event.target.value)} className={fieldClass}/></label><p className="text-xs leading-relaxed text-pl-text-2">{inviteRole === "LEGAL_COUNSEL" ? "Workspace Admins review submitted ideas and support participation. Invitations are sent to the named email address." : "Inventors can submit ideas and view the company portfolio."}</p>{inviteMutation.isError && <p role="alert" className="text-sm text-pl-red-text">{(inviteMutation.error as any)?.response?.data?.message || "Invitation could not be sent. Check the email and retry."}</p>}<div className="flex flex-wrap justify-end gap-2"><Button type="button" variant="outline" size="sm" onClick={() => setInviteDialogOpen(false)}>Cancel</Button><Button type="submit" size="sm" className={actionPrimary} disabled={!inviteEmail.trim() || inviteMutation.isPending}>{inviteMutation.isPending ? "Sending…" : "Send invitation"}</Button></div></form> : <div>
          <p className="text-sm leading-relaxed text-pl-text-2">The shared link invites inventors from the allowed domain. Workspace Admin invitations are sent by email.</p>
          {inviteLinkData?.active ? <><div className="mt-4 flex flex-wrap items-start gap-5"><QRCodeSVG ref={qrCodeRef} value={inventorInviteLink} className="h-32 w-32 shrink-0" level="M" marginSize={4} bgColor={colors.pl.bg} fgColor={colors.pl.ink} title="Inventor invitation QR code"/><div className="min-w-0 flex-1"><p className="break-all text-xs leading-relaxed text-pl-text-2">{inventorInviteLink}</p><p className="mt-3 text-xs text-pl-text-2">Expires {actionDate(inviteLinkData.expires_at)}</p><Button size="sm" className={`mt-4 ${actionPrimary}`} onClick={copyInventorInvite}>{inviteLinkCopied ? "Invite link copied" : "Copy invite link"}</Button></div></div><div className="mt-4 flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={copyQrCode}>Copy QR</Button><Button size="sm" variant="outline" onClick={downloadQrCode}>Download QR</Button></div><div className="mt-5 flex flex-wrap gap-2 border-t border-pl-border pt-4"><Button size="sm" variant="outline" disabled={regenerateInviteMutation.isPending} onClick={() => window.confirm("Generate a new link? The current link and QR code will stop working.") && regenerateInviteMutation.mutate()}>Replace link</Button><Button size="sm" variant="outline" disabled={deactivateInviteMutation.isPending} onClick={() => window.confirm("Deactivate this invitation link? New inventors will no longer be able to join through it.") && deactivateInviteMutation.mutate()}>Deactivate link</Button></div></> : <div className="mt-5 border-t border-pl-border pt-4"><h3 className="text-sm font-medium">No active invitation link</h3><p className="mt-2 text-sm text-pl-text-2">Create a link before sharing it with inventors.</p><Button size="sm" disabled={regenerateInviteMutation.isPending || !canChange} className={`mt-4 ${actionPrimary}`} onClick={() => regenerateInviteMutation.mutate()}>{regenerateInviteMutation.isPending ? "Creating…" : "Create invitation link"}</Button></div>}
          {(regenerateInviteMutation.isError || deactivateInviteMutation.isError) && <p role="alert" className="mt-3 text-sm text-pl-red-text">The invitation link could not be changed. Try again.</p>}
        </div>}
      </DialogContent>
    </Dialog>
    <Dialog open={historyDialogOpen} onOpenChange={setHistoryDialogOpen}><DialogContent className="max-h-screen overflow-y-auto border-pl-border bg-pl-bg text-pl-ink sm:max-w-2xl"><DialogHeader><DialogTitle>Portfolio import history</DialogTitle><DialogDescription>Files imported into {clientData?.name}. Review the result before confirming readiness.</DialogDescription></DialogHeader><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => {refreshHistory(); queryClient.invalidateQueries({queryKey:["client",clientId]});}}>Refresh history</Button>{canChange && <Button size="sm" className={actionPrimary} disabled={isUploadingPatentFile} onClick={() => uploadRef.current?.click()}>{isUploadingPatentFile ? "Importing…" : "Import corrected file"}</Button>}</div>{historyError ? <p role="alert" className="text-sm text-pl-red-text">Import history could not be loaded. Refresh to try again.</p> : !importHistory.length ? <p className="text-sm text-pl-text-2">No imports recorded yet.</p> : <ul className="divide-y divide-pl-border">{importHistory.map(row => <li key={row.id} className="py-4"><p className="break-words text-sm font-medium">{row.file?.original_name || "Portfolio import"}</p><p className="mt-2 text-xs text-pl-text-2">{formatDate(row.completed_at || row.created_at)} · {row.imported_by?.name || "User not recorded"}</p><p className="mt-2 text-sm text-pl-text-2">{row.status === "RUNNING" ? "Import in progress" : `${row.created_count ?? 0} added · ${row.updated_count ?? 0} updated · ${row.unchanged_count ?? 0} unchanged · ${row.duplicate_in_file ?? 0} duplicates · ${row.failed_count ?? 0} failed`}</p>{row.unmapped_columns?.length > 0 && <p className="mt-2 break-words text-xs text-pl-text-2">Columns not imported: {row.unmapped_columns.join(", ")}</p>}{row.file?.id && <Button size="sm" variant="outline" className="mt-3" onClick={() => downloadImportFile(row.file.id, row.file.original_name)}>Download source file</Button>}</li>)}</ul>}{!!setup?.latest_import?.errors?.length && <div className="border-t border-pl-border pt-4"><h3 className="text-sm font-medium">Rows to correct in the latest import</h3><ul className="mt-3 space-y-2 text-xs text-pl-text-2">{setup.latest_import.errors.map((error,index) => <li key={index}>Row {error.row}: {error.message}</li>)}</ul></div>}</DialogContent></Dialog>
    <DuplicatePatentsModal open={duplicateModalOpen} onOpenChange={open => {setDuplicateModalOpen(open); if (!open) queryClient.invalidateQueries({queryKey:["client",clientId]});}} duplicatePatents={duplicatePatents} excelDuplicateEntries={excelDuplicateEntries} errorCount={errorCount} successCount={successCount} updatedCount={updatedCount} dueDatesCreated={dueDatesCreated} unmappedColumns={unmappedColumns} missingRequired={missingRequired}/>
    {showAddPatentModal && <AddPatentModal open={showAddPatentModal} onOpenChange={setShowAddPatentModal} clientId={clientId} onAdded={() => {queryClient.invalidateQueries({queryKey:["client",clientId]}); queryClient.invalidateQueries({queryKey:["client_metrics",clientId]});}}/>}
  </div>;
};
export default OverviewTab;
