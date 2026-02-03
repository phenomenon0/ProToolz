# Post Processing with TSL

Post-processing effects are screen-space effects applied after rendering the scene. With TSL, you can create custom effects using the node system.

## Basic Setup

```javascript
import { PostProcessing, pass } from 'three/tsl';
import WebGPURenderer from 'three/webgpu';

// Create renderer
const renderer = new WebGPURenderer();
await renderer.init();

// Create post processing
const postProcessing = new PostProcessing(renderer);

// Basic scene pass
postProcessing.outputNode = pass(scene, camera);

// Render loop
function animate() {
  postProcessing.render();
}
renderer.setAnimationLoop(animate);
```

## Built-in Effects

### Bloom

```javascript
import { pass } from 'three/tsl';

// Basic bloom
postProcessing.outputNode = pass(scene, camera)
  .bloom(0.5); // Intensity

// Configurable bloom
postProcessing.outputNode = pass(scene, camera)
  .bloom({
    intensity: 0.5,
    threshold: 0.8,
    radius: 1.0
  });
```

### Color Adjustments

```javascript
// Saturation
postProcessing.outputNode = pass(scene, camera)
  .saturation(1.2); // >1 = more saturated, <1 = less saturated

// Contrast
postProcessing.outputNode = pass(scene, camera)
  .contrast(1.1); // >1 = more contrast

// Brightness
postProcessing.outputNode = pass(scene, camera)
  .brightness(1.1); // >1 = brighter

// Hue shift
postProcessing.outputNode = pass(scene, camera)
  .hue(0.1); // Rotate hue

// Combine effects
postProcessing.outputNode = pass(scene, camera)
  .bloom(0.5)
  .saturation(1.2)
  .contrast(1.1)
  .hue(0.05);
```

### Blur

```javascript
// Gaussian blur
postProcessing.outputNode = pass(scene, camera)
  .gaussianBlur(2); // Blur radius

// Box blur
postProcessing.outputNode = pass(scene, camera)
  .boxBlur(3); // Blur radius
```

### Tone Mapping

```javascript
// ACES tone mapping
postProcessing.outputNode = pass(scene, camera)
  .toneMapping(THREE.ACESFilmicToneMapping);

// With exposure
postProcessing.outputNode = pass(scene, camera)
  .toneMapping(THREE.ACESFilmicToneMapping, 1.0); // exposure
```

## Custom Effects

### Vignette

```javascript
import { pass, uv, length, float } from 'three/tsl';

const scenePass = pass(scene, camera);
const uvCoord = uv();

// Calculate distance from center
const distFromCenter = length(uvCoord.sub(0.5));

// Vignette strength
const vignetteStrength = 0.5;
const vignette = float(1).sub(distFromCenter.mul(vignetteStrength));

// Apply vignette
postProcessing.outputNode = scenePass.mul(vignette);
```

### Grayscale

```javascript
import { pass, dot, vec3 } from 'three/tsl';

const scenePass = pass(scene, camera);

// Luminance weights
const luminance = dot(scenePass.rgb, vec3(0.299, 0.587, 0.114));

postProcessing.outputNode = vec4(luminance, luminance, luminance, scenePass.a);
```

### Sepia

```javascript
import { pass, vec3, clamp } from 'three/tsl';

const scenePass = pass(scene, camera);
const color = scenePass.rgb;

const r = dot(color, vec3(0.393, 0.769, 0.189));
const g = dot(color, vec3(0.349, 0.686, 0.168));
const b = dot(color, vec3(0.272, 0.534, 0.131));

const sepia = vec3(r, g, b);
postProcessing.outputNode = vec4(clamp(sepia, 0, 1), scenePass.a);
```

### Invert Colors

```javascript
import { pass, float } from 'three/tsl';

const scenePass = pass(scene, camera);
const inverted = float(1).sub(scenePass.rgb);

postProcessing.outputNode = vec4(inverted, scenePass.a);
```

