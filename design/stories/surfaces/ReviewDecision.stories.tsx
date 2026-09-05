import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import IdeasPage from "@/pages/IdeasPage";
import { getDb } from "../../../mock/runtime/db";
import { clock } from "../../../mock/runtime/clock";
import { uuid, mulberry32 } from "../../../mock/runtime/prng";
import { V0_USERS } from "../../../mock/scenarios/v0/personas";
const meta = { title: "Surfaces/Review decision", component: IdeasPage,
  tags: ["redesign", "viewport:1280x720", "viewport:1440x900"],
  parameters: { pulse: { scenario: "v0/idea-detail/under-review", persona: "LEGAL_COUNSEL", route: "/ideas" } },
} satisfies Meta<typeof IdeasPage>;
export default meta;
type Story = StoryObj<typeof meta>;
const ready = async (canvasElement: HTMLElement) => { const c = within(canvasElement); const button = await c.findByRole("button", { name: "Send to Photon Legal" }, { timeout: 15000 }); await waitFor(() => expect(button).toBeEnabled()); return c; };
const confirm = async (canvasElement: HTMLElement, kind: "send" | "request" | "reject" = "send") => {
  const c = await ready(canvasElement);
  if (kind === "reject") { await userEvent.click(c.getByRole("button", { name: "More actions" })); await userEvent.click(await within(document.body).findByRole("menuitem", { name: "Reject idea" })); }
  else await userEvent.click(c.getByRole("button", { name: kind === "send" ? "Send to Photon Legal" : "Request changes" }));
  const dialog = await within(document.body).findByRole("dialog"); await waitFor(() => expect(dialog).toBeVisible()); return within(dialog);
};
const reason = "Please explain how the correction loop responds when the cable load changes and include repeatability observations.";
export const Typical: Story = { tags: ["viewport:1366x768", "viewport:1920x1080", "viewport:640x360@2"], play: async ({ canvasElement }) => { const c = await ready(canvasElement); await expect(c.getByText("AI-assisted and advisory")).toBeVisible(); } };
export const NoEvaluation: Story = { parameters: { pulse: { scenario: "v0/idea-detail/missing-evaluation" } }, play: async ({ canvasElement }) => { const c = await ready(canvasElement); await expect(c.getByText("Not evaluated")).toBeVisible(); } };
export const PartialEvaluation: Story = { parameters: { pulse: { scenario: "v0/idea-detail/partial-evaluation" } }, play: async ({ canvasElement }) => { const c = await ready(canvasElement); await expect(c.getByText(/Partial result, provisional score/)).toBeVisible(); } };
export const LongDisclosure: Story = { parameters: { pulse: { scenario: "v0/idea-detail/long-content" } }, play: async ({ canvasElement }) => { const c = await ready(canvasElement); await userEvent.click(c.getByRole("button", { name: /Invention disclosure/ })); await expect(c.getByText("cable-loop-observations.json")).toBeInTheDocument(); } };
export const MissingDetail: Story = { parameters: { pulse: { scenario: "v0/review/missing-detail" } }, play: async ({ canvasElement }) => { const c = await ready(canvasElement); await userEvent.click(c.getByRole("button", { name: /Invention disclosure/ })); await expect(c.getByText("Not provided")).toBeVisible(); } };
export const ApproveConfirmation: Story = { play: async ({ canvasElement }) => { const d = await confirm(canvasElement); await expect(d.getByRole("heading", { name: "Send to Photon Legal for filing?" })).toBeVisible(); await expect(d.getByRole("button", { name: "Send to Photon Legal" })).toBeEnabled(); } };
export const RequestChanges: Story = { play: async ({ canvasElement }) => { const d = await confirm(canvasElement, "request"); await expect(d.getByRole("button", { name: "Send request" })).toBeDisabled(); await userEvent.type(d.getByRole("textbox"), reason); } };
export const Reject: Story = { play: async ({ canvasElement }) => { const d = await confirm(canvasElement, "reject"); await expect(d.getByRole("button", { name: "Reject idea" })).toBeDisabled(); await userEvent.type(d.getByRole("textbox"), reason); } };
export const DecisionInProgress: Story = { play: async ({ canvasElement }) => { const d = await confirm(canvasElement); getDb().flags.latencyMs = 60000; await userEvent.click(d.getByRole("button", { name: "Send to Photon Legal" })); await expect(await d.findByText("Saving decision…")).toBeVisible(); await expect(d.getByRole("button", { name: "Send to Photon Legal" })).toBeDisabled(); await expect(d.getByRole("button", { name: "Cancel" })).toBeDisabled(); } };
export const ConcurrentDecisionCompleted: Story = { play: async ({ canvasElement }) => { const d = await confirm(canvasElement); const db = getDb(), idea = db.ideas[0]; db.transitions.push({ id: uuid(mulberry32(100)), idea_id: idea.id, from_state: idea.state, to_state: "SENT_TO_PHOTON", stage: "LEGAL", decision: "APPROVED", actor_id: V0_USERS.admin2.id, revision: idea.revision, comment: "Sent to Photon Legal for filing", is_appeal: false, created_at: clock.iso() }); idea.state = "SENT_TO_PHOTON"; await userEvent.click(d.getByRole("button", { name: "Send to Photon Legal" })); await expect(await within(canvasElement).findByText(/Sent to Photon Legal by Noor Rahman/, {}, { timeout: 15000 })).toBeVisible(); } };
export const Success: Story = { play: async ({ canvasElement }) => { const d = await confirm(canvasElement); await userEvent.click(d.getByRole("button", { name: "Send to Photon Legal" })); const c = within(canvasElement); await expect(await c.findByText(/Sent to Photon Legal by Leah Feldman/, {}, { timeout: 15000 })).toBeVisible(); await expect(c.queryByRole("button", { name: "Send to Photon Legal" })).not.toBeInTheDocument(); } };
export const FailureRetry: Story = { play: async ({ canvasElement }) => { const d = await confirm(canvasElement, "request"); await userEvent.type(d.getByRole("textbox"), reason); getDb().flags.mutationsFail = true; await userEvent.click(d.getByRole("button", { name: "Send request" })); await expect(await d.findByRole("alert")).toHaveTextContent("Your reason is retained"); await expect(d.getByRole("textbox")).toHaveValue(reason); getDb().flags.mutationsFail = false; await expect(d.getByRole("button", { name: "Send request" })).toBeEnabled(); } };
