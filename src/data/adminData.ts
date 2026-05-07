// ============================================================================
// Admin mock data + localStorage-backed store.
// Frontend-only: no backend. All state persists in localStorage and broadcasts
// a custom event so admin pages stay in sync.
// ============================================================================

export type BanDuration = "week" | "month" | "permanent";

import { type PinchCount, normalizeAdminUserPinchCount } from "./pinchMetrics";

export interface AdminMockUser {
  id: string;
  username: string;
  phone: string; // e.g. "010-1234-5678"
  email: string;
  joinedAt: string; // ISO
  totalPinches: PinchCount;
  totalLikes: number;
  avatar: string; // single char fallback
}

export interface BanRecord {
  userId: string;
  username: string;
  phone: string;
  duration: BanDuration;
  reason: string;
  bannedAt: string; // ISO
  expiresAt: string | null; // ISO or null for permanent
}

export interface BannedPhone {
  phone: string;
  username: string;
  bannedAt: string; // ISO
  reason: string;
}

export interface ReportedComment {
  id: string;
  topicId: string;
  topicTitle: string;
  username: string;
  text: string;
  reportCount: number;
  reportedAt: string; // ISO
  reasons: string[];
  status: "pending" | "resolved" | "dismissed";
}

export interface AdminTopicDraft {
  id: string;
  category: string;
  title: string;
  description: string;
  newsUrl: string;
  newsSource: string;
  date: string;
  createdAt: string;
}

// ----- 토픽 교체 시 영향받는 PINCH / audit log / 알림 ------------------------
// 백엔드 연결 시 각 인터페이스는 그대로 테이블 스키마로 매핑됩니다.
//   pinches.status, topic_revisions, user_notifications

/**
 * PINCH 상태:
 * - "active": 정상. 토픽에 노출 / 좋아요 가능 / 랭킹·아카이브 후보.
 * - "archived_invalid": 어드민이 토픽을 "교체"하면서 맥락이 깨져 무효화됨.
 *     · 물리 삭제(DELETE) 절대 금지 — 본인 마이페이지에서는 항상 조회 가능.
 *     · 토픽 화면 / 아카이브 / 랭킹 집계에서는 숨김.
 *     · 좋아요 수치는 보존되되 랭킹 점수 산정에서 제외.
 */
export type PinchStatus = "active" | "archived_invalid";

export interface PinchSnapshot {
  id: string;
  topicId: string;
  /** 작성 당시 토픽 제목 — 토픽이 교체되어도 본인이 "어떤 논점에 썼었는지" 추적 */
  originalTopicTitle: string;
  username: string;
  text: string;
  likes: number;
  status: PinchStatus;
  /** archived_invalid 로 전환된 시점 (ISO) */
  invalidatedAt?: string;
  /** 어드민이 입력한 교체 사유 (audit + 사용자 공지에 표시) */
  invalidatedReason?: string;
  createdAt: string;
}

export interface TopicRevision {
  id: string;
  topicId: string;
  /** "minor" = 오타·문구 다듬기 (PINCH 영향 없음) / "replace" = 토픽 교체 */
  mode: "minor" | "replace";
  /** snapshot of fields BEFORE the change */
  before: Pick<AdminTopicDraft, "category" | "title" | "description" | "newsUrl" | "newsSource">;
  /** snapshot of fields AFTER the change */
  after: Pick<AdminTopicDraft, "category" | "title" | "description" | "newsUrl" | "newsSource">;
  reason: string;
  /** "replace" 일 때만 채워짐: 영향받은 PINCH 수 / 좋아요 합 */
  affectedPinchCount: number;
  affectedLikeCount: number;
  changedAt: string;
  changedBy: string; // admin user id (mock: "admin")
}

export interface UserNotification {
  id: string;
  userId: string;
  type: "pinch_invalidated";
  topicId: string;
  /** 무효화된 본인 PINCH id */
  pinchId: string;
  message: string;
  reason: string;
  createdAt: string;
  read: boolean;
}

// ----- Initial mock seed --------------------------------------------------