### Pixelation

```javascript
import { pass, uv, floor } from 'three/tsl';

const scenePass = pass(scene, camera);
const pixelSize = 8;

// Pixelate UVs
const pixelUV = floor(uv().mul(pixelSize)).div(pixelSize);

postProcessing.outputNode = scenePass.getTextureNode(pixelUV);
```

### Chromatic Aberration

```javascript
import { pass, uv, vec2, vec4, texture } from 'three/tsl';

const scenePass = pass(scene, camera);
const uvCoord = uv();

// Offset for each channel
const strength = 0.002;
const rOffset = vec2(strength, 0);
const bOffset = vec2(-strength, 0);

// Sample each channel separately
const r = scenePass.getTextureNode(uvCoord.add(rOffset)).r;
const g = scenePass.g;
const b = scenePass.getTextureNode(uvCoord.add(bOffset)).b;

postProcessing.outputNode = vec4(r, g, b, scenePass.a);
```

### Edge Detection (Sobel)

```javascript
import { pass, uv, texture, length } from 'three/tsl';

const scenePass = pass(scene, camera);
const texelSize = vec2(1.0 / window.innerWidth, 1.0 / window.innerHeight);

// Sample surrounding pixels
const tl = scenePass.getTextureNode(uv().add(texelSize.mul(vec2(-1, -1))));
const tc = scenePass.getTextureNode(uv().add(texelSize.mul(vec2(0, -1))));
const tr = scenePass.getTextureNode(uv().add(texelSize.mul(vec2(1, -1))));
const cl = scenePass.getTextureNode(uv().add(texelSize.mul(vec2(-1, 0))));
const cr = scenePass.getTextureNode(uv().add(texelSize.mul(vec2(1, 0))));
const bl = scenePass.getTextureNode(uv().add(texelSize.mul(vec2(-1, 1))));
const bc = scenePass.getTextureNode(uv().add(texelSize.mul(vec2(0, 1))));
const br = scenePass.getTextureNode(uv().add(texelSize.mul(vec2(1, 1))));

// Sobel operator
const sobelX = tl.rgb.add(cl.rgb.mul(2)).add(bl.rgb)
  .sub(tr.rgb).sub(cr.rgb.mul(2)).sub(br.rgb);

const sobelY = tl.rgb.add(tc.rgb.mul(2)).add(tr.rgb)
  .sub(bl.rgb).sub(bc.rgb.mul(2)).sub(br.rgb);

const edge = length(sobelX).add(length(sobelY));

postProcessing.outputNode = vec4(vec3(edge), 1);
```

### Film Grain

```javascript
import { pass, uv, timerGlobal, fract, sin, dot } from 'three/tsl';

const scenePass = pass(scene, camera);
const uvCoord = uv();

// Random noise function
const rand = fract(
  sin(dot(uvCoord.add(timerGlobal()), vec2(12.9898, 78.233)))
    .mul(43758.5453)
);

// Add grain
const grainStrength = 0.1;
const grain = rand.mul(grainStrength);

postProcessing.outputNode = scenePass.add(grain);
```

### Glitch Effect

```javascript
import { pass, uv, timerGlobal, fract, sin, floor } from 'three/tsl';

const scenePass = pass(scene, camera);
const time = timerGlobal();

// Random glitch lines
const glitchLine = floor(uv().y.mul(100).add(time.mul(10)));
const glitchRandom = fract(sin(glitchLine).mul(43758.5453));

// Apply horizontal offset to random lines
const glitchAmount = 0.02;
const shouldGlitch = glitchRandom.greaterThan(0.98);
const offset = If(
  shouldGlitch,
  vec2(glitchRandom.mul(glitchAmount), 0),
  vec2(0, 0)
);

postProcessing.outputNode = scenePass.getTextureNode(uv().add(offset));
```

## Multi-Pass Effects

### Separate Render Passes

