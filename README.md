# PICKS

> 모든 의견이 남지 않습니다. 오직 선택된 하나만 남습니다.

**PICKS**는 매일 단 하나의 핫이슈에 대해, 사용자가 하루에 단 하나의 의견(=PICK)만 남길 수 있는 한국어 토론 플랫폼입니다. 자정(KST 기준)에 가장 많은 공감을 받은 PICK 하나만 아카이브에 영구 기록되고, 나머지 의견은 모두 사라집니다.

- 사용자 1명 = 하루 1 PICK
- 매일 KST 자정에 잠금 해제 / 마감
- 그날의 1위 PICK만 아카이브로 박제
- 누적 1위 횟수·공감 수로 주간/월간 랭킹 산출

---

## 핵심 컨셉

| 항목 | 규칙 |
|---|---|
| 토론 주기 | 매일 1개 토픽 (카테고리별 핫토픽 + 전체 1위 토픽) |
| 발언 한도 | 사용자당 하루 1개의 PICK (수정/삭제 불가) |
| 마감 시점 | **KST(Asia/Seoul, UTC+9) 자정** — 전 세계 사용자가 같은 순간에 잠김/해제 |
| 아카이브 | 마감 시점 기준 최다 공감 PICK 1건만 영구 보존 |
| 랭킹 | 1위 채택 횟수와 누적 공감을 합산해 주간/월간 산정 |

용어 정의
- **PICK**: 한 사용자가 그날 남기는 단 하나의 의견
- **PICKS**: 그날 모인 의견 모음 (마감 후 1개만 살아남음)

---

## 주요 기능

- **오늘의 토픽**: 카테고리별(정치/테크/사회/문화/경제/스포츠) 일일 핫토픽
- **PICK 작성**: 1인 1일 1회 제한. 다중 탭/브라우저 동시 제출에도 깨지지 않는 클라이언트 동시성 가드
- **실시간 카운트다운**: KST 자정까지 남은 시간을 HH:MM:SS로 라이브 표시
- **아카이브**: 지난 날의 1위 PICK 모음
- **랭킹**: 주간/월간 베스트 사용자
- **인증 UI**: 이메일/소셜 로그인, 비밀번호 강도 미터, 휴대폰 인증, 약관 동의
- **관리자 콘솔**: 토픽 등록·교체, 카테고리별/전체 토픽 강제 지정
- **테마**: 라이트/다크 토글 (시스템 설정 + localStorage 우선)
- **반응형 셸**: 모바일은 BottomNav, md+에서는 사이드바, xl+에서는 우측 레일 추가
- **브랜드 가드**: `BrandText`/스캐너로 "한마디" 등 레거시 표기를 자동 차단

---

## 기술 스택

- **프레임워크**: React 18 + Vite 5 + TypeScript 5
- **스타일**: Tailwind CSS v3, shadcn/ui (Radix UI 기반), `index.css`의 시맨틱 디자인 토큰 (HSL)
- **애니메이션**: framer-motion (페이지 전환은 `AnimatePresence`)
- **라우팅**: react-router-dom v6
- **폼/검증**: react-hook-form + zod
- **상태/데이터**: @tanstack/react-query, localStorage 기반 mock store
- **테스트**: Vitest (단위), Playwright (E2E 픽스처)
- **타이포**: Space Grotesk(영문/숫자) + Noto Sans KR(한글)

> 백엔드는 현재 프론트 목업 단계입니다. 인증·토픽·PICK 데이터는 mock + localStorage로 구현되어 있고, 실제 백엔드는 추후 연동될 예정입니다.

---

## 라우트

| 경로 | 설명 | 보호 |
|---|---|---|
| `/` | 홈 — 카테고리별 오늘의 토픽 | 공개 |
| `/topic` | 토픽 상세 + PICK 작성/공감 | 공개 (작성은 로그인 필요) |
| `/archive` | 지난 1위 PICK 아카이브 | 공개 |
| `/ranking` | 주간/월간 랭킹 | 공개 |
| `/auth` | 로그인 / 회원가입 | 공개 |
| `/mypage` | 내 PICK 기록 | 로그인 필요 |
| `/settings` | 계정/알림 설정 | 로그인 필요 |
| `/legal/:slug`, `/terms`, `/privacy` | 약관·개인정보처리방침 | 공개 |
| `/admin/login`, `/admin` | 관리자 콘솔 | 관리자 인증 필요 |

---

## "하루 1 PICK" 동작 방식

