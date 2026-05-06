import { Link } from "react-router-dom";
import PinchLogo from "@/components/brand/PinchLogo";

/**
 * Brand footer rendered inside AppShell on tablet+ screens.
 *
 * Reinforces the PINCH naming concept:
 *   "모든 의견이 남지 않습니다. 오직 선택된 하나만 남습니다."
 *
 * Hidden on mobile because BottomNav already occupies the bottom edge
 * and a separate footer would duplicate navigation affordances.
 */
const SiteFooter = () => {
  const year = new Date().getFullYear();

  return (
    <footer
      className="tablet-up border-t border-border/50 bg-background/60 backdrop-blur-sm"
      aria-labelledby="site-footer-brand"
    >
      <div className="container py-8">
        <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
          {/* Brand block */}
          <div className="flex max-w-md flex-col gap-3">
            <Link
              to="/"
              aria-label="PINCH 홈"
              aria-labelledby="site-footer-brand"
              className="inline-flex"
            >
              <span id="site-footer-brand" className="sr-only">
                PINCH
              </span>
              <PinchLogo size="md" withTagline />
            </Link>

            <p className="text-sm leading-relaxed text-muted-foreground">
              모든 의견이 남지 않습니다.
              <br />
              <span className="text-foreground/80">
                오직 선택된 하나만 남습니다.
              </span>
            </p>

            <p className="text-xs text-muted-foreground/80">
              <span className="font-semibold text-foreground/70">PINCH</span>은
              당신의 한 표,{" "}
              <span className="font-semibold text-foreground/70">PINCH</span>는
              매일 선택된 의견의 모음입니다.
            </p>
          </div>

          {/* Link columns */}
          <nav
            aria-label="푸터 내비게이션"
            className="grid grid-cols-2 gap-x-10 gap-y-2 text-sm sm:grid-cols-3"
          >
            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                서비스
              </p>
              <Link
                to="/topic"
                className="text-foreground/80 transition-colors hover:text-accent"
              >
                오늘의 PINCH
              </Link>
              <Link
                to="/archive"
                className="text-foreground/80 transition-colors hover:text-accent"
              >
                아카이브
              </Link>
              <Link
                to="/ranking"
                className="text-foreground/80 transition-colors hover:text-accent"
              >
                랭킹
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                계정
              </p>
              <Link
                to="/mypage"
                className="text-foreground/80 transition-colors hover:text-accent"
              >
                마이페이지
              </Link>
              <Link
                to="/settings"
                className="text-foreground/80 transition-colors hover:text-accent"
              >
                설정
              </Link>
            </div>

            <div className="flex flex-col gap-2">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                정책
              </p>
              <Link
                to="/terms"
                className="text-foreground/80 transition-colors hover:text-accent"
              >
                이용약관
              </Link>
              <Link
                to="/privacy"
                className="text-foreground/80 transition-colors hover:text-accent"
              >
                개인정보처리방침
              </Link>
            </div>
          </nav>
        </div>

        <div className="mt-8 flex flex-col gap-2 border-t border-border/40 pt-4 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {year} PINCH. All rights reserved.</p>
          <p className="font-medium tracking-wide text-muted-foreground/80">
            One topic. Many voices.{" "}
            <span className="text-accent">Only one remains.</span>
          </p>
        </div>
      </div>
    </footer>
  );
};

export default SiteFooter;
