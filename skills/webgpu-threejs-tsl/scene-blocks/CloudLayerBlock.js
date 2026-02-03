/**
 * CloudLayerBlock.js - Standalone drifting cloud layers
 *
 * Creates multiple semi-transparent cloud planes that drift horizontally
 * at different speeds for parallax effect.
 */

import * as THREE from 'three';
import { BaseBlock } from './BaseBlock.js';

export class CloudLayerBlock extends BaseBlock {
  static requiredAssets(params) {
    // Expects cloudTexture parameter
    return params.cloudTexture ? [params.cloudTexture] : [];
  }

  async mount({ scene, camera, renderer, assets, params }) {
    // Don't call super.mount() - BaseBlock.mount() throws error
    // Instead, directly set properties and handle assets
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.assets = assets;
    this.params = params;

    // Parameters
    const layerCount = params.layerCount || 3;
    const baseOpacity = params.baseOpacity || 0.4;
    const baseSpeed = params.baseSpeed || 0.02;
    const baseZ = params.baseZ || -2;
    const layerSpacing = params.layerSpacing || 0.5;

    // Get cloud texture if provided
    let cloudTexture = null;
    if (params.cloudTexture && assets[params.cloudTexture]) {
      cloudTexture = assets[params.cloudTexture];
    }

    this.layers = [];

    for (let i = 0; i < layerCount; i++) {
      const layer = this._createCloudLayer(i, layerCount, {
        cloudTexture,
        baseOpacity,
        baseSpeed,
        baseZ,
        layerSpacing
      });

      this.addObject(layer);
      this.layers.push(layer);
    }
  }

  update({ progress, time, viewport, state }) {
    // Animate cloud drift
    this.layers.forEach(layer => {
      const speed = layer.userData.speed;
      const offset = layer.userData.offset;

      // Sinusoidal drift
      const drift = Math.sin(time * speed + offset);
      layer.position.x = drift * 3;

      // Optional: fade based on progress
      if (state && typeof state.cloudOpacity === 'number') {
        layer.material.opacity = state.cloudOpacity * layer.userData.baseOpacity;
      }
    });
  }

  _createCloudLayer(index, totalLayers, config) {
    const { cloudTexture, baseOpacity, baseSpeed, baseZ, layerSpacing } = config;

    // Create material
    const material = new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: baseOpacity * (1 - index / totalLayers * 0.5), // Back layers more transparent
      depthWrite: false,
      side: THREE.DoubleSide
    });

    if (cloudTexture) {
      material.map = cloudTexture;
      material.alphaMap = cloudTexture; // Use same texture for alpha
    } else {
      // Fallback: white color
      material.color = new THREE.Color(0xffffff);
    }

    // Create geometry
    const width = 10;
    const height = 6;
    const geometry = new THREE.PlaneGeometry(width, height);

    const mesh = new THREE.Mesh(geometry, material);

    // Position in depth
    mesh.position.z = baseZ - index * layerSpacing;

    // Store animation parameters
    mesh.userData = {
      speed: baseSpeed * (1 + index * 0.3), // Faster for closer layers
      offset: index * Math.PI / 2, // Phase offset
      baseOpacity: material.opacity
    };

    this.trackDisposable(geometry);
    this.trackDisposable(material);

    return mesh;
  }
}

export default CloudLayerBlock;
