-- ============================================================================
-- 02_profiles.sql — auth.users 와 1:1 매핑되는 공개 프로필
-- 닉네임, 전화번호, 가입일을 보관. 권한은 user_roles 에 분리.
-- ============================================================================

create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  username      text        not null unique,
  email         citext      not null unique,
  phone         text        not null unique,        -- "010-1234-5678"
  avatar_char   text        not null default '?',   -- 단일 글자 fallback
  bio           text,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists profiles_username_idx on public.profiles (lower(username));

-- updated_at 자동 갱신
create or replace function public.tg_set_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

drop trigger if exists profiles_set_updated_at on public.profiles;
create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute procedure public.tg_set_updated_at();

-- auth.users 가입 시 프로필 자동 생성 (메타에서 username/phone 끌어옴)
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, username, email, phone, avatar_char)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'username', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_user_meta_data->>'phone', ''),
    coalesce(left(new.raw_user_meta_data->>'username', 1), '?')
  )
  on conflict (id) do nothing;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
