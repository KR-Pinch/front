import { NavLink, useLocation } from "react-router-dom";
import {
  Brain,
  Archive,
  Trophy,
  MessageCircle,
  User,
  Settings as SettingsIcon,
  LogIn,
} from "lucide-react";
import PicksLogo from "@/components/brand/PicksLogo";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import { useAuth } from "@/hooks/useAuth";

const mainItems = [
  { to: "/", label: "홈", icon: Brain },
  { to: "/topic", label: "오늘의 PICK", icon: MessageCircle },
  { to: "/archive", label: "아카이브", icon: Archive },
  { to: "/ranking", label: "랭킹", icon: Trophy },
];

const accountItems = [
  { to: "/mypage", label: "마이페이지", icon: User },
  { to: "/settings", label: "설정", icon: SettingsIcon },
];

const AppSidebar = () => {
  const { state } = useSidebar();
  const collapsed = state === "collapsed";
  const { pathname } = useLocation();
  const { isAuthenticated } = useAuth();

  const isActive = (path: string) =>
    path === "/" ? pathname === "/" : pathname.startsWith(path);

  return (
    <Sidebar
      id="app-sidebar"
      collapsible="icon"
      aria-label="주요 내비게이션"
      className="border-r border-border/50"
    >
      <SidebarHeader className={collapsed ? "px-1.5 py-3" : "px-3 py-4"}>
        <NavLink
          to="/"
          aria-label="PICKS 홈"
          className={`flex items-center ${
            collapsed ? "justify-center" : "px-1"
          }`}
        >
          <PicksLogo size="md" markOnly={collapsed} />
        </NavLink>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>메인</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {mainItems.map((item) => (
                <SidebarMenuItem key={item.to}>
                  <SidebarMenuButton asChild isActive={isActive(item.to)} tooltip={item.label}>
                    <NavLink to={item.to} className="flex items-center gap-2">
                      <item.icon className="h-4 w-4" />
                      <span>{item.label}</span>
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {isAuthenticated && (
          <SidebarGroup>
            <SidebarGroupLabel>계정</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {accountItems.map((item) => (
                  <SidebarMenuItem key={item.to}>
                    <SidebarMenuButton asChild isActive={isActive(item.to)} tooltip={item.label}>
                      <NavLink to={item.to} className="flex items-center gap-2">
                        <item.icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}
      </SidebarContent>

      <SidebarFooter className={collapsed ? "px-1.5 py-2" : "px-3 py-3"}>
        {!isAuthenticated && (
          <NavLink
            to="/auth"
            aria-label="로그인"
            title={collapsed ? "로그인" : undefined}
            className={`flex items-center rounded-xl bg-accent/10 border border-accent/20 text-xs font-semibold text-accent hover:bg-accent/20 transition-all ${
              collapsed
                ? "h-9 w-9 mx-auto justify-center"
                : "gap-2 px-3 py-2"
            }`}
          >
            <LogIn className="h-3.5 w-3.5 shrink-0" />
            {!collapsed && <span>로그인</span>}
          </NavLink>
        )}

        {/* Brand concept tagline — only visible when expanded. */}
        {!collapsed && (
          <p className="mt-3 px-1 text-[11px] leading-relaxed text-muted-foreground">
            오직 선택된 하나만 남습니다.
            <br />
            <span className="font-semibold text-foreground/70">
              One PICK a day.
            </span>
          </p>
        )}
      </SidebarFooter>
    </Sidebar>
  );
};

export default AppSidebar;
