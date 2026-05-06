# PINCH — Backend Schema (PostgreSQL / Supabase)

> 프론트엔드가 100% 모킹으로 동작하는 현재 단계에서, **실제 백엔드 구축 시 그대로
> 적용 가능한 PostgreSQL DDL/DML** 을 한 곳에 모아둔 폴더입니다.
> Supabase(Lovable Cloud) 기준이며, RLS 와 `auth.users` 연동을 전제로 작성되어 있습니다.

## 폴더 구조

```
backend/
├── README.md                  ← 이 문서
├── schema/
│   ├── 00_extensions.sql      ← 필수 확장 (uuid, citext)
│   ├── 01_enums.sql           ← app_role / category_id / ban_duration / report_status
│   ├── 02_profiles.sql        ← public.profiles (auth.users 1:1)
│   ├── 03_user_roles.sql      ← 권한 분리 테이블 + has_role() SECURITY DEFINER
│   ├── 04_categories.sql      ← 카테고리 마스터
│   ├── 05_topics.sql          ← 매일의 토픽 (admin draft + seed)
│   ├── 06_picks.sql           ← 1인 1일 1 PINCH (UNIQUE 제약)
│   ├── 07_pick_likes.sql      ← PINCH 좋아요
│   ├── 08_daily_winners.sql   ← 아카이브: 카테고리/일자별 우승 PINCH
│   ├── 09_overrides.sql       ← 관리자 강제 토픽 (글로벌 / 카테고리별)
│   ├── 10_reports.sql         ← 신고된 PINCH
│   ├── 11_bans.sql            ← 사용자 정지 + 전화번호 블랙리스트
│   ├── 12_views.sql           ← 주간/월간 랭킹 뷰
│   ├── 13_functions.sql       ← submit_pick / close_topic_day 등
│   └── 14_rls.sql             ← 모든 테이블 RLS 정책
├── seed/
│   ├── 01_categories.sql      ← 6개 카테고리 시드
│   ├── 02_topics.sql          ← 오늘의 토픽 시드 (mockData.ts 기반)
│   ├── 03_archive.sql         ← 아카이브 시드
│   └── 04_demo_users.sql      ← 데모 사용자/PINCH/좋아요
└── migrations/
    └── 0001_init.sql          ← 위 schema/* 를 한 파일로 합친 단일 마이그레이션
```

## 적용 순서

```bash
# Supabase SQL editor 또는 psql
psql "$DATABASE_URL" -f backend/migrations/0001_init.sql
psql "$DATABASE_URL" -f backend/seed/01_categories.sql
psql "$DATABASE_URL" -f backend/seed/02_topics.sql
psql "$DATABASE_URL" -f backend/seed/03_archive.sql
psql "$DATABASE_URL" -f backend/seed/04_demo_users.sql
```

## 핵심 비즈니스 규칙 (DB 레벨에서 보장)

| 규칙 | 구현 |
|---|---|
| 1인 1일 1 PINCH | `pinch (user_id, kst_day) UNIQUE` |
| KST 기준 하루 마감 (00:00 Asia/Seoul) | `kst_day := (created_at AT TIME ZONE 'Asia/Seoul')::date` 생성열 |
| 같은 PINCH 에 좋아요 1회 | `pick_likes (pick_id, user_id) UNIQUE` |
| 자기 PINCH 좋아요 금지 | `pick_likes` 트리거 |
| 일자별 카테고리당 단 하나의 우승 PINCH | `daily_winners (category_id, kst_day) UNIQUE` |
| 권한은 별도 테이블 | `user_roles` + `public.has_role()` SECURITY DEFINER |
| 영구정지 사용자 = 전화번호도 차단 | `banned_phones` 별도 테이블 |
| 글로벌/카테고리별 강제 토픽 분리 | `active_topic_global` (singleton) + `active_topic_by_category` |

## 프론트엔드 매핑

| 화면 / 모킹 위치 | 백엔드 엔티티 |
|---|---|
| `src/data/mockData.ts > todayTopics` | `topics` |
| `src/data/mockData.ts > todayPicks`  | `pinch` + `pick_likes` |
| `src/data/mockData.ts > archiveData` | `daily_winners` (+ `topics`, `pinch`) |
| `src/data/mockData.ts > weeklyRanking / monthlyRanking` | `view_weekly_ranking`, `view_monthly_ranking` |
| `src/data/adminData.ts > users / bans / bannedPhones` | `profiles` + `bans` + `banned_phones` |
| `src/data/adminData.ts > reports` | `reports` |
| `src/data/adminData.ts > activeTopic / activeByCategory` | `active_topic_global`, `active_topic_by_category` |
| `src/data/myPageData.ts > myStats` | `view_my_stats` (집계 뷰) |

## 주의

- 모든 색상 토큰 / 시간 처리(KST) 는 프론트와 동일한 규칙을 따릅니다.
- 비밀키/서비스키는 코드에 절대 남기지 않습니다 — Supabase Secrets 사용.
- 실제 연동 시 `src/data/*.ts` 의 mock 함수를 Supabase RPC / select 로 교체하세요.
