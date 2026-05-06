-- ============================================================================
-- 08_daily_winners.sql — 아카이브: 일자/카테고리별 단 하나의 우승 PINCH
-- 매일 KST 자정에 close_topic_day() 가 채워줌.
-- ============================================================================

create table if not exists public.daily_winners (
  id            uuid primary key default gen_random_uuid(),
  kst_day       date not null,
  category_id   public.category_id not null references public.categories(id),
  topic_id      uuid not null references public.topics(id),
  pinch_id       uuid not null references public.pinch(id),
  total_pinches   int  not null default 0,           -- 해당일 카테고리 참여자 수
  best_likes    int  not null default 0,
  archived_at   timestamptz not null default now(),
  unique (kst_day, category_id)                    -- 카테고리당 1개
);

create index if not exists daily_winners_day_idx on public.daily_winners (kst_day desc);
