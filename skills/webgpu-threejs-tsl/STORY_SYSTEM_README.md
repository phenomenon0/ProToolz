# Story System - Scroll-Driven Cinematic Experiences

**Shopify Winter '26 RenAIssance Quality Storytelling for Three.js**

Transform scroll interactions into cinematic visual narratives. Create Shopify-quality experiences through JSON configuration - no code required.

## Overview

The Story System is a declarative framework for building scroll-driven 3D experiences. It evolved the existing WebGPU-Three.js-TSL skill from a basic asset loading system into a complete cinematic storytelling platform.

**Key Features:**
- 📜 **JSON-Driven**: Define entire experiences through configuration
- 🎬 **Scroll Orchestration**: Smooth scroll-to-animation mapping
- 🧩 **Reusable Blocks**: Compose scenes from pre-built components
- ⚡ **Performance-First**: Predictive prefetch, smart disposal, GPU budgeting
- ♿ **Accessible**: prefers-reduced-motion support, semantic HTML
- 🌐 **CDN-Compatible**: WebGL renderer for broad compatibility

## Quick Start

### 1. Register Blocks

```javascript
import { BlockRegistry } from './scene-blocks/BlockRegistry.js';
import { HeroPaintingBlock } from './scene-blocks/HeroPaintingBlock.js';

BlockRegistry.register('HeroPaintingBlock', HeroPaintingBlock);
```

### 2. Create Story JSON

```json
{
  "version": "1.0.0",
  "catalogs": ["./assets/catalogs/renaissance.catalog.json"],
  "sections": [
    {
      "id": "hero",
      "block": "HeroPaintingBlock",
      "assets": {
        "portrait": "img/hero-portrait",
        "frame": "model/ornate-frame-a"
      },
      "timeline": [
        { "t": 0.0, "cameraZ": 8.0, "halo": 0.0 },
        { "t": 1.0, "cameraZ": 3.0, "halo": 1.0 }
      ]
    }
  ]
}
```

### 3. Setup HTML

```html
<canvas id="story-canvas"></canvas>

<div class="story-container">
  <section data-section-id="hero">
    <h2>The Portrait</h2>
  </section>
</div>

<script type="module">
  import { StoryRunner } from './story/StoryRunner.js';

  const runner = new StoryRunner('./story.json', {
    canvasSelector: '#story-canvas',
    containerSelector: '.story-container',
    debugMode: true
  });

  await runner.init();
</script>
```

## Architecture

### 100% Additive Design

All existing asset library functionality remains unchanged. The story system is built **on top** as a new layer:

```
Story System (NEW)
├── story/               - Scroll orchestration
│   ├── StoryRunner.js   - Main orchestrator
│   ├── ScrollDriver.js  - Scroll → progress mapping
│   ├── Timeline.js      - Keyframe interpolation
│   └── ...
├── scene-blocks/        - Reusable components
│   ├── HeroPaintingBlock.js
│   ├── CloudLayerBlock.js
│   └── ...
└── Asset Library (EXISTING - Unchanged)
    ├── AssetLibrary.js
    ├── loaders/         - Extended with 3 new loaders
    └── catalogs/        - New renaissance.catalog.json
```

### Core Components

**StoryRunner** - Main orchestrator
- Loads story JSON
- Manages Three.js scene/camera/renderer
- Coordinates scroll, prefetch, disposal
- Handles render loop

**ScrollDriver** - Scroll detection
- Maps viewport scroll to section progress (0..1)
- Emits section-enter, section-exit, section-progress events
- Handles reduced motion preferences

**Timeline** - Animation interpolation
- Evaluates keyframes at given progress
- Supports multiple value types (number, vec3, color, quaternion)
- Applies easing functions

**BlockRegistry** - Block factory
- Register/retrieve block types
- Validates block exists before instantiation

**BaseBlock** - Block contract
- Lifecycle: mount → update → dispose
- Automatic resource tracking
- Helper methods for common operations

## File Structure

