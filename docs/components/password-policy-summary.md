# PasswordPolicySummary

`src/components/auth/PasswordPolicySummary.tsx`에 정의된 비밀번호 정책 요약 컴포넌트입니다.
`PASSWORD_RULES`(`src/lib/passwordPolicy.ts`)에서 자동으로 항목이 생성되므로,
정책을 바꾸려면 해당 파일만 수정하면 가입/재설정/토스트가 일괄 반영됩니다.

화면별 표준 프리셋은 `POLICY_SUMMARY_PRESETS`(signup / reset / toast / card)에서
가져와 사용하세요. 일관된 길이·톤이 보장됩니다.

---

## Props 요약

| Prop | 타입 | 기본 | 설명 |
|---|---|---|---|
| `variant` | `"card" \| "inline"` | `"card"` | 박스 카드 또는 텍스트 흐름 |
| `size` | `"sm" \| "md" \| "lg"` | `"md"` | 글자/패딩 크기 |
| `showHeader` | `boolean` | `true` | 헤더(아이콘+제목) 표시 |
| `headerLabel` | `string` | `"비밀번호 정책"` | 헤더 라벨 |
| `includeOptional` | `boolean` | `true` | 선택(권장) 규칙 포함 |
| `optionalLabel` | `"full" \| "short" \| "badge" \| "none"` | `"full"` | 선택 표기 방식 |
| `collapseAfter` | `number` | — | 초과분은 '더 보기'로 접기. 필수 규칙은 항상 노출 |
| `defaultExpanded` | `boolean` | `false` | 처음에 펼친 상태로 시작 |
| `className` | `string` | `""` | 추가 클래스 |

`optionalLabel`별 시각/접근성:

- `full`  → `(선택)` 텍스트 노출.
- `short` → `*` 글리프 + `aria-label="선택 규칙(필수 아님)"` + 툴팁.
- `badge` → 작은 `OPT` 칩 + 동일 aria.
- `none`  → 시각적으로 숨기되 SR 사용자에겐 sr-only로 의미 전달.

---

## 모바일에서 `optionalLabel="short"` 예시

좁은 폭(360–414px)에서는 `(선택)`이 줄을 잡아먹습니다.
가입/재설정 폼에서는 아래처럼 **inline + sm + short + collapseAfter=3** 조합이 가장 자연스럽습니다.

```tsx
import PasswordPolicySummary from "@/components/auth/PasswordPolicySummary";

// 비밀번호 입력 전 안내 (모바일 친화)
{!password && (
  <PasswordPolicySummary
    variant="inline"
    size="sm"
    optionalLabel="short"
    collapseAfter={3}
    showHeader
  />
)}
```

렌더 결과 (모바일 폭 기준):

```
비밀번호 정책 · 8자 이상 · 영문 포함 · 숫자 포함  더 보기 +2
```

펼친 상태:

```
비밀번호 정책 · 8자 이상 · 영문 포함 · 숫자 포함 · 특수문자* · 대문자*  접기
```

> `*`는 시각 글리프이며 스크린리더는 "선택 규칙(필수 아님)"으로 읽습니다.
> 마우스 호버 시 툴팁으로 "필수가 아닌 권장 규칙입니다"가 노출됩니다.

### 표준 프리셋으로 줄여 쓰기

`POLICY_SUMMARY_PRESETS.signup` / `.reset`이 위 조합과 동일합니다.
가입·재설정·토스트가 같은 길이로 통일되도록 가급적 프리셋을 사용하세요.

```tsx
import PasswordPolicySummary from "@/components/auth/PasswordPolicySummary";
import { POLICY_SUMMARY_PRESETS } from "@/lib/passwordPolicy";

<PasswordPolicySummary {...POLICY_SUMMARY_PRESETS.signup} />
<PasswordPolicySummary {...POLICY_SUMMARY_PRESETS.reset} />
<PasswordPolicySummary {...POLICY_SUMMARY_PRESETS.toast} />
```

---

## 다른 화면별 권장 조합

| 컨텍스트 | 권장 조합 | 비고 |
|---|---|---|
| 모바일 폼 안내 | `inline` + `sm` + `short` + `collapseAfter={3}` | `signup`/`reset` 프리셋 |
| 토스트 description | `inline` + `sm` + `none` + `showHeader={false}` + `includeOptional={false}` | `toast` 프리셋, 매우 컴팩트 |
| 설정/도움말 카드 | `card` + `md` + `badge` + `collapseAfter={4}` | `card` 프리셋, OPT 배지로 명확 |
| 데스크톱 사이드 패널 | `card` + `lg` + `full` | 충분한 폭에서는 풀 텍스트 가독성 우선 |

---

## 접근성 체크리스트

- [x] 시각 글리프(`*`, `OPT`)는 `aria-hidden`으로 숨김.
- [x] 의미는 `aria-label="선택 규칙(필수 아님)"`로 전달.
- [x] 마우스 툴팁(`title`)은 더 설명적인 문구로 분리.
- [x] '더 보기' 토글은 `aria-expanded`/`aria-controls` 연결.
- [x] 한국어 줄바꿈은 `break-keep`으로 단어 중간 끊김 방지.
