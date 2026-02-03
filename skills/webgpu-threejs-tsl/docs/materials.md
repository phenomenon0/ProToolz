# Node Materials

Node materials are TSL-enabled materials that allow shader customization through the node system.

## Material Types

### MeshBasicNodeMaterial

Unlit material with no lighting calculations.

```javascript
import { MeshBasicNodeMaterial, color, texture, uv } from 'three/tsl';

const material = new MeshBasicNodeMaterial();

// Solid color
material.colorNode = color(1, 0, 0);

// Texture
const map = new THREE.TextureLoader().load('texture.jpg');
material.colorNode = texture(map);

// Animated
material.colorNode = color(
  sin(timerLocal()),
  cos(timerLocal()),
  0.5
);
```

### MeshStandardNodeMaterial

Physically-based material with metallic-roughness workflow.

```javascript
import {
  MeshStandardNodeMaterial,
  color,
  float,
  texture,
  normalMap
} from 'three/tsl';

const material = new MeshStandardNodeMaterial();

// Base color
material.colorNode = color(1, 0.5, 0);

// Roughness (0 = smooth, 1 = rough)
material.roughnessNode = float(0.5);

// Metalness (0 = dielectric, 1 = metallic)
material.metalnessNode = float(1.0);

// Emissive
material.emissiveNode = color(0.1, 0, 0);

// Normal map
const normalTex = new THREE.TextureLoader().load('normal.jpg');
material.normalNode = normalMap(texture(normalTex));

// Opacity (for transparent materials)
material.transparent = true;
material.opacityNode = float(0.5);
```

### MeshPhysicalNodeMaterial

Extended PBR material with additional physical properties.

```javascript
import { MeshPhysicalNodeMaterial, float } from 'three/tsl';

const material = new MeshPhysicalNodeMaterial();

// Standard properties
material.colorNode = color(1, 1, 1);
material.roughnessNode = float(0.1);
material.metalnessNode = float(1.0);

// Clearcoat (protective layer)
material.clearcoatNode = float(1.0);
material.clearcoatRoughnessNode = float(0.1);

// Transmission (glass-like)
material.transmissionNode = float(1.0);

// Thickness (for transmission)
material.thicknessNode = float(0.5);

// IOR (index of refraction)
material.iorNode = float(1.5);

// Sheen (fabric-like)
material.sheenNode = float(1.0);
material.sheenRoughnessNode = float(0.5);
material.sheenColorNode = color(1, 1, 1);

// Iridescence
material.iridescenceNode = float(1.0);
material.iridescenceIORNode = float(1.3);
material.iridescenceThicknessNode = float(400);
```

### MeshToonNodeMaterial

Cartoon/cel-shading material.

```javascript
import { MeshToonNodeMaterial, color, texture } from 'three/tsl';

const material = new MeshToonNodeMaterial();

// Base color
material.colorNode = color(1, 0.5, 0);

// Gradient map for toon shading
const gradientMap = new THREE.TextureLoader().load('gradientMap.jpg');
gradientMap.minFilter = THREE.NearestFilter;
gradientMap.magFilter = THREE.NearestFilter;
material.gradientMap = gradientMap;
```

### LineBasicNodeMaterial

Material for line rendering.

```javascript
import { LineBasicNodeMaterial, color } from 'three/tsl';

const material = new LineBasicNodeMaterial();
material.colorNode = color(1, 0, 0);
material.linewidth = 2; // Note: linewidth > 1 not supported in most browsers
```

### PointsNodeMaterial

Material for point clouds.

```javascript
import { PointsNodeMaterial, color, float } from 'three/tsl';

const material = new PointsNodeMaterial();
material.colorNode = color(1, 0, 0);
material.sizeNode = float(10);

// Size attenuation (perspective scaling)
material.sizeAttenuation = true;
```

## Material Properties

### Color Properties

