/**
 * EnvironmentAssetLoader - HDR Environment Map Loader
 *
 * Loads HDR environment maps (.hdr files) using RGBELoader and generates
 * PMREM (Prefiltered Mipmap Radiance Environment Map) for realistic reflections.
 *
 * @example
 * const loader = new EnvironmentAssetLoader(resolver, renderer);
 * const env = await loader.loadEnvironment(asset, baseUri, { pmrem: true });
 * scene.environment = env.texture;
 */

import * as THREE from 'three';

class EnvironmentAssetLoader {
  /**
   * @param {HttpResolver|CacheResolver} resolver - Asset resolver
   * @param {THREE.WebGPURenderer} renderer - WebGPU renderer (required for PMREM)
   */
  constructor(resolver, renderer) {
    this.resolver = resolver;
    this.renderer = renderer;
    this.rgbeLoader = null; // Lazy initialization via dynamic import
    this.pmremGenerator = null;
    this.cache = new Map(); // Cache key -> { texture, intensity, exposure }
  }

  /**
   * Ensure RGBELoader is initialized (lazy load via dynamic import)
   * @private
   */
  async _ensureLoaderReady() {
    if (!this.rgbeLoader) {
      const { RGBELoader } = await import('three/addons/loaders/RGBELoader.js');
      this.rgbeLoader = new RGBELoader();
    }
  }

  /**
   * Load an HDR environment map
   * @param {Object} asset - Asset definition from catalog
   * @param {string} baseUri - Base URI for the pack
   * @param {Object} options - Loading options
   * @param {boolean} options.pmrem - Generate PMREM (default: true if renderer available)
   * @param {number} options.intensity - Environment intensity override
   * @param {number} options.exposure - Exposure override
   * @returns {Promise<Object>} { texture, intensity, exposure }
   */
  async loadEnvironment(asset, baseUri, options = {}) {
    // Ensure loader is ready (dynamic import)
    await this._ensureLoaderReady();

    const { files, defaults } = asset;

    if (!files.hdr) {
      throw new Error(`Environment asset ${asset.id} missing HDR file`);
    }

    const cacheKey = baseUri + files.hdr;

    // Return cached environment if available
    if (this.cache.has(cacheKey)) {
      const cached = this.cache.get(cacheKey);
      return {
        texture: cached.texture,
        intensity: options.intensity ?? cached.intensity,
        exposure: options.exposure ?? cached.exposure
      };
    }

    // Fetch HDR data
    const blob = await this.resolver.resolve(files.hdr, 'blob');
    const url = URL.createObjectURL(blob);

    // Load via RGBELoader
    let texture = await new Promise((resolve, reject) => {
      this.rgbeLoader.load(
        url,
        resolve,
        undefined, // onProgress
        reject
      );
    });

    URL.revokeObjectURL(url);

    // Configure texture
    texture.mapping = THREE.EquirectangularReflectionMapping;

    // Generate PMREM if requested and renderer is available
    const shouldPMREM = options.pmrem !== false && (defaults?.pmrem !== false);

    if (shouldPMREM && this.renderer) {
      if (!this.pmremGenerator) {
        this.pmremGenerator = new THREE.PMREMGenerator(this.renderer);
        this.pmremGenerator.compileEquirectangularShader();
      }

      const pmremTexture = this.pmremGenerator.fromEquirectangular(texture).texture;
      texture.dispose(); // Dispose original, keep PMREM
      texture = pmremTexture;
    } else if (shouldPMREM && !this.renderer) {
      console.warn(`EnvironmentAssetLoader: PMREM requested but no renderer available for ${asset.id}`);
    }

    // Prepare result with defaults
    const result = {
      texture,
      intensity: options.intensity ?? defaults?.intensity ?? 1.0,
      exposure: options.exposure ?? defaults?.exposure ?? 0.0
    };

    // Cache and return
    this.cache.set(cacheKey, result);
    return result;
  }

  /**
   * Apply environment to scene
   * @param {THREE.Scene} scene - Three.js scene
   * @param {Object} env - Environment object from loadEnvironment()
   * @param {Object} options - Application options
   * @param {boolean} options.background - Set as scene background (default: false)
   */
  applyToScene(scene, env, options = {}) {
    scene.environment = env.texture;

    if (options.background) {
      scene.background = env.texture;
    }

    // Apply intensity via environment intensity property
    if (scene.environmentIntensity !== undefined) {
      scene.environmentIntensity = env.intensity;
    }

    // Note: Exposure is typically controlled by renderer.toneMappingExposure
    // This is left to user control for maximum flexibility
  }

  /**
   * Clear cache and dispose GPU resources
   */
  dispose() {
    this.cache.forEach(({ texture }) => texture.dispose());
    this.cache.clear();

    if (this.pmremGenerator) {
      this.pmremGenerator.dispose();
      this.pmremGenerator = null;
    }
  }

  /**
   * Get cache statistics
   * @returns {Object} { size, entries }
   */
  getStats() {
    return {
      entries: this.cache.size,
      keys: Array.from(this.cache.keys())
    };
  }
}

export { EnvironmentAssetLoader };
