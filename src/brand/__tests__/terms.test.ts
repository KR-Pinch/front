import { describe, it, expect } from "vitest";
import { applyBrandTerms, findBrandViolations } from "@/brand/terms";

describe("applyBrandTerms", () => {
  it("legacy '한마디' → 'PICKS'", () => {
    expect(applyBrandTerms("오늘의 한마디")).toBe("오늘의 PICKS");
  });

  it("legacy '박제' → '오늘의 PICK'", () => {
    expect(applyBrandTerms("명예의 전당에 박제")).toBe("명예의 전당에 오늘의 PICK");
  });

  it("브랜드 대소문자 보정", () => {
    expect(applyBrandTerms("Picks 서비스의 pick")).toBe("PICKS 서비스의 PICK");
  });

  it("이메일/URL/식별자는 보존", () => {
    const samples = [
      "support@picks.kr",
      "/picks-mark.png",
      "Pick<T>",
      "picks.example.com",
    ];
    for (const s of samples) expect(applyBrandTerms(s)).toBe(s);
  });

  it("이미 정상인 'PICK'/'PICKS'는 변경되지 않음", () => {
    expect(applyBrandTerms("오늘의 PICK")).toBe("오늘의 PICK");
    expect(applyBrandTerms("선택된 PICKS")).toBe("선택된 PICKS");
  });

  it("findBrandViolations 가 위반을 보고", () => {
    const v = findBrandViolations("Picks 박제");
    expect(v.length).toBeGreaterThanOrEqual(2);
    expect(v.some((x) => x.kind === "case")).toBe(true);
    expect(v.some((x) => x.kind === "forbidden")).toBe(true);
  });
});
