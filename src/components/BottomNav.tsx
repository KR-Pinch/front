import { Link, useLocation } from "react-router-dom";
import { bottomNavRoutes } from "@/config/navIcons";

const BottomNav = () => {
  const location = useLocation();

  return (
    <nav
      className="mobile-only fixed bottom-0 left-0 right-0 z-50 glass border-t border-border/50"
      aria-label="PICKS 주요 내비게이션"
    >
      <span className="sr-only">PICKS — 오직 선택된 하나만 남습니다.</span>
      <div className="mx-auto flex max-w-lg items-center justify-around py-2">
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
