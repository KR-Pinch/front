import { describe, it, expect } from "vitest";
import { applyBrandTerms, findBrandViolations } from "@/brand/terms";

describe("applyBrandTerms", () => {
  it("legacy '한마디' → 'PINCH'", () => {
    expect(applyBrandTerms("오늘의 한마디")).toBe("오늘의 PINCH");
  });

  it("legacy '박제' → '오늘의 PINCH'", () => {
    expect(applyBrandTerms("명예의 전당에 박제")).toBe("명예의 전당에 오늘의 PINCH");
  });

  it("브랜드 대소문자 보정", () => {
    expect(applyBrandTerms("Pinch 서비스의 pinch")).toBe("PINCH 서비스의 PINCH");
  });

  it("이메일/URL/식별자는 보존", () => {
    const samples = [
      "support@pinch.kr",
      "/pinch-mark.png",
      "Pick<T>",
      "pinch.example.com",
    ];
    for (const s of samples) expect(applyBrandTerms(s)).toBe(s);
  });

  it("이미 정상인 'PINCH'/'PINCH'는 변경되지 않음", () => {
    expect(applyBrandTerms("오늘의 PINCH")).toBe("오늘의 PINCH");
    expect(applyBrandTerms("선택된 PINCH")).toBe("선택된 PINCH");
  });

  it("findBrandViolations 가 위반을 보고", () => {
    const v = findBrandViolations("Pinch 박제");
    expect(v.length).toBeGreaterThanOrEqual(2);
    expect(v.some((x) => x.kind === "case")).toBe(true);
    expect(v.some((x) => x.kind === "forbidden")).toBe(true);
  });
});
