import type { ScenarioDef } from "../../runtime/types";
import { uuid } from "../../runtime/prng";
import { clock } from "../../runtime/clock";
import { buildIdeas, emptyData, portfolio, rngFor, seedOperations, type Data, type IdeaSpec } from "../build";
import { generatePortfolio } from "../portfolio";
import { BEACON, NORTHWIND, ORBITAL, V0_ACCESS, V0_ALL_USERS, V0_CLIENTS, V0_USERS as U } from "./personas";
import { disclosureSections, storedDisclosure } from "../../../src/components/ideas/disclosureMaterial";
import { disclosureFingerprint } from "../../runtime/disclosureFingerprint";
import { outboxFor } from "./emails";

/**
 * V0 scenarios. Four personas, one Workspace Admin review stage, no committee,
 * no superadmin. Names start with `v0/`; the legacy six-role scenarios keep
 * their names and serve only the Legacy reference tier. Every V0 scenario sets
 * `flags.v0`, which is what lets the mock model the two founder-approved
 * behaviours the backend does not have yet (mock/proposed-fields.json):
 * Workspace Admin submission on behalf of an inventor with separate
 * attribution, and the activation email outbox.
 */
const NOW = "2026-09-03T09:00:00.000Z";

/** V0 tenants, V0 people, no legacy account anywhere in the store. */
export const emptyDataV0 = (flags: Data["flags"] = {}): Data => ({ ...emptyData({ ...flags, v0: true }), clients: V0_CLIENTS, users: V0_ALL_USERS, access: V0_ACCESS });

const SMALL = { [NORTHWIND.id]: portfolio(180, "northwind-v1", NORTHWIND), [BEACON.id]: portfolio(6, "beacon-v1", BEACON, 0.5) };
const LARGE = { [NORTHWIND.id]: portfolio(14356, "northwind-large", NORTHWIND, 0.96), [BEACON.id]: portfolio(6, "beacon-v1", BEACON, 0.5) };

/** Northwind's ideas: every V0 state, evaluation states, a low score that was submitted anyway, one submitted on behalf, one resubmitted. */
const northwind = (): IdeaSpec[] => [
  { invention: 0, author: U.inventor, coInventors: [U.coinventor], state: "LEGAL_REVIEW", ageDays: 1, evaluation: { state: "SUCCEEDED", score: 74 } },
  { invention: 1, author: U.coinventor, state: "LEGAL_REVIEW", ageDays: 3, submittedBy: U.admin, evaluation: { state: "SUCCEEDED", score: 62 } },
  { invention: 2, author: U.inventor, state: "LEGAL_REVIEW", ageDays: 6, evaluation: { state: "SUCCEEDED", score: 68 } },
  { invention: 3, author: U.coinventor, state: "LEGAL_REVIEW", ageDays: 12, evaluation: { state: "SUCCEEDED", score: 23 } },
  { invention: 4, author: U.inventor, state: "LEGAL_REVIEW", ageDays: 19, evaluation: { state: "PARTIAL", score: 58 } },
  { invention: 5, author: U.coinventor, state: "LEGAL_REVIEW", ageDays: 33, evaluation: { state: "SUCCEEDED", score: 71 } },
  { invention: 6, author: U.inventorPriya, state: "CHANGES_REQUESTED", ageDays: 9, reviewer: U.admin, comment: "Please add the measured drift figures from the encoder test so the novelty is supported by data." },
  { invention: 7, author: U.inventorLucas, state: "REJECTED", ageDays: 45, reviewer: U.admin2, comment: "The mechanism was shown at a trade fair more than a year ago; the overlay alone is not distinguishing." },
  { invention: 8, author: U.inventorHana, state: "SENT_TO_PHOTON", ageDays: 1, reviewer: U.admin, evaluation: { state: "SUCCEEDED", score: 81 } },
  { invention: 9, author: U.inventorPriya, state: "SENT_TO_PHOTON", ageDays: 38, reviewer: U.admin, evaluation: { state: "SUCCEEDED", score: 69 } },
  { invention: 10, author: U.inventor, state: "FILED", ageDays: 140, reviewer: U.admin, evaluation: { state: "SUCCEEDED", score: 77 } },
  { invention: 11, author: U.inventor, state: "DRAFT", ageDays: 4, completion: 40 },
  { invention: 12, author: U.inventor, state: "DRAFT", ageDays: 2, completion: 100, evaluation: { state: "SUCCEEDED", score: 66 } },
  { invention: 13, author: U.coinventor, state: "DRAFT", ageDays: 1, completion: 0 },
  { invention: 14, author: U.inventor, state: "DRAFT", ageDays: 1, completion: 100, evaluation: { state: "RUNNING" } },
  // The oldest wait in the queue, past the 30-day aging threshold (DSN-0002).
  { invention: 15, author: U.coinventor, state: "LEGAL_REVIEW", ageDays: 56, evaluation: { state: "SUCCEEDED", score: 81 } },
  // Complete without evaluation: submission must remain available (DSN-0000).
  { invention: 16, author: U.inventor, state: "DRAFT", ageDays: 1, completion: 100 },
];

/* ---- Workspace Admin dashboard states (product-context/surfaces/workspace-admin-dashboard.md, DSN-0002) ---- */

const LONG_TITLE = "Self-calibrating multi-axis interferometric displacement sensor with thermally compensated reference cavity for in-line metrology of large precision components";

/** One idea waiting past the aging threshold, everything else decided. */
const oneUrgentReview = (): IdeaSpec[] => [
  { invention: 0, author: U.inventor, coInventors: [U.coinventor], state: "LEGAL_REVIEW", ageDays: 41, evaluation: { state: "SUCCEEDED", score: 74 } },
  { invention: 8, author: U.inventor, state: "SENT_TO_PHOTON", ageDays: 12, reviewer: U.admin, evaluation: { state: "SUCCEEDED", score: 81 } },
  { invention: 10, author: U.coinventor, state: "FILED", ageDays: 140, reviewer: U.admin, evaluation: { state: "SUCCEEDED", score: 77 } },
  { invention: 7, author: U.coinventor, state: "REJECTED", ageDays: 45, reviewer: U.admin2, comment: "The mechanism was shown at a trade fair more than a year ago." },
];

/** Forty ideas waiting, ages spread from two days to ten weeks; several past the threshold. */
const largeAgingQueue = (): IdeaSpec[] => Array.from({ length: 40 }, (_, k) => ({
  invention: k, author: k % 3 === 0 ? U.coinventor : U.inventor, coInventors: k % 5 === 0 ? [U.coinventor] : undefined,
  state: "LEGAL_REVIEW" as const, ageDays: 2 + Math.round((k * 68) / 39),
  evaluation: { state: "SUCCEEDED" as const, score: 35 + ((k * 17) % 60) },
}));

/** Nothing submitted this calendar quarter; four were submitted last quarter. Two of those are still waiting. */
const quietQuarter = (): IdeaSpec[] => [
  { invention: 3, author: U.inventor, state: "LEGAL_REVIEW", ageDays: 70, evaluation: { state: "SUCCEEDED", score: 58 } },
  { invention: 4, author: U.coinventor, state: "LEGAL_REVIEW", ageDays: 81, evaluation: { state: "SUCCEEDED", score: 64 } },
  { invention: 8, author: U.inventor, state: "SENT_TO_PHOTON", ageDays: 75, reviewer: U.admin, evaluation: { state: "SUCCEEDED", score: 81 } },
  { invention: 10, author: U.inventor, state: "FILED", ageDays: 88, reviewer: U.admin, evaluation: { state: "SUCCEEDED", score: 77 } },
  { invention: 9, author: U.coinventor, state: "FILED", ageDays: 160, reviewer: U.admin, evaluation: { state: "SUCCEEDED", score: 69 } },
];

