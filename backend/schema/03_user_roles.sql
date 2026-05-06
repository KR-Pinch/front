-- ============================================================================
-- 03_user_roles.sql — 권한 분리 테이블 (절대 profiles 에 두지 않음)
-- + has_role() SECURITY DEFINER 로 RLS 재귀 방지
-- ============================================================================

create table if not exists public.user_roles (
  id       uuid primary key default gen_random_uuid(),
  user_id  uuid not null references auth.users(id) on delete cascade,
  role     public.app_role not null,
  granted_at timestamptz not null default now(),
  unique (user_id, role)
);

alter table public.user_roles enable row level security;

create or replace function public.has_role(_user_id uuid, _role public.app_role)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.user_roles
    where user_id = _user_id and role = _role
  )
$$;

create or replace function public.is_admin(_user_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.has_role(_user_id, 'admin')
      or public.has_role(_user_id, 'moderator')
$$;
