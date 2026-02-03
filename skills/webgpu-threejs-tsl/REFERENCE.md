# WebGPU + Three.js + TSL Quick Reference

## Essential Imports

```javascript
// Renderer
import WebGPURenderer from 'three/webgpu';

// TSL Core
import { MeshStandardNodeMaterial, MeshBasicNodeMaterial } from 'three/tsl';
import { uniform, attribute, varying, storage } from 'three/tsl';

// TSL Nodes
import { vec2, vec3, vec4, color, float } from 'three/tsl';
import { positionLocal, positionWorld, normalLocal, normalWorld } from 'three/tsl';
import { uv, modelWorldMatrix, cameraPosition } from 'three/tsl';

// Math & Utilities
import { add, mul, sin, cos, mix, smoothstep, clamp } from 'three/tsl';
import { texture, timerLocal, timerGlobal } from 'three/tsl';

// Compute
import { compute, computeLayout, storageObject } from 'three/tsl';

// Post Processing
import { pass, PassNode, PostProcessing } from 'three/tsl';
```

## Basic Setup

```javascript
import * as THREE from 'three';
import WebGPURenderer from 'three/webgpu';

// Create renderer
const renderer = new WebGPURenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);
document.body.appendChild(renderer.domElement);

// Initialize WebGPU (returns Promise)
await renderer.init();

// Render loop
function animate() {
  renderer.render(scene, camera);
}
renderer.setAnimationLoop(animate);
```

## TSL Node Types

| Type | Description | Example |
|------|-------------|---------|
| `float(value)` | Scalar float | `float(1.0)` |
| `vec2(x, y)` | 2D vector | `vec2(0.5, 1.0)` |
| `vec3(x, y, z)` | 3D vector | `vec3(1, 0, 0)` |
| `vec4(x, y, z, w)` | 4D vector | `vec4(1, 0, 0, 1)` |
| `color(r, g, b)` | RGB color | `color(1, 0.5, 0)` |
| `uniform(value)` | Uniform input | `uniform(new THREE.Color())` |
| `attribute(name)` | Vertex attribute | `attribute('position')` |
| `varying(node)` | Vertex→Fragment | `varying(normalLocal)` |
| `storage(buffer)` | Storage buffer | `storage(Float32Array)` |

## Built-in Attributes

```javascript
// Position
positionLocal      // Local space position
positionWorld      // World space position
positionView       // View space position

// Normals
normalLocal        // Local space normal
normalWorld        // World space normal
normalView         // View space normal

// UVs
uv()               // Primary UV coordinates
uv2()              // Secondary UV coordinates

// Other
modelWorldMatrix   // Model transform matrix
cameraPosition     // Camera world position
```

## Math Operations

```javascript
// Arithmetic (chainable)
a.add(b)           // a + b
a.sub(b)           // a - b
a.mul(b)           // a * b
a.div(b)           // a / b

// Comparison
a.equal(b)         // a == b
a.notEqual(b)      // a != b
a.greaterThan(b)   // a > b
a.lessThan(b)      // a < b

// Trigonometry
sin(x)             // sine
cos(x)             // cosine
tan(x)             // tangent

// Common functions
abs(x)             // absolute value
floor(x)           // floor
ceil(x)            // ceiling
fract(x)           // fractional part
sqrt(x)            // square root
pow(x, y)          // x^y
exp(x)             // e^x
log(x)             // natural log

// Vector operations
length(v)          // vector length
normalize(v)       // normalized vector
dot(a, b)          // dot product
cross(a, b)        // cross product
distance(a, b)     // distance between points
reflect(i, n)      // reflect vector
refract(i, n, eta) // refract vector

// Interpolation
mix(a, b, t)       // linear interpolation
smoothstep(e0, e1, x) // smooth step
clamp(x, min, max) // clamp to range
step(edge, x)      // step function
```

## Custom Materials

```javascript
import { MeshStandardNodeMaterial, color, positionLocal } from 'three/tsl';

// Basic custom material
const material = new MeshStandardNodeMaterial();
material.colorNode = color(1, 0, 0); // Red color

// Gradient based on position
material.colorNode = color(1, 0, 0).mul(
  positionLocal.y.add(1).div(2)
);

// Animated material
import { timerLocal } from 'three/tsl';
material.colorNode = color(1, 0, 0).mul(
  sin(timerLocal()).mul(0.5).add(0.5)
);

// Texture-based
import { texture } from 'three/tsl';
const baseTexture = texture(new THREE.TextureLoader().load('texture.jpg'));
material.colorNode = baseTexture;
```

## Uniforms

