-- ============================================================================
-- 00_extensions.sql — 필수 확장
-- ============================================================================
create extension if not exists "pgcrypto";   -- gen_random_uuid()
create extension if not exists "citext";     -- 대소문자 무시 email
