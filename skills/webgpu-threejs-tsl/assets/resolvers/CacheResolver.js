/**
 * CacheResolver - Cache Storage wrapper for HttpResolver
 *
 * Wraps HttpResolver with browser Cache Storage API for persistent caching.
 * Automatically invalidates cache when catalog version changes.
 *
 * @example
 * const httpResolver = new HttpResolver('http://localhost:8787/packs/core/');
 * const resolver = new CacheResolver(httpResolver, 'webgpu-tsl-assets@1.0.0');
 * const blob = await resolver.resolve('textures/oak_wood/albedo.jpg', 'blob');
 */
class CacheResolver {
  /**
   * @param {HttpResolver} httpResolver - Underlying HTTP resolver
   * @param {string} cacheName - Cache Storage name (include version for invalidation)
   */
  constructor(httpResolver, cacheName) {
    this.httpResolver = httpResolver;
    this.cacheName = cacheName;
    this._cacheReady = null;
  }

  /**
   * Resolve and fetch an asset (with caching)
   * @param {string} path - Relative path from baseUri
   * @param {string} responseType - Response type: 'blob', 'arrayBuffer', 'json', 'text'
   * @returns {Promise<Blob|ArrayBuffer|Object|string>}
   */
  async resolve(path, responseType = 'blob') {
    const url = this.httpResolver.getUrl(path);

    try {
      // Check cache first
      const cache = await this._getCache();
      const cachedResponse = await cache.match(url);

      if (cachedResponse) {
        return await this._extractResponse(cachedResponse.clone(), responseType);
      }
    } catch (error) {
      console.warn(`CacheResolver: Cache read failed for ${url}, falling back to HTTP:`, error.message);
    }

    // Cache miss - fetch via HTTP
    const data = await this.httpResolver.resolve(path, responseType);

    // Store in cache for future use
    try {
      await this._cacheResponse(url, data, responseType);
    } catch (error) {
      console.warn(`CacheResolver: Cache write failed for ${url}:`, error.message);
      // Non-fatal - return data anyway
    }

    return data;
  }

  /**
   * Get the cache instance
   * @private
   */
  async _getCache() {
    if (!this._cacheReady) {
      this._cacheReady = caches.open(this.cacheName);
    }
    return this._cacheReady;
  }

  /**
   * Extract data from cached Response based on type
   * @private
   */
  async _extractResponse(response, responseType) {
    switch (responseType) {
      case 'blob':
        return await response.blob();
      case 'arrayBuffer':
        return await response.arrayBuffer();
      case 'json':
        return await response.json();
      case 'text':
        return await response.text();
      default:
        throw new Error(`Unsupported response type: ${responseType}`);
    }
  }

  /**
   * Store Response in cache
   * @private
   */
  async _cacheResponse(url, data, responseType) {
    const cache = await this._getCache();

    // Create Response object based on data type
    let response;

    if (data instanceof Blob) {
      response = new Response(data, {
        headers: { 'Content-Type': data.type || 'application/octet-stream' }
      });
    } else if (data instanceof ArrayBuffer) {
      response = new Response(data, {
        headers: { 'Content-Type': 'application/octet-stream' }
      });
    } else if (typeof data === 'object') {
      response = new Response(JSON.stringify(data), {
        headers: { 'Content-Type': 'application/json' }
      });
    } else if (typeof data === 'string') {
      response = new Response(data, {
        headers: { 'Content-Type': 'text/plain' }
      });
    } else {
      console.warn(`CacheResolver: Cannot cache unsupported data type for ${url}`);
      return;
    }

    await cache.put(url, response);
  }

  /**
   * Invalidate (delete) the entire cache
   * @returns {Promise<boolean>} True if cache was deleted
   */
  async invalidate() {
    this._cacheReady = null;
    return await caches.delete(this.cacheName);
  }

  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache info: { size, keys }
   */
  async getStats() {
    try {
      const cache = await this._getCache();
      const keys = await cache.keys();

      return {
        name: this.cacheName,
        entries: keys.length,
        urls: keys.map(req => req.url)
      };
    } catch (error) {
      return {
        name: this.cacheName,
        entries: 0,
        urls: [],
        error: error.message
      };
    }
  }

  /**
   * Clear old cache versions (cleanup utility)
   * @param {string} prefix - Cache name prefix to match
   * @returns {Promise<string[]>} Array of deleted cache names
   */
  static async clearOldCaches(prefix) {
    const cacheNames = await caches.keys();
    const deleted = [];

    for (const name of cacheNames) {
      if (name.startsWith(prefix) && name !== this.cacheName) {
        const success = await caches.delete(name);
        if (success) {
          deleted.push(name);
        }
      }
    }

    return deleted;
  }
}

export { CacheResolver };
