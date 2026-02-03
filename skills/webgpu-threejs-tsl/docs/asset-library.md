# Asset Library

Complete guide to the catalog-driven asset management system for WebGPU-Three.js-TSL projects.

## Overview

The Asset Library provides a unified system for loading and managing PBR textures, HDR environments, 3D models, and shader snippets. Assets are stored in external **asset packs** (30-50MB directories) and loaded on-demand via HTTP with automatic caching.

### Key Features

- **Catalog-Driven**: Assets defined in JSON catalogs, not embedded in code
- **Lazy Loading**: Assets loaded on-demand via HTTP fetch
- **Persistent Caching**: Browser Cache Storage API for offline support
- **Type-Safe**: Proper color space management for PBR workflows
- **Extensible**: Add new packs without code changes
- **Query API**: Search assets by type, tags, or text

### Architecture

```
Asset Library (Singleton)
├── Catalog Registry (JSON metadata)
├── Pack Base URIs (HTTP endpoints)
├── Resolvers (HTTP + Cache)
└── Loaders (Texture, Environment, Model)
    └── Three.js Loaders (TextureLoader, RGBELoader, GLTFLoader)
```

## Quick Start

### 1. Setup Local HTTP Server

Assets must be served via HTTP (not `file://` protocol):

```bash
# Option 1: Python
cd ~/.claude/asset-packs
python -m http.server 8787

# Option 2: Node.js
npm install -g http-server
cd ~/.claude/asset-packs
http-server -p 8787 --cors
```

### 2. Initialize AssetLibrary

```javascript
import { AssetLibrary } from './assets/AssetLibrary.js';

const assets = AssetLibrary.getInstance({
  packs: {
    core: 'http://localhost:8787/webgpu-threejs-tsl/packs/core/'
  },
  enableCache: true,
  cacheVersion: '1.0.0'
});

// Initialize with renderer (required for PMREM)
assets.initialize(renderer);
```

### 3. Register Catalog

```javascript
await assets.registerCatalogFromUrl(
  'http://localhost:8787/webgpu-threejs-tsl/packs/core/catalogs/core.catalog.json',
  {
    packId: 'core',
    baseUri: 'http://localhost:8787/webgpu-threejs-tsl/packs/core/'
  }
);
```

### 4. Load Assets

```javascript
// Load PBR material
const material = await assets.createPBRMaterial('pbr/oak-wood');
mesh.material = material;

// Load HDR environment
const envMap = await assets.getEnvironment('env/studio-neutral', { pmrem: true });
scene.environment = envMap;
scene.background = envMap;

// Load 3D model
const model = await assets.getModel('model/suzanne');
scene.add(model);
```

## API Reference

### AssetLibrary.getInstance(config)

Get singleton instance of AssetLibrary.

**Parameters:**
- `config.packs` (Object): Map of packId → baseUri
- `config.enableCache` (Boolean): Enable Cache Storage (default: `true`)
- `config.cacheVersion` (String): Cache version for invalidation (default: `'1.0.0'`)

**Returns:** `AssetLibrary` instance

```javascript
const assets = AssetLibrary.getInstance({
  packs: {
    core: 'http://localhost:8787/packs/core/',
    custom: 'https://cdn.example.com/assets/'
  },
  enableCache: true,
  cacheVersion: '1.0.0'
});
```

### initialize(renderer)

Initialize with WebGPU renderer (required for PMREM generation).

**Parameters:**
- `renderer` (THREE.WebGPURenderer): WebGPU renderer instance

```javascript
const renderer = new THREE.WebGPURenderer();
assets.initialize(renderer);
```

### registerCatalogFromUrl(url, options)

Register catalog from URL.

**Parameters:**
- `url` (String): URL to catalog JSON file
- `options.packId` (String): Pack identifier
- `options.baseUri` (String): Base URI for pack assets

```javascript
await assets.registerCatalogFromUrl(
  'http://localhost:8787/packs/core/catalogs/core.catalog.json',
  { packId: 'core', baseUri: 'http://localhost:8787/packs/core/' }
);
```

### registerCatalog(catalog, options)

Register catalog from JSON object.

**Parameters:**
- `catalog` (Object): Catalog JSON object
- `options.packId` (String): Pack identifier
- `options.baseUri` (String): Base URI for pack assets

