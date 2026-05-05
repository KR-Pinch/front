import { useState } from "react";
import { motion } from "framer-motion";
import SignupInfoStep from "./SignupInfoStep";
import PhoneVerifyStep from "./PhoneVerifyStep";
import AuthSocialButtons from "./AuthSocialButtons";
import WelcomeModal from "./WelcomeModal";
import { useAuth } from "@/hooks/useAuth";

export type SignupStep = "info" | "phone";

const AuthSignupFlow = () => {
  const [step, setStep] = useState<SignupStep>("info");
  const [showWelcome, setShowWelcome] = useState(false);
  const { login } = useAuth();
  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    phone: "",
  });

  const updateField = (field: string, value: string) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const stepIndex = ["info", "phone"].indexOf(step);

  return (
    <motion.div
      className="space-y-4"
      initial={{ opacity: 0, x: 10 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -10 }}
      transition={{ duration: 0.15 }}
    >
      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {["기본정보", "휴대폰 인증"].map((label, i) => (
          <div key={label} className="flex-1 flex flex-col items-center gap-1.5">
            <div
              className={`h-1.5 w-full rounded-full transition-all duration-300 ${
                i <= stepIndex ? "bg-accent" : "bg-secondary"
              }`}
            />
            <span
              className={`text-[10px] font-medium transition-colors ${
                i === stepIndex ? "text-accent" : "text-muted-foreground/60"
              }`}
            >
              {label}
            </span>
          </div>
        ))}
      </div>

      {step === "info" && (
        <SignupInfoStep
          formData={formData}
          updateField={updateField}
          onNext={() => setStep("phone")}
        />
      )}
      {step === "phone" && (
        <PhoneVerifyStep
          phone={formData.phone}
          setPhone={(v) => updateField("phone", v)}
          onNext={() => {
            console.log("signup complete", formData);
            // Mock auto-login on signup completion
            const name = formData.username || formData.email.split("@")[0] || "회원";
            login({
              username: name,
              avatar: name.charAt(0).toUpperCase(),
            });
            setShowWelcome(true);
          }}
          onBack={() => setStep("info")}
        />
      )}

      {step === "info" && <AuthSocialButtons />}

      <WelcomeModal
        open={showWelcome}
        username={formData.username}
        onClose={() => setShowWelcome(false)}
        redirectTo="/"
        redirectDelay={3500}
      />
    </motion.div>
  );
};

export default AuthSignupFlow;
