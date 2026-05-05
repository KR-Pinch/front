import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { readFileSync } from "fs";
import { resolve } from "path";
import WelcomeModal from "./WelcomeModal";

/**
 * Regression tests for WelcomeModal centering.
 *
 * Background: framer-motion writes inline `transform` styles on animated
 * elements. If we also use Tailwind's `-translate-x-1/2 -translate-y-1/2`
 * (combined with `top-1/2 left-1/2`) on the same element, framer-motion
 * overwrites those transforms and breaks centering.
 *
 * The fix is to center via a Flexbox wrapper (`flex items-center justify-center`)
 * and let framer-motion own the transform on the inner motion element.
 *
 * These tests guard that contract so the bug does not silently come back.
 */

const renderModal = () =>
  render(
    <MemoryRouter>
      <WelcomeModal open username="테스터" />
    </MemoryRouter>
  );

describe("WelcomeModal — centering / transform regression", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the welcome message", () => {
    renderModal();
    expect(screen.getByText(/환영합니다/)).toBeInTheDocument();
    expect(screen.getByText("테스터")).toBeInTheDocument();
  });

  it("centers the modal via a flex container (not absolute translate)", () => {
    renderModal();
    const heading = screen.getByText(/환영합니다/);

    // Find the flex centering wrapper above the modal card.
    const flexWrapper = heading.closest<HTMLElement>(
      ".fixed.inset-0.flex.items-center.justify-center"
    );
    expect(flexWrapper).not.toBeNull();

    const cls = flexWrapper!.className;
    expect(cls).toContain("flex");
    expect(cls).toContain("items-center");
    expect(cls).toContain("justify-center");
  });

  it("does NOT use translate-based centering that would conflict with framer-motion", () => {
    renderModal();

    // No element inside the modal subtree should combine top/left-1/2 with
    // -translate-*-1/2, which is the pattern that previously fought
    // framer-motion's inline transforms.
    const all = document.querySelectorAll<HTMLElement>("[class]");
    for (const el of Array.from(all)) {
      const c = el.className;
      if (typeof c !== "string") continue;
      const usesTopLeftHalf = /\btop-1\/2\b/.test(c) && /\bleft-1\/2\b/.test(c);
      const usesNegativeTranslate =
        /-translate-x-1\/2/.test(c) || /-translate-y-1\/2/.test(c);
      expect(
        usesTopLeftHalf && usesNegativeTranslate,
        `Element should not combine top/left-1/2 with -translate-*-1/2: ${c}`
      ).toBe(false);
    }
  });

  it("does not set inline top/left percentage positioning on the modal", () => {
    renderModal();
    const heading = screen.getByText(/환영합니다/);
    const card = heading.closest<HTMLElement>(".max-w-sm");
    expect(card).not.toBeNull();

    // framer-motion owns transform; we should NOT be positioning via top/left %.
    const inline = card!.getAttribute("style") ?? "";
    expect(inline).not.toMatch(/top:\s*50%/);
    expect(inline).not.toMatch(/left:\s*50%/);
  });
});

describe("WelcomeModal — source contract", () => {
  // Static source-level guards: catch regressions even if rendering changes.
  const src = readFileSync(
    resolve(__dirname, "./WelcomeModal.tsx"),
    "utf-8"
  );

  it("uses a flex centering wrapper in source", () => {
    expect(src).toMatch(/flex items-center justify-center/);
  });

  it("does not reintroduce translate-based centering on the motion element", () => {
    expect(src).not.toMatch(/-translate-x-1\/2/);
    expect(src).not.toMatch(/-translate-y-1\/2/);
  });

  it("uses pixel offsets (not percentage strings) for framer-motion y animation", () => {
    // Percentage-string offsets like y: "-40%" were the original bug source.
    expect(src).not.toMatch(/y:\s*"-?\d+%"/);
    expect(src).not.toMatch(/x:\s*"-?\d+%"/);
  });
});

describe("WelcomeModal — viewport-relative centering (portal regression)", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("renders the modal as a direct child of document.body (via portal)", () => {
    // If the modal renders inside its parent React tree, a transformed ancestor
    // (e.g. a framer-motion <motion.div> on the auth page) will become the
    // containing block for `position: fixed`, breaking viewport centering.
    // A portal to document.body avoids this entirely.
    const { container } = render(
      <MemoryRouter>
        {/* Simulate a transformed ancestor like the Auth page wrapper */}
        <div style={{ transform: "translateY(0px)" }}>
          <WelcomeModal open username="테스터" />
        </div>
      </MemoryRouter>
    );

    const heading = screen.getByText(/환영합니다/);
    // The modal subtree must NOT live inside the rendered React container.
    expect(container.contains(heading)).toBe(false);

    // Walk up from the heading — the fixed flex wrapper must be a direct
    // child of <body>, not nested inside the transformed ancestor.
    const flexWrapper = heading.closest<HTMLElement>(
      ".fixed.inset-0.flex.items-center.justify-center"
    );
    expect(flexWrapper).not.toBeNull();
    expect(flexWrapper!.parentElement).toBe(document.body);
  });

  it("uses a fixed, full-viewport flex wrapper for centering", () => {
    renderModal();
    const heading = screen.getByText(/환영합니다/);
    const wrapper = heading.closest<HTMLElement>(
      ".fixed.inset-0.flex.items-center.justify-center"
    );
    expect(wrapper).not.toBeNull();

    const cls = wrapper!.className;
    // `fixed inset-0` ensures the wrapper covers the full viewport (top:0,
    // right:0, bottom:0, left:0) and `flex items-center justify-center`
    // centers the modal inside it.
    expect(cls).toContain("fixed");
    expect(cls).toContain("inset-0");
    expect(cls).toContain("items-center");
    expect(cls).toContain("justify-center");
  });

  it("does not constrain the modal with non-viewport sizing on the wrapper", () => {
    renderModal();
    const heading = screen.getByText(/환영합니다/);
    const wrapper = heading.closest<HTMLElement>(
      ".fixed.inset-0.flex.items-center.justify-center"
    )!;

    // The centering wrapper must not introduce its own max-width / max-height
    // that would offset the modal away from viewport center.
    const cls = wrapper.className;
    expect(cls).not.toMatch(/\bmax-w-/);
    expect(cls).not.toMatch(/\bmax-h-/);
    expect(cls).not.toMatch(/\bm[trblxy]?-/); // no margin offsets
  });
});

describe("WelcomeModal — portal source contract", () => {
  const src = readFileSync(
    resolve(__dirname, "./WelcomeModal.tsx"),
    "utf-8"
  );

  it("imports createPortal from react-dom", () => {
    expect(src).toMatch(/import\s*\{[^}]*\bcreatePortal\b[^}]*\}\s*from\s*["']react-dom["']/);
  });

  it("renders the modal through createPortal into document.body", () => {
    expect(src).toMatch(/createPortal\(/);
    expect(src).toMatch(/document\.body/);
  });
});
