import { describe, it, expect, afterAll } from "vitest";
import { render, within } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import Legal from "@/pages/Legal";
import { findBrandViolations } from "@/brand/terms";
import { legalDocs } from "@/data/legalContent";

/**
 * 약관/개인정보/운영정책 문서를 실제 페이지로 렌더링한 뒤,
 * 본문(<article>) 영역 텍스트에 PICKS 금칙어/잘못된 브랜드 표기가 없는지 검증한다.
 *
 * 단순히 위반 유무만 보지 않고, 각 위반이 "어떤 DOM 노드/문맥"에서 발생했는지
 * 사람이 빠르게 추적할 수 있도록 보기 좋은 리포트를 출력하고
 * reports/legal-brand-scan.{md,json} 파일로도 떨어뜨린다.
 */

const cases = [
  { slug: "terms" as const, path: "/terms" },
  { slug: "privacy" as const, path: "/privacy" },
  { slug: "community" as const, path: "/legal/community" },
] as const;

type NodeViolation = {
  slug: string;
  path: string;
  match: string;
  kind: "forbidden" | "case";
  reason: string;
  replacement: string;
  selector: string;       // h2 > strong 같은 짧은 경로
  section: string;        // 가장 가까운 heading 텍스트
  snippet: string;        // 매치 주변 컨텍스트
};

function renderLegal(path: string) {
  return render(
    <MemoryRouter initialEntries={[path]}>
      <Routes>
        <Route path="/legal/:slug" element={<Legal />} />
        <Route path="/terms" element={<Legal />} />
        <Route path="/privacy" element={<Legal />} />
      </Routes>
    </MemoryRouter>,
  );
}

/** 텍스트 노드에서 가장 가까운 의미 있는 element 와 그 selector path 를 만든다. */
function describeNode(textNode: Text, articleRoot: Element): { selector: string; section: string } {
  const path: string[] = [];
  let el: Element | null = textNode.parentElement;
  let firstHeading = "";
  while (el && el !== articleRoot) {
    const tag = el.tagName.toLowerCase();
    const cls = (el.getAttribute("class") || "")
      .split(/\s+/)
      .filter(Boolean)
      .slice(0, 1)
      .map((c) => `.${c}`)
      .join("");
    path.unshift(tag + cls);
    el = el.parentElement;
  }
  // 가장 가까운 선행 heading 찾기
  let cursor: Element | null = textNode.parentElement;
  while (cursor && cursor !== articleRoot && !firstHeading) {
    let sib: Element | null = cursor;
    while (sib) {
      if (/^H[1-6]$/.test(sib.tagName)) {
        firstHeading = sib.textContent?.trim() ?? "";
        break;
      }
      sib = sib.previousElementSibling;
    }
    cursor = cursor.parentElement;
  }
  return { selector: path.join(" > ") || "article", section: firstHeading || "(서두)" };
}

function collectViolations(slug: string, path: string, article: Element): NodeViolation[] {
  const out: NodeViolation[] = [];
  const walker = (article.ownerDocument ?? document).createTreeWalker(article, 4 /* SHOW_TEXT */);
  let node: Node | null = walker.nextNode();
  while (node) {
    const text = node.nodeValue ?? "";
    if (text.trim()) {
      const violations = findBrandViolations(text);
      if (violations.length) {
        const { selector, section } = describeNode(node as Text, article);
        for (const v of violations) {
          const start = Math.max(0, v.index - 16);
          const end = Math.min(text.length, v.index + v.match.length + 16);
          const snippet =
            (start > 0 ? "…" : "") + text.slice(start, end).replace(/\s+/g, " ").trim() + (end < text.length ? "…" : "");
          out.push({
            slug,
            path,
            match: v.match,
            kind: v.kind,
            reason: v.reason,
            replacement: v.replacement,
            selector,
            section,
            snippet,
          });
        }
      }
    }
    node = walker.nextNode();
  }
  return out;
}

const allViolations: NodeViolation[] = [];

