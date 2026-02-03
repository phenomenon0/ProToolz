/**
 * HeroPaintingBlock.js - Hero section with portrait, halo, clouds, frame
 *
 * Visual Elements:
 * - Portrait Quad: Textured plane with optional depth-map parallax
 * - Glowing Halo: Radial gradient sprite with pulsing animation
 * - Cloud Layers: Multiple drifting alpha-masked planes
 * - Ornate Frame: 3D GLB model with reveal animation
 */

import * as THREE from 'three';
import { BaseBlock } from './BaseBlock.js';

export class HeroPaintingBlock extends BaseBlock {
  static requiredAssets(params) {
    const assets = [];
    if (params.portrait) assets.push(params.portrait);
    if (params.portraitDepth) assets.push(params.portraitDepth);
    if (params.cloudAlpha) assets.push(params.cloudAlpha);
    if (params.frame) assets.push(params.frame);
    if (params.env) assets.push(params.env);
    return assets;
  }

  async mount({ scene, camera, renderer, assets, params }) {
    // Don't call super.mount() - BaseBlock.mount() throws error
    // Instead, directly set properties and handle assets
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.assets = assets;
    this.params = params;

    // Mouse position for parallax
    this.mouse = new THREE.Vector2(0.5, 0.5);
    this._setupMouseTracking();

    // Create elements
    await this._createPortrait();
    await this._createHalo();
    await this._createClouds();
    await this._createFrame();

    // Environment
    if (params.env && assets[params.env]) {
      this.scene.environment = assets[params.env];
    }
  }

  update({ progress, time, viewport, state }) {
    // Update portrait parallax
    if (this.portrait && this.portraitDepthTexture) {
      this._updatePortraitParallax(time);
    }

    // Update halo
    if (this.halo && state) {
      // Opacity from timeline
      if (typeof state.halo === 'number') {
        this.halo.material.opacity = state.halo * 0.6;
      }

      // Pulsing animation
      const pulse = 0.9 + Math.sin(time * 2) * 0.1;
      this.halo.scale.setScalar(2.5 * pulse);

      // Rotation shimmer
      this.halo.material.rotation = time * 0.1;
    }

    // Update clouds
    if (this.cloudLayers) {
      this.cloudLayers.forEach((cloud, i) => {
        const drift = Math.sin(time * (0.2 + i * 0.1) + i * Math.PI / 2);
        cloud.position.x = drift * 2;
      });
    }

    // Update frame
    if (this.frame && state) {
      // Scale from timeline
      if (typeof state.frameScale === 'number') {
        this.frame.scale.setScalar(state.frameScale);
      }

      // Rotation from timeline
      if (typeof state.frameRotation === 'number') {
        this.frame.rotation.z = state.frameRotation;
      }
    }

    // Update camera position from timeline
    if (state && typeof state.cameraZ === 'number') {
      this.camera.position.z = state.cameraZ;
    }
  }

  dispose() {
    // Remove mouse listener
    if (this._mouseMoveHandler) {
      window.removeEventListener('mousemove', this._mouseMoveHandler);
    }

    super.dispose();
  }

  // Private methods

  async _createPortrait() {
    const portraitAsset = this.assets[this.params.portrait];
    if (!portraitAsset) return;

    // Get texture (could be from various asset types)
    let portraitTexture = null;
    if (portraitAsset instanceof THREE.Texture) {
      portraitTexture = portraitAsset;
    } else if (portraitAsset.albedo) {
      // PBR texture set
      portraitTexture = portraitAsset.albedo;
    }

    if (!portraitTexture) {
      console.warn('HeroPaintingBlock: Portrait texture not found');
      return;
    }

    // Get depth map if available
    this.portraitDepthTexture = null;
    const depthAsset = this.assets[this.params.portraitDepth];
    if (depthAsset instanceof THREE.Texture) {
      this.portraitDepthTexture = depthAsset;
    }

    // Create material with parallax shader if depth map available
    let material;
    if (this.portraitDepthTexture) {
      material = this._createParallaxMaterial(portraitTexture, this.portraitDepthTexture);
    } else {
      material = new THREE.MeshBasicMaterial({
        map: portraitTexture
      });
    }

    // Create quad
    const aspect = portraitTexture.image ? portraitTexture.image.width / portraitTexture.image.height : 1;
    const height = 4;
    const width = height * aspect;

    this.portrait = this.createQuad(width, height, material);
    this.portrait.position.z = -1;
    this.addObject(this.portrait);
    this.trackDisposable(material);
  }

