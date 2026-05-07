-- ============================================================================
-- 06_pinches.sql — 1인 1일 1 PINCH
-- (user_id, kst_day) UNIQUE 로 DB 레벨에서 강제.
-- ============================================================================

create table if not exists public.pinch (
  id          uuid primary key default gen_random_uuid(),
  topic_id    uuid not null references public.topics(id) on delete cascade,
  user_id     uuid not null references auth.users(id)    on delete cascade,
  body        text not null check (char_length(btrim(body)) between 1 and 500),
  created_at  timestamptz not null default now(),
  -- KST 캘린더 일자 — 생성열 (immutable expression)
  kst_day     date generated always as
              (((created_at at time zone 'Asia/Seoul'))::date) stored,
  is_hidden   boolean not null default false,            -- 신고로 숨김 처리
  -- 어드민이 토픽 "교체" 시 active → archived_invalid 로 전환.
  -- 본인 마이페이지에서는 항상 노출되지만 랭킹/아카이브 집계에서는 제외된다.
  status      public.pinch_status not null default 'active',
  invalidated_at     timestamptz,
  invalidated_reason text,
  unique (user_id, kst_day)                              -- 1일 1 PINCH
);

create index if not exists pinches_topic_idx on public.pinch (topic_id, created_at desc);
create index if not exists pinches_user_idx  on public.pinch (user_id, created_at desc);
create index if not exists pinch_day_idx   on public.pinch (kst_day);