```javascript
// Base color (albedo)
material.colorNode = color(1, 0.5, 0);

// Emissive (self-illumination)
material.emissiveNode = color(0.1, 0, 0);

// Combine color with texture
const baseTexture = texture(colorMap);
material.colorNode = baseTexture.mul(color(1, 0.5, 0));

// Gradient based on position
material.colorNode = mix(
  color(1, 0, 0),
  color(0, 0, 1),
  positionLocal.y.add(1).div(2)
);
```

### Surface Properties

```javascript
// Roughness (surface smoothness)
material.roughnessNode = float(0.5);

// With texture
const roughnessMap = texture(roughnessTex);
material.roughnessNode = roughnessMap;

// Metalness (metallic vs dielectric)
material.metalnessNode = float(1.0);

// With texture
const metallicMap = texture(metallicTex);
material.metalnessNode = metallicMap;

// Ambient occlusion
const aoMap = texture(aoTex);
material.aoNode = aoMap;
```

### Normal Mapping

```javascript
import { normalMap, texture } from 'three/tsl';

// Standard normal map
const normalTex = new THREE.TextureLoader().load('normal.jpg');
material.normalNode = normalMap(texture(normalTex));

// With custom scale
material.normalNode = normalMap(texture(normalTex), float(2.0));

// Animated normal map
const animatedUV = uv().add(vec2(timerLocal().mul(0.1), 0));
material.normalNode = normalMap(texture(normalTex, animatedUV));
```

### Transparency

```javascript
// Enable transparency
material.transparent = true;

// Opacity (0 = transparent, 1 = opaque)
material.opacityNode = float(0.5);

// With texture (alpha map)
const alphaMap = texture(alphaTex);
material.opacityNode = alphaMap.a;

// Gradient transparency
material.opacityNode = positionLocal.y.add(1).div(2);

// Fresnel transparency
const fresnel = float(1).sub(abs(dot(viewDirection, normalWorld)));
material.opacityNode = fresnel;
```

### Position Displacement

Modify vertex positions in vertex shader:

```javascript
import { positionLocal, normalLocal, sin, timerLocal } from 'three/tsl';

// Wave displacement
const wave = sin(
  positionLocal.y.mul(10).add(timerLocal().mul(2))
).mul(0.2);

material.positionNode = positionLocal.add(
  normalLocal.mul(wave)
);

// Explode effect
const explode = timerLocal().mul(0.1);
material.positionNode = positionLocal.add(normalLocal.mul(explode));

// Scale animation
const scale = sin(timerLocal()).mul(0.5).add(1.5);
material.positionNode = positionLocal.mul(scale);
```

## Custom Lighting

### Custom Light Model

```javascript
import {
  MeshStandardNodeMaterial,
  normalWorld,
  lightDirection,
  lightColor,
  max,
  dot,
  float
} from 'three/tsl';

const material = new MeshStandardNodeMaterial();

// Access light information
const diffuse = max(dot(normalWorld, lightDirection), float(0));
const customLighting = lightColor.mul(diffuse);

// Apply custom lighting
material.colorNode = color(1, 1, 1).mul(customLighting);
```

### Rim Lighting

```javascript
import { cameraPosition, normalWorld, positionWorld, pow } from 'three/tsl';

const viewDir = cameraPosition.sub(positionWorld).normalize();
const rimIntensity = float(1).sub(abs(dot(viewDir, normalWorld)));
const rim = pow(rimIntensity, 3).mul(2);

material.emissiveNode = color(0.5, 0.7, 1).mul(rim);
```

### Cel Shading (Custom)

```javascript
import { normalWorld, lightDirection, dot, floor } from 'three/tsl';

const diffuse = max(dot(normalWorld, lightDirection), float(0));
const steps = 4;
const stepped = floor(diffuse.mul(steps)).div(steps);

material.colorNode = color(1, 0.5, 0).mul(stepped);
```

## Texture Techniques

### Texture Blending

```javascript
// Blend two textures
const tex1 = texture(texture1);
const tex2 = texture(texture2);
const blendFactor = float(0.5);
material.colorNode = mix(tex1, tex2, blendFactor);

// Height-based blending
const heightBlend = positionLocal.y.add(1).div(2);
material.colorNode = mix(tex1, tex2, heightBlend);

// Normal-based blending
const normalBlend = normalWorld.y.mul(0.5).add(0.5);
material.colorNode = mix(tex1, tex2, normalBlend);
```