/** One inventor is the whole program so far. */
const singleInventor = (): IdeaSpec[] => [
  { invention: 0, author: U.inventor, state: "LEGAL_REVIEW", ageDays: 4, evaluation: { state: "SUCCEEDED", score: 74 } },
  { invention: 2, author: U.inventor, state: "LEGAL_REVIEW", ageDays: 11, evaluation: { state: "SUCCEEDED", score: 68 } },
  { invention: 8, author: U.inventor, state: "SENT_TO_PHOTON", ageDays: 20, reviewer: U.admin, evaluation: { state: "SUCCEEDED", score: 81 } },
  { invention: 10, author: U.inventor, state: "FILED", ageDays: 140, reviewer: U.admin, evaluation: { state: "SUCCEEDED", score: 77 } },
];

/** 120-character titles and a long inventor name in the queue and the ranking. */
const longTitles = (): IdeaSpec[] => [
  { invention: 0, author: U.longNameInventor, coInventors: [U.inventor], state: "LEGAL_REVIEW", ageDays: 34, title: LONG_TITLE, evaluation: { state: "SUCCEEDED", score: 74 } },
  { invention: 1, author: U.longNameInventor, state: "LEGAL_REVIEW", ageDays: 9, title: `${LONG_TITLE.slice(0, 60)} (variant B, revised after the encoder trial)`, evaluation: { state: "SUCCEEDED", score: 62 } },
  { invention: 2, author: U.inventor, state: "LEGAL_REVIEW", ageDays: 6, title: LONG_TITLE.replace("multi-axis", "dual-axis"), evaluation: { state: "SUCCEEDED", score: 68 } },
  { invention: 3, author: U.coinventor, state: "LEGAL_REVIEW", ageDays: 2, evaluation: { state: "SUCCEEDED", score: 23 } },
  { invention: 8, author: U.longNameInventor, state: "SENT_TO_PHOTON", ageDays: 15, reviewer: U.admin, evaluation: { state: "SUCCEEDED", score: 81 } },
  { invention: 10, author: U.longNameInventor, state: "FILED", ageDays: 140, reviewer: U.admin, title: LONG_TITLE, evaluation: { state: "SUCCEEDED", score: 77 } },
];

/** The idea at index `at` becomes a resubmission: a changes-requested round before the current review, revision 2. */
function resubmitted(name: string, d: Data, at: number) {
  const rng = rngFor(`${name}.resubmission`);
  const idea = d.ideas[at];
  if (!idea || idea.state !== "LEGAL_REVIEW") return;
  const first = d.transitions.find((t) => t.idea_id === idea.id && t.to_state === "LEGAL_REVIEW");
  const when = clock.daysAgo(Math.max(1, Math.round((Date.now() - Date.parse(idea.submitted_at ?? clock.iso())) / 86_400_000) + 8));
  d.transitions.push({ id: uuid(rng), idea_id: idea.id, from_state: null, to_state: "LEGAL_REVIEW", stage: null, decision: null, actor_id: idea.author_id, revision: 1, comment: null, is_appeal: false, created_at: when });
  d.transitions.push({ id: uuid(rng), idea_id: idea.id, from_state: "LEGAL_REVIEW", to_state: "CHANGES_REQUESTED", stage: "LEGAL", decision: "CHANGES_REQUESTED", actor_id: U.admin.id, revision: 1, comment: "Please describe the calibration step in enough detail for a reader to repeat it.", is_appeal: false, created_at: when });
  if (first) { first.from_state = "CHANGES_REQUESTED"; first.revision = 2; }
  idea.revision = 2;
}

/**
 * Give the established Northwind portfolio named V0 inventors for the dashboard
 * ranking. These are overlays on generated records, so the portfolio total and
 * application data stay stable while the mock gains deterministic attribution.
 */
function seedDashboardPatentInventors(d: Data) {
  const spec = d.portfolios[NORTHWIND.id];
  if (!spec) return;
  const patents = generatePortfolio(NORTHWIND, spec).patents;
  const ranked = [
    [U.coinventor, 5],
    [U.inventor, 4],
    [U.inventorPriya, 3],
    [U.inventorHana, 2],
    [U.inventorLucas, 1],
  ] as const;
  let at = 0;
  for (const [inventor, count] of ranked) {
    for (let k = 0; k < count && at < patents.length; k++, at++) {
      d.patentOverrides[patents[at].id] = {
        inventors: [inventor.name],
        filing_date: clock.daysAgo(2 + at * 3),
      };
    }
  }
}

function northwindBuild(name: string, portfolios: Record<string, ReturnType<typeof portfolio>> = SMALL, ideas: IdeaSpec[] = northwind()): Data {
  const rng = rngFor(name);
  const d = emptyDataV0();
  buildIdeas(rng, NORTHWIND, ideas, d, 1);
  resubmitted(name, d, 2);
  d.portfolios = portfolios;
  seedDashboardPatentInventors(d);
  seedOperations(rng, d);
  // A failed import in Northwind's history, for the Photon exception states.
  d.imports.push({ id: uuid(rng), client_id: NORTHWIND.id, file_id: d.files[0]?.id ?? uuid(rng), status: "FAILED", rows_total: 41, created_count: 0, updated_count: 0, unchanged_count: 0, failed_count: 41, due_dates_created: 0, duplicate_in_file: 3, unmapped_columns: ["Renewal owner"], errors: [{ row: 2, message: "Jurisdiction column is empty." }], completed_at: clock.daysAgo(2), created_at: clock.daysAgo(2), imported_by_id: U.caseOwner.id });
  return d;
}

const v0 = (name: string, title: string, description: string, defaultPersona: string, personas: string[], build: () => Data): ScenarioDef => ({
  name, title, description, clock: NOW, defaultPersona, personas,
  build: () => { const d = build(); for (const evaluation of d.evaluations) { const draft = d.drafts.find((draft) => draft.id === evaluation.draft_id); if (draft) { evaluation.input_fingerprint = disclosureFingerprint(draft.answers); evaluation.input_revision = d.ideas.find((idea) => idea.id === draft.idea_id)?.revision; } } d.emails = outboxFor(rngFor(`${name}.emails`), d); return d; },
});

const inventorFirstRun = v0("v0/inventor/first-run", "New inventor at Northwind, nothing yet",
  "Ines Duarte activated yesterday and has no idea: first run, the invitation and reminder emails, colleagues' momentum, Submit an idea leading.",
  U.newInventor.email, [U.newInventor.email, U.invitedInventor.email, U.admin.email], () => northwindBuild("v0/inventor/first-run"));

const inventorPortfolio = v0("v0/inventor/portfolio", "Inventor with ideas in every V0 state",
  "Anika Sharma's ideas: drafts at three completions including one evaluated and not submitted, awaiting review, changes requested, resubmitted, rejected, sent to Photon Legal, filed. Evaluations not run, running, partial, succeeded, and a low score that was submitted.",
  U.inventor.email, [U.inventor.email, U.coinventor.email, U.admin.email], () => northwindBuild("v0/inventor/portfolio"));

// DSN-0005: focused Inventor home states, built through the same scenario engine.
const homeScenario = (slug: string, title: string, specs: IdeaSpec[]) => v0(`v0/inventor/${slug}`, title,
  "Focused Inventor home state with synthetic Northwind ideas and company portfolio context.",
  U.inventor.email, [U.inventor.email], () => northwindBuild(`v0/inventor/${slug}`, SMALL, specs));
const homeNoIdeas = homeScenario("no-ideas", "Inventor with no ideas", northwind().filter((i) => i.author.id !== U.inventor.id && !i.coInventors?.some((u) => u.id === U.inventor.id)));
const homeDraft = homeScenario("active-draft", "Inventor with one active draft", [{ invention: 0, author: U.inventor, state: "DRAFT", ageDays: 2, completion: 40 }]);
const homeStatuses = homeScenario("several-statuses", "Inventor ideas with next steps", [
  { invention: 0, author: U.inventor, state: "CHANGES_REQUESTED", ageDays: 6, reviewer: U.admin, comment: "Please explain the calibration step so a reader can repeat it." },
  { invention: 1, author: U.inventor, state: "DRAFT", ageDays: 2, completion: 40 },
  { invention: 2, author: U.inventor, state: "LEGAL_REVIEW", ageDays: 1 },
  { invention: 3, author: U.inventor, state: "SENT_TO_PHOTON", ageDays: 8, reviewer: U.admin },
  { invention: 4, author: U.inventor, state: "FILED", ageDays: 50, reviewer: U.admin },
]);
const homeChanges = homeScenario("requested-changes", "Inventor responding to requested changes", [{ invention: 0, author: U.inventor, state: "CHANGES_REQUESTED", ageDays: 6, reviewer: U.admin, comment: "Please explain the calibration step so a reader can repeat it." }]);
const homeRecent = homeScenario("recent-submission", "Inventor after submission", [{ invention: 0, author: U.inventor, state: "LEGAL_REVIEW", ageDays: 0 }]);
const homeEvaluation = homeScenario("evaluation-available", "Inventor with an evaluation ready", [{ invention: 0, author: U.inventor, state: "DRAFT", ageDays: 2, completion: 100, evaluation: { state: "SUCCEEDED", score: 23 } }]);

