import {
  type PickCount,
  toPickCount,
  normalizeTopicPickCount,
  normalizeArchivePickCount,
} from "./pickMetrics";

export type CategoryId =
  | "politics"
  | "tech"
  | "society"
  | "culture"
  | "economy"
  | "sports";

export interface Category {
  id: CategoryId;
  label: string;
  emoji: string;
  accent: string; // tailwind text color class for chips
}

export const categories: Category[] = [
  { id: "politics", label: "정치", emoji: "🏛️", accent: "text-rose-400" },
  { id: "tech", label: "개발/테크", emoji: "💻", accent: "text-sky-400" },
  { id: "society", label: "사회", emoji: "🏙️", accent: "text-amber-400" },
  { id: "culture", label: "문화", emoji: "🎬", accent: "text-violet-400" },
  { id: "economy", label: "경제", emoji: "📈", accent: "text-emerald-400" },
  { id: "sports", label: "스포츠", emoji: "⚽", accent: "text-orange-400" },
];

export interface TodayTopic {
  id: string;
  category: CategoryId;
  title: string;
  description: string;
  newsUrl: string;
  newsSource: string;
  date: string;
  pickCount: PickCount;
  remainingTime: string;
  heat: number;
}

const todayTopicsSeed: Array<Omit<TodayTopic, "pickCount"> & { pickCount: number }> = [
  {
    id: "society-1",
    category: "society",
    title: "따릉이 음주운전 사건, 어떻게 생각하시나요?",
    description:
      "최근 따릉이(공공자전거)를 음주 상태에서 운전하다 보행자를 다치게 한 사건이 발생했습니다. 현행법상 자전거 음주운전에 대한 처벌이 미약하다는 지적이 나오고 있는데요, 여러분의 생각은?",
    newsUrl: "https://news.example.com/article/12345",
    newsSource: "한겨레",
    date: "2026년 3월 21일",
    pickCount: 247,
    remainingTime: "6시간 32분",
    heat: 982,
  },
  {
    id: "politics-1",
    category: "politics",
    title: "국회의원 면책특권 축소, 찬성하시나요?",
    description:
      "여야가 국회의원 면책특권 범위를 명예훼손·허위사실 발언까지 제한하는 개정안을 두고 논의 중입니다. 표현의 자유와 책임의 균형, 어디에 두어야 할까요?",
    newsUrl: "https://news.example.com/article/22221",
    newsSource: "연합뉴스",
    date: "2026년 3월 21일",
    pickCount: 184,
    remainingTime: "6시간 32분",
    heat: 743,
  },
  {
    id: "tech-1",
    category: "tech",
    title: "AI 코드 리뷰가 시니어를 대체할 수 있을까?",
    description:
      "GPT-5 기반 코드 리뷰 봇이 시니어 엔지니어의 PR 리뷰 정확도를 92% 수준까지 따라잡았다는 보고가 나왔습니다. 신뢰의 임계점은 어디일까요?",
    newsUrl: "https://news.example.com/article/33331",
    newsSource: "ZDNet Korea",
    date: "2026년 3월 21일",
    pickCount: 156,
    remainingTime: "6시간 32분",
    heat: 612,
  },
  {
    id: "economy-1",
    category: "economy",
    title: "주식 양도세 전면 도입, 시장에 미칠 영향은?",
    description:
      "2027년부터 주식 양도세가 전면 시행될 예정입니다. 개인 투자자 이탈과 시장 위축에 대한 우려와, 과세 형평성 사이의 논쟁이 뜨겁습니다.",
    newsUrl: "https://news.example.com/article/44441",
    newsSource: "매일경제",
    date: "2026년 3월 21일",
    pickCount: 132,
    remainingTime: "6시간 32분",
    heat: 488,
  },
  {
    id: "culture-1",
    category: "culture",
    title: "OTT 자막 번역, AI에게 맡겨도 될까?",
    description:
      "주요 OTT 플랫폼이 AI 자막 번역 비중을 70%까지 확대했습니다. 비용 절감과 품질 저하 사이, 콘텐츠 경험은 어떻게 달라질까요?",
    newsUrl: "https://news.example.com/article/55551",
    newsSource: "씨네21",
    date: "2026년 3월 21일",
    pickCount: 94,
    remainingTime: "6시간 32분",
    heat: 321,
  },
  {
    id: "sports-1",
    category: "sports",
    title: "프로야구 로봇 심판, 전면 도입해야 할까?",
    description:
      "ABS(자동 볼·스트라이크 시스템) 정확도가 99%를 넘었지만, 경기의 인간미와 변수도 함께 사라진다는 지적이 나옵니다.",
    newsUrl: "https://news.example.com/article/66661",
    newsSource: "스포츠동아",
    date: "2026년 3월 21일",
    pickCount: 78,
    remainingTime: "6시간 32분",
    heat: 256,
  },
  // --- additional topics per category for "category sections" ---
  {
    id: "society-2",
    category: "society",
    title: "택배 분리수거 의무화, 소비자가 부담해야 할까?",
    description: "환경부가 택배 박스 분리수거를 소비자 책임으로 전환하는 방안을 검토 중입니다.",
    newsUrl: "https://news.example.com/article/12346",
    newsSource: "한겨레",
    date: "2026년 3월 21일",
    pickCount: 142,
    remainingTime: "6시간 32분",
    heat: 540,
  },
  {
    id: "society-3",
    category: "society",
    title: "노키즈존 합법화 논쟁, 어디까지 허용?",
    description: "사업주의 영업의 자유와 차별 금지 사이 균형이 다시 도마에 올랐습니다.",
    newsUrl: "https://news.example.com/article/12347",
    newsSource: "경향신문",
    date: "2026년 3월 21일",
    pickCount: 118,
    remainingTime: "6시간 32분",
    heat: 410,
  },
  {
    id: "politics-2",
    category: "politics",
    title: "선거연령 16세 인하, 시기상조일까?",
    description: "청소년 정치참여 확대와 정치적 성숙도 사이의 논쟁이 다시 점화됐습니다.",
    newsUrl: "https://news.example.com/article/22222",
    newsSource: "연합뉴스",
    date: "2026년 3월 21일",
    pickCount: 121,
    remainingTime: "6시간 32분",
    heat: 520,
  },
  {
    id: "politics-3",
    category: "politics",
    title: "지방의회 의원 정수 축소, 효율인가 후퇴인가?",
    description: "행안부가 인구 감소 지역 의원 정수 축소를 권고하면서 풀뿌리 정치 위축 우려가 나옵니다.",
    newsUrl: "https://news.example.com/article/22223",
    newsSource: "한겨레",
    date: "2026년 3월 21일",
    pickCount: 86,
    remainingTime: "6시간 32분",
    heat: 280,
  },
  {
    id: "tech-2",
    category: "tech",
    title: "오픈소스 LLM 상업적 이용 제한, 어떻게 봐야 할까?",
    description: "주요 오픈소스 모델들이 라이선스를 상업적 제한으로 전환하면서 생태계 논쟁이 가열됩니다.",
    newsUrl: "https://news.example.com/article/33332",
    newsSource: "ZDNet Korea",
    date: "2026년 3월 21일",
    pickCount: 134,
    remainingTime: "6시간 32분",
    heat: 470,
  },
  {
    id: "tech-3",
    category: "tech",
    title: "주니어 개발자 채용 빙하기, 돌파구는?",
    description: "AI 코딩 도구 보급 이후 주니어 채용이 급감하면서 진입 사다리 위기가 거론됩니다.",
    newsUrl: "https://news.example.com/article/33333",
    newsSource: "전자신문",
    date: "2026년 3월 21일",
    pickCount: 109,
    remainingTime: "6시간 32분",
    heat: 360,
  },
  {
    id: "economy-2",
    category: "economy",
    title: "재택근무 세제 혜택 폐지, 기업 자율로?",
    description: "정부가 한시적으로 운영해온 재택근무 세제 혜택의 일몰 여부를 두고 의견이 갈립니다.",
    newsUrl: "https://news.example.com/article/44442",
    newsSource: "매일경제",
    date: "2026년 3월 21일",
    pickCount: 88,
    remainingTime: "6시간 32분",
    heat: 300,
  },
  {
    id: "economy-3",
    category: "economy",
    title: "1인 가구 주택담보대출 우대, 형평성 논란",
    description: "1인 가구 전용 LTV 우대안이 다인 가구 역차별이라는 비판에 부딪혔습니다.",
    newsUrl: "https://news.example.com/article/44443",
    newsSource: "한국경제",
    date: "2026년 3월 21일",
    pickCount: 71,
    remainingTime: "6시간 32분",
    heat: 220,
  },
  {
    id: "culture-2",
    category: "culture",
    title: "K-팝 굿즈 가격 인상, 팬덤은 어디까지 감당?",
    description: "주요 기획사들이 굿즈 가격을 평균 18% 인상하며 팬덤 피로감이 커지고 있습니다.",
    newsUrl: "https://news.example.com/article/55552",
    newsSource: "씨네21",
    date: "2026년 3월 21일",
    pickCount: 76,
    remainingTime: "6시간 32분",
    heat: 240,
  },
  {
    id: "culture-3",
    category: "culture",
    title: "AI 생성 웹툰, 작가 표기 의무화 필요할까?",
    description: "AI 보조 작화 비중이 늘면서 창작자 표기와 저작권 표시 기준이 새 쟁점이 됐습니다.",
    newsUrl: "https://news.example.com/article/55553",
    newsSource: "조선일보",
    date: "2026년 3월 21일",
    pickCount: 64,
    remainingTime: "6시간 32분",
    heat: 195,
  },
  {
    id: "sports-2",
    category: "sports",
    title: "프로축구 승강제 확대, K리그 흥행 카드일까?",
    description: "K리그2와의 승강제 확대 논의가 흥행과 안정성 사이에서 평행선을 달리고 있습니다.",
    newsUrl: "https://news.example.com/article/66662",
    newsSource: "스포츠동아",
    date: "2026년 3월 21일",
    pickCount: 58,
    remainingTime: "6시간 32분",
    heat: 180,
  },
  {
    id: "sports-3",
    category: "sports",
    title: "e스포츠 정식 종목 채택, 어디까지 인정?",
    description: "아시안게임 이후 e스포츠 정식 종목 확대 범위를 두고 의견이 엇갈립니다.",
    newsUrl: "https://news.example.com/article/66663",
    newsSource: "OSEN",
    date: "2026년 3월 21일",
    pickCount: 49,
    remainingTime: "6시간 32분",
    heat: 145,
  },
];

