# Asset Server Setup Guide

**Problem:** Most demos require assets that aren't included in the skill repository.

**Last Updated:** 2026-01-27

---

## Current Status

### ✅ What's Included
The skill includes **renaissance pack assets**:
- Images: `assets/images/*.jpg` (portraits, feature cards)
- Depth maps: `assets/images/*-depth.png`
- Alpha masks: `assets/images/clouds-*.png`
- Models: `assets/models/ornate-frame-*.glb`

### ❌ What's Missing
The `core.catalog.json` references assets that **are not included**:
- PBR Textures (oak wood, brushed aluminum, cotton fabric)
- HDR Environments (studio neutral, outdoor sunset)
- Test Models (suzanne, torus knot, sphere)

---

## Quick Solutions

### Option 1: Use Included Assets Only ✅ Recommended

Use demos that work with the included renaissance assets:

```bash
cd ~/.claude/skills/webgpu-threejs-tsl/examples
open renaissance-scrollytell.html
```

**Working demos without external server:**
- `test-simple.html` - Story system test (self-contained)
- `origami-gallery.html` - GSAP motion graphics (matcap materials)
- `procedural-gallery.html` - WebGPU procedural geometry

### Option 2: Create Mock Assets

Generate placeholder assets for testing:

```bash
cd ~/.claude/skills/webgpu-threejs-tsl
mkdir -p asset-packs/core/{textures/{oak_wood,brushed_aluminum,cotton_fabric},models,env}
```

