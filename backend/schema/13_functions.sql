-- ============================================================================
-- 13_functions.sql — RPC: PINCH 제출 / 좋아요 토글 / 일일 마감
-- 모두 SECURITY DEFINER + auth.uid() 검증 + 정지자 차단.
-- ============================================================================

-- PINCH 제출 (오늘 이미 PINCH 했다면 UNIQUE 제약으로 거절)
create or replace function public.submit_pinch(_topic_id uuid, _body text)
returns public.pinch
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_row public.pinch;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;
  if public.is_user_banned(v_uid) then
    raise exception 'User is banned' using errcode = '42501';
  end if;

  insert into public.pinch (topic_id, user_id, body)
  values (_topic_id, v_uid, _body)
  returning * into v_row;

  return v_row;
end $$;

-- 좋아요 토글: insert 실패 시(이미 있음) 삭제로 전환
create or replace function public.toggle_pinch_like(_pinch_id uuid)
returns boolean   -- true = liked, false = unliked
language plpgsql security definer set search_path = public as $$
declare
  v_uid uuid := auth.uid();
  v_existed int;
begin
  if v_uid is null then
    raise exception 'Not authenticated' using errcode = '28000';
  end if;

  delete from public.pinch_likes
   where pinch_id = _pinch_id and user_id = v_uid;
  get diagnostics v_existed = row_count;
  if v_existed > 0 then
    return false;
  end if;

  insert into public.pinch_likes (pinch_id, user_id) values (_pinch_id, v_uid);
  return true;
end $$;

-- 일일 마감: 어제(KST) 의 카테고리별 우승 PINCH 을 daily_winners 로 이관
-- 운영에서는 KST 00:05 cron 으로 매일 호출.
create or replace function public.close_topic_day(_target_day date default null)
returns int
language plpgsql security definer set search_path = public as $$
declare
  v_day date := coalesce(_target_day, (now() at time zone 'Asia/Seoul')::date - 1);
  v_count int := 0;
begin
  with ranked as (
    select p.id as pinch_id,
           p.topic_id,
           t.category_id,
           coalesce(ps.like_count, 0) as likes,
           row_number() over (
             partition by t.category_id
             order by coalesce(ps.like_count, 0) desc, p.created_at asc
           ) as rn,
           count(*) over (partition by t.category_id) as total_pinches_in_cat
      from public.pinch p
      join public.topics t on t.id = p.topic_id
      left join public.view_pinch_stats ps on ps.pinch_id = p.id
     where p.kst_day = v_day
       and p.is_hidden = false
  )
  insert into public.daily_winners
        (kst_day, category_id, topic_id, pinch_id, total_pinches, best_likes)
  select v_day, category_id, topic_id, pinch_id, total_pinches_in_cat, likes
    from ranked
   where rn = 1
  on conflict (kst_day, category_id) do nothing;

  get diagnostics v_count = row_count;
  return v_count;
end $$;
