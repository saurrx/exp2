import {
  AlertCircle,
  CheckCircle,
  ChevronDown,
  ChevronRight,
  ExternalLink,
  FileText,
  InfoIcon,
} from "lucide-react";
import { Card } from "../ui/card";
import { Progress } from "../ui/progress";
import { Separator } from "../ui/separator";
import ConciseEvaluationReport from "./DownloadReport";
import { Button } from "../ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "../ui/dialog";
import { Input } from "../ui/input";
import API_CONFIG from "@/lib/apiConfig";
import React from "react";
import { useMutation } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import { useTheme } from "@/hooks/useTheme";
import { track } from "@/lib/analytics";

// Extended interfaces for the report
interface ScoringResult {
  score: number | null;
  score_meta_data: any;
  evaluationId?: string;
  summary: string;
  // Result-level, from synthesise.ts — one set per evaluation, not per card.
  overlappingConcepts?: string[];
  distinctDifferences?: string[];
  noveltyScore: number | null;
  similarityScore: number | null;
  confidenceLevel: string;
  scoringMethod?: string;
  detailedAnalysis: {
    marketScore: number | null;
    technicalScore: number | null;
    feasibilityScore: number | null;
    implementationScore: number | null;
    directNoveltyScore?: number;
    confidenceFactors?: {
      dataQuality: number;
      dataPrecision: number;
      evaluationCount: number;
      technicalCoverage: number;
    };
  };
  evaluationMetrics: {
    evaluationCount: number;
    maxSimilarity: number;
    avgSimilarity: number;
  };
  closestMatchesSummary?: Array<{
    score: number;
    title: string;
    noveltyScore: number;
    keySimilarities: string[];
    publicationNumber?: string;
    distinctDifferences: string[];
    overlappingConcepts: string[];
  }>;
  closestMatches: Array<{
    title: string;
    abstract: string;
    publicationNumber: string;
    score: number;
    analysis: string;
    url: string;
    noveltyScore: number;
    keySimilarities: string[];
    distinctDifferences: string[];
    overlappingConcepts: string[];
  }>;
  recommendations: string[];
}

interface PriorArt {
  url: string;
  title: string;
  abstract: string;
  publicationNumber?: string;
}

interface PatentNoveltyReportProps {
  scoringResult: ScoringResult;
  api_evaluation_id: string;
  priorArt: PriorArt[];
  title: string;
  report: {
    id: string;
    score: number;
    report: string;
    status: string;
    createdAt: string;
    updatedAt: string;
    scoringResult: ScoringResult;
  };
  embedded?: boolean;
  expandFirstReference?: boolean;
  /** The idea's human reference, e.g. DEMO07 — shown instead of an id. */
  reference?: string;
}

