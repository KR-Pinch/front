import { useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, X } from "lucide-react";
import ThemeToggle from "@/components/ThemeToggle";
import { motion, AnimatePresence } from "framer-motion";
import PageTransition from "@/components/PageTransition";
import AuthLoginForm from "@/components/auth/AuthLoginForm";
import AuthSignupFlow from "@/components/auth/AuthSignupFlow";
import PicksLogo from "@/components/brand/PicksLogo";

const Auth = () => {
  const [mode, setMode] = useState<"login" | "signup">("login");

  return (
    <PageTransition>
      <div className="min-h-screen bg-background flex flex-col">
        {/* Header */}
        <div className="sticky top-0 z-40 glass border-b border-border/50">
          <div className="container flex h-14 items-center gap-3">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <p className="flex-1 text-sm font-bold">
              {mode === "login" ? "로그인" : "회원가입"}
            </p>
            <ThemeToggle />
            <Link
              to="/"
              aria-label="닫기"
              className="rounded-full p-1.5 text-muted-foreground hover:bg-secondary hover:text-foreground transition-colors"
            >
              <X className="h-4 w-4" />
            </Link>
          </div>
        </div>

        <div className="flex-1 flex items-center justify-center px-4 py-10">
          <motion.div
            className="w-full max-w-sm space-y-8"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.25 }}
          >
            {/* Logo area */}
            <div className="flex flex-col items-center space-y-3 text-center">
              <PicksLogo size="lg" />
              <p className="brand-eyebrow">Only one remains</p>
              <p className="text-sm text-muted-foreground">
                {mode === "login"
                  ? "다시 오셨군요! 오늘의 의견을 남겨보세요."
                  : "가입하고 오늘의 주제에 참여하세요."}
              </p>
            </div>

            {/* Mode Toggle */}
            <div className="flex gap-1 rounded-xl bg-secondary p-1">
              {[
                { key: "login" as const, label: "로그인" },
                { key: "signup" as const, label: "회원가입" },
              ].map(({ key, label }) => (
                <button
                  key={key}
                  onClick={() => setMode(key)}
                  className={`relative flex-1 rounded-lg py-2.5 text-sm font-semibold transition-all ${
                    mode === key
                      ? "text-accent-foreground"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {mode === key && (
                    <motion.div
                      className="absolute inset-0 rounded-lg bg-accent shadow-sm"
                      layoutId="auth-mode-indicator"
                      transition={{ type: "spring", stiffness: 400, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10">{label}</span>
                </button>
              ))}
            </div>

            {/* Form */}
            <AnimatePresence mode="wait">
              {mode === "login" ? (
                <AuthLoginForm key="login" />
              ) : (
                <AuthSignupFlow key="signup" />
              )}
            </AnimatePresence>
          </motion.div>
        </div>
      </div>
    </PageTransition>
  );
};

export default Auth;
