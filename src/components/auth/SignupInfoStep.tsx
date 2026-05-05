import { useRef, useState } from "react";
import { User, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { motion } from "framer-motion";
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

interface Props {
  formData: { username: string; email: string; password: string };
  updateField: (field: string, value: string) => void;
  onNext: () => void;
}

const SignupInfoStep = ({ formData, updateField, onNext }: Props) => {
  const [showPassword, setShowPassword] = useState(false);
  const meterRef = useRef<PasswordStrengthMeterHandle>(null);

  const passwordOk = isPasswordValid(formData.password);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.username || !formData.email) {
      toast.error("닉네임과 이메일을 입력하세요.");
      return;
    }
    if (!passwordOk) {
      const { title, description } = passwordPolicyMessage(formData.password);
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
    onNext();
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      className="space-y-4"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.15 }}
    >
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground">닉네임</label>
        <div className="relative">
          <User className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            value={formData.username}
            onChange={(e) => updateField("username", e.target.value)}
            placeholder="닉네임을 입력하세요"
            className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
          />
        </div>
      </div>

      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground">이메일</label>
        <div className="relative">
          <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="email"
            value={formData.email}
            onChange={(e) => updateField("email", e.target.value)}
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
            value={formData.password}
            onChange={(e) => updateField("password", e.target.value)}
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
        <PasswordStrengthMeter ref={meterRef} password={formData.password} />
        {!formData.password && (
          <PasswordPolicySummary {...POLICY_SUMMARY_PRESETS.signup} />
        )}
      </div>

      <motion.button
        type="submit"
        disabled={!passwordOk || !formData.username || !formData.email}
        className="w-full rounded-xl bg-accent py-3 text-sm font-bold text-accent-foreground transition-all hover:bg-accent/90 glow-accent disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-accent"
        whileHover={{ scale: passwordOk ? 1.02 : 1 }}
        whileTap={{ scale: passwordOk ? 0.98 : 1 }}
      >
        다음
      </motion.button>
    </motion.form>
  );
};

export default SignupInfoStep;