export default function PatentNoveltyReport({
  scoringResult,
  priorArt,
  title,
  report,
  api_evaluation_id,
  embedded = false,
  expandFirstReference = false,
  reference,
}: PatentNoveltyReportProps) {
  const { theme } = useTheme();
  // Report rendered — id only, never the report body or prior-art text. Skip the
  // embedded (inline) render so only a real full-report view counts.
  React.useEffect(() => {
    if (!embedded) track("evaluation_report_opened", { evaluation_id: api_evaluation_id });
  }, [embedded, api_evaluation_id]);
  const [reEvalOpen, setReEvalOpen] = React.useState(false);
  const [patentInput, setPatentInput] = React.useState("");
  // First prior-art reference expanded by default; the rest collapse to rows.
  const [expandedArts, setExpandedArts] = React.useState<Set<number>>(
    () => new Set(expandFirstReference ? [0] : [])
  );
  const [summaryExpanded, setSummaryExpanded] = React.useState(false);
  // A patent abstract is one unbroken paragraph and routinely runs past 1,500
  // characters, which pushed Key Similarities and the novelty bar below the
  // fold — the reader saw an abstract and concluded that was all there was.
  // Clamped by default, per reference, with the full text one click away.
  const [expandedAbstracts, setExpandedAbstracts] = React.useState<Set<number>>(
    () => new Set()
  );
  const ABSTRACT_CLAMP = 320;
  const toggleAbstract = (i: number) =>
    setExpandedAbstracts((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  const toggleArt = (i: number) =>
    setExpandedArts((prev) => {
      const next = new Set(prev);
      if (next.has(i)) next.delete(i);
      else next.add(i);
      return next;
    });
  const {
    mutate: reEvalMutate,
    isPending: isReEvalLoading,
    error: reEvalError,
    reset: resetReEval,
  } = useMutation({
    mutationKey: ["re_evaluate_patent", api_evaluation_id],
    mutationFn: async (patentNumbers: string[]) => {
      const response = await API_CONFIG.post(
        `/api/v1/idea/re-evaluate/${api_evaluation_id}`,
        { patent_numbers: patentNumbers }
      );
      return response.data;
    },
    onSuccess: () => {
      // Evaluation id only — never the patent numbers the reviewer typed.
      track("re_evaluation_started", { evaluation_id: api_evaluation_id });
      setReEvalOpen(false);
      setPatentInput("");
    },
    onError: (err: any) => {
      toast.error(
        err?.response?.data?.message ||
          "Failed to re-evaluate. Please try again."
      );
    },
  });

  const handleReEvalSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    resetReEval();
    // Split by comma or newline, trim, and filter empty
    const patentNumbers = patentInput
      .split("\n")
      .map((s) => s.trim())
      .filter(Boolean);
    if (patentNumbers.length === 0) {
      toast.error("Please enter at least one patent number.");
      return;
    }
    reEvalMutate(patentNumbers);
  };

  const rawScore = scoringResult?.score;
  const score = typeof rawScore === "number" ? rawScore / 10 : null;
  const band = score === null ? "Not evaluated" : score >= 7 ? "Highly novel" : score >= 4 ? "Moderately novel" : score >= 2 ? "Marginally novel" : "Closely matched";
  const partial = (report as any)?.raw?.state === "PARTIAL" || report?.status === "PARTIAL";
  const differences = scoringResult?.distinctDifferences ?? [];
  const recommendations = scoringResult?.recommendations ?? [];
  const matches = scoringResult?.closestMatches ?? [];
  // Join references by publication number; array order is not an identity.
  const references = matches.map((match) => ({ ...priorArt?.find((art) => art.publicationNumber === match.publicationNumber), ...match }))
    .concat((priorArt ?? []).filter((art) => !matches.some((match) => match.publicationNumber === art.publicationNumber)) as any)
    .sort((a: any, b: any) => (b.similarityScore ?? b.score ?? -1) - (a.similarityScore ?? a.score ?? -1));
  const suggestion = (tip: any) => String(typeof tip === "string" ? tip : tip.text)
    .replace(/^Claim the combination of (.+)\.$/, "Explain how $1 work together.")
    .replace(/^Add dependent claims on (.+)\.$/, "Describe $1 and how it contributes to your idea.");
  const list = (items: string[] | undefined, empty: string) => items?.length ? <ul className="mt-2 list-disc space-y-1 pl-4 text-sm text-pl-text-2">{items.map((item, i) => <li key={i}>{item}</li>)}</ul> : <p className="mt-2 text-sm text-pl-text-3">{empty}</p>;
  return <div data-evaluation-report className={`ph-no-capture min-w-0 text-foreground ${embedded ? "space-y-5" : "mx-auto max-w-4xl space-y-6 p-6"}`}>
      {!embedded && (
      <Dialog open={reEvalOpen} onOpenChange={setReEvalOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Re-evaluate with New Patent Numbers</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleReEvalSubmit} className="space-y-4">
            <label className="block font-medium mb-1">
              Enter patent numbers (comma or newline separated):
            </label>
            <textarea
              rows={4}
              placeholder="US1234567A1, US7654321B2, ..."
              value={patentInput}
              onChange={(e) => setPatentInput(e.target.value)}
              disabled={isReEvalLoading}
              name="patent_numbers"
              className="resize-y min-h-20 flex h-9 w-full rounded-sm border bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-0 disabled:cursor-not-allowed disabled:opacity-50"
            />
            {reEvalError && (
              <div className="text-pl-red-text text-sm">
                {reEvalError instanceof Error
                  ? reEvalError.message
                  : "Failed to re-evaluate. Please try again."}
              </div>
            )}
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setReEvalOpen(false)}
                disabled={isReEvalLoading}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isReEvalLoading}>
                {isReEvalLoading ? "Submitting..." : "Submit"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
      )}

    {!embedded && <header><p className="text-xs text-pl-text-3">{reference ? `${reference} · ` : ""}Evaluation result</p><h1 className="mt-2 text-xl font-semibold">{title}</h1></header>}
    <section aria-label="Assessment">
      <h2 className="text-sm font-semibold">Assessment</h2>
      {partial && <p role="status" className="mt-2 text-sm text-pl-amber-text">Partial result · the score is provisional</p>}
      <div className="mt-2 flex flex-wrap items-baseline gap-3"><p className="text-3xl font-semibold tabular-nums">{score?.toFixed(1) ?? "—"}<span className="text-sm font-normal text-pl-text-3"> /10</span></p><p className="text-sm font-medium">{band}</p></div>
      <p className="mt-2 text-sm text-pl-text-2">{score === null ? "An assessment is not available yet." : references.length === 0 ? "No close prior art was returned by this search. This does not establish that the idea is unique." : score < 4 ? "The search found close overlap. Review the differences and strengthen your explanation." : "The search found potentially distinct features. Review the comparison before drawing conclusions."}</p>
      <p className="mt-2 text-xs text-pl-text-3">AI-assisted and advisory. No score is required to submit for review.</p>
    </section>
    <section className="border-t border-pl-border pt-4"><h2 className="text-sm font-semibold">What appears different</h2>{list(differences.slice(0, 3), "The report does not identify distinct features. Explain what your approach changes compared with existing solutions.")}</section>
    <section className="border-t border-pl-border pt-4"><h2 className="text-sm font-semibold">How to strengthen</h2>{recommendations.length ? <ul className="mt-2 list-disc space-y-3 pl-4 text-sm text-pl-text-2">{recommendations.map((tip: any, i) => <li key={i}>{suggestion(tip)}{tip.rationale && <p className="mt-1 text-xs text-pl-text-3">{tip.rationale}</p>}</li>)}</ul> : <p className="mt-2 text-sm text-pl-text-3">No specific prompts were returned. Review whether the mechanism and its technical advantage are explained clearly.</p>}</section>
    <details className="border-t border-pl-border pt-4">
      <summary className="cursor-pointer rounded-sm text-sm font-medium focus-visible:ring-2 focus-visible:ring-ring">Prior art · {references.length} references</summary>
      <p className="mt-3 text-xs text-pl-text-3">Ranked by similarity, highest first. {partial ? "Coverage is incomplete; review the limitations below." : "These references are the evidence returned by this evaluation."}</p>
      <div className="mt-3 divide-y divide-pl-border">{references.map((art: any, index) => {
        const similarity = art.similarityScore ?? art.score;
        return <details key={art.publicationNumber ?? index} className="py-3">
          <summary className="cursor-pointer rounded-sm text-sm focus-visible:ring-2 focus-visible:ring-ring"><span className="font-medium">{index + 1}. {art.title}</span><span className="mt-1 block text-xs text-pl-text-3">{art.publicationNumber}{typeof similarity === "number" ? ` · ${Math.round(similarity <= 1 ? similarity * 100 : similarity)}% similarity` : " · Similarity unavailable"}</span></summary>
          <div className="mt-3 space-y-3 text-sm"><p className="text-pl-text-2">{art.analysis || "No reference analysis was returned."}</p><div><h3 className="font-medium">Overlapping concepts</h3>{list(art.overlappingConcepts, "No overlaps recorded.")}</div><div><h3 className="font-medium">Key similarities</h3>{list(art.keySimilarities, "No detailed similarities recorded.")}</div><div><h3 className="font-medium">Differences from this reference</h3>{list(art.distinctDifferences, "No reference-specific differences recorded.")}</div><div><h3 className="font-medium">Evidence · abstract</h3><p className="mt-2 text-pl-text-2">{art.abstract || "No abstract returned."}</p></div>{art.url && /^https?:\/\//.test(art.url) && <a className="inline-flex items-center gap-1 text-pl-blue-text underline" href={art.url} target="_blank" rel="noopener noreferrer">Open publication<ExternalLink className="size-3" /></a>}</div>
        </details>;
      })}</div>
      <div className="mt-3 border-t border-pl-border pt-3"><h3 className="text-sm font-medium">Coverage and provenance</h3><p className="mt-2 text-sm text-pl-text-2">{scoringResult?.summary || "No coverage summary returned."}</p><p className="mt-2 text-xs text-pl-text-3">Source: this evaluation’s prior-art search and reference analysis. {scoringResult?.confidenceLevel ? `Evidence confidence: ${scoringResult.confidenceLevel.toLowerCase()}.` : "Evidence confidence was not provided."}</p></div>
    </details>
  </div>;
}
