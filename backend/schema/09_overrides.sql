-- ============================================================================
-- 09_overrides.sql — 관리자 "오늘의 토픽 강제" 오버라이드
--   * active_topic_global    : 사이트 전체에 단 하나 (singleton)
--   * active_topic_by_category: 카테고리당 하나
-- ============================================================================

create table if not exists public.active_topic_global (
  id          int  primary key default 1 check (id = 1),  -- singleton
  topic_id    uuid references public.topics(id) on delete set null,
  updated_by  uuid references auth.users(id),
  updated_at  timestamptz not null default now()
);

insert into public.active_topic_global (id, topic_id)
values (1, null) on conflict (id) do nothing;

create table if not exists public.active_topic_by_category (
  category_id public.category_id primary key references public.categories(id),
  topic_id    uuid not null references public.topics(id) on delete cascade,
  updated_by  uuid references auth.users(id),
  updated_at  timestamptz not null default now()
);
