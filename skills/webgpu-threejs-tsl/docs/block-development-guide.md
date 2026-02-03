# Block Development Guide

Complete guide to creating custom scene blocks for the Story system.

## Table of Contents

- [Overview](#overview)
- [BaseBlock Contract](#baseblock-contract)
- [Creating Custom Blocks](#creating-custom-blocks)
- [Asset Dependency Declaration](#asset-dependency-declaration)
- [Update Loop Best Practices](#update-loop-best-practices)
- [Disposal Patterns](#disposal-patterns)
- [Testing Blocks](#testing-blocks)

## Overview

Blocks are reusable cinematic scene components that respond to scroll progress. Each block:
- Manages its own 3D objects and materials
- Declares required assets
- Updates based on timeline state
- Cleans up resources on disposal

**Block Lifecycle:**
1. **Register**: Add to BlockRegistry
2. **Mount**: Initialize with scene, camera, renderer, assets
3. **Update**: Animate based on scroll progress and timeline state
4. **Dispose**: Clean up all resources

## BaseBlock Contract

All blocks must extend `BaseBlock` and implement these methods:

```javascript
import { BaseBlock } from './BaseBlock.js';

export class CustomBlock extends BaseBlock {
  // Optional: Declare required assets
  static requiredAssets(params) {
    return ['assetId1', 'assetId2'];
  }

  // Required: Initialize block
  async mount({ scene, camera, renderer, assets, params }) {
    await super.mount({ scene, camera, renderer, assets, params });
    // Create your 3D objects here
  }

  // Optional: Update per frame
  update({ progress, time, viewport, state }) {
    // Animate your objects based on scroll progress
  }

  // Inherited: Clean up (calls super.dispose())
  dispose() {
    super.dispose(); // Handles tracked objects automatically
  }
}
```

## Creating Custom Blocks

### Example: Simple Sprite Block

```javascript
import * as THREE from 'three';
import { BaseBlock } from './BaseBlock.js';

export class SimpleSpriteBlock extends BaseBlock {
  static requiredAssets(params) {
    return params.image ? [params.image] : [];
  }

  async mount({ scene, camera, renderer, assets, params }) {
    await super.mount({ scene, camera, renderer, assets, params });

    // Get texture from assets
    const texture = assets[params.image];
    if (!texture) {
      console.warn('SimpleSpriteBlock: No image provided');
      return;
    }

    // Create sprite
    const material = new THREE.SpriteMaterial({ map: texture });
    this.sprite = new THREE.Sprite(material);
    this.sprite.scale.setScalar(params.scale || 2);

    // Add to scene and track for disposal
    this.addObject(this.sprite);
    this.trackDisposable(material);
  }

  update({ progress, time, viewport, state }) {
    if (!this.sprite) return;

    // Apply timeline state
    if (state.opacity !== undefined) {
      this.sprite.material.opacity = state.opacity;
    }

    // Add animation
    this.sprite.rotation.z = time * 0.5;
  }
}
```

### Example: Particle System Block

```javascript
import * as THREE from 'three';
import { BaseBlock } from './BaseBlock.js';

export class ParticleSystemBlock extends BaseBlock {
  async mount({ scene, camera, renderer, assets, params }) {
    await super.mount({ scene, camera, renderer, assets, params });

    const particleCount = params.count || 1000;
    const geometry = new THREE.BufferGeometry();

    // Create positions
    const positions = new Float32Array(particleCount * 3);
    for (let i = 0; i < particleCount * 3; i++) {
      positions[i] = (Math.random() - 0.5) * 10;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

    // Create material
    const material = new THREE.PointsMaterial({
      size: params.size || 0.05,
      color: params.color || 0xffffff,
      transparent: true,
      opacity: 0.8
    });

    // Create points
    this.particles = new THREE.Points(geometry, material);
    this.addObject(this.particles);
    this.trackDisposable(geometry);
    this.trackDisposable(material);
  }

  update({ progress, time, viewport, state }) {
    if (!this.particles) return;

    // Rotate particles
    this.particles.rotation.y = time * 0.1;

    // Apply state
    if (state.particleOpacity !== undefined) {
      this.particles.material.opacity = state.particleOpacity;
    }
  }
}
```

## Asset Dependency Declaration

The static `requiredAssets()` method tells the story system what assets to load:

```javascript
static requiredAssets(params) {
  const assets = [];

  // Conditional assets based on params
  if (params.texture) assets.push(params.texture);
  if (params.model) assets.push(params.model);
  if (params.environment) assets.push(params.environment);

  // Multiple assets
  if (params.layers) {
    params.layers.forEach(layer => {
      if (layer.image) assets.push(layer.image);
    });
  }

  return assets;
}
```

## Update Loop Best Practices

### 1. Check Object Existence

```javascript
update({ progress, time, viewport, state }) {
  if (!this.mesh) return; // Guard against uninitialized objects

  // Your update logic
}
```

### 2. Use State from Timeline

```javascript
update({ progress, time, viewport, state }) {
  // Apply timeline-controlled properties
  if (state.opacity !== undefined) {
    this.material.opacity = state.opacity;
  }

  if (state.scale !== undefined) {
    this.mesh.scale.setScalar(state.scale);
  }

  // Raw progress for custom logic
  const customValue = this.lerp(0, 100, progress);
}
```

### 3. Performance Optimization

```javascript
update({ progress, time, viewport, state }) {
  // Throttle expensive operations
  if (!this.lastUpdate || time - this.lastUpdate > 0.1) {
    this.performExpensiveOperation();
    this.lastUpdate = time;
  }

  // Use object pooling for frequently created objects
  // Reuse geometries and materials
  // Avoid creating new objects in update loop
}
```

### 4. Viewport-Responsive Updates

```javascript
update({ progress, time, viewport, state }) {
  // Adjust to viewport size
  const aspect = viewport.width / viewport.height;
  this.camera.aspect = aspect;

  // Scale based on viewport
  const scale = Math.min(viewport.width, viewport.height) / 1000;
  this.mesh.scale.setScalar(scale);
}
```

## Disposal Patterns

### Automatic Disposal

`BaseBlock` tracks objects added via `addObject()` and resources via `trackDisposable()`:

```javascript
async mount({ scene, camera, renderer, assets, params }) {
  const geometry = new THREE.BoxGeometry();
  const material = new THREE.MeshStandardMaterial();
  const mesh = new THREE.Mesh(geometry, material);

  this.addObject(mesh); // Automatically removed and disposed
  this.trackDisposable(geometry); // Automatically disposed
  this.trackDisposable(material); // Automatically disposed
}
```

### Manual Disposal

For resources not automatically tracked:

```javascript
dispose() {
  // Custom cleanup
  if (this.customResource) {
    this.customResource.dispose();
  }

  // Call parent disposal
  super.dispose();
}
```

### Texture Disposal

Textures in materials are automatically disposed if tracked:

```javascript
const material = new THREE.MeshBasicMaterial({ map: texture });
this.trackDisposable(material); // Disposes material AND its textures
```

### Event Listeners

Always clean up event listeners:

```javascript
mount({ scene, camera, renderer, assets, params }) {
  this._mouseHandler = (e) => this.handleMouse(e);
  window.addEventListener('mousemove', this._mouseHandler);
}

dispose() {
  window.removeEventListener('mousemove', this._mouseHandler);
  super.dispose();
}
```

## Testing Blocks

### Standalone Test

Create a minimal HTML file to test your block:

```html
<!DOCTYPE html>
<html>
<head>
  <title>Block Test</title>
</head>
<body>
  <canvas id="canvas"></canvas>

  <script type="importmap">
    { "imports": { "three": "https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.module.js" } }
  </script>

  <script type="module">
    import * as THREE from 'three';
    import { CustomBlock } from './CustomBlock.js';

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    const renderer = new THREE.WebGLRenderer({ canvas: document.getElementById('canvas') });
    renderer.setSize(window.innerWidth, window.innerHeight);

    // Create block
    const block = new CustomBlock();
    await block.mount({
      scene,
      camera,
      renderer,
      assets: { /* mock assets */ },
      params: { /* test params */ }
    });

    // Animate
    let progress = 0;
    function animate(time) {
      progress = (Math.sin(time * 0.001) + 1) / 2; // Oscillate 0-1

      block.update({
        progress,
        time: time * 0.001,
        viewport: { width: window.innerWidth, height: window.innerHeight },
        state: { opacity: progress } // Mock timeline state
      });

      renderer.render(scene, camera);
      requestAnimationFrame(animate);
    }
    animate(0);
  </script>
</body>
</html>
```

### Integration Test

Test within a minimal story:

```json
{
  "version": "1.0.0",
  "sections": [
    {
      "id": "test",
      "block": "CustomBlock",
      "assets": {},
      "params": { "testParam": true },
      "timeline": [
        { "t": 0.0, "opacity": 0.0 },
        { "t": 1.0, "opacity": 1.0 }
      ]
    }
  ]
}
```

### Unit Testing

```javascript
import { CustomBlock } from './CustomBlock.js';
import * as THREE from 'three';

describe('CustomBlock', () => {
  let block, scene, camera, renderer;

  beforeEach(() => {
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera();
    renderer = new THREE.WebGLRenderer();
    block = new CustomBlock();
  });

  afterEach(() => {
    block.dispose();
    renderer.dispose();
  });

  test('mounts successfully', async () => {
    await block.mount({ scene, camera, renderer, assets: {}, params: {} });
    expect(block.objects.length).toBeGreaterThan(0);
  });

  test('updates without errors', () => {
    block.update({ progress: 0.5, time: 1, viewport: {}, state: {} });
  });

  test('disposes cleanly', () => {
    block.dispose();
    expect(block.objects.length).toBe(0);
  });
});
```

## Registration

Register your block for use in stories:

```javascript
import { BlockRegistry } from '../scene-blocks/BlockRegistry.js';
import { CustomBlock } from './CustomBlock.js';

BlockRegistry.register('CustomBlock', CustomBlock);
```

## Best Practices

1. **Keep Blocks Focused**: One block = one visual concept
2. **Minimize Objects**: Fewer objects = better performance
3. **Reuse Geometries**: Share geometries between instances
4. **Track Everything**: Use `addObject()` and `trackDisposable()`
5. **Validate Params**: Check params in mount, provide defaults
6. **Document Timeline Properties**: List supported state properties
7. **Test Disposal**: Ensure no memory leaks
8. **Profile Performance**: Measure impact of update loop

## Common Patterns

### Fade In/Out

```javascript
update({ progress, time, viewport, state }) {
  const opacity = state.opacity !== undefined
    ? state.opacity
    : progress;

  this.material.opacity = opacity;
}
```

### Scale Animation

```javascript
update({ progress, time, viewport, state }) {
  const scale = state.scale !== undefined
    ? state.scale
    : this.lerp(0.5, 1.5, progress);

  this.mesh.scale.setScalar(scale);
}
```

### Position Interpolation

```javascript
update({ progress, time, viewport, state }) {
  const startPos = new THREE.Vector3(-5, 0, 0);
  const endPos = new THREE.Vector3(5, 0, 0);

  this.mesh.position.lerpVectors(startPos, endPos, progress);
}
```

## Next Steps

- [Story Authoring Guide](./story-authoring-guide.md) - Use blocks in stories
- [Materials Guide](./materials.md) - Advanced material techniques
- [Post-Processing Guide](./post-processing.md) - Effects and filters
