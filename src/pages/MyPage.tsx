import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ArrowLeft,
  Settings,
  LogOut,
  Heart,
  MessageSquare,
  Flame,
  Trophy,
  Award,
  TrendingUp,
  Calendar,
  Sparkles,
} from "lucide-react";
import BottomNav from "@/components/BottomNav";
import PageTransition from "@/components/PageTransition";
import ThemeToggle from "@/components/ThemeToggle";
import Seo from "@/components/Seo";
import {
  myProfile,
  myStats,
  myComments,
  activityHeatmap,
} from "@/data/myPageData";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/components/ui/use-toast";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const },
  },
};

const StatCard = ({
  icon: Icon,
  label,
  value,
  suffix,
  highlight,
  hint,
}: {
  icon: typeof Heart;
  label: string;
  value: string | number;
  suffix?: string;
  highlight?: boolean;
  /** Short clarifying caption shown under the label and as a native tooltip. */
  hint?: string;
}) => (
  <motion.div
    variants={item}
    title={hint}
    className={`relative overflow-hidden rounded-2xl border p-4 ${
      highlight
        ? "border-accent/30 bg-accent/5"
        : "border-border bg-card"
    }`}
  >
    {highlight && (
      <div className="pointer-events-none absolute -top-8 -right-8 h-20 w-20 rounded-full bg-accent/20 blur-2xl" />
    )}
    <div className="relative flex flex-col gap-2">
      <Icon className={`h-4 w-4 ${highlight ? "text-accent" : "text-muted-foreground"}`} />
      <div className="flex items-baseline gap-1">
        <span className={`text-2xl font-black ${highlight ? "text-accent" : "text-foreground"}`}>
          {value}
        </span>
        {suffix && (
          <span className="text-xs font-semibold text-muted-foreground">{suffix}</span>
        )}
      </div>
      <span className="text-[11px] font-medium text-muted-foreground">{label}</span>
      {hint && (
        <span className="text-[10px] leading-snug text-muted-foreground/70">{hint}</span>
      )}
    </div>
  </motion.div>
);