// DSN-0006 disclosure states use the same deterministic idea builder and canonical questionnaire.
const disclosureScenario = (slug: string, completion: number, evaluation?: IdeaSpec["evaluation"], changes = false) => v0(`v0/disclosure/${slug}`, `Disclosure: ${slug}`,
  "Synthetic disclosure state for source review, saving and optional evaluation.", U.inventor.email, [U.inventor.email, U.admin.email], () => {
    const db = northwindBuild(`v0/disclosure/${slug}`, SMALL, [{ invention: 0, author: U.inventor, state: changes ? "CHANGES_REQUESTED" : "DRAFT", ageDays: 2, completion, evaluation, ...(changes ? { reviewer: U.admin, comment: "Please explain how the calibration step can be repeated." } : {}) }]);
    const draft = db.drafts[0];
    const meta = disclosureSections(draft.answers.__meta_data as any[]);
    if (completion === 100) meta.find((s) => s.id === "advantages")!.questions[0].answer = "The synthetic fixture combines the passive element with closed-loop correction without an external reference signal.";
    if (completion === 0) meta.forEach((s) => s.questions.forEach((q) => { q.answer = ""; }));
    if (slug === "partially-prefilled" || slug === "unsupported-gaps") meta.forEach((s) => s.questions.forEach((q) => { if (q.answer) q.provenance = "ai"; if (q.id === "adv1") q.answer = ""; }));
    draft.answers = storedDisclosure(meta);
    draft.version = 0;
    if (changes) draft.history = [{ revision: 1, answers: JSON.parse(JSON.stringify(draft.answers)), submitted_at: draft.created_at }];
    if (slug === "evaluation-stale") draft.updated_at = "2026-09-03T08:00:00.000Z";
    return db;
  });
const disclosureStates = [disclosureScenario("empty", 0), disclosureScenario("partially-prefilled", 40), disclosureScenario("unsupported-gaps", 80), disclosureScenario("complete", 100), disclosureScenario("evaluation-running", 100, { state: "RUNNING" }), disclosureScenario("evaluation-result", 100, { state: "SUCCEEDED", score: 23 }), disclosureScenario("evaluation-stale", 100, { state: "SUCCEEDED", score: 62 }), disclosureScenario("requested-changes", 100, undefined, true)];

function alignCableEvidence(db: Data) {
    const draft = db.drafts[0];
    const evaluationReport = db.evaluations[0]?.report as any;
    if (evaluationReport) {
      const examples = [
        ["Passive cable tensioner with an external setting reference", "A passive spring maintains cable tension. An operator sets the reference tension before use; the assembly does not correct it automatically during movement."],
        ["Cable routing fixture with an encoder and external reference", "An encoder measures cable movement against an external reference. The fixture reports drift but does not adjust tension through a control loop."],
        ["Joint cable guide with manual reference adjustment", "A guide routes a cable through an articulated joint. Its initial tension is adjusted manually against a reference gauge and remains fixed during operation."],
      ];
      evaluationReport.scoringResult.closestMatches.forEach((match: any, index: number) => { match.title = examples[index][0]; match.abstract = examples[index][1]; });
      evaluationReport.priorArt.forEach((art: any, index: number) => { art.title = examples[index][0]; art.abstract = examples[index][1]; });
      if (db.evaluations[0]?.state === "PARTIAL") evaluationReport.scoringResult.summary = "The prior-art search completed, but the obviousness analysis timed out. The returned references share the cable arrangement and do not describe the correction loop.";
      else evaluationReport.scoringResult.summary = "The closest references share the cable arrangement and external reference setting. None of these returned references describes the self-correcting loop in the disclosure. Search coverage is limited to the references returned.";
      draft.report = evaluationReport;
    }
}

const evaluationStates = ["not-run", "queued", "running", "succeeded", "partial", "no-close-prior-art", "failed", "timed-out", "stale-after-edits", "re-evaluating", "workspace-admin"].map((slug) => v0(`v0/evaluation/${slug}`, `Evaluation: ${slug}`,
  "Synthetic advisory evaluation with submission available at every score.", slug === "workspace-admin" ? U.admin.email : U.inventor.email, [U.inventor.email, U.admin.email], () => {
    const state = slug === "queued" ? "QUEUED" : slug === "running" ? "RUNNING" : slug === "failed" ? "FAILED" : slug === "timed-out" ? "TIMED_OUT" : slug === "partial" ? "PARTIAL" : "SUCCEEDED";
    const db = northwindBuild(`v0/evaluation/${slug}`, SMALL, [{ invention: 0, author: U.inventor, state: "DRAFT", completion: 100, ageDays: 2, ...(slug === "workspace-admin" ? { submittedBy: U.admin } : {}), ...(slug === "not-run" ? {} : { evaluation: { state, score: slug === "no-close-prior-art" ? 81 : 23 } }) }]);
    const draft = db.drafts[0];
    const meta = disclosureSections(draft.answers.__meta_data as any[]);
    meta.find((section) => section.id === "advantages")!.questions[0].answer = "The synthetic fixture combines the passive element with closed-loop correction without an external reference signal.";
    draft.answers.__meta_data = meta;
    alignCableEvidence(db);
    if (slug === "no-close-prior-art") {
      const report = db.evaluations[0].report as any;
      report.priorArt = []; report.scoringResult.closestMatches = []; report.scoringResult.distinctDifferences = [];
      report.scoringResult.summary = "No close reference was returned by the available search. The search coverage does not establish uniqueness.";
      report.scoringResult.recommendations = [{ text: "Explain how the correction loop responds when the load changes.", rationale: "The technical response needs enough detail for comparison.", basis: [] }];
      report.scoringResult.evaluationMetrics = { evaluationCount: 0, maxSimilarity: null, avgSimilarity: null };
      draft.report = report;
    }
    return db;
  }));

