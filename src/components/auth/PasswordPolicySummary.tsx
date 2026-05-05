import { useId, useState } from "react";
import { ShieldCheck, ChevronDown } from "lucide-react";
import { AnimatePresence, motion } from "framer-motion";
import { PASSWORD_RULES } from "@/lib/passwordPolicy";

type Size = "sm" | "md" | "lg";

interface Props {
  /** 카드 박스/아이콘 없이 텍스트 한 줄만 보여주기 (예: 라벨 옆 힌트). */
  variant?: "card" | "inline";
  /** 글자/패딩 크기. 기본 'md'. */
  size?: Size;
  /** 카드 헤더(아이콘+제목) 표시 여부. 기본 true. inline에서는 무시. */
  showHeader?: boolean;
  /** 헤더 라벨 커스터마이즈. */
  headerLabel?: string;
  /** 권장(선택) 규칙도 같이 보여줄지. 기본 true. */
  includeOptional?: boolean;
  /**
   * 선택 규칙의 '(선택)' 표기 스타일.
   * - 'full'   : "(선택)" — 기본
   * - 'short'  : "*"     — 모바일에 적합한 최소 표기
   * - 'badge'  : 작은 배지 칩
   * - 'none'   : 표기 생략
   */
  optionalLabel?: "full" | "short" | "badge" | "none";
  /**
   * 이 개수를 초과하는 규칙은 접고 '더 보기'로 확장.
   * 0/undefined면 모두 표시. 필수 규칙은 항상 우선 노출되며
   * 필수 개수보다 작게 지정해도 최소한 필수 규칙은 다 보입니다.
   */
  collapseAfter?: number;
  /** 처음에 펼친 상태로 시작할지. 기본 false. */
  defaultExpanded?: boolean;
  className?: string;
}

/**
 * '(선택)' 표기를 렌더.
 *
 * 접근성 원칙:
 * - 시각 글리프('*', 'opt')는 의미 없는 장식 → `aria-hidden`으로 SR에서 숨김.
 * - 의미는 항상 `<span class="sr-only">선택 규칙(필수 아님)</span>`으로 전달.
 * - `title`은 마우스 사용자 전용 툴팁(짧고 구체적)으로 분리. SR은 aria-label/sr-only를 우선 읽음.
 * - 'full' 모드는 시각 텍스트 자체가 "(선택)"이라 별도 sr-only 불필요.
 */
const OPTIONAL_SR_TEXT = "선택 규칙(필수 아님)";
const OPTIONAL_TOOLTIP = "필수가 아닌 권장 규칙입니다";

const OptionalMark = ({
  style,
  className = "",
}: {
  style: NonNullable<Props["optionalLabel"]>;
  className?: string;
}) => {
  if (style === "none") {
    // SR 사용자에게는 여전히 의미를 알려줌(시각만 생략).
    return <span className="sr-only">{` ${OPTIONAL_SR_TEXT}`}</span>;
  }
  if (style === "short") {
    return (
      <span
        role="img"
        aria-label={OPTIONAL_SR_TEXT}
        title={OPTIONAL_TOOLTIP}
        className={`ml-0.5 text-muted-foreground/60 ${className}`}
      >
        <span aria-hidden="true">*</span>
      </span>
    );
  }
  if (style === "badge") {
    return (
      <span
        role="img"
        aria-label={OPTIONAL_SR_TEXT}
        title={OPTIONAL_TOOLTIP}
        className={`ml-1 inline-flex items-center rounded-sm border border-border/60 px-1 py-px text-[9px] uppercase tracking-wide text-muted-foreground/70 ${className}`}
      >
        <span aria-hidden="true">opt</span>
      </span>
    );
  }
  // full: 시각 텍스트 자체가 의미 전달 → aria 중복 방지.
  return (
    <span
      title={OPTIONAL_TOOLTIP}
      className={`ml-0.5 text-muted-foreground/60 ${className}`}
    >
      (선택)
    </span>
  );
};

const SIZE_TOKENS: Record<
  Size,
  {
    text: string;
    headerText: string;
    icon: string;
    padding: string;
    gap: string;
    headerMb: string;
    radius: string;
  }
> = {
  sm: {
    text: "text-[10px]",
    headerText: "text-[10px]",
    icon: "h-3 w-3",
    padding: "p-2",
    gap: "gap-0.5",
    headerMb: "mb-1",
    radius: "rounded-lg",
  },
  md: {
    text: "text-[11px]",
    headerText: "text-[11px]",
    icon: "h-3.5 w-3.5",
    padding: "p-3",
    gap: "gap-0.5",
    headerMb: "mb-1.5",
    radius: "rounded-xl",
  },
  lg: {
    text: "text-xs",
    headerText: "text-sm",
    icon: "h-4 w-4",
    padding: "p-4",
    gap: "gap-1",
    headerMb: "mb-2",
    radius: "rounded-2xl",
  },
};

/**
 * 비밀번호 정책 요약 — `PASSWORD_RULES`에서 자동 생성됩니다.
 * 정책을 바꾸려면 `src/lib/passwordPolicy.ts`만 수정하면 됩니다.
 */
