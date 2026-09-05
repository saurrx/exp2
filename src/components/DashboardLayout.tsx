import React, { Suspense } from "react";
import { Outlet, useLocation } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header, { type DashboardHeaderConfig } from "./Header";
import useUserCookie from "@/hooks/use-auth";
import { DashboardSlotProvider } from "./DashboardChrome";
import Cookies from "js-cookie";
import API_CONFIG from "@/lib/apiConfig";
import { clearAuthSession } from "@/lib/auth";
import { track, identifyUser, resetUser } from "@/lib/analytics";
import { Button } from "@/components/ui/button";

interface DashboardLayoutProps {
  /** Omitted when used as a ROUTE layout — the router's Outlet fills it. */
  children?: React.ReactNode;
  className?: string;
  header?: Partial<DashboardHeaderConfig> | false;
}

const defaultHeaderForRoute = (
  pathname: string,
  role?: string,
): DashboardHeaderConfig => {
  if (pathname === "/") {
    return {
      title: role === "INVENTOR" ? "Your invention workspace" : role === "LEGAL_COUNSEL" ? "Overview" : "Portfolio overview",
    };
  }
  if (pathname === "/clients") return { title: "Clients" };
  if (pathname.startsWith("/clients/")) {
    return {
      title: "Client workspace",
      back: { label: "Back to clients", to: "/clients" },
    };
  }
  if (/^\/ideas\/[^/]+\/draft$/.test(pathname)) {
    // An INVENTOR goes back to the LIST, not to the idea page.
    //
    // The idea page bounces them straight back here: IdeaDetailsContent
    // redirects an inventor whose idea is IN_DRAFT to this workspace, with
    // `replace: true`. So "Back to idea" looked like a dead button — one
    // navigation out, one redirect in, no visible change — and the `replace`
    // poisoned the browser's own Back for anyone who arrived via the idea page.
    // Other roles read that page rather than being bounced off it, so they keep
    // the closer target.
    return role === "INVENTOR"
      ? { title: "Working submission", back: { label: "Back to my ideas", to: "/ideas" } }
      : {
          title: "Working submission",
          back: { label: "Back to idea", to: pathname.replace(/\/draft$/, "") },
        };
  }
  if (/^\/ideas\/[^/]+$/.test(pathname)) {
    return {
      title: "Idea details",
      back: { label: "Back to ideas", to: "/ideas" },
    };
  }
  if (pathname === "/ideas") {
    return {
      title:
        role === "LEGAL_COUNSEL" || role === "TECH_COMMITTEE"
          ? "Ideas"
          : role === "INVENTOR"
            ? "My ideas"
            : "Ideas",
    };
  }
  if (/^\/patents\/[^/]+$/.test(pathname)) {
    return {
      title: "Patent detail",
      back: { label: "Back to patents", to: "/patents" },
    };
  }
  if (pathname === "/patents") return { title: "Patents" };
  if (pathname === "/due-dates") return { title: role === "LEGAL_COUNSEL" ? "Deadlines" : "Actions" };
  // Photon-side roles reach /actions through "Actions". The Workspace Admin
  // reaches /due-dates through "Deadlines"; legacy committee navigation keeps
  // its existing "Actions" label.
  if (pathname === "/actions") return { title: "Actions" };
  if (pathname === "/assistant") return { title: "AI assistant" };
  if (pathname === "/profile") return { title: "My profile" };
  if (pathname === "/workspace") {
    return { title: "Workspace" };
  }
  return { title: "Pulse" };
};

/**
 * Shown while a page chunk loads. Fills the CONTENT area only — it sits inside
 * <main>, under the header, beside the sidebar, so the chrome stays put and the
 * transition reads as "this panel is loading" rather than "the app went away".
 */
const ContentFallback = () => (
  <div className="flex min-h-0 flex-1 items-center justify-center py-16">
    <div
      className="h-6 w-6 animate-spin rounded-full border-2 border-[var(--pulse-line-strong)] border-t-[var(--pulse-brand)] motion-reduce:animate-none"
      aria-label="Loading"
      role="status"
    />
  </div>
);

