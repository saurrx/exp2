import React, { useRef, useState } from "react";
import { useTrackOnce } from "@/lib/analytics";
import { useParams } from "react-router-dom";
import { PageHeader } from "@/components/DashboardChrome";
import PatentsContent from "@/components/patents/PatentsContent";
import PatentDetailsContent from "@/components/patents/PatentDetailsContent";
import { Button } from "@/components/ui/button";
import { Download, ChevronDown } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import useUserCookie from "@/hooks/use-auth";
import { Link } from "react-router-dom";
import { DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from "@/components/ui/dropdown-menu";

const PatentsPage: React.FC = () => {
  const { patentId } = useParams();
  const { user } = useUserCookie();
  // One route, two screens: the portfolio list and a single record. They answer
  // different questions ("is anyone browsing patents?" vs "which records get
  // opened?"), so they are two events, each fired only on its own branch.
  useTrackOnce("patents_viewed", {}, !patentId);
  useTrackOnce("patent_opened", { patent_id: patentId }, !!patentId);
  const [totalPatents, setTotalPatents] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  // PatentsContent owns the filter state, so it builds the export URL +
  // triggers the download. We hold a ref to its latest trigger fn here.
  const exportTriggerRef = useRef<(() => Promise<void> | void) | null>(null);
  const handleExportClick = async () => {
    if (!exportTriggerRef.current) return;
    setIsExporting(true);
    try {
      await exportTriggerRef.current();
    } finally {
      setIsExporting(false);
    }
  };

  const [searchParams] = useSearchParams();
  const patentStatus = searchParams.get("status");


  return (
    <>
      {/* The page's own header controls, rendered here and portalled into the
          layout's header — which now outlives the navigation. */}
      {!patentId && (
        <PageHeader
          actions={
            <>
              <DropdownMenu><DropdownMenuTrigger asChild><Button size="sm" variant="outline" className="md:hidden">Navigation <ChevronDown aria-hidden="true"/></Button></DropdownMenuTrigger><DropdownMenuContent className="bg-pl-bg text-pl-ink motion-reduce:!animate-none" align="end">{(user?.role === "INVENTOR" ? [["Home","/"],["Ideas","/ideas"],["Patents","/patents"],["Profile","/profile"]] : user?.role === "LEGAL_COUNSEL" ? [["Home","/"],["Ideas","/ideas"],["Patents","/patents"],["Actions","/due-dates"],["Workspace","/workspace"],["Profile","/profile"]] : [[user?.role === "CASE_OWNER" ? "My work" : "Dashboard","/"],["Clients","/clients"],["Ideas","/ideas"],["Patents","/patents"],["Due dates","/due-dates"],["Actions","/actions"],...(user?.role === "PHOTON_ADMIN" ? [["Workspace","/workspace"]] : []),["Profile","/profile"]]).map(([label,path]) => <DropdownMenuItem key={path} asChild><Link to={path}>{label}</Link></DropdownMenuItem>)}</DropdownMenuContent></DropdownMenu>
              <Button
                variant="outline"
                size="sm"
                onClick={handleExportClick}
                disabled={isExporting || totalPatents === 0}
                aria-label={isExporting ? "Exporting CSV" : "Export CSV"}
                className="pulse-filter-control h-9 gap-2"
              >
                <Download className="h-4 w-4" />
                <span className="hidden sm:inline">
                  {isExporting ? "Exporting..." : "Export CSV"}
                </span>
              </Button>
            </>
          }
        />
      )}
      {/* min-h-[100dvh-64px] made this page GROW: every filter chip row added
          height, the page passed the viewport, and the whole thing — header
          included — scrolled. /due-dates has always been bounded instead
          (min-h-0 flex-1 + overflow-hidden), so its table takes whatever space
          is left at that moment and scrolls inside itself. Same shape here.
          The detail view keeps the old behaviour: it is a document, and a
          document should scroll. */}
      <div
        className={patentId ? "flex min-h-0 w-full flex-1 flex-col" : "flex min-h-0 w-full flex-1 flex-col overflow-hidden"}
      >
        <div className="flex min-h-0 min-w-0 w-full flex-1 flex-col">
          {patentId ? (
            <PatentDetailsContent patentId={patentId} />
          ) : (
            <PatentsContent
              patentStatus={patentStatus}
              setTotalPatents={setTotalPatents}
              setExportTrigger={(fn) => {
                exportTriggerRef.current = fn;
              }}
            />
          )}
        </div>
      </div>
    </>
  );
};

export default PatentsPage;
