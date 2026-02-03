/**
 * BaseBlock.js - Abstract base class defining block contract
 *
 * All scene blocks must extend this class and implement:
 * - mount(): Initialize block with scene resources
 * - update(): Update based on scroll progress
 * - dispose(): Clean up resources
 *
 * Optionally implement:
 * - static requiredAssets(): Declare asset dependencies
 */

import * as THREE from 'three';

export class BaseBlock {
  constructor() {
    // Track created objects for disposal
    this.objects = [];
    this.disposables = [];
  }

  /**
   * Static method - declare asset dependencies
   * @param {Object} params - Block parameters from story JSON
   * @returns {string[]} Array of asset IDs or patterns
   */
  static requiredAssets(params) {
    // Override in subclass
    return [];
  }

  /**
   * Initialize block with scene resources
   * @param {Object} context - Mount context
   * @param {THREE.Scene} context.scene - Three.js scene
   * @param {THREE.Camera} context.camera - Three.js camera
   * @param {THREE.WebGLRenderer} context.renderer - Three.js renderer
   * @param {Object} context.assets - Loaded assets (assetId -> asset)
   * @param {Object} context.params - Block parameters from story JSON
   */
  async mount({ scene, camera, renderer, assets, params }) {
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.assets = assets;
    this.params = params;

    // Override in subclass
    throw new Error('BaseBlock.mount() must be implemented by subclass');
  }

  /**
   * Update block based on scroll progress
   * @param {Object} context - Update context
   * @param {number} context.progress - Section progress (0..1)
   * @param {number} context.time - Elapsed time in seconds
   * @param {Object} context.viewport - { width, height }
   * @param {Object} context.state - Timeline state object
   */
  update({ progress, time, viewport, state }) {
    // Override in subclass
  }

  /**
   * Clean up resources
   */
  dispose() {
    // Dispose tracked objects
    this.objects.forEach(obj => {
      if (this.scene && obj.parent === this.scene) {
        this.scene.remove(obj);
      }

      // Dispose geometry
      if (obj.geometry) {
        obj.geometry.dispose();
      }

      // Dispose material(s)
      if (obj.material) {
        if (Array.isArray(obj.material)) {
          obj.material.forEach(mat => this._disposeMaterial(mat));
        } else {
          this._disposeMaterial(obj.material);
        }
      }
    });

    // Dispose tracked resources
    this.disposables.forEach(resource => {
      if (resource && typeof resource.dispose === 'function') {
        resource.dispose();
      }
    });

    this.objects = [];
    this.disposables = [];
  }

  // Helper methods

  /**
   * Add object to scene and track for disposal
   * @param {THREE.Object3D} obj - Object to add
   * @returns {THREE.Object3D} The added object
   */
  addObject(obj) {
    this.scene.add(obj);
    this.objects.push(obj);
    return obj;
  }

  /**
   * Track a disposable resource
   * @param {*} resource - Resource with dispose() method
   */
  trackDisposable(resource) {
    this.disposables.push(resource);
  }

  /**
   * Get asset by key from mount context
   * @param {string} key - Asset key from params
   * @returns {*} Asset or null
   */
  getAsset(key) {
    const assetId = this.params[key];
    if (!assetId) return null;
    return this.assets[assetId] || null;
  }

  /**
   * Create a simple quad mesh
   * @param {number} width - Quad width
   * @param {number} height - Quad height
   * @param {THREE.Material} material - Material
   * @returns {THREE.Mesh}
   */
  createQuad(width, height, material) {
    const geometry = new THREE.PlaneGeometry(width, height);
    const mesh = new THREE.Mesh(geometry, material);
    this.trackDisposable(geometry);
    return mesh;
  }

  /**
   * Create a sprite
   * @param {THREE.Texture} texture - Texture
   * @param {number} scale - Scale multiplier
   * @returns {THREE.Sprite}
   */
  createSprite(texture, scale = 1) {
    const material = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(material);
    sprite.scale.multiplyScalar(scale);
    this.trackDisposable(material);
    return sprite;
  }

  /**
   * Lerp between two values
   * @param {number} a - Start value
   * @param {number} b - End value
   * @param {number} t - Interpolation factor (0..1)
   * @returns {number}
   */
  lerp(a, b, t) {
    return a + (b - a) * t;
  }

  /**
   * Clamp value between min and max
   * @param {number} value - Value to clamp
   * @param {number} min - Minimum
   * @param {number} max - Maximum
   * @returns {number}
   */
  clamp(value, min, max) {
    return Math.min(Math.max(value, min), max);
  }

  // Private methods

  _disposeMaterial(material) {
    if (!material) return;

    // Dispose textures
    ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap', 'alphaMap'].forEach(prop => {
      if (material[prop] && material[prop].dispose) {
        material[prop].dispose();
      }
    });

    material.dispose();
  }
}

export default BaseBlock;
