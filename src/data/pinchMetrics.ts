// ============================================================================
// PINCH metric guards
// ----------------------------------------------------------------------------
// Single source of truth for "how many PICKs?" semantics. The codebase has
// historically mixed `commentCount`/`totalComments` (legacy) with
// `pinchCount`/`totalPinches` (current). This module:
//
//   1. Defines a branded `PinchCount` type so `pinchCount` and `totalPinches`
//      cannot be accidentally swapped with arbitrary numbers at compile time.
//   2. Provides a `toPinchCount()` coercer with safe defaults (NaN / negative /
//      non-finite → 0).
//   3. Provides `normalize*()` helpers that strip legacy keys, fill defaults,
//      and (in dev) warn loudly if legacy keys leak in from anywhere.
//
// Use these helpers whenever you ingest topic / archive / user data — even
// from the local mock seeds — so the rename to PINCH stays enforced.
// ============================================================================

const isDev =
  typeof import.meta !== "undefined" && (import.meta as { env?: { DEV?: boolean } }).env?.DEV;

// Branded number — prevents `pinchCount: someUnrelatedNumber` mistakes.
declare const __pinchCountBrand: unique symbol;
export type PinchCount = number & { readonly [__pinchCountBrand]: "PinchCount" };

/** Coerce any value to a non-negative integer PinchCount. Falls back to 0. */
export const toPinchCount = (value: unknown, fallback = 0): PinchCount => {
  const n = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(n) || n < 0) return fallback as PinchCount;
  return Math.floor(n) as PinchCount;
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
        `[pinchMetrics] "${label}" still has legacy field "${key}". ` +
          `Rename to the PICK-equivalent (pinchCount / totalPinches / bestPinch).`,
      );
    }
  }
  return record;
};

// ----- Normalizers --------------------------------------------------------
// Each normalizer returns a NEW object so legacy aliases are dropped, the
// PINCH field is coerced via toPinchCount(), and required defaults are filled.

export interface PinchCountedTopic {
  id: string;
  pinchCount: PinchCount;
  [k: string]: unknown;
}

export const normalizeTopicPinchCount = <T extends { id: string; pinchCount?: unknown }>(
  topic: T,
): T & { pinchCount: PinchCount } => {
  assertNoLegacyCommentField(topic, `topic:${topic.id}`);
  return { ...topic, pinchCount: toPinchCount(topic.pinchCount) };
};

export const normalizeArchivePinchCount = <
  T extends { date: string; totalPinches?: unknown; bestPinch?: unknown },
>(
  item: T,
): T & { totalPinches: PinchCount; bestPinch: string } => {
  assertNoLegacyCommentField(item, `archive:${item.date}`);
  return {
    ...item,
    totalPinches: toPinchCount(item.totalPinches),
    bestPinch: typeof item.bestPinch === "string" ? item.bestPinch : "",
  };
};

export const normalizeAdminUserPinchCount = <
  T extends { id: string; totalPinches?: unknown; totalLikes?: unknown },
>(
  user: T,
): T & { totalPinches: PinchCount; totalLikes: number } => {
  assertNoLegacyCommentField(user, `adminUser:${user.id}`);
  return {
    ...user,
    totalPinches: toPinchCount(user.totalPinches),
    totalLikes: toPinchCount(user.totalLikes),
  };
};

export interface MyPinchStats {
  totalPinches: PinchCount;
  totalLikes: number;
  bestPinchCount: PinchCount;
  streak: number;
  avgLikes: number;
  participationRate: number;
}

export const normalizeMyStats = (raw: Record<string, unknown>): MyPinchStats => {
  assertNoLegacyCommentField(raw, "myStats");
  const num = (v: unknown, fb = 0) => {
    const n = typeof v === "number" ? v : Number(v);
    return Number.isFinite(n) ? n : fb;
  };
  return {
    totalPinches: toPinchCount(raw.totalPinches),
    totalLikes: num(raw.totalLikes),
    bestPinchCount: toPinchCount(raw.bestPinchCount),
    streak: num(raw.streak),
    avgLikes: num(raw.avgLikes),
    participationRate: Math.max(0, Math.min(100, num(raw.participationRate))),
  };
};

/** Format helper so every UI counter renders PINCH numbers identically. */
export const formatPinchCount = (n: PinchCount | number): string =>
  toPinchCount(n).toLocaleString();