// Run every seed entry through the PICK normalizer so the exported list is
// guaranteed to use the branded `PickCount` type and never carries legacy
// comment-count fields. Any future drift (e.g. raw `commentCount: 12`) will
// be caught at compile time and warned about at runtime in dev.
export const todayTopics: TodayTopic[] = todayTopicsSeed.map(normalizeTopicPickCount);

// ===== Topic deadline helpers =====
// All topics close at the next KST midnight (00:00 Asia/Seoul, UTC+9, no DST).
// We compute this in UTC so the result is identical regardless of the
// viewer's local timezone — a user in New York and a user in Seoul both see
// the same "next 00:00 KST" instant. Once a topic is closed, the UI must
// disable comment input, submit, and like actions for that topic.
const KST_OFFSET_MS = 9 * 60 * 60 * 1000;
const ONE_DAY_MS = 24 * 60 * 60 * 1000;

export const getTopicDeadline = (_topic?: { date?: string }): Date => {
  const now = Date.now();
  // Shift to KST wall clock, floor to start-of-day, add one day, shift back.
  const kstNow = now + KST_OFFSET_MS;
  const kstStartOfDay = Math.floor(kstNow / ONE_DAY_MS) * ONE_DAY_MS;
  const kstNextMidnight = kstStartOfDay + ONE_DAY_MS;
  return new Date(kstNextMidnight - KST_OFFSET_MS);
};

