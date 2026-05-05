/**
 * Regression tests for BottomNav.
 *
 * After AppShell was introduced, the mobile BottomNav must keep:
 *   - device-tier visibility via `.mobile-only` (hidden at md+)
 *   - fixed pinning to the viewport bottom
 *   - z-index above page-sticky-header (z-40) and shell-top-bar (z-30)
 *
 * These tests lock those invariants so future shell refactors can't
 * silently regress the mobile nav.
 */
import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import BottomNav from "../BottomNav";

const renderNav = (path = "/") =>
  render(
    <MemoryRouter initialEntries={[path]}>
      <BottomNav />
    </MemoryRouter>,
  );

const getNav = (container: HTMLElement) => {
  const nav = container.querySelector("nav");
  if (!nav) throw new Error("BottomNav <nav> not found");
  return nav;
};

describe("BottomNav — shell positioning regression", () => {
  it("uses semantic device-tier util `.mobile-only` (hidden on tablet+)", () => {
    const { container } = renderNav();
    const nav = getNav(container);
    // Single source of truth for tier visibility — never raw `md:hidden`.
    expect(nav.classList.contains("mobile-only")).toBe(true);
    expect(nav.classList.contains("md:hidden")).toBe(false);
    expect(nav.classList.contains("hidden")).toBe(false);
  });

  it("is fixed-pinned to the bottom of the viewport", () => {
    const { container } = renderNav();
    const nav = getNav(container);
    expect(nav.classList.contains("fixed")).toBe(true);
    expect(nav.classList.contains("bottom-0")).toBe(true);
    expect(nav.classList.contains("left-0")).toBe(true);
    expect(nav.classList.contains("right-0")).toBe(true);
  });

  it("sits above page-sticky-header (z-40) and shell-top-bar (z-30)", () => {
    const { container } = renderNav();
    const nav = getNav(container);
    expect(nav.classList.contains("z-50")).toBe(true);
  });

  it("renders all 5 primary routes", () => {
    const { container } = renderNav();
    const links = container.querySelectorAll("nav a");
    const hrefs = Array.from(links).map((l) => l.getAttribute("href"));
    expect(hrefs).toEqual(["/", "/topic", "/archive", "/ranking", "/mypage"]);
  });

  it.each([
    ["/", "홈"],
    ["/topic", "PICK"],
    ["/archive", "아카이브"],
    ["/ranking", "랭킹"],
    ["/mypage", "MY"],
  ])("highlights the active item on %s", (path, label) => {
    const { container } = renderNav(path);
    const active = container.querySelector(`a[href="${path}"]`);
    expect(active).not.toBeNull();
    expect(active!.className).toContain("text-accent");
    // Inactive siblings should not get the accent color.
    const others = container.querySelectorAll(`nav a:not([href="${path}"])`);
    others.forEach((el) => {
      expect(el.className).not.toContain("text-accent");
    });
    // Sanity: the rendered label exists.
    expect(active!.textContent).toContain(label);
  });
});
