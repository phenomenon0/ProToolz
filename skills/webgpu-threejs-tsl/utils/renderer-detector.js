/**
 * WebGPU Renderer Detector
 *
 * Automatically detects WebGPU support and falls back to WebGL if unavailable.
 * Provides unified interface for creating renderers with proper feature detection.
 *
 * @module renderer-detector
 * @version 1.0.0
 * @license CC0
 */

import * as THREE from 'three';

/**
 * Renderer detection result
 * @typedef {Object} RendererResult
 * @property {THREE.WebGPURenderer|THREE.WebGLRenderer} renderer - The initialized renderer
 * @property {string} type - Renderer type ('webgpu' | 'webgl')
 * @property {Object} capabilities - Renderer capabilities
 * @property {Function} createMaterial - Factory function for creating compatible materials
 */

/**
 * Renderer capabilities
 * @typedef {Object} RendererCapabilities
 * @property {boolean} supportsWebGPU - Whether WebGPU is supported
 * @property {boolean} supportsTSL - Whether TSL (Three.js Shading Language) is available
 * @property {boolean} supportsCompute - Whether compute shaders are supported
 * @property {number} maxTextureSize - Maximum texture size
 * @property {string} adapterInfo - GPU adapter information
 */

/**
 * Renderer options
 * @typedef {Object} RendererOptions
 * @property {HTMLCanvasElement} canvas - Canvas element
 * @property {boolean} [antialias=true] - Enable antialiasing
 * @property {string} [powerPreference='high-performance'] - Power preference
 * @property {boolean} [alpha=false] - Enable alpha channel
 * @property {number} [pixelRatio] - Device pixel ratio (defaults to window.devicePixelRatio)
 */

/**
 * Detects WebGPU support and returns adapter information
 * @returns {Promise<{supported: boolean, adapter: GPUAdapter|null, info: string}>}
 */
async function detectWebGPU() {
  if (!navigator.gpu) {
    return {
      supported: false,
      adapter: null,
      info: 'WebGPU API not available'
    };
  }

  try {
    const adapter = await navigator.gpu.requestAdapter({
      powerPreference: 'high-performance'
    });

    if (!adapter) {
      return {
        supported: false,
        adapter: null,
        info: 'No WebGPU adapter available'
      };
    }

    // Get adapter info
    const info = adapter.info || {};
    const adapterInfo = `${info.vendor || 'Unknown'} ${info.device || 'GPU'}`;

    return {
      supported: true,
      adapter,
      info: adapterInfo
    };
  } catch (error) {
    return {
      supported: false,
      adapter: null,
      info: `WebGPU error: ${error.message}`
    };
  }
}

/**
 * Creates a WebGPU renderer
 * @param {RendererOptions} options - Renderer options
 * @returns {Promise<RendererResult>}
 */
async function createWebGPURenderer(options) {
  const { WebGPURenderer, MeshStandardNodeMaterial } = await import('three/webgpu');
  const TSL = await import('three/tsl');

  const renderer = new WebGPURenderer({
    canvas: options.canvas,
    antialias: options.antialias ?? true,
    powerPreference: options.powerPreference ?? 'high-performance',
    alpha: options.alpha ?? false
  });

  renderer.setPixelRatio(options.pixelRatio ?? Math.min(window.devicePixelRatio, 2));

  // Get capabilities
  const detection = await detectWebGPU();
  const capabilities = {
    supportsWebGPU: true,
    supportsTSL: true,
    supportsCompute: true,
    maxTextureSize: 8192, // WebGPU default
    adapterInfo: detection.info
  };

  // Material factory for WebGPU
  const createMaterial = (config = {}) => {
    const {
      color = 0xffffff,
      roughness = 0.5,
      metalness = 0.5,
      colorNode = null,
      ...otherProps
    } = config;

    const material = new MeshStandardNodeMaterial({
      roughness,
      metalness,
      ...otherProps
    });

    // If colorNode provided, use it; otherwise use color
    if (colorNode) {
      material.colorNode = colorNode;
    } else {
      material.color = new THREE.Color(color);
    }

    return material;
  };

  return {
    renderer,
    type: 'webgpu',
    capabilities,
    createMaterial,
    TSL
  };
}

/**
 * Creates a WebGL renderer (fallback)
 * @param {RendererOptions} options - Renderer options
 * @returns {RendererResult}
 */
