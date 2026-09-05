import { chromium } from "playwright";
const base = (process.env.SMOKE_BASE || "http://localhost:3700").replace(/\/$/, "");
const baseHost = new URL(base).host;
const shots = "/private/tmp/claude-501/-Users-saurabh-PL-pulsemain/a5b7f644-bc51-4732-ae5b-d1ba69131cab/scratchpad/shots";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
const page = await ctx.newPage();
const external = new Set(); const errors = []; const v1 = [];
page.on("request", (r) => { const u = new URL(r.url()); if (u.host !== baseHost) external.add(u.host); else if (u.pathname.startsWith("/v1")) v1.push(`${r.method()} ${u.pathname}${u.search}`); });
page.on("console", (m) => { if (m.type() === "error") errors.push(m.text().slice(0, 200)); });
page.on("pageerror", (e) => errors.push("pageerror: " + e.message.slice(0, 200)));
const step = async (name, fn) => { try { await fn(); console.log("ok  ", name); } catch (e) { console.log("FAIL", name, "-", String(e.message || e).slice(0, 300)); } };

await step("login page renders on mock", async () => {
  await page.goto(base + "/login?scenario=v0/auth/entry", { waitUntil: "networkidle" });
  await page.waitForSelector("#design-tools", { state: "attached", timeout: 15000 });
  await page.getByRole("button", { name: "Open design tools" }).click();
  await page.getByRole("region", { name: "Design tools" }).waitFor();
  await page.getByRole("heading", { name: "Sign in to Pulse" }).waitFor();
  await page.screenshot({ path: `${shots}/01-login.png` });
});
await step("wrong email is refused with a visible error", async () => {
  await page.getByRole("button", { name: "Sign in with email", exact: true }).click();
  await page.locator("input[name=email]").fill("unknown@northwind.test");
  await page.locator("input[name=password]").fill("x");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.getByText("Invalid email or password.").first().waitFor({ timeout: 8000 });
});
await step("Inventor signs in and lands on their home", async () => {
  await page.locator("input[name=email]").fill("inventor@northwind.test");
  await page.locator("input[name=password]").fill("any");
  await page.getByRole("button", { name: "Sign in", exact: true }).click();
  await page.waitForURL(base + "/", { timeout: 15000 });
  await page.waitForLoadState("networkidle");
  await page.getByText("Anika Sharma").first().waitFor({ timeout: 10000 });
  await page.screenshot({ path: `${shots}/02-inventor-home.png` });
});
// DSN-0010: V0 review decision replaces the retired committee/counsel journeys.
await step("Workspace Admin records a filing handoff", async () => {
  await page.goto(base + "/ideas?scenario=v0/idea-detail/under-review&role=LEGAL_COUNSEL", { waitUntil: "networkidle" });
  await page.getByRole("button", { name: "Send to Photon Legal", exact: true }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("heading", { name: "Send to Photon Legal for filing?" }).waitFor();
  await dialog.getByRole("button", { name: "Send to Photon Legal", exact: true }).click();
  await page.getByText(/Sent to Photon Legal by Leah Feldman/).waitFor();
});
console.log("external hosts contacted:", external.size ? [...external].join(", ") : "none");
console.log("v1 requests seen:", v1.length, "distinct:", [...new Set(v1.map((x) => x.split("?")[0]))].length);
console.log("console errors:", errors.length); for (const e of errors.slice(0, 12)) console.log("  -", e);
await browser.close();
