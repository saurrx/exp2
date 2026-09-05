import { onlineManager } from "@tanstack/react-query";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import IdeaDraftPage from "@/pages/IdeaDraftPage";
import type { Db } from "../../../mock/runtime/types";
import { route } from "../../../mock/runtime/registry";
const draftRoute = (db: Db) => `/ideas/${db.drafts[0].idea_id}/draft?draftId=${db.drafts[0].id}`;
const meta = { title: "Surfaces/Invention disclosure workspace", component: IdeaDraftPage,
  beforeEach: () => { onlineManager.setOnline(true); for (const key of Object.keys(sessionStorage)) if (key.startsWith("pulse-disclosure:")) sessionStorage.removeItem(key); Object.defineProperty(navigator, "onLine", { configurable: true, get: () => true }); window.dispatchEvent(new Event("online")); return () => { onlineManager.setOnline(true); Object.defineProperty(navigator, "onLine", { configurable: true, get: () => true }); window.dispatchEvent(new Event("online")); }; },
  tags: ["redesign", "viewport:1280x720", "viewport:1440x900"],
  parameters: { pulse: { scenario: "v0/disclosure/empty", persona: "INVENTOR", path: "/ideas/:id/draft", route: draftRoute } },
} satisfies Meta<typeof IdeaDraftPage>;
export default meta;
type Story = StoryObj<typeof meta>;
const state = (slug: string) => ({ pulse: { scenario: `v0/disclosure/${slug}` } });
const ready = async (canvasElement: HTMLElement) => {
 const c = within(canvasElement);
 await expect(await c.findByRole("heading", { name: "Submission readiness" })).toBeVisible();
 await expect(c.getByRole("button", { name: /^Submit for review$|^Resubmit for review$/ })).toBeEnabled();
 await expect(c.queryByText(/^Submitted$/)).toBeNull();
 return c;
};
export const Empty: Story = { tags: ["viewport:1366x768", "viewport:1920x1080", "viewport:640x360@2"], play: async ({ canvasElement }) => { const c = await ready(canvasElement); await expect(c.getByRole("heading", { name: "Start from what you already have" })).toBeVisible(); } };
export const PartiallyPrefilled: Story = { parameters: state("partially-prefilled"), play: async ({ canvasElement }) => { const c = await ready(canvasElement); await expect(c.getByText("AI-drafted")).toBeVisible(); } };
export const UnsupportedGaps: Story = { parameters: state("unsupported-gaps"), play: async ({ canvasElement }) => { const c = await ready(canvasElement); await expect(c.getByText("1 required answer to finish")).toBeVisible(); } };
export const Saving: Story = { parameters: { ...state("empty"), msw: { handlers: [route("patch", "/v1/drafts/:id", async () => { await new Promise((resolve) => setTimeout(resolve, 12000)); return { status: 400, body: { message: "Save delayed" } }; })] } }, play: async ({ canvasElement }) => { const c = await ready(canvasElement); await userEvent.type(c.getByLabelText(/Technological field/), "Synthetic robot calibration."); await expect(c.getByText("Saving…")).toBeVisible(); } };
export const Saved: Story = { parameters: state("complete"), play: async ({ canvasElement }) => { await ready(canvasElement); } };
export const Offline: Story = { play: async ({ canvasElement }) => { const c = await ready(canvasElement); Object.defineProperty(navigator, "onLine", { configurable: true, get: () => false }); try { window.dispatchEvent(new Event("offline")); await expect(await c.findByText("Offline · your answers remain here")).toBeVisible(); } finally { Object.defineProperty(navigator, "onLine", { configurable: true, get: () => true }); } } };
export const Conflict: Story = { parameters: { msw: { handlers: [route("patch", "/v1/drafts/:id", () => ({ status: 409, body: { message: "Another revision was saved." } }))] } }, play: async ({ canvasElement }) => { const c = await ready(canvasElement); await userEvent.type(c.getByLabelText(/Technological field/), "Synthetic robot calibration."); await userEvent.click(c.getByRole("button", { name: "← My ideas" })); await expect(await c.findByRole("alert", {}, { timeout: 10000 })).toBeVisible(); } };
export const Complete: Story = { parameters: state("complete"), play: async ({ canvasElement }) => { const c = await ready(canvasElement); await expect(c.getByText("Ready for review")).toBeVisible(); await userEvent.click(c.getByRole("button", { name: "Submit for review" })); const d = within(await within(document.body).findByRole("dialog")); await expect(d.getByRole("button", { name: "Submit for review" })).toBeEnabled(); await userEvent.click(d.getByRole("button", { name: "Keep editing" })); } };
export const EvaluationRunning: Story = { parameters: state("evaluation-running"), play: async ({ canvasElement }) => { await ready(canvasElement); } };
export const EvaluationResult: Story = { parameters: state("evaluation-result"), play: async ({ canvasElement }) => { const c = await ready(canvasElement); await expect(await c.findByText("2.3")).toBeVisible(); await expect(c.getByRole("button", { name: "Submit for review" })).toBeEnabled(); } };
export const EvaluationStale: Story = { parameters: state("evaluation-stale"), play: async ({ canvasElement }) => { const c = await ready(canvasElement); await c.findByText("6.2"); await userEvent.type(c.getByLabelText(/Technological field/), " Revised."); await expect(c.getByText("Evaluated before your latest edits.")).toBeVisible(); } };
export const RequestedChanges: Story = { parameters: state("requested-changes"), play: async ({ canvasElement }) => { await ready(canvasElement); } };
export const Resubmission: Story = { parameters: state("requested-changes"), play: async ({ canvasElement }) => { const c = await ready(canvasElement); await userEvent.click(c.getByRole("button", { name: "Resubmit for review" })); const heading = await within(document.body).findByRole("heading", { name: "Resubmit this disclosure?" }); await waitFor(() => expect(heading).toBeVisible()); } };
export const Loading: Story = { parameters: { msw: { handlers: [route("get", "/v1/drafts/:id", async () => { await new Promise((resolve) => setTimeout(resolve, 12000)); return { status: 503, body: { message: "Unavailable" } }; })] } }, play: async ({ canvasElement }) => { await expect(await within(canvasElement).findByText("Loading disclosure…")).toBeVisible(); } };
export const Error: Story = { parameters: { msw: { handlers: [route("patch", "/v1/drafts/:id", () => ({ status: 503, body: { message: "Could not save" } }))] } }, play: Conflict.play };

export const WorkspaceAdminReadOnly: Story = { parameters: { pulse: { scenario: "v0/workspace-admin/queue", persona: "LEGAL_COUNSEL", route: (db: Db) => { const idea = db.ideas.find((i) => i.state === "LEGAL_REVIEW")!; const draft = db.drafts.find((d) => d.idea_id === idea.id)!; return `/ideas/${idea.id}/draft?draftId=${draft.id}`; } } }, play: async ({ canvasElement }) => { const c = within(canvasElement); await expect(await c.findByText(/This disclosure is read-only/)).toBeVisible(); await expect(c.queryByRole("button", { name: "Submit for review" })).toBeNull(); } };
