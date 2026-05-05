import { useState } from "react";
import { Mail, Lock, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
import { useNavigate, useLocation } from "react-router-dom";
import AuthSocialButtons from "./AuthSocialButtons";
import ForgotPasswordModal from "./ForgotPasswordModal";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";

const AuthLoginForm = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [forgotOpen, setForgotOpen] = useState(false);
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const from = (location.state as { from?: string } | null)?.from || "/";

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) {
      toast.error("이메일과 비밀번호를 입력하세요.");
      return;
    }
    // Mock login: derive a username from email local-part
    const localPart = email.split("@")[0] || "회원";
    login({
      username: localPart,
      avatar: localPart.charAt(0).toUpperCase(),
    });
    toast.success(`${localPart}님, 환영합니다!`);
    navigate(from, { replace: true });
  };

  return (
    <>
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-4"
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 10 }}
      transition={{ duration: 0.15 }}
    >
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground">이메일</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="이메일을 입력하세요"
            className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground">비밀번호</label>
        <div className="relative">
          <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="비밀번호를 입력하세요"
            className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-11 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>

      <div className="text-right">
        <button
          type="button"
          onClick={() => setForgotOpen(true)}
          className="text-xs text-accent hover:underline"
        >
          비밀번호를 잊으셨나요?
        </button>
      </div>

      <motion.button
        type="submit"
        className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground transition-all hover:bg-accent/90 glow-accent"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        로그인
      </motion.button>

      <AuthSocialButtons />
    </motion.form>
    <ForgotPasswordModal
      open={forgotOpen}
      onClose={() => setForgotOpen(false)}
      initialEmail={email}
    />
    </>
  );
};

export default AuthLoginForm;
