# PINCH — Frontend

> 한국형 일일 토론 플랫폼 **PINCH** 의 프론트엔드 저장소.
> 서비스 소개는 [`secret/README.md`](secret/README.md) 참고. 이 문서는 **코드 구조와 규칙** 만 다룹니다.

[▲ Live](https://usepinch.lovable.app)

---

## 1. Tech Stack

| 영역 | 사용 기술 |
| :-- | :-- |
| Core | React 18 · TypeScript 5 · Vite 5 |
| Routing | `react-router-dom` v6 |
| Styling | Tailwind CSS v3 + HSL 시맨틱 토큰 (`src/index.css`) |
| UI | shadcn/ui + Radix UI |
| Animation | framer-motion (AnimatePresence 기반 페이지 전환) |
| Icons | lucide-react (단일 매핑: `src/config/navIcons.ts`) |
| Forms | react-hook-form + zod |
| Data | @tanstack/react-query |
| Notifications | sonner + shadcn toast |
| Date | date-fns (KST 자정 기준 마감/롤오버) |
| Test | Vitest + Testing Library + Playwright |
| Lint | ESLint + 자체 브랜드 용어 스캐너 |

> Backend는 MySQL 8.x 기준 설계 문서와 초기 SQL을 [`backend/`](backend/README.md)에 둡니다.

---

## 2. Directory Map

```
src/
├── pages/                  # 라우트 단위 화면
│   ├── Index.tsx           # /         홈 — 오늘의 HOT 토픽 + 카테고리 + 주간 랭킹
│   ├── Topic.tsx           # /topic    오늘의 PINCH 작성/조회 (1인 1 PINCH / KST 자정 마감)
│   ├── Archive.tsx         # /archive  아카이브 (검색·필터·딥링크 다이얼로그)
│   ├── Ranking.tsx         # /ranking  똑똑이 랭킹 (주간/월간)
│   ├── MyPage.tsx          # /mypage   내 PINCH · 받은 좋아요 · 연속 참여
│   ├── Settings.tsx        # /settings 테마 · 알림 · 계정
│   ├── Auth.tsx            # /auth     로그인 / 회원가입 / 전화번호 인증
│   ├── Admin.tsx           # /admin    토픽/유저/신고 모더레이션
│   └── Legal.tsx           # /legal/*  약관 · 개인정보 처리방침
│
├── components/
│   ├── shell/              # 앱 셸 (AppShell · AppSidebar · BottomNav · RightRail · SiteFooter)
│   ├── brand/              # 브랜드 락업 단일 소스 (PinchLogo, PinchMark)
│   ├── auth/               # 로그인/회원가입/비밀번호 정책 UI
│   ├── topic/              # 토픽 상세 인터랙션 (HeartBurst 등)
│   ├── onboarding/         # 첫 방문 온보딩
│   ├── admin/              # ProtectedAdminRoute
│   └── ui/                 # shadcn primitives
│
├── brand/                  # 브랜드 용어 시스템
│   ├── terms.mjs           # 단일 소스 (서비스명 / 한 PINCH / 레거시 매핑)
│   ├── BrandText.tsx       # 런타임 치환 컴포넌트
│   ├── BrandAuditOverlay   # 개발 중 표기 위반 오버레이
│   └── remoteAudit.ts      # 외부 페이지 표기 검증 유틸
│
├── config/navIcons.ts      # 네비게이션 아이콘 단일 매핑
├── data/                   # mock 데이터 + 도메인 계산 (랭킹/패널티/마감)
│   ├── mockData.ts         # useRanking() — archived_invalid 패널티 자동 적용
│   ├── adminData.ts        # 토픽 교체/신고 모킹
│   ├── myPageData.ts
│   ├── pinchMetrics.ts
│   └── legalContent.ts
├── hooks/                  # useAuth · useAdminAuth · use-toast · use-mobile
├── lib/                    # passwordPolicy, utils
└── index.css               # HSL 디자인 토큰 + 시맨틱 반응형 유틸
```

---

## 3. Routes

| Path | Page | 비고 |
| :-- | :-- | :-- |
| `/` | Index | LIVE NOW 배너 + Hot 카드 + 주간 랭킹 |
| `/topic` | Topic | 1인 1 PINCH · 자정 마감 · 500자 카운터 |
| `/archive` | Archive | 카테고리/날짜 필터 · 딥링크 |
| `/ranking` | Ranking | 주간/월간 토글 · `useRanking(period)` |
| `/mypage` | MyPage | 내 PINCH/받은 좋아요/연속 참여 |
| `/settings` | Settings | 테마·알림·계정 |
| `/auth` | Auth | 이메일/전화/소셜 |
| `/admin` | Admin | `ProtectedAdminRoute` 로 가드 |
| `/legal/:slug` | Legal | 마크다운 기반 약관 렌더 |

---

## 4. 디자인 시스템 규칙

- **컴포넌트에서 raw color 클래스 금지** (`text-white`, `bg-black` 등). 모두 `index.css` 의 HSL 시맨틱 토큰만 사용.
- 색은 모두 HSL — `--background`, `--foreground`, `--primary`, `--accent`, `--muted` 등.
- 폰트: **Space Grotesk** (영문/숫자) + **Noto Sans KR** (한글).
- 톤: 2026 futuristic dark editorial — bento grid · glassmorphism · noise texture.
- 디바이스 분기는 시맨틱 유틸만 사용:
  - `.mobile-only` / `.tablet-up` / `.wide-up-flex`
  - `.page-sticky-header` / `.shell-top-bar`
  - 페이지 스케일링: `.page-reading` / `.page-list` / `.card-grid` / `.page-heading`
- raw `md:hidden` / `hidden md:block` / `md:top-12` 직접 사용 금지.

### Responsive Shell
| 폭 | 구성 |
| :-- | :-- |
| Mobile | BottomNav 만 노출 |
| `md+` | Sidebar + Main |
| `xl+` | Sidebar + Main + RightRail |

### 애니메이션
- framer-motion 사용. snappy 한 duration/delay.
- 페이지 전환은 `AnimatePresence` 기반 `<PageTransition>` 으로 통일.

### 테마
- Light / Dark 토글. 시스템 환경 감지 + `localStorage` 우선.

---

## 5. 브랜드 거버넌스

- 서비스명: **PINCH** (영문 대문자 고정)
- 단위 의견 = "PINCH"
- 모든 표기 정의 단일 소스: `src/brand/terms.mjs`
- 런타임: `<BrandText />` / `applyBrandTerms()`
- 정적 검증: `npm run scan:brand` — 레거시 표기("한마디", "PICKS", "댓글" 등) 자동 감지
- 브랜드 로고는 항상 `<PinchLogo />` / `<PinchMark />` 만 사용. raw `Brain` 아이콘으로 재구성 금지.

---

## 6. 도메인 규칙 (UI 반영분)

| 규칙 | 위치 |
| :-- | :-- |
| 1인 1일 1 PINCH (KST 자정 기준) | `Topic.tsx`, `data/__tests__/topicDeadline.test.ts` |
| 자정 마감 → 최고 좋아요 1개 아카이브 | mock: `data/mockData.ts` · backend: `daily_winners` |
| 카테고리당 1일 1 토픽 | seed: `backend/seed/001_seed.sql` |
| 주간/월간 랭킹 = 선정 횟수 + 누적 좋아요 | `useRanking()` (`data/mockData.ts`) |
| **`archived_invalid` PINCH 는 랭킹/집계에서 제외** | `computeInvalidationPenalty()` + backend active PINCH 집계 쿼리 |
| 어드민 토픽 강제 교체 시 기존 PINCH 처리 모달 | `pages/Admin.tsx` |

---

## 7. Scripts

```bash
npm install            # 의존성 설치
npm run dev            # 개발 서버
npm run build          # 프로덕션 빌드
npm run preview        # 빌드 미리보기

npm run lint           # ESLint
npm run test           # Vitest
npm run scan:brand     # 브랜드 용어 스캐너 (PINCH 표기 검증)
```

> Node.js `>=18`.

---

## 8. Backend 연동 지점

`backend/`는 MySQL 8.x 기준 초기 스키마와 프론트 API 요구사항을 담고 있습니다. 프론트가 의존하는 핵심 계약:

| 프론트 사용처 | 백엔드 |
| :-- | :-- |
| `useAuth`, `useAdminAuth` | `/api/auth/*`, `/api/admin/auth/*` |
| `src/data/mockData.ts` | `/api/home`, `/api/topics`, `/api/archive`, `/api/rankings` |
| `src/data/myPageData.ts` | `/api/me/profile`, `/api/me/stats`, `/api/me/pinches` |
| `src/data/adminData.ts` | `/api/admin/*` |
| PINCH 작성/좋아요 | `pinches`, `pinch_likes` MySQL 테이블 + API 트랜잭션 |
| 토픽 교체 / 무효화 | `pinches.status = 'archived_invalid'`로 보존하고 집계에서 제외 |

자세한 스키마는 [`backend/README.md`](backend/README.md), API 계약은 [`backend/FRONTEND_API_REQUIREMENTS.md`](backend/FRONTEND_API_REQUIREMENTS.md).

---

## 9. Roadmap (Frontend)

- [ ] 인증 영속화 (전화번호 OTP + 소셜 OAuth)
- [ ] PINCH 제출/좋아요 실데이터 연동
- [ ] 자정 마감 → 아카이브 승급 배치 트리거 UI
- [ ] 신고/모더레이션 큐 실시간 갱신
- [ ] 실시간 랭킹 집계 스트림