const PasswordPolicySummary = ({
  variant = "card",
  size = "md",
  showHeader = true,
  headerLabel = "비밀번호 정책",
  includeOptional = true,
  optionalLabel = "full",
  collapseAfter,
  defaultExpanded = false,
  className = "",
}: Props) => {
  const required = PASSWORD_RULES.filter((r) => r.required);
  const optional = includeOptional
    ? PASSWORD_RULES.filter((r) => !r.required)
    : [];
  const tokens = SIZE_TOKENS[size];
  const regionId = useId();
  const [expanded, setExpanded] = useState(defaultExpanded);

  // 표시 순서: 필수 → 선택. 필수 규칙은 항상 보장.
  const all = [
    ...required.map((r) => ({ rule: r, optional: false })),
    ...optional.map((r) => ({ rule: r, optional: true })),
  ];
  const limit =
    typeof collapseAfter === "number" && collapseAfter > 0
      ? Math.max(collapseAfter, required.length)
      : 0;
  const collapsible = limit > 0 && all.length > limit;
  const visibleCount = collapsible && !expanded ? limit : all.length;
  const visible = all.slice(0, visibleCount);
  const hidden = all.slice(visibleCount);
  const hiddenCount = hidden.length;

  const toggleBtn = collapsible ? (
    <button
      type="button"
      onClick={() => setExpanded((v) => !v)}
      aria-expanded={expanded}
      aria-controls={regionId}
      className={`inline-flex items-center gap-0.5 rounded-md font-medium text-accent hover:text-accent/80 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-accent/60 transition-colors ${tokens.text} shrink-0`}
    >
      {expanded ? "접기" : `더 보기 +${hiddenCount}`}
      <ChevronDown
        className={`h-3 w-3 transition-transform ${
          expanded ? "rotate-180" : ""
        }`}
        aria-hidden
      />
    </button>
  ) : null;

  if (variant === "inline") {
    // 모바일: 한 줄로 길어지지 않도록 칩 형태로 wrap.
    return (
      <div
        className={`flex flex-wrap items-center gap-x-1.5 gap-y-1 ${tokens.text} text-muted-foreground ${className}`}
      >
        {showHeader && (
          <span className="font-medium text-foreground/80 shrink-0">
            {headerLabel}
          </span>
        )}
        {visible.map(({ rule, optional: isOpt }, i) => (
          <span
            key={rule.key}
            className={`inline-flex items-center gap-1 shrink-0 break-keep ${
              isOpt ? "text-muted-foreground/70" : ""
            }`}
          >
            {(showHeader || i > 0) && (
              <span aria-hidden className="text-muted-foreground/40">
                ·
              </span>
            )}
            <span>
              {rule.label}
              {isOpt && <OptionalMark style={optionalLabel} />}
            </span>
          </span>
        ))}
        {/* 접힌 규칙은 동일 줄 흐름에 append */}
        <AnimatePresence initial={false}>
          {expanded &&
            hidden.map(({ rule, optional: isOpt }) => (
              <motion.span
                key={rule.key}
                initial={{ opacity: 0, y: -2 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -2 }}
                transition={{ duration: 0.15 }}
                className={`inline-flex items-center gap-1 shrink-0 break-keep ${
                  isOpt ? "text-muted-foreground/70" : ""
                }`}
                id={regionId}
              >
                <span aria-hidden className="text-muted-foreground/40">
                  ·
                </span>
                <span>
                  {rule.label}
                  {isOpt && <OptionalMark style={optionalLabel} />}
                </span>
              </motion.span>
            ))}
        </AnimatePresence>
        {toggleBtn}
      </div>
    );
  }

  return (
    <div
      className={`${tokens.radius} border border-border bg-secondary/40 ${tokens.padding} ${className}`}
    >
      {showHeader && (
        <div className={`flex items-center gap-1.5 ${tokens.headerMb}`}>
          <ShieldCheck
            className={`${tokens.icon} text-accent shrink-0`}
            aria-hidden
          />
          <p
            className={`${tokens.headerText} font-semibold text-foreground break-keep`}
          >
            {headerLabel}
          </p>
        </div>
      )}
      <ul
        className={`grid ${tokens.gap} ${tokens.text} text-muted-foreground`}
      >
        {visible.map(({ rule, optional: isOpt }) => (
          <li
            key={rule.key}
            className={`flex gap-1.5 break-keep ${
              isOpt ? "text-muted-foreground/70" : ""
            }`}
          >
            <span
              className={`shrink-0 ${isOpt ? "" : "text-accent"}`}
              aria-hidden
            >
              ·
            </span>
            <span className="leading-snug">
              {rule.label}
              {isOpt && <OptionalMark style={optionalLabel} className="ml-1" />}
            </span>
          </li>
        ))}
        <AnimatePresence initial={false}>
          {expanded && hidden.length > 0 && (
            <motion.div
              key="hidden"
              id={regionId}
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <ul className={`grid ${tokens.gap}`}>
                {hidden.map(({ rule, optional: isOpt }) => (
                  <li
                    key={rule.key}
                    className={`flex gap-1.5 break-keep ${
                      isOpt ? "text-muted-foreground/70" : ""
                    }`}
                  >
                    <span
                      className={`shrink-0 ${isOpt ? "" : "text-accent"}`}
                      aria-hidden
                    >
                      ·
                    </span>
                    <span className="leading-snug">
                      {rule.label}
                      {isOpt && (
                        <OptionalMark style={optionalLabel} className="ml-1" />
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            </motion.div>
          )}
        </AnimatePresence>
      </ul>
      {collapsible && <div className="mt-1.5">{toggleBtn}</div>}
    </div>
  );
};

export default PasswordPolicySummary;
