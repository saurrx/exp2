import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import IdeaDraftPage from "@/pages/IdeaDraftPage";
import type { Db } from "../../../mock/runtime/types";
import { route } from "../../../mock/runtime/registry";
const meta = {
  title: "Surfaces/Evaluation result", component: IdeaDraftPage,
  beforeEach: () => { for (const key of Object.keys(sessionStorage)) if (key.startsWith("pulse-disclosure:")) sessionStorage.removeItem(key); },
  tags: ["redesign", "viewport:1280x720", "viewport:1440x900"],
  parameters: { pulse: { scenario: "v0/evaluation/not-run", persona: "INVENTOR", path: "/ideas/:id/draft", route: (db: Db) => `/ideas/${db.drafts[0].idea_id}/draft?draftId=${db.drafts[0].id}` } },
} satisfies Meta<typeof IdeaDraftPage>;
export default meta;
type Story = StoryObj<typeof meta>;
const state = (slug: string) => ({ pulse: { scenario: `v0/evaluation/${slug}` } });
const ready = async (canvasElement: HTMLElement) => { const c = within(canvasElement); await expect(await c.findByRole("heading", { name: "Submission readiness" })).toBeVisible(); await expect(c.getByRole("button", { name: "Submit for review" })).toBeEnabled(); return c; };
const report = async (canvasElement: HTMLElement) => { const c = await ready(canvasElement); await userEvent.click(await c.findByRole("button", { name: "Open detailed report" })); const d = within(await within(document.body).findByRole("dialog")); await waitFor(() => expect(d.getByRole("heading", { name: "Assessment" })).toBeVisible()); await expect(d.getByText(/Prior art ·/).closest("details")).not.toHaveAttribute("open"); return d; };
export const NotRun: Story = { play: async ({ canvasElement }) => { const c = await ready(canvasElement); await expect(await c.findByText("Patentability signal · not a score")).toBeVisible(); } };
export const Queued: Story = { parameters: state("queued"), play: async ({ canvasElement }) => { const c = await ready(canvasElement); await expect(await c.findByText("Evaluation queued")).toBeVisible(); } };
export const Running: Story = { parameters: state("running"), play: async ({ canvasElement }) => { const c = await ready(canvasElement); await expect(await c.findByText("Evaluation in progress")).toBeVisible(); } };
export const Succeeded: Story = { tags: ["viewport:1366x768", "viewport:1920x1080", "viewport:640x360@2"], parameters: state("succeeded"), play: async ({ canvasElement }) => { const d = await report(canvasElement); await expect(d.getByText("2.3")).toBeVisible(); await expect(d.getByText("Closely matched")).toBeVisible(); } };
export const Partial: Story = { parameters: state("partial"), play: async ({ canvasElement }) => { const d = await report(canvasElement); await expect(d.getByText("Partial result · the score is provisional")).toBeVisible(); } };
export const NoClosePriorArt: Story = { parameters: state("no-close-prior-art"), play: async ({ canvasElement }) => { const d = await report(canvasElement); await expect(d.getByText(/No close prior art was returned/)).toBeVisible(); } };
export const Failed: Story = { parameters: state("failed"), play: async ({ canvasElement }) => { const c = await ready(canvasElement); await expect(await c.findByText("Evaluation could not finish")).toBeVisible(); await expect(c.getByRole("button", { name: "Evaluate again" })).toBeEnabled(); } };
export const TimedOut: Story = { parameters: state("timed-out"), play: async ({ canvasElement }) => { const c = await ready(canvasElement); await expect(await c.findByText("Evaluation timed out")).toBeVisible(); } };
export const StaleAfterEdits: Story = { parameters: state("stale-after-edits"), play: async ({ canvasElement }) => { const c = await ready(canvasElement); await c.findByText("2.3"); await userEvent.type(c.getByLabelText(/Technological field/), " Revised."); await expect(c.getByText("Evaluated before your latest edits.")).toBeVisible(); } };
export const ReEvaluating: Story = { parameters: state("re-evaluating"), play: async ({ canvasElement }) => { const c = await ready(canvasElement); await c.findByText("2.3"); await userEvent.type(c.getByLabelText(/Technological field/), " Revised."); await userEvent.click(c.getByRole("button", { name: "Evaluate again" })); const status = await c.findByText(/Re-evaluating your disclosure|Evaluation queued/); await expect(status).toBeVisible(); await waitFor(() => expect(status.getBoundingClientRect().top).toBeGreaterThanOrEqual(0)); await expect(status.getBoundingClientRect().bottom).toBeLessThanOrEqual(window.innerHeight); } };
export const Loading: Story = { parameters: { msw: { handlers: [route("get", "/v1/drafts/:id/evaluation", async () => { await new Promise((r) => setTimeout(r, 12000)); return { status: "NONE", score: null, report: null }; })] } }, play: async ({ canvasElement }) => { const c = await ready(canvasElement); await expect(c.getByText("Loading evaluation…")).toBeVisible(); } };
export const Error: Story = { parameters: { msw: { handlers: [route("get", "/v1/drafts/:id/evaluation", () => ({ status: 503, body: { message: "Evaluation unavailable" } }))] } }, play: async ({ canvasElement }) => { const c = await ready(canvasElement); await expect(await c.findByText("Could not load the evaluation.", {}, { timeout: 15000 })).toBeVisible(); await expect(c.getByRole("button", { name: "Reload evaluation" })).toBeEnabled(); await expect(c.queryByRole("button", { name: "Evaluate idea" })).toBeNull(); } };
export const WorkspaceAdmin: Story = { parameters: { pulse: { scenario: "v0/evaluation/workspace-admin", persona: "LEGAL_COUNSEL" } }, play: async ({ canvasElement }) => { await report(canvasElement); } };
