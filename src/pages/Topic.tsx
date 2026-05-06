import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, ExternalLink, Clock, MessageCircle, Send, Heart, Crown, LogIn, Lock, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import AdFitBanner from "@/components/AdFitBanner";
import PageTransition from "@/components/PageTransition";
import ThemeToggle from "@/components/ThemeToggle";
import Seo from "@/components/Seo";
import HeartBurst from "@/components/topic/HeartBurst";
import { toast } from "sonner";
import {
  todayPicks as initialPicks,
  categories,
  useTodayTopic,
  useMergedTopics,
  findTopicById,
  getMergedTopicsByCategory,
  getTopicDeadline,
  isTopicClosed,
  formatRemaining,
  formatRemainingClock,
  getKstDayStamp,
  type CategoryId,
  type TodayTopic,
} from "@/data/mockData";
import { useAuth } from "@/hooks/useAuth";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

// Per-day storage key — anchored to KST so the lock rolls over at 00:00
// Asia/Seoul regardless of the viewer's local timezone (a user in NYC and a
// user in Seoul share the same daily slot).
const todayKey = () => `hanmadi:commented:${getKstDayStamp()}`;

const notifyAlreadyPicked = () =>
  toast("오늘은 PICK을 이미 남겼어요", {
    description: "내일 새로운 주제로 다시 만나요 ✍️",
  });

const notifyClosed = () =>
  toast("이 토픽은 마감되었어요", {
    description: "오늘의 토픽은 자정에 종료됩니다. 내일 새로운 주제로 만나요 ⏰",
  });

