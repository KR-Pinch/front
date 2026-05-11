#!/usr/bin/env node
import { mkdir, readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const repoRoot = path.resolve(__dirname, "..");
const rawArgs = process.argv.slice(2);
const args = new Set(rawArgs);

const defaultInputDir = path.resolve(repoRoot, "reports/seo/input");
const defaultOutputDir = path.resolve(repoRoot, "reports/seo");

const argValue = (name, fallback) => {
  const prefix = `${name}=`;
  const inline = rawArgs.find((arg) => arg.startsWith(prefix));
  if (inline) return inline.slice(prefix.length);
  const index = rawArgs.indexOf(name);
  if (index >= 0 && rawArgs[index + 1]) return rawArgs[index + 1];
  return fallback;
};

const showHelp = () => {
  console.log(`Google Search Console export report

Usage:
  npm run seo:gsc
  npm run seo:gsc -- reports/seo/input/queries.csv reports/seo/input/pages.csv
  node scripts/gsc-export-report.mjs --input reports/seo/input --out reports/seo

Input:
  Put Search Console CSV or TSV exports in reports/seo/input.
  Supported tabs: queries, pages, countries, devices, dates, or page+query exports.

Output:
  reports/seo/gsc-export-report-YYYY-MM-DD.md
  reports/seo/gsc-export-report-YYYY-MM-DD.json
`);
};

if (args.has("--help") || args.has("-h")) {
  showHelp();
  process.exit(0);
}

const inputArg = argValue("--input", null);
const outputDir = path.resolve(repoRoot, argValue("--out", defaultOutputDir));
const explicitFiles = rawArgs.filter((arg, index) => {
  if (arg.startsWith("-")) return false;
  const previous = rawArgs[index - 1];
  return previous !== "--input" && previous !== "--out";
});

const pad = (value) => String(value).padStart(2, "0");
const today = new Date();
const stamp = `${today.getFullYear()}-${pad(today.getMonth() + 1)}-${pad(today.getDate())}`;

const toAbsolute = (filePath) => (path.isAbsolute(filePath) ? filePath : path.resolve(repoRoot, filePath));

const loadInputFiles = async () => {
  if (explicitFiles.length) return explicitFiles.map(toAbsolute);

  const inputPath = toAbsolute(inputArg || defaultInputDir);
  const stats = await readFileOrNull(inputPath);
  if (stats !== null) return [inputPath];

  const entries = await readdir(inputPath, { withFileTypes: true }).catch((error) => {
    if (error.code === "ENOENT") return [];
    throw error;
  });

  return entries
    .filter((entry) => entry.isFile() && /\.(csv|tsv|txt)$/i.test(entry.name))
    .map((entry) => path.join(inputPath, entry.name))
    .sort((a, b) => a.localeCompare(b));
};

const readFileOrNull = async (filePath) => {
  try {
    return await readFile(filePath, "utf8");
  } catch (error) {
    if (error.code === "EISDIR" || error.code === "ENOENT") return null;
    throw error;
  }
};

const detectDelimiter = (text, filePath) => {
  if (/\.tsv$/i.test(filePath)) return "\t";
  const firstLine = text.split(/\r?\n/).find((line) => line.trim()) || "";
  const commaCount = (firstLine.match(/,/g) || []).length;
  const tabCount = (firstLine.match(/\t/g) || []).length;
  return tabCount > commaCount ? "\t" : ",";
};

const parseDelimited = (text, delimiter) => {
  const rows = [];
  let row = [];
  let field = "";
  let quoted = false;

  const pushField = () => {
    row.push(field);
    field = "";
  };
  const pushRow = () => {
    if (row.length || field) {
      pushField();
      rows.push(row);
    }
    row = [];
  };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (char === '"') {
      if (quoted && next === '"') {
        field += '"';
        i += 1;
      } else {
        quoted = !quoted;
      }
      continue;
    }

    if (!quoted && char === delimiter) {
      pushField();
      continue;
    }

    if (!quoted && char === "\r") {
      if (next === "\n") i += 1;
      pushRow();
      continue;
    }

    if (!quoted && char === "\n") {
      pushRow();
      continue;
    }

    field += char;
  }

  if (field || row.length) pushRow();
  return rows;
};

