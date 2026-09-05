import { getDb } from "../runtime/db";
import { patentById } from "../runtime/store";
import { getFramePersona, readSessionUser } from "../runtime/session";
import type { Db, Idea, User } from "../runtime/types";

/** The caller, from the session cookie, resolved against the store. */
export function currentUser(): User | null {
  const pinned = getFramePersona();
  if (pinned) return getDb().users.find((u) => u.email === pinned) ?? null;
  const s = readSessionUser();
  if (!s) return null;
  const db = getDb();
  return db.users.find((u) => u.id === s.id) ?? db.users.find((u) => u.email === s.email) ?? null;
}

/** Ideas the caller may read: inventors their own, client roles their tenant, Photon roles everything (case owners their assignments). */
export function visibleIdeas(db: Db, u: User | null): Idea[] {
  if (!u) return [];
  if (u.role === "INVENTOR") return db.ideas.filter((i) => i.client_id === u.client_id && (i.author_id === u.id || db.inventors.some((x) => x.idea_id === i.id && x.inventor_id === u.id)));
  if (u.role === "TECH_COMMITTEE" || u.role === "LEGAL_COUNSEL") return db.ideas.filter((i) => i.client_id === u.client_id);
  if (u.role === "CASE_OWNER") return db.ideas.filter((i) => u.assigned_client_ids.includes(i.client_id));
  return db.ideas;
}

export function hydrateIdea(db: Db, i: Idea, now: number) {
  const author = db.users.find((x) => x.id === i.author_id);
  const submitter = i.submitted_by_id ? db.users.find((x) => x.id === i.submitted_by_id) : null;
  const client = db.clients.find((c) => c.id === i.client_id);
  const draft = db.drafts.filter((d) => d.idea_id === i.id).sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];
  const inventors = db.inventors.filter((x) => x.idea_id === i.id).map((x) => {
    const inv = db.users.find((u) => u.id === x.inventor_id);
    return { id: x.id, role: x.role, inventor: inv ? { id: inv.id, name: inv.name, email: inv.email } : null };
  });
  const link = (db as Db & { links?: Array<{ idea_id: string; patent_id: string }> }).links?.find((link) => link.idea_id === i.id);
  const patent = link ? patentById(link.patent_id) : null;
  const since = i.submitted_at ?? i.created_at;
  return {
    ...i,
    reference_number: i.reference,
    author: author ? { id: author.id, name: author.name, email: author.email } : null,
    submitted_by: submitter ? { id: submitter.id, name: submitter.name, email: submitter.email } : null,
    client: client ? { id: client.id, name: client.name } : null,
    inventors,
    patent_link: patent ? { patent: { id: patent.id, title: patent.title, application_number: patent.application_number, jurisdiction: patent.jurisdiction, status: patent.status, filing_date: patent.filing_date, grant_date: patent.grant_date } } : null,
    ...(db.flags.v0 ? { files: db.files.filter((file) => file.idea_id === i.id && file.status === "STORED").map((file) => ({ ...file, file_path: `/v1/files/${file.id}/raw` })) } : {}),
    ...(db.flags.v0 ? { case_owners: db.users.filter((owner) => owner.role === "CASE_OWNER" && owner.assigned_client_ids.includes(i.client_id)).map((owner) => ({ id: owner.id, name: owner.name })) } : {}),
    score: draft?.score ?? null,
    ageDays: Math.max(0, Math.floor((now - Date.parse(since)) / 86_400_000)),
  };
}
