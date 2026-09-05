import { Button } from "@/components/ui/button";
import PatentWorldMap from "@/components/PatentWorldMap";

export type InventorHomeSummary = {
  pipeline: { draft: number; review: number; changes: number; sent: number; filed: number; declined: number };
  company: { submitted_this_quarter: number; reached_filing: number };
};

/** Secondary context for the Inventor, from scoped server aggregates. */
export default function InventorHomeContext({ summary, loading, hasError, onRetry, onPatents, total, granted, pending, jurisdictions, onExpandMap }: {
  summary?: InventorHomeSummary;
  loading: boolean;
  hasError: boolean;
  onRetry: () => void;
  onPatents: () => void;
  total: number;
  granted: number;
  pending: number;
  jurisdictions: number;
  onExpandMap: () => void;
}) {
  const stages = summary ? [
    ["In draft", summary.pipeline.draft], ["In review", summary.pipeline.review],
    ["Changes requested", summary.pipeline.changes], ["Sent to Photon Legal", summary.pipeline.sent],
    ["Filed", summary.pipeline.filed], ["Not proceeding", summary.pipeline.declined],
  ] as const : [];
  return <div className="col-span-12 min-w-0 space-y-10">
    {hasError || (!loading && !summary) ? <div className="flex flex-wrap items-center gap-3 border-t border-[var(--pulse-line)] pt-5 text-sm">
      <p>Company and pipeline summary unavailable.</p><Button size="sm" variant="outline" onClick={onRetry}>Retry summary</Button>
    </div> : loading ? <div role="status" aria-label="Loading summary"><span aria-hidden="true" className="block rounded-sm bg-muted motion-safe:animate-pulse h-16 w-full" /></div> : <>
      <section aria-labelledby="my-pipeline-heading" className="border-t border-[var(--pulse-line)] pt-5">
        <div className="flex items-center justify-between gap-4"><h2 id="my-pipeline-heading" className="text-base font-semibold">My pipeline</h2></div>
        <dl className="mt-3 flex flex-wrap gap-x-8 gap-y-3 text-sm">{stages.filter(([, count]) => count > 0).map(([label, count]) => <div key={label} className="flex gap-2"><dt className="text-[var(--pulse-ink-muted)]">{label}</dt><dd className="font-semibold tabular-nums text-[var(--pl-navy-2)]">{count}</dd></div>)}</dl>
        {stages.every(([, count]) => count === 0) && <p className="text-sm text-[var(--pulse-ink-muted)]">Your progress will appear as your ideas move forward.</p>}
      </section>
      <section aria-labelledby="company-momentum-heading" className="border-t border-[var(--pulse-line)] pt-6">
        <h2 id="company-momentum-heading" className="text-base font-semibold">Innovation across your company</h2>
        <p className="mt-2 text-sm text-[var(--pulse-ink-muted)]">Every contribution helps build the company’s portfolio.</p>
        <dl className="mt-5 flex flex-wrap gap-x-12 gap-y-4">
          <div><dd className="text-2xl font-semibold tabular-nums text-[var(--pl-navy-2)]">{summary?.company.submitted_this_quarter}</dd><dt className="mt-1 text-sm text-[var(--pulse-ink-muted)]">Ideas submitted this quarter</dt></div>
          <div><dd className="text-2xl font-semibold tabular-nums text-[var(--pl-navy-2)]">{summary?.company.reached_filing}</dd><dt className="mt-1 text-sm text-[var(--pulse-ink-muted)]">Ideas that reached filing · all time</dt></div>
        </dl>
      </section>
    </>}
    <section aria-labelledby="company-patents-heading" className="min-w-0 border-t border-[var(--pulse-line)] pt-6">
      <div className="mb-5 flex flex-wrap items-center justify-between gap-3"><div>
        <h2 id="company-patents-heading" className="text-base font-semibold">Company patent portfolio</h2>
        {!hasError && !loading && <p className="mt-2 text-sm text-[var(--pulse-ink-muted)]">{granted} granted · {pending} pending · Browse the company’s patents for context and inspiration.</p>}
      </div><Button size="sm" variant="outline" onClick={onPatents}>Explore patents</Button></div>
      {!hasError && <PatentWorldMap totalPatents={total} isPatentDialogOpen={false} setIsPatentDialogOpen={onExpandMap} v0={{ title: "Patents worldwide", subtitle: loading ? "Loading the company portfolio…" : `${total} patents · ${jurisdictions} jurisdictions` }} />}
    </section>
  </div>;
}
