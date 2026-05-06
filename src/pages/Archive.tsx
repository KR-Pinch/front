import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Crown, Heart, MessageCircle, Search, X } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import AdFitBanner from "@/components/AdFitBanner";
import PageTransition from "@/components/PageTransition";
import ThemeToggle from "@/components/ThemeToggle";
import { archiveData, categories } from "@/data/mockData";

type SortKey = "recent" | "likes" | "comments";

const sortOptions: { key: SortKey; label: string }[] = [
  { key: "recent", label: "최신순" },
  { key: "likes", label: "좋아요순" },
  { key: "comments", label: "댓글순" },
];

const Archive = () => {
  const [activeCat, setActiveCat] = useState<string>("all");
  const [query, setQuery] = useState("");
  const [sortKey, setSortKey] = useState<SortKey>("recent");

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
    } else if (sortKey === "comments") {
      sorted.sort((a, b) => b.totalComments - a.totalComments);
    }
    // "recent" → keep archiveData's existing date-desc order
    return sorted;
  }, [activeCat, query, sortKey]);


  return (
    <PageTransition>
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
          <h1 className="page-heading">📚 아카이브</h1>
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
            {[{ id: "all", label: "전체", emoji: "🗂️" }, ...categories].map((cat) => {
              const active = activeCat === cat.id;
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
                  <span>{cat.emoji}</span>
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
            return (
              <motion.div
                key={idx}
                className="glass glass-hover noise rounded-2xl p-5"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.04, duration: 0.2 }}
                whileHover={{ scale: 1.01 }}
              >
                {/* Topic header — mirrors the home topic card */}
                <div className="mb-2 flex flex-wrap items-center gap-2 text-xs">
                  {cat && (
                    <span className={`flex items-center gap-1 rounded-full bg-secondary px-2 py-0.5 font-semibold ${cat.accent}`}>
                      <span>{cat.emoji}</span>
                      <span>{cat.label}</span>
                    </span>
                  )}
                  <span className="text-muted-foreground">{item.date}</span>
                  <span className="flex items-center gap-1 text-muted-foreground">
                    <MessageCircle className="h-3 w-3" />
                    {item.totalComments}
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
                    "{item.bestComment}"
                  </p>
                  <div className="mt-2 flex items-center gap-1 text-xs text-accent">
                    <Heart className="h-3 w-3 fill-current" />
                    {item.bestLikes}
                  </div>
                </div>
              </motion.div>
            );
          })}
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      <BottomNav />
    </div>
    </PageTransition>
  );
};

export default Archive;
