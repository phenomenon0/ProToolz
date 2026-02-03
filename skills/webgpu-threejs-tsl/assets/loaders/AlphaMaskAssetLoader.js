/**
 * AlphaMaskAssetLoader.js - Load alpha masks for transparency effects
 *
 * Features:
 * - Always linear color space
 * - Alpha-only format optimization
 * - Proper filtering for smooth transitions
 */

import * as THREE from 'three';

export class AlphaMaskAssetLoader {
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
  }

  /**
   * Load alpha mask as texture
   * @param {Object} asset - Asset definition from catalog
   * @param {string} baseUri - Base URI for resolving relative paths
   * @param {Object} options - Loading options
   * @returns {Promise<THREE.Texture>}
   */
  async loadAlphaMask(asset, baseUri, options = {}) {
    const filePath = asset.files.alpha || asset.files.main;

    if (!filePath) {
      throw new Error(`Alpha mask asset ${asset.id} missing 'alpha' or 'main' file path`);
    }

    const url = new URL(filePath, baseUri).href;

    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          // Force linear color space for alpha data
          texture.colorSpace = THREE.LinearSRGBColorSpace;

          // Filtering for smooth alpha transitions
          texture.minFilter = THREE.LinearMipmapLinearFilter;
          texture.magFilter = THREE.LinearFilter;

          // Wrapping depends on use case
          texture.wrapS = THREE.RepeatWrapping;
          texture.wrapT = THREE.RepeatWrapping;

          // Apply any defaults
          if (asset.defaults) {
            this._applyDefaults(texture, asset.defaults);
          }

          console.log(`AlphaMaskAssetLoader: Loaded ${asset.id}`);
          resolve(texture);
        },
        undefined,
        (error) => {
          reject(new Error(`Failed to load alpha mask ${asset.id}: ${error.message}`));
        }
      );
    });
  }

  /**
   * Apply default texture settings
   * @param {THREE.Texture} texture
   * @param {Object} defaults
   */
  _applyDefaults(texture, defaults) {
    if (defaults.wrapS) {
      texture.wrapS = THREE[defaults.wrapS] || THREE.RepeatWrapping;
    }
    if (defaults.wrapT) {
      texture.wrapT = THREE[defaults.wrapT] || THREE.RepeatWrapping;
    }
    if (defaults.minFilter) {
      texture.minFilter = THREE[defaults.minFilter] || THREE.LinearMipmapLinearFilter;
    }
    if (defaults.magFilter) {
      texture.magFilter = THREE[defaults.magFilter] || THREE.LinearFilter;
    }
    if (defaults.repeat && Array.isArray(defaults.repeat)) {
      texture.repeat.set(defaults.repeat[0], defaults.repeat[1]);
    }
  }
}

export default AlphaMaskAssetLoader;
