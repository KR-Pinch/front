import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowRight, Clock, MessageCircle, Archive, Trophy, Flame, LogIn, User, Settings, LogOut, ChevronDown, Brain, Heart } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import FirstVisitOnboarding from "@/components/onboarding/FirstVisitOnboarding";
import AdFitBanner, { ResponsiveAdFitBanner } from "@/components/AdFitBanner";
import PageTransition from "@/components/PageTransition";
import ParticleField from "@/components/ParticleField";
import ThemeToggle from "@/components/ThemeToggle";
import Seo from "@/components/Seo";
import { adfitSlots } from "@/config/adfit";
import { homeJsonLd } from "@/lib/seo";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "@/components/ui/use-toast";
import { useAuth } from "@/hooks/useAuth";
import {
  categories,
  hotCategoryChip,
  useTodayTopic,
  useMergedTopics,
  getMergedTopicsByCategory,
  useRanking,
  type CategoryId,
  type TodayTopic,
} from "@/data/mockData";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.05 } },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] as const } },
};

const Index = () => {
  const { user, isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const [searchParams, setSearchParams] = useSearchParams();
  const focusCategory = searchParams.get("category");

  // "all" = 글로벌 HOT, otherwise = 해당 카테고리 HOT
  const [activeCat, setActiveCat] = useState<string>(focusCategory ?? "all");
  const weeklyRanking = useRanking("weekly");
  const [highlight, setHighlight] = useState(false);
  const highlightTimer = useRef<number | null>(null);

  // ===== 자동 스크롤 / 하이라이트 단일화 =====
  const isAutoScrolling = useRef(false);
  const autoScrollEndTimer = useRef<number | null>(null);
  const userInterruptedRef = useRef(false);
  // 진행 중인 모든 지연 타이머(스크롤 큐, 하이라이트 지연 등) 추적
  const pendingTimers = useRef<Set<number>>(new Set());
  // 마지막으로 동기화(스크롤+하이라이트)를 수행한 카테고리 — 동일 값 중복 트리거 방지
  const lastSyncedCat = useRef<string | null>(focusCategory ?? "all");
  // popstate(뒤로/앞으로) 직후의 URL 변경임을 표시 — 1회 한정 동기화 강제
  const popNavRef = useRef(false);
  // 동기화가 진행 중인 동안 다른 트리거를 1회로 제한
  const isSyncingRef = useRef(false);

  // popstate 감지: 뒤로/앞으로 이동 시 다음 focusCategory 변화는 1회 동기화 대상
  useEffect(() => {
    const onPop = () => {
      popNavRef.current = true;
      // 뒤로가기는 명시적 사용자 의도 → 자동 스크롤/하이라이트 허용
      userInterruptedRef.current = false;
    };
    window.addEventListener("popstate", onPop);
    return () => window.removeEventListener("popstate", onPop);
  }, []);

  const clearPendingTimers = () => {
    pendingTimers.current.forEach((id) => window.clearTimeout(id));
    pendingTimers.current.clear();
  };

  const queueTimer = (fn: () => void, ms: number) => {
    const id = window.setTimeout(() => {
      pendingTimers.current.delete(id);
      fn();
    }, ms);
    pendingTimers.current.add(id);
    return id;
  };

  // 하이라이트가 이미 재생 중이면 새 트리거를 무시(coalesce)하여 깜빡임/중첩 방지
  const triggerHighlight = () => {
    if (highlight || highlightTimer.current) {
      // 이미 진행 중 → 합치고 무시
      return;
    }
    setHighlight(true);
    highlightTimer.current = window.setTimeout(() => {
      setHighlight(false);
      highlightTimer.current = null;
    }, 1500);
  };

  // 사용자 입력(휠/터치/키)으로 인한 스크롤 발생 시 자동 스크롤 + 후속 큐 전체 취소
  useEffect(() => {
    const onUserScroll = () => {
      if (!isAutoScrolling.current && pendingTimers.current.size === 0) return;
      userInterruptedRef.current = true;
      isAutoScrolling.current = false;
      if (autoScrollEndTimer.current) {
        window.clearTimeout(autoScrollEndTimer.current);
        autoScrollEndTimer.current = null;
      }
      clearPendingTimers();
    };
    const opts: AddEventListenerOptions = { passive: true };
    window.addEventListener("wheel", onUserScroll, opts);
    window.addEventListener("touchmove", onUserScroll, opts);
    window.addEventListener("keydown", onUserScroll);
    return () => {
      window.removeEventListener("wheel", onUserScroll);
      window.removeEventListener("touchmove", onUserScroll);
      window.removeEventListener("keydown", onUserScroll);
    };
  }, []);

  // 언마운트 시 모든 타이머 정리
  useEffect(() => {
    return () => {
      if (highlightTimer.current) window.clearTimeout(highlightTimer.current);
      if (autoScrollEndTimer.current) window.clearTimeout(autoScrollEndTimer.current);
      clearPendingTimers();
    };
  }, []);

  const scrollToHotCard = (behavior: ScrollBehavior = "smooth") => {
    if (isAutoScrolling.current) return;

    const el = document.getElementById("hot-topic-card");
    if (!el) return;

    const topbar = document.querySelector<HTMLElement>("[data-topbar]");
    const safeTop = parseFloat(
      getComputedStyle(document.documentElement).getPropertyValue("--sat") || "0"
    ) || 0;

    let headerOffset = 64;
    if (topbar) {
      headerOffset = Math.max(0, topbar.getBoundingClientRect().bottom) + 12;
    } else {
      const envTop =
        Number(
          getComputedStyle(document.documentElement)
            .getPropertyValue("padding-top")
            .replace("px", "")
        ) || 0;
      headerOffset = 64 + Math.max(envTop, safeTop);
    }

    const y = el.getBoundingClientRect().top + window.scrollY - headerOffset;
    userInterruptedRef.current = false;
    isAutoScrolling.current = true;
    window.scrollTo({ top: Math.max(0, y), behavior });

    if (autoScrollEndTimer.current) window.clearTimeout(autoScrollEndTimer.current);
    autoScrollEndTimer.current = window.setTimeout(() => {
      isAutoScrolling.current = false;
      autoScrollEndTimer.current = null;
    }, behavior === "smooth" ? 700 : 50);
  };

  // 단일 진입점: 스크롤 + 하이라이트 시퀀스 (delay 조절 가능)
  const runFocusFlow = (initialDelay = 120, highlightDelay = 380) => {
    // 이전에 큐된 동일 시퀀스가 있으면 모두 취소
    clearPendingTimers();
    queueTimer(() => {
      scrollToHotCard("smooth");
      queueTimer(() => {
        if (!userInterruptedRef.current) triggerHighlight();
      }, highlightDelay);
    }, initialDelay);
  };

  // 칩 클릭으로 인한 URL 변경은 effect의 자동 트리거를 한 번 스킵
  const skipNextFocusScroll = useRef(false);

  // ===== URL ?category ↔ activeCat ↔ 하이라이트 단일 동기화 =====
  // focusCategory가 바뀔 때마다 정확히 1회만:
  //  1) activeCat 동기화
  //  2) (필요 시) 자동 스크롤 + 하이라이트 시퀀스 트리거
  useEffect(() => {
    const target = focusCategory ?? "all";

    // (1) state 동기화는 항상 수행 (idempotent)
    setActiveCat((prev) => (prev === target ? prev : target));

    // (2) 동일 카테고리에 대한 중복 동기화 방지
    if (lastSyncedCat.current === target && !popNavRef.current) {
      // popstate가 아닌 단순 리렌더면 스킵
      return;
    }

    // (3) 칩 클릭이 만든 URL 변경은 effect 측 자동 트리거를 1회 건너뛴다
    if (skipNextFocusScroll.current) {
      skipNextFocusScroll.current = false;
      lastSyncedCat.current = target;
      popNavRef.current = false;
      return;
    }

    // (4) "all" 상태로 복원되면 트리거 없이 마커만 갱신
    if (target === "all") {
      lastSyncedCat.current = "all";
      popNavRef.current = false;
      return;
    }

    // (5) 이미 동기화 시퀀스가 진행 중이면 합치고 무시
    if (isSyncingRef.current) {
      lastSyncedCat.current = target;
      popNavRef.current = false;
      return;
    }

    isSyncingRef.current = true;
    lastSyncedCat.current = target;
    popNavRef.current = false;

    runFocusFlow(120, 380);

    // 시퀀스 종료 후 잠금 해제 (스크롤 700ms + 하이라이트 1500ms 여유)
    queueTimer(() => {
      isSyncingRef.current = false;
    }, 900);

    return () => clearPendingTimers();
  }, [focusCategory]);

  const handleSelectCat = (catId: string) => {
    // 동일 카테고리 재선택은 무시 (중복 동기화 방지)
    if (activeCat === catId && (focusCategory ?? "all") === catId) return;

    setActiveCat(catId);
    const next = new URLSearchParams(searchParams);
    if (catId === "all") next.delete("category");
    else next.set("category", catId);

    // 칩 클릭은 즉시 흐름 시작하므로 effect 측은 1회 스킵
    skipNextFocusScroll.current = catId !== "all";
    lastSyncedCat.current = catId;
    popNavRef.current = false;

    setSearchParams(next, { replace: true });

    if (catId !== "all") {
      // 진행 중 시퀀스가 있다면 합치고 새로 시작
      isSyncingRef.current = true;
      requestAnimationFrame(() => runFocusFlow(0, 320));
      queueTimer(() => {
        isSyncingRef.current = false;
      }, 900);
    }
  };

  // Live admin-aware "today" topic — re-renders when admin pushes/changes one.
  const todayTopic = useTodayTopic();
  // Re-render when admin topic list changes so per-category lists stay fresh.
  const mergedTopics = useMergedTopics();

  // 표시할 단일 토픽 결정
  const displayTopic = useMemo<TodayTopic>(() => {
    if (activeCat === "all") return todayTopic;
    const list = getMergedTopicsByCategory(activeCat as CategoryId);
    return list[0] ?? todayTopic;
  }, [activeCat, todayTopic]);

  const displayCat = useMemo(
    () => categories.find((c) => c.id === displayTopic.category),
    [displayTopic]
  );
  const structuredData = useMemo(() => homeJsonLd(mergedTopics), [mergedTopics]);

  const handleLogout = () => {
    logout();
    toast({ title: "로그아웃 되었습니다" });
    navigate("/", { replace: true });
  };

  return (
    <PageTransition>
    <Seo
      title="PINCH — 매일 하나의 선택된 의견 | 오늘의 PINCH"
      description="PINCH는 매일 하나의 핫토픽에 1인 1 PINCH으로 의견을 남기는 한국형 토론 플랫폼입니다. 가장 공감받은 의견 하나만 아카이브에 기록됩니다."
      path="/"
      jsonLd={structuredData}
    />
    <div className="min-h-screen bg-background pb-24">
      <div className="relative overflow-hidden">
        <ParticleField />
        <div className="absolute inset-0 bg-gradient-to-b from-accent/5 via-transparent to-transparent" />
        {/* Top bar */}
        <div
          data-topbar
          className="absolute right-4 z-10 flex items-center gap-2"
          style={{ top: "max(1rem, env(safe-area-inset-top))" }}
        >
          {isAuthenticated && user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                aria-label={`${user.username} 메뉴 열기`}
                className="group flex items-center gap-2 rounded-full bg-accent/10 border border-accent/20 py-1 pl-1 pr-2.5 hover:bg-accent/20 hover:border-accent/40 transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-accent"
              >
                <Avatar className="h-7 w-7 border border-accent/40">
                  <AvatarFallback className="bg-accent text-accent-foreground text-xs font-bold">
                    {user.avatar}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-semibold text-foreground max-w-[80px] truncate">
                  {user.username}
                </span>
                <ChevronDown className="h-3.5 w-3.5 text-muted-foreground transition-transform group-data-[state=open]:rotate-180" />
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48 glass border-accent/20">
                <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
                  @{user.username}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => navigate("/mypage")} className="cursor-pointer">
                  <User className="h-4 w-4" />
                  마이페이지
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => navigate("/settings")} className="cursor-pointer">
                  <Settings className="h-4 w-4" />
                  설정
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleLogout}
                  className="cursor-pointer text-destructive focus:text-destructive"
                >
                  <LogOut className="h-4 w-4" />
                  로그아웃
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            // 태블릿+에서는 사이드바 푸터에 동일한 로그인 진입점이 있어 중복되므로 모바일에서만 노출.
            <Link
              to="/auth"
              className="mobile-only flex items-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-4 py-2 text-xs font-semibold text-accent hover:bg-accent/20 hover:border-accent/40 transition-all"
            >
              <LogIn className="h-3.5 w-3.5" />
              로그인
            </Link>
          )}
          <ThemeToggle />
        </div>
        <motion.div
          className="container relative pt-12 pb-8"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, ease: "easeOut" }}
        >
          <div className="mb-2 flex items-center gap-2">
            <div className="h-2 w-2 animate-pulse rounded-full bg-accent" />
            <span className="brand-eyebrow !text-accent">Live Now</span>
          </div>
          <h1 className="text-gradient-white text-4xl font-black leading-tight tracking-tight md:text-5xl lg:text-6xl">
            오늘의
            <br />
            <span className="brand-wordmark text-gradient">PINCH</span>
          </h1>
          <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
            매일 하나의 주제, 단 하나의 의견.<br />
            모든 의견이 남지 않습니다. 오직 선택된 하나만 남습니다.
          </p>
        </motion.div>
      </div>

      <motion.div
        className="container space-y-4"
        variants={container}
        initial="hidden"
        animate="show"
      >
        {/* Category chips — 누르면 아래 단일 토픽이 교체됨 */}
        <motion.div variants={item}>
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              카테고리
            </h3>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
            {[hotCategoryChip, ...categories].map((cat) => {
              const active = activeCat === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => handleSelectCat(cat.id)}
                  className={`shrink-0 flex items-center gap-1.5 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? "bg-accent text-accent-foreground shadow-[0_0_20px_hsl(var(--accent)/0.4)]"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>{cat.label}</span>
                </button>
              );
            })}
          </div>
        </motion.div>

        {/* Single Hot Topic — depends on activeCat */}
        <motion.div
          variants={item}
          id="hot-topic-card"
          style={{ scrollMarginTop: "calc(env(safe-area-inset-top) + 4rem)" }}
        >
          <AnimatePresence mode="wait">
            <motion.div
              key={displayTopic.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.2, ease: [0.25, 0.46, 0.45, 0.94] }}
            >
              <Link to={`/topic?topic=${displayTopic.id}&category=${displayTopic.category}`} className="group block">
                <motion.div
                  className={`glass glass-hover noise relative overflow-hidden rounded-3xl p-7 md:p-9 glow-accent ${
                    highlight ? "highlight-pulse" : ""
                  }`}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                >
                  <div className="pointer-events-none absolute -top-16 -right-16 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
                  <div className="pointer-events-none absolute -bottom-20 -left-12 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

                  <div className="relative">
                    <div className="mb-4 flex flex-wrap items-center gap-2">
                      {displayTopic.id === todayTopic.id && (
                        <motion.span
                          animate={highlight ? { scale: [1, 1.18, 1], rotate: [0, -4, 0] } : { scale: 1, rotate: 0 }}
                          transition={{ duration: 0.6, ease: "easeOut" }}
                          className="flex items-center gap-1 rounded-full bg-accent text-accent-foreground px-2.5 py-1 text-[10px] font-black uppercase tracking-widest"
                        >
                          <Flame className="h-3 w-3" /> HOT #1
                        </motion.span>
                      )}
                      {displayCat && (() => {
                        const DisplayCatIcon = displayCat.icon;
                        return (
                          <span className={`flex items-center gap-1 rounded-full bg-secondary px-2.5 py-1 text-[11px] font-bold ${displayCat.accent}`}>
                            <DisplayCatIcon className="h-3 w-3" aria-hidden="true" /> {displayCat.label}
                          </span>
                        );
                      })()}
                      <span className="ml-auto text-[11px] text-muted-foreground">{displayTopic.date}</span>
                    </div>
                    <h2 className="mb-3 text-2xl font-black leading-tight tracking-tight md:text-4xl">
                      {displayTopic.title}
                    </h2>
                    <p className="mb-5 text-sm leading-relaxed text-muted-foreground line-clamp-3 md:text-base">
                      {displayTopic.description}
                    </p>
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4 text-xs text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3.5 w-3.5 text-accent/70" />
                          {displayTopic.remainingTime}
                        </span>
                        <span className="flex items-center gap-1" title="이 토픽의 누적 PINCH 수">
                          <MessageCircle className="h-3.5 w-3.5 text-accent/70" />
                          PINCH {displayTopic.pinchCount.toLocaleString()}
                        </span>
                      </div>
                      <span className="flex items-center gap-1 rounded-full bg-accent/15 px-3 py-1.5 text-xs font-semibold text-accent transition-transform group-hover:translate-x-1">
                        참여하기 <ArrowRight className="h-3.5 w-3.5" />
                      </span>
                    </div>
                  </div>
                </motion.div>
              </Link>
            </motion.div>
          </AnimatePresence>
        </motion.div>

        {/* Bento Grid */}
        <div className="grid grid-cols-2 gap-3 md:gap-4">
          <motion.div variants={item}>
            <Link to="/archive" className="group block">
              <motion.div
                className="glass glass-hover noise flex h-40 flex-col justify-between rounded-2xl p-5"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Archive className="h-6 w-6 text-muted-foreground group-hover:text-accent transition-colors" />
                <div>
                  <p className="text-lg font-bold">아카이브</p>
                  <p className="text-xs text-muted-foreground">지난 주제 · 선택된 PINCH</p>
                </div>
              </motion.div>
            </Link>
          </motion.div>

          <motion.div variants={item}>
            <Link to="/ranking" className="group block">
              <motion.div
                className="glass glass-hover noise flex h-40 flex-col justify-between rounded-2xl p-5"
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                transition={{ type: "spring", stiffness: 400, damping: 25 }}
              >
                <Trophy className="h-6 w-6 text-muted-foreground group-hover:text-accent transition-colors" />
                <div>
                  <p className="text-lg font-bold">PINCH 랭킹</p>
                  <p className="text-xs text-muted-foreground">주간 · 월간</p>
                </div>
              </motion.div>
            </Link>
          </motion.div>
        </div>

        {/* Ad Banner — placed after primary content so first paint shows topic + nav cards */}
        <motion.div variants={item}>
          <ResponsiveAdFitBanner
            mobileSlot={adfitSlots.homeMid}
            wideSlot={adfitSlots.listWide}
            className="w-full"
          />
        </motion.div>

        {/* Weekly Top 3 Preview */}
        <motion.div variants={item} className="glass noise rounded-2xl p-5">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="flex items-center gap-1.5 text-sm font-bold uppercase tracking-wider text-muted-foreground">
              <Brain className="h-4 w-4 text-accent" aria-hidden="true" /> 이번 주 똑똑이
            </h3>
            <Link to="/ranking" className="text-xs text-accent hover:underline">
              전체 보기
            </Link>
          </div>
          <div className="space-y-3">
            {weeklyRanking.slice(0, 3).map((user, idx) => (
              <motion.div
                key={user.username}
                className="flex items-center gap-3"
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 + idx * 0.05, duration: 0.2 }}
              >
                <span className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-black ${
                  idx === 0 ? "bg-accent text-accent-foreground" : "bg-secondary text-secondary-foreground"
                }`}>
                  {user.rank}
                </span>
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-secondary text-xs font-bold">
                  {user.username.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="truncate text-sm font-semibold">{user.username}</p>
                  <p className="flex items-center gap-1 text-xs text-muted-foreground">
                    {user.wins}회 선정 · {user.totalLikes} <Heart className="h-3 w-3 text-rose-400" aria-hidden="true" />
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        <motion.div variants={item} className="mobile-only">
          <AdFitBanner {...adfitSlots.mobileHomeBottom} className="w-full" />
        </motion.div>
      </motion.div>

      <BottomNav />
      <FirstVisitOnboarding />
    </div>
    </PageTransition>
  );
};

export default Index;
