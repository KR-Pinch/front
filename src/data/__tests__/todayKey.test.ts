import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getKstDayStamp } from "../mockData";

// localStorage key used by Topic.tsx — kept in sync with src/pages/Topic.tsx.
// Anchored to the KST day stamp so the "1 PICK / day" lock rolls over at
// 00:00 Asia/Seoul regardless of the viewer's local timezone.
const todayKey = (now?: Date) => `hanmadi:commented:${getKstDayStamp(now)}`;

// KST 자정 경계: 2026-03-21 24:00 KST == 2026-03-21 15:00:00 UTC
const KST_MIDNIGHT_UTC = new Date("2026-03-21T15:00:00.000Z");
const ONE_MS_BEFORE = new Date(KST_MIDNIGHT_UTC.getTime() - 1);
const ONE_MS_AFTER = new Date(KST_MIDNIGHT_UTC.getTime());
const ONE_SEC_BEFORE = new Date(KST_MIDNIGHT_UTC.getTime() - 1000);
const ONE_SEC_AFTER = new Date(KST_MIDNIGHT_UTC.getTime() + 1000);

describe("todayKey — KST 자정 시뮬레이션 롤오버", () => {
  let realNow: () => number;

  beforeEach(() => {
    realNow = Date.now;
  });
  afterEach(() => {
    Date.now = realNow;
  });

  it("자정 직전과 직후의 키는 서로 다르다 (1ms 경계)", () => {
    const before = todayKey(ONE_MS_BEFORE);
    const after = todayKey(ONE_MS_AFTER);
    expect(before).not.toBe(after);
    expect(before).toBe("hanmadi:commented:2026-3-21");
    expect(after).toBe("hanmadi:commented:2026-3-22");
  });

  it("자정 1초 전: 어제(3-21) 키", () => {
    expect(todayKey(ONE_SEC_BEFORE)).toBe("hanmadi:commented:2026-3-21");
  });

  it("자정 1초 후: 오늘(3-22) 키로 갱신", () => {
    expect(todayKey(ONE_SEC_AFTER)).toBe("hanmadi:commented:2026-3-22");
  });

  it("KST 자정에 어제 키로 저장된 잠금 플래그가 새 키 조회에서는 미설정으로 보인다", () => {
    // 1) 자정 직전: 사용자가 댓글 제출 → 어제 키에 '1' 저장
    const yesterdayKey = todayKey(ONE_SEC_BEFORE);
    const store = new Map<string, string>();
    store.set(yesterdayKey, "1");
    expect(store.get(todayKey(ONE_SEC_BEFORE))).toBe("1"); // 잠금 상태

    // 2) 자정 직후: 같은 사용자, 같은 origin — 새 키는 비어있어야 잠금 해제
    const todayK = todayKey(ONE_SEC_AFTER);
    expect(todayK).not.toBe(yesterdayKey);
    expect(store.get(todayK)).toBeUndefined();
  });

  it("같은 KST 하루 안에서는(자정 직전 23:00 KST → 23:30 KST) 키가 동일하게 유지된다", () => {
    const at2300Kst = new Date("2026-03-21T14:00:00.000Z"); // 23:00 KST
    const at2330Kst = new Date("2026-03-21T14:30:00.000Z"); // 23:30 KST
    expect(todayKey(at2300Kst)).toBe(todayKey(at2330Kst));
  });

  it("UTC 자정(=KST 09:00)에는 키가 바뀌지 않는다 (KST 기준 동일 일자)", () => {
    const justBeforeUtcMidnight = new Date("2026-03-20T23:59:59.000Z"); // KST 3-21 08:59:59
    const justAfterUtcMidnight = new Date("2026-03-21T00:00:01.000Z"); // KST 3-21 09:00:01
    expect(todayKey(justBeforeUtcMidnight)).toBe(todayKey(justAfterUtcMidnight));
    expect(todayKey(justBeforeUtcMidnight)).toBe("hanmadi:commented:2026-3-21");
  });

  it("타임존 시뮬레이션: 같은 절대 순간이면 호스트 TZ와 무관하게 동일한 키", () => {
    // 같은 epoch ms — Date 객체는 내부적으로 UTC ms만 저장하므로,
    // "뉴욕 사용자"와 "서울 사용자"가 같은 순간에 본 키는 같아야 한다.
    const instant = new Date("2026-03-21T15:30:00.000Z"); // KST 2026-3-22 00:30
    const fromSeoul = todayKey(instant);
    const fromNewYork = todayKey(new Date(instant.getTime()));
    const fromLondon = todayKey(new Date(instant.getTime()));
    expect(fromSeoul).toBe(fromNewYork);
    expect(fromSeoul).toBe(fromLondon);
    expect(fromSeoul).toBe("hanmadi:commented:2026-3-22");
  });

  it("자정을 가로질러 1초 단위로 진행하면 정확히 한 번만 키가 바뀐다", () => {
    const samples: string[] = [];
    for (let offset = -3; offset <= 3; offset++) {
      samples.push(todayKey(new Date(KST_MIDNIGHT_UTC.getTime() + offset * 1000)));
    }
    // -3, -2, -1초: 어제 / 0, +1, +2, +3초: 오늘 → 변화는 정확히 1번
    const transitions = samples.reduce(
      (n, k, i) => (i > 0 && k !== samples[i - 1] ? n + 1 : n),
      0
    );
    expect(transitions).toBe(1);
  });
});
