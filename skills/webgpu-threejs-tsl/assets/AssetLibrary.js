/**
 * AssetLibrary - Catalog-Driven Asset Management System
 *
 * Centralized asset loading and management for WebGPU-Three.js-TSL projects.
 * Supports PBR textures, HDR environments, 3D models, and shader snippets
 * with lazy loading and HTTP-based asset packs.
 *
 * @example
 * // Initialize with pack configuration
 * const assets = AssetLibrary.getInstance({
 *   packs: { core: 'http://localhost:8787/packs/core/' }
 * });
 *
 * // Register catalog
 * await assets.registerCatalogFromUrl(
 *   'http://localhost:8787/packs/core/catalogs/core.catalog.json',
 *   { packId: 'core', baseUri: 'http://localhost:8787/packs/core/' }
 * );
 *
 * // Load assets
 * const material = await assets.createPBRMaterial('pbr/oak-wood');
 * const envMap = await assets.getEnvironment('env/studio-neutral');
 * const model = await assets.getModel('model/suzanne');
 */

import { HttpResolver } from './resolvers/HttpResolver.js';
import { CacheResolver } from './resolvers/CacheResolver.js';
import { TextureAssetLoader } from './loaders/TextureAssetLoader.js';
import { EnvironmentAssetLoader } from './loaders/EnvironmentAssetLoader.js';
import { ModelAssetLoader } from './loaders/ModelAssetLoader.js';
import { ImageAssetLoader } from './loaders/ImageAssetLoader.js';
import { DepthMapAssetLoader } from './loaders/DepthMapAssetLoader.js';
import { AlphaMaskAssetLoader } from './loaders/AlphaMaskAssetLoader.js';

class AssetLibrary {
  /**
   * Get singleton instance
   * @param {Object} config - Configuration options
   * @param {Object} config.packs - Map of packId -> baseUri
   * @param {boolean} config.enableCache - Enable Cache Storage (default: true)
   * @param {string} config.cacheVersion - Cache version for invalidation (default: '1.0.0')
   * @returns {AssetLibrary}
   */
  static getInstance(config = {}) {
    if (!AssetLibrary.instance) {
      AssetLibrary.instance = new AssetLibrary(config);
    }
    return AssetLibrary.instance;
  }

  constructor(config) {
    this.catalogs = new Map();          // catalogId → catalog JSON
    this.packBaseUris = new Map();      // packId → baseUri
    this.assetIndex = new Map();        // assetId → {catalogId, asset, packId}
    this.renderer = null;

    // Loaders (created on-demand per pack)
    this.loaders = new Map();           // packId → {texture, env, model}

    // Config
    this.enableCache = config.enableCache ?? true;
    this.cacheVersion = config.cacheVersion ?? '1.0.0';

    // Register pack bases from config
    if (config.packs) {
      Object.entries(config.packs).forEach(([packId, baseUri]) => {
        this.setPackBaseUri(packId, baseUri);
      });
    }
  }

  /**
   * Initialize with renderer (required for PMREM generation)
   * @param {THREE.WebGPURenderer} renderer
   */
  initialize(renderer) {
    this.renderer = renderer;
  }

  /**
   * Register catalog from URL
   * @param {string} url - URL to catalog JSON file
   * @param {Object} options - Registration options
   * @param {string} options.packId - Pack identifier
   * @param {string} options.baseUri - Base URI for pack assets
   */
  async registerCatalogFromUrl(url, options = {}) {
    const response = await fetch(url);

    if (!response.ok) {
      throw new Error(`Failed to fetch catalog from ${url}: ${response.status} ${response.statusText}`);
    }

    const catalog = await response.json();
    this.registerCatalog(catalog, options);
  }

  /**
   * Register catalog from JSON object
   * @param {Object} catalog - Catalog JSON
   * @param {Object} options - Registration options
   * @param {string} options.packId - Pack identifier
   * @param {string} options.baseUri - Base URI for pack assets
   */
  registerCatalog(catalog, options = {}) {
    const { packId, baseUri } = options;
    const catalogId = catalog.id;

    // Store catalog
    this.catalogs.set(catalogId, catalog);

    // Store pack base URI if provided
    if (packId && baseUri) {
      this.setPackBaseUri(packId, baseUri);
    }

    // Index all assets
    catalog.assets.forEach(asset => {
      this.assetIndex.set(asset.id, {
        catalogId,
        asset,
        packId: packId || catalogId
      });
    });

    console.log(`AssetLibrary: Registered catalog '${catalogId}' with ${catalog.assets.length} assets`);
  }

  /**
   * Set pack base URI
   * @param {string} packId - Pack identifier
   * @param {string} baseUri - Base URI (must end with /)
   */
  setPackBaseUri(packId, baseUri) {
    if (!baseUri.endsWith('/')) {
      baseUri += '/';
    }
    this.packBaseUris.set(packId, baseUri);
  }

  /**
   * Get asset metadata
   * @param {string} id - Asset ID
   * @returns {Object} Asset entry with {catalogId, asset, packId}
   */
  get(id) {
    const entry = this.assetIndex.get(id);
    if (!entry) {
      throw new Error(`Asset not found: ${id}`);
    }
    return entry;
  }

