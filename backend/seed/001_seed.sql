USE pinch;

INSERT INTO categories (id, label, sort_order) VALUES
  ('politics', '정치', 10),
  ('society', '사회', 20),
  ('economy', '경제', 30),
  ('tech', '개발/테크', 40),
  ('culture', '문화', 50),
  ('sports', '스포츠', 60)
ON DUPLICATE KEY UPDATE
  label = VALUES(label),
  sort_order = VALUES(sort_order),
  is_active = TRUE;

INSERT INTO topics (
  public_id,
  category_id,
  title,
  description,
  news_url,
  news_source,
  kst_day,
  heat_score,
  status
) VALUES
  (
    'topic_demo_society_today',
    'society',
    '오늘의 사회 이슈에 대해 어떻게 생각하시나요?',
    'PINCH 백엔드 연결 전까지 사용할 수 있는 기본 샘플 토픽입니다.',
    'https://pinch.kr',
    'PINCH',
    CURRENT_DATE(),
    100,
    'active'
  ),
  (
    'topic_demo_tech_today',
    'tech',
    'AI 도구 사용 기준, 어디까지 허용해야 할까요?',
    '개발과 일상에서 AI 도구 사용 기준을 두고 의견을 나눠보는 샘플 토픽입니다.',
    'https://pinch.kr',
    'PINCH',
    CURRENT_DATE(),
    80,
    'active'
  )
ON DUPLICATE KEY UPDATE
  title = VALUES(title),
  description = VALUES(description),
  news_url = VALUES(news_url),
  news_source = VALUES(news_source),
  kst_day = VALUES(kst_day),
  heat_score = VALUES(heat_score),
  status = VALUES(status);