```javascript
import { uniform, MeshBasicNodeMaterial } from 'three/tsl';

// Create uniform
const timeUniform = uniform(0);
const colorUniform = uniform(new THREE.Color(1, 0, 0));
const vectorUniform = uniform(new THREE.Vector3(0, 1, 0));

// Use in material
const material = new MeshBasicNodeMaterial();
material.colorNode = colorUniform;

// Update uniform
function animate() {
  timeUniform.value += 0.01;
  renderer.render(scene, camera);
}
```

## Compute Shaders

```javascript
import { compute, storage, uniform, storageObject } from 'three/tsl';

// Define storage buffers
const particleCount = 1000;
const positionsArray = new Float32Array(particleCount * 3);
const velocitiesArray = new Float32Array(particleCount * 3);

// Create compute shader
const computeParticles = compute({
  workgroupSize: [256],
  layout: {
    positions: storage(positionsArray, 'vec3', particleCount),
    velocities: storage(velocitiesArray, 'vec3', particleCount),
    deltaTime: uniform(0)
  },
  compute: ({ positions, velocities, deltaTime, instanceIndex }) => {
    const position = positions.element(instanceIndex);
    const velocity = velocities.element(instanceIndex);

    // Update position
    positions.element(instanceIndex).assign(
      position.add(velocity.mul(deltaTime))
    );
  }
});

// Execute compute shader
async function updateParticles(deltaTime) {
  computeParticles({ deltaTime: deltaTime });
  await renderer.computeAsync(computeParticles);
}
```

## Post Processing

```javascript
import { pass, PostProcessing } from 'three/tsl';

// Create post processing
const postProcessing = new PostProcessing(renderer);

// Basic scene pass
postProcessing.outputNode = pass(scene, camera);

// With effects
postProcessing.outputNode = pass(scene, camera)
  .bloom(0.5)              // Bloom effect
  .saturation(1.2)         // Saturation
  .contrast(1.1)           // Contrast
  .hue(0.1);              // Hue shift

// Custom post effect
import { uniform, vec4 } from 'three/tsl';

const scenePass = pass(scene, camera);
const vignetteStrength = uniform(0.5);

postProcessing.outputNode = scenePass.mul(
  float(1).sub(
    length(uv().sub(0.5)).mul(vignetteStrength)
  )
);
```

## Custom WGSL Integration

```javascript
import { wgslFn, float, vec3 } from 'three/tsl';

// Define WGSL function
const customNoise = wgslFn(`
  fn customNoise(p: vec3f) -> f32 {
    return fract(sin(dot(p, vec3f(12.9898, 78.233, 45.164))) * 43758.5453);
  }
`);

// Use in TSL
const material = new MeshBasicNodeMaterial();
material.colorNode = customNoise(positionLocal.mul(10)).mul(color(1, 1, 1));
```

## Control Flow

```javascript
import { If } from 'three/tsl';

// Conditional
const result = If(condition, trueValue, falseValue);

// Example
const color = If(
  positionLocal.y.greaterThan(0),
  color(1, 0, 0), // Red if y > 0
  color(0, 0, 1)  // Blue otherwise
);

// Loop (use compute shaders for GPU loops)
```

## Performance Tips

1. **Reuse materials** - Cache and reuse node materials
2. **Minimize uniforms** - Batch uniform updates
3. **Use storage buffers** - For large data arrays
4. **Compute shader workgroups** - Use multiples of 64 (e.g., 64, 128, 256)
5. **Texture formats** - Use compressed formats when possible
6. **Avoid dynamic branching** - Use `mix()` instead of `If()` when possible

## Common Patterns

### Time-based Animation
```javascript
import { timerLocal, sin, cos } from 'three/tsl';
const time = timerLocal();
positionNode = positionLocal.add(vec3(sin(time), cos(time), 0));
```

### UV-based Effects
```javascript
import { uv, texture } from 'three/tsl';
const uvCoord = uv();
const distorted = texture(map, uvCoord.add(vec2(sin(time), 0).mul(0.1)));
```

### Fresnel Effect
```javascript
import { cameraPosition, normalWorld, positionWorld } from 'three/tsl';
const viewDir = cameraPosition.sub(positionWorld).normalize();
const fresnel = float(1).sub(dot(viewDir, normalWorld).abs());
```

### Vertex Displacement
```javascript
import { positionLocal, normalLocal, sin, timerLocal } from 'three/tsl';
material.positionNode = positionLocal.add(
  normalLocal.mul(sin(positionLocal.y.mul(10).add(timerLocal())).mul(0.1))
);
```

## Error Handling

```javascript
// Check WebGPU support
if (!navigator.gpu) {
  console.error('WebGPU not supported');
  // Fallback to WebGLRenderer
}

// Handle initialization errors
try {
  await renderer.init();
} catch (error) {
  console.error('WebGPU initialization failed:', error);
}

// Check compute shader limits
const limits = await renderer.getContext().limits;
console.log('Max compute workgroup size:', limits.maxComputeWorkgroupSizeX);
```

