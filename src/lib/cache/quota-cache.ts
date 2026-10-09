import { MetricAttribution } from "@/lib/types";

export interface CacheEntry<T> {
  value: T;
  source: string;
  createdAt: string;
  expiresAt: string;
}

export interface QuotaTracker {
  usedUnits: number;
  maxUnits: number;
  lastResetDate: string; // YYYY-MM-DD (UTC)
}

// In-memory persistent cache store for development / edge runtime
class MemoryCacheStore {
  private cache = new Map<string, CacheEntry<any>>();
  private quota: QuotaTracker = {
    usedUnits: 0,
    maxUnits: 10000,
    lastResetDate: new Date().toISOString().split("T")[0],
  };

  private checkQuotaReset() {
    const today = new Date().toISOString().split("T")[0];
    if (this.quota.lastResetDate !== today) {
      this.quota.usedUnits = 0;
      this.quota.lastResetDate = today;
    }
  }

  getQuota(): QuotaTracker {
    this.checkQuotaReset();
    return { ...this.quota };
  }

  recordQuota(units: number) {
    this.checkQuotaReset();
    this.quota.usedUnits += units;
  }

  get<T>(key: string): CacheEntry<T> | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    // Check expiration
    if (new Date(entry.expiresAt) <= new Date()) {
      this.cache.delete(key);
      return null;
    }

    return entry;
  }

  set<T>(key: string, value: T, ttlSeconds: number, source: string): CacheEntry<T> {
    const now = new Date();
    const expiresAt = new Date(now.getTime() + ttlSeconds * 1000);

    const entry: CacheEntry<T> = {
      value,
      source,
      createdAt: now.toISOString(),
      expiresAt: expiresAt.toISOString(),
    };

    this.cache.set(key, entry);
    return entry;
  }

  clear() {
    this.cache.clear();
  }
}

export const quotaCache = new MemoryCacheStore();