// Raw seed values use plain numbers; we normalize them to branded PinchCount
// below so any consumer of `seedUsers` gets the safe type.
const rawSeedUsers = [
  { id: "u1", username: "시민의식", phone: "010-1111-2222", email: "citizen@example.com", joinedAt: "2025-09-12", totalPinches: 142, totalLikes: 2310, avatar: "시" },
  { id: "u2", username: "테크윤리", phone: "010-2222-3333", email: "tech@example.com", joinedAt: "2025-08-03", totalPinches: 98, totalLikes: 1856, avatar: "테" },
  { id: "u3", username: "법학도", phone: "010-3333-4444", email: "law@example.com", joinedAt: "2026-01-21", totalPinches: 56, totalLikes: 941, avatar: "법" },
  { id: "u4", username: "워라밸마스터", phone: "010-4444-5555", email: "wlb@example.com", joinedAt: "2025-11-09", totalPinches: 78, totalLikes: 1204, avatar: "워" },
  { id: "u5", username: "현실주의자", phone: "010-5555-6666", email: "real@example.com", joinedAt: "2026-02-14", totalPinches: 33, totalLikes: 412, avatar: "현" },
  { id: "u6", username: "따릉이러버", phone: "010-6666-7777", email: "bike@example.com", joinedAt: "2025-12-01", totalPinches: 47, totalLikes: 689, avatar: "따" },
  { id: "u7", username: "교육전문가", phone: "010-7777-8888", email: "edu@example.com", joinedAt: "2025-07-19", totalPinches: 119, totalLikes: 1543, avatar: "교" },
  { id: "u8", username: "동물복지연대", phone: "010-8888-9999", email: "animal@example.com", joinedAt: "2025-10-05", totalPinches: 64, totalLikes: 1098, avatar: "동" },
  { id: "u9", username: "광고봇1", phone: "010-9999-0000", email: "spam1@example.com", joinedAt: "2026-03-15", totalPinches: 7, totalLikes: 2, avatar: "광" },
  { id: "u10", username: "트롤유저", phone: "010-1010-2020", email: "troll@example.com", joinedAt: "2026-03-18", totalPinches: 12, totalLikes: 4, avatar: "트" },
];
const seedUsers: AdminMockUser[] = rawSeedUsers.map(normalizeAdminUserPinchCount);

const seedReports: ReportedComment[] = [
  {
    id: "r1",
    topicId: "society-1",
    topicTitle: "따릉이 음주운전 사건, 어떻게 생각하시나요?",
    username: "광고봇1",
    text: "★★★ 무료 코인 받기 클릭 → http://spam.example ★★★",
    reportCount: 12,
    reportedAt: "2026-04-29T08:14:00Z",
    reasons: ["스팸/광고", "외부 링크"],
    status: "pending",
  },
  {
    id: "r2",
    topicId: "tech-1",
    topicTitle: "AI 코드 리뷰가 시니어를 대체할 수 있을까?",
    username: "트롤유저",
    text: "이런 글 쓰는 사람들 진짜 한심하다. 다 도태돼라.",
    reportCount: 8,
    reportedAt: "2026-04-29T06:42:00Z",
    reasons: ["욕설/비방", "혐오 표현"],
    status: "pending",
  },
  {
    id: "r3",
    topicId: "politics-1",
    topicTitle: "국회의원 면책특권 축소, 찬성하시나요?",
    username: "현실주의자",
    text: "특정 정당 지지자들은 다 멍청해서 이런 거 이해 못함ㅋㅋ",
    reportCount: 5,
    reportedAt: "2026-04-28T22:11:00Z",
    reasons: ["혐오 표현"],
    status: "pending",
  },
];

// ----- Storage layer ------------------------------------------------------

