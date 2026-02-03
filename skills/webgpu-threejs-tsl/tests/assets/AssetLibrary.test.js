/**
 * AssetLibrary Tests
 *
 * Tests for the core AssetLibrary singleton and catalog management
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

describe('AssetLibrary', () => {
  let AssetLibrary;

  beforeEach(async () => {
    // Dynamic import to ensure fresh instance for each test
    const module = await import('../../assets/AssetLibrary.js');
    AssetLibrary = module.default;

    // Clear singleton instance
    if (AssetLibrary._instance) {
      AssetLibrary._instance = null;
    }
  });

  afterEach(() => {
    // Cleanup
    if (AssetLibrary._instance) {
      AssetLibrary._instance.dispose();
      AssetLibrary._instance = null;
    }
  });

  describe('Singleton Pattern', () => {
    it('should return the same instance on multiple calls', () => {
      const instance1 = AssetLibrary.getInstance();
      const instance2 = AssetLibrary.getInstance();

      expect(instance1).toBe(instance2);
    });

    it('should create instance only once', () => {
      const spy = vi.spyOn(AssetLibrary, 'getInstance');

      const instance1 = AssetLibrary.getInstance();
      const instance2 = AssetLibrary.getInstance();
      const instance3 = AssetLibrary.getInstance();

      expect(spy).toHaveBeenCalledTimes(3);
      expect(instance1).toBe(instance2);
      expect(instance2).toBe(instance3);
    });
  });

  describe('Initialization', () => {
    it('should initialize without catalogs', async () => {
      const library = AssetLibrary.getInstance();
      await library.initialize();

      expect(library._initialized).toBe(true);
    });

    it('should initialize with catalog URLs', async () => {
      const library = AssetLibrary.getInstance();
      const catalogUrl = 'http://localhost:8787/test.catalog.json';

      // Mock fetch to return a valid catalog
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            version: '1.0.0',
            id: 'test',
            assets: []
          })
        })
      );

      await library.initialize({
        catalogs: [catalogUrl]
      });

      expect(library._initialized).toBe(true);
    });

    it('should throw error on double initialization', async () => {
      const library = AssetLibrary.getInstance();
      await library.initialize();

      await expect(library.initialize()).rejects.toThrow('Already initialized');
    });
  });

  describe('Pack Registration', () => {
    it('should register a pack with baseUri', () => {
      const library = AssetLibrary.getInstance();

      library.setPackBaseUri('test-pack', 'http://localhost:8787/packs/test/');

      expect(library._packBaseUris.get('test-pack')).toBe('http://localhost:8787/packs/test/');
    });

    it('should throw error for invalid packId', () => {
      const library = AssetLibrary.getInstance();

      expect(() => {
        library.setPackBaseUri('', 'http://localhost/');
      }).toThrow('Pack ID is required');
    });

    it('should throw error for invalid baseUri', () => {
      const library = AssetLibrary.getInstance();

      expect(() => {
        library.setPackBaseUri('test', '');
      }).toThrow('Base URI is required');
    });
  });

  describe('Asset Indexing', () => {
    beforeEach(() => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            version: '1.0.0',
            id: 'test',
            assets: [
              {
                id: 'test/asset-1',
                type: 'image',
                label: 'Test Asset 1',
                files: { image: 'test.jpg' },
                tags: ['test', 'image']
              },
              {
                id: 'test/asset-2',
                type: 'model',
                label: 'Test Asset 2',
                files: { glb: 'test.glb' },
                tags: ['test', 'model']
              }
            ]
          })
        })
      );
    });

    it('should index assets from catalog', async () => {
      const library = AssetLibrary.getInstance();

      await library.registerCatalog(
        'http://localhost/test.catalog.json',
        { packId: 'test', baseUri: 'http://localhost/' }
      );

      const asset1 = library.get('test/asset-1');
      const asset2 = library.get('test/asset-2');

      expect(asset1).toBeDefined();
      expect(asset1.id).toBe('test/asset-1');
      expect(asset2).toBeDefined();
      expect(asset2.id).toBe('test/asset-2');
    });

    it('should create O(1) lookup map', async () => {
      const library = AssetLibrary.getInstance();

      await library.registerCatalog(
        'http://localhost/test.catalog.json',
        { packId: 'test', baseUri: 'http://localhost/' }
      );

      // Access should be instant (Map lookup)
      const startTime = performance.now();
      const asset = library.get('test/asset-1');
      const endTime = performance.now();

      expect(endTime - startTime).toBeLessThan(1); // < 1ms
      expect(asset).toBeDefined();
    });
  });

  describe('Asset Querying', () => {
    beforeEach(async () => {
      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({
            version: '1.0.0',
            id: 'test',
            assets: [
              {
                id: 'test/wood-texture',
                type: 'pbr-texture-set',
                label: 'Oak Wood',
                files: {},
                tags: ['pbr', 'wood', 'natural']
              },
              {
                id: 'test/metal-texture',
                type: 'pbr-texture-set',
                label: 'Brushed Metal',
                files: {},
                tags: ['pbr', 'metal', 'industrial']
              },
              {
                id: 'test/studio-env',
                type: 'environment',
                label: 'Studio Lighting',
                files: {},
                tags: ['env', 'studio', 'indoor']
              }
            ]
          })
        })
      );

      const library = AssetLibrary.getInstance();
      await library.registerCatalog(
        'http://localhost/test.catalog.json',
        { packId: 'test', baseUri: 'http://localhost/' }
      );
    });

    it('should filter assets by type', () => {
      const library = AssetLibrary.getInstance();
      const textures = library.query({ type: 'pbr-texture-set' });

      expect(textures).toHaveLength(2);
      expect(textures[0].type).toBe('pbr-texture-set');
      expect(textures[1].type).toBe('pbr-texture-set');
    });

    it('should filter assets by tags', () => {
      const library = AssetLibrary.getInstance();
      const woodAssets = library.query({ tags: ['wood'] });

      expect(woodAssets).toHaveLength(1);
      expect(woodAssets[0].id).toBe('test/wood-texture');
    });

    it('should filter assets by search text', () => {
      const library = AssetLibrary.getInstance();
      const results = library.query({ search: 'metal' });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('test/metal-texture');
    });

    it('should combine multiple filters', () => {
      const library = AssetLibrary.getInstance();
      const results = library.query({
        type: 'pbr-texture-set',
        tags: ['pbr'],
        search: 'wood'
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('test/wood-texture');
    });
  });

  describe('Cache Management', () => {
    it('should track cache statistics', async () => {
      const library = AssetLibrary.getInstance();

      await library.registerCatalog(
        'http://localhost/test.catalog.json',
        { packId: 'test', baseUri: 'http://localhost/' }
      );

      const stats = library.getCacheStats();

      expect(stats).toHaveProperty('totalAssets');
      expect(stats).toHaveProperty('cachedAssets');
      expect(stats).toHaveProperty('cacheHitRate');
    });

    it('should clear cache on demand', async () => {
      const library = AssetLibrary.getInstance();

      await library.registerCatalog(
        'http://localhost/test.catalog.json',
        { packId: 'test', baseUri: 'http://localhost/' }
      );

      library.clearCache();

      const stats = library.getCacheStats();
      expect(stats.cachedAssets).toBe(0);
    });
  });

  describe('Error Handling', () => {
    it('should handle invalid catalog URL', async () => {
      const library = AssetLibrary.getInstance();

      global.fetch = vi.fn(() => Promise.reject(new Error('Network error')));

      await expect(
        library.registerCatalog('http://invalid/catalog.json', {
          packId: 'test',
          baseUri: 'http://invalid/'
        })
      ).rejects.toThrow();
    });

    it('should handle malformed catalog JSON', async () => {
      const library = AssetLibrary.getInstance();

      global.fetch = vi.fn(() =>
        Promise.resolve({
          ok: true,
          json: () => Promise.resolve({ invalid: 'structure' })
        })
      );

      await expect(
        library.registerCatalog('http://localhost/bad.catalog.json', {
          packId: 'test',
          baseUri: 'http://localhost/'
        })
      ).rejects.toThrow();
    });

    it('should return null for non-existent asset', () => {
      const library = AssetLibrary.getInstance();
      const asset = library.get('non-existent/asset');

      expect(asset).toBeNull();
    });
  });

  describe('Disposal', () => {
    it('should dispose all resources', async () => {
      const library = AssetLibrary.getInstance();

      await library.registerCatalog(
        'http://localhost/test.catalog.json',
        { packId: 'test', baseUri: 'http://localhost/' }
      );

      library.dispose();

      expect(library._assetIndex.size).toBe(0);
      expect(library._packs.size).toBe(0);
    });
  });
});
