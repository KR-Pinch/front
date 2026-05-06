-- ============================================================================
-- 07_pinch_likes.sql — PINCH 좋아요 (1인 1회, 자기 PINCH 금지)
-- ============================================================================

create table if not exists public.pinch_likes (
  pinch_id    uuid not null references public.pinch(id) on delete cascade,
  user_id    uuid not null references auth.users(id)   on delete cascade,
  created_at timestamptz not null default now(),
  primary key (pinch_id, user_id)
);

create index if not exists pinch_likes_user_idx on public.pinch_likes (user_id);

-- 자기 PINCH 좋아요 금지
create or replace function public.tg_block_self_like()
returns trigger language plpgsql as $$
declare owner uuid;
begin
  select user_id into owner from public.pinch where id = new.pinch_id;
  if owner = new.user_id then
    raise exception 'Self-like is not allowed';
  end if;
  return new;
end $$;

drop trigger if exists pinch_likes_block_self on public.pinch_likes;
create trigger pinch_likes_block_self
  before insert on public.pinch_likes
  for each row execute procedure public.tg_block_self_like();