```javascript
const catalog = await fetch('/catalogs/custom.catalog.json').then(r => r.json());
assets.registerCatalog(catalog, {
  packId: 'custom',
  baseUri: 'http://localhost:8787/packs/custom/'
});
```

### query(filters)

Query assets by filters.

**Parameters:**
- `filters.type` (String): Asset type (`'pbr-texture-set'`, `'environment'`, `'model'`, `'shader'`)
- `filters.tags` (Array): Required tags (all must match)
- `filters.text` (String): Text search in label/tags

**Returns:** Array of matching assets

```javascript
// Find all wood materials
const woodAssets = assets.query({ type: 'pbr-texture-set', tags: ['wood'] });

// Find all outdoor environments
const outdoorEnvs = assets.query({ type: 'environment', tags: ['outdoor'] });

// Search by text
const metalAssets = assets.query({ text: 'metal' });
```

### loadPBRTextures(id)

Load PBR texture set (albedo, normal, ORM).

**Parameters:**
- `id` (String): Asset ID

**Returns:** `Promise<Object>` with `{ albedo, normal, orm }`

```javascript
const textures = await assets.loadPBRTextures('pbr/oak-wood');

material.map = textures.albedo;          // Diffuse/albedo (sRGB)
material.normalMap = textures.normal;    // Normal map (linear)
material.aoMap = textures.orm;           // Ambient occlusion (R channel)
material.roughnessMap = textures.orm;    // Roughness (G channel)
material.metalnessMap = textures.orm;    // Metalness (B channel)
```

### createPBRMaterial(id, customProps)

Create PBR material from asset (convenience method).

**Parameters:**
- `id` (String): Asset ID
- `customProps` (Object): Custom material properties

**Returns:** `Promise<THREE.MeshStandardNodeMaterial>`

```javascript
const material = await assets.createPBRMaterial('pbr/oak-wood', {
  color: 0xffffff,
  roughness: 0.8
});

mesh.material = material;
```

### loadEnvironment(id, options)

Load HDR environment map.

**Parameters:**
- `id` (String): Asset ID
- `options.pmrem` (Boolean): Generate PMREM (default: from catalog)
- `options.intensity` (Number): Environment intensity override
- `options.exposure` (Number): Exposure override

**Returns:** `Promise<Object>` with `{ texture, intensity, exposure }`

```javascript
const env = await assets.loadEnvironment('env/studio-neutral', {
  pmrem: true,
  intensity: 1.2,
  exposure: 0.5
});

scene.environment = env.texture;
renderer.toneMappingExposure = env.exposure;
```

### getEnvironment(id, options)

Get environment texture (convenience method).

**Parameters:**
- `id` (String): Asset ID
- `options` (Object): Same as `loadEnvironment()`

**Returns:** `Promise<THREE.Texture>`

```javascript
const envMap = await assets.getEnvironment('env/outdoor-sunset', { pmrem: true });
scene.environment = envMap;
scene.background = envMap;
```

### loadModel(id)

Load 3D model (GLB format).

**Parameters:**
- `id` (String): Asset ID

**Returns:** `Promise<THREE.Group>`

```javascript
const model = await assets.loadModel('model/suzanne');
model.position.set(0, 0, 0);
scene.add(model);
```

### getModel(id)

Get model (convenience method, alias for `loadModel()`).

**Parameters:**
- `id` (String): Asset ID

**Returns:** `Promise<THREE.Group>`

```javascript
const model = await assets.getModel('model/torus-knot');
scene.add(model);
```

### clearCache()

Clear all caches (HTTP Cache Storage + loader caches).

```javascript
await assets.clearCache();
console.log('All caches cleared');
```

### getCacheStats()

Get cache statistics for all loaders.

**Returns:** Object with cache stats per pack

```javascript
const stats = assets.getCacheStats();
console.log('Texture cache entries:', stats.packs.core.textures.entries);
console.log('Environment cache entries:', stats.packs.core.environments.entries);
console.log('Model cache entries:', stats.packs.core.models.entries);
```

### dispose()

Dispose all resources (textures, environments, models).

```javascript
assets.dispose();
```

## Color Space Management

