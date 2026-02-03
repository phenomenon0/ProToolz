/**
 * ModelAssetLoader - GLB/GLTF Model Loader
 *
 * Loads 3D models in GLB format with optional Draco compression support.
 * Handles caching and model cloning for reuse.
 *
 * @example
 * const loader = new ModelAssetLoader(resolver);
 * const model = await loader.loadModel(asset, baseUri);
 * scene.add(model);
 */

import * as THREE from 'three';

class ModelAssetLoader {
  /**
   * @param {HttpResolver|CacheResolver} resolver - Asset resolver
   * @param {Object} options - Loader options
   * @param {string} options.dracoDecoderPath - Path to Draco decoder (default: CDN)
   */
  constructor(resolver, options = {}) {
    this.resolver = resolver;
    this.gltfLoader = null; // Lazy initialization via dynamic import
    this.dracoDecoderPath = options.dracoDecoderPath; // Store for lazy init
    this.cache = new Map(); // Cache key -> GLTF object
  }

  /**
   * Ensure GLTFLoader and DRACOLoader are initialized (lazy load via dynamic import)
   * @private
   */
  async _ensureLoaderReady() {
    if (!this.gltfLoader) {
      const { GLTFLoader } = await import('three/addons/loaders/GLTFLoader.js');
      const { DRACOLoader } = await import('three/addons/loaders/DRACOLoader.js');

      this.gltfLoader = new GLTFLoader();

      // Setup Draco decoder
      const dracoLoader = new DRACOLoader();
      const dracoPath = this.dracoDecoderPath || 'https://www.gstatic.com/draco/versioned/decoders/1.5.7/';
      dracoLoader.setDecoderPath(dracoPath);
      this.gltfLoader.setDRACOLoader(dracoLoader);
    }
  }

  /**
   * Load a 3D model
   * @param {Object} asset - Asset definition from catalog
   * @param {string} baseUri - Base URI for the pack
   * @returns {Promise<THREE.Group>} Cloned scene from GLTF
   */
  async loadModel(asset, baseUri) {
    // Ensure loader is ready (dynamic import)
    await this._ensureLoaderReady();

    const { files, defaults } = asset;

    if (!files.glb) {
      throw new Error(`Model asset ${asset.id} missing GLB file`);
    }

    const cacheKey = baseUri + files.glb;

    // Return cloned model if cached
    if (this.cache.has(cacheKey)) {
      const gltf = this.cache.get(cacheKey);
      return this._cloneGLTF(gltf, defaults);
    }

    // Fetch model data
    const arrayBuffer = await this.resolver.resolve(files.glb, 'arrayBuffer');

    // Parse via GLTFLoader
    const gltf = await new Promise((resolve, reject) => {
      this.gltfLoader.parse(
        arrayBuffer,
        '', // resourcePath
        resolve,
        reject
      );
    });

    // Cache the original GLTF
    this.cache.set(cacheKey, gltf);

    // Return cloned scene with defaults applied
    return this._cloneGLTF(gltf, defaults);
  }

  /**
   * Clone GLTF scene and apply defaults
   * @private
   */
  _cloneGLTF(gltf, defaults) {
    const scene = gltf.scene.clone(true);

    // Apply defaults
    if (defaults) {
      if (defaults.scale !== undefined) {
        scene.scale.setScalar(defaults.scale);
      }

      if (defaults.position) {
        scene.position.fromArray(defaults.position);
      }

      if (defaults.rotation) {
        scene.rotation.fromArray(defaults.rotation);
      }
    }

    return scene;
  }

  /**
   * Get model bounding box
   * @param {THREE.Group} model - Model from loadModel()
   * @returns {THREE.Box3}
   */
  getBoundingBox(model) {
    const box = new THREE.Box3();
    box.setFromObject(model);
    return box;
  }

  /**
   * Center model at origin
   * @param {THREE.Group} model - Model from loadModel()
   */
  centerModel(model) {
    const box = this.getBoundingBox(model);
    const center = box.getCenter(new THREE.Vector3());
    model.position.sub(center);
  }

  /**
   * Scale model to fit within unit cube
   * @param {THREE.Group} model - Model from loadModel()
   * @param {number} targetSize - Target size (default: 1.0)
   */
  normalizeScale(model, targetSize = 1.0) {
    const box = this.getBoundingBox(model);
    const size = box.getSize(new THREE.Vector3());
    const maxDim = Math.max(size.x, size.y, size.z);
    const scale = targetSize / maxDim;
    model.scale.multiplyScalar(scale);
  }

  /**
   * Clear cache and dispose GPU resources
   */
  dispose() {
    this.cache.forEach(gltf => {
      gltf.scene.traverse(node => {
        if (node.geometry) {
          node.geometry.dispose();
        }
        if (node.material) {
          if (Array.isArray(node.material)) {
            node.material.forEach(mat => mat.dispose());
          } else {
            node.material.dispose();
          }
        }
      });
    });

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

export { ModelAssetLoader };
