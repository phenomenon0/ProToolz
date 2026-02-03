/**
 * HttpResolver Tests
 *
 * Tests for HTTP fetching with exponential backoff retry logic
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import HttpResolver from '../../assets/resolvers/HttpResolver.js';

describe('HttpResolver', () => {
  let resolver;

  beforeEach(() => {
    resolver = new HttpResolver({
      timeout: 5000,
      retries: 3,
      retryDelay: 100
    });

    // Clear any existing timers
    vi.clearAllTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Construction', () => {
    it('should create resolver with default config', () => {
      const defaultResolver = new HttpResolver();

      expect(defaultResolver.timeout).toBe(30000);
      expect(defaultResolver.retries).toBe(3);
      expect(defaultResolver.retryDelay).toBe(1000);
    });

    it('should create resolver with custom config', () => {
      const customResolver = new HttpResolver({
        timeout: 10000,
        retries: 5,
        retryDelay: 500
      });

      expect(customResolver.timeout).toBe(10000);
      expect(customResolver.retries).toBe(5);
      expect(customResolver.retryDelay).toBe(500);
    });
  });

  describe('URL Resolution', () => {
    it('should resolve absolute URLs as-is', () => {
      const url = resolver.getUrl('http://example.com/asset.jpg');
      expect(url).toBe('http://example.com/asset.jpg');
    });

    it('should resolve relative URLs with base URI', () => {
      resolver.baseUri = 'http://example.com/assets/';
      const url = resolver.getUrl('textures/wood.jpg');

      expect(url).toBe('http://example.com/assets/textures/wood.jpg');
    });

    it('should handle trailing slashes correctly', () => {
      resolver.baseUri = 'http://example.com/assets/';
      const url = resolver.getUrl('/textures/wood.jpg');

      expect(url).toBe('http://example.com/assets/textures/wood.jpg');
    });
  });

  describe('Successful Fetching', () => {
    it('should fetch JSON successfully', async () => {
      const mockData = { test: 'data' };

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve(mockData)
        })
      );

      const result = await resolver.resolve('http://example.com/data.json', 'json');

      expect(result).toEqual(mockData);
      expect(global.fetch).toHaveBeenCalledTimes(1);
    });

    it('should fetch text successfully', async () => {
      const mockText = 'Hello, World!';

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          text: () => Promise.resolve(mockText)
        })
      );

      const result = await resolver.resolve('http://example.com/file.txt', 'text');

      expect(result).toBe(mockText);
    });

    it('should fetch blob successfully', async () => {
      const mockBlob = new Blob(['test'], { type: 'image/jpeg' });

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          blob: () => Promise.resolve(mockBlob)
        })
      );

      const result = await resolver.resolve('http://example.com/image.jpg', 'blob');

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('image/jpeg');
    });

    it('should fetch arrayBuffer successfully', async () => {
      const mockBuffer = new ArrayBuffer(8);

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          arrayBuffer: () => Promise.resolve(mockBuffer)
        })
      );

      const result = await resolver.resolve('http://example.com/data.bin', 'arrayBuffer');

      expect(result).toBeInstanceOf(ArrayBuffer);
      expect(result.byteLength).toBe(8);
    });
  });

  describe('Retry Logic', () => {
    it('should retry on network failure', async () => {
      let attempts = 0;

      global.fetch = vi.fn(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });

      const result = await resolver.resolve('http://example.com/data.json', 'json');

      expect(result).toEqual({ success: true });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });

    it('should use exponential backoff', async () => {
      vi.useFakeTimers();

      let attempts = 0;
      const delays = [];

      global.fetch = vi.fn(() => {
        attempts++;
        if (attempts < 4) {
          return Promise.reject(new Error('Network error'));
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ success: true })
        });
      });

      const promise = resolver.resolve('http://example.com/data.json', 'json');

      // Fast-forward through delays
      await vi.runAllTimersAsync();

      const result = await promise;

      expect(result).toEqual({ success: true });
      expect(attempts).toBe(4);

      vi.useRealTimers();
    });

    it('should fail after max retries', async () => {
      global.fetch = vi.fn(() =>
        Promise.reject(new Error('Persistent network error'))
      );

      await expect(
        resolver.resolve('http://example.com/data.json', 'json')
      ).rejects.toThrow('Persistent network error');

      expect(global.fetch).toHaveBeenCalledTimes(4); // Initial + 3 retries
    });

    it('should not retry on 404 errors', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: false,
          status: 404,
          statusText: 'Not Found'
        })
      );

      await expect(
        resolver.resolve('http://example.com/missing.json', 'json')
      ).rejects.toThrow('HTTP 404: Not Found');

      expect(global.fetch).toHaveBeenCalledTimes(1); // No retries for 404
    });

    it('should retry on 500 errors', async () => {
      let attempts = 0;

      global.fetch = vi.fn(() => {
        attempts++;
        if (attempts < 3) {
          return Promise.resolve({
            ok: false,
            status: 500,
            statusText: 'Internal Server Error'
          });
        }
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ recovered: true })
        });
      });

      const result = await resolver.resolve('http://example.com/data.json', 'json');

      expect(result).toEqual({ recovered: true });
      expect(global.fetch).toHaveBeenCalledTimes(3);
    });
  });

  describe('Timeout Handling', () => {
    it('should timeout long requests', async () => {
      vi.useFakeTimers();

      global.fetch = vi.fn(() =>
        new Promise((resolve) => {
          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ data: 'late' })
            });
          }, 10000); // 10 seconds
        })
      );

      const promise = resolver.resolve('http://example.com/slow.json', 'json');

      // Fast-forward past timeout
      vi.advanceTimersByTime(5001);

      await expect(promise).rejects.toThrow();

      vi.useRealTimers();
    });
  });

  describe('Response Type Handling', () => {
    it('should throw error for unsupported response type', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true
        })
      );

      await expect(
        resolver.resolve('http://example.com/file', 'unsupported')
      ).rejects.toThrow('Unsupported response type');
    });

    it('should handle missing response method', async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          // Missing json() method
        })
      );

      await expect(
        resolver.resolve('http://example.com/data.json', 'json')
      ).rejects.toThrow();
    });
  });

  describe('AbortController Integration', () => {
    it('should support request cancellation', async () => {
      const abortController = new AbortController();

      global.fetch = vi.fn((url, options) => {
        // Simulate long request
        return new Promise((resolve, reject) => {
          options.signal.addEventListener('abort', () => {
            reject(new Error('Request aborted'));
          });

          setTimeout(() => {
            resolve({
              ok: true,
              json: () => Promise.resolve({ data: 'response' })
            });
          }, 5000);
        });
      });

      const promise = resolver.resolve(
        'http://example.com/data.json',
        'json',
        { signal: abortController.signal }
      );

      // Abort immediately
      abortController.abort();

      await expect(promise).rejects.toThrow('Request aborted');
    });
  });
});
