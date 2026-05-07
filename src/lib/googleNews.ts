// Google News RSS fetcher (frontend-only, via CORS proxy).
// 데모/목업용. 실서비스에서는 백엔드 프록시 권장.

import type { CategoryId } from "@/data/mockData";

export interface NewsItem {
  title: string;
  link: string;
  source: string;
  pubDate: string;
}

// 카테고리별 Google News 검색 키워드.
const CATEGORY_QUERY: Record<CategoryId, string> = {
  politics: "정치",
  tech: "IT OR 테크 OR 개발",
  society: "사회",
  culture: "문화 OR 연예",
  economy: "경제",
  sports: "스포츠",
};

const PROXY = "https://api.allorigins.win/raw?url=";

/** 구글 뉴스 RSS 검색 → 상위 N개 기사. CORS 회피 위해 allorigins 프록시 경유. */
export async function fetchTopNewsByCategory(
  category: CategoryId,
  limit = 5,
): Promise<NewsItem[]> {
  const q = encodeURIComponent(CATEGORY_QUERY[category]);
  const rssUrl = `https://news.google.com/rss/search?q=${q}+when:1d&hl=ko&gl=KR&ceid=KR:ko`;
  const url = PROXY + encodeURIComponent(rssUrl);

  const res = await fetch(url);
  if (!res.ok) throw new Error(`뉴스 가져오기 실패 (${res.status})`);
  const xml = await res.text();

  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.querySelector("parsererror")) throw new Error("RSS 파싱 실패");

  const items = Array.from(doc.querySelectorAll("item")).slice(0, limit);
  return items.map((item) => {
    const rawTitle = item.querySelector("title")?.textContent ?? "";
    const link = item.querySelector("link")?.textContent ?? "";
    const pubDate = item.querySelector("pubDate")?.textContent ?? "";
    const source =
      item.querySelector("source")?.textContent ??
      // Google News title 형식: "기사 제목 - 출처"
      rawTitle.split(" - ").slice(-1)[0] ??
      "";
    const title = rawTitle.replace(new RegExp(` - ${source}$`), "").trim();
    return { title, link, source, pubDate };
  });
}
