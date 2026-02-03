# WGSL Integration

While TSL provides a JavaScript-based shader system, sometimes you need to write custom WGSL (WebGPU Shading Language) code for performance or to access features not yet available in TSL.

## Basic WGSL Functions

### Defining WGSL Functions

```javascript
import { wgslFn, float, vec3 } from 'three/tsl';

// Simple WGSL function
const myFunction = wgslFn(`
  fn myFunction(x: f32) -> f32 {
    return x * x;
  }
`);

// Use in TSL
const result = myFunction(float(5)); // Returns 25
```

### Function with Multiple Parameters

```javascript
const customNoise = wgslFn(`
  fn customNoise(p: vec3f, scale: f32) -> f32 {
    let scaled = p * scale;
    return fract(sin(dot(scaled, vec3f(12.9898, 78.233, 45.164))) * 43758.5453);
  }
`);

// Usage
material.colorNode = customNoise(positionLocal, float(10)).mul(color(1, 1, 1));
```

## WGSL Type System

### Basic Types

```wgsl
// Scalars
f32          // 32-bit float
i32          // 32-bit signed integer
u32          // 32-bit unsigned integer
bool         // Boolean

// Vectors
vec2f        // 2D float vector
vec3f        // 3D float vector
vec4f        // 4D float vector
vec2i        // 2D integer vector
vec3u        // 3D unsigned integer vector

// Matrices
mat2x2f      // 2x2 float matrix
mat3x3f      // 3x3 float matrix
mat4x4f      // 4x4 float matrix
```

### Type Conversion

```wgsl
// Float to int
let i: i32 = i32(3.14);

// Int to float
let f: f32 = f32(42);

// Vector construction
let v: vec3f = vec3f(1.0, 2.0, 3.0);
let v2: vec3f = vec3f(1.0); // All components = 1.0

// Matrix construction
let m: mat3x3f = mat3x3f(
  1.0, 0.0, 0.0,
  0.0, 1.0, 0.0,
  0.0, 0.0, 1.0
);
```

## Common WGSL Patterns

### Noise Functions

```javascript
const noise3D = wgslFn(`
  fn hash3(p: vec3f) -> vec3f {
    var q = vec3f(
      dot(p, vec3f(127.1, 311.7, 74.7)),
      dot(p, vec3f(269.5, 183.3, 246.1)),
      dot(p, vec3f(113.5, 271.9, 124.6))
    );
    return fract(sin(q) * 43758.5453123);
  }

  fn noise3D(p: vec3f) -> f32 {
    let i = floor(p);
    let f = fract(p);

    let u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(
        mix(
          dot(hash3(i + vec3f(0, 0, 0)), f - vec3f(0, 0, 0)),
          dot(hash3(i + vec3f(1, 0, 0)), f - vec3f(1, 0, 0)),
          u.x
        ),
        mix(
          dot(hash3(i + vec3f(0, 1, 0)), f - vec3f(0, 1, 0)),
          dot(hash3(i + vec3f(1, 1, 0)), f - vec3f(1, 1, 0)),
          u.x
        ),
        u.y
      ),
      mix(
        mix(
          dot(hash3(i + vec3f(0, 0, 1)), f - vec3f(0, 0, 1)),
          dot(hash3(i + vec3f(1, 0, 1)), f - vec3f(1, 0, 1)),
          u.x
        ),
        mix(
          dot(hash3(i + vec3f(0, 1, 1)), f - vec3f(0, 1, 1)),
          dot(hash3(i + vec3f(1, 1, 1)), f - vec3f(1, 1, 1)),
          u.x
        ),
        u.y
      ),
      u.z
    );
  }
`);

// Usage
material.colorNode = vec3(noise3D(positionLocal.mul(5)));
```

### Fractional Brownian Motion (FBM)

```javascript
const fbm = wgslFn(`
  fn fbm(p: vec3f, octaves: i32) -> f32 {
    var value: f32 = 0.0;
    var amplitude: f32 = 0.5;
    var frequency: f32 = 1.0;
    var position = p;

    for (var i: i32 = 0; i < octaves; i++) {
      value += amplitude * noise3D(position * frequency);
      amplitude *= 0.5;
      frequency *= 2.0;
    }

    return value;
  }
