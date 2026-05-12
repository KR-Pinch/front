import { useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { bottomNavRoutes } from "@/config/navIcons";

const BottomNav = () => {
  const location = useLocation();

  useEffect(() => {
    const viewport = window.visualViewport;
    const root = document.documentElement;

    if (!viewport) {
      root.style.setProperty("--visual-viewport-bottom-offset", "0px");
      return;
    }

    let frame = 0;
    const updateBottomOffset = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const rawOffset = window.innerHeight - viewport.height - viewport.offsetTop;
        const offset = Math.max(0, Math.round(rawOffset));
        const keyboardIsOpen = offset > 160;
        const boundedOffset = keyboardIsOpen ? 0 : Math.min(offset, 96);
        root.style.setProperty("--visual-viewport-bottom-offset", `${boundedOffset}px`);
      });
    };

    updateBottomOffset();
    viewport.addEventListener("resize", updateBottomOffset);
    viewport.addEventListener("scroll", updateBottomOffset);
    window.addEventListener("resize", updateBottomOffset);
    window.addEventListener("orientationchange", updateBottomOffset);

    return () => {
      cancelAnimationFrame(frame);
      viewport.removeEventListener("resize", updateBottomOffset);
      viewport.removeEventListener("scroll", updateBottomOffset);
      window.removeEventListener("resize", updateBottomOffset);
      window.removeEventListener("orientationchange", updateBottomOffset);
      root.style.setProperty("--visual-viewport-bottom-offset", "0px");
    };
  }, []);

  return (
    <nav
      className="mobile-only bottom-nav fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50"
      style={{ bottom: "var(--visual-viewport-bottom-offset, 0px)" }}
      aria-label="PINCH 주요 내비게이션"
    >
      <span className="sr-only">PINCH — 오직 선택된 하나만 남습니다.</span>
      <div className="mx-auto flex max-w-lg items-center justify-around px-1 pb-[max(0.5rem,env(safe-area-inset-bottom))] pt-2">
        {bottomNavRoutes.map(({ to, shortLabel, icon: Icon }) => {
          const isActive = location.pathname === to;
          return (
            <Link
              key={to}
              to={to}
              className={`flex flex-col items-center gap-0.5 rounded-xl px-4 py-2 text-xs transition-all ${
                isActive
                  ? "text-accent"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              <Icon className={`h-5 w-5 ${isActive ? "drop-shadow-[0_0_8px_hsl(45_100%_58%/0.5)]" : ""}`} />
              <span className="font-medium">{shortLabel}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
};

export default BottomNav;
