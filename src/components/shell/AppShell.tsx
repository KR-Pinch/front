import { useEffect, useState } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import AppSidebar from "./AppSidebar";
import RightRail from "./RightRail";
import SiteFooter from "./SiteFooter";

const SIDEBAR_STORAGE_KEY = "app.sidebar.open";

/**
 * Responsive app shell.
 *
 * - Mobile (<md): renders only the page; pages keep their own sticky header
 *   and BottomNav (BottomNav itself uses `.mobile-only`).
 * - Tablet (md..xl): collapsible sidebar on the left + main content.
 * - Desktop (xl+): sidebar + main + right rail (weekly ranking, ads).
 *
 * Auth/Admin/Legal pages are rendered outside the shell to keep their
 * focused single-column layouts.
 */
const AppShell = () => {
  const { pathname } = useLocation();

  // Persist sidebar open/closed across route changes (and reloads).
  // Without this, navigating between pages would reset the sidebar to
  // `defaultOpen` and re-expand it after the user collapsed it.
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    try {
      const stored = window.localStorage.getItem(SIDEBAR_STORAGE_KEY);
      if (stored === "true") return true;
      if (stored === "false") return false;
    } catch {
      /* ignore */
    }
    return true;
  });

  useEffect(() => {
    try {
      window.localStorage.setItem(SIDEBAR_STORAGE_KEY, String(sidebarOpen));
    } catch {
      /* ignore */
    }
  }, [sidebarOpen]);

  // Routes that should NOT use the shell (full-bleed / focused flows).
  const bareRoutes = [
    "/auth",
    "/admin",
    "/admin/login",
    "/legal",
    "/terms",
    "/privacy",
  ];
  const isBare = bareRoutes.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  if (isBare) {
    return <Outlet />;
  }

  return (
    <SidebarProvider open={sidebarOpen} onOpenChange={setSidebarOpen}>
      <div className="flex min-h-screen w-full bg-background">
        {/* Sidebar — tablet+ only. Mobile uses BottomNav (rendered by pages). */}
        <div className="tablet-up">
          <AppSidebar />
        </div>

        {/* Main column */}
        <div className="flex min-w-0 flex-1 flex-col">
          {/* Desktop top bar — pairs with .page-sticky-header (top:48px on md+). */}
          <div className="shell-top-bar">
            <SidebarTrigger />
            <a
              href="/"
              aria-label="PINCH 홈"
              className="flex items-center gap-2"
            >
              <span className="brand-wordmark text-sm">
                <span className="text-gradient">PINCH</span>
              </span>
              <span
                aria-hidden="true"
                className="hidden text-[11px] font-medium tracking-wide text-muted-foreground lg:inline"
              >
                · 오직 선택된 하나만 남습니다
              </span>
            </a>
            <div className="flex-1" />
          </div>

          <main className="min-w-0 flex-1">
            <Outlet />
          </main>

          {/* Brand footer — tablet+ only (mobile uses BottomNav). */}
          <SiteFooter />
        </div>

        {/* Right rail — xl+ only */}
        <RightRail />
      </div>
    </SidebarProvider>
  );
};

export default AppShell;

