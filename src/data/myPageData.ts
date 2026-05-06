export const myProfile = {
  username: "시민의식",
  email: "citizen@pinch.kr",
  avatar: "시",
  joinedAt: "2026년 1월 14일",
  bio: "매일의 이슈에 솔직하게 한 표. 오늘의 PINCH으로 의견을 남깁니다.",
  rank: 1,
  badges: [
    { label: "주간 1위", tone: "gold" as const },
    { label: "30일 연속 참여", tone: "accent" as const },
    { label: "베스트 코멘터", tone: "accent" as const },
  ],
};

import { normalizeMyStats, type MyPickStats } from "./pickMetrics";

// Run through `normalizeMyStats` so the exported object is type-safe
// (PickCount fields branded) and any legacy `totalComments`/`commentCount`
// keys would be stripped + warned about in dev.
export const myStats: MyPickStats = normalizeMyStats({
  totalPicks: 47,        // 지금까지 남긴 PINCH 수 (1일 1 PINCH)
  totalLikes: 1284,      // 받은 좋아요 누계
  bestPickCount: 5,      // 오늘의 PINCH으로 선정된 횟수
  streak: 30,            // 연속 참여 일수
  avgLikes: 27.3,        // PINCH당 평균 좋아요
  participationRate: 92, // 참여율 (%)
});

export const myComments = [
  {
    id: "c1",
    date: "2026년 3월 21일",
    topic: "따릉이 음주운전 사건, 어떻게 생각하시나요?",
    text: "자전거도 엄연한 교통수단입니다. 음주운전 처벌 기준을 자동차와 동일하게 강화해야 합니다. 피해자 보호가 최우선이어야 해요.",
    likes: 128,
    isBest: false,
  },
  {
    id: "c2",
    date: "2026년 3월 20일",
    topic: "AI 면접관, 공정한가요?",
    text: "기술의 객관성과 인간의 직관 사이에서 균형이 필요합니다. AI는 보조 도구로만 활용되어야 한다고 생각해요.",
    likes: 89,
    isBest: false,
  },
  {
    id: "c3",
    date: "2026년 3월 19일",
    topic: "주 4일제, 현실적으로 가능할까?",
    text: "생산성 데이터가 이미 충분히 축적되었습니다. 단계적 도입을 통해 한국형 모델을 만들어가야 합니다.",
    likes: 215,
    isBest: true,
  },
  {
    id: "c4",
    date: "2026년 3월 18일",
    topic: "학교에서 스마트폰 금지, 맞을까요?",
    text: "디지털 네이티브 세대에게 스마트폰을 빼앗는 것보다, 올바른 사용법을 가르치는 게 교육의 본질입니다.",
    likes: 76,
    isBest: false,
  },
  {
    id: "c5",
    date: "2026년 3월 17일",
    topic: "반려동물 등록제 의무화, 찬성하시나요?",
    text: "동물권 보호와 책임 있는 양육 문화 정착을 위해 반드시 필요한 제도라고 봅니다.",
    likes: 142,
    isBest: false,
  },
];

export const activityHeatmap = Array.from({ length: 35 }, (_, i) => ({
  day: i,
  level: Math.floor(Math.random() * 4), // 0~3 강도
}));