```
webgpu-threejs-tsl/
├── story/                          (NEW - 9 files)
│   ├── StoryRunner.js
│   ├── ScrollDriver.js
│   ├── Timeline.js
│   ├── Easing.js
│   ├── PrefetchManager.js
│   ├── MemoryBudget.js
│   ├── ReducedMotionHandler.js
│   ├── StoryDebugger.js
│   └── story.schema.json
├── scene-blocks/                   (NEW - 6 files)
│   ├── BlockRegistry.js
│   ├── BaseBlock.js
│   ├── HeroPaintingBlock.js
│   ├── CloudLayerBlock.js
│   ├── OrnateFrameRevealBlock.js
│   └── FeatureRailBlock.js
├── assets/                         (EXISTING + extensions)
│   ├── AssetLibrary.js            (MINIMAL EDIT - 3 new loaders)
│   ├── loaders/
│   │   ├── TextureAssetLoader.js  (existing)
│   │   ├── EnvironmentAssetLoader.js (existing)
│   │   ├── ModelAssetLoader.js    (existing)
│   │   ├── ImageAssetLoader.js    (NEW)
│   │   ├── DepthMapAssetLoader.js (NEW)
│   │   └── AlphaMaskAssetLoader.js (NEW)
│   └── catalogs/
│       ├── core.catalog.json      (existing)
│       └── renaissance.catalog.json (NEW)
├── examples/                       (NEW demos)
│   ├── renaissance-scrollytell.html
│   └── renaissance.story.json
└── docs/                           (NEW guides)
    ├── story-authoring-guide.md
    └── block-development-guide.md
```

**Summary**: 23 new files, 2 minimal edits, 12 unchanged files

## Built-in Blocks

### HeroPaintingBlock

Hero section with portrait, glowing halo, clouds, and ornate frame.

**Features:**
- Depth-map parallax (2.5D effect)
- Pulsing halo with rotation shimmer
- Multi-layer drifting clouds
- Frame scale/rotate reveal

**Timeline Properties:**
- `cameraZ`: Camera position
- `halo`: Halo opacity
- `frameScale`: Frame scale
- `frameRotation`: Frame rotation

### CloudLayerBlock

Multiple semi-transparent cloud layers with parallax drift.

**Features:**
- Configurable layer count
- Independent drift speeds
- Depth-based positioning

**Timeline Properties:**
- `cloudOpacity`: Overall opacity

### FeatureRailBlock

Horizontal parallax card rail.

**Features:**
- Variable parallax per card
- Optional border frames
- Configurable spacing and sizing

**Timeline Properties:**
- `railOpacity`: Overall opacity
- `railScale`: Scale multiplier

### OrnateFrameRevealBlock

Frame pieces that slide/rotate into position with staggered timing.

**Features:**
- Piece identification (corners, edges)
- Directional entrance animations
- Ease-out cubic motion

## Performance Features

### Predictive Prefetch

Assets load ahead of scroll:

```json
"performance": {
  "prefetchThreshold": 0.6
}
```

When section progress reaches 60%, next section's assets start loading.

### Smart Disposal

Old sections auto-dispose:

```json
"performance": {
  "disposeDistance": 2
}
```

Sections 2+ behind current are disposed, freeing GPU memory.

### GPU Memory Budgeting

```json
"performance": {
  "budgetMB": 512
}
```

Tracks and enforces memory limits. Prevents mobile crashes.

### Concurrency Control

```json
"performance": {
  "maxConcurrentLoads": 3
}
```

Prevents bandwidth saturation while loading assets.

## Accessibility

### Reduced Motion

Automatically detected and handled:

```javascript
matchMedia('(prefers-reduced-motion: reduce)');
```

When enabled:
- Timeline snaps to keyframes (no interpolation)
- Animations become instant transitions
- Respects user preferences

### Semantic HTML

Story sections use semantic markup:

```html
<section data-section-id="hero">
  <h2>Section Title</h2>
  <p>Description</p>
</section>
```

Screen readers and keyboard navigation work naturally.

## Debug Tools

### StoryDebugger

Real-time overlay (press 'D' to toggle):

```javascript
new StoryRunner('story.json', {
  debugMode: true
});
```

