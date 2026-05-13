import type { ArchiveItem, RankingEntry, TodayTopic } from "@/data/mockData";

export type JsonLdObject = Record<string, unknown>;

export const SITE_URL = "https://pinch.kr";
export const SITE_NAME = "PINCH";
export const SITE_LOCALE = "ko_KR";
export const SITE_LANGUAGE = "ko-KR";
export const SITE_TAGLINE = "매일 하나의 주제, 오직 선택된 하나의 의견";
export const SITE_DESCRIPTION =
  "PINCH는 매일 하나의 핫토픽에 1인 1 PINCH으로 의견을 남기는 한국형 토론 플랫폼입니다. 가장 공감받은 의견 하나만 아카이브에 기록됩니다.";
export const DEFAULT_OG_IMAGE = "/og-cover.png";
export const DEFAULT_OG_ALT = "PINCH — 매일 하나의 선택된 의견";
export const SEARCH_ICON_URL = "/google-favicon-48x48.png";
export const BRAND_LOGO_URL = "/icon-512.png";
export const SEO_PUBLISHED_AT = "2026-05-11T00:00:00+09:00";
export const SEO_LAST_MODIFIED = "2026-05-13T00:00:00+09:00";
export const SITE_KEYWORDS = [
  "PINCH",
  "핀치",
  "오늘의 PINCH",
  "오늘의 핫토픽",
  "토론 플랫폼",
  "의견 아카이브",
  "PINCH 토론",
  "오늘의 토론",
  "1인 1의견",
  "댓글 랭킹",
  "한국형 토론 플랫폼",
];
export const HOME_SEO_KEYWORDS = [
  ...SITE_KEYWORDS,
  "오늘의 핫토픽",
  "오늘의 토론",
  "한국 토론 플랫폼",
  "1인 1의견",
  "댓글 랭킹",
  "의견 랭킹",
  "이슈 토론",
  "시사 토론",
  "오늘 토론 주제",
  "1인 1의견",
  "베스트 댓글",
  "한국형 토론 플랫폼",
  "PINCH 토론",
];
export const TOPIC_SEO_KEYWORDS = [
  "오늘의 PINCH",
  "오늘의 핫토픽",
  "오늘의 토론 주제",
  "실시간 의견",
  "이슈 토론",
  "1인 1의견",
  "PINCH 토론",
];
export const ARCHIVE_SEO_KEYWORDS = [
  "PINCH 아카이브",
  "토론 아카이브",
  "선택된 의견",
  "베스트 댓글",
  "지난 핫토픽",
  "의견 모음",
];
export const RANKING_SEO_KEYWORDS = [
  "PINCH 랭킹",
  "댓글 랭킹",
  "의견 랭킹",
  "토론 랭킹",
  "베스트 의견",
  "주간 랭킹",
  "월간 랭킹",
];
export const PRIMARY_NAVIGATION = [
  { name: "오늘의 PINCH", path: "/" },
  { name: "토론 참여", path: "/topic" },
  { name: "PINCH 아카이브", path: "/archive" },
  { name: "PINCH 랭킹", path: "/ranking" },
  { name: "PINCH 검색 가이드", path: "/guide/" },
];

export const absoluteUrl = (path = "/") => {
  if (/^https?:\/\//i.test(path)) return path;
  return new URL(path.startsWith("/") ? path : `/${path}`, SITE_URL).toString();
};

export const cleanDescription = (value: string, maxLength = 155) => {
  const normalized = value.replace(/\s+/g, " ").trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength - 1).trimEnd()}…`;
};

export const toKstIsoDate = (value?: string, fallback = SEO_LAST_MODIFIED) => {
  if (!value) return fallback;
  const match = value.match(/(\d+)\uB144\s*(\d+)\uC6D4\s*(\d+)\uC77C/);
  if (!match) return fallback;
  const [, year, month, day] = match;
  return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}T00:00:00+09:00`;
};

export const topicPath = (topic: Pick<TodayTopic, "id" | "category">) =>
  `/topic?topic=${encodeURIComponent(topic.id)}&category=${encodeURIComponent(topic.category)}`;

export const breadcrumbJsonLd = (
  items: Array<{ name: string; path: string }>,
): JsonLdObject => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: items.map((item, index) => ({
    "@type": "ListItem",
    position: index + 1,
    name: item.name,
    item: absoluteUrl(item.path),
  })),
});