const cleanHeader = (value) =>
  String(value || "")
    .replace(/^\uFEFF/, "")
    .trim();

const normalize = (value) =>
  cleanHeader(value)
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[()_%]/g, "");

const headerRole = (header) => {
  const key = normalize(header);
  if (key === "ctr" || key.includes("클릭률")) return "ctr";
  if (key.includes("query") || key.includes("검색어")) return "query";
  if (key.includes("page") || key.includes("페이지") || key.includes("url")) return "page";
  if (key.includes("click") || key.includes("클릭")) return "clicks";
  if (key.includes("impression") || key.includes("노출")) return "impressions";
  if (key.includes("position") || key.includes("순위") || key.includes("게재")) return "position";
  if (key.includes("country") || key.includes("국가")) return "country";
  if (key.includes("device") || key.includes("기기")) return "device";
  if (key.includes("date") || key.includes("날짜")) return "date";
  return "dimension";
};

const parseNumber = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return 0;
  const number = Number(raw.replace(/,/g, "").replace(/%/g, ""));
  return Number.isFinite(number) ? number : 0;
};

const parseCtr = (value) => {
  const raw = String(value || "").trim();
  const number = parseNumber(raw);
  if (!raw) return 0;
  return raw.includes("%") || number > 1 ? number / 100 : number;
};

const detectHeaderRow = (rows) =>
  rows.findIndex((row) => {
    const roles = row.map(headerRole);
    return roles.includes("clicks") && roles.includes("impressions");
  });

const readExport = async (filePath) => {
  const text = await readFile(filePath, "utf8");
  const delimiter = detectDelimiter(text, filePath);
  const parsed = parseDelimited(text, delimiter).filter((row) => row.some((cell) => String(cell).trim()));
  const headerRow = detectHeaderRow(parsed);

  if (headerRow < 0) {
    throw new Error(`${path.basename(filePath)}: Search Console header row not found`);
  }

  const headers = parsed[headerRow].map(cleanHeader);
  const roles = headers.map(headerRole);
  const records = parsed.slice(headerRow + 1).map((row) => {
    const record = {
      source: path.basename(filePath),
      dimension: "",
      dimensionType: "dimension",
      query: "",
      page: "",
      date: "",
      country: "",
      device: "",
      clicks: 0,
      impressions: 0,
      ctr: 0,
      position: 0,
    };

    row.forEach((cell, index) => {
      const role = roles[index] || "dimension";
      const value = String(cell || "").trim();
      if (role === "clicks") record.clicks = parseNumber(value);
      else if (role === "impressions") record.impressions = parseNumber(value);
      else if (role === "ctr") record.ctr = parseCtr(value);
      else if (role === "position") record.position = parseNumber(value);
      else if (role === "query") record.query = value;
      else if (role === "page") record.page = value;
      else if (role === "date") record.date = value;
      else if (role === "country") record.country = value;
      else if (role === "device") record.device = value;
      else if (!record.dimension && value) record.dimension = value;
    });

    if (record.query) {
      record.dimension = record.query;
      record.dimensionType = "query";
    } else if (record.page) {
      record.dimension = record.page;
      record.dimensionType = "page";
    } else if (record.date) {
      record.dimension = record.date;
      record.dimensionType = "date";
    } else if (record.country) {
      record.dimension = record.country;
      record.dimensionType = "country";
    } else if (record.device) {
      record.dimension = record.device;
      record.dimensionType = "device";
    }

    return record;
  });

  return records.filter((record) => record.dimension && record.impressions + record.clicks > 0);
};

