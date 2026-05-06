import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const SITE_URL = "https://usepinch.lovable.app";
const DEFAULT_OG = `${SITE_URL}/og-cover.png`;

interface SeoProps {
  title: string;
  description: string;
  /** Path-only canonical (e.g. "/archive"). Defaults to current pathname. */
  path?: string;
  ogImage?: string;
  /** When true, sets robots = noindex,follow (e.g. auth, admin, mypage). */
  noindex?: boolean;
  /** Optional JSON-LD object — stringified and injected as a script tag. */
  jsonLd?: Record<string, unknown> | Record<string, unknown>[];
}

const upsertMeta = (selector: string, attrs: Record<string, string>) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
};

const upsertLink = (rel: string, href: string) => {
  let el = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!el) {
    el = document.createElement("link");
    el.setAttribute("rel", rel);
    document.head.appendChild(el);
  }
  el.setAttribute("href", href);
};

/**
 * Per-route SEO updater. Lightweight (no react-helmet) — directly mutates
 * document.head on mount and route change so Googlebot's rendered HTML
 * carries page-specific title / description / canonical / OG tags.
 */
const Seo = ({ title, description, path, ogImage, noindex, jsonLd }: SeoProps) => {
  const location = useLocation();

  useEffect(() => {
    const url = `${SITE_URL}${path ?? location.pathname}`;
    const image = ogImage ?? DEFAULT_OG;

    document.title = title;

    upsertMeta('meta[name="description"]', { name: "description", content: description });
    upsertMeta('meta[name="robots"]', {
      name: "robots",
      content: noindex
        ? "noindex, follow"
        : "index, follow, max-image-preview:large, max-snippet:-1",
    });

    upsertLink("canonical", url);

    upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: url });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: image });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: "website" });
    upsertMeta('meta[property="og:locale"]', { property: "og:locale", content: "ko_KR" });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: "PINCH" });

    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });

    // JSON-LD per page (replace any prior page-scoped block)
    const PREV_ID = "page-jsonld";
    document.getElementById(PREV_ID)?.remove();
    if (jsonLd) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = PREV_ID;
      script.text = JSON.stringify(jsonLd);
      document.head.appendChild(script);
    }
  }, [title, description, path, ogImage, noindex, jsonLd, location.pathname]);

  return null;
};

export default Seo;
