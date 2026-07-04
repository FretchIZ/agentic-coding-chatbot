import { CACHE_TTL } from '@learning-platform/shared';

interface CacheEntry<T> {
  data: T;
  expiresAt: number;
}

export class LRUCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  constructor(private maxSize: number = 1000) {}

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    this.cache.delete(key);
    this.cache.set(key, entry);
    return entry.data;
  }

  set(key: string, data: T, ttlMs: number = CACHE_TTL.medium): void {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) this.cache.delete(firstKey);
    }
    this.cache.set(key, { data, expiresAt: Date.now() + ttlMs });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  get size(): number {
    return this.cache.size;
  }
}

export class TTLCache<T> {
  private cache = new Map<string, CacheEntry<T>>();

  constructor(private defaultTTLMs: number = CACHE_TTL.medium) {}

  get(key: string): T | undefined {
    const entry = this.cache.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.cache.delete(key);
      return undefined;
    }
    return entry.data;
  }

  set(key: string, data: T, ttlMs?: number): void {
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + (ttlMs ?? this.defaultTTLMs),
    });
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expiresAt) this.cache.delete(key);
    }
  }
}

export class WriteThroughCache<T> {
  constructor(
    private source: { get: (key: string) => Promise<T | undefined>; set: (key: string, value: T) => Promise<void> },
    private cache: TTLCache<T>,
    private ttlMs: number = CACHE_TTL.medium
  ) {}

  async get(key: string): Promise<T | undefined> {
    const cached = this.cache.get(key);
    if (cached !== undefined) return cached;
    const data = await this.source.get(key);
    if (data !== undefined) this.cache.set(key, data, this.ttlMs);
    return data;
  }

  async set(key: string, value: T): Promise<void> {
    await this.source.set(key, value);
    this.cache.set(key, value, this.ttlMs);
  }
}