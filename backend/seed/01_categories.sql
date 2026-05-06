-- ============================================================================
-- seed/01_categories.sql — 6개 카테고리 (프론트 mockData.ts 와 동일)
-- ============================================================================

insert into public.categories (id, label, icon_key, accent, position) values
  ('politics', '정치',     'Landmark',     'text-rose-400',    1),
  ('tech',     '개발/테크', 'Cpu',          'text-sky-400',     2),
  ('society',  '사회',     'Building2',    'text-amber-400',   3),
  ('culture',  '문화',     'Clapperboard', 'text-violet-400',  4),
  ('economy',  '경제',     'TrendingUp',   'text-emerald-400', 5),
  ('sports',   '스포츠',    'Trophy',       'text-orange-400',  6)
on conflict (id) do update set
  label    = excluded.label,
  icon_key = excluded.icon_key,
  accent   = excluded.accent,
  position = excluded.position;