### Critical: Proper Color Space Configuration

PBR workflows require correct color space configuration:

```javascript
// Albedo textures: sRGB color space
albedoTexture.colorSpace = THREE.SRGBColorSpace;

// Data textures (normal, ORM, roughness, metallic, AO): Linear
normalTexture.colorSpace = THREE.NoColorSpace;
ormTexture.colorSpace = THREE.NoColorSpace;
```

**AssetLibrary automatically configures color spaces based on catalog metadata.**

### ORM Texture Format

ORM = **O**cclusion + **R**oughness + **M**etallic in a single PNG:

- **R channel**: Ambient Occlusion
- **G channel**: Roughness
- **B channel**: Metalness

Three.js can use the same texture for multiple maps:

```javascript
const textures = await assets.loadPBRTextures('pbr/oak-wood');

material.aoMap = textures.orm;         // Uses R channel
material.roughnessMap = textures.orm;  // Uses G channel
material.metalnessMap = textures.orm;  // Uses B channel
```

### Normal Map Convention

AssetLibrary uses **OpenGL convention** (Y+ up):

- Three.js default: OpenGL convention
- If textures use DirectX convention (Y- up), flip Y channel or use `material.normalScale.y = -1`

## Caching System

### How Caching Works

1. **First Load**: Fetch from HTTP, store in Cache Storage
2. **Subsequent Loads**: Read from Cache Storage (instant)
3. **Version Change**: New cache version invalidates old cache

### Cache Storage Location

Browser Cache Storage API stores assets persistently:

```
Cache Storage
└── webgpu-threejs-tsl-assets@1.0.0
    ├── http://localhost:8787/packs/core/textures/oak_wood/albedo.jpg
    ├── http://localhost:8787/packs/core/textures/oak_wood/normal.png
    └── ... (all fetched assets)
```

### Cache Invalidation

Change `cacheVersion` to invalidate old cache:

```javascript
const assets = AssetLibrary.getInstance({
  packs: { core: 'http://localhost:8787/packs/core/' },
  cacheVersion: '1.1.0'  // New version = new cache
});
```

### Manual Cache Clearing

```javascript
// Clear all caches
await assets.clearCache();

// Clear specific cache version
await caches.delete('webgpu-threejs-tsl-assets@1.0.0');
```

## Complete Example

```javascript
import * as THREE from 'three';
import WebGPURenderer from 'three/webgpu';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { AssetLibrary } from './assets/AssetLibrary.js';

// Setup scene
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.set(0, 0, 5);

const renderer = new WebGPURenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.0;
document.body.appendChild(renderer.domElement);

const controls = new OrbitControls(camera, renderer.domElement);

// Initialize AssetLibrary
const assets = AssetLibrary.getInstance({
  packs: { core: 'http://localhost:8787/packs/core/' }
});

assets.initialize(renderer);

await assets.registerCatalogFromUrl(
  'http://localhost:8787/packs/core/catalogs/core.catalog.json',
  { packId: 'core', baseUri: 'http://localhost:8787/packs/core/' }
);

// Load HDR environment
const envMap = await assets.getEnvironment('env/studio-neutral', { pmrem: true });
scene.environment = envMap;
scene.background = envMap;

// Create PBR material
const woodMaterial = await assets.createPBRMaterial('pbr/oak-wood');

// Load model
const model = await assets.getModel('model/suzanne');
model.traverse(child => {
  if (child.isMesh) {
    child.material = woodMaterial;
  }
});
scene.add(model);

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update();
  renderer.renderAsync(scene, camera);
}

animate();
```

## Asset Discovery

### List All Assets

```javascript
const allAssets = assets.query({});
console.log(`Total assets: ${allAssets.length}`);
```

### Filter by Type

```javascript
const pbrTextures = assets.query({ type: 'pbr-texture-set' });
const environments = assets.query({ type: 'environment' });
const models = assets.query({ type: 'model' });
```

### Search by Tags

```javascript
const metalMaterials = assets.query({ type: 'pbr-texture-set', tags: ['metal'] });
const outdoorEnvs = assets.query({ type: 'environment', tags: ['outdoor'] });
```

### Text Search

