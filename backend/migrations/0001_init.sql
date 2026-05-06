-- ============================================================================
-- 0001_init.sql — PINCH 초기 마이그레이션 (단일 파일)
-- 아래 schema/* 파일을 순서대로 합친 것입니다.
-- 개별 파일을 읽으려면 backend/schema/ 디렉토리를 참고하세요.
-- ============================================================================

\i ../schema/00_extensions.sql
\i ../schema/01_enums.sql
\i ../schema/02_profiles.sql
\i ../schema/03_user_roles.sql
\i ../schema/04_categories.sql
\i ../schema/05_topics.sql
\i ../schema/06_pinches.sql
\i ../schema/07_pinch_likes.sql
\i ../schema/08_daily_winners.sql
\i ../schema/09_overrides.sql
\i ../schema/10_reports.sql
\i ../schema/11_bans.sql
\i ../schema/12_views.sql
\i ../schema/13_functions.sql
\i ../schema/14_rls.sql
