<div align="center">

<br />

# ✦ PINCH ✦

### _매일 하나의 주제, 단 하나의 의견._

**모든 의견이 남지 않습니다.<br/>오직 선택된 하나만 남습니다.**

<br />

[![Live](https://img.shields.io/badge/▲_LIVE-usepinch.lovable.app-FFC400?style=for-the-badge&labelColor=0a0a0a)](https://usepinch.lovable.app)
[![Built with Lovable](https://img.shields.io/badge/Built_with-Lovable-7C3AED?style=for-the-badge&labelColor=0a0a0a)](https://lovable.dev)
[![License](https://img.shields.io/badge/License-Non--Commercial-lightgrey?style=for-the-badge&labelColor=0a0a0a)](#-license)

<br />

`정치` · `테크` · `사회` · `문화` · `경제` · `스포츠`

<br />

</div>

---

<br />

## ✦ About

> **PINCH** 는 한국형 일일 토론 플랫폼입니다.

하루에 단 하나의 토픽이 열리고,<br />
사용자는 **하루 단 1개의 PINCH** 만 남길 수 있습니다.

가장 많은 좋아요를 받은 **단 하나의 PINCH** 만<br />
자정에 ✦ **아카이브** 로 살아남습니다.

<br />

> _PINCH 는 토론을 정리하지 않습니다._<br />
> _**선별** 합니다._

<br />

---

<br />

## ✦ Preview

<table>
<tr>
<td width="50%" align="center">
<img src="docs/screenshots/home.png" alt="홈" />
<br /><br />
<b>홈 — Hot Topic</b> · <code>/</code>
<br />
<sub>LIVE NOW 배너 아래 오늘의 가장 뜨거운 토픽이<br />단 한 장의 카드로 떠 있습니다.</sub>
</td>
<td width="50%" align="center">
<img src="docs/screenshots/topic.png" alt="오늘의 PINCH" />
<br /><br />
<b>오늘의 PINCH</b> · <code>/topic</code>
<br />
<sub>로그인 후 단 1개의 의견만.<br />500자 카운터 · 라이브 카운트다운 · 자동 잠금.</sub>
</td>
</tr>
<tr>
<td width="50%" align="center">
<img src="docs/screenshots/archive.png" alt="아카이브" />
<br /><br />
<b>아카이브</b> · <code>/archive</code>
<br />
<sub>지난 주제와 그날 살아남은 단 하나의 PINCH.<br />검색 · 정렬 · 카테고리 필터.</sub>
</td>
<td width="50%" align="center">
<img src="docs/screenshots/ranking.png" alt="똑똑이 랭킹" />
<br /><br />
<b>똑똑이 랭킹</b> · <code>/ranking</code>
<br />
<sub>주간 / 월간 단위 PINCH 선정 횟수 + 누적 좋아요.<br />1·2·3위에는 👑 🏆 🥉 배지.</sub>
</td>
</tr>
</table>

<br />

---

<br />

## ✦ Core Rules

<table>
<tr>
<td align="center" width="25%">
<h3>01</h3>
<b>하루 1 PINCH</b>
<br /><br />
<sub>KST 자정 기준<br />잠금 / 해제</sub>
</td>
<td align="center" width="25%">
<h3>02</h3>
<b>단 하나만 남는다</b>
<br /><br />
<sub>가장 좋아요 많은 PINCH<br />한 개만 아카이브</sub>
</td>
<td align="center" width="25%">
<h3>03</h3>
<b>카테고리당 1 토픽</b>
<br /><br />
<sub>하루에 카테고리당<br />정확히 한 개</sub>
</td>
<td align="center" width="25%">
<h3>04</h3>
<b>똑똑이 랭킹</b>
<br /><br />
<sub>선정 횟수 + 좋아요<br />주간 · 월간 집계</sub>
</td>
</tr>
</table>

<br />

---

<br />

## ✦ Tech Stack

> **Frontend only** — 백엔드는 사용자 측에서 추후 연결.

| 영역 | 사용 기술 |
| :-- | :-- |
| Framework | **React 18** + **TypeScript 5** + **Vite 5** |
| Routing | `react-router-dom` v6 |
| Styling | **Tailwind CSS v3** + 시맨틱 디자인 토큰(HSL) |
| UI Primitives | **shadcn/ui** + **Radix UI** |
| Animation | **framer-motion** (snappy, AnimatePresence 페이지 전환) |
| Icons | **lucide-react** (중앙 매핑: `src/config/navIcons.ts`) |
| Forms / Validation | `react-hook-form` + `zod` + `@hookform/resolvers` |
| Data fetching | `@tanstack/react-query` |
| Notifications | `sonner` + shadcn `toast` |
| Theme | Light/Dark 토글 (시스템 감지 + `localStorage` 우선) |
| Date/Time | `date-fns` (KST 일자 기준 마감/롤오버) |
| Charts | `recharts` |
| Testing | **Vitest** + Testing Library + **Playwright** |
| Linting | ESLint + 자체 브랜드 용어 스캐너 (`scripts/scan-brand-terms.mjs`) |

<br />

### 디자인 시스템 원칙

- **Bento grid · glassmorphism · noise texture** 의 2026 futuristic dark editorial 톤
- 폰트: **Space Grotesk** (영문/숫자) + **Noto Sans KR** (한글)
- 색상은 모두 `index.css` 의 HSL 시맨틱 토큰만 사용 — 컴포넌트에 raw color 클래스 금지
- 반응형 셸: mobile = BottomNav, md+ = sidebar, xl+ = right rail
- 디바이스 분기는 시맨틱 유틸(`.mobile-only`, `.tablet-up`, `.wide-up-flex`) 만 사용

### 브랜드 거버넌스

- **PINCH** (서비스명, 영문 대문자 고정), **PINCH** (개별 의견)
- 모든 브랜드 용어 정의는 `src/brand/terms.mjs` 단일 소스
- `npm run scan:brand` 로 레거시 표기("한마디"·"댓글" 등) 자동 감지

<br />

---

<br />

## ✦ Quick Start

```bash
# 1) 의존성 설치
npm install

# 2) 개발 서버
npm run dev

# 3) 프로덕션 빌드 & 미리보기
npm run build
npm run preview
```

추가 스크립트:

```bash
npm run lint           # ESLint
npm run test           # Vitest 단위 테스트
npm run scan:brand     # 브랜드 용어 스캐너 (PINCH 표기 검증)
```

> Node.js `>=18` 권장.

<br />

---

<br />

## ✦ Project Structure

```
src/
├── pages/              # 라우트 단위 화면 (Index, Topic, Archive, Ranking, MyPage, Settings, Admin, Auth)
├── components/
│   ├── shell/          # AppShell · AppSidebar · BottomNav · RightRail · SiteFooter
│   ├── brand/          # PinchLogo, PinchMark (브랜드 락업 단일 소스)
│   ├── auth/           # 로그인/회원가입/비밀번호 정책 UI
│   ├── topic/          # HeartBurst 등 토픽 인터랙션
│   ├── onboarding/     # 첫 방문 온보딩
│   └── ui/             # shadcn primitives
├── config/
│   └── navIcons.ts     # 모든 네비 아이콘 단일 매핑
├── data/               # mockData, adminData, myPageData, pinchMetrics
├── brand/              # 브랜드 용어 시스템 (terms.mjs · BrandText · 스캐너 연동)
├── hooks/              # useAuth, useAdminAuth, use-toast, use-mobile
└── index.css           # HSL 디자인 토큰 + 시맨틱 유틸리티

backend/                # 백엔드 연동을 위한 PostgreSQL DDL/DML (Supabase 기준)
├── schema/             # 00_extensions ~ 14_rls (enums · tables · views · functions · RLS)
├── seed/               # 카테고리 · 오늘의 토픽 · 아카이브 · 데모 사용자 시드
└── migrations/0001_init.sql
```

> `backend/` 는 프론트엔드와 분리된 **DB 스키마 패키지** 입니다. 1인 1일 1 PINCH UNIQUE 제약, `submit_pinch` / `close_topic_day` 함수, 모든 테이블 RLS 정책이 포함되어 있어 Supabase SQL editor 에 그대로 적용 가능합니다. 자세한 내용은 [`backend/README.md`](backend/README.md) 참고.

<br />

---

<br />

## ✦ Routes

| Path | Page |
| :-- | :-- |
| `/` | 홈 — 오늘의 HOT 토픽 + 카테고리 + 주간 랭킹 |
| `/topic` | 오늘의 PINCH 작성/조회 (1인 1 PINCH / 자정 KST 마감) |
| `/archive` | 아카이브 (검색·필터·딥링크 다이얼로그) |
| `/ranking` | 똑똑이 랭킹 (주간/월간) |
| `/mypage` | 마이페이지 (내 PINCH · 받은 좋아요 · 연속 참여) |
| `/settings` | 설정 (테마·알림·계정) |
| `/auth` | 로그인 / 회원가입 / 전화번호 인증 |
| `/admin` | 어드민 (토픽/유저/신고 모더레이션) |
| `/legal` | 약관 · 개인정보 처리방침 |

<br />

---

<br />

## ✦ Roadmap

> 현재 저장소는 **프론트엔드 UI 목업** 입니다.

- [ ] 인증 (전화번호 OTP + 소셜 로그인 OAuth)
- [ ] PINCH 제출/좋아요 영속화
- [ ] 자정 마감 → 아카이브 승급 배치
- [ ] 신고/모더레이션 큐
- [ ] 실시간 랭킹 집계

<br />

---

<br />

## ✦ License

This project is distributed under a **Non-Commercial License**.

- Commercial use is not allowed.
- Selling this software is not allowed.
- Monetized distribution is not allowed.
- Redistributed copies must include this license notice.

This is a custom non-commercial license and not an OSI-approved open-source license.

<br />

---

<br />

<div align="center">

### ✦

<br />

**PINCH**

_One PINCH a day._

<br />

[**→ usepinch.lovable.app**](https://usepinch.lovable.app)

<br />

<sub>© 2026 PINCH · Built in Korea</sub>

</div>
