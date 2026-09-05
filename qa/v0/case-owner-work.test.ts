import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "../../mock/handlers";
import { V0_SCENARIOS } from "../../mock/scenarios/v0";
import { BEACON, NORTHWIND, ORBITAL, V0_USERS } from "../../mock/scenarios/v0/personas";
import { getDb, resetDb } from "../../mock/runtime/db";
import { clock } from "../../mock/runtime/clock";
import { setFramePersona } from "../../mock/runtime/session";

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => setFramePersona(null));
const seed = (slug: string) => {
  const scenario = V0_SCENARIOS[`v0/my-work/${slug}`];
  clock.set(scenario.clock);
  resetDb(scenario, { persist: false, fresh: true });
  setFramePersona(V0_USERS.caseOwner.email);
};
const request = (path: string, method = "GET") => fetch(`http://localhost/v1${path}`, { method });
const work = async (suffix = "") => (await (await request(`/dashboard${suffix}`)).json()).case_owner_work;

describe("Case Owner home scope and access requests", () => {
  it("keeps work and portfolio context assigned even when a foreign client filter is supplied", async () => {
    seed("new-approved-idea");
    const summary = await work();
    expect(summary.totals).toEqual({ approved: 2, urgent: 2, clients: 2 });
    expect(summary.clients.map((c: { client_id: string }) => c.client_id).sort()).toEqual([NORTHWIND.id, BEACON.id].sort());
    expect(summary.map.total_active_patents).toBe(8);
    expect(JSON.stringify(summary)).not.toContain(ORBITAL.id);
    expect(JSON.stringify(summary)).not.toContain(ORBITAL.name);
    const foreignFilter = await work(`?client_id=${ORBITAL.id}`);
    expect(JSON.stringify(foreignFilter)).not.toContain(ORBITAL.id);
    expect(foreignFilter.map).toEqual(summary.map);
    seed("no-assigned-clients");
    const empty = await work();
    expect(empty.totals).toEqual({ approved: 0, urgent: 0, clients: 0 });
    expect(empty.map.total_active_patents).toBe(0);
    expect(empty.approved).toEqual([]);
    expect(empty.urgent).toEqual([]);
  });

  it("stores an expired-access request without restoring assignment or client reads", async () => {
    seed("access-expired");
    expect((await request(`/clients/${BEACON.id}`)).status).toBe(403);
    expect((await request(`/clients/${BEACON.id}/request-access`, "POST")).status).toBe(202);
    expect((await request(`/clients/${BEACON.id}`)).status).toBe(403);
    const summary = await work();
    expect(summary.clients.map((c: { client_id: string }) => c.client_id)).toEqual([NORTHWIND.id]);
    expect(summary.setup.find((item: { kind: string }) => item.kind === "access")).toMatchObject({ client_id: BEACON.id, requested_at: clock.iso(), href: null });
    expect(getDb().users.find(u => u.id === V0_USERS.caseOwner.id)?.assigned_client_ids).toEqual([NORTHWIND.id]);
  });
});