`, [noise3D]); // Dependencies

// Usage
material.colorNode = vec3(fbm(positionLocal, 5));
```

### Voronoi Noise

```javascript
const voronoi = wgslFn(`
  fn voronoi(p: vec3f) -> vec2f {
    let i = floor(p);
    let f = fract(p);

    var minDist: f32 = 1.0;
    var minPoint: vec3f;

    for (var z: i32 = -1; z <= 1; z++) {
      for (var y: i32 = -1; y <= 1; y++) {
        for (var x: i32 = -1; x <= 1; x++) {
          let neighbor = vec3f(f32(x), f32(y), f32(z));
          let point = hash3(i + neighbor);
          let diff = neighbor + point - f;
          let dist = length(diff);

          if (dist < minDist) {
            minDist = dist;
            minPoint = point;
          }
        }
      }
    }

    return vec2f(minDist, minPoint.x);
  }
`, [hash3]);

// Usage
const voronoiResult = voronoi(positionLocal.mul(5));
material.colorNode = vec3(voronoiResult.x); // Distance field
```

## Matrix Operations

### Custom Transformations

```javascript
const rotateY = wgslFn(`
  fn rotateY(p: vec3f, angle: f32) -> vec3f {
    let c = cos(angle);
    let s = sin(angle);
    let m = mat3x3f(
      c, 0.0, s,
      0.0, 1.0, 0.0,
      -s, 0.0, c
    );
    return m * p;
  }
`);

// Usage
material.positionNode = rotateY(positionLocal, timerLocal());
```

### Quaternion Rotation

```javascript
const quatRotate = wgslFn(`
  fn quatRotate(v: vec3f, q: vec4f) -> vec3f {
    let t = 2.0 * cross(q.xyz, v);
    return v + q.w * t + cross(q.xyz, t);
  }
`);

// Usage
const quaternion = uniform(new THREE.Vector4(0, 0, 0, 1));
material.positionNode = quatRotate(positionLocal, quaternion);
```

## Color Space Conversions

### RGB to HSV

```javascript
const rgbToHsv = wgslFn(`
  fn rgbToHsv(c: vec3f) -> vec3f {
    let K = vec4f(0.0, -1.0 / 3.0, 2.0 / 3.0, -1.0);
    let p = mix(vec4f(c.bg, K.wz), vec4f(c.gb, K.xy), step(c.b, c.g));
    let q = mix(vec4f(p.xyw, c.r), vec4f(c.r, p.yzx), step(p.x, c.r));

    let d = q.x - min(q.w, q.y);
    let e = 1.0e-10;
    return vec3f(abs(q.z + (q.w - q.y) / (6.0 * d + e)), d / (q.x + e), q.x);
  }
`);
```

### HSV to RGB

