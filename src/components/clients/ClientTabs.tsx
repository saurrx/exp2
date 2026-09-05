import React, { useState, useEffect } from "react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import OverviewTab from "@/components/clients/OverviewTab";
import PatentsTab from "@/components/clients/PatentsTab";
import { useSearchParams } from "react-router-dom";
import { useTheme } from "@/hooks/useTheme";

type ClientTabsProps = {
  clientTeam: any[];
  clientId: string;
  clientData: any;
  caseOwnerName?: string;
  onChangeCaseOwner?: () => void;
  canManageTeam?: boolean;
  onEditClient?: () => void;
};

const ClientTabs: React.FC<ClientTabsProps> = ({
  clientTeam,
  clientId,
  clientData,
  caseOwnerName,
  onChangeCaseOwner,
  canManageTeam,
  onEditClient,
}) => {
  const { theme } = useTheme();
  const [searchParams, setSearchParams] = useSearchParams();
  const tabFromUrl = searchParams.get("tab");

  // Set default tab to "overview" if none is specified in URL
  const [activeTab, setActiveTab] = useState(
    tabFromUrl && ["overview", "patents"].includes(tabFromUrl)
      ? tabFromUrl
      : "overview"
  );

  // Update URL when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value);
    setSearchParams((current) => {
      const next = new URLSearchParams(current);
      next.set("tab", value);
      return next;
    });
  };

  // Sync with URL params if they change externally
  useEffect(() => {
    if (
      tabFromUrl &&
      ["overview", "patents"].includes(tabFromUrl)
    ) {
      setActiveTab(tabFromUrl);
    } else {
      setActiveTab("overview");
    }
  }, [tabFromUrl]);

  return <Tabs value={activeTab} onValueChange={handleTabChange} className="min-w-0"><TabsList className="mb-3 h-9 md:mb-5 justify-start gap-5 rounded-none border-b border-pl-border bg-transparent p-0"><TabsTrigger value="overview" className="h-9 rounded-none border-b-2 border-transparent bg-transparent px-0 text-sm text-pl-text-2 shadow-none data-[state=active]:border-pl-brand data-[state=active]:bg-transparent data-[state=active]:text-pl-ink data-[state=active]:shadow-none">Setup and support</TabsTrigger><TabsTrigger value="patents" className="h-9 rounded-none border-b-2 border-transparent bg-transparent px-0 text-sm text-pl-text-2 shadow-none data-[state=active]:border-pl-brand data-[state=active]:bg-transparent data-[state=active]:text-pl-ink data-[state=active]:shadow-none">Portfolio</TabsTrigger></TabsList><TabsContent value="overview" className="mt-0 min-w-0"><OverviewTab clientTeam={clientTeam} clientId={clientId} clientData={clientData} caseOwnerName={caseOwnerName} onChangeCaseOwner={onChangeCaseOwner} canManageTeam={canManageTeam} onEditClient={onEditClient}/></TabsContent><TabsContent value="patents" className="mt-0 min-w-0"><PatentsTab/></TabsContent></Tabs>;
};
export default ClientTabs;