```javascript
const searchResults = assets.query({ text: 'wood' });
// Matches: 'Oak Wood', tags: ['wood'], etc.
```

## Troubleshooting

### CORS Errors

**Problem**: `Access to fetch at 'http://localhost:8787/...' from origin 'null' has been blocked by CORS policy`

**Solution**: Assets must be served via HTTP server with CORS enabled:

```bash
# Python (CORS enabled by default for localhost)
python -m http.server 8787

# Node.js http-server with CORS
http-server -p 8787 --cors
```

### PMREM Not Working

**Problem**: Environment map doesn't show realistic reflections

**Solution**: Initialize AssetLibrary with renderer before loading environments:

```javascript
assets.initialize(renderer);  // MUST call before loading environments
const env = await assets.getEnvironment('env/studio-neutral', { pmrem: true });
```

### Textures Look Washed Out

**Problem**: Materials look incorrect or washed out

**Cause**: Incorrect color space configuration

**Solution**: AssetLibrary handles this automatically, but if using textures directly:

```javascript
// Albedo: sRGB
material.map.colorSpace = THREE.SRGBColorSpace;

// Normal/ORM: Linear
material.normalMap.colorSpace = THREE.NoColorSpace;
material.roughnessMap.colorSpace = THREE.NoColorSpace;
```

### Models Not Loading

**Problem**: `Failed to fetch` or Draco decoder errors

**Solution**: Ensure GLB files are accessible and Draco decoder is available:

```javascript
// Check network tab for 404 errors
// Draco decoder loaded from CDN by default
// For offline use, download decoder and set path:
const loader = new ModelAssetLoader(resolver, {
  dracoDecoderPath: '/draco/'
});
```

### Cache Not Working

**Problem**: Assets re-downloaded on every page load

**Solution**: Check Cache Storage in DevTools:

1. Open DevTools → Application → Cache Storage
2. Look for `webgpu-threejs-tsl-assets@{version}`
3. If missing, check console for cache errors
4. Ensure HTTPS or localhost (Cache Storage requires secure context)

## Best Practices

### 1. Initialize Once

AssetLibrary is a singleton - call `getInstance()` once at app startup:

```javascript
// ✅ Good
const assets = AssetLibrary.getInstance({ ... });

// ❌ Bad - creates multiple instances
function loadAsset() {
  const assets = AssetLibrary.getInstance();  // Don't call repeatedly
}
```

### 2. Register Catalogs at Startup

Register all catalogs before using assets:

```javascript
async function initAssets() {
  const assets = AssetLibrary.getInstance({ packs: { ... } });
  assets.initialize(renderer);

  await assets.registerCatalogFromUrl('...', { ... });

  return assets;
}

const assets = await initAssets();
```

### 3. Reuse Materials

Materials are GPU resources - reuse them when possible:

```javascript
// ✅ Good - load once, reuse
const material = await assets.createPBRMaterial('pbr/oak-wood');
mesh1.material = material;
mesh2.material = material;

// ❌ Bad - creates duplicate GPU uploads
mesh1.material = await assets.createPBRMaterial('pbr/oak-wood');
mesh2.material = await assets.createPBRMaterial('pbr/oak-wood');
```

### 4. Use Query API for Discovery

Don't hardcode asset IDs - use query API:

```javascript
// ✅ Good - flexible
const materials = assets.query({ type: 'pbr-texture-set' });
const randomMaterial = materials[Math.floor(Math.random() * materials.length)];

// ❌ Bad - brittle
const material = await assets.createPBRMaterial('pbr/oak-wood');
```

### 5. Handle Loading States

Show loading UI while assets load:

```javascript
async function loadScene() {
  showLoadingUI();

  try {
    const [material, env, model] = await Promise.all([
      assets.createPBRMaterial('pbr/oak-wood'),
      assets.getEnvironment('env/studio-neutral', { pmrem: true }),
      assets.getModel('model/suzanne')
    ]);

    // Setup scene with loaded assets
    scene.environment = env;
    model.material = material;
    scene.add(model);

    hideLoadingUI();
  } catch (error) {
    showErrorUI(error.message);
  }
}
```

---

**Next**: [Asset Packs](doc://webgpu-threejs-tsl/docs/asset-packs.md) - Learn how to create custom asset packs
