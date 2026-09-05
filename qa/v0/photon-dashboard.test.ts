import { afterAll, afterEach, beforeAll, describe, expect, it } from "vitest";
import { setupServer } from "msw/node";
import { handlers } from "../../mock/handlers";
import { V0_SCENARIOS } from "../../mock/scenarios/v0";
import { NORTHWIND, ORBITAL, V0_USERS } from "../../mock/scenarios/v0/personas";
import { getDb, resetDb } from "../../mock/runtime/db";
import { allPatents } from "../../mock/runtime/store";
import { clock } from "../../mock/runtime/clock";
import { setFramePersona } from "../../mock/runtime/session";

const server = setupServer(...handlers);
beforeAll(() => server.listen({ onUnhandledRequest: "error" }));
afterAll(() => server.close());
afterEach(() => setFramePersona(null));
const seed = (slug: string) => {
  const scenario = V0_SCENARIOS[`v0/photon-admin/${slug}`];
  clock.set(scenario.clock);
  resetDb(scenario, { persist: false, fresh: true });
  setFramePersona(V0_USERS.photonAdmin.email);
};
const dashboard = async (suffix = "") => (await (await fetch(`http://localhost/v1/dashboard${suffix}`)).json());

describe("Photon Admin operational summary", () => {
  it("tracks ownership assignment without changing or exposing firm scope to other personas", async () => {
    seed("unassigned-client");
    const initial = (await dashboard()).photon_admin_work;
    expect(initial.ownership.map((c: { client_id: string }) => c.client_id)).toEqual([ORBITAL.id]);
    expect((await dashboard(`?client_id=${NORTHWIND.id}`)).photon_admin_work).toEqual(initial);
    const assigned = await fetch(`http://localhost/v1/case-owners/${V0_USERS.caseOwner2.id}/assignments`, { method:"PUT", headers:{"Content-Type":"application/json"}, body:JSON.stringify({client_ids:[ORBITAL.id]}) });
    expect(assigned.status).toBe(200);
    expect((await dashboard()).photon_admin_work.ownership).toEqual([]);
    for (const user of [V0_USERS.caseOwner, V0_USERS.admin, V0_USERS.inventor]) {
      setFramePersona(user.email);
      expect((await dashboard()).photon_admin_work).toBeUndefined();
    }
  });
  it("keeps unavailable imports unknown and derives firm geography from every client", async () => {
    seed("partial-data");
    const summary = (await dashboard()).photon_admin_work;
    expect(summary.imports).toBeNull();
    expect(summary.unavailable_sources).toEqual(["imports"]);
    const active = allPatents(null).filter(p => ["GRANTED","APPLIED","EXAMINATION"].includes(p.status));
    expect(active.some(p => p.client_id === ORBITAL.id)).toBe(true);
    expect(summary.context.active_patents).toBe(active.length);
    expect(summary.map.jurisdictions.reduce((sum: number, j: {granted_patents:number;pending_patents:number})=>sum+j.granted_patents+j.pending_patents,0)).toBe(active.length);
    getDb().flags.photonDashboardUnavailable = [];
    expect((await dashboard()).photon_admin_work.imports).toEqual([]);
  });
  it("clears a corrected import and distinguishes a checked quiet state from missing data", async () => {
    seed("failed-import");
    expect((await dashboard()).photon_admin_work.imports).toHaveLength(1);
    const record = getDb().imports.find(item => item.status === "FAILED")!;
    record.status = "COMPLETED"; record.failed_count = 0; record.errors = [];
    expect((await dashboard()).photon_admin_work.imports).toEqual([]);
    seed("no-exceptions");
    const summary = (await dashboard()).photon_admin_work;
    for(const name of ["ownership","approved","urgent","configuration","imports"]) expect(summary[name]).toEqual([]);
    expect(summary.unavailable_sources).toEqual([]);
    expect(summary.context.clients).toBe(3);
    expect(summary.context.active_patents).toBeGreaterThan(0);
  });
});
