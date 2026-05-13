import { readFile } from "node:fs/promises";

const HOST = "pinch.kr";
const KEY = "72f7ac74b49e4de295f3d9763ec57762";
const KEY_LOCATION = `https://${HOST}/${KEY}.txt`;
const ENDPOINT = "https://api.indexnow.org/indexnow";

const sitemap = await readFile(new URL("../public/sitemap.xml", import.meta.url), "utf8");
const urlList = [...sitemap.matchAll(/<loc>(https:\/\/pinch\.kr\/[^<]+)<\/loc>/g)].map(([, url]) =>
  url.replaceAll("&amp;", "&"),
);

if (urlList.length === 0) {
  throw new Error("No URLs found in public/sitemap.xml");
}

const response = await fetch(ENDPOINT, {
  method: "POST",
  headers: { "Content-Type": "application/json; charset=utf-8" },
  body: JSON.stringify({
    host: HOST,
    key: KEY,
    keyLocation: KEY_LOCATION,
    urlList,
  }),
});

const body = await response.text();

if (!response.ok) {
  throw new Error(`IndexNow submission failed: ${response.status} ${body}`);
}

console.log(`Submitted ${urlList.length} URLs to IndexNow.`);
