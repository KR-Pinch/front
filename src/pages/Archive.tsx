import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { Archive as ArchiveIcon, ArrowLeft, Crown, Heart, Link2, Search, Share2, Users, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { toast } from "sonner";
import BottomNav from "@/components/BottomNav";
import AdFitBanner from "@/components/AdFitBanner";
import PageTransition from "@/components/PageTransition";
import ThemeToggle from "@/components/ThemeToggle";
import Seo from "@/components/Seo";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  archiveData,
  categories,
  allCategoryChip,
  findArchiveItemById,
  getArchiveItemId,
  type ArchiveItem,
} from "@/data/mockData";

type SortKey = "recent" | "likes";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "recent", label: "최신순" },
  { key: "likes", label: "좋아요순" },
];

const buildShareUrl = (id: string) => {
  if (typeof window === "undefined") return `/archive?item=${id}`;
  const url = new URL(window.location.href);
  url.searchParams.set("item", id);
  // Drop transient state (search/sort/cat) so the shared URL is minimal.
  ["q", "sort", "cat"].forEach((k) => url.searchParams.delete(k));
  return url.toString();
};

const Archive = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const validCatIds = useMemo(() => new Set(["all", ...categories.map((c) => c.id)]), []);
  const catParam = searchParams.get("cat");
  const activeCat = catParam && validCatIds.has(catParam) ? catParam : "all";
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("recent");

  const setActiveCat = (catId: string) => {
    const next = new URLSearchParams(searchParams);
    if (catId === "all") next.delete("cat");
    else next.set("cat", catId);
    setSearchParams(next, { replace: true });
  };

  // Drop unknown ?cat= values from URL so shared links stay clean.
  useEffect(() => {
    if (catParam && !validCatIds.has(catParam)) {
      const next = new URLSearchParams(searchParams);
      next.delete("cat");
      setSearchParams(next, { replace: true });
    }
  }, [catParam, validCatIds, searchParams, setSearchParams]);

  // Deep-linked item from ?item=<id> — survives refresh + share.
  const itemId = searchParams.get("item");
  const selected: ArchiveItem | undefined = useMemo(
    () => (itemId ? findArchiveItemById(itemId) : undefined),
    [itemId]
  );

  // If the URL points at a missing id (typo / removed), drop it cleanly.
  useEffect(() => {
    if (itemId && !selected) {
      const next = new URLSearchParams(searchParams);
      next.delete("item");
      setSearchParams(next, { replace: true });
      toast.error("존재하지 않는 아카이브 항목입니다.");
    }
  }, [itemId, selected, searchParams, setSearchParams]);

  // Track history entries we pushed for opened items so close == back.
  const pushedDepthRef = useRef(0);

  // Browser back removes ?item= without calling closeItem — keep depth in sync.
  useEffect(() => {
    if (!itemId && pushedDepthRef.current > 0) {
      pushedDepthRef.current = 0;
    }
  }, [itemId]);

  const openItem = (item: ArchiveItem) => {
    const next = new URLSearchParams(searchParams);
    next.set("item", getArchiveItemId(item));
    // Push so the browser back button naturally closes the dialog.
    setSearchParams(next);
    pushedDepthRef.current += 1;
  };

  const closeItem = () => {
    // If we pushed a history entry to open, pop it so URL + history stay aligned.
    if (pushedDepthRef.current > 0) {
      pushedDepthRef.current -= 1;
      navigate(-1);
      return;
    }
    // Direct deep-link visit (no prior push) — strip param without history churn.
    const next = new URLSearchParams(searchParams);
    next.delete("item");
    setSearchParams(next, { replace: true });
  };

  const shareItem = async (item: ArchiveItem, e?: React.MouseEvent) => {
    e?.preventDefault();
    e?.stopPropagation();
    const url = buildShareUrl(getArchiveItemId(item));
    const shareData = {
      title: `PICKS 아카이브 · ${item.title}`,
      text: `"${item.bestPick}" — @${item.bestUser}`,
      url,
    };
    try {
      if (typeof navigator !== "undefined" && navigator.share) {
        await navigator.share(shareData);
        return;
      }
    } catch {
      // user cancelled or share failed → fall through to clipboard
    }
    try {
      await navigator.clipboard.writeText(url);
      toast.success("링크가 복사되었습니다");
    } catch {
      toast.error("링크 복사에 실패했습니다");
    }
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = archiveData.filter((item) => {
      if (activeCat !== "all" && item.category !== activeCat) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q)
      );
    });
    const sorted = [...base];
    if (sortKey === "likes") {
      sorted.sort((a, b) => b.bestLikes - a.bestLikes);
    }
    return sorted;
  }, [activeCat, query, sortKey]);

  const selectedCat = selected
    ? categories.find((c) => c.id === selected.category)
    : undefined;

  return (
    <PageTransition>
    <Seo
      title={selected ? `${selected.title} — PICKS 아카이브` : "PICKS 아카이브 — 지난 주제와 선택된 PICK"}
      description={
        selected
          ? `${selected.title} — ${selected.bestPick.slice(0, 110)}`
          : "PICKS 아카이브에서 지난 핫토픽과 그날 가장 공감받은 단 하나의 PICK을 다시 만나보세요."
      }
      path={selected ? `/archive?item=${getArchiveItemId(selected)}` : "/archive"}
    />
    <div className="min-h-screen bg-background pb-24">
      <div className="page-sticky-header">
        <div className="container flex h-14 items-center gap-3">
          <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <p className="flex-1 text-sm font-bold">아카이브</p>
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
          <h1 className="page-heading flex items-center gap-2"><BookMarked className="h-7 w-7 text-accent" aria-hidden="true" /> 아카이브</h1>
          <p className="mt-1 text-sm text-muted-foreground">지난 주제와 선택된 PICKS</p>
        </div>

        {/* Ad Banner */}
        <AdFitBanner className="w-full mb-3" />

        {/* Search */}
        <div className="mb-3">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="제목·설명으로 검색"
              aria-label="아카이브 검색"
              className="w-full rounded-full bg-secondary/70 border border-border/50 py-2.5 pl-10 pr-10 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40"
            />
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                aria-label="검색어 지우기"
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full p-1.5 text-muted-foreground hover:bg-background hover:text-foreground transition-colors"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* Sort */}
        <div className="mb-4">
          <div className="mb-2 px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              정렬
            </h3>
          </div>
          <div className="flex gap-2">
            {sortOptions.map((opt) => {
              const active = sortKey === opt.key;
              return (
                <button
                  key={opt.key}
                  onClick={() => setSortKey(opt.key)}
                  className={`shrink-0 rounded-full px-3.5 py-1.5 text-xs font-semibold transition-all ${
                    active
                      ? "bg-accent text-accent-foreground shadow-[0_0_20px_hsl(var(--accent)/0.4)]"
                      : "bg-secondary text-muted-foreground hover:bg-secondary/70 hover:text-foreground"
                  }`}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Category filter chips */}
        <div className="mb-4">
          <div className="mb-2 flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              카테고리
            </h3>
            <span className="text-[10px] text-muted-foreground">
              {filtered.length}개
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-none">
            {[allCategoryChip, ...categories].map((cat) => {
              const active = activeCat === cat.id;
              const Icon = cat.icon;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCat(cat.id)}
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
        </div>

        <AnimatePresence mode="wait">
          {filtered.length === 0 ? (
            <motion.div
              key="empty"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="glass rounded-2xl p-8 text-center text-sm text-muted-foreground"
            >
              {query ? `"${query}"에 대한 결과가 없습니다.` : "이 카테고리에는 아직 아카이브된 PICK이 없습니다."}
            </motion.div>
          ) : (
            <motion.div
              key={`${activeCat}-${sortKey}-${query}`}
              className="card-grid"
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.2 }}
            >
              {filtered.map((item, idx) => {
                const cat = categories.find((c) => c.id === item.category);
                const CatIcon = cat?.icon;
                const id = getArchiveItemId(item);
                return (
                  <motion.button
                    type="button"
                    onClick={() => openItem(item)}
                    key={id}
                    className="glass glass-hover noise rounded-2xl p-5 text-left w-full"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: idx * 0.04, duration: 0.2 }}
                    whileHover={{ scale: 1.01 }}
                    aria-label={`${item.title} 자세히 보기`}
                  >
                    <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                      {cat && CatIcon && (
                        <span className={`flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-semibold ${cat.accent}`}>
                          <CatIcon className="h-3 w-3" aria-hidden="true" />
                          <span>{cat.label}</span>
                        </span>
                      )}
                      <span className="text-muted-foreground">{item.date}</span>
                      <span
                        className="flex items-center gap-1 text-muted-foreground"
                        title={`이 주제에 PICK을 남긴 참여자 수 (1인 1 PICK · 예: ${item.totalPicks.toLocaleString()}명 참여)`}
                        aria-label={`참여자 ${item.totalPicks.toLocaleString()}명 (1인 1 PICK)`}
                      >
                        <Users className="h-3 w-3" />
                        {item.totalPicks.toLocaleString()}명 참여
                      </span>
                      <span
                        role="button"
                        tabIndex={0}
                        onClick={(e) => shareItem(item, e)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            e.stopPropagation();
                            shareItem(item);
                          }
                        }}
                        aria-label="이 항목 공유 링크 복사"
                        className="ml-auto inline-flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-semibold text-muted-foreground hover:bg-accent/15 hover:text-accent transition-colors cursor-pointer"
                      >
                        <Share2 className="h-3 w-3" />
                        공유
                      </span>
                    </div>
                    <h3 className="mb-1.5 text-base font-bold leading-snug">{item.title}</h3>
                    <p className="mb-3 text-xs leading-relaxed text-muted-foreground line-clamp-3">
                      {item.description}
                    </p>
                    <p className="mb-4 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                      출처 · {item.newsSource}
                    </p>

                    {/* Winning PICK */}
                    <div className="rounded-xl bg-accent/5 border border-accent/15 p-4">
                      <div className="mb-2 flex items-center gap-2">
                        <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                          <Crown className="h-3 w-3" /> 오늘의 PICK
                        </span>
                        <span className="text-sm font-semibold">{item.bestUser}</span>
                      </div>
                      <p className="text-sm leading-relaxed text-foreground/70">
                        "{item.bestPick}"
                      </p>
                      <div className="mt-2 flex items-center gap-1 text-xs text-accent">
                        <Heart className="h-3 w-3 fill-current" />
                        {item.bestLikes}
                      </div>
                    </div>
                  </motion.button>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Deep-link detail dialog — driven by ?item=<id> so refresh + share work */}
      <Dialog open={!!selected} onOpenChange={(open) => { if (!open) closeItem(); }}>
        <DialogContent className="glass border-accent/20 sm:max-w-lg">
          {selected && (
            <>
              <DialogHeader>
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  {selectedCat && (() => {
                    const SelectedCatIcon = selectedCat.icon;
                    return (
                      <span className={`flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-semibold ${selectedCat.accent}`}>
                        <SelectedCatIcon className="h-3 w-3" aria-hidden="true" />
                        <span>{selectedCat.label}</span>
                      </span>
                    );
                  })()}
                  <span className="text-muted-foreground">{selected.date}</span>
                </div>
                <DialogTitle className="text-left text-lg leading-snug">
                  {selected.title}
                </DialogTitle>
                <DialogDescription className="text-left text-sm leading-relaxed text-muted-foreground">
                  {selected.description}
                </DialogDescription>
              </DialogHeader>

              <p className="text-[10px] uppercase tracking-wider text-muted-foreground/70">
                출처 · {selected.newsSource}
              </p>

              <div className="mt-2 rounded-xl bg-accent/5 border border-accent/15 p-4">
                <div className="mb-2 flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full bg-accent/15 px-2 py-0.5 text-[10px] font-bold text-accent">
                    <Crown className="h-3 w-3" /> 오늘의 PICK
                  </span>
                  <span className="text-sm font-semibold">{selected.bestUser}</span>
                </div>
                <p className="text-sm leading-relaxed text-foreground/80">
                  "{selected.bestPick}"
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span
                    className="flex items-center gap-1 text-accent"
                    title={`우승 PICK이 받은 좋아요 (${selected.bestLikes.toLocaleString()}개)`}
                    aria-label={`좋아요 ${selected.bestLikes.toLocaleString()}개`}
                  >
                    <Heart className="h-3 w-3 fill-current" />
                    {selected.bestLikes.toLocaleString()}
                  </span>
                  <span
                    className="flex items-center gap-1 text-muted-foreground"
                    title={`이 주제에 PICK을 남긴 참여자 수 (1인 1 PICK · 그중 1개만 아카이브)`}
                    aria-label={`참여자 ${selected.totalPicks.toLocaleString()}명`}
                  >
                    <Users className="h-3 w-3" />
                    {selected.totalPicks.toLocaleString()}명 참여
                  </span>
                </div>
                <p className="mt-2 text-[10px] leading-snug text-muted-foreground/70">
                  ※ {selected.totalPicks.toLocaleString()}개의 PICK 중 가장 많은 좋아요를 받은 1개만 아카이브에 남습니다.
                </p>
              </div>

              <button
                type="button"
                onClick={() => shareItem(selected)}
                className="mt-2 inline-flex items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-accent-foreground hover:opacity-90 transition-opacity"
              >
                <Link2 className="h-4 w-4" />
                공유 링크 복사
              </button>
            </>
          )}
        </DialogContent>
      </Dialog>

      <BottomNav />
    </div>
    </PageTransition>
  );
};

export default Archive;
