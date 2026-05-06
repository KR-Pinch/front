-- ============================================================================
-- 14_rls.sql — Row Level Security
-- 원칙:
--   * 읽기는 대부분 public (로그인 없이 사이트 둘러보기 가능)
--   * 쓰기는 본인 + 관리자
--   * 권한 검사는 항상 public.has_role() / public.is_admin() (재귀 방지)
-- ============================================================================

alter table public.profiles                enable row level security;
alter table public.user_roles              enable row level security;
alter table public.categories              enable row level security;
alter table public.topics                  enable row level security;
alter table public.picks                   enable row level security;
alter table public.pick_likes              enable row level security;
alter table public.daily_winners           enable row level security;
alter table public.active_topic_global     enable row level security;
alter table public.active_topic_by_category enable row level security;
alter table public.reports                 enable row level security;
alter table public.bans                    enable row level security;
alter table public.banned_phones           enable row level security;

-- ----- profiles ----------------------------------------------------------
create policy "profiles_read_all" on public.profiles
  for select to anon, authenticated using (true);
create policy "profiles_update_self" on public.profiles
  for update to authenticated using (id = auth.uid()) with check (id = auth.uid());
create policy "profiles_admin_all" on public.profiles
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ----- user_roles --------------------------------------------------------
create policy "roles_read_self" on public.user_roles
  for select to authenticated using (user_id = auth.uid() or public.is_admin(auth.uid()));
create policy "roles_admin_write" on public.user_roles
  for all to authenticated
  using (public.has_role(auth.uid(), 'admin'))
  with check (public.has_role(auth.uid(), 'admin'));

-- ----- categories (read-only public) ------------------------------------
create policy "categories_read_all" on public.categories
  for select to anon, authenticated using (true);
create policy "categories_admin_write" on public.categories
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ----- topics ------------------------------------------------------------
create policy "topics_read_all" on public.topics
  for select to anon, authenticated using (true);
create policy "topics_admin_write" on public.topics
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ----- picks -------------------------------------------------------------
create policy "picks_read_visible" on public.picks
  for select to anon, authenticated using (is_hidden = false or public.is_admin(auth.uid()));
create policy "picks_insert_self" on public.picks
  for insert to authenticated with check (user_id = auth.uid() and not public.is_user_banned(auth.uid()));
create policy "picks_update_self" on public.picks
  for update to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "picks_admin_all" on public.picks
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ----- pick_likes --------------------------------------------------------
create policy "likes_read_all" on public.pick_likes
  for select to anon, authenticated using (true);
create policy "likes_insert_self" on public.pick_likes
  for insert to authenticated with check (user_id = auth.uid() and not public.is_user_banned(auth.uid()));
create policy "likes_delete_self" on public.pick_likes
  for delete to authenticated using (user_id = auth.uid());

-- ----- daily_winners (read-only public) ---------------------------------
create policy "winners_read_all" on public.daily_winners
  for select to anon, authenticated using (true);
create policy "winners_admin_write" on public.daily_winners
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ----- overrides (read-only public, admin write) ------------------------
create policy "active_global_read" on public.active_topic_global
  for select to anon, authenticated using (true);
create policy "active_global_admin" on public.active_topic_global
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

create policy "active_by_cat_read" on public.active_topic_by_category
  for select to anon, authenticated using (true);
create policy "active_by_cat_admin" on public.active_topic_by_category
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ----- reports -----------------------------------------------------------
create policy "reports_read_admin" on public.reports
  for select to authenticated using (reporter_id = auth.uid() or public.is_admin(auth.uid()));
create policy "reports_insert_self" on public.reports
  for insert to authenticated with check (reporter_id = auth.uid());
create policy "reports_admin_update" on public.reports
  for update to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));

-- ----- bans / banned_phones (admin only) --------------------------------
create policy "bans_admin_all" on public.bans
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
create policy "bans_read_self" on public.bans
  for select to authenticated using (user_id = auth.uid());

create policy "banned_phones_admin_all" on public.banned_phones
  for all to authenticated using (public.is_admin(auth.uid())) with check (public.is_admin(auth.uid()));