### Triplanar Mapping

```javascript
import { positionWorld, normalWorld, abs, texture } from 'three/tsl';

// Sample texture from all three axes
const texX = texture(map, positionWorld.yz);
const texY = texture(map, positionWorld.xz);
const texZ = texture(map, positionWorld.xy);

// Blend based on normal
const blendWeights = abs(normalWorld);
const blendSum = blendWeights.x.add(blendWeights.y).add(blendWeights.z);
const blend = blendWeights.div(blendSum);

material.colorNode = texX.mul(blend.x)
  .add(texY.mul(blend.y))
  .add(texZ.mul(blend.z));
```

### Parallax Mapping

```javascript
import { texture, uv, viewDirection, normalWorld } from 'three/tsl';

const heightMap = texture(heightTex);
const height = heightMap.r.mul(0.1); // Height scale

// Offset UVs based on view direction
const offsetUV = uv().add(
  viewDirection.xy.mul(height)
);

material.colorNode = texture(colorMap, offsetUV);
```

## Animation Techniques

### UV Animation

```javascript
import { uv, timerLocal } from 'three/tsl';

// Scrolling
const scrollSpeed = vec2(0.1, 0);
const scrollingUV = uv().add(timerLocal().mul(scrollSpeed));
material.colorNode = texture(map, scrollingUV);

// Rotation
const center = vec2(0.5, 0.5);
const angle = timerLocal();
const rotatedUV = uv().sub(center)
  .mul(mat2(
    cos(angle), sin(angle),
    sin(angle).negate(), cos(angle)
  ))
  .add(center);
material.colorNode = texture(map, rotatedUV);

// Pulsing scale
const scale = sin(timerLocal()).mul(0.5).add(1.5);
const scaledUV = uv().sub(center).mul(scale).add(center);
material.colorNode = texture(map, scaledUV);
```

### Color Animation

```javascript
import { sin, cos, timerLocal } from 'three/tsl';

// RGB cycle
material.colorNode = color(
  sin(timerLocal()).mul(0.5).add(0.5),
  sin(timerLocal().add(2.094)).mul(0.5).add(0.5), // 2π/3
  sin(timerLocal().add(4.189)).mul(0.5).add(0.5)  // 4π/3
);

// Hue shift
const hue = timerLocal().mul(0.5);
// Convert HSV to RGB (simplified)
```

### Morph Animation

```javascript
import { attribute, mix, sin, timerLocal } from 'three/tsl';

// Morph between two positions
const position1 = attribute('position');
const position2 = attribute('position2'); // Custom attribute

const morphFactor = sin(timerLocal()).mul(0.5).add(0.5);
material.positionNode = mix(position1, position2, morphFactor);
```

## Advanced Techniques

### Subsurface Scattering (Fake)

```javascript
import { normalWorld, lightDirection, viewDirection, pow } from 'three/tsl';

const NdotL = dot(normalWorld, lightDirection);
const VdotL = dot(viewDirection, lightDirection);

// Fake subsurface scattering
const subsurface = max(float(0), VdotL.mul(-1).add(NdotL)).pow(2);
const sssColor = color(1, 0.5, 0.3).mul(subsurface);

material.emissiveNode = sssColor;
```

### Anisotropic Reflection

```javascript
import { tangent, bitangent, normalWorld } from 'three/tsl';

// Anisotropic specular
const tangentDir = tangent.normalize();
const bitangentDir = bitangent.normalize();

// Custom anisotropic calculation
// (simplified example)
```

### Vertex Color Mixing

```javascript
import { attribute } from 'three/tsl';

const vertexColor = attribute('color');
const baseColor = color(1, 0.5, 0);

material.colorNode = baseColor.mul(vertexColor);
```

## Material Variants

### Creating Material Variants