function createWebGLRenderer(options) {
  const renderer = new THREE.WebGLRenderer({
    canvas: options.canvas,
    antialias: options.antialias ?? true,
    powerPreference: options.powerPreference ?? 'high-performance',
    alpha: options.alpha ?? false
  });

  renderer.setPixelRatio(options.pixelRatio ?? Math.min(window.devicePixelRatio, 2));

  // Get capabilities
  const gl = renderer.getContext();
  const capabilities = {
    supportsWebGPU: false,
    supportsTSL: false,
    supportsCompute: false,
    maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
    adapterInfo: gl.getParameter(gl.RENDERER)
  };

  // Material factory for WebGL
  const createMaterial = (config = {}) => {
    const {
      color = 0xffffff,
      roughness = 0.5,
      metalness = 0.5,
      ...otherProps
    } = config;

    return new THREE.MeshStandardMaterial({
      color,
      roughness,
      metalness,
      ...otherProps
    });
  };

  return {
    renderer,
    type: 'webgl',
    capabilities,
    createMaterial,
    TSL: null
  };
}

/**
 * Automatically detects and creates the best available renderer
 *
 * @param {RendererOptions} options - Renderer configuration
 * @returns {Promise<RendererResult>}
 *
 * @example
 * // Basic usage
 * const { renderer, type, capabilities } = await createRenderer({
 *   canvas: document.getElementById('canvas')
 * });
 *
 * console.log(`Using ${type} renderer`);
 *
 * @example
 * // With custom options
 * const { renderer, createMaterial, TSL } = await createRenderer({
 *   canvas: document.getElementById('canvas'),
 *   antialias: true,
 *   powerPreference: 'high-performance',
 *   pixelRatio: 2
 * });
 *
 * // Create material using factory
 * const material = createMaterial({
 *   color: 0x4488ff,
 *   roughness: 0.3,
 *   metalness: 0.7
 * });
 */
export async function createRenderer(options) {
  if (!options.canvas) {
    throw new Error('Canvas element is required');
  }

  // Try WebGPU first
  const detection = await detectWebGPU();

  if (detection.supported) {
    try {
      const result = await createWebGPURenderer(options);
      console.log(`✓ WebGPU renderer created (${detection.info})`);
      return result;
    } catch (error) {
      console.warn('WebGPU renderer creation failed, falling back to WebGL:', error);
    }
  }

  // Fallback to WebGL
  const result = createWebGLRenderer(options);
  console.log(`⚠ WebGL renderer created (${result.capabilities.adapterInfo})`);
  return result;
}

/**
 * Checks if WebGPU is supported without creating a renderer
 *
 * @returns {Promise<boolean>}
 *
 * @example
 * if (await isWebGPUSupported()) {
 *   console.log('WebGPU is available!');
 * }
 */
export async function isWebGPUSupported() {
  const detection = await detectWebGPU();
  return detection.supported;
}

/**
 * Gets detailed WebGPU adapter information
 *
 * @returns {Promise<Object>}
 *
 * @example
 * const info = await getWebGPUInfo();
 * console.log('GPU:', info.device);
 * console.log('Vendor:', info.vendor);
 * console.log('Limits:', info.limits);
 */
export async function getWebGPUInfo() {
  const detection = await detectWebGPU();

  if (!detection.supported || !detection.adapter) {
    return {
      supported: false,
      reason: detection.info
    };
  }

  const adapter = detection.adapter;
  const info = adapter.info || {};
  const features = Array.from(adapter.features || []);
  const limits = adapter.limits || {};

  return {
    supported: true,
    vendor: info.vendor || 'Unknown',
    device: info.device || 'Unknown GPU',
    description: info.description || '',
    architecture: info.architecture || 'Unknown',
    features,
    limits: {
      maxTextureDimension2D: limits.maxTextureDimension2D,
      maxBindGroups: limits.maxBindGroups,
      maxBufferSize: limits.maxBufferSize,
      maxComputeWorkgroupsPerDimension: limits.maxComputeWorkgroupsPerDimension
    }
  };
}

/**
 * Creates a renderer with explicit type selection
 *
 * @param {'webgpu'|'webgl'} type - Renderer type
 * @param {RendererOptions} options - Renderer options
 * @returns {Promise<RendererResult>}
 *
 * @example
 * // Force WebGL even if WebGPU is available
 * const { renderer } = await createRendererExplicit('webgl', {
 *   canvas: document.getElementById('canvas')
 * });
 */
export async function createRendererExplicit(type, options) {
  if (type === 'webgpu') {
    const detection = await detectWebGPU();
    if (!detection.supported) {
      throw new Error(`WebGPU requested but not supported: ${detection.info}`);
    }
    return createWebGPURenderer(options);
  } else if (type === 'webgl') {
    return createWebGLRenderer(options);
  } else {
    throw new Error(`Invalid renderer type: ${type}`);
  }
}

// Default export
export default {
  createRenderer,
  createRendererExplicit,
  isWebGPUSupported,
  getWebGPUInfo
};
