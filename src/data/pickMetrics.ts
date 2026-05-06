// ============================================================================
// PICK metric guards
// ----------------------------------------------------------------------------
// Single source of truth for "how many PICKs?" semantics. The codebase has
// historically mixed `commentCount`/`totalComments` (legacy) with
// `pickCount`/`totalPicks` (current). This module:
//
//   1. Defines a branded `PickCount` type so `pickCount` and `totalPicks`
//      cannot be accidentally swapped with arbitrary numbers at compile time.
//   2. Provides a `toPickCount()` coercer with safe defaults (NaN / negative /
//      non-finite → 0).
//   3. Provides `normalize*()` helpers that strip legacy keys, fill defaults,
//      and (in dev) warn loudly if legacy keys leak in from anywhere.
//
// Use these helpers whenever you ingest topic / archive / user data — even
// from the local mock seeds — so the rename to PICK stays enforced.
// ============================================================================

const isDev =
  typeof import.meta !== "undefined" && (import.meta as { env?: { DEV?: boolean } }).env?.DEV;

// Branded number — prevents `pickCount: someUnrelatedNumber` mistakes.
declare const __pickCountBrand: unique symbol;
export type PickCount = number & { readonly [__pickCountBrand]: "PickCount" };

/** Coerce any value to a non-negative integer PickCount. Falls back to 0. */
export const toPickCount = (value: unknown, fallback = 0): PickCount => {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback as PickCount;
  return Math.floor(n) as PickCount;
};

// Legacy keys we explicitly forbid on PICK-bearing records. Kept in one place
// so future reviewers can see exactly which names are off-limits.
const LEGACY_PICK_KEYS = [
  "commentCount",
  "totalComments",
  "comments",       // when used as a count, not a list
  "bestComment",
  "bestCommentText",
] as const;

/** Dev-only sanity check. Throws in dev if a legacy comment-count key sneaks in. */
export const assertNoLegacyCommentField = <T extends object>(record: T, label: string): T => {
  if (!isDev) return record;
  for (const key of LEGACY_PICK_KEYS) {
    if (key === "comments") continue; // skip — list-typed elsewhere
    if (key in record) {
      // eslint-disable-next-line no-console
      console.error(
        `[pickMetrics] "${label}" still has legacy field "${key}". ` +
          `Rename to the PICK-equivalent (pickCount / totalPicks / bestPick).`,
      );
    }
  }
  return record;
};

// ----- Normalizers --------------------------------------------------------
// Each normalizer returns a NEW object so legacy aliases are dropped, the
// PICK field is coerced via toPickCount(), and required defaults are filled.

export interface PickCountedTopic {
  id: string;
  pickCount: PickCount;
  [k: string]: unknown;
}

export const normalizeTopicPickCount = <T extends { id: string; pickCount?: unknown }>(
  topic: T,
): T & { pickCount: PickCount } => {
  assertNoLegacyCommentField(topic, `topic:${topic.id}`);
  return { ...topic, pickCount: toPickCount(topic.pickCount) };
};

export const normalizeArchivePickCount = <
  T extends { date: string; totalPicks?: unknown; bestPick?: unknown },
>(
  item: T,
): T & { totalPicks: PickCount; bestPick: string } => {
  assertNoLegacyCommentField(item, `archive:${item.date}`);
  return {
    ...item,
    totalPicks: toPickCount(item.totalPicks),
    bestPick: typeof item.bestPick === "string" ? item.bestPick : "",
  };
};

export const normalizeAdminUserPickCount = <
  T extends { id: string; totalPicks?: unknown; totalLikes?: unknown },
>(
  user: T,
): T & { totalPicks: PickCount; totalLikes: number } => {
  assertNoLegacyCommentField(user, `adminUser:${user.id}`);
  return {
    ...user,
    totalPicks: toPickCount(user.totalPicks),
    totalLikes: toPickCount(user.totalLikes),
  };
};

export interface MyPickStats {
  totalPicks: PickCount;
  totalLikes: number;
  bestPickCount: PickCount;
  streak: number;
  avgLikes: number;
  participationRate: number;
}

export const normalizeMyStats = (raw: Record<string, unknown>): MyPickStats => {
  assertNoLegacyCommentField(raw, "myStats");
  const num = (v: unknown, fb = 0) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : fb;
  };
  return {
    totalPicks: toPickCount(raw.totalPicks),
    totalLikes: num(raw.totalLikes),
    bestPickCount: toPickCount(raw.bestPickCount),
    streak: num(raw.streak),
    avgLikes: num(raw.avgLikes),
    participationRate: Math.max(0, Math.min(100, num(raw.participationRate))),
  };
};

/** Format helper so every UI counter renders PICK numbers identically. */
export const formatPickCount = (n: PickCount | number): string =>
  toPickCount(n).toLocaleString();
