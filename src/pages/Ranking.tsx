import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Crown, Trophy, Medal, Heart } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import { ResponsiveAdFitBanner } from "@/components/AdFitBanner";
import PageTransition from "@/components/PageTransition";
import ThemeToggle from "@/components/ThemeToggle";
import Seo from "@/components/Seo";
import { adfitSlots } from "@/config/adfit";
import { RANKING_SEO_KEYWORDS, rankingJsonLd } from "@/lib/seo";
import { useRanking } from "@/data/mockData";
import { navRoutes } from "@/config/navIcons";

const getRankStyle = (rank: number) => {
  if (rank === 1) return { icon: Crown, bg: "bg-accent text-accent-foreground", glow: "glow-accent border-accent/30" };
  if (rank === 2) return { icon: Trophy, bg: "bg-secondary text-secondary-foreground", glow: "" };
  if (rank === 3) return { icon: Medal, bg: "bg-secondary text-secondary-foreground", glow: "" };
  return { icon: null, bg: "bg-secondary text-secondary-foreground", glow: "" };
};

const Ranking = () => {
  const [period, setPeriod] = useState<"weekly" | "monthly">("weekly");
  const data = useRanking(period);
  const periodLabel = period === "weekly" ? "주간" : "월간";

  return (
    <PageTransition>
    <Seo
      title={`PINCH 랭킹 — ${period === "weekly" ? "이번 주" : "이번 달"}의 똑똑이`}
      description={`PINCH에서 ${periodLabel} 기준 가장 공감받은 PINCH을 남긴 유저 랭킹을 확인하세요.`}
      path="/ranking"
      keywords={RANKING_SEO_KEYWORDS}
      jsonLd={rankingJsonLd(data, periodLabel)}
    />
    <div className="min-h-screen bg-background pb-24">
      <div className="page-sticky-header">
        <div className="container flex h-14 items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <p className="flex-1 text-sm font-bold">똑똑이 랭킹</p>
          <ThemeToggle />
        </div>
      </div>

      <motion.div
        className="page-list"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        <div className="mb-6">
          {(() => {
            const RankingIcon = navRoutes.ranking.icon;
            return (
              <h1 className="page-heading flex items-center gap-2">
                <RankingIcon className="h-7 w-7 text-accent" aria-hidden="true" /> {navRoutes.ranking.label}
              </h1>
            );
          })()}
          <p className="mt-1 text-sm text-muted-foreground">가장 많은 공감을 받은 의견 작성자</p>
        </div>

        {/* Period Toggle */}
        <div className="mb-6 flex gap-1 rounded-xl bg-secondary p-1">
          {[
            { key: "weekly" as const, label: "이번 주" },
            { key: "monthly" as const, label: "이번 달" },
          ].map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setPeriod(key)}
              className={`relative flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                period === key
                  ? "text-accent-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {period === key && (
                <motion.div
                  className="absolute inset-0 rounded-lg bg-accent shadow-sm"
                  layoutId="period-indicator"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative z-10">{label}</span>
            </button>
          ))}
        </div>
        <AnimatePresence mode="wait">
          <motion.div
            key={period}
            className="grid grid-cols-1 gap-3 md:grid-cols-2 md:gap-4"
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.15 }}
          >
            {data.map((user, idx) => {
              const style = getRankStyle(user.rank);
              return (
                <motion.div
                  key={user.username}
                  className={`glass noise rounded-2xl p-4 transition-all ${style.glow}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.03, duration: 0.2 }}
                >
                  <div className="flex items-center gap-3">
                    <span className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-black ${style.bg}`}>
                      {user.rank}
                    </span>
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-secondary text-sm font-bold">
                      {user.username.charAt(0)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="truncate font-bold">{user.username}</p>
                      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Trophy className="h-3 w-3 text-accent" aria-hidden="true" /> {user.wins}회 선정 · <Heart className="h-3 w-3 text-rose-400" aria-hidden="true" /> {user.totalLikes}
                      </p>
                    </div>
                    {style.icon && (
                      <style.icon className={`h-5 w-5 shrink-0 ${user.rank === 1 ? "text-accent" : "text-muted-foreground"}`} />
                    )}
                  </div>
                </motion.div>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Ad Banner */}
        <ResponsiveAdFitBanner
          mobileSlot={adfitSlots.rankingBottom}
          wideSlot={adfitSlots.listWide}
          className="w-full mt-6"
        />
      </motion.div>

      <BottomNav />
    </div>
    </PageTransition>
  );
};

export default Ranking;
