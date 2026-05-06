-- ============================================================================
-- 05_topics.sql — 토픽 (오늘의 PICK 대상 안건)
-- ============================================================================

create table if not exists public.topics (
  id            uuid primary key default gen_random_uuid(),
  slug          text unique,                                   -- e.g. 'society-1'
  category_id   public.category_id not null references public.categories(id),
  title         text not null,
  description   text not null default '',
  news_url      text,
  news_source   text,
  source        public.topic_source not null default 'seed',
  -- KST 기준 게재일 (해당일 00:00~24:00 동안 PICK 가능)
  publish_kst_day date not null default ((now() at time zone 'Asia/Seoul')::date),
  -- 부가 신호
  heat          int  not null default 0,                       -- 인기도 가중
  created_by    uuid references auth.users(id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists topics_publish_day_idx on public.topics (publish_kst_day desc);
create index if not exists topics_category_day_idx on public.topics (category_id, publish_kst_day desc);

drop trigger if exists topics_set_updated_at on public.topics;
create trigger topics_set_updated_at
  before update on public.topics
  for each row execute procedure public.tg_set_updated_at();
