-- ============================================================================
-- 01_enums.sql — 도메인 enum
-- ============================================================================

-- 권한: 사용자 / 운영자 / 슈퍼관리자
do $$ begin
  create type public.app_role as enum ('user', 'moderator', 'admin');
exception when duplicate_object then null; end $$;

-- 카테고리 ID — 프론트의 CategoryId 와 1:1 매칭
do $$ begin
  create type public.category_id as enum (
    'politics', 'tech', 'society', 'culture', 'economy', 'sports'
  );
exception when duplicate_object then null; end $$;

-- 정지 기간
do $$ begin
  create type public.ban_duration as enum ('week', 'month', 'permanent');
exception when duplicate_object then null; end $$;

-- 신고 처리 상태
do $$ begin
  create type public.report_status as enum ('pending', 'resolved', 'dismissed');
exception when duplicate_object then null; end $$;

-- 토픽 출처: 시스템(에디터) / 관리자 수동 등록
do $$ begin
  create type public.topic_source as enum ('seed', 'admin');
exception when duplicate_object then null; end $$;

-- PINCH 상태:
--   active           = 정상 (랭킹/아카이브 후보)
--   archived_invalid = 어드민이 토픽을 "교체"하면서 맥락이 깨져 무효화됨.
--                      물리 삭제 금지. 본인 마이페이지에서는 보임.
--                      토픽/아카이브/랭킹 집계에서는 제외 (좋아요 수치는 보존).
do $$ begin
  create type public.pinch_status as enum ('active', 'archived_invalid');
exception when duplicate_object then null; end $$;
