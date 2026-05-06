/**
 * PINCH 브랜드 용어 사전 — 단일 진실 공급원 (Single Source of Truth)
 *
 * 이 파일은 다음 두 곳에서 함께 사용됩니다.
 *  1) 정적 스캐너 (`scripts/scan-brand-terms.mjs`) — Node가 직접 import
 *  2) 런타임 (`src/brand/terms.ts` → `BrandText`) — Vite가 번들에 포함
 *
 * 새 용어 규칙은 반드시 이 파일에서만 수정하세요.
 *
 * 규칙 종류
 *  - forbidden : 사용자 노출 영역에서 절대 등장 금지. 권장 표현으로 자동 치환.
 *  - case      : 브랜드 대소문자 정합성. 'Pinch'/'pinch'/'Pinch'/'pinch' → 'PINCH'/'PINCH'.
 *
 * 좌우 경계: 영문/숫자/하이픈/점/콜론/슬래시/@/언더스코어가 인접하면
 * 식별자·URL·이메일·파일명으로 보고 제외 (TS의 `Pick<T>` 유틸리티 포함).
 */

/** @typedef {{ pattern: RegExp; replacement: string; reason: string; kind: 'forbidden' | 'case' }} BrandRule */

/** @type {BrandRule[]} */
export const FORBIDDEN_RULES = [
  {
    kind: "forbidden",
    pattern: /한마디/g,
    replacement: "PINCH",
    reason: "레거시 서비스명. 'PINCH'로 대체하세요.",
  },
  {
    kind: "forbidden",
    pattern: /박제/g,
    replacement: "오늘의 PINCH",
    reason: "레거시 메타포. 문맥에 따라 '오늘의 PINCH' 또는 '선택된 PINCH'로 대체하세요.",
  },
];

/** @type {BrandRule[]} */
export const BRAND_CASE_RULES = [
  {
    kind: "case",
    pattern: /(?<![A-Za-z0-9\-./:@_])Pinch(?![A-Za-z0-9\-./:@_<])/g,
    replacement: "PINCH",
    reason: "브랜드 표기는 항상 대문자 'PINCH' 입니다.",
  },
  {
    kind: "case",
    pattern: /(?<![A-Za-z0-9\-./:@_])pinch(?![A-Za-z0-9\-./:@_<])/g,
    replacement: "PINCH",
    reason: "브랜드 표기는 항상 대문자 'PINCH' 입니다.",
  },
];

export const ALL_RULES = [...FORBIDDEN_RULES, ...BRAND_CASE_RULES];

/** 스캐너가 한 줄 단위로 무시할 컨텍스트(주석/식별자/lint pragma 등). */
export const LINE_ALLOWLIST = [
  /hanmadi:/,        // localStorage 키 prefix (호환성 유지)
  /^\s*\/\//,        // 한 줄 주석
  /^\s*\*/,          // 블록 주석 라인
  /eslint-disable/,
];

/** 텍스트에 모든 규칙을 일괄 적용해 정규화된 문자열을 반환. */
export function applyBrandTerms(input) {
  if (!input) return input;
  let out = input;
  for (const rule of ALL_RULES) {
    out = out.replace(rule.pattern, rule.replacement);
  }
  return out;
}

/** 텍스트를 검사해 위반 목록을 반환(치환 없음). */
export function findBrandViolations(input) {
  const violations = [];
  for (const rule of ALL_RULES) {
    rule.pattern.lastIndex = 0;
    let m;
    while ((m = rule.pattern.exec(input)) !== null) {
      violations.push({
        kind: rule.kind,
        match: m[0],
        index: m.index,
        reason: rule.reason,
        replacement: rule.replacement,
      });
    }
  }
  return violations;
}
