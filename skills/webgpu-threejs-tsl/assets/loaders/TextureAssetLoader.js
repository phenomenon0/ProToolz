/**
 * TextureAssetLoader - PBR Texture Set Loader
 *
 * Loads PBR texture sets (albedo, normal, ORM) with proper color space configuration.
 * Handles caching to prevent duplicate texture uploads to GPU.
 *
 * @example
 * const loader = new TextureAssetLoader(resolver);
 * const textures = await loader.loadPBRSet(asset, baseUri);
 * // Returns: { albedo, normal, orm }
 */

import * as THREE from 'three';

class TextureAssetLoader {
  /**
   * @param {HttpResolver|CacheResolver} resolver - Asset resolver
   */
  constructor(resolver) {
    this.resolver = resolver;
    this.loader = new THREE.TextureLoader();
    this.cache = new Map(); // Cache key -> THREE.Texture
  }

  /**
   * Load a complete PBR texture set
   * @param {Object} asset - Asset definition from catalog
   * @param {string} baseUri - Base URI for the pack
   * @returns {Promise<Object>} { albedo, normal, orm } texture objects
   */
  async loadPBRSet(asset, baseUri) {
    const { files, defaults } = asset;

    if (!files.albedo || !files.normal || !files.orm) {
      throw new Error(`PBR asset ${asset.id} missing required texture files (albedo, normal, orm)`);
    }

    // Load all textures in parallel
    const [albedo, normal, orm] = await Promise.all([
      this.loadTexture(files.albedo, baseUri, THREE.SRGBColorSpace),
      this.loadTexture(files.normal, baseUri, THREE.NoColorSpace),
      this.loadTexture(files.orm, baseUri, THREE.NoColorSpace)
    ]);

    // Apply defaults
    this._applyDefaults({ albedo, normal, orm }, defaults);

    return { albedo, normal, orm };
  }

  /**
   * Load a single texture
   * @param {string} path - Relative path to texture
   * @param {string} baseUri - Base URI for the pack
   * @param {number} colorSpace - THREE.SRGBColorSpace or THREE.NoColorSpace
   * @returns {Promise<THREE.Texture>}
   */
  async loadTexture(path, baseUri, colorSpace) {
    const cacheKey = baseUri + path;

    // Return cached texture if available
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey).clone();
    }

    // Fetch texture data
    const blob = await this.resolver.resolve(path, 'blob');
    const url = URL.createObjectURL(blob);

    // Load via THREE.TextureLoader
    const texture = await new Promise((resolve, reject) => {
      this.loader.load(
        url,
        (texture) => {
          URL.revokeObjectURL(url);
          resolve(texture);
        },
        undefined, // onProgress
        (error) => {
          URL.revokeObjectURL(url);
          reject(error);
        }
      );
    });

    // Configure texture
    texture.colorSpace = colorSpace;
    texture.minFilter = THREE.LinearMipmapLinearFilter;
    texture.magFilter = THREE.LinearFilter;
    texture.generateMipmaps = true;
    texture.wrapS = THREE.RepeatWrapping;
    texture.wrapT = THREE.RepeatWrapping;

    // Cache and return
    this.cache.set(cacheKey, texture);
    return texture.clone();
  }

  /**
   * Apply default properties from catalog to textures
   * @private
   */
  _applyDefaults(textures, defaults) {
    if (!defaults) return;

    // Apply UV scale
    if (defaults.uvScale) {
      const [scaleX, scaleY] = defaults.uvScale;
      Object.values(textures).forEach(texture => {
        texture.repeat.set(scaleX, scaleY);
      });
    }

    // Apply wrapping mode
    if (defaults.wrapS) {
      const wrapMode = this._getWrapMode(defaults.wrapS);
      Object.values(textures).forEach(texture => {
        texture.wrapS = wrapMode;
      });
    }

    if (defaults.wrapT) {
      const wrapMode = this._getWrapMode(defaults.wrapT);
      Object.values(textures).forEach(texture => {
        texture.wrapT = wrapMode;
      });
    }
  }

  /**
   * Convert string wrap mode to THREE constant
   * @private
   */
  _getWrapMode(mode) {
    switch (mode) {
      case 'repeat':
        return THREE.RepeatWrapping;
      case 'clamp':
        return THREE.ClampToEdgeWrapping;
      case 'mirror':
        return THREE.MirroredRepeatWrapping;
      default:
        return THREE.RepeatWrapping;
    }
  }

  /**
   * Clear texture cache and dispose GPU resources
   */
  dispose() {
    this.cache.forEach(texture => texture.dispose());
    this.cache.clear();
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

export { TextureAssetLoader };
