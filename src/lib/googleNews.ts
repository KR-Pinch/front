// Google News RSS fetcher (frontend-only, via CORS proxy with fallbacks).
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

// 여러 공개 CORS 프록시 — 하나 실패하면 다음 시도
const PROXIES: Array<(u: string) => string> = [
  (u) => `https://corsproxy.io/?${encodeURIComponent(u)}`,
  (u) => `https://api.codetabs.com/v1/proxy/?quest=${encodeURIComponent(u)}`,
  (u) => `https://api.allorigins.win/raw?url=${encodeURIComponent(u)}`,
];

async function fetchWithFallback(targetUrl: string): Promise<string> {
  let lastErr: unknown = null;
  for (const wrap of PROXIES) {
    try {
      const res = await fetch(wrap(targetUrl), {
        headers: { Accept: "application/rss+xml, application/xml, text/xml, */*" },
      });
      if (!res.ok) {
        lastErr = new Error(`HTTP ${res.status}`);
        continue;
      }
      const text = await res.text();
      if (text && text.trim().length > 0) return text;
      lastErr = new Error("빈 응답");
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error ? lastErr : new Error("모든 프록시 실패");
}

export async function fetchTopNewsByCategory(
  category: CategoryId,
  limit = 5,
): Promise<NewsItem[]> {
  const q = encodeURIComponent(CATEGORY_QUERY[category]);
  const rssUrl = `https://news.google.com/rss/search?q=${q}&hl=ko&gl=KR&ceid=KR:ko`;

  const xml = await fetchWithFallback(rssUrl);

  const doc = new DOMParser().parseFromString(xml, "text/xml");
  if (doc.querySelector("parsererror")) throw new Error("RSS 파싱 실패");

  const items = Array.from(doc.querySelectorAll("item")).slice(0, limit);
  return items.map((item) => {
    const rawTitle = item.querySelector("title")?.textContent ?? "";
    const link = item.querySelector("link")?.textContent ?? "";
    const pubDate = item.querySelector("pubDate")?.textContent ?? "";
    const source =
      item.querySelector("source")?.textContent ??
      rawTitle.split(" - ").slice(-1)[0] ??
      "";
    const title = rawTitle.replace(new RegExp(` - ${source}$`), "").trim();
    return { title, link, source, pubDate };
  });
}
