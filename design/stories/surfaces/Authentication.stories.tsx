import { Routes, Route } from "react-router-dom";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "storybook/test";
import Login from "@/pages/auth/Login";
import Signup from "@/pages/auth/Signup";
import Invite from "@/pages/auth/Invite";
import ForgotPassword from "@/pages/auth/ForgotPassword";
import ResetPassword, { PasswordCompletion } from "@/pages/auth/ResetPassword";
import SamlCallback from "@/pages/auth/SamlCallback";
import { route } from "../../../mock/runtime/registry";

const meta = {
  title: "Surfaces/Authentication and access", component: Login,
  tags: ["redesign", "viewport:1280x720", "viewport:1440x900"],
  parameters: { pulse: { layout: "public", scenario: "v0/auth/entry", route: "/login" } },
} satisfies Meta<typeof Login>;
export default meta;
type Story = StoryObj<typeof meta>;
const loginForm = async (element: HTMLElement, email = "inventor@northwind.test") => {
  const c = within(element);
  await userEvent.click(await c.findByRole("button", { name: "Sign in with email", exact: true }));
  await userEvent.type(c.getByLabelText("Work email"), email);
  await userEvent.type(c.getByLabelText("Password", { exact: true }), "Synthetic-test-9!");
  return c;
};
const inviteRoute = (db: any) => `/i/${db.invites.find((i: any) => i.email === "*")?.code ?? db.invites[0]?.code}`;
const verifyInvitation = async (element: HTMLElement) => {
  const c = within(element);
  await userEvent.type(await c.findByLabelText("Work email"), "inventor@northwind.test");
  await userEvent.click(c.getByRole("button", { name: "Verify invitation" }));
  return c;
};
export const Default: Story = { tags: ["viewport:1366x768", "viewport:1920x1080", "viewport:640x360@2"], play: async ({ canvasElement }) => {
  const c = within(canvasElement); await expect(await c.findByRole("heading", { name: "Sign in to Pulse" })).toBeVisible();
  for (const name of ["Continue with Google", "Continue with Microsoft", "Use workspace SSO", "Sign in with email"]) await expect(c.getByRole("button", { name, exact: true })).toBeVisible();
} };
export const EmailForm: Story = { tags:["viewport:640x360@2"], play: async ({canvasElement}) => { const c=within(canvasElement);await userEvent.click(await c.findByRole("button",{name:"Sign in with email",exact:true})); } };
export const Loading: Story = { parameters: { msw: { handlers: [route("post", "/v1/auth/login", async () => { await new Promise(r => setTimeout(r, 60000)); return {}; })] } }, play: async ({canvasElement}) => { const c=await loginForm(canvasElement);await userEvent.click(c.getByRole("button",{name:"Sign in",exact:true}));await expect(await c.findByRole("button",{name:"Signing in…"})).toBeDisabled(); } };
export const InvalidCredentials: Story = { tags:["viewport:640x360@2"], play: async ({canvasElement}) => { const c=await loginForm(canvasElement,"unknown@northwind.test");await userEvent.click(c.getByRole("button",{name:"Sign in",exact:true}));await expect(await c.findByRole("alert")).toHaveTextContent("Invalid email or password.");await expect(c.getByLabelText("Work email")).toHaveValue("unknown@northwind.test");await expect(c.getByLabelText("Password",{exact:true})).toHaveValue("Synthetic-test-9!"); } };
export const ValidationErrors: Story = { play: async({canvasElement})=>{const c=within(canvasElement);await userEvent.click(await c.findByRole("button",{name:"Sign in with email",exact:true}));await userEvent.click(c.getByRole("button",{name:"Sign in",exact:true}));await expect(await c.findByText("Email is required")).toBeVisible();await expect(c.getByLabelText("Work email")).toHaveAttribute("aria-invalid","true");} };
export const EmailMethodRetention: Story = { play: async({canvasElement})=>{const c=await loginForm(canvasElement);await userEvent.click(c.getByRole("button",{name:"Other sign-in methods"}));await userEvent.click(c.getByRole("button",{name:"Sign in with email",exact:true}));await expect(c.getByLabelText("Work email")).toHaveValue("inventor@northwind.test");await expect(c.getByLabelText("Password",{exact:true})).toHaveValue("Synthetic-test-9!");} };
export const SignupForm: Story = { render:()=> <Signup/>, parameters:{pulse:{route:"/signup"}} };
// Response presentation only: the unmodified adapter/signup contract mismatch is
// separately reproduced in the full app and must be resolved before landing.
export const UnknownDomain: Story = { render:()=> <Signup/>,tags:["viewport:640x360@2"], parameters:{pulse:{route:"/signup"},msw:{handlers:[route("post","/v1/auth/signup",()=>({status:403,body:{message:"Your organisation is not onboarded on Pulse yet."}}))]}},play:async({canvasElement})=>{const c=within(canvasElement);await userEvent.click(await c.findByRole("button",{name:"Continue with work email"}));await userEvent.type(c.getByLabelText("Work email"),"new@not-onboarded.test");await userEvent.click(c.getByRole("button",{name:"Continue with work email"}));await expect(await c.findByRole("alert")).toHaveTextContent("Ask your Workspace Admin");await expect(c.getByLabelText("Work email")).toHaveValue("new@not-onboarded.test");} };
export const Invitation: Story = {render:()=> <Invite/>,parameters:{pulse:{path:"/i/:inviteCode",route:inviteRoute}}};
export const ExpiredInvitation: Story = {render:()=> <Invite/>,tags:["viewport:640x360@2"],parameters:{pulse:{scenario:"v0/auth/expired-invitation",path:"/i/:inviteCode",route:inviteRoute}},play:async({canvasElement})=>{const c=await verifyInvitation(canvasElement);await expect(await c.findByRole("alert")).toHaveTextContent("Ask your Workspace Admin for a new invitation");await expect(c.getByRole("heading",{name:"Invitation unavailable"})).toBeVisible();await expect(c.getByRole("button",{name:"Back to sign in"})).toBeVisible();}};
export const SuccessfulInvitation: Story = {render:()=> <Invite/>,parameters:{pulse:{path:"/i/:inviteCode",route:inviteRoute}},play:async({canvasElement})=>{const c=await verifyInvitation(canvasElement);await expect(await c.findByRole("heading",{name:"Invitation verified"})).toBeVisible();await expect(c.getByRole("button",{name:"Continue to sign in"})).toBeVisible();}};
export const SsoUnavailable: Story = {play:async({canvasElement})=>{const c=within(canvasElement);await userEvent.click(await c.findByRole("button",{name:"Use workspace SSO"}));await userEvent.type(c.getByLabelText("Work email"),"inventor@northwind.test");await userEvent.click(c.getByRole("button",{name:"Continue with SSO"}));await expect(await c.findByText(/SSO isn't enabled/)).toBeVisible();await expect(c.getByLabelText("Work email")).toHaveValue("inventor@northwind.test");}};
export const SsoFailure: Story = {parameters:{pulse:{route:"/login?sso_error=1"}},play:async({canvasElement})=>{await expect(await within(canvasElement).findByRole("alert")).toHaveTextContent("SSO sign-in could not be completed");}};
export const SsoReturn: Story = {render:()=> <SamlCallback/>,parameters:{pulse:{route:"/auth/saml/callback",persona:"LEGAL_COUNSEL"},msw:{handlers:[route("get","/v1/auth/me",async()=>{await new Promise(r=>setTimeout(r,60000));return {};})]}},play:async({canvasElement})=>{await expect(await within(canvasElement).findByRole("status")).toHaveTextContent("Please wait");}};
export const ResetForm: Story = {render:()=> <ResetPassword/>,tags:["viewport:640x360@2"],parameters:{pulse:{route:"/reset-password?token=synthetic-reset-token&source=forgot_password"}}};
export const ForgotPasswordForm: Story = {render:()=> <ForgotPassword/>,parameters:{pulse:{route:"/forgot-password"}}};
export const ResetRequested: Story = {render:()=> <ForgotPassword/>,parameters:{pulse:{route:"/forgot-password"}},play:async({canvasElement})=>{const c=within(canvasElement);await userEvent.type(await c.findByLabelText("Work email"),"inventor@northwind.test");await userEvent.click(c.getByRole("button",{name:"Send reset link"}));await expect(await c.findByRole("heading",{name:"Check your email"})).toBeVisible();await expect(c.getByText(/If an eligible account/)).toBeVisible();}};
// Uses the actual transient success composition; the timed return is checked in
// the browser workflow so screenshots do not silently capture a route marker.
export const ResetComplete: Story = {render:()=> <PasswordCompletion/>,parameters:{pulse:{route:"/reset-password?token=synthetic-reset-token&source=forgot_password"}}};
export const SessionExpired: Story = {parameters:{pulse:{route:"/login?session_expired=1"}},play:async({canvasElement})=>{await expect(await within(canvasElement).findByRole("alert")).toHaveTextContent("Your session has expired. Sign in again");}};
export const AccessDenied: Story = {parameters:{pulse:{scenario:"v0/auth/access-denied"}},play:async({canvasElement})=>{const c=await loginForm(canvasElement);await userEvent.click(c.getByRole("button",{name:"Sign in",exact:true}));await expect(await c.findByRole("alert")).toHaveTextContent("Contact the person who manages your Pulse access");}};

export const IncompletePasswordLink: Story = { render: () => <Routes><Route path="/reset-password" element={<ResetPassword />} /><Route path="/login" element={<Login />} /><Route path="/forgot-password" element={<ForgotPassword />} /></Routes>, parameters: { pulse: { path: "*", route: "/reset-password" } }, play: async ({ canvasElement }) => { const c = within(canvasElement); await expect(await c.findByRole("heading", { name: "Password link unavailable" })).toBeVisible(); await expect(c.getByRole("button", { name: "Request a new reset link" })).toBeVisible(); } };
export const ResetError: Story = { render: () => <ResetPassword />, tags:["viewport:640x360@2"], parameters: { pulse: { route: "/reset-password?token=synthetic-expired-token&source=forgot_password" }, msw: { handlers: [route("post", "/v1/auth/password-reset/complete", () => ({ status: 400, body: { message: "The reset link is invalid or has expired." } }))] } }, play: async ({ canvasElement }) => { const c = within(canvasElement); await userEvent.type(await c.findByLabelText("New password"), "Synthetic-test-9!"); await userEvent.type(c.getByLabelText("Confirm password"), "Synthetic-test-9!"); await userEvent.click(c.getByRole("button", { name: "Reset password", exact: true })); await expect(await c.findByRole("alert")).toHaveTextContent("The reset link is invalid or has expired."); await expect(c.getByLabelText("New password")).toHaveValue("Synthetic-test-9!"); } };
export const ResetRequestError: Story = { render: () => <ForgotPassword />, parameters: { pulse: { route: "/forgot-password" }, msw: { handlers: [route("post", "/v1/auth/password-reset/request", () => ({ status: 503, body: { message: "The reset link could not be sent. Try again." } }))] } }, play: async ({ canvasElement }) => { const c = within(canvasElement); await userEvent.type(await c.findByLabelText("Work email"), "inventor@northwind.test"); await userEvent.click(c.getByRole("button", { name: "Send reset link" })); await expect(await c.findByRole("alert")).toHaveTextContent("The reset link could not be sent."); await expect(c.getByLabelText("Work email")).toHaveValue("inventor@northwind.test"); } };