const aggregate = (records, type) => {
  const map = new Map();
  for (const record of records.filter((item) => item.dimensionType === type)) {
    const key = record.dimension;
    const current = map.get(key) || {
      dimension: key,
      dimensionType: type,
      clicks: 0,
      impressions: 0,
      weightedPosition: 0,
      sources: new Set(),
    };
    current.clicks += record.clicks;
    current.impressions += record.impressions;
    current.weightedPosition += record.position * record.impressions;
    current.sources.add(record.source);
    map.set(key, current);
  }

  return [...map.values()].map((item) => ({
    ...item,
    ctr: item.impressions ? item.clicks / item.impressions : 0,
    position: item.impressions ? item.weightedPosition / item.impressions : 0,
    sources: [...item.sources],
  }));
};

const sortByImpressions = (a, b) => b.impressions - a.impressions || a.position - b.position;
const formatPercent = (value) => `${(value * 100).toFixed(1)}%`;
const formatNumber = (value) => Math.round(value).toLocaleString("en-US");
const formatPosition = (value) => (value ? value.toFixed(1) : "-");
const truncate = (value, length = 86) => {
  const text = String(value || "");
  return text.length > length ? `${text.slice(0, length - 1)}...` : text;
};

const makeTable = (rows, columns) => {
  if (!rows.length) return "_No matching rows._";

  const header = `| ${columns.map((column) => column.label).join(" | ")} |`;
  const divider = `| ${columns.map(() => "---").join(" | ")} |`;
  const body = rows.map((row) => `| ${columns.map((column) => column.format(row)).join(" | ")} |`);
  return [header, divider, ...body].join("\n");
};

const tableColumns = (label) => [
  { label, format: (row) => truncate(row.dimension || row.query || row.page) },
  { label: "Clicks", format: (row) => formatNumber(row.clicks) },
  { label: "Impressions", format: (row) => formatNumber(row.impressions) },
  { label: "CTR", format: (row) => formatPercent(row.ctr) },
  { label: "Position", format: (row) => formatPosition(row.position) },
];

const buildAnalysis = (records) => {
  const queries = aggregate(records, "query").sort(sortByImpressions);
  const pages = aggregate(records, "page").sort(sortByImpressions);
  const countries = aggregate(records, "country").sort(sortByImpressions);
  const devices = aggregate(records, "device").sort(sortByImpressions);

  const totals = records.reduce(
    (sum, record) => {
      sum.clicks += record.clicks;
      sum.impressions += record.impressions;
      sum.weightedPosition += record.position * record.impressions;
      return sum;
    },
    { clicks: 0, impressions: 0, weightedPosition: 0 },
  );
  totals.ctr = totals.impressions ? totals.clicks / totals.impressions : 0;
  totals.position = totals.impressions ? totals.weightedPosition / totals.impressions : 0;

  const quickWins = queries
    .filter((query) => query.position >= 4 && query.position <= 20 && query.impressions >= 10)
    .sort(sortByImpressions)
    .slice(0, 20);

  const ctrOpportunities = queries
    .filter((query) => query.position <= 12 && query.impressions >= 20 && query.ctr < 0.03)
    .sort(sortByImpressions)
    .slice(0, 20);

  const noClickQueries = queries
    .filter((query) => query.clicks === 0 && query.impressions >= 10)
    .sort(sortByImpressions)
    .slice(0, 20);

  const contentCandidates = queries
    .filter((query) => query.position > 12 && query.position <= 40 && query.impressions >= 10)
    .sort(sortByImpressions)
    .slice(0, 20);

  const actionItems = [];
  for (const query of quickWins.slice(0, 8)) {
    actionItems.push(
      `"${query.dimension}" 검색어는 이미 1페이지 근처입니다. 연결된 페이지의 title, H1, 첫 문단, 내부 링크 문구에 이 의도를 더 선명하게 반영하세요.`,
    );
  }
  for (const query of ctrOpportunities.slice(0, 6)) {
    actionItems.push(
      `"${query.dimension}" 검색어는 노출 대비 CTR이 낮습니다. title과 meta description을 더 구체적인 혜택/문제 해결 중심으로 다시 쓰세요.`,
    );
  }
  for (const query of contentCandidates.slice(0, 6)) {
    actionItems.push(
      `"${query.dimension}" 검색어는 노출은 있지만 순위가 약합니다. 별도 섹션, FAQ, 비교 콘텐츠, 전용 페이지 후보로 검토하세요.`,
    );
  }

  return {
    totals,
    queries,
    pages,
    countries,
    devices,
    quickWins,
    ctrOpportunities,
    noClickQueries,
    contentCandidates,
    actionItems: actionItems.slice(0, 12),
  };
};