// DSN-0008: disclosure status, ownership, filing links and supporting files.
const ideaDetailStates = ["draft", "evaluated", "submitted", "under-review", "changes-requested", "rejected", "resubmitted", "sent-to-photon", "filed", "granted", "closed", "missing-evaluation", "partial-evaluation", "on-behalf-attribution", "long-content"].map((slug) => v0(`v0/idea-detail/${slug}`, `Idea detail: ${slug}`,
  "Synthetic invention disclosure with one review stage, distinct attribution and recorded next steps.", U.inventor.email, [U.inventor.email, U.admin.email, U.caseOwner.email, U.photonAdmin.email], () => {
    const state = slug === "draft" || slug === "evaluated" ? "DRAFT" : slug === "changes-requested" ? "CHANGES_REQUESTED" : slug === "rejected" ? "REJECTED" : slug === "sent-to-photon" ? "SENT_TO_PHOTON" : ["filed", "granted", "closed"].includes(slug) ? "FILED" : "LEGAL_REVIEW";
    const db = northwindBuild(`v0/idea-detail/${slug}`, SMALL, [{ invention: 0, author: U.inventor, coInventors: [U.coinventor], state, completion: slug === "draft" ? 0 : 100, ageDays: 6, reviewer: U.admin,
      comment: slug === "rejected" ? "The submitted material does not yet explain how the correction loop differs from the external-reference mechanism. You may revise and resubmit with that distinction." : "Please explain how the correction loop responds to a change in load and include the repeatability observations.",
      ...(slug === "on-behalf-attribution" ? { submittedBy: U.admin } : {}), ...(slug === "long-content" ? { title: "Self-tensioning cable harness with passive tension control and a self-correcting feedback loop for articulated robot joints under variable load" } : {}),
      ...(["draft", "missing-evaluation"].includes(slug) ? {} : { evaluation: { state: slug === "partial-evaluation" ? "PARTIAL" : "SUCCEEDED", score: 62 } }) }]);
    alignCableEvidence(db);
    const idea = db.ideas[0], draft = db.drafts[0];
    if (slug !== "draft") { const meta = disclosureSections(draft.answers.__meta_data as any[]); meta.find((section) => section.id === "advantages")!.questions[0].answer = "The cable loop corrects tension during movement without an external reference signal."; draft.answers.__meta_data = meta; }
    draft.answers.__source = { text: "Synthetic workshop notes: the cable loop self-corrects tension as the articulated joint moves. Confirm load-response measurements before asserting repeatability.", kind: "text" };
    if (slug === "resubmitted") resubmitted(`v0/idea-detail/${slug}`, db, 0);
    const rng = rngFor(`v0/idea-detail/${slug}.files`);
    if (slug !== "missing-evaluation" && slug !== "draft") db.files.push({ id: uuid(rng), idea_id: idea.id, client_id: idea.client_id, original_name: "cable-loop-observations.json", file_name: "cable-loop-observations.json", content_type: "application/json", size_bytes: 184, status: "STORED", category: "idea", uploaded_by_id: U.inventor.id, created_at: idea.created_at });
    if (state === "FILED") { const patent = generatePortfolio(NORTHWIND, SMALL[NORTHWIND.id]).patents[0]; db.patentOverrides[patent.id] = { ...db.patentOverrides[patent.id], title: idea.title, status: slug === "granted" ? "GRANTED" : slug === "closed" ? "EXPIRED" : "PUBLISHED" }; (db as Data & { links: Array<{ idea_id: string; patent_id: string }> }).links = [{ idea_id: idea.id, patent_id: patent.id }]; }
    return db;
  }));

/** DSN-0009: meaningful, source-consistent review evidence for queue states. */
function reviewQueueEvidence(data: Data): Data {
  for (const idea of data.ideas) {
    const draft = data.drafts.find((draft) => draft.idea_id === idea.id);
    if (!draft) continue;
    const thermal = idea.title.startsWith("Thermal drift");
    const path = idea.title.startsWith("Collision-aware");
    const answers = draft.answers as Record<string, any>;
    const source = thermal ? {
      problem: "Position readings drift as the encoder warms during a shift. A temperature reading at the motor does not describe the sensing element's recent thermal history.",
      solution: "A temperature sensor beside the encoder tracks recent heating and cooling. The controller uses that history to adjust the position signal continuously while the robot moves.",
      novelty: "Local thermal history drives the correction, rather than a fixed lookup table or a remote temperature reading. The inventor proposes testing repeated heating and cooling cycles to quantify the difference.",
    } : path ? {
      problem: "A robot makes abrupt steering corrections when its planned route passes close to obstacles. Repeated corrections slow the route and can disturb the carried load.",
      solution: "A learned clearance map estimates available space around the route. The planner smooths changes in curvature using that map before sending the path to the motion controller.",
      novelty: "The proposed distinction is using learned clearance estimates during smoothing, without building a separate obstacle model. Comparative route measurements would help establish its effect.",
    } : { problem: answers.problem, solution: answers.solution, novelty: answers.novelty };
    Object.assign(answers, source);
    for (const section of answers.__meta_data || []) for (const question of section.questions || []) if (source[question.id as keyof typeof source]) question.answer = source[question.id as keyof typeof source];
    idea.body = source.novelty;
    const report = draft.report as any;
    if (report?.scoringResult) {
      const distinction = thermal ? "using local thermal history in the correction" : path ? "using learned clearance during path smoothing" : "combining the passive element with the correction loop";
      report.scoringResult.summary = (draft.score ?? 0) < 40
        ? `The returned references overlap closely with the disclosed mechanism. The distinction in ${distinction} needs a clearer comparison and supporting measurements.`
        : (draft.score ?? 0) >= 80
          ? `The returned references share the underlying system but do not describe ${distinction}. This is the main distinction identified by the search; comparative measurements would strengthen the disclosure.`
          : `The returned references share several features. The proposed difference is ${distinction}; its effect and implementation need a more specific explanation.`;
    }
  }
  return data;
}

const workspaceAdminQueue = v0("v0/workspace-admin/queue", "Workspace Admin queue at Northwind",
  "Seven scored ideas awaiting the one review stage, oldest 56 days, one submitted on behalf of an inventor by the admin, one resubmitted after changes. Five contributing inventors, two Workspace Admins, and deadlines with contextual dates.",
  U.admin.email, [U.admin.email, U.admin2.email, U.inventor.email, U.caseOwner.email], () => reviewQueueEvidence(northwindBuild("v0/workspace-admin/queue")));

const workspaceAdminEmpty = v0("v0/workspace-admin/empty", "New workspace at Beacon, no inventors yet",
  "Elin Sørensen's workspace six weeks in: no inventors, no ideas, a small imported portfolio, the activation emails that follow from that state.",
  U.beaconAdmin.email, [U.beaconAdmin.email, U.caseOwner.email], () => { const d = emptyDataV0(); d.portfolios = SMALL; seedOperations(rngFor("v0/workspace-admin/empty"), d, { requestsPerClient: 2 }); return d; });

/* Workspace Admin dashboard states. Each is Northwind with a different shape of program. */
const ADMIN = [U.admin.email, U.admin2.email, U.inventor.email];
const oneUrgent = v0("v0/workspace-admin/one-urgent-review", "One idea waiting past the aging threshold",
  "A single idea has waited 41 days for a decision; everything else in the program is decided. The dashboard's one-urgent-review state.",
  U.admin.email, ADMIN, () => northwindBuild("v0/workspace-admin/one-urgent-review", SMALL, oneUrgentReview()));
const largeQueue = v0("v0/workspace-admin/large-aging-queue", "Forty ideas waiting, several past the threshold",
  "A large aging queue: forty ideas awaiting review with waits from two days to ten weeks. The dashboard shows six and links to the rest.",
  U.admin.email, ADMIN, () => reviewQueueEvidence(northwindBuild("v0/workspace-admin/large-aging-queue", SMALL, largeAgingQueue())));
const noActionsDue = v0("v0/workspace-admin/no-actions-due", "Nothing due in the next 30 days",
  "Northwind's queue with a portfolio that has no upcoming due dates: the Actions box reads none due.",
  U.admin.email, ADMIN, () => northwindBuild("v0/workspace-admin/no-actions-due", { [NORTHWIND.id]: portfolio(180, "northwind-v1", NORTHWIND, 0), [BEACON.id]: SMALL[BEACON.id] }));
const quiet = v0("v0/workspace-admin/quiet-quarter", "No submissions this quarter",
  "Nothing was submitted this calendar quarter and four were submitted last quarter: a declining program. Top inventors has nobody this quarter.",
  U.admin.email, ADMIN, () => northwindBuild("v0/workspace-admin/quiet-quarter", SMALL, quietQuarter()));
const emptyPortfolio = v0("v0/workspace-admin/empty-portfolio", "No patents added yet",
  "Northwind's idea program is running but no patent data has been added: the portfolio boxes read zero and the map has no markers.",
  U.admin.email, ADMIN, () => northwindBuild("v0/workspace-admin/empty-portfolio", { [NORTHWIND.id]: portfolio(0, "northwind-none", NORTHWIND), [BEACON.id]: SMALL[BEACON.id] }));
const single = v0("v0/workspace-admin/single-inventor", "One inventor is the whole program",
  "Every idea so far comes from one inventor: Top inventors has one row.",
  U.admin.email, ADMIN, () => northwindBuild("v0/workspace-admin/single-inventor", SMALL, singleInventor()));