// KST calendar day stamp (YYYY-MM-DD in Asia/Seoul) — used as the per-day
// "already commented" key so the lock rolls over exactly at KST midnight,
// not at the viewer's local midnight.
export const getKstDayStamp = (now: Date = new Date()): string => {
  const kst = new Date(now.getTime() + KST_OFFSET_MS);
  const y = kst.getUTCFullYear();
  const m = kst.getUTCMonth() + 1;
  const d = kst.getUTCDate();
  return `${y}-${m}-${d}`;
};

export const isTopicClosed = (topic?: { date?: string }, now: Date = new Date()): boolean => {
  return now.getTime() >= getTopicDeadline(topic).getTime();
};

// Format remaining time as "Xh Ym" / "Ym Zs". Returns "마감" when closed.
export const formatRemaining = (deadline: Date, now: Date = new Date()): string => {
  const ms = deadline.getTime() - now.getTime();
  if (ms <= 0) return "마감";
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  if (h > 0) return `${h}시간 ${m}분`;
  if (m > 0) return `${m}분 ${s}초`;
  return `${s}초`;
};

// Precise live countdown — always renders HH:MM:SS so users can see the
// exact moment the daily PICK slot reopens. Returns "00:00:00" when closed.
export const formatRemainingClock = (deadline: Date, now: Date = new Date()): string => {
  const ms = Math.max(0, deadline.getTime() - now.getTime());
  const totalSec = Math.floor(ms / 1000);
  const h = Math.floor(totalSec / 3600);
  const m = Math.floor((totalSec % 3600) / 60);
  const s = totalSec % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${pad(h)}:${pad(m)}:${pad(s)}`;
};

// Deterministic tie-break for ranking topics:
// 1) heat desc  2) pickCount desc  3) id asc (lexicographic, stable fallback)
// Guarantees a single, reproducible "#1" even when popularity scores tie.
export const compareTopics = (a: TodayTopic, b: TodayTopic) => {
  if (b.heat !== a.heat) return b.heat - a.heat;
  if (b.pickCount !== a.pickCount) return b.pickCount - a.pickCount;
  return a.id.localeCompare(b.id);
};

// The hottest topic of the day (single, stable winner) — base seed only.
// For the actually-displayed topic (which honors admin overrides + admin
// drafts), use `getActiveTodayTopic()` / `useTodayTopic()` instead.
export const todayTopic = [...todayTopics].sort(compareTopics)[0];

// Topics grouped by category, sorted with the same tie-break rule.
// Base seed only — UI should prefer `useTopicsByCategory()`.
export const topicsByCategory = (cat: CategoryId) =>
  todayTopics.filter((t) => t.category === cat).sort(compareTopics);

// ===== Admin-aware topic accessors =======================================
// These merge admin-created topic drafts into the base list and respect the
// admin's "force this as today's topic" override. Kept here (not in
// adminData) so all topic consumers go through one place.
import { adminStore, adminEvent, type AdminTopicDraft } from "./adminData";
import { useEffect, useState } from "react";

const adminDraftToTopic = (d: AdminTopicDraft): TodayTopic => ({
  id: d.id,
  category: (d.category as CategoryId) || "society",
  title: d.title,
  description: d.description,
  newsUrl: d.newsUrl || "#",
  newsSource: d.newsSource || "관리자 등록",
  date: d.date,
  // Admin-pushed topics start cold but are pinned via override; give them a
  // small heat so they still rank reasonably if not explicitly forced.
  pickCount: toPickCount(0),
  remainingTime: "",
  heat: 0,
});

export const getMergedTopics = (): TodayTopic[] => {
  const drafts = adminStore.getTopics().map(adminDraftToTopic);
  return [...drafts, ...todayTopics];
};

// Topics for a category, with the per-category forced override pinned to the
// top of the list. The forced topic is also injected if it isn't already in
// the merged list (defensive — shouldn't happen, but keeps UI consistent).
export const getMergedTopicsByCategory = (cat: CategoryId): TodayTopic[] => {
  const all = getMergedTopics();
  const forcedId = adminStore.getActiveTopicIdForCategory(cat);
  const inCat = all.filter((t) => t.category === cat).sort(compareTopics);
  if (!forcedId) return inCat;
  const forced = all.find((t) => t.id === forcedId);
  if (!forced) return inCat;
  // Pin forced first, dedupe.
  return [forced, ...inCat.filter((t) => t.id !== forcedId)];
};

// Resolve the displayed "today" topic. When `category` is passed, the
// per-category override (if any) wins over the global override; otherwise
// the global override (then default ranking) is used.
export const getActiveTodayTopic = (category?: CategoryId): TodayTopic => {
  const merged = getMergedTopics();

  if (category) {
    const catForced = adminStore.getActiveTopicIdForCategory(category);
    if (catForced) {
      const found = merged.find((t) => t.id === catForced);
      if (found) return found;
    }
    // No category override → fall through to the category's natural #1.
    const catList = merged.filter((t) => t.category === category).sort(compareTopics);
    if (catList[0]) return catList[0];
  }

  const forcedId = adminStore.getActiveTopicId();
  if (forcedId) {
    const forced = merged.find((t) => t.id === forcedId);
    if (forced) return forced;
  }
  return [...merged].sort(compareTopics)[0] ?? todayTopic;
};

export const findTopicById = (id: string): TodayTopic | undefined =>
  getMergedTopics().find((t) => t.id === id);

// React hooks — re-render whenever admin changes topics or any override.
const subscribeAdmin = (cb: () => void) => {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(adminEvent, cb);
  window.addEventListener("storage", cb);
  return () => {
    window.removeEventListener(adminEvent, cb);
    window.removeEventListener("storage", cb);
  };
};

export const useTodayTopic = (category?: CategoryId): TodayTopic => {
  const [t, setT] = useState<TodayTopic>(() => getActiveTodayTopic(category));
  useEffect(() => subscribeAdmin(() => setT(getActiveTodayTopic(category))), [category]);
  return t;
};

export const useMergedTopics = (): TodayTopic[] => {
  const [list, setList] = useState<TodayTopic[]>(() => getMergedTopics());
  useEffect(() => subscribeAdmin(() => setList(getMergedTopics())), []);
  return list;
};

export const useTopicsByCategory = (cat: CategoryId): TodayTopic[] => {
  const [list, setList] = useState<TodayTopic[]>(() => getMergedTopicsByCategory(cat));
  useEffect(() => subscribeAdmin(() => setList(getMergedTopicsByCategory(cat))), [cat]);
  return list;
};

export const useActiveTopicId = (): string | null => {
  const [id, setId] = useState<string | null>(() => adminStore.getActiveTopicId());
  useEffect(() => subscribeAdmin(() => setId(adminStore.getActiveTopicId())), []);
  return id;
};

export const useActiveTopicByCategoryMap = (): Record<string, string> => {
  const [map, setMap] = useState<Record<string, string>>(
    () => adminStore.getActiveTopicByCategoryMap()
  );
  useEffect(
    () => subscribeAdmin(() => setMap(adminStore.getActiveTopicByCategoryMap())),
    []
  );
  return map;
};



export const todayPicks = [
  {
    id: "1",
    username: "시민의식",
    text: "자전거도 엄연한 교통수단입니다. 음주운전 처벌 기준을 자동차와 동일하게 강화해야 합니다. 피해자 보호가 최우선이어야 해요.",
    likes: 128,
    isLiked: false,
  },
  {
    id: "2",
    username: "법학도",
    text: "현행 도로교통법 제156조에 따르면 자전거 음주운전은 범칙금 3만원에 불과합니다. 최소한 면허 정지에 준하는 제재가 필요합니다.",
    likes: 95,
    isLiked: true,
  },
  {
    id: "3",
    username: "따릉이러버",
    text: "처벌 강화도 중요하지만, 음주 후 따릉이 대여를 막는 기술적 장치(예: 음주 감지 잠금)도 함께 논의되어야 한다고 봅니다.",
    likes: 87,
    isLiked: false,
  },
  {
    id: "4",
    username: "현실주의자",
    text: "솔직히 킥보드, 자전거 다 음주운전 단속이 제대로 안 되고 있잖아요. 법만 강화하면 뭐합니까, 단속 인력부터 확보해야죠.",
    likes: 62,
    isLiked: false,
  },
];

export interface ArchiveItem {
  date: string;
  category: CategoryId;
  title: string;
  description: string;
  newsSource: string;
  bestUser: string;
  bestPick: string;
  bestLikes: number;
  /** 그날 PICK을 남긴 참여자 수 (하루 1인 1 PICK 기준). */
  totalPicks: PickCount;
}

const archiveSeed: Array<Omit<ArchiveItem, "totalPicks"> & { totalPicks: number }> = [
  {
    date: "2026년 3월 20일",
    category: "tech",
    title: "AI 면접관, 공정한가요?",
    description:
      "주요 대기업이 AI 1차 면접 도입을 확대하면서, 공정성·편향·투명성에 대한 사회적 논의가 본격화됐습니다.",
    newsSource: "ZDNet Korea",
    bestUser: "테크윤리",
    bestPick:
      "AI 면접은 편향을 줄일 수 있지만, 학습 데이터 자체에 편향이 있다면 오히려 차별을 고착화할 수 있습니다. 투명한 알고리즘 공개가 선행되어야 합니다.",
    bestLikes: 203,
    totalPicks: 89,
  },
  {
    date: "2026년 3월 19일",
    category: "economy",
    title: "주 4일제, 현실적으로 가능할까?",
    description:
      "정부가 주 4일제 시범사업 확대안을 발표하면서 생산성과 인건비 부담 사이의 균형이 다시 쟁점이 됐습니다.",
    newsSource: "매일경제",
    bestUser: "워라밸마스터",
    bestPick:
      "아이슬란드의 실험 결과를 보면 생산성이 오히려 올랐습니다. 한국도 단계적으로 도입할 수 있다고 봅니다. 다만 중소기업 지원책이 병행되어야 해요.",
    bestLikes: 176,
    totalPicks: 112,
  },
  {
    date: "2026년 3월 18일",
    category: "society",
    title: "학교에서 스마트폰 금지, 맞을까요?",
    description:
      "교육부가 초·중학교 수업 중 스마트폰 사용 제한 가이드라인을 공개하면서 가정·학교의 역할 논쟁이 커졌습니다.",
    newsSource: "한겨레",
    bestUser: "교육전문가",
    bestPick:
      "전면 금지보다는 수업 시간 사용 제한이 현실적입니다. 디지털 리터러시 교육을 통해 올바른 사용 습관을 길러주는 게 장기적으로 더 효과적이에요.",
    bestLikes: 154,
    totalPicks: 76,
  },
  {
    date: "2026년 3월 17일",
    category: "society",
    title: "반려동물 등록제 의무화, 찬성하시나요?",
    description:
      "유기동물 증가와 함께 반려동물 등록제 의무화 강화 법안이 발의되며 찬반 여론이 팽팽하게 갈리고 있습니다.",
    newsSource: "경향신문",
    bestUser: "동물복지연대",
    bestPick:
      "유기동물 문제의 근본 해결을 위해 반드시 필요합니다. 다만 등록 절차를 간소화하고, 저소득층에 대한 비용 지원이 함께 이루어져야 실효성이 있습니다.",
    bestLikes: 189,
    totalPicks: 93,
  },
  {
    date: "2026년 3월 16일",
    category: "politics",
    title: "선거 사전투표 전면 확대, 어떻게 보시나요?",
    description:
      "사전투표 기간 확대안이 국회에 제출되면서 투표율 제고와 행정 비용 사이의 절충점이 논의되고 있습니다.",
    newsSource: "연합뉴스",
    bestUser: "정치읽기",
    bestPick:
      "참여 장벽을 낮추는 방향은 맞습니다. 다만 사전투표함 보관·이송 검증을 동시에 강화해야 신뢰가 따라옵니다.",
    bestLikes: 142,
    totalPicks: 81,
  },
  {
    date: "2026년 3월 15일",
    category: "culture",
    title: "AI 더빙, 성우의 자리를 대체할까?",
    description:
      "글로벌 OTT의 AI 더빙 도입이 가속화되면서 성우 업계의 처우와 창작 윤리가 새 쟁점으로 떠올랐습니다.",
    newsSource: "씨네21",
    bestUser: "보이스아카이브",
    bestPick:
      "효율은 분명하지만 감정 연기의 결은 아직 사람만이 만듭니다. 사용 표기 의무화와 수익 배분 체계가 선결돼야 합니다.",
    bestLikes: 131,
    totalPicks: 64,
  },
  {
    date: "2026년 3월 14일",
    category: "sports",
    title: "프로야구 피치클락, 경기의 맛을 살릴까?",
    description:
      "KBO가 피치클락 도입 한 달 만에 평균 경기시간 18분 단축을 발표하며 정착 여부가 관심을 모으고 있습니다.",
    newsSource: "스포츠동아",
    bestUser: "야구의정석",
    bestPick:
      "템포 빨라진 건 환영합니다. 다만 투수 부상 리스크 데이터가 한 시즌은 누적돼야 진짜 평가가 가능할 것 같아요.",
    bestLikes: 118,
    totalPicks: 57,
  },
];

// Same guarantee as `todayTopics`: every archive entry is normalized so
// `totalPicks` is a branded `PickCount` and any legacy comment fields would
// be stripped/warned about.
export const archiveData: ArchiveItem[] = archiveSeed.map(normalizeArchivePickCount);
// string. Used for deep-link sharing (e.g. /archive?item=2026-03-20).
export const getArchiveItemId = (item: ArchiveItem): string => {
  const m = item.date.match(/(\d+)년\s*(\d+)월\s*(\d+)일/);
  if (m) {
    const [, y, mo, d] = m;
    return `${y}-${mo.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }
  return encodeURIComponent(item.date);
};

export const findArchiveItemById = (id: string): ArchiveItem | undefined =>
  archiveData.find((it) => getArchiveItemId(it) === id);

export const weeklyRanking = [
  { rank: 1, username: "시민의식", wins: 3, totalLikes: 412 },
  { rank: 2, username: "테크윤리", wins: 2, totalLikes: 356 },
  { rank: 3, username: "워라밸마스터", wins: 2, totalLikes: 298 },
  { rank: 4, username: "법학도", wins: 1, totalLikes: 245 },
  { rank: 5, username: "교육전문가", wins: 1, totalLikes: 198 },
];

export const monthlyRanking = [
  { rank: 1, username: "테크윤리", wins: 8, totalLikes: 1520 },
  { rank: 2, username: "시민의식", wins: 7, totalLikes: 1389 },
  { rank: 3, username: "동물복지연대", wins: 5, totalLikes: 1102 },
  { rank: 4, username: "워라밸마스터", wins: 4, totalLikes: 987 },
  { rank: 5, username: "법학도", wins: 3, totalLikes: 756 },
];
