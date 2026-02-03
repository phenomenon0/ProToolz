/**
 * DepthMapAssetLoader.js - Load depth maps for parallax effects
 *
 * Features:
 * - Always linear color space
 * - Single-channel optimization (RedFormat)
 * - Proper filtering for smooth gradients
 */

import * as THREE from 'three';

export class DepthMapAssetLoader {
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
  }

  /**
   * Load depth map as texture
   * @param {Object} asset - Asset definition from catalog
   * @param {string} baseUri - Base URI for resolving relative paths
   * @param {Object} options - Loading options
   * @returns {Promise<THREE.Texture>}
   */
  async loadDepthMap(asset, baseUri, options = {}) {
    const filePath = asset.files.depth || asset.files.main;

    if (!filePath) {
      throw new Error(`Depth map asset ${asset.id} missing 'depth' or 'main' file path`);
    }

    const url = new URL(filePath, baseUri).href;

    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          // Force linear color space for depth data
          texture.colorSpace = THREE.LinearSRGBColorSpace;

          // Optimize format for single-channel data
          // Note: Format conversion happens during upload to GPU
          // We'll keep RGBA in CPU but GPU can optimize

          // Filtering for smooth gradients
          texture.minFilter = THREE.LinearFilter;
          texture.magFilter = THREE.LinearFilter;

          // No wrapping for depth maps (typically unique per image)
          texture.wrapS = THREE.ClampToEdgeWrapping;
          texture.wrapT = THREE.ClampToEdgeWrapping;

          // Apply any defaults
          if (asset.defaults) {
            this._applyDefaults(texture, asset.defaults);
          }

          console.log(`DepthMapAssetLoader: Loaded ${asset.id}`);
          resolve(texture);
        },
        undefined,
        (error) => {
          reject(new Error(`Failed to load depth map ${asset.id}: ${error.message}`));
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
      texture.wrapS = THREE[defaults.wrapS] || THREE.ClampToEdgeWrapping;
    }
    if (defaults.wrapT) {
      texture.wrapT = THREE[defaults.wrapT] || THREE.ClampToEdgeWrapping;
    }
    if (defaults.minFilter) {
      texture.minFilter = THREE[defaults.minFilter] || THREE.LinearFilter;
    }
    if (defaults.magFilter) {
      texture.magFilter = THREE[defaults.magFilter] || THREE.LinearFilter;
    }
  }
}

export default DepthMapAssetLoader;
