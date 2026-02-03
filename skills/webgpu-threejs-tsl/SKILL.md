---
name: webgpu-threejs-tsl
description: Expert guide for WebGPU rendering with Three.js r171+ and TSL (Three.js Shading Language). Use when working with WebGPU renderer, node materials, compute shaders, post-processing effects, or custom WGSL integration. Covers TSL node system, GPU compute, shader composition, and modern rendering techniques.
version: 1.0.0
triggers:
  keywords:
    - webgpu
    - tsl
    - three.js shading language
    - node material
    - compute shader
    - wgsl
    - webgpurenderer
    - pbr textures
    - asset pack
    - asset catalog
    - hdr environment
    - hdri
    - gltf model
    - glb model
    - material library
    - lazy load assets
  patterns:
    - intent: "working with webgpu"
    - intent: "creating custom shaders with tsl"
    - intent: "gpu compute particles"
    - intent: "post processing effects"
    - intent: "load pbr textures"
    - intent: "apply pbr materials"
    - intent: "switch hdr environments"
    - intent: "load glb model"
    - intent: "asset browser"
    - intent: "lazy load assets"
---

# WebGPU + Three.js + TSL Expert Guide

This skill provides comprehensive guidance for modern WebGPU rendering with Three.js r171+ and TSL (Three.js Shading Language).

## Quick Navigation

