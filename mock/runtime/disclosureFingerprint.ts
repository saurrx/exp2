import { seedFrom } from "./prng";

/** Compare the evaluated answer text, excluding save versions, provenance and source metadata. */
export function disclosureFingerprint(answers: Record<string, unknown>): number {
  const meta = answers.__meta_data;
  const fields: Array<[string, string]> = Array.isArray(meta)
    ? meta.flatMap((section: any) => (section.questions ?? []).map((question: any) => [String(question.id), String(question.answer ?? "").trim()] as [string, string]))
    : Object.entries(answers).filter(([key]) => !key.startsWith("__")).map(([key, value]) => [key, String(value ?? "").trim()]);
  return seedFrom(JSON.stringify(fields.sort(([a], [b]) => a.localeCompare(b))));
}
