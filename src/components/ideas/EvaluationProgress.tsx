import { Loader2 } from "lucide-react";

/** Displays server state without inventing stage progress or search counts. */
export function EvaluationProgress({ reference, compact = false, state = "RUNNING", reEvaluating = false }: {
  reference?: string | null;
  evaluationId?: string | null;
  compact?: boolean;
  state?: string;
  reEvaluating?: boolean;
}) {
  return <div role="status" className={`min-w-0 ${compact ? "space-y-2" : "space-y-3 py-4"}`}>
    <p className="flex items-center gap-2 text-sm font-medium"><Loader2 className="size-4 shrink-0 motion-safe:animate-spin" />{state === "QUEUED" ? "Evaluation queued" : reEvaluating ? "Re-evaluating your disclosure" : "Evaluation in progress"}</p>
    <p className="text-sm text-pl-text-2">{state === "QUEUED" ? "Your request is waiting to start." : "Your disclosure is being evaluated against prior art."} You can keep editing or submit for review.</p>
    {reference && <p className="text-xs text-pl-text-3">{reference}</p>}
  </div>;
}
export default EvaluationProgress;