```javascript
// Base material
const baseMaterial = new MeshStandardNodeMaterial();
baseMaterial.colorNode = color(1, 0, 0);
baseMaterial.roughnessNode = float(0.5);

// Create variant
const variantMaterial = baseMaterial.clone();
variantMaterial.colorNode = color(0, 0, 1);

// Share uniforms between variants
const sharedRoughness = uniform(0.5);
baseMaterial.roughnessNode = sharedRoughness;
variantMaterial.roughnessNode = sharedRoughness;
```

### Material Instancing

```javascript
// Create instances with different uniforms
const materials = [];
for (let i = 0; i < 10; i++) {
  const material = new MeshStandardNodeMaterial();
  const hue = uniform(i / 10);
  material.colorNode = color(hue, 1, 1); // HSL
  materials.push(material);
}
```

## Performance Optimization

### 1. Material Caching
```javascript
// Bad: Creating materials every frame
function render() {
  mesh.material = new MeshStandardNodeMaterial();
}

// Good: Reuse materials
const material = new MeshStandardNodeMaterial();
mesh.material = material;
```

### 2. Uniform Updates
```javascript
// Bad: Creating new uniforms
material.colorNode = uniform(new THREE.Color(1, 0, 0));

// Good: Update existing uniforms
const colorUniform = uniform(new THREE.Color());
material.colorNode = colorUniform;

function update() {
  colorUniform.value.setRGB(1, 0, 0);
}
```

### 3. Texture Management
```javascript
// Reuse textures
const textureLoader = new THREE.TextureLoader();
const textureCache = new Map();

function getTexture(url) {
  if (!textureCache.has(url)) {
    textureCache.set(url, textureLoader.load(url));
  }
  return textureCache.get(url);
}
```

### 4. Shader Compilation
```javascript
// Precompile materials
const materials = [material1, material2, material3];
materials.forEach(mat => {
  renderer.compile(scene, camera, mat);
});
```

## Debugging Materials

### Visualize Properties

```javascript
// Visualize normals
material.colorNode = normalWorld.mul(0.5).add(0.5);

// Visualize UVs
material.colorNode = vec3(uv(), 0);

// Visualize roughness
material.colorNode = vec3(material.roughnessNode);

// Visualize AO
material.colorNode = vec3(material.aoNode);
```

### Material Inspection

```javascript
// Log shader code
console.log(material.vertexShader);
console.log(material.fragmentShader);

// Check uniform values
console.log(material.uniforms);

// Material properties
console.log({
  transparent: material.transparent,
  side: material.side,
  depthWrite: material.depthWrite,
  depthTest: material.depthTest
});
```

## Common Material Recipes

### Glass Material
```javascript
const glass = new MeshPhysicalNodeMaterial();
glass.colorNode = color(1, 1, 1);
glass.roughnessNode = float(0);
glass.metalnessNode = float(0);
glass.transmissionNode = float(1);
glass.thicknessNode = float(1);
glass.iorNode = float(1.5);
```

### Metal Material
```javascript
const metal = new MeshStandardNodeMaterial();
metal.colorNode = color(0.8, 0.8, 0.8);
metal.roughnessNode = float(0.2);
metal.metalnessNode = float(1);
```

### Hologram Material
```javascript
const hologram = new MeshBasicNodeMaterial();
hologram.transparent = true;
hologram.side = THREE.DoubleSide;

const fresnel = float(1).sub(abs(dot(viewDirection, normalWorld)));
hologram.opacityNode = pow(fresnel, 2);
hologram.colorNode = color(0, 1, 1).mul(fresnel.mul(2));
```

### Water Material
```javascript
const water = new MeshPhysicalNodeMaterial();
water.colorNode = color(0, 0.3, 0.5);
water.roughnessNode = float(0);
water.metalnessNode = float(0);
water.transmissionNode = float(0.9);
water.iorNode = float(1.33);

// Animated normals for waves
const waveNormal = normalMap(
  texture(normalTex, uv().add(vec2(timerLocal().mul(0.05), 0)))
);
water.normalNode = waveNormal;
```
