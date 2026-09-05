/**
 * The two-persona isolation test. Two stories with different personas render
 * CONCURRENTLY in the same browser context, so they share the session cookie
 * and both storages exactly as Storybook frames do. Each is then forced to
 * refetch, and each must still show its own tenant's queue and navigation.
 */
import path from "node:path";
import { chromium } from "playwright";
import { serveStatic, blockEgress } from "./lib/serve.mjs";

const dir = path.resolve("storybook-static"); const port = 6022;
const close = await serveStatic(dir, port);
const browser = await chromium.launch();
const context = await browser.newContext({ viewport: { width: 1440, height: 900 } });
await blockEgress(context);
const open = async (id) => { const p = await context.newPage(); await p.goto(`http://localhost:${port}/iframe.html?id=${id}&viewMode=story`); await p.waitForSelector('body[data-story-ready="1"]', { timeout: 20_000 }); return p; };
const [inventor, admin] = await Promise.all([open("surfaces-ideas-list--inventor-mixed"), open("surfaces-review-decision--typical")]);
// Refetch both frame-local sessions after both have written the shared cookie.
const check = async (page, expected, other) => {
  await page.evaluate(() => window.dispatchEvent(new Event("focus")));
  const own = await page.getByText(expected, { exact: true }).count();
  const foreign = await page.getByText(other, { exact: true }).count();
  const decision = await page.getByRole("button", { name: "Send to Photon Legal", exact: true }).count();
  const ok = own > 0 && (expected === "Leah Feldman" ? decision === 1 : decision === 0 && foreign === 0);
  console.log(`${ok ? "ok" : "FAIL"} ${expected}: own identity ${own}, review decisions ${decision}`);
  return ok;
};
const a = await check(inventor, "Anika Sharma", "Leah Feldman");
const b = await check(admin, "Leah Feldman", "Anika Sharma");
await browser.close(); await close();
process.exit(a && b ? 0 : 1);