```javascript
import { pass, PassNode } from 'three/tsl';

// First pass: Render scene
const scenePass = pass(scene, camera);

// Second pass: Blur
const blurPass = scenePass.gaussianBlur(2);

// Third pass: Combine original and blurred
const finalPass = scenePass.mul(0.7).add(blurPass.mul(0.3));

postProcessing.outputNode = finalPass;
```

### Depth-of-Field

```javascript
import { pass, texture, uniform, mix, smoothstep } from 'three/tsl';

const scenePass = pass(scene, camera);
const depthPass = pass(scene, camera, { depthTexture: true });
const blurredPass = scenePass.gaussianBlur(5);

// Focus parameters
const focusDistance = uniform(5.0);
const focusRange = uniform(2.0);

// Calculate blur amount based on depth
const depth = depthPass.depth;
const blurAmount = smoothstep(
  focusDistance.sub(focusRange),
  focusDistance.add(focusRange),
  depth
);

// Mix sharp and blurred based on depth
postProcessing.outputNode = mix(scenePass, blurredPass, blurAmount);
```

### Selective Bloom

```javascript
import { pass, PassNode, vec4, greaterThan, mix } from 'three/tsl';

// Render bright areas to separate pass
const brightPass = pass(scene, camera).mul(
  greaterThan(pass(scene, camera).rgb, vec3(0.8))
);

// Blur bright areas
const bloomPass = brightPass.gaussianBlur(5).mul(2);

// Combine with original scene
const scenePass = pass(scene, camera);
postProcessing.outputNode = scenePass.add(bloomPass);
```

## Animated Effects

### Animated Vignette

```javascript
import { timerLocal, sin } from 'three/tsl';

const scenePass = pass(scene, camera);
const time = timerLocal();

// Pulsing vignette
const vignetteStrength = sin(time).mul(0.2).add(0.5);
const vignette = float(1).sub(
  length(uv().sub(0.5)).mul(vignetteStrength)
);

postProcessing.outputNode = scenePass.mul(vignette);
```

### Scan Lines

```javascript
import { uv, sin, timerLocal, mod } from 'three/tsl';

const scenePass = pass(scene, camera);
const uvCoord = uv();
const time = timerLocal();

// Moving scan lines
const scanLine = sin(uvCoord.y.mul(500).sub(time.mul(10)));
const scanEffect = scanLine.mul(0.1).add(0.9);

postProcessing.outputNode = scenePass.mul(scanEffect);
```

### Color Shift Animation

```javascript
import { timerLocal, sin, cos } from 'three/tsl';

const scenePass = pass(scene, camera);
const time = timerLocal();

// Animate color channels
const r = scenePass.r.mul(sin(time).mul(0.2).add(1));
const g = scenePass.g.mul(cos(time.add(2.094)).mul(0.2).add(1));
const b = scenePass.b.mul(sin(time.add(4.189)).mul(0.2).add(1));

postProcessing.outputNode = vec4(r, g, b, scenePass.a);
```

## Screen Space Effects

### Screen Space Reflections

```javascript
import { pass, uv, normalView, positionView } from 'three/tsl';

const scenePass = pass(scene, camera);
const normalPass = pass(scene, camera, { normalTexture: true });
const depthPass = pass(scene, camera, { depthTexture: true });

// Calculate reflection UV
const normal = normalPass.rgb;
const viewDir = normalize(positionView.negate());
const reflected = reflect(viewDir, normal);

// Sample scene at reflected position
// (simplified - full SSR is more complex)
const reflectionUV = uv().add(reflected.xy.mul(0.1));
const reflection = scenePass.getTextureNode(reflectionUV);

// Mix with original scene
postProcessing.outputNode = mix(scenePass, reflection, 0.3);
```

### Screen Space Ambient Occlusion (SSAO)

