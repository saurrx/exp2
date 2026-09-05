import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import Index from "@/pages/Index";
import { route } from "../../../mock/runtime/registry";

const meta = {
  title: "Surfaces/Inventor home",
  component: Index,
  tags: ["redesign", "viewport:1280x720", "viewport:1440x900"],
  parameters: { pulse: { scenario: "v0/inventor/first-run", persona: "INVENTOR", route: "/" } },
} satisfies Meta<typeof Index>;
export default meta;
type Story = StoryObj<typeof meta>;
const scenario = (name: string) => ({ pulse: { scenario: `v0/inventor/${name}`, persona: "INVENTOR", route: "/" } });
const check = async (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement);
  await expect(await canvas.findByRole("heading", { name: "My ideas" })).toBeVisible();
  await expect(canvas.getByRole("button", { name: "Submit an idea" })).toBeEnabled();
  await expect(canvas.queryByRole("link", { name: /^Actions/ })).toBeNull();
  await expect(canvas.queryByRole("link", { name: /^Due Dates/ })).toBeNull();
  await expect(canvas.queryByRole("heading", { name: "Top inventors" })).toBeNull();
  return canvas;
};
export const FirstRun: Story = { play: async ({ canvasElement }) => {
  const canvas = await check(canvasElement);
  await expect(await canvas.findByText("Every idea starts somewhere.")).toBeVisible();
  await userEvent.click(canvas.getByRole("button", { name: "Submit an idea" }));
  const dialog = await within(document.body).findByRole("dialog");
  await waitFor(() => expect(dialog).toBeVisible());
  await userEvent.click(within(dialog).getByRole("button", { name: "Close" }));
  await waitFor(() => expect(within(document.body).queryByRole("dialog")).toBeNull());
} };
export const InvitedInactive: Story = { parameters: { pulse: { scenario: "v0/inventor/first-run", persona: "invited@northwind.test", route: "/" } }, play: FirstRun.play };
export const NoIdeas: Story = { parameters: scenario("no-ideas"), play: FirstRun.play };
export const ActiveDraft: Story = { parameters: scenario("active-draft"), play: async ({ canvasElement }) => {
  const canvas = await check(canvasElement);
  await expect(await canvas.findByRole("button", { name: /^Continue draft:/ })).toBeVisible();
} };
export const SeveralStatuses: Story = {
  parameters: scenario("several-statuses"),
  tags: ["viewport:1366x768", "viewport:1920x1080", "viewport:640x360@2"],
  play: async ({ canvasElement }) => {
    const canvas = await check(canvasElement);
    const list = await canvas.findByRole("list", { name: "Your ideas" });
    await expect(within(list).getAllByRole("listitem")).toHaveLength(5);
    await expect(within(list).getByRole("button", { name: /^Review feedback:/ })).toBeVisible();
    await expect(await canvas.findByRole("heading", { name: "Innovation across your company" })).toBeVisible();
  },
};
export const RequestedChanges: Story = { parameters: scenario("requested-changes"), play: async ({ canvasElement }) => {
  const canvas = await check(canvasElement);
  await expect(await canvas.findByRole("button", { name: /^Review feedback:/ })).toBeVisible();
} };
export const RecentSubmission: Story = { parameters: scenario("recent-submission"), play: async ({ canvasElement }) => {
  const canvas = await check(canvasElement);
  await expect(await canvas.findByText("Your Workspace Admin has the next step. No action needed from you.")).toBeVisible();
} };
export const EvaluationAvailable: Story = { parameters: scenario("evaluation-available"), play: async ({ canvasElement }) => {
  const canvas = await check(canvasElement);
  await expect(await canvas.findByText("Evaluation available")).toBeVisible();
  await userEvent.click(canvas.getByRole("button", { name: "Submit for review" }));
  const dialog = await within(document.body).findByRole("dialog");
  await expect(within(dialog).getByRole("button", { name: "Submit for review" })).toBeEnabled();
  await userEvent.click(within(dialog).getByRole("button", { name: "Keep editing" }));
} };
export const Loading: Story = { parameters: { pulse: { scenario: "v0/shape/slow", persona: "INVENTOR", route: "/" } }, play: async ({ canvasElement }) => {
  const canvas = await check(canvasElement);
  await expect(await canvas.findByRole("status", { name: "Loading your ideas" })).toBeVisible();
} };
export const Error: Story = { parameters: {
  ...scenario("several-statuses"),
  msw: [route("get", "/v1/ideas", () => ({ status: 500, body: { message: "Ideas unavailable." } }))],
}, play: async ({ canvasElement }) => {
  const canvas = await check(canvasElement);
  await expect(await canvas.findByRole("button", { name: "Retry ideas" }, { timeout: 15000 })).toBeEnabled();
} };
