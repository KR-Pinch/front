import { useState } from "react";
import { Link } from "react-router-dom";
import { Phone, ArrowLeft, CheckCircle2, ChevronRight } from "lucide-react";
import { motion } from "framer-motion";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

interface Props {
  phone: string;
  setPhone: (v: string) => void;
  onNext: () => void;
  onBack: () => void;
}

const PhoneVerifyStep = ({ phone, setPhone, onNext, onBack }: Props) => {
  const [codeSent, setCodeSent] = useState(false);
  const [code, setCode] = useState("");
  const [verified, setVerified] = useState(false);
  const [timer, setTimer] = useState(0);
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [agreePrivacy, setAgreePrivacy] = useState(false);
  const [agreeMarketing, setAgreeMarketing] = useState(false);
  const [invalidFields, setInvalidFields] = useState<{ terms: boolean; privacy: boolean }>({
    terms: false,
    privacy: false,
  });

  const allRequired = agreeTerms && agreePrivacy;
  const allChecked = agreeTerms && agreePrivacy && agreeMarketing;
  const toggleAll = (next: boolean) => {
    setAgreeTerms(next);
    setAgreePrivacy(next);
    setAgreeMarketing(next);
    if (next) setInvalidFields({ terms: false, privacy: false });
  };

  const handleSubmit = () => {
    if (!verified) {
      toast.error("휴대폰 인증을 완료해주세요");
      return;
    }
    const missing: string[] = [];
    if (!agreeTerms) missing.push("서비스 이용약관");
    if (!agreePrivacy) missing.push("개인정보 처리방침");
    if (missing.length > 0) {
      // Reset then re-trigger to replay the shake animation
      setInvalidFields({ terms: false, privacy: false });
      requestAnimationFrame(() => {
        setInvalidFields({ terms: !agreeTerms, privacy: !agreePrivacy });
      });
      toast.error("필수 약관에 동의해주세요", {
        description: `미동의 항목: ${missing.join(", ")}`,
      });
      return;
    }
    onNext();
  };

  const handleAgreeChange = (key: "terms" | "privacy") => (next: boolean) => {
    if (key === "terms") setAgreeTerms(next);
    else setAgreePrivacy(next);
    if (next) setInvalidFields((prev) => ({ ...prev, [key]: false }));
  };

  const sendCode = () => {
    if (!phone) return;
    setCodeSent(true);
    setTimer(180);
    // TODO: 실제 SMS 발송 API 연동
    console.log("SMS 인증번호 발송:", phone);

    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) {
          clearInterval(interval);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
  };

  const verifyCode = () => {
    // TODO: 실제 인증번호 검증 API 연동
    console.log("인증번호 확인:", code);
    setVerified(true);
  };

  const formatTime = (s: number) =>
    `${Math.floor(s / 60)}:${String(s % 60).padStart(2, "0")}`;

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.15 }}
    >
      <div className="space-y-1.5">
        <label className="text-xs font-semibold text-muted-foreground">휴대폰 번호</label>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="01012345678"
              maxLength={11}
              disabled={verified}
              className="w-full rounded-xl border border-border bg-card py-3 pl-10 pr-4 text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all disabled:opacity-50"
            />
          </div>
          <motion.button
            type="button"
            onClick={sendCode}
            disabled={phone.length < 10 || verified}
            className="shrink-0 rounded-xl bg-secondary px-4 py-3 text-xs font-semibold text-foreground transition-all hover:bg-secondary/80 disabled:opacity-40"
            whileTap={{ scale: 0.97 }}
          >
            {codeSent ? "재발송" : "인증요청"}
          </motion.button>
        </div>
      </div>

      {codeSent && !verified && (
        <motion.div
          className="space-y-1.5"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          transition={{ duration: 0.2 }}
        >
          <label className="text-xs font-semibold text-muted-foreground flex items-center gap-2">
            인증번호
            {timer > 0 && (
              <span className="text-accent text-[10px]">{formatTime(timer)}</span>
            )}
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="인증번호 6자리"
              maxLength={6}
              className="flex-1 rounded-xl border border-border bg-card py-3 px-4 text-sm text-center tracking-[0.3em] placeholder:text-muted-foreground placeholder:tracking-normal focus:outline-none focus:ring-2 focus:ring-accent/30 focus:border-accent/50 transition-all"
            />
            <motion.button
              type="button"
              onClick={verifyCode}
              disabled={code.length < 6}
              className="shrink-0 rounded-xl bg-accent px-4 py-3 text-xs font-semibold text-accent-foreground transition-all hover:bg-accent/90 disabled:opacity-40"
              whileTap={{ scale: 0.97 }}
            >
              확인
            </motion.button>
          </div>
        </motion.div>
      )}

      {verified && (
        <motion.div
          className="flex items-center gap-2 rounded-xl bg-accent/10 border border-accent/20 px-4 py-3"
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <CheckCircle2 className="h-4 w-4 text-accent" />
          <span className="text-sm font-medium text-accent">휴대폰 인증 완료</span>
        </motion.div>
      )}

      {verified && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-2 rounded-2xl border border-border/60 bg-card/50 p-3"
        >
          <label className="flex items-center gap-2.5 px-1 py-1 cursor-pointer">
            <Checkbox
              checked={allChecked}
              onCheckedChange={(v) => toggleAll(Boolean(v))}
            />
            <span className="text-sm font-semibold">전체 동의</span>
          </label>

          <div className="h-px bg-border/60" />

          <AgreeRow
            checked={agreeTerms}
            onChange={handleAgreeChange("terms")}
            label="서비스 이용약관 동의"
            required
            to="/terms"
            invalid={invalidFields.terms}
          />
          <AgreeRow
            checked={agreePrivacy}
            onChange={handleAgreeChange("privacy")}
            label="개인정보 처리방침 동의"
            required
            to="/privacy"
            invalid={invalidFields.privacy}
          />
          <AgreeRow
            checked={agreeMarketing}
            onChange={(v) => setAgreeMarketing(v)}
            label="마케팅 정보 수신 동의"
            required={false}
          />
        </motion.div>
      )}

      <div className="flex gap-3">
        <motion.button
          type="button"
          onClick={onBack}
          className="flex-1 flex items-center justify-center gap-1.5 rounded-xl border border-border py-3 text-sm font-medium text-muted-foreground hover:text-foreground transition-all"
          whileTap={{ scale: 0.98 }}
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          이전
        </motion.button>
        <motion.button
          type="button"
          onClick={handleSubmit}
          aria-disabled={!verified || !allRequired}
          className={`flex-1 rounded-xl py-3 text-sm font-bold transition-all ${
            verified && allRequired
              ? "bg-accent text-accent-foreground hover:bg-accent/90 glow-accent"
              : "bg-accent/40 text-accent-foreground/70"
          }`}
          whileHover={{ scale: verified && allRequired ? 1.02 : 1 }}
          whileTap={{ scale: 0.98 }}
        >
          가입 완료
        </motion.button>
      </div>
    </motion.div>
  );
};

