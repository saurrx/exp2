import React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import Index from "@/pages/Index";
import { route } from "../../../mock/runtime/registry";
const meta = { title: "Surfaces/Case Owner my work", component: Index, tags: ["redesign", "viewport:1280x720", "viewport:1440x900"], parameters: { pulse: { route: "/", scenario: "v0/my-work/new-approved-idea", persona: "CASE_OWNER" } } } satisfies Meta<typeof Index>;
export default meta;
type Story = StoryObj<typeof meta>;
const full = ["viewport:1366x768", "viewport:1920x1080", "viewport:640x360@2"];
const state = (slug: string) => ({ parameters: { pulse: { scenario: `v0/my-work/${slug}` } } });
const ready = async (el: HTMLElement) => { const c=within(el); await expect(await c.findByRole("region", {name:"Selected work brief"}, {timeout:15000})).toBeVisible(); return c; };
export const NewApprovedIdea: Story = { tags: full, play: async ({canvasElement}) => { const c=await ready(canvasElement); await expect(c.getByRole("link", {name:"Open approved idea"})).toBeVisible(); await expect(c.queryByText("Orbital Foods", {exact:true})).toBeNull(); } };
export const NoAssignedClients: Story = { ...state("no-assigned-clients"), play: async ({canvasElement}) => { const c=within(canvasElement); await expect(await c.findByRole("heading", {name:"No clients assigned yet"})).toBeVisible(); await expect(c.queryByRole("link", {name:"Open approved idea"})).toBeNull(); } };
export const NewlyAssignedClient: Story = { ...state("newly-assigned-client"), play: async ({canvasElement}) => { const c=await ready(canvasElement); await expect(c.getByRole("region", {name:"Selected work brief"})).toHaveTextContent("Beacon Health Systems"); } };
export const UrgentAction: Story = { ...state("urgent-action"), play: async ({canvasElement}) => { const c=await ready(canvasElement); await expect(c.getByRole("link", {name:"Open client instruction"})).toBeVisible(); } };
export const OverdueDate: Story = { ...state("overdue-date"), play: async ({canvasElement}) => { const c=await ready(canvasElement); await expect(c.getByRole("region", {name:"Selected work brief"})).toHaveTextContent("3 days overdue"); } };
export const OnboardingIncomplete: Story = { ...state("onboarding-incomplete"), play: async ({canvasElement}) => { const c=await ready(canvasElement); await expect(c.getByRole("heading", {name:"Add a Workspace Admin"})).toBeVisible(); } };
export const AccessExpired: Story = { ...state("access-expired"), tags:["viewport:640x360@2"], play: async ({canvasElement}) => { const c=await ready(canvasElement); await expect(c.getByRole("button", {name:"Request client access"})).toBeVisible(); } };
export const DataError: Story = { parameters:{msw:{handlers:[route("get", "/v1/dashboard", () => ({status:503,body:{message:"Unavailable"}}))]}}, play:async({canvasElement}) => { await expect(await within(canvasElement).findByRole("button", {name:"Reload my work"}, {timeout:15000})).toBeVisible(); } };
export const Loading: Story = { parameters:{msw:{handlers:[route("get", "/v1/dashboard", async () => { await new Promise(r=>setTimeout(r,60000));return {}; })]}}, play:async({canvasElement}) => { await expect(await within(canvasElement).findByRole("status")).toHaveTextContent("Loading your assigned-client work"); } };
export const LongTitle: Story = { ...state("long-title"), tags:["viewport:640x360@2"] };
export const Quiet: Story = { ...state("quiet"), play:async({canvasElement}) => { await expect(await within(canvasElement).findByRole("heading", {name:"No work needs attention right now"})).toBeVisible(); } };
export const AccessRequestError: Story = { ...state("access-request-error"), tags:["viewport:640x360@2"], play:async({canvasElement}) => { const c=await ready(canvasElement);await userEvent.click(c.getByRole("button",{name:"Request client access"}));await expect(await c.findByRole("alert")).toHaveTextContent("Access could not be requested"); } };
export const AccessRequested: Story = { ...state("access-expired"), play:async({canvasElement}) => { const c=await ready(canvasElement);await userEvent.click(c.getByRole("button",{name:"Request client access"}));await expect(await c.findByRole("status")).toHaveTextContent("A Photon Admin will review your request"); } };
export const PortfolioContext: Story = { play:async({canvasElement}) => { const c=await ready(canvasElement);c.getByRole("region",{name:"Assigned-client portfolio"}).scrollIntoView();await expect(c.getByRole("heading",{name:"Active patents worldwide"})).toBeVisible(); } };

// The Case Owner's cross-persona boundary uses the existing seeded identities.
// Successful navigation is checked in the full-app browser journey because
// location.replace intentionally leaves Storybook's memory router.
const clientView = {
  persona: "LEGAL_COUNSEL",
  prepare: (db: import("../../../mock/runtime/types").Db) => {
    const original = db.users.find(u => u.role === "CASE_OWNER")!;
    sessionStorage.setItem("pl_original_admin_user", JSON.stringify(original));
    sessionStorage.setItem("pl_client_mode", "true");
  },
};
export const ClientViewActive: Story = {
  tags: full,
  parameters: { pulse: clientView },
  play: async ({canvasElement}) => { const c=within(canvasElement); await expect(await c.findByRole("button", {name:"Exit client view",exact:true})).toBeVisible(); await expect(c.getByRole("region", {name:"Client view"})).toHaveTextContent("Northwind Instruments"); },
};
export const ClientViewExitError: Story = {
  tags: ["viewport:640x360@2"],
  parameters: { pulse: clientView, msw: {handlers: [route("post", "/v1/auth/view-as/exit", () => ({status:503, body:{message:"Session restoration unavailable"}}))]} },
  play: async ({canvasElement}) => { const c=within(canvasElement); await userEvent.click(await c.findByRole("button", {name:"Exit client view",exact:true})); await expect(await c.findByRole("alert")).toHaveTextContent("Could not restore your session"); await expect(c.getByRole("button", {name:"Sign in again"})).toBeVisible(); await expect(c.getByRole("button", {name:"Exit client view",exact:true})).toBeEnabled(); await expect(sessionStorage.getItem("pl_client_mode")).toBe("true"); },
};
