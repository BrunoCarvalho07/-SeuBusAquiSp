/**
 * Cache simples em memória com TTL (Time-To-Live).
 * Usado para as rotas de posição e previsão para não sobrecarregar a API da SPTrans.
 */
export class MemoryCache {
  constructor(defaultTtlSeconds = 12) {
    this.defaultTtlMs = defaultTtlSeconds * 1000;
    this.cache = new Map();
  }

  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    if (Date.now() > item.expiresAt) {
      this.cache.delete(key);
      return null;
    }

    return item.data;
  }

  set(key, data, ttlSeconds) {
    const ttlMs = (ttlSeconds !== undefined ? ttlSeconds : this.defaultTtlMs / 1000) * 1000;
    this.cache.set(key, {
      data,
      expiresAt: Date.now() + ttlMs
    });
  }

  clear() {
    this.cache.clear();
  }
}
