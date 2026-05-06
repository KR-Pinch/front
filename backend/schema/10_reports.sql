-- ============================================================================
-- 10_reports.sql — PINCH 신고
-- 한 사용자가 같은 PINCH 을 중복 신고할 수 없음.
-- ============================================================================

create table if not exists public.reports (
  id           uuid primary key default gen_random_uuid(),
  pinch_id      uuid not null references public.pinch(id) on delete cascade,
  reporter_id  uuid not null references auth.users(id)   on delete cascade,
  reasons      text[] not null default '{}',
  note         text,
  status       public.report_status not null default 'pending',
  resolved_by  uuid references auth.users(id),
  resolved_at  timestamptz,
  created_at   timestamptz not null default now(),
  unique (pinch_id, reporter_id)
);

create index if not exists reports_status_idx on public.reports (status, created_at desc);

-- 집계 뷰: 관리자 화면이 사용하는 신고 수 + 가장 최근 신고 시각
create or replace view public.view_reported_pinches as
  select p.id              as pinch_id,
         p.topic_id,
         t.title           as topic_title,
         pr.username,
         p.body            as text,
         count(r.*)        as report_count,
         max(r.created_at) as reported_at,
         array_agg(distinct unnest_reason)
           filter (where unnest_reason is not null) as reasons,
         min(r.status)     as status
    from public.reports r
    join public.pinch p on p.id = r.pinch_id
    join public.topics t on t.id = p.topic_id
    join public.profiles pr on pr.id = p.user_id
    left join lateral unnest(r.reasons) as unnest_reason on true
   group by p.id, p.topic_id, t.title, pr.username, p.body;
