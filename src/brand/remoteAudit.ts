/**
 * 네트워크로 주입되는 문서(CMS 응답, 로컬라이즈 텍스트 번들 등)에 대해
 * 렌더링 직전/직후 자동으로 PICKS 금칙어/표기 검증을 수행하는 유틸 모음.
 *
 * 핵심 아이디어
 *  - 정적 스캐너는 코드/마크다운만 봅니다. 런타임에 외부에서 들어오는 문자열은
 *    여기서 한 번 더 검증해 콘솔 경고 + 선택적 콜백으로 알립니다.
 *  - dev 환경에서는 시끄럽게(그룹 로그), prod 에서는 조용히(샘플링) 동작합니다.
 *
 * 규칙 자체는 `src/brand/terms.mjs` 단일 정의를 그대로 재사용합니다.
 */

import { findBrandViolations, type BrandViolation } from "./terms";

export type RemoteFinding = BrandViolation & {
  /** 문서를 식별하는 라벨 (예: "cms:homepage", "i18n:ko") */
  source: string;
  /** 위반이 발견된 JSON 경로 (예: "sections[2].title") */
  path: string;
  /** 매치 주변 컨텍스트 */
  snippet: string;
};

export type AuditOptions = {
  /** 문서 출처 라벨. 로그/리포트 식별자. */
  source: string;
  /** 추가 위반 처리(예: 분석 전송, 토스트). */
  onFindings?: (findings: RemoteFinding[]) => void;
  /** true 면 위반 시 throw. 기본 false. */
  throwOnViolation?: boolean;
};

const SAFE_KEYS = /^(id|_id|sys|type|slug|url|href|src|email|key|locale|tag)$/i;

function snippetOf(text: string, index: number, len: number): string {
  const start = Math.max(0, index - 20);
  const end = Math.min(text.length, index + len + 20);
  return (
    (start > 0 ? "…" : "") +
    text.slice(start, end).replace(/\s+/g, " ").trim() +
    (end < text.length ? "…" : "")
  );
}

/**
 * 임의의 JSON-like 값을 재귀 순회하며 문자열 필드만 검증한다.
 * 식별자/URL/이메일 성격의 키는 건너뛴다.
 */
export function auditDocument(doc: unknown, source: string): RemoteFinding[] {
  const out: RemoteFinding[] = [];
  const seen = new WeakSet<object>();

  const walk = (value: unknown, path: string, key?: string) => {
    if (value == null) return;
    if (typeof value === "string") {
      if (key && SAFE_KEYS.test(key)) return;
      if (!value.trim()) return;
      const violations = findBrandViolations(value);
      for (const v of violations) {
        out.push({
          ...v,
          source,
          path: path || "(root)",
          snippet: snippetOf(value, v.index, v.match.length),
        });
      }
      return;
    }
    if (typeof value !== "object") return;
    if (seen.has(value as object)) return;
    seen.add(value as object);
    if (Array.isArray(value)) {
      value.forEach((item, i) => walk(item, `${path}[${i}]`));
    } else {
      for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
        walk(v, path ? `${path}.${k}` : k, k);
      }
    }
  };

  walk(doc, "");
  return out;
}

/**
 * dev 오버레이/배너가 구독할 수 있는 단순 이벤트 버스.
 * 모듈 단위 싱글턴 — SSR 안전(가드 없음, 브라우저에서만 호출됨).
 */
type FindingsListener = (findings: RemoteFinding[]) => void;
const listeners = new Set<FindingsListener>();
const recent: RemoteFinding[] = [];
const RECENT_LIMIT = 100;

export function subscribeBrandFindings(listener: FindingsListener): () => void {
  listeners.add(listener);
  if (recent.length > 0) listener(recent.slice());
  return () => {
    listeners.delete(listener);
  };
}

export function getRecentBrandFindings(): RemoteFinding[] {
  return recent.slice();
}

export function clearBrandFindings(): void {
  recent.length = 0;
  listeners.forEach((l) => l([]));
}

function emitFindings(findings: RemoteFinding[]): void {
  if (findings.length === 0) return;
  recent.push(...findings);
  if (recent.length > RECENT_LIMIT) recent.splice(0, recent.length - RECENT_LIMIT);
  listeners.forEach((l) => l(findings));
}

/** 콘솔에 보기 좋게 출력. dev 에서 그룹 로그, prod 에서 단일 경고. */
export function reportFindings(findings: RemoteFinding[]): void {
  if (findings.length === 0) return;
  const isDev = typeof import.meta !== "undefined" && (import.meta as { env?: { DEV?: boolean } }).env?.DEV;
  const title = `🟡 PICKS brand audit · ${findings.length} violation(s) in remote content`;
  if (isDev && typeof console.groupCollapsed === "function") {
    console.groupCollapsed(title);
    for (const f of findings) {
      console.warn(
        `[${f.source}] ${f.path}\n  • "${f.match}" → ${f.replacement} (${f.kind})\n  • ${f.snippet}\n  • ${f.reason}`,
      );
    }
    console.groupEnd();
  } else {
    console.warn(title, findings);
  }
}

/**
 * 문서를 검증하고(필요하면 throw), 결과를 반환한다.
 * 원본 문서는 변경하지 않는다 — 호출자가 그대로 렌더링하면서 안전망으로 사용.
 */
export function auditRemoteDocument<T>(doc: T, options: AuditOptions): { doc: T; findings: RemoteFinding[] } {
  const findings = auditDocument(doc, options.source);
  if (findings.length > 0) {
    reportFindings(findings);
    emitFindings(findings);
    options.onFindings?.(findings);
    if (options.throwOnViolation) {
      throw new Error(
        `[${options.source}] ${findings.length} brand violation(s): ` +
          findings.map((f) => `${f.path}="${f.match}"`).join(", "),
      );
    }
  }
  return { doc, findings };
}

/** fetch 응답 JSON 을 자동 검증해서 돌려주는 헬퍼. */
export async function fetchJsonWithBrandAudit<T = unknown>(
  input: RequestInfo | URL,
  init: RequestInit & { audit: AuditOptions },
): Promise<T> {
  const { audit, ...rest } = init;
  const res = await fetch(input, rest);
  if (!res.ok) throw new Error(`fetch failed: ${res.status} ${res.statusText}`);
  const data = (await res.json()) as T;
  auditRemoteDocument(data, audit);
  return data;
}
