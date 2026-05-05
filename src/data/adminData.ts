// ============================================================================
// Admin mock data + localStorage-backed store.
// Frontend-only: no backend. All state persists in localStorage and broadcasts
// a custom event so admin pages stay in sync.
// ============================================================================

export type BanDuration = "week" | "month" | "permanent";

export interface AdminMockUser {
  id: string;
  username: string;
  phone: string; // e.g. "010-1234-5678"
  email: string;
  joinedAt: string; // ISO
  totalComments: number;
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

// ----- Initial mock seed --------------------------------------------------

const seedUsers: AdminMockUser[] = [
  { id: "u1", username: "시민의식", phone: "010-1111-2222", email: "citizen@example.com", joinedAt: "2025-09-12", totalComments: 142, totalLikes: 2310, avatar: "시" },
  { id: "u2", username: "테크윤리", phone: "010-2222-3333", email: "tech@example.com", joinedAt: "2025-08-03", totalComments: 98, totalLikes: 1856, avatar: "테" },
  { id: "u3", username: "법학도", phone: "010-3333-4444", email: "law@example.com", joinedAt: "2026-01-21", totalComments: 56, totalLikes: 941, avatar: "법" },
  { id: "u4", username: "워라밸마스터", phone: "010-4444-5555", email: "wlb@example.com", joinedAt: "2025-11-09", totalComments: 78, totalLikes: 1204, avatar: "워" },
  { id: "u5", username: "현실주의자", phone: "010-5555-6666", email: "real@example.com", joinedAt: "2026-02-14", totalComments: 33, totalLikes: 412, avatar: "현" },
  { id: "u6", username: "따릉이러버", phone: "010-6666-7777", email: "bike@example.com", joinedAt: "2025-12-01", totalComments: 47, totalLikes: 689, avatar: "따" },
  { id: "u7", username: "교육전문가", phone: "010-7777-8888", email: "edu@example.com", joinedAt: "2025-07-19", totalComments: 119, totalLikes: 1543, avatar: "교" },
  { id: "u8", username: "동물복지연대", phone: "010-8888-9999", email: "animal@example.com", joinedAt: "2025-10-05", totalComments: 64, totalLikes: 1098, avatar: "동" },
  { id: "u9", username: "광고봇1", phone: "010-9999-0000", email: "spam1@example.com", joinedAt: "2026-03-15", totalComments: 7, totalLikes: 2, avatar: "광" },
  { id: "u10", username: "트롤유저", phone: "010-1010-2020", email: "troll@example.com", joinedAt: "2026-03-18", totalComments: 12, totalLikes: 4, avatar: "트" },
];

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

  updateTopic(id: string, patch: Partial<Omit<AdminTopicDraft, "id" | "createdAt">>) {
    const topics = this.getTopics().map((t) => (t.id === id ? { ...t, ...patch } : t));
    write(KEYS.topics, topics);
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