```javascript
const hsvToRgb = wgslFn(`
  fn hsvToRgb(c: vec3f) -> vec3f {
    let K = vec4f(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    let p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
    return c.z * mix(K.xxx, clamp(p - K.xxx, vec3f(0.0), vec3f(1.0)), c.y);
  }
`);

// Usage: Hue shift
const rgb = material.colorNode.rgb;
const hsv = rgbToHsv(rgb);
const shiftedHsv = vec3(hsv.x.add(0.1), hsv.y, hsv.z);
material.colorNode = vec4(hsvToRgb(shiftedHsv), 1);
```

## Lighting Models

### Custom Phong Lighting

```javascript
const phong = wgslFn(`
  fn phong(
    normal: vec3f,
    lightDir: vec3f,
    viewDir: vec3f,
    lightColor: vec3f,
    diffuseColor: vec3f,
    specularColor: vec3f,
    shininess: f32
  ) -> vec3f {
    // Diffuse
    let NdotL = max(dot(normal, lightDir), 0.0);
    let diffuse = diffuseColor * lightColor * NdotL;

    // Specular
    let reflectDir = reflect(-lightDir, normal);
    let spec = pow(max(dot(viewDir, reflectDir), 0.0), shininess);
    let specular = specularColor * lightColor * spec;

    return diffuse + specular;
  }
`);

// Usage
const result = phong(
  normalWorld,
  lightDirection,
  viewDirection,
  lightColor,
  baseColor,
  specularColor,
  float(32)
);
material.colorNode = vec4(result, 1);
```

### Cook-Torrance BRDF

```javascript
const cookTorrance = wgslFn(`
  fn DistributionGGX(N: vec3f, H: vec3f, roughness: f32) -> f32 {
    let a = roughness * roughness;
    let a2 = a * a;
    let NdotH = max(dot(N, H), 0.0);
    let NdotH2 = NdotH * NdotH;

    let denom = (NdotH2 * (a2 - 1.0) + 1.0);
    return a2 / (3.14159265359 * denom * denom);
  }

  fn GeometrySchlickGGX(NdotV: f32, roughness: f32) -> f32 {
    let r = (roughness + 1.0);
    let k = (r * r) / 8.0;
    return NdotV / (NdotV * (1.0 - k) + k);
  }

  fn GeometrySmith(N: vec3f, V: vec3f, L: vec3f, roughness: f32) -> f32 {
    let NdotV = max(dot(N, V), 0.0);
    let NdotL = max(dot(N, L), 0.0);
    let ggx2 = GeometrySchlickGGX(NdotV, roughness);
    let ggx1 = GeometrySchlickGGX(NdotL, roughness);
    return ggx1 * ggx2;
  }

  fn FresnelSchlick(cosTheta: f32, F0: vec3f) -> vec3f {
    return F0 + (1.0 - F0) * pow(clamp(1.0 - cosTheta, 0.0, 1.0), 5.0);
  }

  fn cookTorrance(
    N: vec3f,
    V: vec3f,
    L: vec3f,
    albedo: vec3f,
    metallic: f32,
    roughness: f32
  ) -> vec3f {
    let H = normalize(V + L);

    let F0 = mix(vec3f(0.04), albedo, metallic);
    let F = FresnelSchlick(max(dot(H, V), 0.0), F0);

    let NDF = DistributionGGX(N, H, roughness);
    let G = GeometrySmith(N, V, L, roughness);

    let numerator = NDF * G * F;
    let denominator = 4.0 * max(dot(N, V), 0.0) * max(dot(N, L), 0.0) + 0.0001;
    let specular = numerator / denominator;

    let kD = (vec3f(1.0) - F) * (1.0 - metallic);
    let NdotL = max(dot(N, L), 0.0);

    return (kD * albedo / 3.14159265359 + specular) * NdotL;
  }
`);
```

## Signed Distance Functions (SDFs)

```javascript
const sdSphere = wgslFn(`
  fn sdSphere(p: vec3f, r: f32) -> f32 {
    return length(p) - r;
  }
`);

const sdBox = wgslFn(`
  fn sdBox(p: vec3f, b: vec3f) -> f32 {
    let q = abs(p) - b;
    return length(max(q, vec3f(0.0))) + min(max(q.x, max(q.y, q.z)), 0.0);
  }
`);

const sdTorus = wgslFn(`
  fn sdTorus(p: vec3f, t: vec2f) -> f32 {
    let q = vec2f(length(p.xz) - t.x, p.y);
    return length(q) - t.y;
  }
`);

// SDF operations
const opUnion = wgslFn(`
  fn opUnion(d1: f32, d2: f32) -> f32 {
    return min(d1, d2);
  }
`);

const opSubtraction = wgslFn(`
  fn opSubtraction(d1: f32, d2: f32) -> f32 {
    return max(-d1, d2);
  }
`);

const opIntersection = wgslFn(`
  fn opIntersection(d1: f32, d2: f32) -> f32 {
    return max(d1, d2);
  }
`);

// Usage: Raymarching SDF
material.colorNode = vec3(
  step(0, sdSphere(positionLocal, float(1)))
);
```

## Texture Sampling

### Custom Texture Functions

```javascript
const textureTriplanar = wgslFn(`
  fn textureTriplanar(
    tex: texture_2d<f32>,
    samp: sampler,
    p: vec3f,
    n: vec3f
  ) -> vec4f {
    let blend = abs(n);
    let blendSum = blend.x + blend.y + blend.z;
    let blendNorm = blend / blendSum;

    let xProj = textureSample(tex, samp, p.yz);
    let yProj = textureSample(tex, samp, p.xz);
    let zProj = textureSample(tex, samp, p.xy);

    return xProj * blendNorm.x + yProj * blendNorm.y + zProj * blendNorm.z;
  }
`);
```

## Performance Optimization

### Fast Math Functions

```javascript
const fastSin = wgslFn(`
  fn fastSin(x: f32) -> f32 {
    let x2 = x * x;
    return x * (1.0 - x2 * (1.0/6.0 - x2 * 1.0/120.0));
  }
`);

const fastCos = wgslFn(`
  fn fastCos(x: f32) -> f32 {
    let x2 = x * x;
    return 1.0 - x2 * (0.5 - x2 * 1.0/24.0);
  }
`);
```

### Integer Operations

```javascript
const fastFloor = wgslFn(`
  fn fastFloor(x: f32) -> i32 {
    return i32(x) - i32(x < 0.0);
  }
`);

const fastMod = wgslFn(`
  fn fastMod(x: i32, y: i32) -> i32 {
    return x - (x / y) * y;
  }
`);
```

## Debugging

### Color Visualization

```javascript
const debugVec3 = wgslFn(`
  fn debugVec3(v: vec3f) -> vec3f {
    return v * 0.5 + 0.5; // Remap -1..1 to 0..1
  }
`);

const debugFloat = wgslFn(`
  fn debugFloat(f: f32) -> vec3f {
    return vec3f(f); // Gray scale
  }
`);

// Usage
material.colorNode = debugVec3(normalLocal);
material.colorNode = debugFloat(positionLocal.y);
```

### NaN/Inf Detection

```javascript
const isValid = wgslFn(`
  fn isValid(x: f32) -> bool {
    return !isNan(x) && !isInf(x);
  }
`);

// Usage
const value = someCalculation();
material.colorNode = If(
  isValid(value),
  vec3(value),
  vec3(1, 0, 0) // Red for invalid
);
```

## Integration with TSL

### Combining WGSL and TSL

```javascript
import { wgslFn, positionLocal, normalLocal, color, timerLocal } from 'three/tsl';

// WGSL function
const customDisplace = wgslFn(`
  fn customDisplace(p: vec3f, n: vec3f, time: f32) -> vec3f {
    let freq = 5.0;
    let amp = 0.2;
    let offset = sin(p.y * freq + time) * amp;
    return p + n * offset;
  }
`);

// Use with TSL nodes
const material = new MeshStandardNodeMaterial();
material.positionNode = customDisplace(
  positionLocal,
  normalLocal,
  timerLocal()
);
material.colorNode = color(1, 0.5, 0);
```

### Passing TSL Nodes to WGSL

```javascript
// TSL nodes are automatically converted to WGSL types
const myFunction = wgslFn(`
  fn myFunction(pos: vec3f, col: vec3f) -> vec3f {
    return pos * col;
  }
`);

// Pass TSL nodes
const result = myFunction(positionLocal, color(1, 0.5, 0));
```

## Best Practices

1. **Use TSL when possible** - TSL is type-safe and easier to maintain
2. **WGSL for performance** - Use WGSL for hot paths and complex math
3. **Function reuse** - Define WGSL functions once and reuse
4. **Type safety** - Ensure WGSL types match TSL types
5. **Dependencies** - Specify function dependencies clearly
6. **Comments** - Document complex WGSL code
7. **Testing** - Test WGSL functions thoroughly
8. **Precision** - Consider using f16 for mobile devices when appropriate

## Common Gotchas

1. **Type mismatch** - WGSL is strict about types (use explicit casts)
2. **Variable declarations** - Use `var` for mutable, `let` for immutable
3. **Function signatures** - Must specify all parameter and return types
4. **Array indexing** - Must use integer types for array indices
5. **Swizzling** - WGSL uses `.xyz` not `[0]` for vector components
6. **Matrix order** - WGSL uses column-major matrices like GLSL
7. **Built-in functions** - Some GLSL functions have different names in WGSL