const MyPage = () => {
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleLogout = () => {
    logout();
    toast({ title: "로그아웃되었습니다", description: "다음에 또 만나요." });
    navigate("/", { replace: true });
  };

  return (
    <PageTransition>
      <Seo title="마이페이지 — PICKS" description="내 PICK과 받은 좋아요, 활동 기록을 확인하세요." path="/mypage" noindex />
      <div className="min-h-screen bg-background pb-24">
        {/* Header */}
        <div className="page-sticky-header">
          <div className="container flex h-14 items-center gap-3">
            <Link
              to="/"
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <p className="flex-1 text-sm font-bold">마이페이지</p>
            <Link
              to="/settings"
              className="text-muted-foreground hover:text-foreground transition-colors"
              aria-label="설정"
            >
              <Settings className="h-4 w-4" />
            </Link>
            <ThemeToggle />
          </div>
        </div>

        <motion.div
          className="container py-6 space-y-6"
          variants={container}
          initial="hidden"
          animate="show"
        >
          {/* Profile Card */}
          <motion.section
            variants={item}
            className="relative overflow-hidden rounded-3xl border border-accent/20 bg-card p-5"
          >
            <div className="pointer-events-none absolute -top-16 -right-16 h-40 w-40 rounded-full bg-accent/20 blur-3xl" />
            <div className="pointer-events-none absolute -bottom-20 -left-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

            <div className="relative flex items-start gap-4">
              {/* Avatar */}
              <div className="relative shrink-0">
                <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-accent to-accent/60 text-2xl font-black text-accent-foreground">
                  {myProfile.avatar}
                </div>
                <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full bg-background border-2 border-accent">
                  <Trophy className="h-3 w-3 text-accent" />
                </div>
              </div>

              <div className="flex-1 min-w-0 space-y-1">
                <div className="flex items-center gap-2">
                  <h2 className="text-lg font-black truncate">
                    {myProfile.username}
                  </h2>
                  <span className="shrink-0 rounded-full bg-accent/15 border border-accent/30 px-2 py-0.5 text-[10px] font-bold text-accent">
                    #{myProfile.rank}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground truncate">
                  {myProfile.email}
                </p>
                <p className="text-[11px] text-muted-foreground/80 flex items-center gap-1">
                  <Calendar className="h-3 w-3" />
                  {myProfile.joinedAt} 가입
                </p>
              </div>
            </div>

            <p className="relative mt-4 text-sm leading-relaxed text-foreground/90">
              {myProfile.bio}
            </p>

            {/* Badges */}
            <div className="relative mt-4 flex flex-wrap gap-1.5">
              {myProfile.badges.map((b) => (
                <span
                  key={b.label}
                  className="inline-flex items-center gap-1 rounded-full border border-accent/30 bg-accent/10 px-2.5 py-1 text-[10px] font-semibold text-accent"
                >
                  <Sparkles className="h-2.5 w-2.5" />
                  {b.label}
                </span>
              ))}
            </div>
          </motion.section>

          {/* Stats Grid */}
          <section>
            <div className="mb-3 flex items-center justify-between">
              <h3 className="text-sm font-black flex items-center gap-1.5">
                <TrendingUp className="h-4 w-4 text-accent" />
                활동 통계
              </h3>
              <span className="text-[10px] font-medium text-muted-foreground">
                전체 기간
              </span>
            </div>

            <motion.div
              className="grid grid-cols-3 gap-2"
              variants={container}
            >
              <StatCard
                icon={MessageSquare}
                label="총 PICK"
                value={myStats.totalPicks}
                suffix="개"
                hint="내가 남긴 PICK 누계 (예: 47일 참여 = 47개)"
              />
              <StatCard
                icon={Heart}
                label="받은 좋아요"
                value={myStats.totalLikes.toLocaleString()}
                highlight
                hint="내 PICK이 받은 ❤️ 총합"
              />
              <StatCard
                icon={Award}
                label="오늘의 PICK 선정"
                value={myStats.bestPickCount}
                suffix="회"
                hint="하루 1개로 뽑힌 횟수 (예: 5회 = 5일 우승)"
              />
              <StatCard
                icon={Flame}
                label="연속 참여"
                value={myStats.streak}
                suffix="일"
                highlight
                hint="끊김 없이 PICK을 남긴 일수"
              />
              <StatCard
                icon={TrendingUp}
                label="평균 좋아요"
                value={myStats.avgLikes}
                hint="PICK 1개당 평균 ❤️ 수"
              />
              <StatCard
                icon={Trophy}
                label="참여율"
                value={myStats.participationRate}
                suffix="%"
                hint="가입 후 가능 일수 대비 PICK을 남긴 비율"
              />
            </motion.div>
          </section>

          {/* Activity Heatmap */}
          <motion.section variants={item} className="space-y-3">
            <h3 className="text-sm font-black flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-accent" />
              최근 5주 활동
            </h3>
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="grid grid-cols-7 gap-1.5">
                {activityHeatmap.map((d) => (
                  <div
                    key={d.day}
                    className={`aspect-square rounded-md transition-colors ${
                      d.level === 0
                        ? "bg-secondary"
                        : d.level === 1
                          ? "bg-accent/25"
                          : d.level === 2
                            ? "bg-accent/55"
                            : "bg-accent"
                    }`}
                    title={`Day ${d.day + 1}`}
                  />
                ))}
              </div>
              <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-muted-foreground">
                <span>적음</span>
                <div className="h-2 w-2 rounded-sm bg-secondary" />
                <div className="h-2 w-2 rounded-sm bg-accent/25" />
                <div className="h-2 w-2 rounded-sm bg-accent/55" />
                <div className="h-2 w-2 rounded-sm bg-accent" />
                <span>많음</span>
              </div>
            </div>
          </motion.section>

          {/* My Comments */}
          <section className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-black flex items-center gap-1.5">
                <MessageSquare className="h-4 w-4 text-accent" />내 PICK
              </h3>
              <span className="text-[10px] font-medium text-muted-foreground">
                {myComments.length}개
              </span>
            </div>

            <motion.div className="space-y-2.5" variants={container}>
              {myComments.map((c) => (
                <motion.article
                  key={c.id}
                  variants={item}
                  className={`relative rounded-2xl border p-4 transition-all ${
                    c.isBest
                      ? "border-accent/40 bg-accent/5"
                      : "border-border bg-card"
                  }`}
                >
                  {c.isBest && (
                    <div className="absolute -top-2 left-3 inline-flex items-center gap-1 rounded-full bg-accent px-2 py-0.5 text-[9px] font-black text-accent-foreground">
                      <Trophy className="h-2.5 w-2.5" />
                      BEST
                    </div>
                  )}

                  <div className="flex items-center justify-between gap-2 mb-1.5">
                    <span className="text-[10px] font-semibold text-muted-foreground">
                      {c.date}
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-accent">
                      <Heart className="h-3 w-3 fill-current" />
                      {c.likes}
                    </span>
                  </div>

                  <p className="text-[11px] font-semibold text-foreground/70 truncate mb-2">
                    {c.topic}
                  </p>
                  <p className="text-sm leading-relaxed text-foreground/95">
                    {c.text}
                  </p>
                </motion.article>
              ))}
            </motion.div>
          </section>

          {/* Logout */}
          <motion.button
            variants={item}
            type="button"
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 rounded-xl border border-border py-3 text-sm font-semibold text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all"
            whileTap={{ scale: 0.98 }}
          >
            <LogOut className="h-4 w-4" />
            로그아웃
          </motion.button>
        </motion.div>

        <BottomNav />
      </div>
    </PageTransition>
  );
};

export default MyPage;