## Debugging

```javascript
// Enable shader debugging
material.needsUpdate = true;

// Log generated shader code
console.log(material.vertexShader);
console.log(material.fragmentShader);

// Use browser DevTools
// Chrome: chrome://gpu
// Edge: edge://gpu
```

## Asset Library

### Quick Start

```javascript
import { AssetLibrary } from './assets/AssetLibrary.js';

// Initialize with pack configuration
const assets = AssetLibrary.getInstance({
  packs: { core: 'http://localhost:8787/packs/core/' }
});

// Initialize with renderer (required for PMREM)
assets.initialize(renderer);

// Register catalog
await assets.registerCatalogFromUrl(
  'http://localhost:8787/packs/core/catalogs/core.catalog.json',
  { packId: 'core', baseUri: 'http://localhost:8787/packs/core/' }
);
```

### Load PBR Material

```javascript
// Create PBR material from asset
const material = await assets.createPBRMaterial('pbr/oak-wood');
mesh.material = material;

// Or load textures separately
const textures = await assets.loadPBRTextures('pbr/oak-wood');
material.map = textures.albedo;          // Diffuse (sRGB)
material.normalMap = textures.normal;    // Normal map (linear)
material.aoMap = textures.orm;           // Ambient occlusion (R channel)
material.roughnessMap = textures.orm;    // Roughness (G channel)
material.metalnessMap = textures.orm;    // Metalness (B channel)
```

### Load HDR Environment

```javascript
// Load environment with PMREM
const envMap = await assets.getEnvironment('env/studio-neutral', { pmrem: true });
scene.environment = envMap;
scene.background = envMap;

// With custom settings
const env = await assets.loadEnvironment('env/outdoor-sunset', {
  pmrem: true,
  intensity: 1.2,
  exposure: 0.5
});
scene.environment = env.texture;
renderer.toneMappingExposure = env.exposure;
```

### Load GLB Model

```javascript
// Load 3D model
const model = await assets.getModel('model/suzanne');
scene.add(model);

// Apply material to model
model.traverse(child => {
  if (child.isMesh) {
    child.material = await assets.createPBRMaterial('pbr/oak-wood');
  }
});
```

### Query Assets

```javascript
// Find all PBR textures
const allMaterials = assets.query({ type: 'pbr-texture-set' });

// Find metal materials
const metals = assets.query({ type: 'pbr-texture-set', tags: ['metal'] });

// Find outdoor environments
const outdoor = assets.query({ type: 'environment', tags: ['outdoor'] });

// Text search
const results = assets.query({ text: 'wood' });
```

### Cache Management

```javascript
// Get cache statistics
const stats = assets.getCacheStats();
console.log('Cache entries:', stats.packs.core.textures.entries);

// Clear all caches
await assets.clearCache();

// Dispose all resources
assets.dispose();
```

### Local HTTP Server

Assets must be served via HTTP (not `file://`):

```bash
# Python
cd ~/.claude/asset-packs
python -m http.server 8787

# Node.js
npm install -g http-server
cd ~/.claude/asset-packs
http-server -p 8787 --cors
```

### Color Space Management

AssetLibrary automatically configures color spaces:

```javascript
// Albedo textures: sRGB
albedoTexture.colorSpace = THREE.SRGBColorSpace;

// Data textures (normal, ORM): Linear
normalTexture.colorSpace = THREE.NoColorSpace;
ormTexture.colorSpace = THREE.NoColorSpace;
```

### Complete Example

```javascript
import * as THREE from 'three';
import WebGPURenderer from 'three/webgpu';
import { AssetLibrary } from './assets/AssetLibrary.js';

// Setup renderer
const renderer = new WebGPURenderer({ antialias: true });
await renderer.init();

// Initialize AssetLibrary
const assets = AssetLibrary.getInstance({
  packs: { core: 'http://localhost:8787/packs/core/' }
});
assets.initialize(renderer);

await assets.registerCatalogFromUrl(
  'http://localhost:8787/packs/core/catalogs/core.catalog.json',
  { packId: 'core', baseUri: 'http://localhost:8787/packs/core/' }
);

// Load all assets in parallel
const [material, envMap, model] = await Promise.all([
  assets.createPBRMaterial('pbr/oak-wood'),
  assets.getEnvironment('env/studio-neutral', { pmrem: true }),
  assets.getModel('model/suzanne')
]);

// Apply to scene
scene.environment = envMap;
scene.background = envMap;

model.traverse(child => {
  if (child.isMesh) {
    child.material = material;
  }
});
scene.add(model);
```
