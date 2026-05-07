// Google News RSS fetcher via rss2json (JSON, CORS-friendly).
// 데모/목업용. 실서비스에서는 백엔드 프록시 권장.

import type { CategoryId } from "@/data/mockData";

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
}

const CATEGORY_QUERY: Record<CategoryId, string> = {
  politics: "정치",
  tech: "IT 테크",
  society: "사회",
  culture: "문화 연예",
  economy: "경제",
  sports: "스포츠",
};

interface Rss2JsonItem {
  title: string;
  link: string;
  pubDate: string;
  author?: string;
  description?: string;
}

interface Rss2JsonResponse {
  status: string;
  message?: string;
  items?: Rss2JsonItem[];
}

export async function fetchTopNewsByCategory(
  category: CategoryId,
  limit = 5,
): Promise<NewsItem[]> {
  const q = encodeURIComponent(CATEGORY_QUERY[category]);
  const rssUrl = `https://news.google.com/rss/search?q=${q}&hl=ko&gl=KR&ceid=KR:ko`;
  const url = `https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}&count=${limit}`;

  const res = await fetch(url);
  if (!res.ok) throw new Error(`뉴스 가져오기 실패 (${res.status})`);
  const data: Rss2JsonResponse = await res.json();
  if (data.status !== "ok" || !data.items) {
    throw new Error(data.message ?? "뉴스 응답이 올바르지 않습니다");
  }

  return data.items.slice(0, limit).map((item) => {
    const rawTitle = item.title ?? "";
    // Google News title 형식: "기사 제목 - 출처"
    const dashIdx = rawTitle.lastIndexOf(" - ");
    const source = dashIdx > 0 ? rawTitle.slice(dashIdx + 3) : "";
    const title = dashIdx > 0 ? rawTitle.slice(0, dashIdx).trim() : rawTitle;
    return {
      title,
      link: item.link,
      source,
      pubDate: item.pubDate,
    };
  });
}
