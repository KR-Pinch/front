import { describe, it, expect, vi } from "vitest";
import { auditDocument, auditRemoteDocument } from "@/brand/remoteAudit";

describe("remoteAudit", () => {
  it("중첩 JSON 의 문자열 필드에서 위반을 모두 잡아낸다", () => {
    const doc = {
      title: "오늘의 한마디",
      sections: [
        { heading: "환영합니다", body: "Pinch 에 오신 것을 환영합니다" },
        { heading: "박제 안내", body: "정상 카피" },
      ],
    };
    const findings = auditDocument(doc, "cms:test");
    const paths = findings.map((f) => f.path).sort();
    expect(paths).toEqual(
      [
        "sections[0].body",  // Pinch
        "sections[1].heading", // 박제
        "title",             // 한마디
      ].sort(),
    );
  });

  it("id/url/email 같은 식별자 키는 건너뛴다", () => {
    const doc = {
      id: "pick-001",
      url: "https://example.com/pinch",
      email: "support@pinch.kr",
      title: "정상 카피",
    };
    expect(auditDocument(doc, "cms:meta")).toEqual([]);
  });

  it("위반 발견 시 onFindings 콜백을 호출하고 throwOnViolation 옵션을 따른다", () => {
    const onFindings = vi.fn();
    const doc = { headline: "한마디 모아보기" };
    auditRemoteDocument(doc, { source: "i18n:ko", onFindings });
    expect(onFindings).toHaveBeenCalledTimes(1);
    expect(() =>
      auditRemoteDocument(doc, { source: "i18n:ko", throwOnViolation: true }),
    ).toThrow(/brand violation/);
  });

  it("정상 문서는 위반 없음 + 콜백 호출 없음", () => {
    const onFindings = vi.fn();
    const doc = { title: "PINCH 운영정책", body: "오늘의 PINCH 을 선택하세요." };
    const { findings } = auditRemoteDocument(doc, { source: "cms:ok", onFindings });
    expect(findings).toEqual([]);
    expect(onFindings).not.toHaveBeenCalled();
  });
});
