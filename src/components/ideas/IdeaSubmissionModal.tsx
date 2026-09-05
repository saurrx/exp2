import React, { useEffect, useRef, useState } from "react";
import { Upload, X, ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@tanstack/react-query";
import API_CONFIG, { rawApi } from "@/lib/apiConfig";
import { extractDocumentText } from "@/lib/documentText";
import useUserCookie from "@/hooks/use-auth";
import { track } from "@/lib/analytics";
import { disclosureSections, storedDisclosure, supportedPrefill } from "./disclosureMaterial";

interface IdeaSubmissionModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  refetchIdeas: () => void;
}

const IdeaSubmissionModal: React.FC<IdeaSubmissionModalProps> = ({ open, onOpenChange, refetchIdeas }) => {
  const navigate = useNavigate();
  const { user } = useUserCookie();
  const [title, setTitle] = useState("");
  const [sourceFiles, setSourceFiles] = useState<File[]>([]);
  const [sourceText, setSourceText] = useState("");
  const [isDragOver, setIsDragOver] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [stage, setStage] = useState("");
  const [inventorId, setInventorId] = useState("");
  const [duplicateAccepted, setDuplicateAccepted] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  // Retain successful create steps so retrying a later failure does not create another idea.
  const createdRef = useRef<{ ideaId?: string; draftId?: string }>({});
  const onBehalf = user?.role === "LEGAL_COUNSEL";
  const { data: roster } = useQuery({ queryKey: ["start_idea_inventors", user?.client_id], enabled: open && onBehalf && !!user?.client_id,
    queryFn: async () => (await rawApi.get(`/v1/ideas/colleagues?client_id=${user?.client_id}`)).data });
  const { data: existingIdeas } = useQuery({ queryKey: ["start_idea_duplicates"], enabled: open,
    queryFn: async () => (await rawApi.get("/v1/ideas")).data });
  const duplicate = (Array.isArray(existingIdeas) ? existingIdeas : []).find((idea: any) => idea.title?.trim().toLowerCase() === title.trim().toLowerCase() && idea.id !== createdRef.current.ideaId);

  useEffect(() => { if (open) track("idea_create_opened"); }, [open]);
  const resetForm = () => { setTitle(""); setSourceFiles([]); setSourceText(""); setError(null); setStage(""); setInventorId(""); setDuplicateAccepted(false); createdRef.current = {}; };

  const { isPending: isCreatingIdea, mutateAsync: createIdea } = useMutation({
    mutationKey: ["create_idea"],
    mutationFn: async ({ silent }: { silent: boolean }) => {
      setError(null);
      setStage("Reading your material…");
      const parts = [sourceText.trim()];
      for (const file of sourceFiles) parts.push((await extractDocumentText(file)).text);
      const text = parts.filter(Boolean).join("\n\n");
      setStage("Saving your draft…");
      if (!createdRef.current.ideaId) {
        const response = onBehalf
          ? { data: { data: (await rawApi.post("/v1/ideas", { title: title.trim(), inventor_id: inventorId })).data } }
          : await API_CONFIG.post("/api/v1/idea/create", { title: title.trim(), inventors: [] });
        createdRef.current.ideaId = response.data.data.id;
      }
      if (!createdRef.current.draftId) {
        const res = await API_CONFIG.post("/api/v1/idea/create-new/draft", {
          idea_id: createdRef.current.ideaId,
          answers: storedDisclosure(disclosureSections(), { text, files: sourceFiles.map((file) => file.name) }),
        });
        createdRef.current.draftId = res.data.data.id;
      }
      if (text && !silent) {
        setStage("Organising supported answers…");
        const response = await API_CONFIG.post(`/api/v1/idea/autofill/${createdRef.current.draftId}`, { text });
        const meta = supportedPrefill([], response.data.data?.answers ?? {});
        // The existing draft API stores the questionnaire and source together.
        await rawApi.patch(`/v1/drafts/${createdRef.current.draftId}`, { answers: storedDisclosure(meta, { text, files: sourceFiles.map((file) => file.name) }) });
      }
      track("idea_created", { idea_id: createdRef.current.ideaId });
      refetchIdeas();
      if (!silent) navigate(`/ideas/${createdRef.current.ideaId}/draft?draftId=${createdRef.current.draftId}`);
    },
    onError: (err: any) => setError(err?.response?.data?.message || err?.message || "Could not create the disclosure. Your material is still here; try again."),
  });
  const finish = async (silent: boolean) => {
    try { await createIdea({ silent }); resetForm(); onOpenChange(false); } catch { /* Material stays in the open dialog. */ }
  };
  const handleOpenChange = (next: boolean) => {
    if (next) { onOpenChange(true); return; }
    if (isCreatingIdea) return;
    if (title.trim() && (!onBehalf || inventorId)) { void finish(true); return; }
    // Closing an untitled intake retains its material for the next open.
    onOpenChange(false);
  };
  const acceptFiles = (files: FileList | null) => {
    if (!files) return;
    setError(null);
    for (const file of Array.from(files)) {
      if (!/\.(pdf|docx|txt|md)$/i.test(file.name)) { setError("Use PDF, DOCX, TXT or Markdown. For slides, use the “Paste notes or describe your idea” field."); continue; }
      setSourceFiles((prev) => prev.some((f) => f.name === file.name) ? prev : [...prev, file]);
    }
  };

  return <Dialog open={open} onOpenChange={handleOpenChange}>
    <DialogContent data-start-idea className="flex max-h-full flex-col overflow-hidden p-0 sm:max-w-xl">
      <DialogHeader className="shrink-0 px-6 pb-3 pt-6"><DialogTitle className="text-xl">Start an idea</DialogTitle><DialogDescription>Start with what you already have. Pulse organises it into a disclosure for you to review.</DialogDescription></DialogHeader>
      <form className="flex min-h-0 flex-col" onSubmit={(e) => { e.preventDefault(); if (title.trim() && (!onBehalf || inventorId) && !isCreatingIdea) void finish(false); }}>
        <div className="min-h-0 space-y-4 overflow-y-auto px-6 pb-5">
          <div onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }} onDragLeave={(e) => { if (!e.currentTarget.contains(e.relatedTarget as Node)) setIsDragOver(false); }} onDrop={(e) => { e.preventDefault(); setIsDragOver(false); acceptFiles(e.dataTransfer.files); }} className={`rounded-md border border-dashed p-4 ${isDragOver ? "border-pl-blue bg-pl-blue-tint" : "border-pl-border-strong bg-pl-bg-subtle"}`}>
            <label htmlFor="idea-material" className="text-sm font-medium">{isDragOver ? "Drop your document here" : "Paste notes or describe your idea"}</label>
            <textarea autoFocus id="idea-material" rows={4} value={sourceText} onChange={(e) => setSourceText(e.target.value)} className="ph-no-capture mt-2 w-full resize-y rounded-sm border border-pl-border bg-background p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-ring" placeholder="A rough description, meeting notes or an existing write-up…" />
            <div className="mt-2 flex flex-wrap items-center gap-3"><Button size="sm" variant="outline" type="button" onClick={() => fileInputRef.current?.click()}><Upload />Upload document</Button><span className="text-xs text-pl-text-3">PDF, DOCX, TXT, Markdown</span></div>
            <input aria-label="Upload source document" ref={fileInputRef} type="file" multiple accept=".pdf,.docx,.txt,.md" className="hidden" onChange={(e) => { acceptFiles(e.target.files); e.target.value = ""; }} />
            {sourceFiles.map((file) => <div key={file.name} className="mt-2 flex min-w-0 items-center justify-between gap-2 text-sm"><span className="truncate">{file.name}</span><Button type="button" size="sm" variant="ghost" aria-label={`Remove ${file.name}`} onClick={() => setSourceFiles((files) => files.filter((f) => f !== file))}><X /></Button></div>)}
          </div>
          <div><label htmlFor="idea-title" className="text-sm font-medium">Working title <span className="ml-2 font-normal text-pl-text-3">Required</span></label><Input id="idea-title" name="title" value={title} onChange={(e) => { setTitle(e.target.value); setDuplicateAccepted(false); }} className="mt-2" placeholder="What would you call it when telling a colleague?" required /></div>
          {onBehalf && <div><label htmlFor="primary-inventor" className="text-sm font-medium">Inventor</label><select id="primary-inventor" value={inventorId} onChange={(e) => setInventorId(e.target.value)} required className="mt-2 h-10 w-full rounded-sm border border-pl-border bg-background px-3 text-sm"><option value="">Choose the inventor</option>{(roster ?? []).map((person: any) => <option key={person.id} value={person.id}>{person.name}</option>)}</select><p className="mt-1 text-xs text-pl-text-3">You will be recorded separately as Submitted by.</p></div>}
          {duplicate && !duplicateAccepted && <div role="status" className="rounded-sm bg-pl-amber-tint p-3 text-sm"><p>An idea with this title already exists: {duplicate.reference || duplicate.reference_number}.</p><div className="mt-2 flex flex-wrap gap-2"><Button size="sm" variant="outline" type="button" onClick={() => { resetForm(); onOpenChange(false); navigate(`/ideas/${duplicate.id}`); }}>Open existing idea</Button><Button size="sm" variant="ghost" type="button" onClick={() => setDuplicateAccepted(true)}>Create a separate idea</Button></div></div>}
          <p className="text-xs text-pl-text-3">Material stays in your workspace. Only supported answers are prefilled; you supply what makes the idea different. You can also start with just a title.</p>
          {isCreatingIdea && <p role="status" className="text-sm text-pl-blue-text motion-safe:animate-pulse">{stage}</p>}
          {error && <p role="alert" className="text-sm text-pl-red-text">{error}</p>}
        </div>
        <div className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-pl-border px-6 py-4"><p className="text-xs text-pl-text-3">Creates a draft. Review comes later.</p><Button size="sm" type="submit" disabled={!title.trim() || isCreatingIdea || (onBehalf && !inventorId) || (!!duplicate && !duplicateAccepted)}>{isCreatingIdea ? "Preparing disclosure…" : "Continue to disclosure"}<ArrowRight /></Button></div>
      </form>
    </DialogContent>
  </Dialog>;
};
export default IdeaSubmissionModal;
