import React from "react";
import { useMutation } from "@tanstack/react-query";
import API_CONFIG from "@/lib/apiConfig";
import { s3UploadForImport } from "@/lib/api-service/s3Upload";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";

type Result = { created_count: number; updated_count: number; unchanged_count: number; failed_count: number; errors?: Array<{ row: number; message: string }>; unmapped_columns?: string[] };
export default function PortfolioImport({ open, onOpenChange, clients, selectedClientId, onImported }: { open: boolean; onOpenChange: (open: boolean) => void; clients: Array<{ id: string; name: string }>; selectedClientId?: string; onImported: () => void }) {
  const [clientId, setClientId] = React.useState(selectedClientId || "");
  const [file, setFile] = React.useState<File | null>(null);
  const [result, setResult] = React.useState<Result | null>(null);
  const [error, setError] = React.useState("");
  React.useEffect(() => { if (open) { setClientId(selectedClientId || ""); setFile(null); setResult(null); setError(""); } }, [open, selectedClientId]);
  const upload = useMutation({ mutationFn: async () => {
    if (!file || !clientId) throw new Error("Choose a client and portfolio file.");
    const stored = await s3UploadForImport(file, "patent", clientId);
    return (await API_CONFIG.post("/api/v1/patent/import", { file_id: stored.id, client_id: clientId })).data.data as Result;
  }, onSuccess: value => { setResult(value); setError(""); onImported(); }, onError: () => setError("The portfolio could not be imported. Your file and client selection are retained. Try again.") });
  return <Dialog open={open} onOpenChange={value => { if (!upload.isPending) onOpenChange(value); }}><DialogContent className={`max-h-full overflow-y-auto bg-pl-bg text-pl-ink ${upload.isPending ? "[&>button:last-child]:hidden" : ""}`} aria-busy={upload.isPending}><DialogHeader><DialogTitle>{result ? "Portfolio import result" : "Import patents"}</DialogTitle><DialogDescription>{result ? clients.find(client => client.id === clientId)?.name || "Selected client" : "Choose the client whose patent records this file should update."}</DialogDescription></DialogHeader>
    {result ? <div><p role="status" className="text-sm font-semibold">{result.failed_count ? "Imported with rows to review" : "Portfolio imported"}</p><dl className="mt-4 grid grid-cols-2 gap-4 text-sm">{[["Created",result.created_count],["Updated",result.updated_count],["Unchanged",result.unchanged_count],["Not imported",result.failed_count]].map(([label,count]) => <div key={label}><dt className="text-pl-text-3">{label}</dt><dd className="mt-1 font-semibold tabular-nums">{count}</dd></div>)}</dl>{!!result.errors?.length && <details className="mt-4" open><summary className="cursor-pointer text-sm font-semibold">Rows to correct</summary><ul className="mt-2 space-y-2 text-sm text-pl-text-2">{result.errors.map(row => <li key={row.row}>Row {row.row}: {row.message}</li>)}</ul><p className="mt-3 text-sm text-pl-text-2">Correct the reported rows in the source file before importing it again.</p></details>}{!!result.unmapped_columns?.length && <p className="mt-3 text-sm text-pl-text-2">Columns not mapped: {result.unmapped_columns.join(", ")}</p>}</div>
    : <div className="space-y-4"><label className="block text-sm font-medium">Client<select aria-label="Import client" disabled={upload.isPending} value={clientId} onChange={event => setClientId(event.target.value)} className="mt-2 h-9 w-full rounded-sm border border-pl-border bg-pl-bg px-3"><option value="">Choose client</option>{clients.map(client => <option key={client.id} value={client.id}>{client.name}</option>)}</select></label><label className="block text-sm font-medium">Portfolio file<input aria-label="Portfolio file" type="file" accept=".csv,.xlsx,.xls" disabled={upload.isPending} onChange={event => setFile(event.target.files?.[0] || null)} className="mt-2 block w-full min-w-0 text-sm" /></label><p className="text-sm text-pl-text-2">Excel or CSV. The result will show which records were added, updated or could not be imported.</p></div>}
    {error && <p role="alert" className="text-sm text-pl-red">{error}</p>}{upload.isPending && <p role="status" className="text-sm">Importing portfolio…</p>}
    <DialogFooter>{result ? <Button size="sm" className="bg-pl-brand text-pl-ink hover:bg-pl-brand-deep" onClick={() => onOpenChange(false)}>Return to portfolio</Button> : <><Button size="sm" variant="outline" disabled={upload.isPending} onClick={() => onOpenChange(false)}>Cancel</Button><Button size="sm" disabled={!file || !clientId || upload.isPending} className="bg-pl-brand text-pl-ink hover:bg-pl-brand-deep" onClick={() => upload.mutate()}>Import portfolio</Button></>}</DialogFooter>
  </DialogContent></Dialog>;
}
