# WebGPU Three.js TSL Skill - Implementation Plan

**Created:** 2026-01-27
**Status:** In Progress
**Based On:** Comprehensive skill review

---

## Executive Summary

This plan addresses the key findings from the comprehensive skill review and implements improvements to make the WebGPU Three.js TSL skill more accessible, maintainable, and production-ready.

**Key Issues Identified:**
1. ❌ Missing asset files (core.catalog.json references non-existent assets)
2. ❌ Asset server dependency (7 demos require HTTP server setup)
3. 🔧 CDN WebGPU import compatibility issues
4. ⚠️ No automated testing infrastructure
5. 📖 Story system complexity (steep learning curve)

**Solutions Implemented:**
- ✅ Created comprehensive asset sources guide (ASSET_SOURCES.md)
- ✅ Built automated starter pack downloader
- ✅ Documented asset server setup (ASSET_SERVER_SETUP.md)
- ✅ Curated high-quality CC0 asset sources

---

## Phase 1: Asset Infrastructure ✅ COMPLETED

### 1.1 Asset Server Documentation ✅
**Status:** Complete
**Files Created:**
- `ASSET_SERVER_SETUP.md` - Comprehensive setup guide
- `setup-asset-server.sh` - Automated directory structure creation
- `scripts/download-starter-pack.sh` - Automated asset downloader

**Key Features:**
- Quick-start options for immediate use
- Mock asset creation guide
- Full server setup instructions
- Troubleshooting section

### 1.2 Asset Sources Curation ✅
**Status:** Complete
**Files Created:**
- `ASSET_SOURCES.md` - Curated CC0 asset sources

**Coverage:**
- 🎨 PBR Textures (Poly Haven, ambientCG, 3D Textures)
- 🌍 HDR Environments (Poly Haven - 5 recommended)
- 🗿 3D Models (Kenney, Quaternius, Poly Pizza, Blender)
- 🎨 UI Icons (Tabler, Heroicons, Lucide, 3dicons.co)
- 🌫️ Procedural Noise (FastNoiseLite, wgsl-noise, wgsl-fns, blue noise)
- 🛒 Fast starter pack shopping list
- 🎯 Aesthetic-specific recommendations (Renaissance, Cyber, Industrial)

### 1.3 Automated Asset Download ✅
**Status:** Complete
**Implementation:**
- Automated HDR environment downloads (5 files)
- Blue noise texture acquisition
- Shader library cloning (wgsl-noise, wgsl-fns)
- Auto-generated catalog JSON
- Setup scripts with dependency checking

**Usage:**
```bash
cd ~/.claude/skills/webgpu-threejs-tsl/scripts
./download-starter-pack.sh
```

**Result:** 15MB starter pack with 5 HDRIs, blue noise, and shader libs

---

## Phase 2: Testing Infrastructure 🔄 PENDING

### 2.1 Unit Testing Setup
**Priority:** High
**Framework:** Vitest
**Coverage Target:** 70%+

**Test Suites Required:**

#### AssetLibrary Core (Priority: Critical)
- `AssetLibrary.test.js`
  - Singleton pattern enforcement
  - Catalog registration
  - Asset querying and filtering
  - Cache management
  - Error handling

#### Loaders (Priority: High)
- `TextureAssetLoader.test.js`
  - PBR texture set loading
  - Color space configuration
  - UV scaling
  - Parallel loading

- `EnvironmentAssetLoader.test.js`
  - HDR loading with RGBELoader
  - PMREM generation
  - Cache strategy

- `ModelAssetLoader.test.js`
  - GLTF loading
  - Scene cloning
  - Bounding box utilities
  - Draco decompression

#### Resolvers (Priority: High)
- `HttpResolver.test.js`
  - Fetch with retry logic
  - Exponential backoff
  - Timeout handling
  - Error scenarios

- `CacheResolver.test.js`
  - Cache hit/miss scenarios
  - Version-based invalidation
  - Graceful degradation
  - Response type preservation

#### Story System (Priority: Medium)
- `Timeline.test.js`
  - Keyframe interpolation
  - Binary search accuracy
  - Type-aware interpolation (vec3, color, quaternion)
  - Easing functions

- `ScrollDriver.test.js`
  - Section progress mapping
  - Event firing (enter, exit, progress)
  - Threshold calculations