  _createParallaxMaterial(texture, depthMap) {
    // Custom shader for 2.5D parallax effect
    const material = new THREE.ShaderMaterial({
      uniforms: {
        uTexture: { value: texture },
        uDepthMap: { value: depthMap },
        uParallaxStrength: { value: 0.05 },
        uMousePos: { value: this.mouse }
      },
      vertexShader: `
        varying vec2 vUv;

        void main() {
          vUv = uv;
          gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        }
      `,
      fragmentShader: `
        uniform sampler2D uTexture;
        uniform sampler2D uDepthMap;
        uniform float uParallaxStrength;
        uniform vec2 uMousePos;

        varying vec2 vUv;

        void main() {
          vec2 uv = vUv;

          // Sample depth
          float depth = texture2D(uDepthMap, vUv).r;

          // Apply parallax offset
          vec2 offset = (uMousePos - 0.5) * depth * uParallaxStrength;
          uv += offset;

          // Sample texture
          vec4 color = texture2D(uTexture, uv);
          gl_FragColor = color;
        }
      `
    });

    return material;
  }

  _updatePortraitParallax(time) {
    if (this.portrait && this.portrait.material.uniforms) {
      // Update mouse uniform
      this.portrait.material.uniforms.uMousePos.value.copy(this.mouse);
    }
  }

  async _createHalo() {
    // Create radial gradient texture
    const canvas = document.createElement('canvas');
    canvas.width = 256;
    canvas.height = 256;
    const ctx = canvas.getContext('2d');

    // Radial gradient
    const gradient = ctx.createRadialGradient(128, 128, 0, 128, 128, 128);
    gradient.addColorStop(0, 'rgba(255, 220, 150, 1)');
    gradient.addColorStop(0.5, 'rgba(255, 200, 100, 0.5)');
    gradient.addColorStop(1, 'rgba(255, 180, 50, 0)');

    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, 256, 256);

    const haloTexture = new THREE.CanvasTexture(canvas);
    this.trackDisposable(haloTexture);

    // Create sprite
    const material = new THREE.SpriteMaterial({
      map: haloTexture,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    this.halo = new THREE.Sprite(material);
    this.halo.scale.setScalar(2.5);
    this.halo.position.z = -1.5;

    this.addObject(this.halo);
    this.trackDisposable(material);
  }

  async _createClouds() {
    const cloudAsset = this.assets[this.params.cloudAlpha];
    if (!cloudAsset) return;

    let cloudTexture = null;
    if (cloudAsset instanceof THREE.Texture) {
      cloudTexture = cloudAsset;
    }

    if (!cloudTexture) return;

    this.cloudLayers = [];
    const layerCount = 3;

    for (let i = 0; i < layerCount; i++) {
      const material = new THREE.MeshBasicMaterial({
        map: cloudTexture,
        transparent: true,
        opacity: 0.3 - i * 0.08,
        depthWrite: false,
        side: THREE.DoubleSide
      });

      const cloud = this.createQuad(8, 5, material);
      cloud.position.z = -2 - i * 0.3;
      cloud.position.y = -1 + i * 0.5;

      this.addObject(cloud);
      this.cloudLayers.push(cloud);
      this.trackDisposable(material);
    }
  }

  async _createFrame() {
    const frameAsset = this.assets[this.params.frame];
    if (!frameAsset) return;

    // Clone the model
    this.frame = frameAsset.clone();
    this.frame.scale.setScalar(0);
    this.frame.position.z = 0;

    this.addObject(this.frame);
  }

  _setupMouseTracking() {
    this._mouseMoveHandler = (event) => {
      this.mouse.x = event.clientX / window.innerWidth;
      this.mouse.y = 1.0 - event.clientY / window.innerHeight;
    };

    window.addEventListener('mousemove', this._mouseMoveHandler);
  }
}

export default HeroPaintingBlock;
