/**
 * 타입 친화적 re-export.
 * 실제 규칙은 `./terms.mjs` 한 파일에서만 관리됩니다 (스캐너와 공유).
 */
import {
  FORBIDDEN_RULES as _FORBIDDEN_RULES,
  BRAND_CASE_RULES as _BRAND_CASE_RULES,
  ALL_RULES as _ALL_RULES,
  LINE_ALLOWLIST as _LINE_ALLOWLIST,
  applyBrandTerms as _applyBrandTerms,
  findBrandViolations as _findBrandViolations,
} from "./terms.mjs";

export type BrandRule = {
  pattern: RegExp;
  replacement: string;
  reason: string;
  kind: "forbidden" | "case";
};

export type BrandViolation = {
  kind: BrandRule["kind"];
  match: string;
  index: number;
  reason: string;
  replacement: string;
};

export const FORBIDDEN_RULES = _FORBIDDEN_RULES as BrandRule[];
export const BRAND_CASE_RULES = _BRAND_CASE_RULES as BrandRule[];
export const ALL_RULES = _ALL_RULES as BrandRule[];
export const LINE_ALLOWLIST = _LINE_ALLOWLIST as RegExp[];

export const applyBrandTerms: (input: string) => string = _applyBrandTerms;
export const findBrandViolations: (input: string) => BrandViolation[] = _findBrandViolations;