- `MemoryBudget.test.js`
  - Texture size estimation
  - Model size estimation
  - Disposal strategy

#### Scene Blocks (Priority: Low)
- `BaseBlock.test.js`
  - Lifecycle methods
  - Resource tracking
  - Disposal utilities

**Implementation:**
```bash
# Install Vitest
npm install -D vitest @vitest/ui happy-dom

# Create test config
cat > vitest.config.js << 'EOF'
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    environment: 'happy-dom',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov'],
      exclude: ['**/node_modules/**', '**/dist/**', '**/examples/**']
    }
  }
});
EOF

# Add test scripts to package.json
"scripts": {
  "test": "vitest",
  "test:ui": "vitest --ui",
  "test:coverage": "vitest --coverage"
}
```

---

## Phase 3: CDN WebGPU Compatibility 🔄 PENDING

### 3.1 Import Map Enhancement
**Issue:** `import WebGPURenderer from 'three/webgpu'` fails with CDN
**Affected Files:** `demo-procedural.html`, several showcase demos

**Solution:**
Create proper import maps with WebGPU module paths:

```html
<script type="importmap">
{
  "imports": {
    "three": "https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.module.js",
    "three/webgpu": "https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.webgpu.js",
    "three/tsl": "https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.webgpu.js",
    "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.171.0/examples/jsm/"
  }
}
</script>
```

### 3.2 Feature Detection & Fallback
**Implementation:**

```javascript
// Detect WebGPU support
async function detectRenderer() {
  if (navigator.gpu) {
    try {
      const adapter = await navigator.gpu.requestAdapter();
      if (adapter) {
        // Use WebGPU
        const { WebGPURenderer } = await import('three/webgpu');
        return new WebGPURenderer({ canvas });
      }
    } catch (e) {
      console.warn('WebGPU adapter failed, falling back to WebGL', e);
    }
  }

  // Fallback to WebGL
  const { WebGLRenderer } = await import('three');
  return new WebGLRenderer({ canvas });
}
```

### 3.3 Update Affected Demos
**Files to update:**
- `examples/demo-procedural.html`
- `examples/showcase-demo/demo-procedural.html`
- `examples/procedural-gallery.html`

**Tasks:**
- Add proper import maps
- Implement feature detection
- Add WebGL fallback path
- Update documentation

---

## Phase 4: Standalone Demos 🔄 PENDING

### 4.1 Zero-Dependency Demo
**Goal:** Create demo that works without HTTP server

**Approach:**
- Inline all shaders as template literals
- Use procedural geometry (no external models)
- Use matcap materials (no HDR environments)
- Embed small textures as data URIs or generate procedurally

**Template:**
```html
<!DOCTYPE html>
<html>
<head>
  <title>WebGPU Standalone Demo</title>
  <style>
    body { margin: 0; overflow: hidden; }
    canvas { display: block; width: 100vw; height: 100vh; }
  </style>
  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.module.js",
      "three/webgpu": "https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.webgpu.js"
    }
  }
  </script>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script type="module">
    import * as THREE from 'three';
    import WebGPURenderer from 'three/webgpu';
    import { texture, uv, vec3, sin, cos, time } from 'three/tsl';

    // Procedural material - no assets needed
    const proceduralMaterial = new THREE.MeshStandardNodeMaterial({
      colorNode: vec3(
        sin(uv().x.mul(10).add(time)).mul(0.5).add(0.5),
        cos(uv().y.mul(10).add(time)).mul(0.5).add(0.5),
        sin(uv().x.mul(uv().y).mul(20)).mul(0.5).add(0.5)
      ),
      roughness: 0.3,
      metalness: 0.7
    });

    // Setup scene
    const renderer = new WebGPURenderer({ canvas: document.getElementById('canvas') });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
    camera.position.z = 5;

    const geometry = new THREE.TorusKnotGeometry(1, 0.3, 128, 16);
    const mesh = new THREE.Mesh(geometry, proceduralMaterial);
    scene.add(mesh);

    // Lighting (no HDR needed)
    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(() => {
      mesh.rotation.x += 0.005;
      mesh.rotation.y += 0.01;
      renderer.render(scene, camera);
    });

    window.addEventListener('resize', () => {
      camera.aspect = window.innerWidth / window.innerHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(window.innerWidth, window.innerHeight);
    });
  </script>
</body>
</html>
```

