import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import IdeasPage from "@/pages/IdeasPage";
import { route } from "../../../mock/runtime/registry";
const meta = { title: "Surfaces/Ideas list", component: IdeasPage,
  tags: ["redesign", "viewport:1280x720", "viewport:1440x900"],
  parameters: { pulse: { scenario: "v0/ideas/mixed", persona: "INVENTOR", route: "/ideas" } },
} satisfies Meta<typeof IdeasPage>;
export default meta;
type Story = StoryObj<typeof meta>;
const defaults = ["viewport:1366x768", "viewport:1920x1080", "viewport:640x360@2"];
const seen = (text: string | RegExp) => async ({ canvasElement }: { canvasElement: HTMLElement }) => { const elements = await within(canvasElement).findAllByText(text, {}, { timeout: 15000 }); await expect(elements[0]).toBeVisible(); };
export const InventorEmpty: Story = { parameters: { pulse: { scenario: "v0/inventor/first-run" } }, play: seen("Your first idea starts here") };
export const InventorDraftsOnly: Story = { parameters: { pulse: { scenario: "v0/ideas/drafts-only" } }, play: seen("Not evaluated") };
export const InventorMixed: Story = { tags: defaults, play: async ({ canvasElement }) => { const c = within(canvasElement); await expect(await c.findByText("Evaluation running", {}, { timeout: 15000 })).toBeVisible(); await expect(c.getByText("Update disclosure")).toBeVisible(); await expect(c.getByText("6.2 / 10")).toBeVisible(); await expect(c.getByRole("button", { name: "Submit an idea" })).toBeEnabled(); } };
export const WorkspaceAdminPending: Story = { tags: defaults, parameters: { pulse: { scenario: "v0/workspace-admin/queue", persona: "LEGAL_COUNSEL" } }, play: async ({ canvasElement }) => { await expect(await within(canvasElement).findByRole("button", { name: "Send to Photon Legal" })).toBeEnabled(); } };
export const WorkspaceAdminLargeQueue: Story = { parameters: { pulse: { scenario: "v0/workspace-admin/large-aging-queue", persona: "LEGAL_COUNSEL" } }, play: async ({ canvasElement }) => { await expect(await within(canvasElement).findByRole("button", { name: "Send to Photon Legal" })).toBeEnabled(); } };
export const WorkspaceAdminFilteredEmpty: Story = { parameters: { pulse: { scenario: "v0/workspace-admin/queue", persona: "LEGAL_COUNSEL", route: "/ideas" } }, play: async ({ canvasElement }) => { const c = within(canvasElement); await userEvent.type(await c.findByPlaceholderText("Search title or inventor"), "unmatched-disclosure"); await expect(await c.findByText("No matching ideas.")).toBeVisible(); } };
export const CaseOwner: Story = { tags: defaults, parameters: { pulse: { scenario: "v0/case-owner/my-work", persona: "CASE_OWNER" } }, play: seen(/Case Owner ·/) };
export const PhotonAdmin: Story = { tags: defaults, parameters: { pulse: { scenario: "v0/photon-admin/firm", persona: "PHOTON_ADMIN" } }, play: seen(/Case Owner ·/) };
export const LongTitles: Story = { parameters: { pulse: { scenario: "v0/ideas/long-titles" } }, play: seen(/Self-tensioning cable harness with a load-responsive/) };
export const Loading: Story = { parameters: { msw: { handlers: [route("get", "/v1/ideas", async () => { await new Promise((resolve) => setTimeout(resolve, 60000)); return []; })] } }, play: seen("Loading ideas…") };
export const Error: Story = { parameters: { msw: { handlers: [route("get", "/v1/ideas", () => ({ status: 503, body: { message: "Ideas unavailable" } }))] } }, play: async ({ canvasElement }) => { const c = within(canvasElement); await expect(await c.findByText("Ideas could not be loaded", {}, { timeout: 15000 })).toBeVisible(); await userEvent.click(c.getByRole("button", { name: "Reload ideas" })); await expect(await c.findByText("Ideas could not be loaded")).toBeVisible(); } };
