-- ============================================================================
-- seed/04_demo_users.sql — 데모 사용자 + PICK + 좋아요 (LOCAL DEV ONLY)
-- ----------------------------------------------------------------------------
-- 주의: auth.users 는 보통 supabase admin API 로 생성합니다.
-- 로컬에서만 직접 INSERT 가 가능하므로, 실서비스에는 사용하지 마세요.
-- ============================================================================

-- 이 블록은 supabase 관리 API 로 사용자를 만든 뒤,
-- 그 user_id 로 profile/pick 을 채우는 예시 스크립트입니다.

-- 예: 사용자 1명 생성 (psql 변수 :uid 에 auth.users.id 를 넣었다고 가정)
-- insert into public.profiles (id, username, email, phone, avatar_char)
-- values (:'uid', '시민의식', 'citizen@picks.kr', '010-1111-2222', '시');

-- 예: 오늘의 토픽 society-1 에 PICK 등록
-- insert into public.picks (topic_id, user_id, body)
-- select id, :'uid',
--        '자전거도 엄연한 교통수단입니다. 음주운전 처벌 기준을 자동차와 동일하게 강화해야 합니다.'
--   from public.topics where slug = 'society-1';

-- 예: 관리자 권한 부여
-- insert into public.user_roles (user_id, role) values (:'uid', 'admin');