const buildMarkdown = (files, records, analysis) => {
  const sections = [
    `# Search Console export SEO report (${stamp})`,
    "",
    "## 입력 파일",
    ...files.map((file) => `- ${path.relative(repoRoot, file).replace(/\\/g, "/")}`),
    "",
    "## 요약",
    `- 분석 행 수: ${formatNumber(records.length)}`,
    `- 총 클릭수: ${formatNumber(analysis.totals.clicks)}`,
    `- 총 노출수: ${formatNumber(analysis.totals.impressions)}`,
    `- 평균 CTR: ${formatPercent(analysis.totals.ctr)}`,
    `- 평균 순위: ${formatPosition(analysis.totals.position)}`,
    "",
    "## 우선 작업",
  ];

  if (analysis.actionItems.length) {
    sections.push(...analysis.actionItems.map((item, index) => `${index + 1}. ${item}`));
  } else {
    sections.push("_아직 우선 작업을 뽑을 만큼 데이터가 충분하지 않습니다. export 기간을 늘려보세요._");
  }

  sections.push(
    "",
    "## 빠른 개선 후보: 평균 순위 4-20위",
    makeTable(analysis.quickWins.slice(0, 15), tableColumns("Query")),
    "",
    "## 낮은 CTR 개선 후보",
    makeTable(analysis.ctrOpportunities.slice(0, 15), tableColumns("Query")),
    "",
    "## 노출은 있지만 클릭이 없는 검색어",
    makeTable(analysis.noClickQueries.slice(0, 15), tableColumns("Query")),
    "",
    "## 콘텐츠 보강 후보",
    makeTable(analysis.contentCandidates.slice(0, 15), tableColumns("Query")),
    "",
    "## 상위 페이지",
    makeTable(analysis.pages.slice(0, 15), tableColumns("Page")),
  );

  if (analysis.countries.length) {
    sections.push("", "## 국가", makeTable(analysis.countries.slice(0, 10), tableColumns("Country")));
  }

  if (analysis.devices.length) {
    sections.push("", "## 기기", makeTable(analysis.devices.slice(0, 10), tableColumns("Device")));
  }

  sections.push(
    "",
    "## Codex와 함께 쓰는 방법",
    "이 리포트 또는 원본 Search Console export를 Codex에게 보내고, title, meta description, 콘텐츠 보강, 내부 링크, 구조화 데이터 수정을 요청하세요.",
  );

  return sections.join("\n");
};

const main = async () => {
  const files = await loadInputFiles();
  if (!files.length) {
    await mkdir(defaultInputDir, { recursive: true });
    throw new Error(
      `No CSV/TSV files found. Put Search Console exports in ${path.relative(repoRoot, defaultInputDir).replace(/\\/g, "/")}.`,
    );
  }

  const batches = await Promise.all(files.map(readExport));
  const records = batches.flat();
  const analysis = buildAnalysis(records);
  const markdown = buildMarkdown(files, records, analysis);

  await mkdir(outputDir, { recursive: true });
  const basePath = path.join(outputDir, `gsc-export-report-${stamp}`);
  await writeFile(`${basePath}.md`, markdown, "utf8");
  await writeFile(
    `${basePath}.json`,
    JSON.stringify(
      {
        stamp,
        files: files.map((file) => path.relative(repoRoot, file).replace(/\\/g, "/")),
        records,
        analysis: {
          ...analysis,
          queries: analysis.queries.slice(0, 100),
          pages: analysis.pages.slice(0, 100),
        },
      },
      null,
      2,
    ),
    "utf8",
  );

  console.log(`Created ${path.relative(repoRoot, `${basePath}.md`).replace(/\\/g, "/")}`);
  console.log(`Created ${path.relative(repoRoot, `${basePath}.json`).replace(/\\/g, "/")}`);
};

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