const DashboardLayout: React.FC<DashboardLayoutProps> = ({
  children,
  className,
  header,
}) => {
  const { pathname, search: locationSearch } = useLocation();
  const { user } = useUserCookie();
  const clientView = sessionStorage.getItem("pl_client_mode") === "true";
  const [exitingClientView, setExitingClientView] = React.useState(false);
  const [exitError, setExitError] = React.useState(false);
  const exitInFlight = React.useRef(false);
  const exitClientView = async () => {
    if (exitInFlight.current) return;
    exitInFlight.current = true;
    setExitingClientView(true);
    setExitError(false);
    try {
      const original = JSON.parse(sessionStorage.getItem("pl_original_admin_user") ?? "null");
      if (!original?.id || !["CASE_OWNER", "PHOTON_ADMIN"].includes(original.role)) throw new Error("Missing original session");
      const response = await API_CONFIG.post("/api/v1/auth/exit-client-view");
      const restored = response?.data?.data?.user;
      if (!restored || restored.id !== original.id || restored.role !== original.role) throw new Error("Session mismatch");
      Cookies.set("pl_user", JSON.stringify(restored), { secure: true, sameSite: "lax", path: "/" });
      sessionStorage.removeItem("pl_client_mode");
      sessionStorage.removeItem("pl_original_admin_user");
      resetUser();
      identifyUser(restored.id, { role: restored.role, client_id: restored.client_id ?? restored.clientId });
      track("view_as_exited");
      window.location.replace("/clients");
    } catch {
      setExitError(true);
      setExitingClientView(false);
      exitInFlight.current = false;
    }
  };
  const [sidebarCollapsed, setSidebarCollapsed] = React.useState(() => {
    try {
      if (window.matchMedia("(max-width: 1439px)").matches) return true;
      return localStorage.getItem("pulse-sidebar-collapsed") === "true";
    } catch {
      return false;
    }
  });

  React.useEffect(() => {
    const compactViewport = window.matchMedia("(max-width: 1439px)");
    const syncSidebarToViewport = (matches: boolean) => {
      if (matches) {
        setSidebarCollapsed(true);
        return;
      }

      setSidebarCollapsed(
        localStorage.getItem("pulse-sidebar-collapsed") === "true",
      );
    };

    const onViewportChange = (event: MediaQueryListEvent) =>
      syncSidebarToViewport(event.matches);

    syncSidebarToViewport(compactViewport.matches);
    compactViewport.addEventListener("change", onViewportChange);
    return () => compactViewport.removeEventListener("change", onViewportChange);
  }, []);

  const toggleSidebarCollapse = () => {
    setSidebarCollapsed((current) => {
      const next = !current;
      localStorage.setItem("pulse-sidebar-collapsed", String(next));
      return next;
    });
  };

  const resolvedHeader = React.useMemo(() => {
    if (header === false) return null;
    return {
      ...defaultHeaderForRoute(pathname, user?.role),
      ...(/^\/patents\/[^/]+$/.test(pathname) ? { back: { label: "Back to patents", to: `/patents${locationSearch}` } } : {}),
      ...(header || {}),
    };
  }, [header, pathname, locationSearch, user?.role]);

  // The header slots. Refs rather than state so a page's portal targets a
  // stable DOM node; `ready` flips once after mount so the portals attach on
  // the next paint instead of throwing into null on the first.
  const titleSlotRef = React.useRef<HTMLSpanElement | null>(null);
  const actionsSlotRef = React.useRef<HTMLSpanElement | null>(null);
  const [ready, setReady] = React.useState(0);
  React.useEffect(() => { setReady(n => n + 1); }, []);
  const [titleSlotFilled, setTitleSlotFilled] = React.useState(false);
  // A page's title arrives by portal, so React does not tell us it happened.
  // Watching the slot is what lets the default title hide exactly when a real
  // one appears, and come back when the page leaves.
  React.useEffect(() => {
    const node = titleSlotRef.current;
    if (!node) return;
    const sync = () => setTitleSlotFilled(node.childNodes.length > 0);
    sync();
    const observer = new MutationObserver(sync);
    observer.observe(node, { childList: true });
    return () => observer.disconnect();
  }, [ready]);

  const slots = React.useMemo(
    () => ({ title: titleSlotRef.current, actions: actionsSlotRef.current, ready }),
    [ready],
  );

  const content = (
      <main className={`flex min-w-0 flex-1 flex-col overflow-auto bg-[var(--pulse-canvas)] ${className || ""}`}>
        {resolvedHeader && <Header {...resolvedHeader} titleSlotRef={titleSlotRef} actionsSlotRef={actionsSlotRef} titleSlotFilled={titleSlotFilled} />}
        {children ?? <Suspense fallback={<ContentFallback />}><Outlet /></Suspense>}
      </main>
  );

  return (
    <DashboardSlotProvider value={slots}>
    <div className="flex h-dvh min-h-[640px] bg-[var(--pulse-canvas)] text-[var(--pulse-ink)]">
      <Sidebar collapsed={sidebarCollapsed} toggleSidebar={toggleSidebarCollapse} onExitClientView={exitClientView} exitingClientView={exitingClientView} />
      {clientView ? (
        <div data-client-view className="flex min-w-0 flex-1 flex-col">
          <section aria-label="Client view" className="shrink-0 border-b border-[var(--pulse-line)] bg-[var(--pulse-surface)] px-6 py-3">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <p className="min-w-0 break-words text-sm text-[var(--pulse-ink-secondary)]">Client view · {user?.organization_name || user?.client?.name || "Client workspace"}</p>
              <Button variant="outline" size="sm" onClick={exitClientView} disabled={exitingClientView}>{exitingClientView ? "Exiting…" : "Exit client view"}</Button>
            </div>
            {exitError && <div role="alert" className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[var(--pulse-ink-secondary)]">
              <p>Could not restore your session. Try Exit client view again, or sign in again.</p>
              <Button variant="outline" size="sm" onClick={async () => {
                try { await API_CONFIG.post("/api/v1/auth/logout"); } catch { /* Local recovery must remain available. */ }
                clearAuthSession();
                window.location.replace("/login");
              }}>Sign in again</Button>
            </div>}
          </section>
          {content}
        </div>
      ) : content}
    </div>
    </DashboardSlotProvider>
  );
};

export default DashboardLayout;
