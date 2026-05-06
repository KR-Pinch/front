#!/usr/bin/env node
/**
 * PINCH 브랜드 금칙어/용어 정합성 스캐너
 *
 * 규칙 정의는 `src/brand/terms.mjs` 한 파일에서만 관리됩니다.
 * 이 스크립트는 그 규칙을 import 해서 코드/문서에 위반이 있는지 검사만 합니다.
 *
 * CLI:
 *   node scripts/scan-brand-terms.mjs [--report-dir reports]
 *
 * --report-dir 가 주어지면 (또는 env CI=true 일 때는 기본 'reports')
 *   reports/brand-scan.json    : 머신리더블 결과
 *   reports/brand-scan.md      : 사람이 읽기 좋은 리포트 (PR 코멘트/Step Summary 용)
 * 가 함께 생성됩니다. GitHub Actions 환경에서는 GITHUB_STEP_SUMMARY 에도 자동 추가합니다.
 */

import { readFileSync, statSync, readdirSync, mkdirSync, writeFileSync, appendFileSync } from "node:fs";
import { join, relative, extname, dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { ALL_RULES, LINE_ALLOWLIST } from "../src/brand/terms.mjs";

const ROOT = fileURLToPath(new URL("..", import.meta.url));

const SCAN_DIRS = ["src", "index.html"];
const IGNORE_DIRS = new Set(["node_modules", "dist", ".git", "build", "coverage"]);
const IGNORE_FILE_PATTERNS = [
  /scripts\/scan-brand-terms\.mjs$/,
  /src\/brand\/terms\.mjs$/,        // 규칙 정의 파일 자체
  /src\/brand\/terms\.ts$/,         // 타입 re-export
  /\.test\.(ts|tsx|js|jsx)$/,
  /__tests__\//,
  /test\/setup\.ts$/,
  /brand-terms\./,
];
const SCAN_EXTS = new Set([".ts", ".tsx", ".js", ".jsx", ".html", ".md", ".css"]);

function walk(path, out = []) {
  let st;
  try { st = statSync(path); } catch { return out; }
  if (st.isDirectory()) {
    const base = path.split("/").pop();
    if (IGNORE_DIRS.has(base)) return out;
    for (const entry of readdirSync(path)) walk(join(path, entry), out);
  } else if (st.isFile()) {
    if (SCAN_EXTS.has(extname(path))) out.push(path);
  }
  return out;
}

function shouldSkip(rel) {
  return IGNORE_FILE_PATTERNS.some((re) => re.test(rel));
}

function scanFile(file) {
  const rel = relative(ROOT, file);
  if (shouldSkip(rel)) return [];
  const content = readFileSync(file, "utf8");
  const lines = content.split("\n");
  const findings = [];

  lines.forEach((line, idx) => {
    if (LINE_ALLOWLIST.some((re) => re.test(line))) return;
    const lineNo = idx + 1;
    for (const rule of ALL_RULES) {
      rule.pattern.lastIndex = 0;
      let m;
      while ((m = rule.pattern.exec(line)) !== null) {
        findings.push({
          kind: rule.kind,
          file: rel,
          line: lineNo,
          term: m[0],
          reason: rule.reason,
          text: line.trim(),
        });
      }
    }
  });

  return findings;
}

function parseArgs(argv) {
  const args = { reportDir: null };
  for (let i = 0; i < argv.length; i++) {
    if (argv[i] === "--report-dir" && argv[i + 1]) {
      args.reportDir = argv[++i];
    }
  }
  if (!args.reportDir && process.env.CI === "true") {
    args.reportDir = "reports";
  }
  return args;
}

function buildMarkdown(findings, grouped) {
  if (findings.length === 0) {
    return `# PINCH 브랜드 정합성 리포트\n\n✅ 위반 없음 — 코드베이스가 PINCH/PINCH 표기 규칙을 준수합니다.\n`;
  }
  const lines = [];
  lines.push(`# PINCH 브랜드 정합성 리포트`);
  lines.push("");
  lines.push(`❌ **${findings.length}건의 위반**이 발견되었습니다.`);
  lines.push("");
  for (const [kind, items] of Object.entries(grouped)) {
    const label = kind === "forbidden" ? "금칙어 (legacy term)" : "브랜드 대소문자";
    lines.push(`## ${label} · ${items.length}건`);
    lines.push("");
    lines.push("| 파일 | 라인 | 매치 | 사유 |");
    lines.push("|------|------|------|------|");
    for (const f of items) {
      const safe = (s) => String(s).replace(/\|/g, "\\|");
      lines.push(`| \`${safe(f.file)}\` | ${f.line} | \`${safe(f.term)}\` | ${safe(f.reason)} |`);
    }
    lines.push("");
  }
  lines.push(`> 규칙 정의: \`src/brand/terms.mjs\` · 로컬 재현: \`npm run scan:brand\``);
  return lines.join("\n");
}

function writeReports(reportDir, findings, grouped) {
  mkdirSync(reportDir, { recursive: true });
  const json = {
    generatedAt: new Date().toISOString(),
    totalViolations: findings.length,
    byKind: Object.fromEntries(Object.entries(grouped).map(([k, v]) => [k, v.length])),
    findings,
  };
  writeFileSync(join(reportDir, "brand-scan.json"), JSON.stringify(json, null, 2));
  const md = buildMarkdown(findings, grouped);
  writeFileSync(join(reportDir, "brand-scan.md"), md);
  if (process.env.GITHUB_STEP_SUMMARY) {
    try { appendFileSync(process.env.GITHUB_STEP_SUMMARY, md + "\n"); } catch { /* noop */ }
  }
  return md;
}

function main() {
  const { reportDir } = parseArgs(process.argv.slice(2));

  const files = [];
  for (const target of SCAN_DIRS) {
    walk(join(ROOT, target), files);
  }

  const findings = files.flatMap(scanFile);
  const grouped = findings.reduce((acc, f) => {
    (acc[f.kind] ??= []).push(f);
    return acc;
  }, {});

  if (reportDir) {
    writeReports(reportDir, findings, grouped);
    console.log(`📝 Report: ${reportDir}/brand-scan.md`);
  }

  if (findings.length === 0) {
    console.log("✅ PINCH 브랜드 스캔 통과 — 금칙어/용어 위반 없음");
    process.exit(0);
  }

  console.error(`❌ ${findings.length}건의 위반이 발견되었습니다.\n`);
  for (const [kind, items] of Object.entries(grouped)) {
    const label = kind === "forbidden" ? "금칙어 (legacy term)" : "브랜드 대소문자";
    console.error(`── ${label} · ${items.length}건 ──`);
    for (const f of items) {
      console.error(`  ${f.file}:${f.line}  [${f.term}]`);
      console.error(`    ${f.text}`);
      console.error(`    → ${f.reason}`);
    }
    console.error("");
  }
  // GitHub Actions error annotations
  if (process.env.GITHUB_ACTIONS === "true") {
    for (const f of findings) {
      const msg = `${f.reason} [${f.term}]`;
      console.log(`::error file=${f.file},line=${f.line},title=PINCH brand check::${msg}`);
    }
  }
  process.exit(1);
}

main();