const Topic = () => {
  const [picks, setPicks] = useState(initialPicks);
  const [hasPicked, setHasCommented] = useState(false);
  const submittingRef = useRef(false);
  const [text, setText] = useState("");
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [burstId, setBurstId] = useState<string | null>(null);
  const [bumpId, setBumpId] = useState<string | null>(null);
  const [newPickId, setNewCommentId] = useState<string | null>(null);
  const picksRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Resolve active topic from URL query: ?topic=<id> takes priority,
  // then ?category=<catId> picks the hottest topic in that category,
  // otherwise we fall back to the global hottest topic of the day.
  const topicParam = searchParams.get("topic");
  const categoryParam = searchParams.get("category") as CategoryId | null;
  // Subscribe to admin changes so the page reflects new/edited topics live.
  const liveTodayTopic = useTodayTopic();
  const allTopics = useMergedTopics();
  const todayTopic = useMemo<TodayTopic>(() => {
    if (topicParam) {
      const found = findTopicById(topicParam);
      if (found) return found;
    }
    if (categoryParam) {
      const list = getMergedTopicsByCategory(categoryParam);
      if (list.length > 0) return list[0];
    }
    return liveTodayTopic;
    // allTopics dep ensures recompute after admin add/edit/delete
  }, [topicParam, categoryParam, liveTodayTopic, allTopics]);

  // Active category — used to keep the filter state across the journey.
  const activeCategory = todayTopic.category;
  const categoryMeta = categories.find((c) => c.id === activeCategory);
  // Note: there is exactly one topic per category per day, so we don't show
  // a "other topics in this category" list here anymore.

  // Helper to build a link that preserves the active category context.
  const withCategory = (path: string) => `${path}?category=${activeCategory}`;

  // Live countdown — recompute the deadline whenever the active topic changes,
  // and tick every second so the header time and "closed" state stay accurate
  // without a page reload.
  const deadline = useMemo(() => getTopicDeadline(todayTopic), [todayTopic.id]);
  const [now, setNow] = useState<Date>(() => new Date());
  useEffect(() => {
    const id = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(id);
  }, []);
  const closed = isTopicClosed(todayTopic, now);
  const remainingLabel = formatRemaining(deadline, now);

  // Day-change detector — when the local date rolls over (e.g. crossing
  // midnight while the page is open), re-read the per-day "already commented"
  // flag so the submission lock automatically releases for the new day.
  const dayStamp = getKstDayStamp(now);
  useEffect(() => {
    try {
      setHasCommented(localStorage.getItem(todayKey()) === "1");
    } catch {
      // ignore storage access errors
    }
  }, [dayStamp]);

  // Cross-tab sync — if another tab/window submits today's pick, lock this
  // tab immediately via the `storage` event so the 1-per-day rule holds even
  // with simultaneous submissions across multiple tabs/browsers on the same
  // origin+profile.
  useEffect(() => {
    const onStorage = (e: StorageEvent) => {
      if (e.key === todayKey() && e.newValue === "1") {
        setHasCommented(true);
      }
    };
    window.addEventListener("storage", onStorage);
    return () => window.removeEventListener("storage", onStorage);
  }, []);

  // Countdown to KST midnight — shared with the topic deadline so the lock
  // card and the header timer both flip at exactly the same instant
  // (00:00 Asia/Seoul), regardless of the viewer's local timezone.
  const nextMidnight = useMemo(() => getTopicDeadline(todayTopic), [dayStamp, todayTopic.id]);
  const nextWriteLabel = formatRemaining(nextMidnight, now);
  const nextWriteClock = formatRemainingClock(nextMidnight, now);

  const charPct = text.length / 500;
  const charColor =
    charPct >= 1
      ? "text-destructive"
      : charPct >= 0.8
      ? "text-accent"
      : "text-muted-foreground";

  const handleTextareaFocus = () => {
    if (closed) {
      notifyClosed();
      return;
    }
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (hasPicked) {
      notifyAlreadyPicked();
    }
  };

  const handleSubmit = () => {
    if (closed) {
      notifyClosed();
      return;
    }
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    if (hasPicked) {
      notifyAlreadyPicked();
      return;
    }
    if (!text.trim()) return;
    if (submittingRef.current) return;
    submittingRef.current = true;

    // Cross-tab atomic claim — re-check storage right before writing so a
    // concurrent submission from another tab wins exactly once. The first
    // write sets the flag; later writes here see it and bail out.
    try {
      if (localStorage.getItem(todayKey()) === "1") {
        setHasCommented(true);
        submittingRef.current = false;
        notifyAlreadyPicked();
        return;
      }
      localStorage.setItem(todayKey(), "1");
    } catch {
      // ignore storage access errors
    }

    const id = String(Date.now());
    setPicks([
      { id, username: user?.username || "나", text: text.trim(), likes: 0, isLiked: false },
      ...picks,
    ]);
    setText("");
    setHasCommented(true);
    setNewCommentId(id);
    toast.success("의견이 등록되었어요", {
      description: "오늘의 PICK 후보에 올랐습니다 ✨",
    });
    requestAnimationFrame(() => {
      picksRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
    window.setTimeout(() => setNewCommentId(null), 1800);
    submittingRef.current = false;
  };

  const goToLogin = () => {
    setShowLoginModal(false);
    navigate("/auth", { state: { from: "/topic" } });
  };

  const handleLike = (id: string) => {
    if (closed) {
      notifyClosed();
      return;
    }
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    const target = picks.find((c) => c.id === id);
    const willLike = target ? !target.isLiked : false;
    setPicks(
      picks.map((c) =>
        c.id === id
          ? { ...c, likes: c.isLiked ? c.likes - 1 : c.likes + 1, isLiked: !c.isLiked }
          : c
      )
    );
    setBumpId(id);
    window.setTimeout(() => setBumpId((cur) => (cur === id ? null : cur)), 250);
    if (willLike) {
      setBurstId(id);
      window.setTimeout(() => setBurstId((cur) => (cur === id ? null : cur)), 600);
      if (typeof navigator !== "undefined" && "vibrate" in navigator) {
        try {
          navigator.vibrate?.(8);
        } catch {
          // ignore
        }
      }
    }
  };

  const sorted = [...picks].sort((a, b) => b.likes - a.likes);

  return (
    <PageTransition>
    <Seo
      title={`${todayTopic.title} — 오늘의 PICK | PICKS`}
      description={`${todayTopic.title} — PICKS에서 오늘의 핫토픽에 PICK을 남기고 가장 공감받은 의견을 확인하세요.`}
      path="/topic"
    />
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="page-sticky-header">
        <div className="container flex h-14 items-center gap-3">
          <Link
            to={`/?category=${activeCategory}`}
            aria-label="홈으로 (카테고리 유지)"
            className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <div className="flex-1 min-w-0 flex items-center gap-2">
            {categoryMeta && (
              <span className={`shrink-0 inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 text-[10px] font-bold ${categoryMeta.accent}`}>
                {categoryMeta.emoji} {categoryMeta.label}
              </span>
            )}
            <p className="truncate text-sm font-bold">오늘의 주제</p>
          </div>
          <div className="flex items-center gap-3">
            <div
              className={`flex items-center gap-1.5 text-xs tabular-nums ${
                closed ? "text-destructive font-bold" : "text-muted-foreground"
              }`}
              aria-live="polite"
            >
              <Clock className={`h-3.5 w-3.5 ${closed ? "text-destructive" : "text-accent"}`} />
              {closed ? "마감" : remainingLabel}
            </div>
            <ThemeToggle />
          </div>
        </div>
      </div>

      <motion.div
        className="page-reading space-y-6"
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
      >
        {/* Topic */}
        <div className="space-y-3">
          {categoryMeta && (
            <Link
              to={`/?category=${activeCategory}`}
              className={`inline-flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold transition-colors hover:bg-secondary/70 ${categoryMeta.accent}`}
            >
              <span>{categoryMeta.emoji}</span> {categoryMeta.label}
            </Link>
          )}
          <h1 className="text-2xl font-black leading-tight md:text-3xl">
            {todayTopic.title}
          </h1>
          <p className="text-sm leading-relaxed text-muted-foreground">
            {todayTopic.description}
          </p>
          <a
            href={todayTopic.newsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-secondary px-3 py-1.5 text-xs font-medium text-secondary-foreground transition-colors hover:bg-secondary/80"
          >
            <ExternalLink className="h-3 w-3" />
            {todayTopic.newsSource} 기사 보기
          </a>
        </div>

        <div className="h-px bg-border" />

        {/* PICK Input */}
        <AnimatePresence mode="wait">
          {closed ? (
            <motion.div
              key="closed"
              className="glass rounded-2xl p-5 text-center border border-destructive/30"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <p className="text-sm font-bold text-destructive">⏰ 이 토픽은 마감되었습니다</p>
              <p className="mt-1 text-xs text-muted-foreground">
                오늘의 토픽은 매일 자정에 종료됩니다. 내일 새로운 주제로 다시 만나요.
              </p>
            </motion.div>
          ) : hasPicked ? (
            <motion.div
              key="submitted"
              className="space-y-3"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            >
              <div className="glass rounded-2xl p-4 border border-accent/30 flex items-start gap-3">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-accent/15 text-accent">
                  <Lock className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold">오늘의 의견을 이미 남기셨습니다 ✅</p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    하루에 한 번만 PICK을 남길 수 있어요. 자정({" "}
                    <span className="font-bold text-accent tabular-nums" aria-live="polite">
                      {nextWriteClock}
                    </span>{" "}
                    뒤) 새 주제로 다시 만나요.
                  </p>
                  <p className="mt-2 text-[11px] text-muted-foreground/80">
                    남은 시간: <span className="tabular-nums">{nextWriteLabel}</span>
                  </p>
                </div>
              </div>
              <textarea
                value=""
                disabled
                aria-disabled="true"
                placeholder="내일 자정에 새 주제가 열립니다"
                className="min-h-[96px] w-full resize-none rounded-2xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-muted-foreground placeholder:text-muted-foreground/70 cursor-not-allowed opacity-70"
              />
              <div className="flex items-center justify-between">
                <span
                  className="text-xs font-medium text-muted-foreground tabular-nums"
                  aria-live="polite"
                >
                  잠금 해제까지 {nextWriteClock}
                </span>
                <button
                  type="button"
                  disabled
                  aria-disabled="true"
                  className="flex items-center gap-2 rounded-full bg-secondary px-5 py-2.5 text-sm font-bold text-muted-foreground opacity-60 cursor-not-allowed"
                >
                  <Lock className="h-3.5 w-3.5" />
                  내일 다시 참여
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="input"
              className="space-y-3"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.15 }}
            >
              <textarea
                value={text}
                onChange={(e) => setText(e.target.value)}
                onFocus={handleTextareaFocus}
                readOnly={!isAuthenticated}
                placeholder={isAuthenticated ? "이 주제에 대한 당신의 생각은?" : "로그인 후 의견을 남길 수 있습니다"}
                className={`min-h-[120px] w-full resize-none rounded-2xl border border-border bg-card p-4 text-sm leading-relaxed placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all ${
                  !isAuthenticated ? "cursor-pointer" : ""
                }`}
                maxLength={500}
              />
              <div className="flex items-center justify-between">
                <span className={`text-xs font-medium tabular-nums transition-colors ${charColor}`}>
                  {text.length}/500
                </span>
                <motion.button
                  onClick={handleSubmit}
                  disabled={isAuthenticated && !text.trim()}
                  className="flex items-center gap-2 rounded-full bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground transition-all hover:bg-accent/90 disabled:opacity-40 disabled:cursor-not-allowed glow-accent"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {isAuthenticated ? (
                    <>
                      <Send className="h-3.5 w-3.5" />
                      의견 남기기
                    </>
                  ) : (
                    <>
                      <Lock className="h-3.5 w-3.5" />
                      로그인하고 참여
                    </>
                  )}
                </motion.button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="h-px bg-border" />

        {/* Ad Banner */}
        <AdFitBanner className="w-full" />

        {/* Comments */}
        <div ref={picksRef}>
          <div className="mb-4 flex items-center gap-2">
            <MessageCircle className="h-4 w-4 text-accent" />
            <h2 className="text-sm font-bold">
              의견 <span className="text-muted-foreground font-normal">{picks.length}개</span>
            </h2>
          </div>

          <div className="space-y-3">
            {sorted.map((pick, idx) => {
              const isNew = pick.id === newPickId;
              return (
              <motion.div
                key={pick.id}
                className={`glass rounded-xl p-4 transition-all ${
                  idx === 0 && pick.likes > 0 ? "border border-accent/30 glow-accent" : ""
                } ${isNew ? "ring-2 ring-accent/60" : ""}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.03, duration: 0.2 }}
                layout
              >
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex h-5 w-5 items-center justify-center rounded-full bg-secondary text-[10px] font-bold text-secondary-foreground">
                    {idx + 1}
                  </span>
                  <div className="flex h-7 w-7 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                    {pick.username.charAt(0)}
                  </div>
                  <span className="text-sm font-semibold">{pick.username}</span>
                  {isNew && (
                    <motion.span
                      className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <Sparkles className="h-3 w-3" /> 방금
                    </motion.span>
                  )}
                  {idx === 0 && pick.likes > 0 && (
                    <motion.span
                      className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent"
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 500, damping: 20 }}
                    >
                      <Crown className="h-3 w-3" /> 1위
                    </motion.span>
                  )}
                </div>
                <p className="mb-3 text-sm leading-relaxed text-foreground/80">{pick.text}</p>
                <div className="relative inline-block">
                  <HeartBurst show={burstId === pick.id} />
                  <motion.button
                    onClick={() => handleLike(pick.id)}
                    aria-pressed={pick.isLiked}
                    aria-label={`${pick.username}님 의견 좋아요 ${pick.likes}개`}
                    className={`relative flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-medium transition-all ${
                      pick.isLiked
                        ? "bg-accent/15 text-accent"
                        : "bg-secondary text-muted-foreground hover:text-accent hover:bg-accent/10"
                    }`}
                    whileTap={{ scale: 1.3 }}
                    transition={{ type: "spring", stiffness: 500, damping: 15 }}
                  >
                    <motion.span
                      animate={
                        pick.isLiked
                          ? { scale: [1, 1.4, 1], rotate: [0, -12, 0] }
                          : { scale: 1, rotate: 0 }
                      }
                      transition={{ duration: 0.35 }}
                      className="inline-flex"
                    >
                      <Heart className={`h-3 w-3 ${pick.isLiked ? "fill-current" : ""}`} />
                    </motion.span>
                    <motion.span
                      key={pick.likes}
                      initial={{ y: bumpId === pick.id ? -6 : 0, opacity: bumpId === pick.id ? 0 : 1 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ duration: 0.18 }}
                      className="tabular-nums"
                    >
                      {pick.likes}
                    </motion.span>
                  </motion.button>
                </div>
              </motion.div>
            );})}
          </div>
        </div>

      </motion.div>

      <BottomNav />

      <Dialog open={showLoginModal} onOpenChange={setShowLoginModal}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full bg-accent/15">
              <Lock className="h-6 w-6 text-accent" />
            </div>
            <DialogTitle className="text-center">로그인이 필요합니다</DialogTitle>
            <DialogDescription className="text-center">
              의견을 남기거나 좋아요를 누르려면 먼저 로그인해주세요.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="flex-col gap-2 sm:flex-col sm:space-x-0">
            <motion.button
              onClick={goToLogin}
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground transition-all hover:bg-accent/90 glow-accent"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <LogIn className="h-4 w-4" />
              로그인 / 회원가입
            </motion.button>
            <button
              onClick={() => setShowLoginModal(false)}
              className="w-full rounded-xl py-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
            >
              나중에 하기
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
    </PageTransition>
  );
};

export default Topic;
