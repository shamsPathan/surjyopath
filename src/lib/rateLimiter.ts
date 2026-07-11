/**
 * Rate Limiter for Knock AI operations.
 *
 * Enforces:
 *  - Minimum delay between manual knocks (5000ms default)
 *  - Maximum knocks per day (20 default)
 *  - Goal batch interval (12 hours)
 */

import { CONFIG } from "./config";

interface KnockRecord {
  timestamp: number;
  type: "thought" | "goal";
}

const STORAGE_KEY = "vv_knock_log";

/* ─── Storage helpers (localStorage with fallback) ─── */

function getRecords(): KnockRecord[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    return JSON.parse(raw) as KnockRecord[];
  } catch {
    return [];
  }
}

function saveRecords(records: KnockRecord[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(records));
  } catch {
    // Storage full or unavailable — silently ignore
  }
}

/* ─── Public API ─── */

/**
 * Check if a knock operation is allowed right now.
 * Returns null if allowed, or an error message string if blocked.
 */
export function canKnock(type: "thought" | "goal"): string | null {
  const records = getRecords();
  const now = Date.now();

  // Rate limit: minimum delay between manual knocks
  const lastKnock = records.length > 0 ? records[records.length - 1] : null;
  if (lastKnock && type === "thought") {
    const elapsed = now - lastKnock.timestamp;
    if (elapsed < CONFIG.knock.rateLimitDelay) {
      const remaining = Math.ceil((CONFIG.knock.rateLimitDelay - elapsed) / 1000);
      return `Please wait ${remaining}s before knocking again`;
    }
  }

  // Daily limit: max knocks per day for thoughts
  if (type === "thought") {
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayKnocks = records.filter(
      (r) => r.type === "thought" && r.timestamp >= todayStart.getTime(),
    );
    if (todayKnocks.length >= CONFIG.knock.maxThoughtKnocksPerDay) {
      return `Daily limit reached (${CONFIG.knock.maxThoughtKnocksPerDay} knocks/day)`;
    }
  }

  // Goal batch interval check
  if (type === "goal") {
    const lastGoalKnock = records
      .filter((r) => r.type === "goal")
      .sort((a, b) => b.timestamp - a.timestamp)[0];
    if (lastGoalKnock) {
      const elapsed = now - lastGoalKnock.timestamp;
      if (elapsed < CONFIG.knock.goalBatchInterval) {
        const hoursLeft = Math.ceil(
          (CONFIG.knock.goalBatchInterval - elapsed) / (60 * 60 * 1000),
        );
        return `Goal processing available again in ${hoursLeft}h`;
      }
    }
  }

  return null;
}

/**
 * Record a successful knock operation.
 */
export function recordKnock(type: "thought" | "goal"): void {
  const records = getRecords();
  records.push({ timestamp: Date.now(), type });
  saveRecords(records);
}

/**
 * Get knock statistics for display.
 */
export function getKnockStats(): {
  todayThoughtKnocks: number;
  maxThoughtKnocks: number;
  lastKnockTime: number | null;
  canKnockMore: boolean;
} {
  const records = getRecords();
  const now = Date.now();

  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const todayThoughtKnocks = records.filter(
    (r) => r.type === "thought" && r.timestamp >= todayStart.getTime(),
  ).length;

  const lastRecord = records.length > 0 ? records[records.length - 1] : null;

  const lastKnockElapsed = lastRecord ? now - lastRecord.timestamp : Infinity;

  return {
    todayThoughtKnocks,
    maxThoughtKnocks: CONFIG.knock.maxThoughtKnocksPerDay,
    lastKnockTime: lastRecord?.timestamp ?? null,
    canKnockMore: lastKnockElapsed >= CONFIG.knock.rateLimitDelay &&
      todayThoughtKnocks < CONFIG.knock.maxThoughtKnocksPerDay,
  };
}

/**
 * Clear knock records (for testing or reset).
 */
export function clearKnockRecords(): void {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
}