- **[REFERENCE.md](reference://webgpu-threejs-tsl/REFERENCE.md)** - Quick reference cheatsheet
- **Documentation:**
  - [Core Concepts](doc://webgpu-threejs-tsl/docs/core-concepts.md) - Types, operators, uniforms, control flow
  - [Materials](doc://webgpu-threejs-tsl/docs/materials.md) - Node materials and properties
  - [Compute Shaders](doc://webgpu-threejs-tsl/docs/compute-shaders.md) - GPU compute documentation
  - [Post Processing](doc://webgpu-threejs-tsl/docs/post-processing.md) - Built-in and custom effects
  - [WGSL Integration](doc://webgpu-threejs-tsl/docs/wgsl-integration.md) - Custom WGSL functions
  - [Asset Library](doc://webgpu-threejs-tsl/docs/asset-library.md) - Catalog-driven asset management
  - [Asset Packs](doc://webgpu-threejs-tsl/docs/asset-packs.md) - Creating and deploying asset packs

## When to Use This Skill

Use this skill when:
- Setting up WebGPU renderer with Three.js
- Creating custom materials with TSL node system
- Writing compute shaders for GPU particles or simulations
- Building post-processing effect pipelines
- Integrating custom WGSL shader code
- Optimizing rendering performance with modern GPU features
- Loading PBR textures, HDR environments, and 3D models
- Managing assets with catalog-driven lazy loading

## Key Features

### TSL (Three.js Shading Language)
- Node-based shader composition in JavaScript
- Type-safe shader graph with intellisense
- Automatic shader generation for WebGPU/WebGL2
- Built-in functions for common operations

### WebGPU Renderer
- Modern GPU API with better performance
- Compute shader support for GPU-driven workflows
- Advanced texture formats and storage buffers
- Asynchronous pipeline compilation

### Node Materials
- Declarative shader construction
- Material property nodes (color, roughness, metalness)
- Custom lighting models
- Shader composition and reuse

### Compute Shaders
- GPU-accelerated computations
- Particle systems and physics
- Procedural generation
- Data processing pipelines

### Asset Library
- Catalog-driven asset management system
- 30-50MB asset packs with lazy HTTP loading
- PBR texture sets, HDR environments, GLB models
- HTTP resolver with Cache Storage API
- Query API for asset discovery
- Proper color space management for PBR workflows

## Examples Included

### Working Demos (No External Assets Required)
1. **demo-procedural.html** ✅ **RECOMMENDED** - Swappable materials and environments demo
2. **demo-webgl.html** - Basic WebGL renderer with interactive controls
3. **basic-setup.js** - Minimal WebGPU project setup (bundled projects only)
4. **custom-material.js** - Custom shader material with TSL
5. **particle-system.js** - GPU compute particle system
6. **post-processing.js** - Effect pipeline with custom passes
7. **earth-shader.js** - Complete Earth shader with atmosphere

### Asset Library Demos (Require Asset Pack on Port 8787)
8. **asset-browser.html** - Interactive asset browser with filtering
9. **pbr-showcase.html** - PBR materials showcase with live controls
10. **index.html** - Materials showcase with texture loading
11. **environments.html** - HDR environment comparison

## Templates

- **webgpu-project.js** - Starter project template
- **compute-shader.js** - Compute shader template
- **asset-project.html** - Asset-enabled project starter

## Best Practices

1. **Use TSL for shader logic** - Avoid raw WGSL unless necessary
2. **Leverage compute shaders** - Offload heavy computations to GPU
3. **Optimize uniforms** - Use uniform buffers for better performance
4. **Cache node materials** - Reuse materials to reduce compilation
5. **Profile with browser tools** - Use Chrome/Edge WebGPU profiling

## CRITICAL WARNINGS

### ⚠️ WebGPU CDN Import Issues
**NEVER use `three/webgpu` imports with CDN-based projects!** The module specifier fails resolution:

```javascript
// ❌ THIS WILL FAIL with CDN:
import WebGPURenderer from 'three/webgpu';

// ❌ THIS ALSO FAILS:
import WebGPURenderer from 'three/addons/renderers/webgpu/WebGPURenderer.js';
```

**Solution:** Use `WebGLRenderer` for CDN-based demos and examples. WebGPU works fine in bundled projects (webpack/vite) but has importmap resolution issues with CDN.

```javascript
// ✅ USE THIS for reliable CDN demos:
import * as THREE from 'three';
const renderer = new THREE.WebGLRenderer({ antialias: true });
```

### 📦 Asset Library Demos
**ALWAYS create procedural demos first!** Don't create demos that require external assets unless you're building the complete asset pack system.

**DO:**
- Create demos with procedural materials (roughness/metalness/color presets)
- Create demos with procedural lighting environments (ambient + directional + rim)
- Make materials and environments **swappable with buttons**
- Show working 3D rendering **without any HTTP asset loading**

**DON'T:**
- Create demos that load from `http://localhost:8787` without asset files
- Create demos stuck on loading screens waiting for assets
- Assume texture files, HDR files, or GLB models exist

### ✅ Correct Demo Pattern
```javascript
// Swappable procedural materials
const MATERIALS = {
  'polished-metal': { roughness: 0.1, metalness: 1.0, color: 0xc0c0c0 },
  'wood': { roughness: 0.8, metalness: 0.0, color: 0x8b4513 }
};

// Swappable lighting environments
const ENVIRONMENTS = {
  'studio': {
    ambient: { color: 0xffffff, intensity: 0.5 },
    directional: { color: 0xffffff, intensity: 1.5, position: [5, 5, 5] }
  }
};

// Apply material
function applyMaterial(presetName) {
  const preset = MATERIALS[presetName];
  material.color.setHex(preset.color);
  material.roughness = preset.roughness;
  material.metalness = preset.metalness;
}
```

## Common Patterns

### Custom Material
```javascript
import { MeshStandardNodeMaterial, color, positionLocal } from 'three/tsl';

const material = new MeshStandardNodeMaterial();
material.colorNode = color(1, 0, 0).mul(positionLocal.y.add(1).div(2));
```

### Compute Shader
```javascript
import { compute, storage, uniform } from 'three/tsl';

const computeShader = compute({
  workgroupSize: [256],
  layout: { positions: storage(new Float32Array(1024)) },
  compute: ({ positions }) => {
    // GPU computation logic
  }
});
```

### Post Processing
```javascript
import { PostProcessing, pass } from 'three/tsl';

const postProcessing = new PostProcessing(renderer);
postProcessing.outputNode = pass(scene, camera)
  .bloom(0.5)
  .saturation(1.2);
```

## Migration from WebGL

- Replace `WebGLRenderer` with `WebGPURenderer`
- Convert `ShaderMaterial` to node-based materials
- Update GLSL shaders to TSL or WGSL
- Use compute shaders instead of transform feedback
- Replace render targets with storage textures where applicable

## Resources

- [Three.js WebGPU Examples](https://threejs.org/examples/?q=webgpu)
- [TSL Documentation](https://github.com/mrdoob/three.js/wiki/Three.js-Shading-Language)
- [WebGPU Specification](https://www.w3.org/TR/webgpu/)
- [WGSL Specification](https://www.w3.org/TR/WGSL/)

---

**Version:** Three.js r171+
**Renderer:** WebGPURenderer
**Shading Language:** TSL (Three.js Shading Language)