function formatReport(violations: NodeViolation[]): string {
  if (violations.length === 0) {
    return "# Legal pages 브랜드 정합성 리포트\n\n✅ 모든 문서가 PICKS 표기 규칙을 준수합니다.\n";
  }
  const bySlug = violations.reduce<Record<string, NodeViolation[]>>((acc, v) => {
    (acc[v.slug] ??= []).push(v);
    return acc;
  }, {});
  const lines: string[] = [];
  lines.push("# Legal pages 브랜드 정합성 리포트");
  lines.push("");
  lines.push(`❌ **${violations.length}건의 위반** (문서 ${Object.keys(bySlug).length}개)`);
  lines.push("");
  for (const [slug, items] of Object.entries(bySlug)) {
    lines.push(`## ${slug} · ${items.length}건`);
    lines.push("");
    lines.push("| # | 매치 | 종류 | 권장 | 섹션 | DOM | 컨텍스트 |");
    lines.push("|---|------|------|------|------|-----|----------|");
    items.forEach((v, i) => {
      const safe = (s: string) => s.replace(/\|/g, "\\|");
      lines.push(
        `| ${i + 1} | \`${safe(v.match)}\` | ${v.kind} | \`${safe(v.replacement)}\` | ${safe(
          v.section,
        )} | \`${safe(v.selector)}\` | ${safe(v.snippet)} |`,
      );
    });
    lines.push("");
  }
  return lines.join("\n");
}

describe("Legal pages — 본문 금칙어/브랜드 표기 검증", () => {
  for (const { slug, path } of cases) {
    it(`${slug}: 렌더링된 본문에 위반이 없어야 한다`, () => {
      const { container } = renderLegal(path);
      const article = container.querySelector("article");
      expect(article, `article element not found for ${path}`).not.toBeNull();
      expect((article!.textContent ?? "").length).toBeGreaterThan(50);

      const violations = collectViolations(slug, path, article!);
      allViolations.push(...violations);

      const pretty =
        violations.length === 0
          ? ""
          : `\n[${slug}] ${violations.length}건 위반\n` +
            violations
              .map(
                (v, i) =>
                  `  ${i + 1}. "${v.match}" → ${v.replacement} (${v.kind})\n` +
                  `     · 섹션 : ${v.section}\n` +
                  `     · DOM  : ${v.selector}\n` +
                  `     · 문맥 : ${v.snippet}\n` +
                  `     · 사유 : ${v.reason}`,
              )
              .join("\n");

      expect(violations, pretty).toEqual([]);
    });

    it(`${slug}: 문서 메타데이터(제목/설명)도 위반이 없어야 한다`, () => {
      const doc = legalDocs[slug];
      const meta = `${doc.title} ${doc.description}`;
      const violations = findBrandViolations(meta);
      expect(
        violations,
        violations
          .map((v) => `  - meta "${v.match}" → ${v.replacement} · ${v.reason}`)
          .join("\n"),
      ).toEqual([]);
    });
  }

  it("커뮤니티 본문에 'PICKS' 키워드가 등장한다 (브랜드 일관성 sanity)", () => {
    const { container } = renderLegal("/legal/community");
    const article = container.querySelector("article")!;
    expect(within(article as HTMLElement).getByText(/PICKS/)).toBeInTheDocument();
  });

  afterAll(() => {
    const md = formatReport(allViolations);
    // 콘솔 출력
    // eslint-disable-next-line no-console
    console.log("\n" + md);
    // 파일 출력 (CI 아티팩트로 활용 가능)
    try {
      const dir = join(process.cwd(), "reports");
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, "legal-brand-scan.md"), md);
      writeFileSync(
        join(dir, "legal-brand-scan.json"),
        JSON.stringify(
          { generatedAt: new Date().toISOString(), total: allViolations.length, violations: allViolations },
          null,
          2,
        ),
      );
    } catch {
      /* 테스트 환경이 fs 를 막아도 무시 */
    }
  });
});
