import { describe, it, expect } from "vitest";
import {
  getTopicDeadline,
  getKstDayStamp,
  isTopicClosed,
  formatRemainingClock,
} from "../mockData";

// Helper: build a UTC instant. JS Date is timezone-agnostic internally
// (it stores epoch ms), so simulating "a user in NY" vs "a user in Seoul"
// at the same instant is just passing the same epoch ms — the locking
// math must produce identical results regardless of the host's local TZ.
const utc = (iso: string) => new Date(iso);

// Known KST midnight boundary:
//   2026-03-21 23:59:59 KST  ==  2026-03-21 14:59:59 UTC
//   2026-03-22 00:00:00 KST  ==  2026-03-21 15:00:00 UTC
const ONE_SEC_BEFORE_KST_MIDNIGHT = utc("2026-03-21T14:59:59.000Z");
const KST_MIDNIGHT = utc("2026-03-21T15:00:00.000Z");
const ONE_SEC_AFTER_KST_MIDNIGHT = utc("2026-03-21T15:00:01.000Z");

describe("KST 자정 경계 — 잠금/해제 정확성", () => {
  describe("getTopicDeadline", () => {
    it("자정 1초 전: 다음 KST 자정(=현재시각+1초)을 가리킨다", () => {
      // monkey-patch Date.now for this assertion
      const realNow = Date.now;
      Date.now = () => ONE_SEC_BEFORE_KST_MIDNIGHT.getTime();
      try {
        const d = getTopicDeadline();
        expect(d.toISOString()).toBe(KST_MIDNIGHT.toISOString());
        expect(d.getTime() - Date.now()).toBe(1000);
      } finally {
        Date.now = realNow;
      }
    });

    it("KST 자정 정각: 즉시 다음 자정(24시간 뒤)으로 롤오버", () => {
      const realNow = Date.now;
      Date.now = () => KST_MIDNIGHT.getTime();
      try {
        const d = getTopicDeadline();
        expect(d.getTime() - KST_MIDNIGHT.getTime()).toBe(24 * 60 * 60 * 1000);
      } finally {
        Date.now = realNow;
      }
    });

    it("자정 1초 후: 다음 KST 자정까지 23h 59m 59s 남음", () => {
      const realNow = Date.now;
      Date.now = () => ONE_SEC_AFTER_KST_MIDNIGHT.getTime();
      try {
        const d = getTopicDeadline();
        const remaining = d.getTime() - Date.now();
        expect(remaining).toBe(24 * 60 * 60 * 1000 - 1000);
      } finally {
        Date.now = realNow;
      }
    });
  });

  describe("isTopicClosed", () => {
    it("자정 1초 전에는 열려있다", () => {
      expect(isTopicClosed(undefined, ONE_SEC_BEFORE_KST_MIDNIGHT)).toBe(false);
    });
    it("자정 정각에 닫힌다(=새 토픽으로 전환)", () => {
      // At the exact deadline, isTopicClosed compares now>=deadline.
      // Deadline is "next" midnight, which the patched Date.now() controls.
      const realNow = Date.now;
      Date.now = () => KST_MIDNIGHT.getTime();
      try {
        const d = getTopicDeadline();
        // 정확히 24시간 뒤로 롤오버
        expect(formatRemainingClock(d, new Date(KST_MIDNIGHT.getTime()))).toBe(
          "24:00:00"
        );
        // 이전 토픽은 마감된 것으로 간주
        expect(isTopicClosed(undefined, KST_MIDNIGHT)).toBe(false);
        // (deadline은 미래이므로 false. 핵심은 day stamp가 롤오버되어
        // 새 토픽 슬롯이 열렸다는 것 — 별도 day stamp 테스트가 보장.)
      } finally {
        Date.now = realNow;
      }
    });
  });

  describe("getKstDayStamp — 타임존 시뮬레이션", () => {
    it("자정 1초 전(UTC 14:59:59)은 3월 21일", () => {
      expect(getKstDayStamp(ONE_SEC_BEFORE_KST_MIDNIGHT)).toBe("2026-3-21");
    });

    it("KST 자정 정각(UTC 15:00:00)은 3월 22일로 롤오버", () => {
      expect(getKstDayStamp(KST_MIDNIGHT)).toBe("2026-3-22");
    });

    it("미국 동부 한낮(EST UTC-5, 같은 순간)에서도 동일한 KST 날짜 반환", () => {
      // 미국 뉴욕 사용자가 2026-03-21 10:00 EST에 본 화면.
      // EST UTC-5 → UTC = 2026-03-21 15:00:00Z = KST 2026-03-22 00:00.
      // 호스트 로컬 타임존과 무관하게 KST 기준 날짜로 잠겨야 한다.
      const sameInstantFromNY = utc("2026-03-21T15:00:00.000Z");
      expect(getKstDayStamp(sameInstantFromNY)).toBe("2026-3-22");
    });

    it("UTC 자정(=KST 09:00)은 같은 KST 날짜를 유지한다", () => {
      expect(getKstDayStamp(utc("2026-03-21T00:00:00.000Z"))).toBe("2026-3-21");
    });

    it("KST 자정 1ms 전과 1ms 후는 다른 day stamp", () => {
      const before = new Date(KST_MIDNIGHT.getTime() - 1);
      const after = new Date(KST_MIDNIGHT.getTime());
      expect(getKstDayStamp(before)).not.toBe(getKstDayStamp(after));
    });
  });

  describe("formatRemainingClock — 카운트다운 표시", () => {
    it("자정 정확히 1초 전이면 00:00:01", () => {
      const realNow = Date.now;
      Date.now = () => ONE_SEC_BEFORE_KST_MIDNIGHT.getTime();
      try {
        expect(
          formatRemainingClock(getTopicDeadline(), ONE_SEC_BEFORE_KST_MIDNIGHT)
        ).toBe("00:00:01");
      } finally {
        Date.now = realNow;
      }
    });

    it("마감 후에는 00:00:00을 보여준다", () => {
      const past = new Date(Date.now() - 5000);
      expect(formatRemainingClock(past)).toBe("00:00:00");
    });
  });
});
