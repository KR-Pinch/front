-- ============================================================================
-- 11_bans.sql — 사용자 정지 + 전화번호 블랙리스트
-- 영구 정지 시 전화번호도 banned_phones 에 자동 등록.
-- ============================================================================

create table if not exists public.bans (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null unique references auth.users(id) on delete cascade,
  duration    public.ban_duration not null,
  reason      text not null default '관리자 조치',
  banned_by   uuid references auth.users(id),
  banned_at   timestamptz not null default now(),
  expires_at  timestamptz                                -- null = 영구
);

create index if not exists bans_expires_idx on public.bans (expires_at);

create table if not exists public.banned_phones (
  phone       text primary key,
  username    text,
  reason      text not null default '영구 정지',
  banned_at   timestamptz not null default now(),
  banned_by   uuid references auth.users(id)
);

-- 영구정지 → 전화번호 자동 차단
create or replace function public.tg_sync_banned_phone()
returns trigger language plpgsql security definer set search_path = public as $$
declare ph text; un text;
begin
  if new.duration = 'permanent' then
    select phone, username into ph, un from public.profiles where id = new.user_id;
    if ph is not null then
      insert into public.banned_phones (phone, username, reason, banned_by)
      values (ph, un, new.reason, new.banned_by)
      on conflict (phone) do update set reason = excluded.reason, banned_at = now();
    end if;
  end if;
  return new;
end $$;

drop trigger if exists bans_sync_phone on public.bans;
create trigger bans_sync_phone
  after insert or update on public.bans
  for each row execute procedure public.tg_sync_banned_phone();

create or replace function public.is_user_banned(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select exists (
    select 1 from public.bans
    where user_id = _user_id
      and (expires_at is null or expires_at > now())
  );
$$;
