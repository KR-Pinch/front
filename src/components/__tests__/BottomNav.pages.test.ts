/**
 * Regression: every page that lives inside AppShell must render <BottomNav />,
 * because AppShell does NOT render it (mobile relies on each page including
 * its own BottomNav). If a future refactor forgets one, mobile users lose
 * navigation on that route.
 *
 * This is a static source check (fast, no rendering required).
 */
import { describe, it, expect } from "vitest";
import { readFileSync, readdirSync } from "node:fs";
import { join, resolve } from "node:path";

const PAGES_DIR = resolve(__dirname, "../../pages");

// Pages excluded from AppShell (see AppShell.tsx `bareRoutes`) — these
// intentionally do NOT show BottomNav.
const BARE_PAGES = new Set([
  "Auth.tsx",
  "Admin.tsx",
  "AdminLogin.tsx",
  "NotFound.tsx",
  "_DevPreview.tsx",
]);

const listPageFiles = (): string[] =>
  readdirSync(PAGES_DIR).filter(
    (f) => f.endsWith(".tsx") && !BARE_PAGES.has(f),
  );

describe("AppShell pages render BottomNav (regression)", () => {
  const pages = listPageFiles();

  it("discovers page files", () => {
    expect(pages.length).toBeGreaterThan(0);
  });

  it.each(pages)("%s imports and renders <BottomNav />", (file) => {
    const src = readFileSync(join(PAGES_DIR, file), "utf8");
    expect(
      src.includes('from "@/components/BottomNav"') ||
        src.includes("from '@/components/BottomNav'"),
      `${file} is missing the BottomNav import`,
    ).toBe(true);
    expect(
      src.includes("<BottomNav"),
      `${file} imports BottomNav but never renders it`,
    ).toBe(true);
  });
});