const longTitleIdeas = v0("v0/workspace-admin/long-titles", "Long titles and a long inventor name",
  "Idea titles of 120 characters and a five-word inventor name in the queue, the ranking and the pipeline.",
  U.admin.email, [U.admin.email, U.longNameInventor.email, U.inventor.email], () => northwindBuild("v0/workspace-admin/long-titles", SMALL, longTitles()));

const caseOwnerMyWork = v0("v0/case-owner/my-work", "Case Owner with two assigned clients",
  "Devika Nair covers Northwind and, since five days, Beacon: an idea newly sent to Photon Legal, urgent Actions and dates, Beacon's onboarding incomplete. Jonas Weber has no assigned client yet.",
  U.caseOwner.email, [U.caseOwner.email, U.caseOwner2.email, U.photonAdmin.email], () => northwindBuild("v0/case-owner/my-work"));

const photonAdminFirm = v0("v0/photon-admin/firm", "Photon Admin across the firm",
  "Orbital Foods has no Case Owner and no Workspace Admin, Northwind has a failed import and ideas aging after approval, Beacon is mid-onboarding.",
  U.photonAdmin.email, [U.photonAdmin.email, U.caseOwner.email], () => northwindBuild("v0/photon-admin/firm"));

const large = v0("v0/shape/large", "A large Northwind portfolio",
  "About 14,000 patents and 13,000 dates through server-style paging, generated per request.",
  U.admin.email, [U.admin.email, U.inventor.email, U.photonAdmin.email], () => northwindBuild("v0/shape/large", LARGE));

const failure = v0("v0/shape/failure", "Every write fails",
  "Mutations answer 400 with a message, evaluations fail or time out, an import reports duplicates and errors.",
  U.admin.email, [U.admin.email, U.inventor.email, U.caseOwner.email, U.photonAdmin.email], () => {
    const d = northwindBuild("v0/shape/failure");
    d.flags = { ...d.flags, mutationsFail: true, importTrouble: true };
    d.evaluations.forEach((e) => { if (e.state === "RUNNING" || e.state === "QUEUED") { e.state = "TIMED_OUT"; e.failure_reason = "The evaluation exceeded its time budget."; } });
    return d;
  });

const slow = v0("v0/shape/slow", "Slow network",
  "Every response takes two seconds, for loading and saving states.",
  U.admin.email, [U.admin.email, U.inventor.email, U.caseOwner.email, U.photonAdmin.email], () => { const d = northwindBuild("v0/shape/slow"); d.flags = { ...d.flags, latencyMs: 2000 }; return d; });

const authFailures = v0("v0/auth/failures", "Authentication failures",
  "The only V0 scenario that returns 401 on purpose: invalid login, expired session with a failed refresh, revoked access, SSO failure, unknown domain at signup.",
  U.admin.email, [U.admin.email], () => { const d = emptyDataV0({ authFails: true }); d.portfolios = SMALL; return d; });

const ideasListStates = ["drafts-only", "mixed", "long-titles"].map((slug) => v0(`v0/ideas/${slug}`, `Ideas list: ${slug}`, "Own and credited ideas with direct next steps.", U.inventor.email, [U.inventor.email], () => {
  const specs: IdeaSpec[] = slug === "drafts-only" ? [
    { invention: 0, author: U.inventor, state: "DRAFT", completion: 40, ageDays: 2 },
    { invention: 1, author: U.inventor, state: "DRAFT", completion: 100, ageDays: 4 },
  ] : [
    { invention: 0, author: U.inventor, state: "CHANGES_REQUESTED", ageDays: 1, reviewer: U.admin, comment: "Please explain how the adjustment loop responds when cable load changes.", evaluation: { state: "SUCCEEDED", score: 62 } },
    { invention: 1, author: U.inventor, state: "DRAFT", completion: 100, ageDays: 2, evaluation: { state: "RUNNING" } },
    { invention: 2, author: U.coinventor, coInventors: [U.inventor], state: "LEGAL_REVIEW", ageDays: 3, evaluation: { state: "SUCCEEDED", score: 74 } },
    { invention: 3, author: U.inventor, state: "SENT_TO_PHOTON", ageDays: 4, reviewer: U.admin },
    { invention: 4, author: U.inventor, state: "REJECTED", ageDays: 5, reviewer: U.admin, comment: "The disclosed mechanism overlaps with the supplied reference. A revised distinction would help reconsideration." },
    { invention: 5, author: U.inventor, state: "DRAFT", completion: 40, ageDays: 6 },
  ];
  const data = northwindBuild(`v0/ideas/${slug}`, SMALL, specs);
  if (slug === "long-titles") data.ideas[0].title = "Self-tensioning cable harness with a load-responsive adjustment loop and independent reference setting for assemblies exposed to repeated mechanical movement";
  return data;
}));

const reviewMissingDetail = v0("v0/review/missing-detail", "Review: missing detail", "Submitted disclosure with unanswered mechanism and no supporting files.", U.admin.email, [U.admin.email], () => {
  const data = northwindBuild("v0/review/missing-detail", SMALL, [{ invention: 0, author: U.inventor, state: "LEGAL_REVIEW", completion: 20, ageDays: 6 }]);
  data.ideas[0].body = "A passive cable arrangement for an articulated joint. The inventor has not yet supplied the correction mechanism.";
  data.drafts[0].answers = { __meta_data: [{ id: "solution", title: "Solution", questions: [{ id: "sol1", text: "How does your invention work?", answer: "" }] }] };
  return data;
});

const portfolioLongTitles = v0("v0/portfolio/long-titles", "Portfolio with long titles", "Synthetic long titles preserve complete record identification at laptop and zoom widths.", U.admin.email, [U.admin.email, U.inventor.email, U.caseOwner.email, U.photonAdmin.email], () => {
  const data = northwindBuild("v0/portfolio/long-titles");
  for (const patent of generatePortfolio(NORTHWIND, SMALL[NORTHWIND.id]).patents.slice(0, 12)) data.patentOverrides[patent.id] = { ...data.patentOverrides[patent.id], title: "Self-tensioning cable harness with a load-responsive adjustment loop and independent reference setting for assemblies exposed to repeated mechanical movement across distributed mounting points" };
  return data;
});
const portfolioImportResult = v0("v0/portfolio/import-result", "Portfolio import with rows to correct", "An operational import returns created, updated, unchanged and failed rows with correction guidance.", U.caseOwner.email, [U.caseOwner.email, U.photonAdmin.email], () => {
  const data = northwindBuild("v0/portfolio/import-result"); data.flags.importTrouble = true; return data;
});