  /**
   * Query assets by filters
   * @param {Object} filters - Query filters
   * @param {string} filters.type - Asset type filter
   * @param {string[]} filters.tags - Required tags filter
   * @param {string} filters.text - Text search in label/tags
   * @returns {Array} Array of matching assets
   */
  query({ type, tags, text } = {}) {
    const results = [];

    for (const [id, entry] of this.assetIndex) {
      const { asset } = entry;

      // Type filter
      if (type && asset.type !== type) continue;

      // Tags filter (all tags must match)
      if (tags && !tags.every(tag => asset.tags?.includes(tag))) continue;

      // Text search (label, tags)
      if (text) {
        const searchStr = `${asset.label} ${asset.tags?.join(' ') || ''}`.toLowerCase();
        if (!searchStr.includes(text.toLowerCase())) continue;
      }

      results.push({ id, ...entry });
    }

    return results;
  }

  /**
   * Create resolver for pack
   * @private
   */
  _createResolver(packId) {
    const baseUri = this.packBaseUris.get(packId);
    if (!baseUri) {
      throw new Error(`Pack base URI not set for: ${packId}`);
    }

    const httpResolver = new HttpResolver(baseUri);

    if (this.enableCache) {
      const cacheName = `webgpu-threejs-tsl-assets@${this.cacheVersion}`;
      return new CacheResolver(httpResolver, cacheName);
    }

    return httpResolver;
  }

  /**
   * Get or create loaders for pack
   * @private
   */
  _getLoaders(packId) {
    if (!this.loaders.has(packId)) {
      const resolver = this._createResolver(packId);

      this.loaders.set(packId, {
        texture: new TextureAssetLoader(resolver),
        env: new EnvironmentAssetLoader(resolver, this.renderer),
        model: new ModelAssetLoader(resolver),
        image: new ImageAssetLoader(),
        depthMap: new DepthMapAssetLoader(),
        alphaMask: new AlphaMaskAssetLoader()
      });
    }

    return this.loaders.get(packId);
  }

  // ===== HIGH-LEVEL API =====

  /**
   * Load PBR texture set
   * @param {string} id - Asset ID
   * @returns {Promise<Object>} { albedo, normal, orm }
   */
  async loadPBRTextures(id) {
    const { asset, packId } = this.get(id);

    if (asset.type !== 'pbr-texture-set') {
      throw new Error(`Asset ${id} is not a PBR texture set (type: ${asset.type})`);
    }

    const loaders = this._getLoaders(packId);
    const baseUri = this.packBaseUris.get(packId);

    return await loaders.texture.loadPBRSet(asset, baseUri);
  }

  /**
   * Load environment map
   * @param {string} id - Asset ID
   * @param {Object} options - Loading options
   * @param {boolean} options.pmrem - Generate PMREM (default: from catalog)
   * @param {number} options.intensity - Override intensity
   * @param {number} options.exposure - Override exposure
   * @returns {Promise<Object>} { texture, intensity, exposure }
   */
  async loadEnvironment(id, options = {}) {
    const { asset, packId } = this.get(id);

    if (asset.type !== 'environment') {
      throw new Error(`Asset ${id} is not an environment (type: ${asset.type})`);
    }

    const loaders = this._getLoaders(packId);
    const baseUri = this.packBaseUris.get(packId);

    return await loaders.env.loadEnvironment(asset, baseUri, options);
  }

  /**
   * Load 3D model
   * @param {string} id - Asset ID
   * @returns {Promise<THREE.Group>}
   */
  async loadModel(id) {
    const { asset, packId } = this.get(id);

    if (asset.type !== 'model') {
      throw new Error(`Asset ${id} is not a model (type: ${asset.type})`);
    }

    const loaders = this._getLoaders(packId);
    const baseUri = this.packBaseUris.get(packId);

    return await loaders.model.loadModel(asset, baseUri);
  }

  // ===== CONVENIENCE API =====

  /**
   * Create PBR material from asset
   * @param {string} id - Asset ID
   * @param {Object} customProps - Custom material properties
   * @returns {Promise<THREE.MeshStandardNodeMaterial>}
   */
  async createPBRMaterial(id, customProps = {}) {
    const { MeshStandardNodeMaterial } = await import('three/tsl');
    const textures = await this.loadPBRTextures(id);
    const { asset } = this.get(id);

    const material = new MeshStandardNodeMaterial(customProps);

    // Apply textures
    material.map = textures.albedo;
    material.normalMap = textures.normal;

    // ORM texture: R = AO, G = Roughness, B = Metalness
    material.aoMap = textures.orm;
    material.roughnessMap = textures.orm;
    material.metalnessMap = textures.orm;

    // Apply defaults from catalog
    if (asset.defaults) {
      if (asset.defaults.roughness !== undefined) {
        material.roughness = asset.defaults.roughness;
      }
      if (asset.defaults.metalness !== undefined) {
        material.metalness = asset.defaults.metalness;
      }
    }

    return material;
  }