Then create simple placeholder files or download CC0 assets from:
- **Textures:** [ambientCG.com](https://ambientcg.com/) (CC0 PBR materials)
- **HDR:** [Poly Haven](https://polyhaven.com/hdris) (CC0 HDR environments)
- **Models:** [Kenney.nl](https://kenney.nl/assets) or Blender defaults

### Option 3: Set Up Full Asset Server

#### Step 1: Create Asset Directory Structure

```bash
mkdir -p ~/.claude/asset-packs/webgpu-threejs-tsl/packs/core/{textures,models,env,catalogs}
```

#### Step 2: Download Assets

You'll need to source CC0 assets or create them. Example sources:

**PBR Textures (2K resolution):**
```bash
# Oak Wood
wget https://ambientcg.com/get?file=Wood051_2K-JPG.zip -O oak.zip
unzip oak.zip -d ~/.claude/asset-packs/webgpu-threejs-tsl/packs/core/textures/oak_wood/
mv Wood051_2K_Color.jpg albedo.jpg
mv Wood051_2K_NormalGL.jpg normal.png
# Combine roughness/metalness into ORM texture (requires processing)
```

**HDR Environments (1K resolution):**
```bash
# Studio lighting
wget https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr \
  -O ~/.claude/asset-packs/webgpu-threejs-tsl/packs/core/env/studio_neutral_1k.hdr

# Outdoor sunset
wget https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/sunset_jhbcentral_1k.hdr \
  -O ~/.claude/asset-packs/webgpu-threejs-tsl/packs/core/env/outdoor_sunset_1k.hdr
```

**Models:**
```bash
# Create in Blender and export as GLB:
# - Suzanne: Add > Mesh > Monkey
# - Torus Knot: Add > Mesh > Torus Knot
# - Sphere: Add > Mesh > UV Sphere (low poly)
# Export: File > Export > glTF 2.0 (.glb)
```

#### Step 3: Copy Catalog

```bash
cp ~/.claude/skills/webgpu-threejs-tsl/assets/catalogs/core.catalog.json \
   ~/.claude/asset-packs/webgpu-threejs-tsl/packs/core/catalogs/
```

#### Step 4: Start HTTP Server

```bash
cd ~/.claude/asset-packs
python3 -m http.server 8787
```

Or with Node.js:
```bash
npm install -g http-server
cd ~/.claude/asset-packs
http-server -p 8787 --cors
```

#### Step 5: Open Demos

```bash
cd ~/.claude/skills/webgpu-threejs-tsl/examples/showcase-demo
open index.html
```

---

## Simplified Server-Free Setup

For immediate testing without asset server, use this configuration:

### Create Inline Demo

```html
<!DOCTYPE html>
<html>
<head>
  <title>WebGPU Test - No Server</title>
  <script type="importmap">
  {
    "imports": {
      "three": "https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.module.js",
      "three/webgpu": "https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.webgpu.js",
      "three/addons/": "https://cdn.jsdelivr.net/npm/three@0.171.0/examples/jsm/"
    }
  }
  </script>
</head>
<body>
  <canvas id="canvas"></canvas>
  <script type="module">
    import * as THREE from 'three';
    import WebGPURenderer from 'three/webgpu';

    const renderer = new WebGPURenderer({ canvas: document.getElementById('canvas') });
    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight);
    camera.position.z = 5;

    // Use simple geometry and materials (no assets needed)
    const geometry = new THREE.TorusKnotGeometry(1, 0.3, 128, 16);
    const material = new THREE.MeshStandardNodeMaterial({
      color: 0x4488ff,
      roughness: 0.3,
      metalness: 0.7
    });
    const mesh = new THREE.Mesh(geometry, material);
    scene.add(mesh);

    const light = new THREE.DirectionalLight(0xffffff, 1);
    light.position.set(5, 5, 5);
    scene.add(light);
    scene.add(new THREE.AmbientLight(0x404040));

    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setAnimationLoop(() => {
      mesh.rotation.x += 0.01;
      mesh.rotation.y += 0.01;
      renderer.render(scene, camera);
    });
  </script>
</body>
</html>
```

Save this as `test-webgpu-simple.html` and open directly in browser.

---

## Demo Compatibility Matrix

| Demo | Server Required | Assets Required | Status |
|------|----------------|-----------------|--------|
| `test-simple.html` | ❌ | ❌ | ✅ Works |
| `origami-gallery.html` | ❌ | Matcaps (included) | ✅ Works |
| `procedural-gallery.html` | ❌ | ❌ | ✅ Works |
| `renaissance-scrollytell.html` | ⚠️ | Renaissance pack (included) | ⚠️ Partial |
| `pbr-showcase.html` | ✅ | Core pack | ❌ Missing assets |
| `asset-browser.html` | ✅ | Core pack | ❌ Missing assets |
| `showcase-demo/index.html` | ✅ | Core pack | ❌ Missing assets |
| `showcase-demo/environments.html` | ✅ | Core pack | ❌ Missing assets |

---

## Recommended Workflow

### For Learning
1. Start with `origami-gallery.html` (no setup required)
2. Study `test-simple.html` (story system basics)
3. Read documentation in `docs/`

### For Development
1. Use `procedural-gallery.html` (WebGPU without assets)
2. Create procedural materials (no texture dependencies)
3. Use templates in `templates/`

### For Production
1. Set up asset server with custom assets
2. Create catalogs for your specific assets
3. Use AssetLibrary for lazy loading

---

## Asset Size Considerations

If you download full core pack assets:
- **PBR Textures (2K):** ~15MB per material × 3 = 45MB
- **HDR Environments (1K):** ~3MB each × 2 = 6MB
- **Models:** ~500KB each × 3 = 1.5MB
- **Total:** ~50MB

For production, consider:
- Use 1K textures instead of 2K (¼ size)
- Compress textures with Basis Universal
- Host on CDN with proper caching headers

---

## Alternative: Use Existing Renaissance Pack

The renaissance pack works out-of-the-box because assets are included:

```bash
cd ~/.claude/skills/webgpu-threejs-tsl
python3 -m http.server 8080
```

Then open: `http://localhost:8080/examples/renaissance-scrollytell.html`

This demonstrates the full story system with real assets.

---

## Creating Your Own Asset Pack

### 1. Create Directory Structure

```bash
mkdir -p my-pack/{textures,models,env,catalogs}
```

### 2. Add Assets

Place your files following the catalog schema.

### 3. Create Catalog JSON

```json
{
  "version": "1.0.0",
  "id": "my-pack",
  "name": "My Asset Pack",
  "assets": [
    {
      "id": "my-texture",
      "type": "pbr-texture-set",
      "files": {
        "albedo": "textures/my_texture/albedo.jpg",
        "normal": "textures/my_texture/normal.png",
        "orm": "textures/my_texture/orm.png"
      }
    }
  ]
}
```

### 4. Register in AssetLibrary

```javascript
import AssetLibrary from './assets/AssetLibrary.js';

const assets = AssetLibrary.getInstance();
await assets.registerCatalog(
  'http://localhost:8787/my-pack/catalogs/my-pack.catalog.json',
  { packId: 'my-pack', baseUri: 'http://localhost:8787/my-pack/' }
);
```

---

## Troubleshooting

### Server Won't Start
```bash
# Check if port 8787 is in use
lsof -i :8787

# Use different port
python3 -m http.server 8080
```

### CORS Errors
Add CORS headers:
```bash
http-server -p 8787 --cors
```

### Assets Not Loading
1. Check browser DevTools Network tab
2. Verify file paths match catalog
3. Check HTTP server is running
4. Verify baseUri in registerCatalog

---

## Summary

**Immediate Use:** Stick to demos that work without asset server
**Learning:** Study included renaissance pack and procedural demos
**Production:** Set up custom asset pack with your own CC0 assets

The skill's architecture is excellent - it just needs asset files populated to unlock full functionality.