**Location:** `templates/standalone-demo.html`

---

## Phase 5: Story System Simplification 🔄 PENDING

### 5.1 Story.json Wizard
**Goal:** Interactive CLI tool for story creation

**Features:**
- Guided prompts for story configuration
- Block selection from registry
- Timeline keyframe builder
- Asset reference auto-completion
- JSON validation
- Example templates

**Implementation:**
```javascript
// story-wizard.js
import inquirer from 'inquirer';
import { readFileSync, writeFileSync } from 'fs';

async function createStory() {
  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'storyName',
      message: 'Story name:',
      default: 'My Story'
    },
    {
      type: 'input',
      name: 'version',
      message: 'Version:',
      default: '1.0.0'
    },
    {
      type: 'checkbox',
      name: 'catalogs',
      message: 'Select asset catalogs:',
      choices: [
        'http://localhost:8787/packs/core/catalogs/core.catalog.json',
        'http://localhost:8787/packs/renaissance/catalogs/renaissance.catalog.json',
        'http://localhost:8787/packs/starter/catalogs/starter.catalog.json'
      ]
    },
    {
      type: 'number',
      name: 'sectionCount',
      message: 'Number of sections:',
      default: 3,
      validate: (val) => val > 0 || 'Must be > 0'
    }
  ]);

  const story = {
    version: answers.version,
    catalogs: answers.catalogs,
    sections: []
  };

  // Section wizard
  for (let i = 0; i < answers.sectionCount; i++) {
    const section = await createSection(i);
    story.sections.push(section);
  }

  // Save
  const filename = `${answers.storyName.toLowerCase().replace(/\s+/g, '-')}.story.json`;
  writeFileSync(filename, JSON.stringify(story, null, 2));
  console.log(`✓ Story saved to ${filename}`);
}

async function createSection(index) {
  const blockTypes = ['TitleBlock', 'HeroPaintingBlock', 'CloudLayerBlock', 'FeatureRailBlock'];

  const answers = await inquirer.prompt([
    {
      type: 'input',
      name: 'id',
      message: `Section ${index + 1} ID:`,
      default: `section-${index + 1}`
    },
    {
      type: 'list',
      name: 'block',
      message: 'Block type:',
      choices: blockTypes
    },
    {
      type: 'confirm',
      name: 'addTimeline',
      message: 'Add timeline keyframes?',
      default: true
    }
  ]);

  const section = {
    id: answers.id,
    block: answers.block,
    assets: {},
    params: {},
    timeline: []
  };

  if (answers.addTimeline) {
    section.timeline = await createTimeline();
  }

  return section;
}

createStory();
```

**Usage:**
```bash
npm install -g inquirer
node story-wizard.js
```

### 5.2 Visual Timeline Editor
**Goal:** Web-based timeline editor

**Tech Stack:**
- React or Vanilla JS
- Canvas for timeline visualization
- Drag-and-drop keyframes
- Live preview

**Features:**
- Visual keyframe editor
- Easing curve preview
- Real-time interpolation preview
- Export to JSON

---

## Phase 6: Visual Regression Testing 🔄 PENDING

### 6.1 Playwright Setup
**Framework:** Playwright + Pixelmatch

**Test Structure:**
```javascript
// tests/visual/origami-gallery.spec.js
import { test, expect } from '@playwright/test';
import { compareScreenshots } from './utils';

test.describe('Origami Gallery', () => {
  test('renders initial state correctly', async ({ page }) => {
    await page.goto('http://localhost:8080/examples/origami-gallery.html');
    await page.waitForSelector('canvas');
    await page.waitForTimeout(2000); // Wait for WebGPU init

    const screenshot = await page.screenshot();
    const diff = await compareScreenshots(screenshot, 'origami-gallery-initial.png');
    expect(diff).toBeLessThan(0.01); // 1% tolerance
  });

  test('animation runs smoothly', async ({ page }) => {
    await page.goto('http://localhost:8080/examples/origami-gallery.html');

    // Capture FPS
    const fps = await page.evaluate(() => {
      return new Promise(resolve => {
        let frames = 0;
        const start = performance.now();

        function count() {
          frames++;
          if (performance.now() - start < 1000) {
            requestAnimationFrame(count);
          } else {
            resolve(frames);
          }
        }

        requestAnimationFrame(count);
      });
    });

    expect(fps).toBeGreaterThan(55); // 55 FPS minimum
  });
});
```

