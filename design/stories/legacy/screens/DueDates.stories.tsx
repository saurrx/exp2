import type { Meta, StoryObj } from "@storybook/react-vite";
import DueDatesPage from "@/pages/DueDatesPage";

/** /due-dates: the docket list and calendar. Client roles carry the Action column; Photon roles work the other axis. */
const meta = { title: "Legacy reference/Screens/Due dates", component: DueDatesPage, parameters: { pulse: { route: "/due-dates" } } } satisfies Meta<typeof DueDatesPage>;
export default meta;
type Story = StoryObj<typeof meta>;

export const CaseOwner: Story = { parameters: { pulse: { scenario: "case-owner/assigned", persona: "CASE_OWNER", route: "/due-dates" } } };
export const PhotonAdmin: Story = { parameters: { pulse: { scenario: "photon-admin/firm", persona: "PHOTON_ADMIN", route: "/due-dates" } } };