**Displays:**
- Active section ID
- Progress percentage
- Memory usage
- Prefetch queue size
- FPS counter

## Examples

### Complete Demo

See `examples/renaissance-scrollytell.html` for full working example:

```bash
# Serve locally
npx http-server . -p 8080

# Open in browser
http://localhost:8080/examples/renaissance-scrollytell.html
```

### Story JSON

See `examples/renaissance.story.json` for complete configuration example.

## Documentation

- **[Story Authoring Guide](./docs/story-authoring-guide.md)** - Create experiences
- **[Block Development Guide](./docs/block-development-guide.md)** - Build blocks
- **[Asset Library Guide](./docs/asset-library.md)** - Manage assets

## Browser Compatibility

**Supported:**
- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari 14+, Chrome Android)

**Requirements:**
- ES6 modules
- IntersectionObserver API
- Cache Storage API (optional, for asset caching)

## Critical Implementation Details

### WebGL vs WebGPU

Uses WebGL renderer for CDN compatibility:

```javascript
const renderer = new THREE.WebGLRenderer({ antialias: true });
```

WebGPU import issues with CDN prevented using `three/webgpu`.

### Scroll Progress Calculation

```javascript
const sectionScrollStart = top - viewportHeight;
const sectionScrollEnd = top + height;
const scrollRange = sectionScrollEnd - sectionScrollStart;
const progress = (scrollY - sectionScrollStart) / scrollRange;
```

Progress normalized to 0..1 for each section.

### Asset Type Dispatch

StoryRunner dispatches to appropriate loader based on asset type:

```javascript
switch (asset.type) {
  case 'model': return await assetLibrary.getModel(id);
  case 'image': return await assetLibrary.getImage(id);
  case 'depth-map': return await assetLibrary.getDepthMap(id);
  // ...
}
```

## Success Metrics

**Performance:**
- ✅ 60 FPS desktop (Chrome/Firefox/Safari)
- ✅ 30 FPS minimum mobile
- ✅ Prefetch completes before section entry
- ✅ Memory stays within budget

**Developer Experience:**
- ✅ New block creation < 100 lines
- ✅ Story JSON authoring < 30 minutes
- ✅ Comprehensive documentation

**Accessibility:**
- ✅ Keyboard navigation
- ✅ Reduced motion support
- ✅ Semantic HTML structure

## API Reference

### StoryRunner

```javascript
const runner = new StoryRunner(storyConfigOrUrl, options);
await runner.init();
runner.destroy();
```

**Options:**
- `canvasSelector`: CSS selector for canvas (default: '#story-canvas')
- `containerSelector`: CSS selector for container (default: '.story-container')
- `debugMode`: Enable debug overlay (default: false)

### BlockRegistry

```javascript
BlockRegistry.register(name, BlockClass);
BlockRegistry.get(name);
BlockRegistry.has(name);
BlockRegistry.list();
```

### BaseBlock

```javascript
class CustomBlock extends BaseBlock {
  static requiredAssets(params) { /* ... */ }
  async mount({ scene, camera, renderer, assets, params }) { /* ... */ }
  update({ progress, time, viewport, state }) { /* ... */ }
  dispose() { /* ... */ }
}
```

## Troubleshooting

### Section Not Activating

- Verify HTML element has `data-section-id` matching story JSON
- Check element is in viewport
- Enable debug mode to see active section

### Assets Not Loading

- Check catalog URLs are correct (relative to story JSON location)
- Verify asset IDs exist in catalog
- Check browser console for errors
- Enable network tab to see failed requests

### Performance Issues

- Reduce `budgetMB` for mobile
- Increase `disposeDistance` if memory allows
- Check FPS in debug overlay
- Profile with Chrome DevTools

### Memory Leaks

- Ensure all blocks call `super.dispose()`
- Use `addObject()` and `trackDisposable()` in blocks
- Check for removed event listeners
- Monitor memory in browser DevTools

## License

MIT

## Credits

Built on top of the WebGPU-Three.js-TSL skill asset library.

Inspired by Shopify Winter '26 RenAIssance cinematic scroll experiences.
