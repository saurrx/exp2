import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Check,
  ChevronDown,
  FileText,
  Lock,
  Plus,
  Sparkles,
  Upload,
  X,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/lib/toast";
import PatentNoveltyReport from "@/components/ideas/ShowScoreReport";
import EvaluationProgress from "@/components/ideas/EvaluationProgress";
import API_CONFIG, { rawApi } from "@/lib/apiConfig";
import { extractDocumentText } from "@/lib/documentText";
import { track } from "@/lib/analytics";
import ideaDraftQuestions from "@/lib/IdeaDraftQuestion";
import { disclosureSections, supportedPrefill, storedDisclosure } from "./disclosureMaterial";
import useUserCookie from "@/hooks/use-auth";
import CoInventorsField from "@/components/ideas/CoInventorsField";
import { PageHeader } from "@/components/DashboardChrome";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

/**
 * Sectioned copilot workspace for the inventor draft flow. Converts the
 * Q&A questionnaire into named accordion sections with per-field AI assist,
 * a live preliminary patentability signal, autosave, and an always-enabled
 * finish CTA. Storage stays on the existing draft meta_data schema — the
 * redesign only re-skins how those answers are collected.
 */

type Provenance = "ai" | "edited" | "you";

// Sentence-case labels + helper copy per question id; `core` marks the
// novelty conception field (coached, never AI-drafted).
const FIELD_META: Record<
  string,
  { label: string; helper: string; required?: boolean; core?: boolean }
> = {
  bg1: {
    label: "Technological field",
    helper:
      "The area your invention belongs to — e.g. battery systems, network security.",
    required: true,
  },
  bg2: {
    label: "Related existing solutions",
    helper: "Products, patents, or papers that already tackle this space.",
  },
  prob1: {
    label: "The problem you solve",
    helper: "The specific pain or limitation your invention addresses.",
    required: true,
  },
  prob2: {
    label: "Why current solutions fall short",
    helper: "What today's approaches can't do, or do too slowly or expensively.",
  },
  sol1: {
    label: "How it works",
    helper: "The core mechanism, in plain language.",
    required: true,
  },
  sol2: {
    label: "Key components or steps",
    helper: "The main parts or stages that make it work.",
  },
  adv1: {
    label: "What makes it different",
    helper:
      "In your own words — what sets this apart from everything else.",
    required: true,
    core: true,
  },
  adv2: {
    label: "Cost, efficiency, or performance benefits",
    helper: "Measurable gains over existing approaches.",
  },
  imp1: {
    label: "How it would be used in practice",
    helper: "Where and how the invention gets deployed.",
  },
  imp2: {
    label: "Resources needed",
    helper: "People, equipment, or budget required to build it.",
  },
};

const SECTION_TITLES: Record<string, string> = {
  background: "Background",
  problem: "Problem",
  solution: "Solution",
  advantages: "Novelty",
  implementation: "Application",
};

const COACH_PROMPTS = [
  "What's different from existing approaches?",
  "What surprised you when it first worked?",
  "What would a competitor find hardest to copy?",
];

const PROVENANCE_CHIP: Record<Provenance, { label: string }> = {
  ai: { label: "AI-drafted" }, edited: { label: "Edited" }, you: { label: "Written by you" },
};

// Coarse size band — an enum, never the exact byte count.
const sizeBand = (bytes: number): string => {
  if (bytes < 100_000) return "xs";
  if (bytes < 1_000_000) return "s";
  if (bytes < 5_000_000) return "m";
  return "l";
};

// Novelty band from the 0–100 raw score — an enum, never the number itself, so
// it groups cleanly in a funnel and carries no disclosure signal.
const noveltyBand = (raw: unknown): string | undefined => {
  if (typeof raw !== "number") return undefined;
  if (raw >= 70) return "high";
  if (raw >= 40) return "moderate";
  return "low";
};

const savedLabel = (savedAt: Date | null) => {
  if (!savedAt || Number.isNaN(savedAt.getTime())) return null;
  const mins = Math.floor((Date.now() - savedAt.getTime()) / 60000);
  if (mins < 1) return "Saved just now";
  if (mins < 60) return `Saved ${mins}m ago`;
  const isToday = savedAt.toDateString() === new Date().toDateString();
  return isToday
    ? `Saved at ${savedAt.toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}`
    : `Saved ${savedAt.toLocaleDateString([], { month: "short", day: "numeric" })}`;
};

