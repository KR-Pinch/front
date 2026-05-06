/**
 * Central icon mapping for primary navigation routes.
 *
 * SINGLE SOURCE OF TRUTH — every surface that renders a nav-related icon
 * (BottomNav, AppSidebar, page headings, breadcrumbs, etc.) MUST import from
 * here. Never hard-code a different Lucide icon for the same route, or the
 * sidebar/bottom-nav/page heading will visually drift apart.
 */
import {
  Brain,
  MessageCircle,
  Archive,
  Trophy,
  User,
  Settings,
  type LucideIcon,
} from "lucide-react";

export type NavRouteKey =
  | "home"
  | "topic"
  | "archive"
  | "ranking"
  | "mypage"
  | "settings";

export interface NavRouteMeta {
  key: NavRouteKey;
  to: string;
  /** Short label used in BottomNav (mobile, tight). */
  shortLabel: string;
  /** Full label used in Sidebar / page headings. */
  label: string;
  icon: LucideIcon;
}

export const navRoutes: Record<NavRouteKey, NavRouteMeta> = {
  home:     { key: "home",     to: "/",         shortLabel: "홈",       label: "홈",          icon: Brain },
  topic:    { key: "topic",    to: "/topic",    shortLabel: "PINCH",     label: "오늘의 PINCH", icon: MessageCircle },
  archive:  { key: "archive",  to: "/archive",  shortLabel: "아카이브", label: "아카이브",    icon: Archive },
  ranking:  { key: "ranking",  to: "/ranking",  shortLabel: "랭킹",     label: "똑똑이 랭킹", icon: Trophy },
  mypage:   { key: "mypage",   to: "/mypage",   shortLabel: "MY",       label: "마이페이지",  icon: User },
  settings: { key: "settings", to: "/settings", shortLabel: "설정",     label: "설정",        icon: Settings },
};

/** Ordered list for BottomNav (mobile primary nav). */
export const bottomNavRoutes: NavRouteMeta[] = [
  navRoutes.home,
  navRoutes.topic,
  navRoutes.archive,
  navRoutes.ranking,
  navRoutes.mypage,
];

/** Ordered list for Sidebar — main section. */
export const sidebarMainRoutes: NavRouteMeta[] = [
  navRoutes.home,
  navRoutes.topic,
  navRoutes.archive,
  navRoutes.ranking,
];

/** Ordered list for Sidebar — account section (auth-gated). */
export const sidebarAccountRoutes: NavRouteMeta[] = [
  navRoutes.mypage,
  navRoutes.settings,
];