const KEYS = {
  users: "hanmadi:admin:users",
  bans: "hanmadi:admin:bans",
  bannedPhones: "hanmadi:admin:bannedPhones",
  reports: "hanmadi:admin:reports",
  topics: "hanmadi:admin:topics",
  activeTopic: "hanmadi:admin:activeTopicId",
  // Per-category forced topic overrides: { [categoryId]: topicId }
  // Independent of the global override; both can coexist.
  activeByCategory: "hanmadi:admin:activeTopicByCategory",
  // 토픽별 PINCH 스냅샷 (백엔드 연결 전 mock).
  // 키: topicId, 값: PinchSnapshot[] — adminStore.getPinchesForTopic 로 접근.
  pinchesByTopic: "hanmadi:admin:pinchesByTopic",
  // 토픽 변경 이력 (audit log).
  topicRevisions: "hanmadi:admin:topicRevisions",
  // 사용자에게 발송된 알림 큐.
  notifications: "hanmadi:admin:notifications",
} as const;

const EVENT = "hanmadi:admin-change";

const read = <T>(key: string, fallback: T): T => {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

const write = <T>(key: string, value: T) => {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new Event(EVENT));
};

// Lazy seed on first access so tests/SSR don't write at import time.
const ensureSeeded = () => {
  if (typeof window === "undefined") return;
  if (!localStorage.getItem(KEYS.users)) localStorage.setItem(KEYS.users, JSON.stringify(seedUsers));
  if (!localStorage.getItem(KEYS.bans)) localStorage.setItem(KEYS.bans, JSON.stringify([]));
  if (!localStorage.getItem(KEYS.bannedPhones)) localStorage.setItem(KEYS.bannedPhones, JSON.stringify([]));
  if (!localStorage.getItem(KEYS.reports)) localStorage.setItem(KEYS.reports, JSON.stringify(seedReports));
  if (!localStorage.getItem(KEYS.topics)) localStorage.setItem(KEYS.topics, JSON.stringify([]));
};

export const adminEvent = EVENT;

// ----- Public store API ---------------------------------------------------

