# Core Concepts - TSL and WebGPU

## Introduction to TSL (Three.js Shading Language)

TSL is a node-based shading language that allows you to write shaders in JavaScript. It provides:
- Type-safe shader graph construction
- Automatic shader generation for WebGPU and WebGL2
- Composable shader nodes
- Runtime shader compilation

### Why TSL?

**Traditional GLSL/WGSL:**
```glsl
// Separate shader strings
const vertexShader = `
  varying vec3 vPosition;
  void main() {
    vPosition = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;
```

**With TSL:**
```javascript
// JavaScript-based, composable, type-safe
import { varying, positionLocal } from 'three/tsl';
const vPosition = varying(positionLocal);
// Automatic shader generation and integration
```

## Node System

### Node Types

#### 1. Value Nodes
Represent typed values in shader code:

```javascript
import { float, vec2, vec3, vec4, color } from 'three/tsl';

const floatValue = float(1.5);
const vector2D = vec2(0.5, 1.0);
const vector3D = vec3(1.0, 0.0, 0.5);
const vector4D = vec4(1.0, 0.0, 0.5, 1.0);
const colorValue = color(1.0, 0.5, 0.0); // RGB
```

#### 2. Attribute Nodes
Access vertex attributes:

```javascript
import { positionLocal, normalLocal, uv } from 'three/tsl';

// Built-in attributes
positionLocal  // vec3 - vertex position in local space
normalLocal    // vec3 - vertex normal in local space
uv()          // vec2 - texture coordinates
```

#### 3. Uniform Nodes
Dynamic values passed from JavaScript:

```javascript
import { uniform } from 'three/tsl';

const timeUniform = uniform(0);
const colorUniform = uniform(new THREE.Color(1, 0, 0));
const scaleUniform = uniform(new THREE.Vector3(1, 1, 1));

// Update from JavaScript
function animate() {
  timeUniform.value += 0.01;
}
```

#### 4. Varying Nodes
Pass data from vertex to fragment shader:

```javascript
import { varying, positionLocal, normalLocal } from 'three/tsl';

// Create varying in vertex shader
const vWorldPosition = varying(positionWorld);
const vNormal = varying(normalWorld);

// Use in fragment shader (automatically available)
material.colorNode = vNormal.mul(0.5).add(0.5);
```

#### 5. Storage Nodes
GPU storage buffers (WebGPU only):

```javascript
import { storage } from 'three/tsl';

const positions = storage(new Float32Array(1000 * 3), 'vec3', 1000);
const colors = storage(new Float32Array(1000 * 4), 'vec4', 1000);
```

## Operators and Functions

### Arithmetic Operators

All arithmetic operations are chainable:

```javascript
import { float, vec3 } from 'three/tsl';

const a = float(2.0);
const b = float(3.0);

const sum = a.add(b);           // 2.0 + 3.0
const difference = a.sub(b);    // 2.0 - 3.0
const product = a.mul(b);       // 2.0 * 3.0
const quotient = a.div(b);      // 2.0 / 3.0

// Chaining
const result = a.add(b).mul(2).div(3);

// Component-wise operations on vectors
const v1 = vec3(1, 2, 3);
const v2 = vec3(4, 5, 6);
const vResult = v1.add(v2); // vec3(5, 7, 9)
```

### Comparison Operators

```javascript
const isEqual = a.equal(b);         // a == b
const notEqual = a.notEqual(b);     // a != b
const greater = a.greaterThan(b);   // a > b
const less = a.lessThan(b);         // a < b
const greaterEq = a.greaterThanEqual(b); // a >= b
const lessEq = a.lessThanEqual(b);  // a <= b
```

### Vector Component Access

```javascript
import { vec3, vec4 } from 'three/tsl';

const v = vec3(1, 2, 3);

// Swizzling
const xy = v.xy;    // vec2(1, 2)
const xz = v.xz;    // vec2(1, 3)
const zyx = v.zyx;  // vec3(3, 2, 1)

// Individual components
const x = v.x;      // float(1)
const y = v.y;      // float(2)
const z = v.z;      // float(3)

// RGBA access (for colors)
const color = vec4(1, 0.5, 0, 1);
const rgb = color.rgb;  // vec3(1, 0.5, 0)
const alpha = color.a;  // float(1)
```

### Mathematical Functions

```javascript
import { sin, cos, tan, abs, floor, ceil, fract, sqrt, pow } from 'three/tsl';

// Trigonometry
const sinValue = sin(x);
const cosValue = cos(x);
const tanValue = tan(x);

// Rounding
const absValue = abs(x);      // Absolute value
const floorValue = floor(x);  // Round down
const ceilValue = ceil(x);    // Round up
const fractValue = fract(x);  // Fractional part

// Power and roots
const sqrtValue = sqrt(x);    // Square root
const powerValue = pow(x, y); // x^y
const expValue = exp(x);      // e^x
const logValue = log(x);      // Natural log
```

### Interpolation Functions

```javascript
import { mix, smoothstep, clamp, step } from 'three/tsl';

// Linear interpolation
const lerp = mix(a, b, t); // a * (1-t) + b * t

// Smooth interpolation
const smooth = smoothstep(edge0, edge1, x);

// Clamp to range
const clamped = clamp(x, min, max);

// Step function
const stepped = step(edge, x); // 0 if x < edge, 1 otherwise
```

### Vector Functions

```javascript
import { length, normalize, dot, cross, distance, reflect } from 'three/tsl';

const v1 = vec3(1, 0, 0);
const v2 = vec3(0, 1, 0);

const len = length(v1);           // Vector length
const norm = normalize(v1);       // Normalized vector
const dotProduct = dot(v1, v2);   // Dot product
const crossProduct = cross(v1, v2); // Cross product
const dist = distance(v1, v2);    // Distance between vectors

// Reflection and refraction
const incident = vec3(1, -1, 0).normalize();
const normal = vec3(0, 1, 0);
const reflected = reflect(incident, normal);
const refracted = refract(incident, normal, 1.5); // IOR = 1.5
```

## Control Flow

### Conditional Statements

```javascript
import { If } from 'three/tsl';

// Basic if-else
const result = If(condition, trueValue, falseValue);

// Example: color based on height
const heightColor = If(
  positionLocal.y.greaterThan(0),
  color(1, 0, 0), // Red above y=0
  color(0, 0, 1)  // Blue below y=0
);

// Nested conditions
const multiColor = If(
  positionLocal.y.greaterThan(1),
  color(1, 0, 0),
  If(
    positionLocal.y.greaterThan(0),
    color(0, 1, 0),
    color(0, 0, 1)
  )
);
```

### Alternative: Mix for Better Performance

Avoid branching when possible by using `mix()`:

```javascript
// Instead of If()
const betterResult = mix(
  color(0, 0, 1),  // False value
  color(1, 0, 0),  // True value
  step(0, positionLocal.y) // 0 or 1
);
```

## Coordinate Spaces

### Position Spaces

```javascript
import { positionLocal, positionWorld, positionView } from 'three/tsl';

// Local space (object coordinates)
positionLocal // Before model transform

// World space (scene coordinates)
positionWorld // After model transform

// View space (camera coordinates)
positionView // After view transform

// Projection space
positionProjected // After projection transform
```

### Normal Spaces

```javascript
import { normalLocal, normalWorld, normalView } from 'three/tsl';

// Local space normals
normalLocal

// World space normals (for lighting)
normalWorld

// View space normals
normalView
```

### Transform Matrices

```javascript
import {
  modelMatrix,
  modelWorldMatrix,
  modelViewMatrix,
  viewMatrix,
  projectionMatrix
} from 'three/tsl';

// Manual transformation
const worldPos = modelWorldMatrix.mul(vec4(positionLocal, 1.0));
const viewPos = viewMatrix.mul(worldPos);
```

## Time and Animation

```javascript
import { timerLocal, timerGlobal, timerDelta } from 'three/tsl';

// Local time (resets when material is created)
const localTime = timerLocal();

// Global time (since page load)
const globalTime = timerGlobal();

// Delta time (time since last frame)
const deltaTime = timerDelta();

// Animated rotation
const rotation = timerLocal().mul(2.0); // Radians per second
const rotatedPos = positionLocal.mul(
  mat3(
    cos(rotation), 0, sin(rotation),
    0, 1, 0,
    sin(rotation).negate(), 0, cos(rotation)
  )
);
```

## Textures

### Texture Sampling

```javascript
import { texture, uv } from 'three/tsl';

// Load texture
const textureLoader = new THREE.TextureLoader();
const map = textureLoader.load('texture.jpg');

// Sample texture
const texColor = texture(map);

// With custom UVs
const customUV = uv().mul(2.0); // Scale UVs
const sampledColor = texture(map, customUV);

// Texture properties
const texelSize = texture(map).size; // Texture dimensions
```

### Texture Operations

```javascript
// Texture tiling
const tiledUV = uv().mul(vec2(4, 4)).fract();
const tiledTexture = texture(map, tiledUV);

// Texture scrolling
const scrollingUV = uv().add(vec2(timerLocal().mul(0.1), 0));
const scrollingTexture = texture(map, scrollingUV);

// Texture rotation
import { sin, cos } from 'three/tsl';
const angle = timerLocal();
const center = vec2(0.5, 0.5);
const rotatedUV = uv().sub(center)
  .mul(mat2(cos(angle), sin(angle), sin(angle).negate(), cos(angle)))
  .add(center);
const rotatedTexture = texture(map, rotatedUV);
```

## Type System

### Type Conversion

```javascript
import { float, vec2, vec3, vec4 } from 'three/tsl';

// Scalar to vector
const f = float(1.0);
const v2 = vec2(f, f);           // vec2(1.0, 1.0)
const v3 = vec3(f);              // vec3(1.0, 1.0, 1.0)

// Vector construction
const v3_mixed = vec3(v2, f);    // vec3(v2.x, v2.y, f)
const v4_mixed = vec4(v3, f);    // vec4(v3.x, v3.y, v3.z, f)

// Vector to scalar (component access)
const x = v3.x;                  // float
```

### Type Inference

TSL automatically infers types:

```javascript
// Type is inferred from operation
const a = positionLocal.x;  // float (component of vec3)
const b = a.mul(2);        // float (float * float)
const c = positionLocal.mul(2); // vec3 (vec3 * float)
```

## Best Practices

### 1. Minimize Uniform Updates
```javascript
// Bad: Creating uniforms in render loop
function render() {
  const material = new MeshBasicNodeMaterial();
  material.colorNode = uniform(new THREE.Color(1, 0, 0)); // Don't do this
}

// Good: Create uniforms once
const colorUniform = uniform(new THREE.Color(1, 0, 0));
const material = new MeshBasicNodeMaterial();
material.colorNode = colorUniform;

function render() {
  colorUniform.value.setHex(0xff0000);
}
```

### 2. Reuse Nodes
```javascript
// Bad: Duplicate nodes
const pos1 = positionLocal.mul(2);
const pos2 = positionLocal.mul(2); // Duplicate computation

// Good: Reuse nodes
const scaledPos = positionLocal.mul(2);
// Use scaledPos multiple times
```

### 3. Cache Materials
```javascript
// Bad: Creating new materials every frame
function render() {
  mesh.material = new MeshStandardNodeMaterial();
}

// Good: Create material once
const material = new MeshStandardNodeMaterial();
mesh.material = material;
```

### 4. Use Appropriate Types
```javascript
// Use float for single values
const scale = float(2.0);

// Use vec3 for 3D operations
const offset = vec3(1, 2, 3);

// Use color for RGB values
const baseColor = color(1, 0.5, 0);
```

### 5. Leverage Built-in Functions
```javascript
// Use built-in instead of manual implementation
const len = length(v);              // Good
const len = sqrt(dot(v, v));       // Works but unnecessary
```

## Debugging

### Log Generated Shader Code

```javascript
const material = new MeshStandardNodeMaterial();
material.colorNode = positionLocal.mul(0.5).add(0.5);

// Force compilation
material.needsUpdate = true;
renderer.compile(scene, camera);

// Log shader code (after compilation)
console.log('Vertex Shader:', material.vertexShader);
console.log('Fragment Shader:', material.fragmentShader);
```

### Visual Debugging

```javascript
// Visualize normals
material.colorNode = normalLocal.mul(0.5).add(0.5);

// Visualize UVs
material.colorNode = vec3(uv(), 0);

// Visualize position
material.colorNode = positionLocal.normalize().mul(0.5).add(0.5);
```

## Common Patterns

### Gradient
```javascript
const gradient = positionLocal.y.add(1).div(2); // 0 to 1
const gradientColor = mix(
  color(0, 0, 1), // Blue
  color(1, 0, 0), // Red
  gradient
);
```

### Fresnel Effect
```javascript
import { cameraPosition, normalWorld, positionWorld, pow } from 'three/tsl';

const viewDirection = cameraPosition.sub(positionWorld).normalize();
const fresnel = float(1).sub(abs(dot(viewDirection, normalWorld)));
const fresnelPower = pow(fresnel, 3);
```

### Pulsing Animation
```javascript
import { sin, timerLocal } from 'three/tsl';

const pulse = sin(timerLocal().mul(2)).mul(0.5).add(0.5); // 0 to 1
const pulsatingColor = color(1, 0, 0).mul(pulse);
```

### Vertex Displacement
```javascript
import { sin, timerLocal } from 'three/tsl';

const displacement = sin(
  positionLocal.y.mul(10).add(timerLocal().mul(2))
).mul(0.2);

material.positionNode = positionLocal.add(
  normalLocal.mul(displacement)
);
```
