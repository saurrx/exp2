import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "../../mock/handlers";
import { V0_SCENARIOS } from "../../mock/scenarios/v0";
import { V0_USERS, NORTHWIND, ORBITAL } from "../../mock/scenarios/v0/personas";
import { resetDb, getDb } from "../../mock/runtime/db";
import { clock } from "../../mock/runtime/clock";
import { setFramePersona } from "../../mock/runtime/session";

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => setFramePersona(null));
const seed = (slug: string) => {
  const scenario = V0_SCENARIOS[`v0/due-dates/${slug}`];
  clock.set(scenario.clock);
  resetDb(scenario, { persist: false, fresh: true });
  return getDb();
};
const request = (path: string, body?: unknown) => fetch(`http://localhost/v1${path}`, {
  method: body ? "PATCH" : "GET",
  headers: { "content-type": "application/json", "x-requested-with": "XMLHttpRequest" },
  body: body ? JSON.stringify(body) : undefined,
});
const correction = { title: "Confirm renewal date", due_at: "2026-09-12", correction_note: "Confirmed against the synthetic supporting record." };

describe("recorded event maintenance boundaries", () => {
  it("keeps assignment and persona boundaries on correction and completion", async () => {
    for (const [user, ownStatus, foreignStatus] of [
      [V0_USERS.inventor, 403, 403], [V0_USERS.admin, 403, 403],
      [V0_USERS.caseOwner, 200, 403], [V0_USERS.photonAdmin, 200, 200],
    ] as const) {
      const db = seed("firm-scope");
      setFramePersona(user.email);
      const own = db.dueDates.find(d => d.client_id === NORTHWIND.id)!;
      const foreign = db.dueDates.find(d => d.client_id === ORBITAL.id)!;
      expect((await request(`/due-dates/${own.id}`, correction)).status, user.role).toBe(ownStatus);
      expect((await request(`/due-dates/${foreign.id}`, correction)).status, user.role).toBe(foreignStatus);
      expect((await request(`/due-dates/${foreign.id}`, { status: "COMPLETED" })).status, user.role).toBe(foreignStatus);
    }
  });

  it("retains import provenance and separate Action status through correction and completion", async () => {
    const db = seed("import-problem");
    setFramePersona(V0_USERS.caseOwner.email);
    const event = db.dueDates[0], action = db.actionRequests.find(a => a.due_date_id === event.id)!;
    expect((await request(`/due-dates/${event.id}`, { ...correction, resolve_issue: true })).status).toBe(200);
    expect((await request(`/due-dates/${event.id}`, { status: "COMPLETED" })).status).toBe(200);
    const result = await (await request("/due-dates?filter=completed")).json();
    const recorded = result.data.find((d: { id: string }) => d.id === event.id);
    expect(recorded).toMatchObject({ due_at: "2026-09-12T00:00:00.000Z", data_issue: null, source: "Spreadsheet import", source_row: 14, correction_note: correction.correction_note, updated_by: V0_USERS.caseOwner.name, status: "COMPLETED" });
    expect(db.actionRequests.find(a => a.id === action.id)?.status).toBe("NEW");
  });

  it("keeps unknown and same-day dates out of overdue results and rejects impossible dates", async () => {
    const db = seed("missing-date");
    setFramePersona(V0_USERS.caseOwner.email);
    const event = db.dueDates[0];
    const missing = await (await request("/due-dates?filter=missing")).json();
    expect(missing.data.map((d: { id: string }) => d.id)).toEqual([event.id]);
    expect((await (await request("/due-dates?filter=overdue")).json()).data).toEqual([]);
    expect((await request(`/due-dates/${event.id}`, { ...correction, due_at: "2026-02-30" })).status).toBe(400);
    expect((await request(`/due-dates/${event.id}`, { ...correction, due_at: clock.iso().slice(0, 10) })).status).toBe(200);
    expect((await (await request("/due-dates?filter=overdue")).json()).data).toEqual([]);
    const today = await (await request("/due-dates?filter=dueToday")).json();
    expect(today.data.some((d: { id: string }) => d.id === event.id)).toBe(true);
  });

  it("paginates the complete same-day group and scopes month queries before pagination", async () => {
    seed("large-same-day-group");
    setFramePersona(V0_USERS.caseOwner.email);
    const first = await (await request("/due-dates?filter=open&limit=10&page=1")).json();
    const last = await (await request("/due-dates?filter=open&limit=10&page=4")).json();
    expect(first.pagination.total).toBe(32);
    expect(last.data).toHaveLength(2);
    expect(last.data.every((d: { id: string }) => !first.data.some((f: { id: string }) => f.id === d.id))).toBe(true);
    const future = await (await request("/due-dates?from=2026-10-01&to=2026-11-01&limit=10")).json();
    expect(future.data).toEqual([]);
    expect(future.pagination.total).toBe(0);
  });
  it("opens the exact submitted instruction when a patent has several events", async () => {
    const db = seed("same-patent-events");
    setFramePersona(V0_USERS.caseOwner.email);
    expect(db.dueDates[0].patent_id).toBe(db.dueDates[1].patent_id);
    const target = db.actionRequests.find(a => a.due_date_id === db.dueDates[1].id)!;
    const result = await (await request(`/actions/queue?request_id=${target.id}&page_info=1`)).json();
    expect(result.data).toHaveLength(1);
    expect(result.data[0].id).toBe(target.id);
    expect(result.data[0].due_date.id).toBe(db.dueDates[1].id);
  });

});
