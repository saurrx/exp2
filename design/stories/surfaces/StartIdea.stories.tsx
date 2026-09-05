import React, { useState } from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within, fireEvent, waitFor } from "storybook/test";
import { useLocation } from "react-router-dom";
import IdeaSubmissionModal from "@/components/ideas/IdeaSubmissionModal";
import DraftWorkspace from "@/components/ideas/DraftWorkspace";
import { route } from "../../../mock/runtime/registry";
const StartFlow = () => {
  const [open, setOpen] = useState(true);
  const location = useLocation();
  if (location.pathname.endsWith("/draft")) return <DraftWorkspace ideaId={location.pathname.split("/")[2]} />;
  return <IdeaSubmissionModal open={open} onOpenChange={setOpen} refetchIdeas={() => undefined} />;
};
const meta = { title: "Surfaces/Start an idea", component: StartFlow,
  tags: ["redesign", "viewport:1280x720", "viewport:1440x900"],
  parameters: { pulse: { scenario: "v0/disclosure/empty", persona: "INVENTOR", path: "*", route: "/ideas" } },
} satisfies Meta<typeof StartFlow>;
export default meta;
type Story = StoryObj<typeof meta>;
const dialog = async () => { const element = await within(document.body).findByRole("dialog"); await waitFor(() => expect(element).toBeVisible()); return within(element); };
const material = "Field: Synthetic robot calibration.\nProblem: Manual calibration interrupts each synthetic shift.\nSolution: A passive element and a control loop correct the test fixture without operator input.";
const fill = async () => { const d = await dialog(); await userEvent.type(d.getByLabelText("Paste notes or describe your idea"), material); await userEvent.type(d.getByLabelText(/Working title/), "Synthetic calibration disclosure"); return d; };
export const Empty: Story = { tags: ["viewport:1366x768", "viewport:1920x1080", "viewport:640x360@2"], play: async () => { const d = await dialog(); await expect(d.getByRole("button", { name: "Continue to disclosure" })).toBeDisabled(); } };
export const DraggingFile: Story = { play: async () => { const d = await dialog(); fireEvent.dragOver(d.getByLabelText("Paste notes or describe your idea").parentElement!); await expect(d.getByText("Drop your document here")).toBeVisible(); } };
export const Parsing: Story = { parameters: { msw: { handlers: [route("post", "/v1/drafts/:id/autofill", async () => { await new Promise((resolve) => setTimeout(resolve, 12000)); return { answers: {} }; })] } }, play: async () => { const d = await fill(); await userEvent.click(d.getByRole("button", { name: "Continue to disclosure" })); await expect(await d.findByText("Organising supported answers…")).toBeVisible(); } };
export const PartialExtraction: Story = { play: async () => { const d = await fill(); await userEvent.click(d.getByRole("button", { name: "Continue to disclosure" })); const page = within(document.body); await expect(await page.findByText("1 required answer to finish")).toBeVisible(); await expect(page.getByText("AI-drafted")).toBeVisible(); } };
export const UnsupportedFile: Story = { play: async () => { const d = await dialog(); await userEvent.upload(d.getByLabelText("Upload source document"), new File(["synthetic"], "notes.pptx", { type: "application/octet-stream" }), { applyAccept: false }); await expect(await d.findByRole("alert")).toHaveTextContent("For slides, paste the text"); } };
export const ExtractionFailure: Story = { parameters: { msw: { handlers: [route("post", "/v1/drafts/:id/autofill", () => ({ status: 503, body: { message: "Could not organise the material. Your text is preserved; try again." } }))] } }, play: async () => { const d = await fill(); await userEvent.click(d.getByRole("button", { name: "Continue to disclosure" })); await expect(await d.findByRole("alert")).toBeVisible(); await expect(d.getByLabelText("Paste notes or describe your idea")).toHaveValue(material); } };
export const DuplicateWarning: Story = { play: async () => { const d = await dialog(); await userEvent.type(d.getByLabelText(/Working title/), "Self-tensioning cable harness for articulated robot joints"); await expect(await d.findByText(/An idea with this title already exists/)).toBeVisible(); } };
export const TransitionToDisclosure: Story = { play: PartialExtraction.play };
export const OnBehalf: Story = { parameters: { pulse: { scenario: "v0/workspace-admin/queue", persona: "LEGAL_COUNSEL" } }, play: async () => { const d = await dialog(); await expect(await d.findByLabelText("Inventor")).toBeVisible(); await userEvent.selectOptions(d.getByLabelText("Inventor"), (await d.findByRole("option", { name: "Anika Sharma" })).getAttribute("value")!); } };
export const Loading: Story = { parameters: Parsing.parameters, play: Parsing.play };
export const Error: Story = { parameters: { msw: { handlers: [route("post", "/v1/ideas", () => ({ status: 503, body: { message: "Could not save your idea. Your material is preserved." } }))] } }, play: ExtractionFailure.play };
