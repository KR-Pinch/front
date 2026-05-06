import { useEffect, useMemo, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { ArrowRight, Archive, Clock, MessageCircle, Sparkles, X } from "lucide-react";
import PinchMark from "@/components/brand/PinchMark";
import { useAuth } from "@/hooks/useAuth";
import { useTodayTopic } from "@/data/mockData";

const STORAGE_PREFIX = "pinch:onboarding-seen:";

interface Props {
  /** Force open (for previews/tests). When omitted, auto-opens on first visit. */
  forceOpen?: boolean;
  onClose?: () => void;
}

const FirstVisitOnboarding = ({ forceOpen, onClose }: Props) => {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  const topic = useTodayTopic();

  const storageKey = useMemo(
    () => (user?.username ? `${STORAGE_PREFIX}${user.username}` : null),
    [user?.username],
  );

  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (forceOpen) {
      setOpen(true);
      return;
    }
    if (!isAuthenticated || !storageKey) return;
    if (typeof window === "undefined") return;
    try {
      if (!localStorage.getItem(storageKey)) {
        // small delay so it feels intentional after page paint
        const id = window.setTimeout(() => setOpen(true), 350);
        return () => window.clearTimeout(id);
      }
    } catch {
      // ignore storage errors
    }
  }, [forceOpen, isAuthenticated, storageKey]);

  // Lock body scroll while open
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  const persistSeen = () => {
    if (!storageKey) return;
    try {
      localStorage.setItem(storageKey, new Date().toISOString());
    } catch {
      // ignore
    }
  };

  const handleClose = () => {
    persistSeen();
    setOpen(false);
    onClose?.();
  };

  const goPick = () => {
    persistSeen();
    setOpen(false);
    navigate(`/topic/${topic.id}`);
  };

  const goArchive = () => {
    persistSeen();
    setOpen(false);
    navigate("/archive");
  };

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <motion.div
          role="dialog"
          aria-modal="true"
          aria-labelledby="onboarding-title"
          className="fixed inset-0 z-[100] flex items-center justify-center overflow-y-auto bg-background/95 backdrop-blur-md"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.25 }}
        >
          {/* decorative glows */}
          <div className="pointer-events-none absolute -top-32 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />
          <div className="pointer-events-none absolute bottom-0 right-0 h-72 w-72 rounded-full bg-primary/10 blur-3xl" />

          {/* close */}
          <button
            type="button"
            aria-label="닫기"
            onClick={handleClose}
            className="absolute right-4 top-4 rounded-full border border-border/60 bg-card/60 p-2 text-muted-foreground backdrop-blur transition-colors hover:bg-card hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>

          <motion.div
            className="relative w-full max-w-lg p-5 sm:p-6"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 16, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 280, damping: 26 }}
          >
            <div className="space-y-6">
              {/* header */}
              <div className="space-y-3 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center">
                  <PinchMark className="h-12 w-12" />
                </div>
                <p className="brand-eyebrow">Welcome to PINCH</p>
                <h2 id="onboarding-title" className="text-2xl font-black sm:text-3xl">
                  환영합니다,{" "}
                  <span className="text-gradient">
                    {user?.username || "회원"}
                  </span>
                  님
                </h2>
                <p className="mx-auto max-w-sm text-sm leading-relaxed text-muted-foreground">
                  모든 의견이 남지 않습니다.
                  <br />
                  오직 선택된 <span className="font-semibold text-foreground">하나</span>만 남습니다.
                </p>
              </div>

              {/* rule chip */}
              <div className="mx-auto flex w-fit items-center gap-1.5 rounded-full border border-accent/30 bg-accent/10 px-3 py-1.5">
                <Sparkles className="h-3 w-3 text-accent" />
                <span className="text-[11px] font-semibold tracking-wide text-accent">
                  하루 한 번, 단 하나의 PINCH만 남길 수 있어요
                </span>
              </div>

              {/* today's topic preview */}
              <div className="relative overflow-hidden rounded-2xl border border-border/60 bg-card/70 p-5 backdrop-blur">
                <div className="pointer-events-none absolute -top-16 -right-16 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />
                <p className="brand-eyebrow mb-2">오늘의 주제</p>
                <h3 className="text-base font-bold leading-snug sm:text-lg">
                  {topic.title}
                </h3>
                <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
                  {topic.description}
                </p>
                <div className="mt-3 flex items-center gap-3 text-[11px] text-muted-foreground">
                  <span className="inline-flex items-center gap-1">
                    <Clock className="h-3 w-3" />
                    {topic.remainingTime} 남음
                  </span>
                  <span className="inline-flex items-center gap-1">
                    <MessageCircle className="h-3 w-3" />
                    {topic.pinchCount.toLocaleString()} PINCH
                  </span>
                </div>
              </div>

              {/* CTAs */}
              <div className="grid gap-2 sm:grid-cols-2">
                <motion.button
                  type="button"
                  onClick={goPick}
                  className="group inline-flex items-center justify-center gap-1.5 rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground transition-colors hover:bg-accent/90"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  PINCH 남기기
                  <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                </motion.button>
                <motion.button
                  type="button"
                  onClick={goArchive}
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl border border-border bg-card/40 py-3 text-sm font-semibold text-foreground transition-colors hover:bg-card"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <Archive className="h-4 w-4" />
                  아카이브 둘러보기
                </motion.button>
              </div>

              <button
                type="button"
                onClick={handleClose}
                className="mx-auto block text-[11px] font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
              >
                다음에 할게요
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>,
    document.body,
  );
};

export default FirstVisitOnboarding;
