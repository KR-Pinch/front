import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Crown, Heart, MessageCircle } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import BottomNav from "@/components/BottomNav";
import AdFitBanner from "@/components/AdFitBanner";
import PageTransition from "@/components/PageTransition";
import ThemeToggle from "@/components/ThemeToggle";
import { archiveData, categories } from "@/data/mockData";

const Archive = () => {
  const [activeCat, setActiveCat] = useState<string>("all");

  const filtered = useMemo(
    () =>
      activeCat === "all"
        ? archiveData
        : archiveData.filter((item) => item.category === activeCat),
    [activeCat]
  );

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

        <div className="card-grid">
          {archiveData.map((item, idx) => {
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
        </div>
      </motion.div>

      <BottomNav />
    </div>
    </PageTransition>
  );
};

export default Archive;
