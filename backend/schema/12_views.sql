-- ============================================================================
-- 12_views.sql — 집계 뷰 (랭킹 / 마이페이지 통계)
-- ============================================================================

-- 토픽별 PINCH 수 (UI 의 pinchCount)
create or replace view public.view_topic_stats as
  select t.id as topic_id,
         count(p.*) as pick_count,
         max(p.created_at) as last_pick_at
    from public.topics t
    left join public.pinch p on p.topic_id = t.id and p.is_hidden = false
   group by t.id;

-- PINCH 별 좋아요 수
create or replace view public.view_pick_stats as
  select p.id as pick_id,
         count(l.*) as like_count
    from public.pinch p
    left join public.pick_likes l on l.pick_id = p.id
   group by p.id;

-- 주간 랭킹: 최근 7일 KST 일자 기준
create or replace view public.view_weekly_ranking as
  select pr.id           as user_id,
         pr.username,
         count(distinct dw.id)            as wins,
         coalesce(sum(ps.like_count), 0)  as total_likes,
         row_number() over (
           order by count(distinct dw.id) desc,
                    coalesce(sum(ps.like_count), 0) desc
         ) as rank
    from public.profiles pr
    left join public.pinch p
           on p.user_id = pr.id
          and p.kst_day >= ((now() at time zone 'Asia/Seoul')::date - 6)
    left join public.daily_winners dw on dw.pick_id = p.id
    left join public.view_pick_stats ps on ps.pick_id = p.id
   group by pr.id, pr.username
   having count(p.*) > 0;

-- 월간 랭킹: 최근 30일
create or replace view public.view_monthly_ranking as
  select pr.id           as user_id,
         pr.username,
         count(distinct dw.id)            as wins,
         coalesce(sum(ps.like_count), 0)  as total_likes,
         row_number() over (
           order by count(distinct dw.id) desc,
                    coalesce(sum(ps.like_count), 0) desc
         ) as rank
    from public.profiles pr
    left join public.pinch p
           on p.user_id = pr.id
          and p.kst_day >= ((now() at time zone 'Asia/Seoul')::date - 29)
    left join public.daily_winners dw on dw.pick_id = p.id
    left join public.view_pick_stats ps on ps.pick_id = p.id
   group by pr.id, pr.username
   having count(p.*) > 0;

-- 마이페이지 통계
create or replace view public.view_my_stats as
  select pr.id                              as user_id,
         pr.username,
         count(distinct p.id)               as total_picks,
         coalesce(sum(ps.like_count), 0)    as total_likes,
         count(distinct dw.id)              as best_pick_count,
         case when count(distinct p.id) = 0 then 0
              else round(sum(ps.like_count)::numeric / count(distinct p.id), 1)
         end                                as avg_likes
    from public.profiles pr
    left join public.pinch p             on p.user_id = pr.id
    left join public.view_pick_stats ps  on ps.pick_id = p.id
    left join public.daily_winners dw    on dw.pick_id = p.id
   group by pr.id, pr.username;