  /**
   * Get environment texture (convenience)
   * @param {string} id - Asset ID
   * @param {Object} options - Loading options
   * @returns {Promise<THREE.Texture>}
   */
  async getEnvironment(id, options = {}) {
    const env = await this.loadEnvironment(id, options);
    return env.texture;
  }

  /**
   * Get model (convenience)
   * @param {string} id - Asset ID
   * @returns {Promise<THREE.Group>}
   */
  async getModel(id) {
    return await this.loadModel(id);
  }

  /**
   * Load image texture
   * @param {string} id - Asset ID
   * @param {Object} options - Loading options
   * @returns {Promise<THREE.Texture>}
   */
  async loadImage(id, options = {}) {
    const { asset, packId } = this.get(id);

    if (asset.type !== 'image') {
      throw new Error(`Asset ${id} is not an image (type: ${asset.type})`);
    }

    const loaders = this._getLoaders(packId);
    const baseUri = this.packBaseUris.get(packId);

    return await loaders.image.loadImage(asset, baseUri, options);
  }

  /**
   * Load depth map texture
   * @param {string} id - Asset ID
   * @param {Object} options - Loading options
   * @returns {Promise<THREE.Texture>}
   */
  async loadDepthMap(id, options = {}) {
    const { asset, packId } = this.get(id);

    if (asset.type !== 'depth-map') {
      throw new Error(`Asset ${id} is not a depth map (type: ${asset.type})`);
    }

    const loaders = this._getLoaders(packId);
    const baseUri = this.packBaseUris.get(packId);

    return await loaders.depthMap.loadDepthMap(asset, baseUri, options);
  }

  /**
   * Load alpha mask texture
   * @param {string} id - Asset ID
   * @param {Object} options - Loading options
   * @returns {Promise<THREE.Texture>}
   */
  async loadAlphaMask(id, options = {}) {
    const { asset, packId } = this.get(id);

    if (asset.type !== 'alpha-mask') {
      throw new Error(`Asset ${id} is not an alpha mask (type: ${asset.type})`);
    }

    const loaders = this._getLoaders(packId);
    const baseUri = this.packBaseUris.get(packId);

    return await loaders.alphaMask.loadAlphaMask(asset, baseUri, options);
  }

  /**
   * Generic asset loader - routes to specific loader based on asset type
   * @param {string} id - Asset ID from catalog
   * @param {Object} options - Loading options
   * @returns {Promise<any>} Loaded asset
   */
  async loadAsset(id, options = {}) {
    const { asset } = this.get(id);

    switch (asset.type) {
      case 'image':
        return await this.loadImage(id, options);
      case 'model':
        return await this.loadModel(id, options);
      case 'environment':
        return await this.loadEnvironment(id, options);
      case 'pbr-texture-set':
        return await this.loadPBRTextures(id);
      case 'depth-map':
        return await this.loadDepthMap(id, options);
      case 'alpha-mask':
        return await this.loadAlphaMask(id, options);
      default:
        throw new Error(`Unknown asset type: ${asset.type} for asset ${id}`);
    }
  }

  /**
   * Get image (convenience)
   * @param {string} id - Asset ID
   * @param {Object} options - Loading options
   * @returns {Promise<THREE.Texture>}
   */
  async getImage(id, options = {}) {
    return await this.loadImage(id, options);
  }

  /**
   * Get depth map (convenience)
   * @param {string} id - Asset ID
   * @returns {Promise<THREE.Texture>}
   */
  async getDepthMap(id) {
    return await this.loadDepthMap(id);
  }

  /**
   * Get alpha mask (convenience)
   * @param {string} id - Asset ID
   * @returns {Promise<THREE.Texture>}
   */
  async getAlphaMask(id) {
    return await this.loadAlphaMask(id);
  }

  // ===== CACHE MANAGEMENT =====

  /**
   * Clear all caches (HTTP Cache Storage + loader caches)
   */
  async clearCache() {
    // Clear HTTP Cache Storage
    if (this.enableCache) {
      const cacheName = `webgpu-threejs-tsl-assets@${this.cacheVersion}`;
      await caches.delete(cacheName);
    }

    // Clear loader caches
    this.loaders.forEach(({ texture, env, model }) => {
      texture.cache.clear();
      env.cache.clear();
      model.cache.clear();
    });

    console.log('AssetLibrary: All caches cleared');
  }

  /**
   * Get cache statistics
   * @returns {Object} Cache stats for all loaders
   */
  getCacheStats() {
    const stats = {
      packs: {}
    };

    this.loaders.forEach(({ texture, env, model }, packId) => {
      stats.packs[packId] = {
        textures: texture.getStats(),
        environments: env.getStats(),
        models: model.getStats()
      };
    });

    return stats;
  }

  /**
   * Dispose all resources
   */
  dispose() {
    this.loaders.forEach(({ texture, env, model }) => {
      texture.dispose();
      env.dispose();
      model.dispose();
    });

    this.loaders.clear();
    this.catalogs.clear();
    this.assetIndex.clear();

    console.log('AssetLibrary: Disposed');
  }
}

export { AssetLibrary };
