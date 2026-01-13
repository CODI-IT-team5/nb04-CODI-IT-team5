import { LRUCache } from 'lru-cache';

import { logger } from './logger.js';

export interface CacheOptions {
  max: number;
  ttl: number;
}

class CacheManager {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private caches: Map<string, LRUCache<string, any>> = new Map();

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  createCache(name: string, options: CacheOptions): LRUCache<string, any> {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const cache = new LRUCache<string, any>({ max: options.max, ttl: options.ttl });
    this.caches.set(name, cache);
    logger.debug({ target: 'cache', event: 'create', name, options }, `캐시 생성: ${name}`);
    return cache;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  getCache(name: string): LRUCache<string, any> | undefined {
    return this.caches.get(name);
  }

  invalidate(name: string, key?: string): void {
    const cache = this.caches.get(name);
    if (!cache) return;

    if (key) {
      cache.delete(key);
      logger.debug({ target: 'cache', event: 'invalidate', name, key }, `캐시 키 무효화: ${name}/${key}`);
    } else {
      cache.clear();
      logger.debug({ target: 'cache', event: 'clear', name }, `캐시 전체 무효화: ${name}`);
    }
  }

  invalidateByPrefix(name: string, prefix: string): void {
    const cache = this.caches.get(name);
    if (!cache) return;

    const keysToDelete: string[] = [];
    for (const key of cache.keys()) {
      if (key.startsWith(prefix)) {
        keysToDelete.push(key);
      }
    }

    for (const key of keysToDelete) {
      cache.delete(key);
    }

    logger.debug(
      { target: 'cache', event: 'invalidate-prefix', name, prefix, count: keysToDelete.length },
      `캐시 프리픽스 무효화: ${name}/${prefix}`,
    );
  }

  getStats(name: string): { size: number; max: number } | undefined {
    const cache = this.caches.get(name);
    if (!cache) return undefined;
    return {
      size: cache.size,
      max: cache.max,
    };
  }
}

export const cacheManager = new CacheManager();

export const gradeCache = cacheManager.createCache('grades', {
  max: 1,
  ttl: 1000 * 60 * 60 * 24, // 24시간
});

export const categoryCache = cacheManager.createCache('categories', {
  max: 100,
  ttl: 1000 * 60 * 60 * 24, // 24시간
});

export const sizeCache = cacheManager.createCache('sizes', {
  max: 50,
  ttl: 1000 * 60 * 60 * 24, // 24시간
});

export const productDetailCache = cacheManager.createCache('product-detail', {
  max: 1000,
  ttl: 1000 * 60 * 30, // 30분
});

export const storeDetailCache = cacheManager.createCache('store-detail', {
  max: 500,
  ttl: 1000 * 60 * 15, // 15분
});

export const dashboardCache = cacheManager.createCache('dashboard', {
  max: 500,
  ttl: 1000 * 60 * 5, // 5분
});