export const adminStore = {
  getUsers(): AdminMockUser[] {
    ensureSeeded();
    return read<AdminMockUser[]>(KEYS.users, seedUsers);
  },
  getBans(): BanRecord[] {
    ensureSeeded();
    return read<BanRecord[]>(KEYS.bans, []);
  },
  getBannedPhones(): BannedPhone[] {
    ensureSeeded();
    return read<BannedPhone[]>(KEYS.bannedPhones, []);
  },
  getReports(): ReportedComment[] {
    ensureSeeded();
    return read<ReportedComment[]>(KEYS.reports, seedReports);
  },
  getTopics(): AdminTopicDraft[] {
    ensureSeeded();
    return read<AdminTopicDraft[]>(KEYS.topics, []);
  },

  // ----- 토픽별 PINCH 스냅샷 ------------------------------------------------
  // 백엔드 연결 전 mock: 토픽이 처음 조회될 때 결정론적 시드로 PINCH를 생성해
  // localStorage 에 한 번만 적재한다. 이후 invalidate / like 변경은 모두 여기서
  // 일어나며 Topic / Archive / Ranking / MyPage 가 같은 소스를 본다.
  getPinchesForTopic(topicId: string): PinchSnapshot[] {
    ensureSeeded();
    const all = read<Record<string, PinchSnapshot[]>>(KEYS.pinchesByTopic, {});
    if (all[topicId]) return all[topicId];

    const topic = this.getTopics().find((t) => t.id === topicId);
    const seedTitle = topic?.title ?? "오늘의 PINCH";
    const seedCount = 6 + (topicId.length % 5);
    const seedUsersList = this.getUsers().slice(0, seedCount);
    const sampleTexts = [
      "이 주제는 단순히 찬반으로 나누기 어렵습니다. 맥락이 더 중요합니다.",
      "법·제도가 따라가지 못하는 사이 피해는 늘어나고 있어요.",
      "현실적으로 단속 인력부터 확보하지 않으면 의미가 없다고 봅니다.",
      "기술적 해결책과 제도적 해결책은 함께 가야 합니다.",
      "당사자의 목소리를 더 들어볼 필요가 있어 보입니다.",
      "장기적으로 봤을 때 교육이 가장 큰 지렛대라고 생각합니다.",
    ];
    const seeded: PinchSnapshot[] = seedUsersList.map((u, i) => ({
      id: `${topicId}-p${i + 1}`,
      topicId,
      originalTopicTitle: seedTitle,
      username: u.username,
      text: sampleTexts[i % sampleTexts.length],
      likes: 30 + ((topicId.charCodeAt(0) + i * 17) % 220),
      status: "active",
      createdAt: new Date(Date.now() - (i + 1) * 3600_000).toISOString(),
    }));
    all[topicId] = seeded;
    write(KEYS.pinchesByTopic, all);
    return seeded;
  },

  /** 영향 미리보기에 쓰는 active PINCH 수 / 좋아요 합 */
  getPinchImpactForTopic(topicId: string): { pinchCount: number; likeCount: number } {
    const list = this.getPinchesForTopic(topicId).filter((p) => p.status === "active");
    return {
      pinchCount: list.length,
      likeCount: list.reduce((sum, p) => sum + p.likes, 0),
    };
  },

  getTopicRevisions(topicId?: string): TopicRevision[] {
    ensureSeeded();
    const all = read<TopicRevision[]>(KEYS.topicRevisions, []);
    return topicId ? all.filter((r) => r.topicId === topicId) : all;
  },

  getNotificationsForUser(userId: string): UserNotification[] {
    ensureSeeded();
    return read<UserNotification[]>(KEYS.notifications, []).filter((n) => n.userId === userId);
  },


  banUser(userId: string, duration: BanDuration, reason: string) {
    const users = this.getUsers();
    const user = users.find((u) => u.id === userId);
    if (!user) return;
    const now = new Date();
    const expiresAt =
      duration === "permanent"
        ? null
        : new Date(now.getTime() + (duration === "week" ? 7 : 30) * 24 * 60 * 60 * 1000).toISOString();

    const bans = this.getBans().filter((b) => b.userId !== userId);
    bans.push({
      userId,
      username: user.username,
      phone: user.phone,
      duration,
      reason: reason || "관리자 조치",
      bannedAt: now.toISOString(),
      expiresAt,
    });
    write(KEYS.bans, bans);

    if (duration === "permanent") {
      const phones = this.getBannedPhones().filter((p) => p.phone !== user.phone);
      phones.push({
        phone: user.phone,
        username: user.username,
        bannedAt: now.toISOString(),
        reason: reason || "영구 정지",
      });
      write(KEYS.bannedPhones, phones);
    }
  },

  unbanUser(userId: string): { banRemoved: boolean; phoneUnblocked: boolean } {
    const allBans = this.getBans();
    const ban = allBans.find((b) => b.userId === userId);
    const user = this.getUsers().find((u) => u.id === userId);

    // Collect every phone number associated with this user that may be blocked:
    // current ban record's phone + the user's registered phone (defensive in
    // case of phone changes or orphaned phone blocks left from prior bans).
    const phonesToClear = new Set<string>();
    if (ban?.duration === "permanent" && ban.phone) phonesToClear.add(ban.phone);
    if (user?.phone) {
      const orphan = this.getBannedPhones().find((p) => p.phone === user.phone);
      if (orphan) phonesToClear.add(user.phone);
    }

    const nextBans = allBans.filter((b) => b.userId !== userId);
    const banRemoved = nextBans.length !== allBans.length;

    const currentPhones = this.getBannedPhones();
    const nextPhones = currentPhones.filter((p) => !phonesToClear.has(p.phone));
    const phoneUnblocked = nextPhones.length !== currentPhones.length;

    // Write both keys then dispatch a single change event to avoid double renders.
    if (banRemoved) localStorage.setItem(KEYS.bans, JSON.stringify(nextBans));
    if (phoneUnblocked) localStorage.setItem(KEYS.bannedPhones, JSON.stringify(nextPhones));
    if (banRemoved || phoneUnblocked) {
      window.dispatchEvent(new Event(EVENT));
    }

    return { banRemoved, phoneUnblocked };
  },

  isPhoneBanned(phone: string): BannedPhone | null {
    return this.getBannedPhones().find((p) => p.phone === phone) ?? null;
  },

  resolveReport(reportId: string, action: "delete" | "dismiss") {
    const reports = this.getReports().map((r) =>
      r.id === reportId ? { ...r, status: action === "delete" ? "resolved" : "dismissed" } : r
    );
    write(KEYS.reports, reports as ReportedComment[]);
  },

  addTopic(draft: Omit<AdminTopicDraft, "id" | "createdAt">) {
    const topics = this.getTopics();
    topics.unshift({
      ...draft,
      id: `admin-${Date.now()}`,
      createdAt: new Date().toISOString(),
    });
    write(KEYS.topics, topics);
  },

  /**
   * 토픽 수정. options.mode 에 따라 부수효과가 갈립니다.
   *  - "minor"  : 필드만 패치. 기존 PINCH 그대로. revision 만 기록.
   *  - "replace": 필드 패치 + 기존 active PINCH 전부 archived_invalid 로 전환,
   *               작성자에게 알림 큐 적재, revision 에 영향 수치 + 사유 기록.
   *               PINCH 는 절대 물리 삭제하지 않음.
   */
  updateTopic(
    id: string,
    patch: Partial<Omit<AdminTopicDraft, "id" | "createdAt">>,
    options: { mode?: "minor" | "replace"; reason?: string; changedBy?: string } = {}
  ): { invalidatedCount: number; affectedLikeCount: number } {
    const mode = options.mode ?? "minor";
    const reason = (options.reason ?? "").trim();
    const changedBy = options.changedBy ?? "admin";

    const topics = this.getTopics();
    const before = topics.find((t) => t.id === id);
    if (!before) return { invalidatedCount: 0, affectedLikeCount: 0 };

    const after: AdminTopicDraft = { ...before, ...patch };
    write(KEYS.topics, topics.map((t) => (t.id === id ? after : t)));

    let invalidatedCount = 0;
    let affectedLikeCount = 0;

    if (mode === "replace") {
      // 1) 영향받는 PINCH 무효화 (보존 + 숨김 처리)
      const pinchesAll = read<Record<string, PinchSnapshot[]>>(KEYS.pinchesByTopic, {});
      const list = this.getPinchesForTopic(id);
      const now = new Date().toISOString();
      const nextList = list.map((p) => {
        if (p.status !== "active") return p;
        invalidatedCount += 1;
        affectedLikeCount += p.likes;
        return {
          ...p,
          status: "archived_invalid" as const,
          invalidatedAt: now,
          invalidatedReason: reason || "어드민 토픽 교체",
        };
      });
      pinchesAll[id] = nextList;
      write(KEYS.pinchesByTopic, pinchesAll);

      // 2) 작성자 알림 큐 적재 (1인 1 PINCH 카운터 리셋 의도 — 백엔드 연결 시
      //    submit_pinch 가 archived_invalid 는 카운트하지 않도록 처리)
      const notifs = read<UserNotification[]>(KEYS.notifications, []);
      const users = this.getUsers();
      for (const p of nextList.filter((x) => x.invalidatedAt === now)) {
        const user = users.find((u) => u.username === p.username);
        if (!user) continue;
        notifs.push({
          id: `n-${id}-${p.id}`,
          userId: user.id,
          type: "pinch_invalidated",
          topicId: id,
          pinchId: p.id,
          message: `오늘 토픽이 변경되어 PINCH가 무효화되었습니다. 새 토픽에 다시 작성할 수 있습니다.`,
          reason: reason || "어드민 토픽 교체",
          createdAt: now,
          read: false,
        });
      }
      write(KEYS.notifications, notifs);
    }

    // 3) audit log
    const revisions = read<TopicRevision[]>(KEYS.topicRevisions, []);
    revisions.unshift({
      id: `rev-${id}-${Date.now()}`,
      topicId: id,
      mode,
      before: {
        category: before.category,
        title: before.title,
        description: before.description,
        newsUrl: before.newsUrl,
        newsSource: before.newsSource,
      },
      after: {
        category: after.category,
        title: after.title,
        description: after.description,
        newsUrl: after.newsUrl,
        newsSource: after.newsSource,
      },
      reason: mode === "replace" ? reason || "어드민 토픽 교체" : reason,
      affectedPinchCount: invalidatedCount,
      affectedLikeCount,
      changedAt: new Date().toISOString(),
      changedBy,
    });
    write(KEYS.topicRevisions, revisions);

    return { invalidatedCount, affectedLikeCount };
  },

  deleteTopic(id: string) {
    const topics = this.getTopics().filter((t) => t.id !== id);
    write(KEYS.topics, topics);
    // If the deleted topic was the forced "today" topic, clear the override
    // so the homepage falls back to the default winner.
    if (this.getActiveTopicId() === id) {
      this.setActiveTopicId(null);
    }
    // Also drop any per-category overrides pointing at this topic.
    const map = this.getActiveTopicByCategoryMap();
    let changed = false;
    for (const [cat, tid] of Object.entries(map)) {
      if (tid === id) {
        delete map[cat];
        changed = true;
      }
    }
    if (changed) {
      localStorage.setItem(KEYS.activeByCategory, JSON.stringify(map));
      window.dispatchEvent(new Event(EVENT));
    }
  },

  // ----- Forced "today" topic override (global) ---------------------------
  // Admin can promote any admin-created topic as the single visible "today"
  // topic across the app. Stored as just the id; null = use default ranking.
  getActiveTopicId(): string | null {
    ensureSeeded();
    if (typeof window === "undefined") return null;
    try {
      const raw = localStorage.getItem(KEYS.activeTopic);
      return raw ? (JSON.parse(raw) as string | null) : null;
    } catch {
      return null;
    }
  },

  setActiveTopicId(id: string | null) {
    if (id === null) {
      localStorage.removeItem(KEYS.activeTopic);
      window.dispatchEvent(new Event(EVENT));
      return;
    }
    write(KEYS.activeTopic, id);
  },

  // ----- Forced topic per category ----------------------------------------
  // When a category-scoped override is set, the homepage / topic page show
  // that topic whenever the user is browsing that specific category, while
  // the global "all" view keeps using the global override (or default rank).
  getActiveTopicByCategoryMap(): Record<string, string> {
    ensureSeeded();
    if (typeof window === "undefined") return {};
    try {
      const raw = localStorage.getItem(KEYS.activeByCategory);
      return raw ? (JSON.parse(raw) as Record<string, string>) : {};
    } catch {
      return {};
    }
  },

  getActiveTopicIdForCategory(categoryId: string): string | null {
    return this.getActiveTopicByCategoryMap()[categoryId] ?? null;
  },

  setActiveTopicForCategory(categoryId: string, topicId: string | null) {
    const map = this.getActiveTopicByCategoryMap();
    if (topicId === null) {
      if (!(categoryId in map)) return;
      delete map[categoryId];
    } else {
      map[categoryId] = topicId;
    }
    localStorage.setItem(KEYS.activeByCategory, JSON.stringify(map));
    window.dispatchEvent(new Event(EVENT));
  },
};

// ----- Hook helper --------------------------------------------------------

import { useEffect, useState } from "react";

export const useAdminStore = <T>(selector: () => T): T => {
  const [value, setValue] = useState<T>(() => selector());
  useEffect(() => {
    const sync = () => setValue(selector());
    window.addEventListener(EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(EVENT, sync);
      window.removeEventListener("storage", sync);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return value;
};

// ----- Active ban helpers -------------------------------------------------

export const getActiveBan = (userId: string): BanRecord | null => {
  const ban = adminStore.getBans().find((b) => b.userId === userId);
  if (!ban) return null;
  if (ban.expiresAt && new Date(ban.expiresAt).getTime() < Date.now()) return null;
  return ban;
};

export const formatBanLabel = (ban: BanRecord): string => {
  if (ban.duration === "permanent") return "영구 정지";
  if (ban.duration === "week") return "1주 정지";
  return "1달 정지";
};