interface AgreeRowProps {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  required: boolean;
  to?: string;
  invalid?: boolean;
}

const AgreeRow = ({ checked, onChange, label, required, to, invalid }: AgreeRowProps) => (
  <div
    className={`flex items-center justify-between gap-2 rounded-lg px-1 transition-colors ${
      invalid ? "animate-shake bg-destructive/5 ring-1 ring-destructive/50" : ""
    }`}
  >
    <label className="flex items-center gap-2.5 py-1.5 cursor-pointer flex-1 min-w-0">
      <Checkbox
        checked={checked}
        onCheckedChange={(v) => onChange(Boolean(v))}
        className={invalid ? "border-destructive data-[state=checked]:bg-destructive data-[state=checked]:border-destructive" : ""}
      />
      <span className="text-xs text-foreground/90 truncate">
        <span
          className={
            invalid
              ? "text-destructive font-semibold"
              : required
                ? "text-accent font-semibold"
                : "text-muted-foreground font-semibold"
          }
        >
          [{required ? "필수" : "선택"}]
        </span>{" "}
        {label}
      </span>
    </label>
    {to && (
      <Link
        to={to}
        target="_blank"
        rel="noopener noreferrer"
        className={`shrink-0 flex items-center gap-0.5 text-[11px] transition-colors ${
          invalid ? "text-destructive hover:text-destructive/80" : "text-muted-foreground hover:text-accent"
        }`}
      >
        보기
        <ChevronRight className="h-3 w-3" />
      </Link>
    )}
  </div>
);

export default PhoneVerifyStep;