export const siteJsonLd = (): JsonLdObject[] => [
  {
    "@context": "https://schema.org",
    "@type": "Organization",
    "@id": `${SITE_URL}/#organization`,
    name: SITE_NAME,
    alternateName: ["핀치", "오늘의 PINCH"],
    url: SITE_URL,
    logo: {
      "@type": "ImageObject",
      "@id": `${SITE_URL}/#logo`,
      url: absoluteUrl(BRAND_LOGO_URL),
      width: 512,
      height: 512,
    },
    image: { "@id": `${SITE_URL}/#logo` },
  },
  {
    "@context": "https://schema.org",
    "@type": "WebSite",
    "@id": `${SITE_URL}/#website`,
    url: SITE_URL,
    name: SITE_NAME,
    alternateName: ["오늘의 PINCH", "핀치"],
    description: SITE_DESCRIPTION,
    inLanguage: SITE_LANGUAGE,
    keywords: SITE_KEYWORDS,
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    datePublished: SEO_PUBLISHED_AT,
    dateModified: SEO_LAST_MODIFIED,
    publisher: { "@id": `${SITE_URL}/#organization` },
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/archive?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  },
  {
    "@context": "https://schema.org",
    "@type": "ItemList",
    "@id": `${SITE_URL}/#site-navigation`,
    name: "PINCH 주요 메뉴",
    itemListElement: PRIMARY_NAVIGATION.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      item: {
        "@type": "SiteNavigationElement",
        name: item.name,
        url: absoluteUrl(item.path),
      },
    })),
  },
  {
    "@context": "https://schema.org",
    "@type": "WebApplication",
    "@id": `${SITE_URL}/#app`,
    name: SITE_NAME,
    url: SITE_URL,
    applicationCategory: "SocialNetworkingApplication",
    operatingSystem: "Web",
    inLanguage: SITE_LANGUAGE,
    description: SITE_DESCRIPTION,
    keywords: SITE_KEYWORDS,
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    datePublished: SEO_PUBLISHED_AT,
    dateModified: SEO_LAST_MODIFIED,
    offers: {
      "@type": "Offer",
      price: "0",
      priceCurrency: "KRW",
    },
  },
];

export const homeJsonLd = (topics: TodayTopic[]): JsonLdObject[] => [
  ...siteJsonLd(),
  {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    "@id": `${SITE_URL}/#faq`,
    inLanguage: SITE_LANGUAGE,
    mainEntity: [
      {
        "@type": "Question",
        name: "PINCH는 어떤 서비스인가요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "PINCH는 매일 하나의 핫토픽에 1인 1의견으로 참여하고, 가장 공감받은 의견을 아카이브하는 한국형 토론 플랫폼입니다.",
        },
      },
      {
        "@type": "Question",
        name: "PINCH는 어떤 검색어와 관련 있나요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "오늘의 PINCH, 오늘의 핫토픽, 오늘의 토론, 한국 토론 플랫폼, 댓글 랭킹, 의견 아카이브 같은 검색어와 관련 있습니다.",
        },
      },
      {
        "@type": "Question",
        name: "PINCH 아카이브에는 무엇이 남나요?",
        acceptedAnswer: {
          "@type": "Answer",
          text: "지난 토론 주제와 그날 가장 공감받은 선택된 의견 하나가 PINCH 아카이브에 기록됩니다.",
        },
      },
    ],
  },
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/#home`,
    url: SITE_URL,
    name: `오늘의 PINCH | ${SITE_NAME}`,
    description: SITE_DESCRIPTION,
    inLanguage: SITE_LANGUAGE,
    datePublished: SEO_PUBLISHED_AT,
    dateModified: SEO_LAST_MODIFIED,
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: {
      "@type": "ItemList",
      name: "오늘의 토론 주제",
      itemListElement: topics.slice(0, 6).map((topic, index) => ({
        "@type": "ListItem",
        position: index + 1,
        url: absoluteUrl(topicPath(topic)),
        name: topic.title,
        description: cleanDescription(topic.description, 180),
      })),
    },
  },
];

export const topicJsonLd = (
  topic: TodayTopic,
  options: { categoryLabel?: string; pinchCount?: number } = {},
): JsonLdObject[] => {
  const path = topicPath(topic);
  const description = cleanDescription(topic.description, 180);

  return [
    breadcrumbJsonLd([
      { name: "홈", path: "/" },
      { name: "오늘의 PINCH", path },
    ]),
    {
      "@context": "https://schema.org",
      "@type": "DiscussionForumPosting",
      "@id": `${absoluteUrl(path)}#discussion`,
      url: absoluteUrl(path),
      headline: topic.title,
      name: topic.title,
      text: description,
      articleBody: description,
      inLanguage: SITE_LANGUAGE,
      datePublished: toKstIsoDate(topic.date),
      dateModified: SEO_LAST_MODIFIED,
      dateCreated: toKstIsoDate(topic.date),
      author: { "@id": `${SITE_URL}/#organization` },
      isPartOf: { "@id": `${SITE_URL}/#website` },
      about: options.categoryLabel ?? topic.category,
      articleSection: options.categoryLabel ?? topic.category,
      discussionUrl: absoluteUrl(path),
      image: absoluteUrl(DEFAULT_OG_IMAGE),
      mainEntityOfPage: absoluteUrl(path),
      keywords: [topic.category, "오늘의 핫토픽", "PINCH", "토론"],
      commentCount: options.pinchCount ?? Number(topic.pinchCount),
      interactionStatistic: {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: options.pinchCount ?? Number(topic.pinchCount),
      },
      publisher: { "@id": `${SITE_URL}/#organization` },
    },
  ];
};

