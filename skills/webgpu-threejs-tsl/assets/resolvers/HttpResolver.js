/**
 * HttpResolver - HTTP-based asset resolver with retry logic
 *
 * Resolves asset paths to full URLs and fetches them via HTTP.
 * Includes exponential backoff retry logic and support for multiple response types.
 *
 * @example
 * const resolver = new HttpResolver('http://localhost:8787/packs/core/');
 * const blob = await resolver.resolve('textures/oak_wood/albedo.jpg', 'blob');
 */
class HttpResolver {
  /**
   * @param {string} baseUri - Base URI for all asset requests (must end with /)
   * @param {Object} options - Configuration options
   * @param {number} options.timeout - Request timeout in milliseconds (default: 30000)
   * @param {number} options.retries - Number of retry attempts (default: 3)
   * @param {number} options.retryDelay - Initial retry delay in milliseconds (default: 1000)
   */
  constructor(baseUri, options = {}) {
    if (!baseUri.endsWith('/')) {
      baseUri += '/';
    }

    this.baseUri = baseUri;
    this.timeout = options.timeout || 30000;
    this.retries = options.retries || 3;
    this.retryDelay = options.retryDelay || 1000;
  }

  /**
   * Resolve and fetch an asset
   * @param {string} path - Relative path from baseUri
   * @param {string} responseType - Response type: 'blob', 'arrayBuffer', 'json', 'text'
   * @returns {Promise<Blob|ArrayBuffer|Object|string>}
   */
  async resolve(path, responseType = 'blob') {
    const url = new URL(path, this.baseUri).href;
    return await this._fetchWithRetry(url, responseType);
  }

  /**
   * Fetch with exponential backoff retry logic
   * @private
   */
  async _fetchWithRetry(url, responseType, attempt = 0) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), this.timeout);

      const response = await fetch(url, {
        signal: controller.signal,
        cache: 'default'
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      // Extract data based on response type
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
    } catch (error) {
      // Retry on failure with exponential backoff
      if (attempt < this.retries) {
        const delay = this.retryDelay * Math.pow(2, attempt);
        console.warn(`HttpResolver: Fetch failed for ${url}, retrying in ${delay}ms... (${attempt + 1}/${this.retries})`);

        await new Promise(resolve => setTimeout(resolve, delay));
        return this._fetchWithRetry(url, responseType, attempt + 1);
      }

      // All retries exhausted
      throw new Error(`HttpResolver: Failed to fetch ${url} after ${this.retries} retries: ${error.message}`);
    }
  }

  /**
   * Get the full URL for a relative path
   * @param {string} path - Relative path
   * @returns {string} Full URL
   */
  getUrl(path) {
    return new URL(path, this.baseUri).href;
  }
}

export { HttpResolver };
