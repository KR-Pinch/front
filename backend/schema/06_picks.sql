-- ============================================================================
-- 06_picks.sql — 1인 1일 1 PICK
-- (user_id, kst_day) UNIQUE 로 DB 레벨에서 강제.
-- ============================================================================

create table if not exists public.picks (
  id          uuid primary key default gen_random_uuid(),
  topic_id    uuid not null references public.topics(id) on delete cascade,
  user_id     uuid not null references auth.users(id)    on delete cascade,
  body        text not null check (char_length(btrim(body)) between 1 and 500),
  created_at  timestamptz not null default now(),
  -- KST 캘린더 일자 — 생성열 (immutable expression)
  kst_day     date generated always as
              (((created_at at time zone 'Asia/Seoul'))::date) stored,
  is_hidden   boolean not null default false,            -- 신고로 숨김 처리
  unique (user_id, kst_day)                              -- 1일 1 PICK
);

create index if not exists picks_topic_idx on public.picks (topic_id, created_at desc);
create index if not exists picks_user_idx  on public.picks (user_id, created_at desc);
create index if not exists picks_day_idx   on public.picks (kst_day);