// DSN-0013: coherent synthetic patent records, without inferred filing dates.
const patentDetailStates = ["record", "pending", "filed", "granted", "inactive", "closed", "incomplete", "family", "no-idea", "documents", "long-title"].map(slug => v0(`v0/patent-detail/${slug}`, `Patent detail: ${slug}`, "A recorded synthetic asset with scoped evidence and operational dates.", U.inventor.email, [U.inventor.email, U.admin.email, U.caseOwner.email, U.photonAdmin.email], () => {
  const data = northwindBuild(`v0/patent-detail/${slug}`, SMALL, [{ invention: 0, author: U.inventor, coInventors: [U.coinventor], state: "FILED", completion: 100, ageDays: 400 }]);
  const patent = generatePortfolio(NORTHWIND, SMALL[NORTHWIND.id]).patents[0];
  const status = slug === "granted" ? "GRANTED" : slug === "inactive" ? "EXPIRED" : slug === "closed" ? "WITHDRAWN" : ["pending", "filed", "incomplete"].includes(slug) ? "APPLIED" : "EXAMINATION";
  const missing = slug === "incomplete";
  const filed = missing || slug === "pending" ? null : clock.daysAgo(365);
  data.patentOverrides[patent.id] = { ...data.patentOverrides[patent.id], title: slug === "long-title" ? "Self-tensioning cable harness with a load-responsive adjustment loop and independent reference setting for articulated robot joints under variable loads across distributed mounting points" : data.ideas[0].title, application_number: missing ? null : "SYN-US-2025-0042", jurisdiction: "US", status, filing_date: filed, grant_date: slug === "granted" || slug === "inactive" ? clock.daysAgo(100) : null, inventors: missing ? [] : [U.inventor.name, U.coinventor.name], current_assignee: NORTHWIND.name, assignee_original: NORTHWIND.name, abstract: missing ? null : "A passive cable harness adjusts tension as an articulated joint moves. A load-responsive element takes up slack and a feedback loop restores the reference setting after changes in movement. The arrangement is designed to reduce repeated manual adjustment across a range of joint positions.", simple_family_members: slug === "family" ? ["SYN-EP-2025-0042", "SYN-IN-2025-0042", "SYN-JP-2025-0042", "SYN-CA-2025-0042", "SYN-AU-2025-0042"] : [], additional_notes: "Imported record checked against the synthetic filing summary. Confirm family information with the next document update.", next_steps_gpo: ["Confirm the family application numbers against the supplied record."], next_steps_legal: [], status_timeline_history: filed ? [{ status: "APPLIED", date: filed }, ...(status !== "APPLIED" ? [{ status, date: clock.daysAgo(100) }] : [])] : [] };
  (data as Data & { links: Array<{ idea_id: string; patent_id: string }> }).links = slug === "no-idea" || missing ? [] : [{ idea_id: data.ideas[0].id, patent_id: patent.id }];
  for (const due of generatePortfolio(NORTHWIND, SMALL[NORTHWIND.id]).dueDates.filter(d => d.patent_id === patent.id)) data.dueDateOverrides[due.id] = { status: "COMPLETED" };
  const rng = rngFor(`v0/patent-detail/${slug}`);
  if (!["inactive", "closed", "pending", "incomplete"].includes(slug)) data.dueDates.push({ id: uuid(rng), patent_id: patent.id, client_id: NORTHWIND.id, title: "Response to examination report", event_type: "Office Action Response", due_at: clock.daysAhead(14), status: "PENDING", created_at: clock.iso(), updated_at: clock.iso() });
  if (!missing && slug !== "pending") for (let n = 0; n < (slug === "documents" ? 12 : 2); n++) data.files.push({ id: uuid(rng), client_id: NORTHWIND.id, original_name: n === 0 ? "synthetic-filing-summary.json" : `synthetic-supporting-record-${n + 1}.json`, file_name: `synthetic-record-${n + 1}.json`, content_type: "application/json", size_bytes: 184, status: "STORED", category: `patent:${patent.id}`, uploaded_by_id: U.caseOwner.id, created_at: clock.daysAgo(90) });
  return data;
}));

// DSN-0014: deterministic events and instructions for the three authorized personas.
const actionsStates = ["action-required", "saved-draft", "submitted", "updated", "acknowledged", "in-progress", "completed", "declined", "overdue", "missing-template", "no-action", "countries", "many", "empty-queue", "long-title"].map(slug => v0(`v0/actions/${slug}`, `Actions: ${slug}`, "Synthetic patent-event instructions with client and Photon ownership.", U.admin.email, [U.admin.email,U.caseOwner.email,U.photonAdmin.email,U.inventor.email], () => {
  const data = emptyDataV0();
  const count = slug === "many" ? 35 : 4;
  data.portfolios = { [NORTHWIND.id]: portfolio(count, "actions-northwind", NORTHWIND, 0), [BEACON.id]: portfolio(2, "actions-beacon", BEACON, 0) };
  const pats = generatePortfolio(NORTHWIND, data.portfolios[NORTHWIND.id]).patents;
  const rng = rngFor(`v0/actions/${slug}`);
  if (slug === "no-action" || slug === "empty-queue") return data;
  const states: Record<string, string> = { "submitted":"NEW", "updated":"NEW", "acknowledged":"ACKNOWLEDGED", "in-progress":"IN_PROGRESS", "completed":"COMPLETED", "declined":"DECLINED", "overdue":"NEW", "many":"NEW", "long-title":"NEW" };
  for (let n=0;n<count;n++) {
    const isForeign = n === 0 && slug === "countries";
    const event_type = isForeign ? "National Phase Entry Due (30m)" : n % 2 === 0 ? "Office Action Response Due" : "Renewal Fee Due";
    const title = isForeign ? "National phase entry" : n % 2 === 0 ? "Response to examination report" : "Patent renewal";
    const id = uuid(rng);
    data.patentOverrides[pats[n].id] = { application_number: `SYN-US-2025-${String(42+n).padStart(4,"0")}`, ...(slug === "long-title" && n===0 ? {title:"Self-tensioning cable harness with load-responsive adjustment and independent reference settings for articulated robot joints across distributed mounting points in variable operating conditions"} : {}) };
    data.dueDates.push({id,patent_id:pats[n].id,client_id:NORTHWIND.id,event_type,title,due_at:clock.daysAhead(n===0 && slug==="overdue"?-3:2+n*7),status:slug==="completed"&&n===0?"COMPLETED":"PENDING",created_at:clock.daysAgo(30),updated_at:clock.iso()});
    if ((n===0 && (states[slug] || slug==="saved-draft")) || slug==="many") {
      const template = data.actionTemplates.find(t=>t.event_types.includes(event_type))!;
      data.actionRequests.push({id:uuid(rng),client_id:NORTHWIND.id,due_date_id:id,template_id:template.id,instruction:template.label,selected_countries:[],note:"Please use the revised supporting information supplied with the record.",response_note:slug==="declined"?"The supplied record is missing the information needed to proceed. Please confirm the intended response with the Case Owner.":null,status:(states[slug] || "NO_ACTION") as any,submission_state:slug==="saved-draft"?"DRAFT":slug==="updated"?"UPDATED":"SUBMITTED",version:slug==="updated"?2:1,requested_by_id:U.admin.id,requested_at:clock.daysAgo(2),updated_at:clock.iso()});
    }
  }
  if (slug === "missing-template") data.actionTemplates = data.actionTemplates.filter(t=>!t.event_types.includes("Office Action Response Due"));
  return data;
}));

// DSN-0015: recorded operational dates, including absent and disputed values.
const dueDatesStates = ["upcoming", "due-soon", "overdue", "completed", "missing-date", "import-problem", "large-same-day-group", "no-upcoming-dates", "long-title", "firm-scope", "same-patent-events"].map(slug => v0(`v0/due-dates/${slug}`, `Photon due dates: ${slug}`, "Synthetic date maintenance with client ownership and source provenance.", U.caseOwner.email, [U.caseOwner.email, U.photonAdmin.email, U.admin.email, U.inventor.email], () => {
  const data = emptyDataV0();
  const count = slug === "large-same-day-group" ? 32 : 4;
  data.portfolios = { [NORTHWIND.id]: portfolio(count, "dates-northwind", NORTHWIND, 0), [ORBITAL.id]: portfolio(1, "dates-orbital", ORBITAL, 0) };
  const pats = generatePortfolio(NORTHWIND, data.portfolios[NORTHWIND.id]).patents;
  const rng = rngFor(`v0/due-dates/${slug}`);
  for (let n=0;n<count;n++) {
    const id=uuid(rng);
    data.patentOverrides[pats[n].id] = { application_number: `SYN-US-2025-${String(42+n).padStart(4,"0")}`, ...(slug === "long-title" && n===0 ? {title:"Self-tensioning cable harness with load-responsive adjustment and independent reference settings for articulated robot joints across distributed mounting points in variable operating conditions"} : {}) };
    data.dueDates.push({id,patent_id:slug==="same-patent-events" && n===1 ? pats[0].id : pats[n].id,client_id:NORTHWIND.id,title:n%2===0 ? "Response to examination report" : "Patent renewal",event_type:n%2===0 ? "Office Action Response Due" : "Renewal Fee Due",due_at:slug==="missing-date" && n===0 ? null : clock.daysAhead(slug==="large-same-day-group" ? 4 : n===0 && slug==="overdue" ? -3 : n===0 && slug==="due-soon" ? 2 : 14+n*7),status:slug==="completed" || slug==="no-upcoming-dates" ? "COMPLETED" : "PENDING",source:n===0 && slug==="import-problem" ? "Spreadsheet import" : "Manual Photon update",source_row:n===0 && slug==="import-problem" ? 14 : null,data_issue:n===0 && slug==="import-problem" ? "The spreadsheet date differs from the supporting record. Confirm the source before relying on this deadline." : null,created_at:clock.daysAgo(30),updated_at:clock.daysAgo(2)});
    if(n===0 || (slug==="same-patent-events" && n===1)) { const template=data.actionTemplates.find(t=>t.event_types.includes(data.dueDates[n].event_type))!; data.actionRequests.push({id:uuid(rng),client_id:NORTHWIND.id,due_date_id:id,template_id:template.id,instruction:template.label,selected_countries:[],note:null,status:"NEW",submission_state:"SUBMITTED",version:1,requested_by_id:U.admin.id,requested_at:clock.daysAgo(2),updated_at:clock.daysAgo(2)}); }
  }
  if(slug==="firm-scope") {const p=generatePortfolio(ORBITAL,data.portfolios[ORBITAL.id]).patents[0];data.dueDates.push({id:uuid(rng),patent_id:p.id,client_id:ORBITAL.id,title:"Confirm renewal date",event_type:"Renewal Fee Due",due_at:null,status:"PENDING",created_at:clock.iso(),updated_at:clock.iso()});}
  return data;
}));

