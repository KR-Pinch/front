import { Link } from "react-router-dom";
import { Trophy, Flame, ArrowRight } from "lucide-react";
import { useRanking } from "@/data/mockData";
import AdFitBanner from "@/components/AdFitBanner";
import { adfitSlots } from "@/config/adfit";

/**
 * Desktop-only right rail (xl+). Shows weekly ranking + ad slot.
 * Hidden on mobile/tablet to keep their existing flow intact.
 */
const RightRail = () => {
  const top5 = useRanking("weekly").slice(0, 5);

  return (
    <aside className="wide-up-flex w-[334px] shrink-0 flex-col gap-4 px-4 py-6 border-l border-border/50">
      <div className="sticky top-6 space-y-4">
        {/* Weekly ranking */}
        <div className="rounded-2xl border border-border/50 bg-card/50 p-4 noise">
          <div className="mb-3 flex items-center justify-between">
            <div className="flex items-center gap-1.5">
              <Trophy className="h-3.5 w-3.5 text-accent" />
              <h3 className="text-xs font-bold uppercase tracking-wider">
                주간 랭킹
              </h3>
            </div>
            <Link
              to="/ranking"
              className="flex items-center gap-0.5 text-[11px] font-semibold text-muted-foreground hover:text-accent transition-colors"
            >
              전체
              <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <ul className="space-y-2">
            {top5.map((r, idx) => (
              <li
                key={r.username}
                className="flex items-center gap-2.5 rounded-lg px-1.5 py-1.5 hover:bg-secondary/50 transition-colors"
              >
                <span
                  className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[11px] font-black ${
                    idx === 0
                      ? "bg-accent text-accent-foreground"
                      : idx < 3
                      ? "bg-accent/15 text-accent"
                      : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {idx + 1}
                </span>
                <span className="flex-1 truncate text-xs font-semibold">
                  {r.username}
                </span>
                <span className="flex items-center gap-0.5 text-[11px] text-muted-foreground">
                  <Flame className="h-3 w-3" />
                  {r.totalLikes}
                </span>
              </li>
            ))}
          </ul>
        </div>

        {/* Ad slot */}
        <div className="rounded-2xl border border-border/50 bg-card/50 p-0">
          <p className="px-3 pb-2 pt-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground">
            광고
          </p>
          <AdFitBanner {...adfitSlots.rightRail} />
        </div>

        <p className="px-1 text-[10px] leading-relaxed text-muted-foreground">
          매일 하나만 PINCH.
          <br />
          모든 의견이 남지 않습니다. 오직 선택된 하나만 남습니다.
        </p>
      </div>
    </aside>
  );
};

export default RightRail;
