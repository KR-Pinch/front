import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useMemo,
  useRef,
  useState,
} from "react";
import { Check, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import {
  PASSWORD_RULES,
  firstUnmetRule,
  getPasswordStrength,
  type PasswordRule,
} from "@/lib/passwordPolicy";

// Re-export for backwards compatibility with existing import sites.
export {
  PASSWORD_MIN,
  PASSWORD_MAX,
  PASSWORD_RULES,
  isPasswordValid,
  firstUnmetRule,
  getPasswordStrength,
  passwordPolicyMessage,
  requiredRulesSummary,
  type PasswordRule,
  type PasswordStrength,
} from "@/lib/passwordPolicy";

interface Props {
  password: string;
  /** 입력을 시작하기 전(빈 값)에는 메시지를 숨길지 여부 */
  hideWhenEmpty?: boolean;
  className?: string;
  /** aria-live 알림을 디바운스할 ms (기본 500). 키스트로크마다 시끄럽게 외치지 않도록. */
  announceDebounceMs?: number;
}

/** 부모가 호출할 수 있는 명령형 API. */
export interface PasswordStrengthMeterHandle {
  /** 첫 번째 미충족 규칙으로 포커스를 옮기고 즉시 announce. 모두 충족이면 false 반환. */
  focusFirstUnmet: () => boolean;
}

const ruleStatusText = (rule: PasswordRule, ok: boolean) =>
  `${rule.label} ${rule.required ? "(필수)" : "(선택)"} ${ok ? "충족" : "미충족"}`;

const PasswordStrengthMeter = forwardRef<PasswordStrengthMeterHandle, Props>(
  function PasswordStrengthMeter(
    { password, hideWhenEmpty = true, className = "", announceDebounceMs = 500 },
    ref
  ) {
    const strength = getPasswordStrength(password);
    const show = !hideWhenEmpty || password.length > 0;

    // Per-rule refs so we can move focus to the first unmet rule's row.
    const ruleRefs = useRef<Record<string, HTMLLIElement | null>>({});

    // Debounced summary announcement so screen readers don't speak on every keystroke.
    const summary = useMemo(() => {
      if (!password) return "";
      const required = PASSWORD_RULES.filter((r) => r.required);
      const metRequired = required.filter((r) => r.test(password)).length;
      const unmet = firstUnmetRule(password);
      const head = `비밀번호 강도 ${strength.label}, 필수 조건 ${metRequired}/${required.length} 충족.`;
      const tail = unmet
        ? ` 다음 조건이 남아 있습니다: ${unmet.label}.`
        : " 모든 필수 조건을 충족했습니다.";
      return head + tail;
    }, [password, strength.label]);

    const [liveMessage, setLiveMessage] = useState("");
    // An urgent message channel for things like "focus moved" — uses assertive.
    const [urgentMessage, setUrgentMessage] = useState("");

    useEffect(() => {
      if (!summary) {
        setLiveMessage("");
        return;
      }
      const t = window.setTimeout(() => {
        setLiveMessage(summary);
      }, announceDebounceMs);
      return () => window.clearTimeout(t);
    }, [summary, announceDebounceMs]);

    useImperativeHandle(
      ref,
      () => ({
        focusFirstUnmet: () => {
          const unmet = firstUnmetRule(password);
          if (!unmet) return false;
          const node = ruleRefs.current[unmet.key];
          if (node) {
            // tabIndex=-1 makes <li> focusable programmatically without
            // putting it in the tab order.
            node.focus();
            // Announce immediately + assertively, bypassing the debounce.
            setUrgentMessage(
              `포커스 이동: ${unmet.label} 조건이 충족되지 않았습니다.`
            );
            // Clear after a beat so repeated calls re-trigger SR.
            window.setTimeout(() => setUrgentMessage(""), 1200);
          }
          return true;
        },
      }),
      [password]
    );

    return (
      <>
        {/* Visually-hidden live regions. Always rendered (even when meter is
            hidden) so SR announcements work for the very first keystroke. */}
        <div className="sr-only" aria-live="polite" aria-atomic="true">
          {liveMessage}
        </div>
        <div className="sr-only" role="alert" aria-live="assertive" aria-atomic="true">
          {urgentMessage}
        </div>

        <AnimatePresence initial={false}>
          {show && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.15 }}
              className={`overflow-hidden ${className}`}
            >
              <div className="space-y-2 pt-2">
                {/* Strength bars */}
                <div className="flex items-center gap-2">
                  <div
                    className="flex flex-1 gap-1"
                    role="progressbar"
                    aria-label="비밀번호 강도"
                    aria-valuenow={strength.score}
                    aria-valuemin={0}
                    aria-valuemax={4}
                    aria-valuetext={strength.label}
                  >
                    {[0, 1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors duration-200 ${
                          i < strength.score ? strength.colorClass : "bg-secondary"
                        }`}
                      />
                    ))}
                  </div>
                  <span
                    className={`text-[10px] font-semibold tabular-nums ${
                      strength.score >= 3
                        ? "text-accent"
                        : strength.score === 2
                        ? "text-amber-500"
                        : "text-muted-foreground"
                    }`}
                    aria-hidden
                  >
                    {strength.label}
                  </span>
                </div>

                {/* Rule checklist */}
                <ul className="grid grid-cols-1 gap-1" aria-label="비밀번호 조건">
                  {PASSWORD_RULES.map((rule) => {
                    const ok = rule.test(password);
                    return (
                      <li
                        key={rule.key}
                        ref={(el) => (ruleRefs.current[rule.key] = el)}
                        tabIndex={-1}
                        aria-label={ruleStatusText(rule, ok)}
                        className={`flex items-center gap-1.5 text-[11px] transition-colors rounded-sm focus:outline-none focus:ring-2 focus:ring-accent/40 ${
                          ok
                            ? "text-foreground"
                            : rule.required
                            ? "text-muted-foreground"
                            : "text-muted-foreground/70"
                        }`}
                      >
                        <span
                          className={`flex h-3.5 w-3.5 items-center justify-center rounded-full transition-colors ${
                            ok
                              ? "bg-accent/20 text-accent"
                              : "bg-secondary text-muted-foreground"
                          }`}
                          aria-hidden
                        >
                          {ok ? (
                            <Check className="h-2.5 w-2.5" strokeWidth={3} />
                          ) : (
                            <X className="h-2.5 w-2.5" strokeWidth={3} />
                          )}
                        </span>
                        <span aria-hidden>
                          {rule.label}
                          {!rule.required && (
                            <span className="ml-1 text-muted-foreground/60">
                              (선택)
                            </span>
                          )}
                        </span>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  }
);

export default PasswordStrengthMeter;