```javascript
// SSAO requires multiple samples and depth comparisons
// This is a simplified example

import { pass, uv, texture } from 'three/tsl';

const scenePass = pass(scene, camera);
const depthPass = pass(scene, camera, { depthTexture: true });

// Sample depth at multiple offsets
const texelSize = vec2(1.0 / window.innerWidth, 1.0 / window.innerHeight);
const offsets = [
  vec2(-1, -1), vec2(0, -1), vec2(1, -1),
  vec2(-1, 0), vec2(1, 0),
  vec2(-1, 1), vec2(0, 1), vec2(1, 1)
];

let occlusion = float(0);
offsets.forEach(offset => {
  const sampleDepth = depthPass.getTextureNode(
    uv().add(offset.mul(texelSize))
  ).r;
  const depthDiff = abs(depthPass.r.sub(sampleDepth));
  occlusion = occlusion.add(step(depthDiff, 0.01));
});

const ao = occlusion.div(offsets.length);
postProcessing.outputNode = scenePass.mul(ao);
```

## Performance Optimization

### Use Render Targets

```javascript
import { RenderTarget } from 'three';

// Create smaller render target for expensive effects
const halfRes = new RenderTarget(
  window.innerWidth / 2,
  window.innerHeight / 2
);

// Use for bloom, blur, etc.
```

### Optimize Blur

```javascript
// Two-pass blur is faster than single-pass
const horizontalBlur = scenePass.blur(vec2(pixelSize.x, 0));
const verticalBlur = horizontalBlur.blur(vec2(0, pixelSize.y));
```

### Conditional Effects

```javascript
import { uniform, If } from 'three/tsl';

const enableBloom = uniform(true);
const scenePass = pass(scene, camera);

postProcessing.outputNode = If(
  enableBloom,
  scenePass.bloom(0.5),
  scenePass
);
```

## Debugging

### Visualize Passes

```javascript
// Show just the bloom pass
postProcessing.outputNode = pass(scene, camera).bloom(0.5);

// Show just depth
const depthPass = pass(scene, camera, { depthTexture: true });
postProcessing.outputNode = vec4(vec3(depthPass.r), 1);

// Show normals
const normalPass = pass(scene, camera, { normalTexture: true });
postProcessing.outputNode = vec4(normalPass.rgb.mul(0.5).add(0.5), 1);
```

### Split Screen

```javascript
import { uv, If } from 'three/tsl';

const scenePass = pass(scene, camera);
const processedPass = scenePass.bloom(0.5);

// Show original on left, processed on right
postProcessing.outputNode = If(
  uv().x.lessThan(0.5),
  scenePass,
  processedPass
);
```

## Common Effect Combinations

### Cinematic Look

```javascript
postProcessing.outputNode = pass(scene, camera)
  .bloom(0.3)
  .saturation(0.9)
  .contrast(1.2)
  .vignette(0.4);
```

### Retro/VHS Look

```javascript
const scenePass = pass(scene, camera);

postProcessing.outputNode = scenePass
  .saturation(1.3)
  .contrast(1.1)
  .add(filmGrain)
  .mul(scanLines);
```

### Cyberpunk Look

```javascript
postProcessing.outputNode = pass(scene, camera)
  .bloom(0.8)
  .saturation(1.5)
  .chromaticAberration(0.003)
  .add(scanLines)
  .add(glitch);
```

### Dreamy/Soft Look

```javascript
const scenePass = pass(scene, camera);
const blurred = scenePass.gaussianBlur(3);

postProcessing.outputNode = mix(scenePass, blurred, 0.3)
  .saturation(1.2)
  .brightness(1.1);
```

## Best Practices

1. **Order effects carefully** - Apply effects in the right order for desired look
2. **Use lower resolution** - For expensive effects like blur
3. **Cache render targets** - Reuse targets when possible
4. **Minimize texture reads** - Each texture sample has a cost
5. **Use built-in effects** - When available, built-ins are optimized
6. **Profile performance** - Use browser DevTools to identify bottlenecks
7. **Provide toggles** - Allow users to disable effects for performance
8. **Test on target hardware** - Mobile devices have different performance characteristics
