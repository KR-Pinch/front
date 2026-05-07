-- ============================================================================
-- 12_views.sql — 집계 뷰 (랭킹 / 마이페이지 통계)
-- ----------------------------------------------------------------------------
-- 모든 집계 뷰는 status = 'active' 인 PINCH 만 사용한다.
-- archived_invalid (= 어드민이 토픽 교체로 무효화한 PINCH) 는:
--   · pinchCount 에 포함하지 않는다
--   · 좋아요 수치는 보존되지만 랭킹 점수 / 마이페이지 합산에 들어가지 않는다
--   · daily_winners 후보에서도 제외한다 (13_functions.sql 의 close_topic_day 참조)
-- 본인 마이페이지의 "내 PINCH 목록"은 별도 쿼리에서 status 무관하게 조회한다.
-- ============================================================================

-- 토픽별 PINCH 수 (UI 의 pinchCount)
create or replace view public.view_topic_stats as
  select t.id as topic_id,
         count(p.*) as pinch_count,
         max(p.created_at) as last_pinch_at
    from public.topics t
    left join public.pinch p
           on p.topic_id = t.id
          and p.is_hidden = false
          and p.status = 'active'
   group by t.id;

-- PINCH 별 좋아요 수
-- archived_invalid PINCH 에 대해서는 like_count 를 0 으로 강제해서
-- 랭킹/마이페이지 합산이 자연스럽게 0 이 되도록 만든다. 좋아요 행 자체는
-- 보존하므로 본인 마이페이지에서는 "원래 받았던 좋아요"를 별도 컬럼으로
-- 표시할 수 있다 (raw_like_count).
create or replace view public.view_pinch_stats as
  select p.id as pinch_id,
         count(l.*) filter (where p.status = 'active') as like_count,
         count(l.*) as raw_like_count
    from public.pinch p
    left join public.pinch_likes l on l.pinch_id = p.id
   group by p.id, p.status;

-- 주간 랭킹: 최근 7일 KST 일자 기준
-- archived_invalid 는 p.status 필터로 제외되므로 wins / total_likes 모두
-- 자연스럽게 빠진다.
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
          and p.status = 'active'
    left join public.daily_winners dw on dw.pinch_id = p.id
    left join public.view_pinch_stats ps on ps.pinch_id = p.id
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
          and p.status = 'active'
    left join public.daily_winners dw on dw.pinch_id = p.id
    left join public.view_pinch_stats ps on ps.pinch_id = p.id
   group by pr.id, pr.username
   having count(p.*) > 0;

-- 마이페이지 통계
-- "총 PINCH / 평균 좋아요 / 베스트 횟수" 는 active 만 집계한다.
-- 무효화된 PINCH 는 본인 마이페이지의 "내 PINCH 목록"에서 별도로 보여준다.
create or replace view public.view_my_stats as
  select pr.id                              as user_id,
         pr.username,
         count(distinct p.id) filter (where p.status = 'active')               as total_pinches,
         coalesce(sum(ps.like_count), 0)                                       as total_likes,
         count(distinct dw.id)                                                 as best_pinch_count,
         case when count(distinct p.id) filter (where p.status = 'active') = 0 then 0
              else round(
                     coalesce(sum(ps.like_count), 0)::numeric
                       / count(distinct p.id) filter (where p.status = 'active'),
                     1)
         end                                                                   as avg_likes
    from public.profiles pr
    left join public.pinch p             on p.user_id = pr.id
    left join public.view_pinch_stats ps  on ps.pinch_id = p.id
    left join public.daily_winners dw    on dw.pinch_id = p.id
   group by pr.id, pr.username;
