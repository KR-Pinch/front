import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, Lock, Eye, EyeOff, ArrowLeft, CheckCircle2, X, KeyRound } from "lucide-react";
import { toast } from "sonner";
import PasswordStrengthMeter, {
  type PasswordStrengthMeterHandle,
} from "./PasswordStrengthMeter";
import PasswordPolicySummary from "./PasswordPolicySummary";
import {
  isPasswordValid,
  passwordPolicyMessage,
  POLICY_SUMMARY_PRESETS,
} from "@/lib/passwordPolicy";

type Step = "request" | "sent" | "reset" | "done";

interface Props {
  open: boolean;
  onClose: () => void;
  initialEmail?: string;
}

const ForgotPasswordModal = ({ open, onClose, initialEmail = "" }: Props) => {
  const [step, setStep] = useState<Step>("request");
  const [email, setEmail] = useState(initialEmail);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const meterRef = useRef<PasswordStrengthMeterHandle>(null);
  const confirmRef = useRef<HTMLInputElement>(null);

  // Reset state whenever modal is reopened
  useEffect(() => {
    if (open) {
      setStep("request");
      setEmail(initialEmail);
      setPassword("");
      setConfirm("");
      setShowPw(false);
      setSubmitting(false);
    }
  }, [open, initialEmail]);

  // Esc to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      toast.error("유효한 이메일을 입력하세요.");
      return;
    }
    setSubmitting(true);
    // Mock latency
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setStep("sent");
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPasswordValid(password)) {
      const { title, description } = passwordPolicyMessage(password);
      toast.error(title, {
        description: (
          <div className="space-y-1">
            <p>{description}</p>
            <PasswordPolicySummary {...POLICY_SUMMARY_PRESETS.toast} />
          </div>
        ),
      });
      meterRef.current?.focusFirstUnmet();
      return;
    }
    if (password !== confirm) {
      toast.error("비밀번호가 일치하지 않습니다.");
      confirmRef.current?.focus();
      return;
    }
    setSubmitting(true);
    await new Promise((r) => setTimeout(r, 600));
    setSubmitting(false);
    setStep("done");
    toast.success("비밀번호가 재설정되었습니다.");
  };

  if (typeof document === "undefined") return null;

  const titleByStep: Record<Step, string> = {
    request: "비밀번호 재설정",
    sent: "메일을 확인하세요",
    reset: "새 비밀번호 설정",
    done: "재설정 완료",
  };

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none">
            <motion.div
              className="w-full max-w-sm pointer-events-auto"
              initial={{ opacity: 0, scale: 0.95, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 8 }}
              transition={{ type: "spring", stiffness: 300, damping: 25 }}
            >
              <div className="relative overflow-hidden rounded-2xl border border-accent/30 bg-card p-6 shadow-2xl">
                {/* Decorative */}
                <div className="pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

                {/* Header */}
                <div className="relative flex items-center gap-2 mb-5">
                  {(step === "sent" || step === "reset") && (
                    <button
                      type="button"
                      onClick={() => setStep(step === "reset" ? "sent" : "request")}
                      className="text-muted-foreground hover:text-foreground transition-colors"
                      aria-label="뒤로"
                    >
                      <ArrowLeft className="h-4 w-4" />
                    </button>
                  )}
                  <h2 className="flex-1 text-base font-bold">{titleByStep[step]}</h2>
                  <button
                    type="button"
                    onClick={onClose}
                    className="text-muted-foreground hover:text-foreground transition-colors"
                    aria-label="닫기"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <AnimatePresence mode="wait">
                  {step === "request" && (
                    <motion.form
                      key="request"
                      onSubmit={handleRequest}
                      className="relative space-y-4"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        가입한 이메일을 입력하시면 비밀번호 재설정 링크를 보내드립니다.
                      </p>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">
                          이메일
                        </label>
                        <div className="relative">
                          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="이메일을 입력하세요"
                            autoFocus
                            className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                          />
                        </div>
                      </div>
                      <motion.button
                        type="submit"
                        disabled={submitting}
                        className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground transition-all hover:bg-accent/90 disabled:opacity-60 disabled:cursor-not-allowed"
                        whileHover={{ scale: submitting ? 1 : 1.02 }}
                        whileTap={{ scale: submitting ? 1 : 0.98 }}
                      >
                        {submitting ? "전송 중..." : "재설정 링크 보내기"}
                      </motion.button>
                    </motion.form>
                  )}

                  {step === "sent" && (
                    <motion.div
                      key="sent"
                      className="relative space-y-4 text-center"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 border border-accent/30">
                        <Mail className="h-6 w-6 text-accent" />
                      </div>
                      <div className="space-y-1.5">
                        <p className="text-sm font-semibold">
                          <span className="text-accent">{email}</span>
                        </p>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          위 주소로 재설정 링크를 보냈습니다.
                          <br />
                          메일함을 확인해 주세요. (최대 1분 소요)
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setStep("reset")}
                        className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground transition-all hover:bg-accent/90"
                      >
                        링크를 받았어요 — 재설정하기
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep("request")}
                        className="w-full text-xs text-muted-foreground hover:text-foreground transition-colors"
                      >
                        메일을 받지 못하셨나요? 다시 보내기
                      </button>
                    </motion.div>
                  )}

                  {step === "reset" && (
                    <motion.form
                      key="reset"
                      onSubmit={handleReset}
                      className="relative space-y-4"
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -8 }}
                      transition={{ duration: 0.15 }}
                    >
                      <p className="text-xs text-muted-foreground leading-relaxed">
                        새로 사용할 비밀번호를 입력하세요. (8자 이상)
                      </p>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">
                          새 비밀번호
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            type={showPw ? "text" : "password"}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="새 비밀번호"
                            className="w-full rounded-xl border border-border bg-background py-3 pl-10 pr-11 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
                          />
                          <button
                            type="button"
                            onClick={() => setShowPw((s) => !s)}
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            aria-label={showPw ? "비밀번호 숨기기" : "비밀번호 보기"}
                          >
                            {showPw ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <PasswordStrengthMeter ref={meterRef} password={password} />
                        {!password && (
                          <PasswordPolicySummary
                            {...POLICY_SUMMARY_PRESETS.reset}
                          />
                        )}
                      </div>
                      <div className="space-y-1.5">
                        <label className="text-xs font-semibold text-muted-foreground">
                          새 비밀번호 확인
                        </label>
                        <div className="relative">
                          <KeyRound className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                          <input
                            ref={confirmRef}
                            type={showPw ? "text" : "password"}
                            value={confirm}
                            onChange={(e) => setConfirm(e.target.value)}
                            placeholder="비밀번호 확인"
                            className={`w-full rounded-xl border bg-background py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 transition-all ${
                              confirm && confirm !== password
                                ? "border-destructive/60 focus:ring-destructive/30 focus:border-destructive/60"
                                : "border-border focus:ring-accent/30 focus:border-accent/50"
                            }`}
                          />
                        </div>
                        {confirm && confirm !== password && (
                          <p className="text-[11px] text-destructive">
                            비밀번호가 일치하지 않습니다.
                          </p>
                        )}
                      </div>
                      <motion.button
                        type="submit"
                        disabled={
                          submitting ||
                          !isPasswordValid(password) ||
                          password !== confirm
                        }
                        className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground transition-all hover:bg-accent/90 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent"
                        whileHover={{ scale: submitting ? 1 : 1.02 }}
                        whileTap={{ scale: submitting ? 1 : 0.98 }}
                      >
                        {submitting ? "재설정 중..." : "비밀번호 변경"}
                      </motion.button>
                    </motion.form>
                  )}

                  {step === "done" && (
                    <motion.div
                      key="done"
                      className="relative space-y-4 text-center"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                    >
                      <motion.div
                        className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/15 border border-accent/30"
                        initial={{ scale: 0, rotate: -20 }}
                        animate={{ scale: 1, rotate: 0 }}
                        transition={{ type: "spring", stiffness: 260, damping: 18 }}
                      >
                        <CheckCircle2 className="h-7 w-7 text-accent" />
                      </motion.div>
                      <div className="space-y-1.5">
                        <h3 className="text-base font-bold">재설정이 완료되었습니다</h3>
                        <p className="text-xs text-muted-foreground leading-relaxed">
                          새 비밀번호로 다시 로그인해 주세요.
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={onClose}
                        className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground transition-all hover:bg-accent/90"
                      >
                        로그인 화면으로
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>,
    document.body
  );
};

export default ForgotPasswordModal;
