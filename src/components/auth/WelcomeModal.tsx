import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles } from "lucide-react";
import PicksMark from "@/components/brand/PicksMark";

interface Props {
  open: boolean;
  username: string;
  onClose?: () => void;
  redirectTo?: string;
  redirectDelay?: number; // ms
}

const WelcomeModal = ({
  open,
  username,
  onClose,
  redirectTo = "/",
  redirectDelay = 3000,
}: Props) => {
  const navigate = useNavigate();
  const [countdown, setCountdown] = useState(Math.ceil(redirectDelay / 1000));

  useEffect(() => {
    if (!open) return;
    setCountdown(Math.ceil(redirectDelay / 1000));

    const tick = setInterval(() => {
      setCountdown((c) => (c > 0 ? c - 1 : 0));
    }, 1000);

    const timeout = setTimeout(() => {
      navigate(redirectTo);
    }, redirectDelay);

    return () => {
      clearInterval(tick);
      clearTimeout(timeout);
    };
  }, [open, redirectDelay, redirectTo, navigate]);

  if (typeof document === "undefined") return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          {/* Overlay */}
          <motion.div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />

          {/* Modal - centered with flex to avoid transform conflicts */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              className="w-full max-w-sm pointer-events-auto"
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
            <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-card p-6 shadow-2xl glow-accent">
              {/* Decorative gradient */}
              <div className="pointer-events-none absolute -top-20 -right-20 h-48 w-48 rounded-full bg-accent/20 blur-3xl" />
              <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />

              <div className="relative space-y-5 text-center">
                {/* Brand mark */}
                <motion.div
                  className="mx-auto flex h-16 w-16 items-center justify-center"
                  initial={{ scale: 0, rotate: -30 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 260, damping: 18 }}
                >
                  <PicksMark className="h-14 w-14" />
                </motion.div>

                {/* Title */}
                <div className="space-y-1.5">
                  <p className="brand-eyebrow">Welcome to PINCH</p>
                  <h2 className="text-2xl font-black">
                    환영합니다,{" "}
                    <span className="text-gradient">{username || "회원"}</span>님!
                  </h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    회원가입이 완료되었습니다.
                    <br />
                    오늘의 주제에 당신의 PINCH을 남겨보세요.
                  </p>
                </div>

                {/* Highlight badge */}
                <div className="flex items-center justify-center gap-1.5 rounded-full bg-accent/10 border border-accent/20 px-3 py-1.5 mx-auto w-fit">
                  <Sparkles className="h-3 w-3 text-accent" />
                  <span className="text-[11px] font-semibold text-accent">
                    자동 로그인 처리되었습니다
                  </span>
                </div>

                {/* CTA */}
                <motion.button
                  type="button"
                  onClick={() => navigate(redirectTo)}
                  className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground transition-all hover:bg-accent/90"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  지금 시작하기
                  {countdown > 0 && (
                    <span className="ml-1.5 text-xs font-medium opacity-70">
                      ({countdown}초)
                    </span>
                  )}
                </motion.button>
              </div>
            </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default WelcomeModal;