const DraftWorkspace = ({ ideaId }: { ideaId?: string }) => {
  const navigate = useNavigate();
  const { user } = useUserCookie();
  const queryClient = useQueryClient();
  const location = useLocation();
  const routeDraftId = new URLSearchParams(location.search).get("draftId") || "";
  const { data: draftList } = useQuery({ queryKey: ["workspace_drafts", ideaId], enabled: !!ideaId && !routeDraftId,
    queryFn: async () => (await API_CONFIG.get(`/api/v1/idea/fetch-drafts/${ideaId}`)).data });
  const draftId = routeDraftId || draftList?.data?.[0]?.id || "";

  const [sections, setSections] = useState<any[]>([]);
  const [provenance, setProvenance] = useState<Record<string, Provenance>>({});
  const [openSection, setOpenSection] = useState<string>("background");
  const [savedAt, setSavedAt] = useState<Date | null>(null);
  const [, forceTick] = useState(0);
  const [autofillRan, setAutofillRan] = useState(false);
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteText, setPasteText] = useState("");
  // One review per field, shown as a card until dismissed. A review is a
  // VERDICT on what the inventor wrote — not a blob of text to accept blindly:
  // "this does not answer the question yet", "here is what is missing, and
  // here is a version with your own facts in it", or "this works, and here is
  // why". See pulse-backend draft-assist.ts.
  type FieldReview = { verdict: string; message: string; example?: string };
  const [proposals, setProposals] = useState<Record<string, FieldReview>>({});
  const [saveState, setSaveState] = useState<"saved" | "saving" | "error" | "conflict">("saved");
  const [sourceError, setSourceError] = useState<string | null>(null);
  const [conflictDraft, setConflictDraft] = useState<any>(null);
  const [confirmSubmit, setConfirmSubmit] = useState(false);
  const [reconsiderationNote, setReconsiderationNote] = useState("");
  const [online, setOnline] = useState(navigator.onLine);
  useEffect(() => {
    const update = () => setOnline(navigator.onLine);
    window.addEventListener("online", update); window.addEventListener("offline", update);
    return () => { window.removeEventListener("online", update); window.removeEventListener("offline", update); };
  }, []);
  const [finishNote, setFinishNote] = useState<string | null>(null);
  const [showCoInvPrompt, setShowCoInvPrompt] = useState(false);
  const [draftingField, setDraftingField] = useState<string | null>(null);
  const [isAutofilling, setIsAutofilling] = useState(false);
  // Score lifecycle: polling flag while the pipeline runs, one-time CTA
  // pulse at 100%, and staleness once fields change after a score exists.
  const [scoringActive, setScoringActive] = useState(false);
  const [pulseNow, setPulseNow] = useState(false);
  const [dirtySinceScore, setDirtySinceScore] = useState(false);
  const pulsedRef = useRef(false);
  const scoreAnnouncedRef = useRef(false);
  const evaluationSectionRef = useRef<HTMLElement>(null);
  const evaluationTitleRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => {
    if (scoringActive) evaluationSectionRef.current?.scrollIntoView({ block: "nearest" });
  }, [scoringActive]);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const attachInputRef = useRef<HTMLInputElement>(null);
  const sectionRefs = useRef<Record<string, HTMLElement | null>>({});
  const loadedRef = useRef(false);
  const versionRef = useRef(0);
  const recoveryKey = `pulse-disclosure:${user?.id}:${draftId}`;

  // Tick every 30s so "Saved 2m ago" stays honest.
  useEffect(() => {
    const t = setInterval(() => forceTick((n) => n + 1), 30000);
    return () => clearInterval(t);
  }, []);

  const { data: draftData, isError: draftLoadError, refetch: reloadDraft } = useQuery({
    queryKey: ["single_draft", draftId],
    enabled: !!draftId,
    queryFn: async () =>
      (await API_CONFIG.get(`/api/v1/idea/single-draft/${draftId}`))?.data,
  });

  const { data: ideaData } = useQuery({
    queryKey: ["workspace_idea", ideaId],
    enabled: !!ideaId,
    queryFn: async () =>
      (await API_CONFIG.get(`/api/v1/idea/fetch/${ideaId}`))?.data,
  });

  const idea = ideaData?.data;
  const { data: reviewFeedback } = useQuery({ queryKey: ["disclosure_review_feedback", ideaId], enabled: !!ideaId && idea?.state === "CHANGES_REQUESTED",
    queryFn: async () => { const transitions = (await rawApi.get(`/v1/ideas/${ideaId}/transitions`)).data; return [...transitions].reverse().find((entry: any) => entry.to_state === "CHANGES_REQUESTED")?.comment ?? null; } });

  useEffect(() => {
    if (draftData && !loadedRef.current) {
      loadedRef.current = true;
      versionRef.current = draftData.data.version ?? 0;
      track("draft_opened", { idea_id: ideaId });
      // Fall back to the default questionnaire when a draft has no (or
      // empty) meta_data, so the workspace never renders without sections.
      const meta =
        Array.isArray(draftData?.data?.meta_data) &&
        draftData.data.meta_data.length > 0
          ? draftData.data.meta_data
          : ideaDraftQuestions;
      let recovered: any = null;
      try { recovered = JSON.parse(sessionStorage.getItem(recoveryKey) || "null"); } catch { /* A missing local copy is harmless. */ }
      setSections(disclosureSections(recovered?.sections ?? meta));
      if (recovered) { versionRef.current = recovered.version; setSaveState("error"); }
      const prov: Record<string, Provenance> = {};
      disclosureSections(meta).forEach((s: any) =>
        s.questions.forEach((q: any) => {
          if (q.provenance) prov[q.id] = q.provenance;
          else if (q.answer?.trim()) prov[q.id] = "you";
        }),
      );
      setProvenance(recovered?.provenance ?? prov);
      if ((draftData?.data?.updatedAt ?? draftData?.data?.updated_at)) setSavedAt(new Date(draftData.data.updatedAt ?? draftData.data.updated_at));
      const log = draftData?.data?.CheckDraftSoreLog?.[0];
      if (
        log?.createdAt &&
        (draftData?.data?.updatedAt ?? draftData?.data?.updated_at) &&
        new Date(draftData.data.updatedAt ?? draftData.data.updated_at).getTime() >
          new Date(log.createdAt).getTime() + 2000
      ) {
        setDirtySinceScore(true);
      }
    }
  }, [draftData]);

  /* ------------------------------ derived state ------------------------------ */

  const answers = useMemo(() => {
    const m: Record<string, string> = {};
    sections.forEach((s) => s.questions.forEach((q: any) => (m[q.id] = q.answer)));
    return m;
  }, [sections]);

  const attachments: any[] = idea?.IdeaFiles ?? [];

  const sectionComplete = useCallback(
    (sectionId: string) => {
      if (sectionId === "attachments") return attachments.length > 0;
      const s = sections.find((x) => x.id === sectionId);
      return !!s && s.questions.filter((q: any) => FIELD_META[q.id]?.required).every((q: any) => q.answer?.trim());
    },
    [sections, attachments.length],
  );

  const sectionHasContent = useCallback(
    (sectionId: string) => {
      if (sectionId === "attachments") return attachments.length > 0;
      const s = sections.find((x) => x.id === sectionId);
      return !!s && s.questions.some((q: any) => q.answer?.trim());
    },
    [sections, attachments.length],
  );

  const outline = [
    ...sections.map((s) => ({ id: s.id, title: SECTION_TITLES[s.id] || s.title })),
    { id: "attachments", title: "Attachments" },
  ];


  const requiredIds = Object.keys(FIELD_META).filter((k) => FIELD_META[k].required);
  const missingRequired = requiredIds.filter((id) => !answers[id]?.trim());
  const incompleteSections = [
    ...new Set(
      missingRequired.map(
        (id) => sections.find((s) => s.questions.some((q: any) => q.id === id))?.id,
      ),
    ),
  ].filter(Boolean) as string[];

  // 10% baseline for a titled draft; the rest tracks answered fields.
  const totalFields = Object.keys(FIELD_META).length;
  const answered = Object.keys(FIELD_META).filter((id) => answers[id]?.trim()).length;
  const completion = Math.min(
    100,
    10 + Math.round((answered / totalFields) * 90),
  );

  // Readiness, reported in 10-point BANDS. The raw percentage moves on nearly
  // every keystroke; the band moves when the draft actually got further, which is
  // the only version of this that a retention or drop-off chart can read.
  const readinessBand = Math.floor(completion / 10) * 10;
  const bandRef = useRef<number | null>(null);
  useEffect(() => {
    if (!loadedRef.current) return;
    if (bandRef.current === readinessBand) return;
    // The first band after load is the starting point, not a change.
    const first = bandRef.current === null;
    bandRef.current = readinessBand;
    if (!first) track("draft_readiness_changed", { idea_id: ideaId, pct: readinessBand });
  }, [readinessBand, ideaId]);

  // Collapse to the one-line bar only once pre-fill has actually RUN — not the
  // moment any text exists.
  //
  // This card replaced the "Keep building" banner in that full-width slot, so
  // collapsing on `anyContent` meant a draft with a single character showed a
  // thin line where a prominent card used to be, and the thing it was meant to
  // replace it with was never seen. After autofill the slim bar is right: the
  // offer has been taken and repeating it is noise.
  const slimBanner = autofillRan || answered > 2;

  /* --------------------------------- saving --------------------------------- */

  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  // The field whose edit triggered the pending save. Rides the SAME 800ms
  // debounce as the write itself, so a sentence typed into one box is one event
  // and not forty — a per-keystroke event here would be the loudest thing in the
  // whole project and would say nothing the autosave does not already say.
  const pendingFieldRef = useRef<string | null>(null);
  const saveNow = useCallback(
    async (next: any[], prov: Record<string, Provenance>, pct: number) => {
      const meta = next.map((s) => ({
        ...s,
        questions: s.questions.map((q: any) => ({
          ...q,
          provenance: prov[q.id] ?? null,
        })),
      }));
      setSaveState("saving");
      const recovery = JSON.stringify({ sections: next, provenance: prov, version: versionRef.current });
      try { sessionStorage.setItem(recoveryKey, recovery); } catch { /* Keep editing if browser storage is unavailable. */ }
      try {
        const response = await API_CONFIG.post(`/api/v1/idea/update/draft/${draftId}`, {
          answers: { ...storedDisclosure(meta), __completion: pct, __expected_version: versionRef.current },
        });
        versionRef.current = response.data.data.version ?? versionRef.current;
        setSavedAt(new Date());
        setSaveState("saved");
        if (sessionStorage.getItem(recoveryKey) === recovery) sessionStorage.removeItem(recoveryKey);
      } catch (error: any) {
        setSaveState(error?.response?.status === 409 ? "conflict" : "error");
        throw error;
      }
    },
    [draftId, recoveryKey],
  );

  const persist = useCallback(
    (next: any[], prov: Record<string, Provenance>, pct: number) => {
      setSaveState("saving");
      try { sessionStorage.setItem(recoveryKey, JSON.stringify({ sections: next, provenance: prov, version: versionRef.current })); } catch { /* In-memory editing remains available. */ }
      if (saveTimer.current) clearTimeout(saveTimer.current);
      saveTimer.current = setTimeout(() => {
        const field = pendingFieldRef.current;
        pendingFieldRef.current = null;
        saveNow(next, prov, pct)
          .then(() => {
            // Field and section IDS, never the answer. Which boxes people fill,
            // and in what order, is the whole question behind the draft stall.
            if (field) {
              track("draft_field_saved", {
                idea_id: ideaId,
                field,
                section: next.find((sec) =>
                  sec.questions.some((q: any) => q.id === field),
                )?.id,
              });
            }
          })
          .catch(() => toast.error("Autosave failed"));
      }, 800);
    },
    [saveNow, ideaId, recoveryKey],
  );

  const setAnswer = (qid: string, value: string, viaAI = false) => {
    if (scored) setDirtySinceScore(true);
    pendingFieldRef.current = qid;
    setSections((prev) => {
      const next = prev.map((s) => ({
        ...s,
        questions: s.questions.map((q: any) =>
          q.id === qid ? { ...q, answer: value } : q,
        ),
      }));
      setProvenance((pp) => {
        const prior = pp[qid];
        const nextProv: Record<string, Provenance> = {
          ...pp,
          [qid]: viaAI
            ? "ai"
            : prior === "ai" || prior === "edited"
              ? "edited"
              : "you",
        };
        const answeredNext = next.reduce(
          (n, s) => n + s.questions.filter((q: any) => q.answer?.trim()).length,
          0,
        );
        persist(
          next,
          nextProv,
          Math.min(100, 10 + Math.round((answeredNext / totalFields) * 90)),
        );
        return nextProv;
      });
      return next;
    });
  };

  /* ----------------------------- autofill pipeline ----------------------------- */

  const runAutofill = async (payload: { file?: File; text?: string }) => {
    setIsAutofilling(true);
    setSourceError(null);
    try {
      // A dropped file is read HERE and only its text travels — see
      // lib/documentText.ts on why the document itself never leaves the
      // machine.
      let source = (payload.text ?? "").trim();
      if (payload.file) {
        try {
          source = (await extractDocumentText(payload.file)).text;
          // Content-type + char count only — the extracted text never leaves the
          // browser and is NEVER put in an event.
          track("document_parsed", {
            idea_id: ideaId,
            content_type: payload.file.type || "unknown",
            char_count: source.length,
          });
        } catch (err: any) {
          setSourceError(err?.message ?? "That file could not be read. Paste its text or choose another file.");
          return;
        }
      }
      if (source.length < 40) {
        setSourceError("Add a few sentences so Pulse has enough material to organise.");
        return;
      }
      // The questionnaire's structure lives in the DRAFT, and the server fills
      // the questions it finds there — deliberately, so a client cannot rename
      // the novelty section to get it written. A draft nobody has typed into
      // yet has never been saved, so it carries no structure at all: save it
      // first, or the server correctly answers "no questionnaire to fill".
      await saveNow(sections, provenance, completion);
      const res = await API_CONFIG.post(`/api/v1/idea/autofill/${draftId}`, { text: source });
      const filled: Record<string, string> = Object.fromEntries(supportedPrefill([], res?.data?.data?.answers ?? {}).flatMap((s) => s.questions).filter((q) => q.answer).map((q) => [q.id, q.answer]));
      const filledCount = Object.keys(filled).length;
      if (!filledCount) {
        setSourceError(
          res?.data?.data?.source === "unavailable"
            ? "The drafting assistant is unavailable right now — your text is safe, try again in a moment."
            : "Nothing in that text answered these questions. Try a fuller description.",
        );
        return;
      }
      setSections((prev) => {
        const next = prev.map((s) => ({
          ...s,
          questions: s.questions.map((q: any) =>
            // Never overwrite what the inventor already wrote.
            FIELD_META[q.id]?.core || q.answer?.trim() || !filled[q.id] ? q : { ...q, answer: filled[q.id] },
          ),
        }));
        setProvenance((pp) => {
          const nextProv = { ...pp };
          next.forEach((s) =>
            s.questions.forEach((q: any) => {
              if (q.answer?.trim() && !pp[q.id]) nextProv[q.id] = "ai";
            }),
          );
          const answeredNext = next.reduce(
            (n, s) => n + s.questions.filter((q: any) => q.answer?.trim()).length,
            0,
          );
          persist(
            next,
            nextProv,
            Math.min(100, 10 + Math.round((answeredNext / totalFields) * 90)),
          );
          return nextProv;
        });
        return next;
      });
      setAutofillRan(true);
      setPasteOpen(false);
      setPasteText("");
      // Count of fields filled + the source kind — never the text or the answers.
      track("draft_autofill_used", {
        idea_id: ideaId,
        source: payload.file ? "document" : "paste",
        fields_filled: filledCount,
      });
      // Say what it did NOT do, in the same breath as what it did: novelty is
      // the one section the assistant will not write (draft-assist.ts).
      toast.success(
        `${filledCount} ${filledCount === 1 ? "section" : "sections"} pre-filled — review each one. Novelty is yours to write.`,
      );
    } catch (err: any) {
      setSourceError(err?.response?.data?.message ?? "Could not organise this material. Your text is still here; try again.");
    } finally {
      setIsAutofilling(false);
    }
  };

  /* ------------------------------ per-field AI ------------------------------ */

  const draftField = async (qid: string, _questionText: string) => {
    setDraftingField(qid);
    try {
      const res = await API_CONFIG.post(`/api/v1/idea/suggest-field/${draftId}`, {
        question_id: qid,
        // What is in the box right now — autosave may not have flushed yet.
        answer: answers?.[qid] ?? "",
      });
      const review = res?.data?.data;
      if (review?.message) setProposals((p) => ({ ...p, [qid]: review }));
      // Field id + the verdict ENUM only — never the answer text or the
      // suggestion message.
      track("draft_field_review_requested", {
        idea_id: ideaId,
        field: qid,
        verdict: review?.verdict,
      });
    } catch (err: any) {
      toast.error(
        err?.response?.data?.message ?? "Couldn't review this answer",
      );
    } finally {
      setDraftingField(null);
    }
  };

  /* ------------------------------- full score ------------------------------- */

  const [evaluationOpen, setEvaluationOpen] = useState(false);
  const { data: scoreData, isLoading: evaluationLoading, isError: evaluationLoadError, refetch: reloadEvaluation } = useQuery({
    queryKey: ["draft_score", draftId],
    enabled: !!draftId,
    refetchInterval: scoringActive ? 1500 : false,
    queryFn: async () =>
      (await API_CONFIG.get(`/api/v1/idea/fetch-score/${draftId}`))?.data,
  });
  const scoreRaw = scoreData?.data?.score;
  const scoreMeta = scoreData?.data?.score_meta_data;
  const serverEvaluationState = scoreData?.data?.state;
  const serverEvaluationStatus = scoreData?.data?.status as string | undefined;
  const runningEvaluationId =
    scoreData?.data?.report?.evaluationId ?? scoreData?.data?.report?.id ?? null;

  // The server, not component state, knows whether an evaluation is running —
  // scoringActive used to be set only by the button click, so closing the tab
  // mid-scan and reopening showed nothing while the agent kept working
  // (F-029's UX half). One poll answers RUNNING and this resumes the loop.
  useEffect(() => {
    if (serverEvaluationStatus === "RUNNING" && !scoringActive) setScoringActive(true);
  }, [serverEvaluationStatus, scoringActive]);
  const scored = typeof scoreRaw === "number";
  const score10 = scored ? scoreRaw / 10 : null;
  const weakestSectionId: string =
    scoreMeta?.coaching?.weakest_section || "problem";
  const strengthenTips: string[] = scoreMeta?.coaching?.suggestions ?? [];

  useEffect(() => {
    if (serverEvaluationStatus === "FAILED") setScoringActive(false);
    if (scored && scoringActive && serverEvaluationStatus !== "RUNNING") {
      setScoringActive(false);
      setDirtySinceScore(false);
    }
    if (scored && !scoreAnnouncedRef.current) {
      scoreAnnouncedRef.current = true;
      // Enum band only — never the raw score number (a disclosure signal).
      track("evaluation_completed_viewed", {
        idea_id: ideaId,
        evaluation_id: runningEvaluationId ?? undefined,
        state: serverEvaluationStatus ?? "SUCCEEDED",
        novelty_band: noveltyBand(scoreRaw),
      });
    }
  }, [scored, scoringActive, draftId, scoreRaw, ideaId, runningEvaluationId, serverEvaluationStatus]);

  /* ---------------------------- preliminary signal ---------------------------- */

  // The rail follows what is WRITTEN, not how many boxes are non-empty. Keying
  // on the count meant editing a section never refreshed it, and — worse —
  // clearing every field left the previous read on screen, because the query
  // was disabled below two sections and react-query kept the last answer.
  // The key is a digest of the content, debounced so typing does not bill.
  const answersDigest = useMemo(() => {
    const body = sections
      .flatMap((s: any) => s.questions.map((q: any) => `${q.id}:${(q.answer ?? "").trim()}`))
      .join("|");
    // A cheap, stable 32-bit hash — this only has to change when the text does.
    let h = 0;
    for (let i = 0; i < body.length; i++) h = (Math.imul(31, h) + body.charCodeAt(i)) | 0;
    return `${body.length}:${h}`;
  }, [sections]);
  const [signalKey, setSignalKey] = useState(answersDigest);
  useEffect(() => {
    const t = setTimeout(() => setSignalKey(answersDigest), 1200);
    return () => clearTimeout(t);
  }, [answersDigest]);

  const { data: signalData } = useQuery({
    queryKey: ["preliminary_signal", draftId, signalKey],
    enabled: !!draftId,
    // The server caches identical content, so a re-ask after a round trip of
    // edits and undos costs nothing.
    staleTime: 15000,
    queryFn: async () =>
      (await API_CONFIG.get(`/api/v1/idea/preliminary-signal/${draftId}`))?.data,
  });
  const signal = signalData?.data;

  // The rail landed — record state/source enums only (both may be absent, in
  // which case sanitize drops them). Fires once per content digest.
  const railShownRef = useRef<string | null>(null);
  useEffect(() => {
    if (signal && railShownRef.current !== signalKey) {
      railShownRef.current = signalKey;
      track("patentability_rail_shown", {
        idea_id: ideaId,
        state: signal?.state,
        source: signal?.source,
      });
    }
  }, [signal, signalKey, ideaId]);

  /* -------------------------------- attachments -------------------------------- */

  const { mutate: uploadAttachment } = useMutation({
    mutationFn: async (files: File[]) => {
      const { s3Upload } = await import("@/lib/api-service/s3Upload");
      const stored: Awaited<ReturnType<typeof s3Upload>>[] = [];
      for (const file of files) stored.push(await s3Upload(file, "idea", idea?.client_id ?? user?.client_id));
      await rawApi.post(`/v1/ideas/${ideaId}/files`, { file_ids: stored.map((file) => file.id) });
    },
    onSuccess: (_data, files) => {
      // Metadata only: content-type + a coarse size band, never the filename or
      // the file contents.
      (files ?? []).forEach((f) =>
        track("file_uploaded", {
          idea_id: ideaId,
          content_type: f.type || "unknown",
          size_band: sizeBand(f.size),
        }),
      );
      queryClient.invalidateQueries({ queryKey: ["workspace_idea", ideaId] });
    },
    onError: () => toast.error("Upload failed"),
  });

  /* --------------------------------- finish --------------------------------- */

  const { mutate: startScoring, isPending: isScoring } = useMutation({
    mutationFn: async () => {
      await API_CONFIG.get(`/api/v1/idea/check-score/${draftId}`);
    },
    onSuccess: () => {
      scoreAnnouncedRef.current = false;
      queryClient.setQueryData(["draft_score", draftId], null);
      setScoringActive(true);
      track("evaluation_started", { idea_id: ideaId });
    },
    onError: () => toast.error("Failed to start scoring"),
  });

  const { mutate: sendToCommittee, isPending: isSending } = useMutation({
    mutationFn: async () => {
      if (saveTimer.current) clearTimeout(saveTimer.current);
      await saveNow(sections, provenance, completion);
      await API_CONFIG.post(
        `/api/v1/idea/send-to-ihc/${draftId}/${user?.client_id}`,
        { stale: dirtySinceScore, ...(idea?.state === "REJECTED" || idea?.status === "REJECT_BY_IHC" ? { comment: reconsiderationNote.trim() } : {}) },
      );
    },
    onSuccess: () => {
      track("idea_submitted", {
        idea_id: ideaId,
        kind: "submit",
        appeal_count: 0,
      });
      navigate(`/ideas/${ideaId}`);
    },
    onError: () => toast.error("Failed to send"),
  });

  const coInventorCount = (idea?.IdeaInventor || []).filter(
    (x: any) => x?.inventor?.id !== user?.id,
  ).length;

  const scrollToSection = (id: string) => {
    setOpenSection(id);
    setTimeout(
      () => sectionRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "start" }),
      50,
    );
  };

  const handleFinish = async () => {
    if (missingRequired.length > 0) {
      setFinishNote(
        `${incompleteSections.length} section${incompleteSections.length === 1 ? "" : "s"} to go — or upload a document and we'll pre-fill them.`,
      );
      scrollToSection(incompleteSections[0]);
      return;
    }
    setFinishNote(null);
    try { if (saveTimer.current) clearTimeout(saveTimer.current); await saveNow(sections, provenance, completion); startScoring(); } catch { /* Save recovery stays visible. */ }
  };

  const handleSend = () => {
    // "Send for review" was pressed. Fired here rather than on success, because
    // the gap between this and idea_submitted IS the submit stall — a person who
    // reaches this point and does not finish is the one worth knowing about.
    track("idea_submit_opened", { idea_id: ideaId });
    if (missingRequired.length) {
      setFinishNote("Complete the required answers before submitting for review.");
      scrollToSection(incompleteSections[0]);
      return;
    }
    setConfirmSubmit(true);
  };

  // One-time CTA pulse the moment required completion hits 100% (state B).
  const requiredComplete = missingRequired.length === 0;
  useEffect(() => {
    if (requiredComplete && !scored && loadedRef.current && !pulsedRef.current) {
      pulsedRef.current = true;
      setPulseNow(true);
      const t = setTimeout(() => setPulseNow(false), 1400);
      return () => clearTimeout(t);
    }
  }, [requiredComplete, scored]);

  /* ---------------------------------- render ---------------------------------- */
  const reconsidering = idea?.state === "REJECTED" || idea?.status === "REJECT_BY_IHC";
  const requestedChanges = idea?.status === "CHANGES_REQUESTED" || idea?.state === "CHANGES_REQUESTED";
  const saveMessage = !online ? "Offline · your answers remain here" : saveState === "saving" ? "Saving…" : saveState === "conflict" ? "Another revision was saved. Your answers remain here." : saveState === "error" ? "Could not save. Your answers remain here." : savedLabel(savedAt) || "Autosaves as you type";
  const fieldCls = "w-full resize-y rounded-sm border border-pl-border bg-background px-3 py-2 text-sm text-foreground outline-none focus-visible:ring-2 focus-visible:ring-ring";

  const liveSignal = !answers.prob1?.trim() ? "Describe the problem your idea addresses." : !answers.sol1?.trim() ? "Your problem is described. Explain how your idea solves it." : !answers.adv1?.trim() ? "Your problem and approach are described. Add what makes your idea different, in your own words." : "Your problem, approach and distinguishing idea are described. Evaluation can compare them with prior art.";
  const editable = !idea || ((idea.author_id ?? idea.created_by_id) === user?.id || (user?.role === "LEGAL_COUNSEL" && idea.submitted_by_id === user.id)) && ["DRAFT", "CHANGES_REQUESTED", "REJECTED"].includes(idea.state ?? (idea.status === "IN_DRAFT" ? "DRAFT" : idea.status === "UPDATE_REQUEST" ? "CHANGES_REQUESTED" : idea.status === "REJECT_BY_IHC" ? "REJECTED" : ""));
  if (idea && !editable) return <div data-disclosure-workspace className="min-h-0 flex-1 overflow-y-auto p-6"><PageHeader title="Invention disclosure" /><h1 className="text-xl font-semibold">{idea.title}</h1><p className="mt-2 text-sm text-pl-text-3">This disclosure is read-only. Review its status on the idea page.</p><Button size="sm" variant="outline" className="mt-3" onClick={() => navigate(`/ideas/${ideaId}`)}>View idea</Button><div className="mt-5 divide-y divide-pl-border">{sections.map((section) => <details key={section.id} className="py-3"><summary className="cursor-pointer font-medium">{section.title}</summary>{section.questions.filter((q: any) => q.answer).map((q: any) => <p key={q.id} className="mt-3 text-sm">{q.answer}</p>)}</details>)}</div></div>;

  return (
    <div data-disclosure-workspace className="pulse-product-page flex flex-1 min-h-0 flex-col bg-background font-sans text-foreground">
      <PageHeader title="Invention disclosure" />
      <div className="min-h-0 flex-1 overflow-y-auto lg:flex lg:flex-col lg:overflow-hidden">
      <header className="shrink-0 border-b border-pl-border px-6 py-2 lg:py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Button size="sm" variant="ghost" onClick={async () => {
            try { if (saveTimer.current) clearTimeout(saveTimer.current); await saveNow(sections, provenance, completion); navigate("/ideas"); } catch { /* Keep the draft open when saving fails. */ }
          }}>← My ideas</Button>
          {saveState !== "error" && saveState !== "conflict" && <p role="status" className="text-xs text-pl-text-3">{saveMessage}</p>}
        </div>
        <div className="mt-2 flex flex-wrap items-baseline gap-x-3 gap-y-1">
          <h1 title={idea?.title} className="min-w-0 truncate text-base font-semibold lg:text-xl">{idea?.title || "Invention disclosure"}</h1>
          <span className="text-xs text-pl-text-3">{idea?.reference_number} · {reconsidering ? "Rejected · revising" : requestedChanges ? "Changes requested" : "In draft"}</span>
        </div>
        {idea?.submitted_by && <p className="mt-2 text-xs text-pl-text-3">Inventor: {idea.author?.name} · Submitted by: {idea.submitted_by.name}</p>}
      </header>

      <div className="min-h-0 px-6 py-5 lg:flex-1 lg:overflow-y-auto">
        {!draftData ? draftLoadError ? <div role="alert"><p>Could not load this disclosure.</p><Button size="sm" variant="outline" onClick={() => reloadDraft()}>Try again</Button></div> : <p role="status">Loading disclosure…</p> : <>
          {reconsidering && <div className="mb-5 border-l-2 border-pl-blue pl-4"><h2 className="text-sm font-semibold">Revise your disclosure</h2><p className="mt-1 text-sm text-pl-text-2">Address the decision in your answers. Include a reconsideration note when you resubmit; the previous decision remains in history.</p></div>}
          {requestedChanges && <div className="mb-5 border-l-2 border-pl-blue pl-4"><h2 className="text-sm font-semibold">Update your disclosure</h2><p className="mt-1 text-sm text-pl-text-2">Address the review feedback, then submit this revision for review.</p>{reviewFeedback && <blockquote className="mt-2 text-sm">{reviewFeedback}</blockquote>}</div>}
          {(saveState === "error" || saveState === "conflict") && <div role="alert" className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-sm bg-pl-red-tint p-3 text-sm text-pl-red-text"><p>{saveMessage}</p>{saveState === "conflict" ? <Button variant="outline" size="sm" onClick={async () => { try { setConflictDraft((await API_CONFIG.get(`/api/v1/idea/single-draft/${draftId}`)).data.data); } catch { setFinishNote("Could not load the latest revision. Your answers remain here."); } }}>Compare latest revision</Button> : <Button variant="outline" size="sm" onClick={() => saveNow(sections, provenance, completion).catch(() => undefined)}>Retry save</Button>}</div>}
          <div className="grid min-w-0 gap-8 lg:grid-cols-3">
            <div className="min-w-0 lg:col-span-2">
              <section className="mb-5 border-b border-pl-border pb-5" aria-label="Start from existing material">
                {slimBanner ? <details open={pasteOpen || isAutofilling || !!sourceError}>
                  <summary className="cursor-pointer text-sm font-medium">{autofillRan ? "Material organised · review the prefilled answers" : "Add material to this disclosure"}</summary>
                  <p className="mt-2 text-sm text-pl-text-3">Only supported answers are prefilled. What makes it different stays yours to write.</p>
                  <div className="mt-3 flex gap-2"><Button size="sm" variant="outline" disabled={isAutofilling} onClick={() => fileInputRef.current?.click()}><Upload />Upload document</Button><Button size="sm" variant="ghost" onClick={() => setPasteOpen(true)}>Paste text</Button></div>
                </details> : <>
                  <h2 className="text-lg font-semibold">Start from what you already have</h2>
                  <p className="mt-1 text-sm text-pl-text-2">Bring notes or a document. Pulse organises supported answers; you review and fill the gaps.</p>
                  <div className="mt-3 flex flex-wrap gap-2"><Button size="sm" variant="outline" disabled={isAutofilling} onClick={() => fileInputRef.current?.click()}><Upload />Upload document</Button><Button size="sm" variant="outline" onClick={() => setPasteOpen(true)}>Paste text</Button><Button size="sm" variant="ghost" onClick={() => scrollToSection(sections[0]?.id)}>Write manually</Button></div>
                  <p className="mt-2 text-xs text-pl-text-3">PDF, DOCX, TXT or Markdown. For slides, paste the text.</p>
                </>}
                <input ref={fileInputRef} type="file" accept=".pdf,.docx,.txt,.md" className="hidden" aria-label="Upload source document" onChange={(e) => { const file = e.target.files?.[0]; if (file) runAutofill({ file }); e.target.value = ""; }} />
                {pasteOpen && <div className="mt-3"><label htmlFor="draft-source" className="text-sm font-medium">Your source material</label><textarea id="draft-source" rows={4} value={pasteText} onChange={(e) => setPasteText(e.target.value)} className={`ph-no-capture mt-2 ${fieldCls}`} placeholder="Paste notes or an existing description" /><div className="mt-2 flex gap-2"><Button size="sm" variant="outline" disabled={isAutofilling || !pasteText.trim()} onClick={() => runAutofill({ text: pasteText })}>Organise material</Button><Button size="sm" variant="ghost" onClick={() => setPasteOpen(false)}>Close</Button></div></div>}
                {isAutofilling && <p role="status" className="mt-3 text-sm text-pl-blue-text motion-safe:animate-pulse">Reading your material and matching it to the disclosure…</p>}
                {sourceError && <p role="alert" className="mt-3 text-sm text-pl-red-text">{sourceError}</p>}
              </section>
              <div className="divide-y divide-pl-border">
                {sections.map((s) => {
                  const open = openSection === s.id;
                  return <section key={s.id} ref={(el) => { sectionRefs.current[s.id] = el; }} className="scroll-mt-4 py-2">
                    <button type="button" aria-expanded={open} onClick={() => setOpenSection(open ? "" : s.id)} className="flex w-full items-center justify-between gap-3 rounded-sm py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
                      <span className="text-base font-semibold">{SECTION_TITLES[s.id] || s.title}</span><span className="flex items-center gap-3 text-xs text-pl-text-3">{s.questions.some((q: any) => FIELD_META[q.id]?.required) ? sectionComplete(s.id) ? "Required answers complete" : "Required answers remaining" : "Optional"}<ChevronDown className={`size-4 ${open ? "" : "-rotate-90"}`} /></span>
                    </button>
                    {open && <div className="space-y-5 pb-4">{s.questions.map((q: any) => {
                      const meta = FIELD_META[q.id] ?? { label: q.text || q.question, helper: "", required: false, core: q.id === "novelty" };
                      const review = proposals[q.id];
                      return <div key={q.id}>
                        <div className="sticky top-0 z-10 flex flex-wrap items-baseline justify-between gap-2 bg-background py-1"><label htmlFor={`f-${q.id}`} className="text-sm font-medium">{meta.label}<span className="ml-2 font-normal text-pl-text-3">{meta.required ? "Required" : "Optional"}</span></label>{provenance[q.id] && <span className="text-xs text-pl-text-3">{PROVENANCE_CHIP[provenance[q.id]].label}</span>}</div>
                        <p className="mb-2 mt-1 text-xs text-pl-text-3">{meta.helper}</p>
                        {meta.core && <p className="mb-2 text-xs text-pl-text-2">Write this in your own words: what did you conceive that existing approaches do not do?</p>}
                        <textarea id={`f-${q.id}`} rows={4} value={q.answer || ""} onChange={(e) => setAnswer(q.id, e.target.value)} className={`ph-no-capture ${fieldCls}`} />
                        {!meta.core && <Button size="sm" variant="ghost" disabled={draftingField === q.id} onClick={() => draftField(q.id, q.text)}>{draftingField === q.id ? "Reading…" : "Review this answer"}</Button>}
                        {review && <div className="mt-2 rounded-sm bg-pl-blue-tint p-3 text-sm"><p>{review.message}</p>{review.example && <p className="mt-2">{review.example}</p>}<div className="mt-2 flex flex-wrap gap-2">{review.example && <Button size="sm" variant="outline" onClick={() => { setAnswer(q.id, review.example!, true); setProposals((p) => { const next = { ...p }; delete next[q.id]; return next; }); }}>Use suggested wording</Button>}<Button size="sm" variant="ghost" onClick={() => setProposals((p) => { const next = { ...p }; delete next[q.id]; return next; })}>Dismiss</Button></div></div>}
                      </div>;
                    })}</div>}
                  </section>;
                })}
                <details className="py-4"><summary className="cursor-pointer text-sm font-medium">Co-inventors</summary><div className="mt-3"><CoInventorsField ideaId={ideaId} /></div></details>
                <details className="py-4"><summary className="cursor-pointer text-sm font-medium">Version history</summary><p className="mt-2 text-sm text-pl-text-3">Current draft · revision {(idea?.revision || 1) + (requestedChanges ? 1 : 0)}</p>{(draftData?.data?.history ?? []).map((entry: any) => <details key={entry.revision} className="mt-2"><summary className="cursor-pointer text-sm">Reviewed revision {entry.revision}</summary>{disclosureSections(entry.answers.__meta_data).map((section) => <div key={section.id} className="mt-3"><h3 className="text-sm font-medium">{section.title}</h3>{section.questions.filter((q) => q.answer).map((q) => <p key={q.id} className="mt-1 text-sm text-pl-text-2">{q.answer}</p>)}</div>)}</details>)}</details>
                <details className="py-4"><summary className="cursor-pointer text-sm font-medium">Original material</summary><p className="mt-2 whitespace-pre-wrap break-words text-sm text-pl-text-2">{draftData?.data?.answers?.__source?.text || "No source text saved. Add material above or write your answers directly."}</p></details>
                <details className="py-4" ref={(el) => { sectionRefs.current.attachments = el; }}><summary className="cursor-pointer text-sm font-medium">Source files · {attachments.length}</summary><div className="mt-3 space-y-2">{attachments.map((f: any) => <p key={f.id} className="flex min-w-0 items-center gap-2 text-sm"><FileText className="size-4 shrink-0" /><span className="break-all">{f.original_name}</span></p>)}<input ref={attachInputRef} type="file" multiple className="hidden" onChange={(e) => { if (e.target.files?.length) uploadAttachment(Array.from(e.target.files)); e.target.value = ""; }} /><Button size="sm" variant="outline" onClick={() => attachInputRef.current?.click()}><Plus />Add files</Button></div></details>
              </div>
            </div>
            <aside className="min-w-0 space-y-5">
              <section className="border-b border-pl-border pb-5"><h2 className="text-sm font-semibold">Submission readiness</h2><p className="mt-2 text-lg font-semibold">{requiredComplete ? "Ready for review" : `${missingRequired.length} required answer${missingRequired.length === 1 ? "" : "s"} to finish`}</p><p className="mt-1 text-xs text-pl-text-3">{requiredComplete ? "Your Workspace Admin receives this disclosure when you submit." : "Complete these answers to submit your disclosure."}</p>{!requiredComplete && <ul className="mt-3 space-y-1">{missingRequired.map((id) => <li key={id}><button className="rounded-sm py-1 text-left text-sm text-pl-blue-text underline-offset-2 hover:underline focus-visible:ring-2 focus-visible:ring-ring" onClick={() => scrollToSection(sections.find((s) => s.questions.some((q: any) => q.id === id))?.id)}>{FIELD_META[id].label} →</button></li>)}</ul>}</section>
              <section ref={evaluationSectionRef}><h2 className="text-sm font-semibold">Optional evaluation</h2>
                {dirtySinceScore && scored && <p className="mt-2 text-xs text-pl-amber-text">Evaluated before your latest edits.</p>}
                {scoringActive ? <div className="mt-3"><EvaluationProgress compact evaluationId={runningEvaluationId} reference={idea?.reference_number} state={serverEvaluationState} reEvaluating={dirtySinceScore} /></div> : evaluationLoadError ? <div role="alert" className="mt-3 text-sm"><p>Could not load the evaluation.</p><Button size="sm" variant="outline" className="mt-2" onClick={() => reloadEvaluation()}>Reload evaluation</Button></div> : evaluationLoading ? <p role="status" className="mt-3 text-sm text-pl-text-3">Loading evaluation…</p> : serverEvaluationStatus === "FAILED" ? <div role="alert" className="mt-3"><p className="text-sm font-medium">{serverEvaluationState === "TIMED_OUT" ? "Evaluation timed out" : "Evaluation could not finish"}</p><p className="mt-2 text-sm text-pl-text-2">Your disclosure is saved. Try evaluating again, or submit for review.</p></div> : scored && scoreMeta?.scoringResult ? <div className="mt-3"><PatentNoveltyReport embedded title={idea?.title} reference={idea?.reference_number} api_evaluation_id={scoreMeta.id} scoringResult={scoreMeta.scoringResult} priorArt={scoreMeta.priorArt ?? []} report={scoreMeta} /><Button className="mt-3" size="sm" variant="ghost" onClick={() => setEvaluationOpen(true)}>Open detailed report</Button></div> : <><p className="mt-2 text-xs text-pl-text-3">AI-assisted and advisory. You can submit without it.</p><h3 className="mt-3 text-sm font-medium">Patentability signal · not a score</h3><p className="mt-2 text-sm text-pl-text-2">{liveSignal}</p></>}
                {!evaluationLoadError && <Button className="mt-3" size="sm" variant="outline" disabled={isScoring || scoringActive || evaluationLoading} onClick={handleFinish}>{scoringActive ? "Evaluating…" : scored || serverEvaluationStatus === "FAILED" ? "Evaluate again" : "Evaluate idea"}</Button>}
              </section>
            </aside>
          </div>
        </>}
      </div>
      </div>
      <footer className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-t border-pl-border bg-background px-6 py-3"><p className="min-w-0 text-xs text-pl-text-3">{finishNote || (requiredComplete ? "Submit this disclosure to your Workspace Admin." : "Your draft stays editable until you submit it for review.")}</p><Button size="sm" onClick={handleSend} disabled={isSending || !online || !draftData}>{isSending ? "Submitting…" : requestedChanges || reconsidering ? "Resubmit for review" : "Submit for review"}</Button></footer>
      <Dialog open={evaluationOpen} onOpenChange={setEvaluationOpen}><DialogContent className="max-h-full max-w-4xl overflow-y-auto" onOpenAutoFocus={(event) => { event.preventDefault(); evaluationTitleRef.current?.focus({ preventScroll: true }); }}><DialogHeader><DialogTitle ref={evaluationTitleRef} tabIndex={-1} className="outline-none">Evaluation result</DialogTitle><DialogDescription>{idea?.reference_number} · {idea?.title}</DialogDescription></DialogHeader>{dirtySinceScore && <p className="text-sm text-pl-amber-text">Evaluated before your latest edits.</p>}{scoreMeta?.scoringResult && <PatentNoveltyReport embedded title={idea?.title} reference={idea?.reference_number} api_evaluation_id={scoreMeta.id} scoringResult={scoreMeta.scoringResult} priorArt={scoreMeta.priorArt ?? []} report={scoreMeta} />}<Button size="sm" className="justify-self-start" onClick={() => setEvaluationOpen(false)}>Return to disclosure</Button></DialogContent></Dialog>
      <Dialog open={!!conflictDraft} onOpenChange={(open) => { if (!open) setConflictDraft(null); }}><DialogContent className="max-h-full overflow-y-auto"><DialogHeader><DialogTitle>Compare the saved revision</DialogTitle><DialogDescription>Your answers remain in the disclosure. Review the latest saved answers before choosing which version to keep.</DialogDescription></DialogHeader><div className="space-y-3">{disclosureSections(conflictDraft?.meta_data).map((section) => <details key={section.id}><summary className="cursor-pointer text-sm font-medium">{section.title}</summary>{section.questions.map((q) => <div key={q.id} className="mt-3 text-sm"><h3 className="font-medium">{FIELD_META[q.id]?.label || q.text}</h3><div className="mt-2 grid gap-3 sm:grid-cols-2"><div><p className="text-xs text-pl-text-3">Your answer</p><p className="mt-1">{answers[q.id] || "No answer"}</p></div><div><p className="text-xs text-pl-text-3">Saved answer</p><p className="mt-1">{q.answer || "No answer"}</p></div></div></div>)}</details>)}</div><div className="flex flex-wrap gap-2"><Button size="sm" variant="outline" onClick={() => { setSections(disclosureSections(conflictDraft.meta_data)); setProvenance(Object.fromEntries(disclosureSections(conflictDraft.meta_data).flatMap((section) => section.questions).filter((question) => question.answer?.trim()).map((question) => [question.id, question.provenance || "you"]))); versionRef.current = conflictDraft.version ?? 0; sessionStorage.removeItem(recoveryKey); setSaveState("saved"); setConflictDraft(null); }}>Use saved revision</Button><Button size="sm" onClick={async () => { versionRef.current = conflictDraft.version ?? 0; try { await saveNow(sections, provenance, completion); setConflictDraft(null); } catch { /* Keep the comparison open on failure. */ } }}>Save my answers instead</Button></div></DialogContent></Dialog>
      <Dialog open={confirmSubmit} onOpenChange={setConfirmSubmit}><DialogContent><DialogHeader><DialogTitle>{requestedChanges || reconsidering ? "Resubmit this disclosure?" : "Submit this disclosure for review?"}</DialogTitle><DialogDescription>{idea?.submitted_by ? `Inventor: ${idea.author?.name}. Submitted by: ${idea.submitted_by.name}. ` : ""}Your Workspace Admin will review this version. You can edit it again if changes are requested.</DialogDescription></DialogHeader>{reconsidering && <div><label htmlFor="reconsideration-note" className="text-sm font-medium">What changed since the decision?</label><textarea id="reconsideration-note" rows={3} value={reconsiderationNote} onChange={(event) => setReconsiderationNote(event.target.value)} className={`mt-2 ${fieldCls}`} /><p className="mt-1 text-xs text-pl-text-3">Required for reconsideration. Your Workspace Admin receives this note with the revision.</p></div>}<div className="flex flex-wrap justify-end gap-2"><Button size="sm" variant="outline" onClick={() => setConfirmSubmit(false)}>Keep editing</Button><Button size="sm" disabled={isSending || (reconsidering && !reconsiderationNote.trim())} onClick={() => sendToCommittee()}>{isSending ? "Submitting…" : "Submit for review"}</Button></div></DialogContent></Dialog>
    </div>
  );
};

export default DraftWorkspace;
