import React from "react";
import { useLocation } from "react-router-dom";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within, waitFor } from "storybook/test";
import DueDatesPage from "@/pages/DueDatesPage";
import ActionsPage from "@/pages/ActionsPage";
import Index from "@/pages/Index";
import { route } from "../../../mock/runtime/registry";
import { getDb } from "../../../mock/runtime/db";
const meta={title:"Surfaces/Photon due dates",component:DueDatesPage,tags:["redesign","viewport:1280x720","viewport:1440x900"],parameters:{pulse:{route:"/due-dates",scenario:"v0/due-dates/upcoming",persona:"CASE_OWNER"}}} satisfies Meta<typeof DueDatesPage>;
export default meta;
type Story=StoryObj<typeof meta>;
const full=["viewport:1366x768","viewport:1920x1080","viewport:640x360@2"];
const ready=async(el:HTMLElement)=>{const c=within(el);await expect(await c.findByRole("button",{name:"Edit event"},{timeout:15000})).toBeVisible();return c;};
const state=(slug:string)=>({parameters:{pulse:{scenario:`v0/due-dates/${slug}`}}});
export const Upcoming:Story={tags:full,play:async({canvasElement})=>{const c=await ready(canvasElement);await expect(c.getByRole("article",{name:"Selected patent event"})).toHaveTextContent("Devika Nair");}};
export const DueSoon:Story={...state("due-soon")};
export const Overdue:Story={...state("overdue")};
export const Completed:Story={...state("completed"),play:async({canvasElement})=>{const c=within(canvasElement);if(!c.queryByRole("combobox",{name:"Show"})) await userEvent.click(c.getByRole("button",{name:"Find or filter events"}));await userEvent.selectOptions(await c.findByLabelText("Show"),"completed");await expect(await c.findByRole("button",{name:"Reopen event…"},{timeout:15000})).toBeVisible();}};
export const MissingDate:Story={...state("missing-date")};
export const ImportProblem:Story={...state("import-problem")};
export const LargeSameDayGroup:Story={...state("large-same-day-group"),play:async({canvasElement})=>{const c=await ready(canvasElement);if(!c.queryByRole("button",{name:"Next",exact:true})) await userEvent.click(c.getByRole("button",{name:"Choose event"}));await expect(c.getByRole("button",{name:"Next",exact:true})).toBeEnabled();}};
export const NoUpcomingDates:Story={...state("no-upcoming-dates")};
export const Loading:Story={parameters:{msw:{handlers:[route("get","/v1/due-dates",async()=>{await new Promise(r=>setTimeout(r,60000));return {data:[]};})]}},play:async({canvasElement})=>{await expect(await within(canvasElement).findByRole("status")).toHaveTextContent("Loading patent events");}};
export const Error:Story={parameters:{msw:{handlers:[route("get","/v1/due-dates",()=>({status:503,body:{message:"Unavailable"}}))]}},play:async({canvasElement})=>{await expect(await within(canvasElement).findByRole("heading",{name:"Due dates could not be loaded"},{timeout:15000})).toBeVisible();}};
export const PhotonAdmin:Story={tags:full,parameters:{pulse:{scenario:"v0/due-dates/firm-scope",persona:"PHOTON_ADMIN"}}};
export const CaseOwnerScope:Story={parameters:{pulse:{scenario:"v0/due-dates/firm-scope",persona:"CASE_OWNER"}},play:async({canvasElement})=>{const c=await ready(canvasElement);await expect(c.queryByText("Orbital Foods",{exact:true})).toBeNull();}};
export const EditDate:Story={tags:["viewport:640x360@2"],...state("missing-date"),play:async({canvasElement})=>{const c=await ready(canvasElement);await userEvent.click(c.getByRole("button",{name:"Edit event"}));await userEvent.type(c.getByLabelText("Correction note"),"Confirmed against the synthetic supporting record.");}};
export const SaveError:Story={tags:["viewport:640x360@2"],play:async({canvasElement})=>{const c=await ready(canvasElement);await userEvent.click(c.getByRole("button",{name:"Edit event"}));await userEvent.type(c.getByLabelText("Correction note"),"Confirmed against the synthetic supporting record.");await waitFor(()=>expect(c.getByRole("button",{name:"Save event"})).toBeEnabled());getDb().flags.mutationsFail=true;await userEvent.click(c.getByRole("button",{name:"Save event"}));await expect(await c.findByRole("alert")).toHaveTextContent("Your edits are retained");getDb().flags.mutationsFail=false;}};
export const CompletionConfirmation:Story={tags:["viewport:640x360@2"],play:async({canvasElement})=>{const c=await ready(canvasElement);await userEvent.click(c.getByRole("button",{name:"Mark completed…"}));await expect(c.getByRole("button",{name:"Confirm completion"})).toBeVisible();}};
export const LongTitle:Story={tags:["viewport:640x360@2"],...state("long-title")};
export const SpreadsheetImport:Story={tags:["viewport:640x360@2"],play:async({canvasElement})=>{const c=await ready(canvasElement);if(!c.queryByRole("button",{name:"Import spreadsheet"})) await userEvent.click(c.getByRole("button",{name:"Find or filter events"}));await userEvent.click(c.getByRole("button",{name:"Import spreadsheet"}));await waitFor(()=>expect(within(document.body).getByRole("dialog")).toBeVisible());}};
function Refused(){const location=useLocation();return location.pathname==="/due-dates"?<DueDatesPage/>:<Index/>;}
export const InventorRefused:Story={render:()=> <Refused/>,parameters:{pulse:{path:"*",route:"/due-dates",scenario:"v0/inventor/portfolio",persona:"INVENTOR"}},play:async({canvasElement})=>{const c=within(canvasElement);await expect(await c.findByRole("heading",{name:"My ideas"},{timeout:15000})).toBeVisible();await expect(c.queryByRole("heading",{name:"Patent events"})).toBeNull();}};

function RelatedRoute(){const location=useLocation();return location.pathname==="/actions" ? <ActionsPage/> : <DueDatesPage/>;}
export const RelatedInstruction:Story={render:()=> <RelatedRoute/>,parameters:{pulse:{path:"*",route:"/due-dates",scenario:"v0/due-dates/same-patent-events"}},play:async({canvasElement})=>{const c=await ready(canvasElement);if(!c.queryByRole("navigation",{name:"Recorded patent events"})) await userEvent.click(c.getByRole("button",{name:"Choose event"}));await userEvent.click(within(c.getByRole("navigation",{name:"Recorded patent events"})).getAllByRole("button").find(button=>button.textContent?.includes("Patent renewal"))!);await userEvent.click(c.getByRole("link",{name:"View client instruction →"}));await expect(await c.findByRole("button",{name:"Acknowledge instruction"},{timeout:15000})).toBeVisible();await expect(c.getByRole("article",{name:"Selected event instruction"})).toHaveTextContent("Pay the fee");}};
