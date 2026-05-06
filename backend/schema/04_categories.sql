-- ============================================================================
-- 04_categories.sql — 카테고리 마스터 (UI 표시 라벨/아이콘 키)
-- ============================================================================

create table if not exists public.categories (
  id        public.category_id primary key,
  label     text not null,             -- 한국어 라벨
  icon_key  text not null,             -- 프론트 navIcons 매핑 키 (예: 'Landmark')
  accent    text not null,             -- tailwind text color class
  position  int  not null default 0
);