1. PICK을 제출하면 KST 자정 기준의 day-stamp 키로 `localStorage`에 기록됩니다 (`getKstDayStamp`).
2. 페이지 로드 시 같은 키가 있으면 입력창과 제출 버튼을 비활성화하고, 다음 잠금 해제 시각까지의 카운트다운을 표시합니다.
3. 같은 사용자가 여러 탭/브라우저에서 동시에 제출해도, 제출 직전 키 재확인 + 단일 in-flight 가드로 한 번만 반영됩니다.
4. KST 자정이 지나면 day-stamp 키가 자동으로 바뀌어 입력이 다시 열립니다 (사용자의 로컬 시간대 무관).

관련 헬퍼: `src/data/mockData.ts`
- `getKstDayStamp(now?)` — KST 기준 `YYYY-M-D`
- `getTopicDeadline(topic?)` — 다음 KST 자정 (Date)
- `isTopicClosed(topic?, now?)` — 마감 여부
- `formatRemainingClock(deadline, now?)` — `HH:MM:SS`

테스트: `src/data/__tests__/topicDeadline.test.ts`, `src/data/__tests__/todayKey.test.ts` (KST/UTC/EST 시뮬레이션 포함)

---

## 디자인 시스템

- 2026 미래지향 다크 에디토리얼 톤. 벤토 그리드, 글래스모피즘, 노이즈 텍스처, 골드 뉴럴 네트워크 히어로 캔버스.
- **컴포넌트에서 raw 컬러 클래스(`text-white`, `bg-black` 등) 금지**. `index.css`에 정의된 시맨틱 토큰(`--background`, `--primary`, `--accent` …)과 Tailwind 시맨틱 유틸만 사용합니다.
- 반응형 셸 가시성은 `mobile-only` / `tablet-up` / `wide-up-flex` / `page-sticky-header` / `shell-top-bar` 등 시맨틱 유틸로 분기합니다 (`md:hidden` 같은 raw 분기 금지).
- 페이지 컨텐츠 스케일은 `page-reading` / `page-list` / `card-grid` / `page-heading` 유틸을 사용합니다.
- 브랜드 로고는 항상 `<PicksLogo />` / `<PicksMark />` 사용. 워드마크는 `.brand-wordmark` + 내부 `text-gradient`.

---

## 프로젝트 구조

```
src/
  App.tsx                    # 라우트 정의
  main.tsx                   # 엔트리
  index.css                  # 시맨틱 토큰 + 반응형 유틸
  brand/                     # PICKS 브랜드 용어 시스템 (terms, BrandText, 스캐너)
  components/
    shell/                   # AppShell, AppSidebar, RightRail, SiteFooter
    auth/                    # 로그인/회원가입/비밀번호 정책 UI
    admin/                   # 관리자 보호 라우트
    brand/                   # PicksLogo, PicksMark
    topic/                   # HeartBurst 등 토픽 상호작용
    ui/                      # shadcn/ui 컴포넌트
    BottomNav.tsx, ThemeToggle.tsx, ParticleField.tsx, ...
  pages/                     # Index, Topic, Archive, Ranking, Auth, MyPage, Settings, Legal, Admin, ...
  data/
    mockData.ts              # 토픽/댓글/랭킹 mock + KST 데드라인 헬퍼
    adminData.ts             # 관리자 콘솔용 store + 이벤트
    myPageData.ts, legalContent.ts
    __tests__/               # KST 데드라인/today-key 테스트
  hooks/                     # useAuth, useAdminAuth, use-mobile, use-toast
  lib/                       # passwordPolicy, utils
scripts/scan-brand-terms.mjs # 레거시 브랜드 표기 스캐너
reports/                     # 스캐너 리포트
docs/                        # 컴포넌트/QA 체크리스트
```

---

## 개발

```bash
# 의존성
npm i

# 개발 서버
npm run dev

# 프로덕션 빌드
npm run build

# 린트
npm run lint

# 테스트
npm run test          # 1회 실행
npm run test:watch    # watch 모드

# 브랜드 용어 스캐너 (레거시 표기 검출)
npm run scan:brand
```

---

## 관리자

기본 자격증명 (프론트 목업 전용 — 실배포 전 반드시 백엔드 인증으로 교체):

```
username: admin
password: admin1234
```

`/admin/login`에서 로그인 후 `/admin`에서 토픽 등록·교체 및 카테고리별/전체 강제 지정이 가능합니다.

---

## 배포

- Preview: https://id-preview--4aa85271-7e20-4d0b-8d09-96c9a22c5acb.lovable.app
- Published: https://hot-topic-today.lovable.app

Lovable 프로젝트에서 Publish 버튼으로 배포합니다.
