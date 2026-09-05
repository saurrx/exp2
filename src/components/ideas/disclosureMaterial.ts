import ideaDraftQuestions from "@/lib/IdeaDraftQuestion";

const legacyFields: Record<string, string> = {
  background: "bg1", problem: "prob1", solution: "sol1", novelty: "adv1", application: "imp1",
};

/** Preserve narrative answers from the five-section schema in the existing questionnaire. */
export function disclosureSections(meta: any[] = []) {
  const questions = meta.flatMap((section) => section.questions ?? []);
  return ideaDraftQuestions.map((section) => ({
    ...section,
    title: section.id === "advantages" ? "Novelty" : section.id === "implementation" ? "Application" : section.title,
    questions: section.questions.map((question) => {
      const existing = questions.find((q) => q.id === question.id) ?? questions.find((q) => legacyFields[q.id] === question.id);
      return { ...question, ...(existing ? { answer: existing.answer ?? "", provenance: existing.provenance } : {}) };
    }),
  }));
}

export function supportedPrefill(meta: any[], answers: Record<string, string>) {
  return disclosureSections(meta).map((section) => ({
    ...section,
    questions: section.questions.map((question) => {
      const key = Object.keys(legacyFields).find((key) => legacyFields[key] === question.id);
      const answer = answers[question.id] ?? (key ? answers[key] : undefined);
      return question.id === "adv1" || question.answer?.trim() || !answer
        ? question : { ...question, answer, provenance: "ai" };
    }),
  }));
}

export function storedDisclosure(meta: any[], source?: { text: string; files: string[] }) {
  const fields = meta.flatMap((s) => s.questions);
  return { ...Object.fromEntries(fields.map((q) => [q.id, q.answer || ""])), __meta_data: meta,
    __completion: Math.round(fields.filter((q) => q.answer?.trim()).length / fields.length * 100),
    ...(source ? { __source: source } : {}),
  };
}
