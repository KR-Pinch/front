import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  absoluteUrl,
  DEFAULT_OG_ALT,
  DEFAULT_OG_IMAGE,
  SEO_LAST_MODIFIED,
  SITE_LOCALE,
  SITE_NAME,
  SITE_URL,
  type JsonLdObject,
} from "@/lib/seo";

interface SeoProps {
  title: string;
  description: string;
  /** Path-only canonical (e.g. "/archive"). Defaults to current pathname. */
  path?: string;
  ogImage?: string;
  ogImageAlt?: string;
  ogType?: "website" | "article";
  keywords?: string[];
  publishedTime?: string;
  modifiedTime?: string;
  section?: string;
  tags?: string[];
  /** When true, sets robots = noindex,follow (e.g. auth, admin, mypage). */
  noindex?: boolean;
  /** Optional JSON-LD object — stringified and injected as a script tag. */
  jsonLd?: JsonLdObject | JsonLdObject[];
}

const upsertMeta = (selector: string, attrs: Record<string, string>) => {
  let el = document.head.querySelector<HTMLMetaElement>(selector);
  if (!el) {
    el = document.createElement("meta");
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
};

const upsertLink = (selector: string, attrs: Record<string, string>) => {
  let el = document.head.querySelector<HTMLLinkElement>(selector);
  if (!el) {
    el = document.createElement("link");
    document.head.appendChild(el);
  }
  Object.entries(attrs).forEach(([k, v]) => el!.setAttribute(k, v));
};

/**
 * Per-route SEO updater. Lightweight (no react-helmet) — directly mutates
 * document.head on mount and route change so Googlebot's rendered HTML
 * carries page-specific title / description / canonical / OG tags.
 */
const Seo = ({
  title,
  description,
  path,
  ogImage,
  ogImageAlt = DEFAULT_OG_ALT,
  ogType = "website",
  keywords,
  publishedTime,
  modifiedTime = SEO_LAST_MODIFIED,
  section,
  tags,
  noindex,
  jsonLd,
}: SeoProps) => {
  const location = useLocation();

  useEffect(() => {
    const url = absoluteUrl(path ?? location.pathname);
    const image = absoluteUrl(ogImage ?? DEFAULT_OG_IMAGE);

    document.title = title;

    upsertMeta('meta[name="description"]', { name: "description", content: description });
    if (keywords?.length) {
      upsertMeta('meta[name="keywords"]', { name: "keywords", content: keywords.join(", ") });
    }
    upsertMeta('meta[name="robots"]', {
      name: "robots",
      content: noindex
        ? "noindex, follow"
        : "index, follow, max-image-preview:large, max-snippet:-1",
    });
    upsertMeta('meta[name="googlebot"]', {
      name: "googlebot",
      content: noindex
        ? "noindex, follow"
        : "index, follow, max-image-preview:large, max-snippet:-1",
    });
    upsertMeta('meta[name="naverbot"]', {
      name: "naverbot",
      content: noindex ? "noindex, follow" : "index, follow",
    });
    upsertMeta('meta[name="Yeti"]', {
      name: "Yeti",
      content: noindex ? "noindex, follow" : "index, follow",
    });

    upsertLink('link[rel="canonical"]', { rel: "canonical", href: url });
    upsertLink('link[rel="alternate"][hreflang="ko"]', {
      rel: "alternate",
      hreflang: "ko",
      href: url,
    });
    upsertLink('link[rel="alternate"][hreflang="x-default"]', {
      rel: "alternate",
      hreflang: "x-default",
      href: url,
    });

    upsertMeta('meta[property="og:title"]', { property: "og:title", content: title });
    upsertMeta('meta[property="og:description"]', { property: "og:description", content: description });
    upsertMeta('meta[property="og:url"]', { property: "og:url", content: url });
    upsertMeta('meta[property="og:image"]', { property: "og:image", content: image });
    upsertMeta('meta[property="og:image:secure_url"]', { property: "og:image:secure_url", content: image });
    upsertMeta('meta[property="og:image:type"]', { property: "og:image:type", content: "image/png" });
    upsertMeta('meta[property="og:image:width"]', { property: "og:image:width", content: "1200" });
    upsertMeta('meta[property="og:image:height"]', { property: "og:image:height", content: "630" });
    upsertMeta('meta[property="og:image:alt"]', { property: "og:image:alt", content: ogImageAlt });
    upsertMeta('meta[property="og:type"]', { property: "og:type", content: ogType });
    upsertMeta('meta[property="og:locale"]', { property: "og:locale", content: SITE_LOCALE });
    upsertMeta('meta[property="og:site_name"]', { property: "og:site_name", content: SITE_NAME });
    upsertMeta('meta[property="og:updated_time"]', { property: "og:updated_time", content: modifiedTime });
    document.head.querySelectorAll('meta[property^="article:"]').forEach((el) => el.remove());
    if (ogType === "article") {
      if (publishedTime) {
        upsertMeta('meta[property="article:published_time"]', {
          property: "article:published_time",
          content: publishedTime,
        });
      }
      upsertMeta('meta[property="article:modified_time"]', {
        property: "article:modified_time",
        content: modifiedTime,
      });
      if (section) {
        upsertMeta('meta[property="article:section"]', { property: "article:section", content: section });
      }
      tags?.forEach((tag) => {
        const el = document.createElement("meta");
        el.setAttribute("property", "article:tag");
        el.setAttribute("content", tag);
        document.head.appendChild(el);
      });
    }

    upsertMeta('meta[name="twitter:card"]', { name: "twitter:card", content: "summary_large_image" });
    upsertMeta('meta[name="twitter:title"]', { name: "twitter:title", content: title });
    upsertMeta('meta[name="twitter:description"]', { name: "twitter:description", content: description });
    upsertMeta('meta[name="twitter:image"]', { name: "twitter:image", content: image });
    upsertMeta('meta[name="twitter:image:alt"]', { name: "twitter:image:alt", content: ogImageAlt });

    // JSON-LD per page (replace any prior page-scoped block)
    const PREV_ID = "page-jsonld";
    document.getElementById(PREV_ID)?.remove();
    const baseJsonLd: JsonLdObject | null = noindex
      ? null
      : {
          "@context": "https://schema.org",
          "@type": "WebPage",
          "@id": `${url}#webpage`,
          url,
          name: title,
          description,
          inLanguage: "ko-KR",
          isPartOf: { "@id": `${SITE_URL}/#website` },
          primaryImageOfPage: {
            "@type": "ImageObject",
            url: image,
            width: 1200,
            height: 630,
          },
          datePublished: publishedTime ?? modifiedTime,
          dateModified: modifiedTime,
        };
    const jsonLdPayload = [
      ...(baseJsonLd ? [baseJsonLd] : []),
      ...(Array.isArray(jsonLd) ? jsonLd : jsonLd ? [jsonLd] : []),
    ];
    if (jsonLdPayload.length) {
      const script = document.createElement("script");
      script.type = "application/ld+json";
      script.id = PREV_ID;
      script.text = JSON.stringify(jsonLdPayload);
      document.head.appendChild(script);
    }
  }, [
    title,
    description,
    path,
    ogImage,
    ogImageAlt,
    ogType,
    keywords,
    publishedTime,
    modifiedTime,
    section,
    tags,
    noindex,
    jsonLd,
    location.pathname,
  ]);

  return null;
};

export default Seo;