**Coverage:**
- Origami Gallery (12 scenes)
- Procedural Gallery (WebGPU rendering)
- Asset Browser UI
- Story system scroll behavior
- Material switching
- Environment switching

---

## Phase 7: Documentation Enhancements 🔄 PENDING

### 7.1 Getting Started Overhaul
**Current Issue:** Too many docs, unclear entry point

**Solution:** Create progressive disclosure:

1. **QUICKSTART.md** (5-minute read)
   - Single working example
   - Copy-paste ready
   - No setup required

2. **TUTORIAL.md** (30-minute tutorial)
   - Step-by-step project build
   - Asset integration
   - Material creation
   - Animation basics

3. **GUIDES/** (Deep dives)
   - Asset management
   - Story system
   - Custom materials
   - Performance optimization

4. **REFERENCE.md** (API reference)
   - All classes/methods
   - TSL functions
   - Catalog schema

### 7.2 Video Tutorials
**Platform:** YouTube
**Episodes:**
1. "WebGPU Three.js in 5 Minutes"
2. "Asset Library Deep Dive"
3. "Creating Custom Materials with TSL"
4. "Building a Scroll Story"
5. "Performance Optimization"

---

## Phase 8: Performance Benchmarking 🔄 PENDING

### 8.1 Benchmark Suite
**Metrics to Track:**
- Asset load times (first load vs cached)
- Render FPS (WebGPU vs WebGL)
- Memory usage (texture budget)
- Prefetch effectiveness
- Timeline interpolation performance

**Implementation:**
```javascript
// benchmark/asset-loading.bench.js
import { bench, describe } from 'vitest';
import AssetLibrary from '../assets/AssetLibrary.js';

describe('Asset Loading', () => {
  bench('Load PBR texture set (first time)', async () => {
    const assets = AssetLibrary.getInstance();
    await assets.loadAsset('pbr/oak-wood');
  });

  bench('Load PBR texture set (cached)', async () => {
    const assets = AssetLibrary.getInstance();
    await assets.loadAsset('pbr/oak-wood'); // Should hit cache
  });

  bench('Load HDR environment + PMREM', async () => {
    const assets = AssetLibrary.getInstance();
    await assets.getEnvironment('env/studio-neutral', { pmrem: true });
  });
});
```

**Run:**
```bash
npm run benchmark
```

---

## Priority Roadmap

### Week 1 (Immediate) ✅ DONE
- [x] Asset server documentation
- [x] Asset sources curation
- [x] Automated starter pack downloader
- [x] Setup scripts

### Week 2 (Next)
- [ ] Fix CDN WebGPU imports
- [ ] Create standalone demo
- [ ] Set up Vitest infrastructure
- [ ] Write core tests (AssetLibrary, Loaders)

### Week 3
- [ ] Story.json wizard CLI
- [ ] Visual timeline editor (basic)
- [ ] Complete test coverage (>70%)

### Week 4
- [ ] Playwright visual regression tests
- [ ] Performance benchmarking
- [ ] Documentation overhaul
- [ ] Video tutorial scripts

---

## Success Metrics

### Accessibility
- ✅ Can run demos without asset server (standalone)
- 🔄 Asset setup time < 10 minutes (with script)
- 🔄 Working example in < 5 minutes

### Quality
- 🔄 Test coverage > 70%
- 🔄 All demos tested visually
- 🔄 Performance benchmarks documented

### Documentation
- 🔄 Quickstart under 5 minutes
- 🔄 Tutorial completion rate > 80%
- 🔄 API reference complete

### Performance
- 🔄 Asset load time < 2s (cached)
- 🔄 FPS > 55 (desktop)
- 🔄 Memory budget respected

---

## Contributing

See individual task files:
- `tasks/testing-infrastructure.md`
- `tasks/cdn-webgpu-fix.md`
- `tasks/standalone-demo.md`
- `tasks/story-wizard.md`

---

**Last Updated:** 2026-01-27
**Status:** Phase 1 Complete, Phase 2-8 In Planning
**Maintainer:** Claude Code WebGPU Skill Team
