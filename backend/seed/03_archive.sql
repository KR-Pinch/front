-- ============================================================================
-- seed/03_archive.sql — 아카이브 시드 (DEMO ONLY)
-- 운영 환경에서는 close_topic_day() 가 daily_winners 를 자동으로 채웁니다.
-- 이 시드는 데모 사용자/PICK 가 먼저 들어와 있다고 가정하지 않고,
-- 토픽/카테고리/일자만 미리 등록하기 위한 placeholder 입니다.
-- (실제 운영 시 이 파일은 사용하지 않습니다.)
-- ============================================================================

-- mockData.ts > archiveSeed 와 동일한 일자/카테고리 매핑.
-- 토픽이 시드에 존재하지 않으면 동일 slug 로 등록.
insert into public.topics (slug, category_id, title, description, news_source, source, publish_kst_day)
values
  ('archive-2026-03-20', 'tech',     'AI 면접관, 공정한가요?',
     '주요 대기업이 AI 1차 면접 도입을 확대했습니다.', 'ZDNet Korea', 'seed', date '2026-03-20'),
  ('archive-2026-03-19', 'economy',  '주 4일제, 현실적으로 가능할까?',
     '정부가 주 4일제 시범사업 확대안을 발표했습니다.', '매일경제', 'seed', date '2026-03-19'),
  ('archive-2026-03-18', 'society',  '학교에서 스마트폰 금지, 맞을까요?',
     '교육부가 초·중학교 스마트폰 사용 제한 가이드라인을 공개했습니다.', '한겨레', 'seed', date '2026-03-18'),
  ('archive-2026-03-17', 'society',  '반려동물 등록제 의무화, 찬성하시나요?',
     '유기동물 증가와 함께 반려동물 등록제 의무화 강화 법안이 발의됐습니다.', '경향신문', 'seed', date '2026-03-17'),
  ('archive-2026-03-16', 'politics', '선거 사전투표 전면 확대, 어떻게 보시나요?',
     '사전투표 기간 확대안이 국회에 제출됐습니다.', '연합뉴스', 'seed', date '2026-03-16'),
  ('archive-2026-03-15', 'culture',  'AI 더빙, 성우의 자리를 대체할까?',
     '글로벌 OTT 의 AI 더빙 도입이 가속화됐습니다.', '씨네21', 'seed', date '2026-03-15'),
  ('archive-2026-03-14', 'sports',   '프로야구 피치클락, 경기의 맛을 살릴까?',
     'KBO 가 피치클락 도입 한 달 만에 평균 경기시간 18분 단축을 발표했습니다.', '스포츠동아', 'seed', date '2026-03-14')
on conflict (slug) do nothing;

-- 실제 daily_winners 행은 picks 가 채워진 뒤 close_topic_day() 로 생성하세요.
-- 데모로 한 줄 채우는 예시:
--   select public.close_topic_day(date '2026-03-20');