const myWorkStates = ["no-assigned-clients", "newly-assigned-client", "new-approved-idea", "urgent-action", "overdue-date", "onboarding-incomplete", "access-expired", "long-title", "quiet", "access-request-error"].map(slug => v0(`v0/my-work/${slug}`, `Case Owner my work: ${slug}`, "Assigned-client approved work, urgent events and client setup; deterministic V0 evidence.", U.caseOwner.email, [U.caseOwner.email, U.caseOwner2.email, U.photonAdmin.email, U.admin.email], () => {
  const specs: IdeaSpec[] = [
    {invention:8,author:U.inventor,state:"SENT_TO_PHOTON",ageDays:1,reviewer:U.admin},
    {invention:9,author:U.coinventor,state:"SENT_TO_PHOTON",ageDays:12,reviewer:U.admin},
    {invention:10,author:U.inventor,state:"FILED",ageDays:35,reviewer:U.admin},
  ];
  const d = structuredClone(northwindBuild(`v0/my-work/${slug}`,{[NORTHWIND.id]:portfolio(14,"my-work-northwind",NORTHWIND,0),[BEACON.id]:portfolio(3,"my-work-beacon",BEACON,0),[ORBITAL.id]:portfolio(7,"my-work-orbital",ORBITAL,0)},specs));
  d.dueDates=[]; d.actionRequests=[];
  const owner=d.users.find(u=>u.id===U.caseOwner.id)!;
  const rng=rngFor(`v0/my-work/${slug}`), pats=generatePortfolio(NORTHWIND,d.portfolios[NORTHWIND.id]).patents;
  if(["new-approved-idea","urgent-action","overdue-date","long-title"].includes(slug))for(let n=0;n<2;n++) {
    const id=uuid(rng);d.patentOverrides[pats[n].id]={application_number:`SYN-US-2025-${String(42+n).padStart(4,"0")}`};
    d.dueDates.push({id,patent_id:pats[n].id,client_id:NORTHWIND.id,title:n===0?"Response to examination report":"Patent renewal",event_type:n===0?"Office Action Response Due":"Renewal Fee Due",due_at:clock.daysAhead(n===0?2:-3),status:"PENDING",created_at:clock.daysAgo(20),updated_at:clock.daysAgo(2)});
    if(n===0 && slug!=="overdue-date") {const template=d.actionTemplates.find(t=>t.event_types.includes("Office Action Response Due"))!;d.actionRequests.push({id:uuid(rng),client_id:NORTHWIND.id,due_date_id:id,template_id:template.id,instruction:template.label,selected_countries:[],note:null,status:"NEW",submission_state:"SUBMITTED",version:1,requested_by_id:U.admin.id,requested_at:clock.daysAgo(1),updated_at:clock.daysAgo(1)});}
  }
  if(!["new-approved-idea","long-title"].includes(slug)){d.ideas=d.ideas.filter(i=>i.state==="FILED");d.transitions=d.transitions.filter(t=>d.ideas.some(i=>i.id===t.idea_id));}
  if(slug==="urgent-action") d.dueDates=d.dueDates.filter(e=>e.event_type==="Office Action Response Due");
  if(slug==="overdue-date") d.dueDates=d.dueDates.filter(e=>e.event_type==="Renewal Fee Due");
  if(slug==="no-assigned-clients") {owner.assigned_client_ids=[];d.access=d.access.filter(a=>a.user_id!==owner.id);}
  if(["newly-assigned-client","onboarding-incomplete"].includes(slug)){owner.assigned_client_ids=[BEACON.id];d.access=d.access.filter(a=>a.client_id===BEACON.id);d.access.forEach(a=>a.granted_at=clock.daysAgo(slug==="newly-assigned-client"?1:18));}
  if(slug==="onboarding-incomplete")d.users=d.users.filter(u=>u.id!==U.beaconAdmin.id);
  if(["access-expired","access-request-error"].includes(slug)){owner.assigned_client_ids=[NORTHWIND.id];const a=d.access.find(a=>a.client_id===BEACON.id)!;a.kind="TEMPORARY";a.expires_at=clock.daysAgo(1);a.granted_at=clock.daysAgo(8);a.requested_at=null;}
  if(slug==="access-request-error")d.flags.mutationsFail=true;
  if(slug==="quiet")owner.assigned_client_ids=[NORTHWIND.id];
  if(slug==="long-title") {d.ideas.find(i=>i.state==="SENT_TO_PHOTON")!.title=LONG_TITLE; d.clients.find(c=>c.id===NORTHWIND.id)!.name="Northwind Instruments and Advanced Measurement Research Laboratories";}
  return d;
}));

const photonDashboardStates = ["healthy-operations", "unassigned-client", "aging-approved-ideas", "urgent-actions", "failed-import", "missing-client-configuration", "no-exceptions", "partial-data", "long-title"].map(slug => v0(`v0/photon-admin/${slug}`, `Photon Admin dashboard: ${slug}`, "Synthetic firm-wide ownership, incoming work and operational exception state.", U.photonAdmin.email, [U.photonAdmin.email, U.caseOwner.email, U.caseOwner2.email], () => {
  const specs: IdeaSpec[] = [
    {invention:8,author:U.inventor,state:"SENT_TO_PHOTON",ageDays:2,reviewer:U.admin},
    {invention:9,author:U.coinventor,state:"SENT_TO_PHOTON",ageDays:1,reviewer:U.admin},
    {invention:10,author:U.inventor,state:"FILED",ageDays:35,reviewer:U.admin},
  ];
  if(slug==="aging-approved-ideas") specs.splice(0,2,...[0,1,2,3,8,9].map((invention,n)=>({invention,author:U.inventor,state:"SENT_TO_PHOTON" as const,ageDays:[75,38,20,12,3,1][n],reviewer:U.admin})));
  const d=structuredClone(northwindBuild(`v0/photon-admin/${slug}`,{[NORTHWIND.id]:portfolio(18,"photon-northwind",NORTHWIND,0),[BEACON.id]:portfolio(6,"photon-beacon",BEACON,0),[ORBITAL.id]:portfolio(4,"photon-orbital",ORBITAL,0)},specs));
  const rng=rngFor(`v0/photon-admin/${slug}`);
  d.dueDates=[];d.actionRequests=[];
  if(slug!=="failed-import")d.imports=[];
  if(slug!=="unassigned-client") d.users.find(u=>u.id===U.caseOwner2.id)!.assigned_client_ids=[ORBITAL.id];
  if(slug!=="missing-client-configuration")d.users.push({...structuredClone(U.admin2),id:uuid(rng),email:"admin@orbital.test",name:"Mina Vale",client_id:ORBITAL.id});
  if(["urgent-actions","failed-import","missing-client-configuration","no-exceptions"].includes(slug)){d.ideas=d.ideas.filter(i=>i.state==="FILED");d.transitions=d.transitions.filter(t=>d.ideas.some(i=>i.id===t.idea_id));}
  if(["healthy-operations","urgent-actions"].includes(slug)) {
    for(const [n,client] of (slug==="urgent-actions"?[NORTHWIND,BEACON]:[NORTHWIND]).entries()) {
      const patent=generatePortfolio(client,d.portfolios[client.id]).patents[0],id=uuid(rng);
      d.patentOverrides[patent.id]={...d.patentOverrides[patent.id],application_number:`SYN-${client.idea_reference_prefix}-2025-0042`};
      d.dueDates.push({id,patent_id:patent.id,client_id:client.id,title:n===0?"Response to examination report":"Patent renewal",event_type:n===0?"Office Action Response Due":"Renewal Fee Due",due_at:clock.daysAhead(n===0?3:-2),status:"PENDING",created_at:clock.daysAgo(30),updated_at:clock.daysAgo(1)});
      if(n===0){const template=d.actionTemplates.find(t=>t.event_types.includes("Office Action Response Due"))!;d.actionRequests.push({id:uuid(rng),client_id:client.id,due_date_id:id,template_id:template.id,instruction:template.label,selected_countries:[],status:"NEW",submission_state:"SUBMITTED",version:1,note:null,requested_by_id:U.admin.id,requested_at:clock.daysAgo(1),updated_at:clock.daysAgo(1)});}
    }
  }
  if(slug==="partial-data")d.flags.photonDashboardUnavailable=["imports"];
  if(slug==="long-title"){d.ideas.find(i=>i.state==="SENT_TO_PHOTON")!.title=LONG_TITLE;d.clients.find(c=>c.id===NORTHWIND.id)!.name="Northwind Instruments and Advanced Measurement Research Laboratories";}
  return d;
}));

