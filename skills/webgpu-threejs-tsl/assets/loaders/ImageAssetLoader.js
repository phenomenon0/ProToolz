/**
 * ImageAssetLoader.js - Load single images (not PBR sets)
 *
 * Features:
 * - Auto-detect color space (sRGB for visual, linear for data)
 * - Support common image formats (JPEG, PNG, WebP)
 * - Proper texture settings for UI/visual content
 */

import * as THREE from 'three';

export class ImageAssetLoader {
  constructor() {
    this.textureLoader = new THREE.TextureLoader();
  }

  /**
   * Load image as texture
   * @param {Object} asset - Asset definition from catalog
   * @param {string} baseUri - Base URI for resolving relative paths
   * @param {Object} options - Loading options
   * @param {string} options.colorSpace - Override color space ('srgb' or 'linear')
   * @returns {Promise<THREE.Texture>}
   */
  async loadImage(asset, baseUri, options = {}) {
    const filePath = asset.files.image || asset.files.main;

    if (!filePath) {
      throw new Error(`Image asset ${asset.id} missing 'image' or 'main' file path`);
    }

    const url = new URL(filePath, baseUri).href;

    return new Promise((resolve, reject) => {
      this.textureLoader.load(
        url,
        (texture) => {
          // Auto-detect or set color space
          const colorSpace = options.colorSpace || this._detectColorSpace(asset);
          texture.colorSpace = colorSpace === 'linear'
            ? THREE.LinearSRGBColorSpace
            : THREE.SRGBColorSpace;

          // Apply defaults from asset
          if (asset.defaults) {
            this._applyDefaults(texture, asset.defaults);
          }

          console.log(`ImageAssetLoader: Loaded ${asset.id} (${colorSpace})`);
          resolve(texture);
        },
        undefined,
        (error) => {
          reject(new Error(`Failed to load image ${asset.id}: ${error.message}`));
        }
      );
    });
  }

  /**
   * Detect appropriate color space for asset
   * @param {Object} asset - Asset definition
   * @returns {string} 'srgb' or 'linear'
   */
  _detectColorSpace(asset) {
    // Check tags for hints
    if (asset.tags) {
      if (asset.tags.includes('linear') || asset.tags.includes('data')) {
        return 'linear';
      }
      if (asset.tags.includes('srgb') || asset.tags.includes('visual')) {
        return 'srgb';
      }
    }

    // Default to sRGB for visual content
    return 'srgb';
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
      texture.minFilter = THREE[defaults.minFilter] || THREE.LinearMipmapLinearFilter;
    }
    if (defaults.magFilter) {
      texture.magFilter = THREE[defaults.magFilter] || THREE.LinearFilter;
    }
    if (typeof defaults.flipY === 'boolean') {
      texture.flipY = defaults.flipY;
    }
  }
}

export default ImageAssetLoader;
