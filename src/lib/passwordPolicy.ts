/**
 * Single source of truth for the app's password policy.
 *
 * Edit `PASSWORD_RULES` (and the constants below) here and every consumer —
 * the strength meter, the policy summary component, signup/reset forms,
 * error toasts — picks up the new rules automatically.
 *
 * Frontend mock only. The real signup/reset API MUST re-validate with the
 * same rules server-side.
 */

export const PASSWORD_MIN = 8;
export const PASSWORD_MAX = 64;

export interface PasswordRule {
  key: string;
  /** 사용자에게 보여지는 짧은 라벨 (체크리스트, 요약 컴포넌트, 토스트에서 재사용) */
  label: string;
  /** 통과해야만 form 제출이 가능한 필수 규칙인지 */
  required: boolean;
  test: (pw: string) => boolean;
}

export const PASSWORD_RULES: PasswordRule[] = [
  {
    key: "length",
    label: `${PASSWORD_MIN}자 이상 ${PASSWORD_MAX}자 이하`,
    required: true,
    test: (pw) => pw.length >= PASSWORD_MIN && pw.length <= PASSWORD_MAX,
  },
  {
    key: "no-space",
    label: "공백 없음",
    required: true,
    test: (pw) => pw.length > 0 && !/\s/.test(pw),
  },
  {
    key: "letter",
    label: "영문 포함",
    required: true,
    test: (pw) => /[A-Za-z]/.test(pw),
  },
  {
    key: "digit",
    label: "숫자 포함",
    required: true,
    test: (pw) => /\d/.test(pw),
  },
  {
    key: "symbol",
    label: "특수문자 포함",
    required: false,
    test: (pw) => /[^A-Za-z0-9\s]/.test(pw),
  },
];

export const isPasswordValid = (pw: string): boolean =>
  PASSWORD_RULES.filter((r) => r.required).every((r) => r.test(pw));

/** 미충족 규칙 중 첫 번째 (필수 우선, 그다음 권장). */
export const firstUnmetRule = (pw: string): PasswordRule | null => {
  const required = PASSWORD_RULES.filter((r) => r.required && !r.test(pw));
  if (required.length > 0) return required[0];
  const optional = PASSWORD_RULES.filter((r) => !r.required && !r.test(pw));
  return optional[0] ?? null;
};

export type PasswordStrength = {
  score: 0 | 1 | 2 | 3 | 4;
  label: string;
  /** semantic token color class */
  colorClass: string;
};

export const getPasswordStrength = (pw: string): PasswordStrength => {
  if (!pw) return { score: 0, label: "비어 있음", colorClass: "bg-muted" };

  let score = 0;
  if (pw.length >= PASSWORD_MIN) score++;
  if (pw.length >= 12) score++;
  if (/[A-Za-z]/.test(pw) && /\d/.test(pw)) score++;
  if (/[^A-Za-z0-9\s]/.test(pw)) score++;
  if (/\s/.test(pw)) score = Math.min(score, 1);

  const clamped = Math.min(4, score) as 0 | 1 | 2 | 3 | 4;
  const map: Record<0 | 1 | 2 | 3 | 4, { label: string; colorClass: string }> = {
    0: { label: "매우 약함", colorClass: "bg-destructive" },
    1: { label: "약함", colorClass: "bg-destructive/80" },
    2: { label: "보통", colorClass: "bg-amber-500" },
    3: { label: "강함", colorClass: "bg-emerald-500" },
    4: { label: "매우 강함", colorClass: "bg-accent" },
  };
  return { score: clamped, ...map[clamped] };
};

/* ------------------------------------------------------------------ */
/* 재사용 가능한 표시용 문자열                                          */
/* ------------------------------------------------------------------ */

/** 모든 필수 규칙 라벨을 ", "로 이은 한 줄 (헤더, 툴팁 등). */
export const requiredRulesSummary = (): string =>
  PASSWORD_RULES.filter((r) => r.required)
    .map((r) => r.label)
    .join(", ");

/**
 * 화면별 PasswordPolicySummary 표시 프리셋.
 * - signup/reset/toast 어디서든 같은 길이 정책으로 일관되게 보이도록 통일.
 * - 컴포넌트 props로 펼쳐 쓰면 됨: <PasswordPolicySummary {...POLICY_SUMMARY_PRESETS.signup} />
 */
export const POLICY_SUMMARY_PRESETS = {
  /** 가입 폼: 입력 전 기본 안내. 모바일에서도 한 줄 가깝게 유지. */
  signup: {
    variant: "inline" as const,
    size: "sm" as const,
    optionalLabel: "short" as const,
    collapseAfter: 3,
    defaultExpanded: false,
    showHeader: true,
  },
  /** 재설정 모달: 가입과 동일하게 짧게. */
  reset: {
    variant: "inline" as const,
    size: "sm" as const,
    optionalLabel: "short" as const,
    collapseAfter: 3,
    defaultExpanded: false,
    showHeader: true,
  },
  /** 토스트 description 내부: 매우 컴팩트, 헤더 없음. */
  toast: {
    variant: "inline" as const,
    size: "sm" as const,
    optionalLabel: "none" as const,
    collapseAfter: 3,
    defaultExpanded: false,
    showHeader: false,
    includeOptional: false,
  },
  /** 카드(설정/도움말 등): 충분히 펼친 상태. */
  card: {
    variant: "card" as const,
    size: "md" as const,
    optionalLabel: "badge" as const,
    collapseAfter: 4,
    defaultExpanded: false,
    showHeader: true,
  },
} as const;

/**
 * 토스트/에러 메시지에서 쓰는 안내 문구.
 * - 비밀번호가 비었을 때 / 정책 위반일 때 모두 동일한 상위 헤더 사용.
 * - 첫 번째 미충족 규칙을 구체적으로 안내.
 */
export const passwordPolicyMessage = (
  pw: string
): { title: string; description: string } => {
  const unmet = firstUnmetRule(pw);
  return {
    title: "비밀번호 조건을 확인해 주세요",
    description: unmet
      ? `다음 조건이 충족되지 않았습니다: ${unmet.label}${
          unmet.required ? "" : " (선택)"
        }.`
      : `필수 조건: ${requiredRulesSummary()}.`,
  };
};