const clientStates = ["potential-client", "new-client", "no-owner", "no-admin", "no-inventors", "no-portfolio", "import-in-progress", "import-errors", "ready", "confirm-ready", "disabled", "access-request", "long-title", "empty"].map(slug => v0(`v0/clients/${slug}`, `Clients and onboarding: ${slug}`, "Synthetic client setup evidence and assigned client support.", U.photonAdmin.email, [U.photonAdmin.email, U.caseOwner.email], () => {
  const d=structuredClone(northwindBuild(`v0/clients/${slug}`,{[NORTHWIND.id]:portfolio(18,"clients-northwind",NORTHWIND,0),[BEACON.id]:portfolio(6,"clients-beacon",BEACON,0)},northwind().filter(i=>i.state!=="DRAFT")));
  d.imports=d.imports.filter(i=>i.status!=="FAILED");
  const client=d.clients.find(c=>c.id===NORTHWIND.id)!;
  client.onboarding_confirmed_at=clock.daysAgo(2);client.onboarding_confirmed_by=U.photonAdmin.id;
  if(["potential-client","new-client","no-owner","no-admin","no-inventors","no-portfolio","import-in-progress","import-errors","confirm-ready"].includes(slug)){client.onboarding_confirmed_at=null;client.onboarding_confirmed_by=null;}
  if(["potential-client","new-client"].includes(slug)) {
    client.type="POTENTIAL";client.domain="";client.created_at=clock.iso();
    d.users=d.users.filter(u=>u.client_id!==client.id);d.invites=d.invites.filter(i=>i.client_id!==client.id);d.ideas=d.ideas.filter(i=>i.client_id!==client.id);
    d.users.forEach(u=>u.assigned_client_ids=u.assigned_client_ids.filter(id=>id!==client.id));
  }
  if(slug==="no-owner")d.users.forEach(u=>u.assigned_client_ids=u.assigned_client_ids.filter(id=>id!==client.id));
  if(slug==="no-admin")d.users=d.users.filter(u=>!(u.client_id===client.id && u.role==="LEGAL_COUNSEL"));
  if(slug==="no-inventors") {d.users=d.users.filter(u=>!(u.client_id===client.id && u.role==="INVENTOR"));d.invites=d.invites.filter(i=>i.client_id!==client.id);d.ideas=d.ideas.filter(i=>i.client_id!==client.id);}
  if(["potential-client","new-client","no-portfolio","import-in-progress"].includes(slug)){d.portfolios[client.id]=portfolio(0,"clients-empty",client,0);d.dueDates=d.dueDates.filter(e=>e.client_id!==client.id);d.actionRequests=d.actionRequests.filter(a=>a.client_id!==client.id);}
  const latest=d.imports.find(i=>i.client_id===client.id);
  if(latest && ["import-in-progress","import-errors"].includes(slug)) {latest.status=slug==="import-errors"?"PARTIAL":"RUNNING";latest.failed_count=slug==="import-errors"?2:0;latest.duplicate_in_file=slug==="import-errors"?1:0;latest.created_count=slug==="import-errors"?15:0;latest.updated_count=0;latest.unchanged_count=0;latest.completed_at=slug==="import-errors"?clock.iso():null;latest.created_at=clock.iso();latest.errors=slug==="import-errors"?[{row:2,message:"Jurisdiction column is empty."},{row:7,message:"Application number is missing."}]:[];}
  else if(["potential-client","new-client","no-portfolio"].includes(slug))d.imports=d.imports.filter(i=>i.client_id!==client.id);
  if(["ready","confirm-ready","long-title"].includes(slug)) {
    const rng=rngFor(`v0/clients/${slug}/dates`),patent=generatePortfolio(client,d.portfolios[client.id]).patents[0];
    d.patentOverrides[patent.id]={...d.patentOverrides[patent.id],application_number:"SYN-NWI-2025-0042"};
    const event={id:uuid(rng),patent_id:patent.id,client_id:client.id,title:"Response to examination report",event_type:"Office Action Response Due",due_at:clock.daysAhead(4),status:"PENDING" as const,created_at:clock.daysAgo(20),updated_at:clock.daysAgo(1)};
    d.dueDates.push(event);
    const template=d.actionTemplates.find(t=>t.event_types.includes(event.event_type))!;
    d.actionRequests.push({id:uuid(rng),client_id:client.id,due_date_id:event.id,template_id:template.id,instruction:template.label,selected_countries:[],note:null,status:"NEW",submission_state:"SUBMITTED",version:1,requested_by_id:U.admin.id,requested_at:clock.daysAgo(1),updated_at:clock.daysAgo(1)});
  }
  if(slug==="disabled")client.is_active=false;
  if(slug==="access-request"){d.users.find(u=>u.id===U.caseOwner.id)!.assigned_client_ids=[BEACON.id];d.access=d.access.filter(a=>!(a.user_id===U.caseOwner.id && a.client_id===client.id));}
  if(slug==="long-title"){client.name="Northwind Instruments and Advanced Measurement Research Laboratories";client.domain="advanced-measurement-research.northwind.test";client.about="Synthetic research workspace for distributed optical measurement, thermal calibration and process instrumentation. Client records are maintained by the assigned Case Owner.";}
  if(slug==="empty"){d.users=d.users.filter(u=>u.client_id===null);d.users.forEach(u=>u.assigned_client_ids=[]);d.portfolios={};d.ideas=[];d.dueDates=[];d.actionRequests=[];d.access=[];d.imports=[];}
  return d;
}));

export const V0_SCENARIOS: Record<string, ScenarioDef> = Object.fromEntries([...clientStates, ...photonDashboardStates, ...myWorkStates, ...dueDatesStates, ...actionsStates, ...patentDetailStates, portfolioLongTitles, portfolioImportResult, reviewMissingDetail, ...ideasListStates, ...disclosureStates, ...evaluationStates, ...ideaDetailStates, inventorFirstRun, inventorPortfolio, homeNoIdeas, homeDraft, homeStatuses, homeChanges, homeRecent, homeEvaluation, workspaceAdminQueue, workspaceAdminEmpty, oneUrgent, largeQueue, noActionsDue, quiet, emptyPortfolio, single, longTitleIdeas, caseOwnerMyWork, photonAdminFirm, large, failure, slow, authFailures].map((s) => [s.name, s]));
export const DEFAULT_V0_SCENARIO = workspaceAdminQueue.name;
export { ORBITAL };