export const archiveCollectionJsonLd = (items: ArchiveItem[]): JsonLdObject[] => [
  breadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: "아카이브", path: "/archive" },
  ]),
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/archive#collection`,
    url: absoluteUrl("/archive"),
    name: "PINCH 아카이브",
    description: "지난 핫토픽과 그날 가장 공감받은 단 하나의 PINCH 모음입니다.",
    inLanguage: SITE_LANGUAGE,
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    datePublished: SEO_PUBLISHED_AT,
    dateModified: SEO_LAST_MODIFIED,
    keywords: ["PINCH 아카이브", "토론 아카이브", "오늘의 의견"],
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: {
      "@type": "ItemList",
      name: "선택된 PINCH 아카이브",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.title,
        description: cleanDescription(item.description, 180),
      })),
    },
  },
];

export const archiveItemJsonLd = (item: ArchiveItem, path: string): JsonLdObject[] => [
  breadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: "아카이브", path: "/archive" },
    { name: item.title, path },
  ]),
  {
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${absoluteUrl(path)}#article`,
    url: absoluteUrl(path),
    headline: item.title,
    description: cleanDescription(item.description, 180),
    articleBody: cleanDescription(item.bestPinch, 500),
    inLanguage: SITE_LANGUAGE,
    datePublished: toKstIsoDate(item.date),
    dateModified: SEO_LAST_MODIFIED,
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    mainEntityOfPage: absoluteUrl(path),
    articleSection: item.category,
    keywords: [item.category, "PINCH 아카이브", "선택된 의견"],
    author: {
      "@type": "Person",
      name: item.bestUser,
    },
    publisher: { "@id": `${SITE_URL}/#organization` },
    interactionStatistic: [
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/LikeAction",
        userInteractionCount: item.bestLikes,
      },
      {
        "@type": "InteractionCounter",
        interactionType: "https://schema.org/CommentAction",
        userInteractionCount: Number(item.totalPinches),
      },
    ],
  },
];

export const rankingJsonLd = (entries: RankingEntry[], periodLabel: string): JsonLdObject[] => [
  breadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: "똑똑이 랭킹", path: "/ranking" },
  ]),
  {
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "@id": `${SITE_URL}/ranking#ranking`,
    url: absoluteUrl("/ranking"),
    name: `PINCH ${periodLabel} 랭킹`,
    description: "PINCH에서 가장 공감받은 의견 작성자 순위입니다.",
    inLanguage: SITE_LANGUAGE,
    image: absoluteUrl(DEFAULT_OG_IMAGE),
    datePublished: SEO_PUBLISHED_AT,
    dateModified: SEO_LAST_MODIFIED,
    keywords: ["PINCH 랭킹", "토론 랭킹", "의견 랭킹"],
    isPartOf: { "@id": `${SITE_URL}/#website` },
    mainEntity: {
      "@type": "ItemList",
      name: `PINCH ${periodLabel} 랭킹`,
      itemListOrder: "https://schema.org/ItemListOrderDescending",
      itemListElement: entries.map((entry) => ({
        "@type": "ListItem",
        position: entry.rank,
        item: {
          "@type": "Person",
          name: entry.username,
          description: `${periodLabel} ${entry.wins}회 선정, 좋아요 ${entry.totalLikes}개`,
        },
      })),
    },
  },
];

export const legalJsonLd = (
  title: string,
  description: string,
  path: string,
): JsonLdObject[] => [
  breadcrumbJsonLd([
    { name: "홈", path: "/" },
    { name: title, path },
  ]),
  {
    "@context": "https://schema.org",
    "@type": "WebPage",
    "@id": `${absoluteUrl(path)}#webpage`,
    url: absoluteUrl(path),
    name: title,
    description,
    inLanguage: SITE_LANGUAGE,
    datePublished: SEO_PUBLISHED_AT,
    dateModified: SEO_LAST_MODIFIED,
    isPartOf: { "@id": `${SITE_URL}/#website` },
  },
];
