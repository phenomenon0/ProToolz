# Asset Library Showcase Demo

Professional two-page website demonstrating the WebGPU Asset Library integrations.

## Pages

### 1. Materials Showcase (`index.html`)
**Features:**
- ✨ Interactive PBR material switching (Oak Wood, Brushed Aluminum, Cotton Fabric)
- 🎨 Real-time model switching (Sphere, Torus Knot, Suzanne)
- 🌍 Studio neutral HDR environment
- 📊 Live FPS and triangle count statistics
- 🎯 Auto-rotating camera with orbit controls
- 💾 Persistent browser caching

**UI Elements:**
- Elegant navigation bar with page links
- Hero section with 3D viewport
- Side control panel for material/model selection
- Live statistics display
- Modern gradient design

### 2. Environment Comparison (`environments.html`)
**Features:**
- 🌓 Split-view HDR environment comparison
- ☀️ Studio Neutral vs Outdoor Sunset lighting
- ⚡ Real-time PMREM-generated reflections
- 🎚️ Live exposure, roughness, and metalness controls
- 🔄 View mode switching (Split, Studio Only, Sunset Only)
- 🔗 Synchronized camera controls across viewports

**UI Elements:**
- Dual viewport split-screen layout
- Center-aligned environment toggle
- Bottom control panel with sliders
- Environment details info panel
- Feature badges showcase

## Quick Start

### 1. Start HTTP Server

Asset packs must be served via HTTP:

```bash
# Python
cd ~/.claude/asset-packs
python -m http.server 8787

# Node.js
npm install -g http-server
cd ~/.claude/asset-packs
http-server -p 8787 --cors
```

### 2. Open in Browser

```bash
# Navigate to showcase-demo directory
cd ~/.claude/skills/webgpu-threejs-tsl/examples/showcase-demo

# Open in browser
open index.html
# or
open environments.html
```

**Note:** Must open via HTTP server, not file:// protocol

### 3. Navigate

- **Materials Page** → Switch between PBR materials and models
- **Environments Page** → Compare HDR lighting conditions
- **Asset Browser** → Browse full asset catalog

## Asset Requirements

These demos load the following assets from the core pack:

### Materials Page
- PBR Textures: `pbr/oak-wood`, `pbr/brushed-aluminum`, `pbr/cotton-fabric`
- Environment: `env/studio-neutral`
- Models: `model/sphere-lowpoly`, `model/torus-knot`, `model/suzanne`

### Environments Page
- Environments: `env/studio-neutral`, `env/outdoor-sunset`
- Model: `model/torus-knot`

## Configuration

Both pages use the same configuration:

```javascript
const PACK_BASE = 'http://localhost:8787/webgpu-threejs-tsl/packs/core/';
const CATALOG_URL = 'http://localhost:8787/webgpu-threejs-tsl/packs/core/catalogs/core.catalog.json';
```

Update these URLs to match your asset pack location.

## Features Demonstrated

### Asset Library Integration
✅ **AssetLibrary Singleton** - Centralized asset management
✅ **Catalog Registration** - Load assets from JSON catalogs
✅ **Lazy Loading** - Assets loaded on-demand via HTTP
✅ **Persistent Caching** - Browser Cache Storage for offline support

### PBR Workflow
✅ **Color Space Management** - Automatic sRGB/linear configuration
✅ **ORM Textures** - Combined Occlusion+Roughness+Metallic maps
✅ **PMREM Generation** - Prefiltered environment maps for reflections

### WebGPU Features
✅ **WebGPURenderer** - Modern GPU API
✅ **ACES Tone Mapping** - Cinematic color grading
✅ **HDR Environments** - High dynamic range lighting
✅ **Real-time Rendering** - 60 FPS performance

## Browser Requirements

- **WebGPU Support**: Chrome 113+, Edge 113+, or Safari Technology Preview
- **HTTP Server**: Assets must be served via HTTP (not file://)
- **Modern Browser**: ES6 modules and importmap support

## Troubleshooting

### Assets Not Loading

**Error:** `Failed to fetch catalog`

**Solution:** Ensure HTTP server is running on port 8787:
```bash
cd ~/.claude/asset-packs
python -m http.server 8787
```

### CORS Errors

**Error:** `Access to fetch blocked by CORS policy`

**Solution:** Use HTTP server with CORS enabled:
```bash
http-server -p 8787 --cors
```

### WebGPU Not Available

**Error:** `WebGPU not supported`

**Solution:** Update to Chrome 113+ or Edge 113+, or enable WebGPU flag:
- Chrome: `chrome://flags/#enable-unsafe-webgpu`
- Edge: `edge://flags/#enable-unsafe-webgpu`

### Black Screen

**Issue:** Page loads but viewport is black

**Check:**
1. Open DevTools Console for errors
2. Verify asset pack files exist in correct paths
3. Check Network tab for 404 errors
4. Ensure catalog JSON is valid

## Performance

### Expected FPS
- **Desktop GPU**: 60 FPS (vsync limited)
- **Integrated GPU**: 45-60 FPS
- **Mobile**: 30-45 FPS (if WebGPU available)

### Asset Loading Times
- **First Load**: 2-5 seconds (fetching from HTTP)
- **Cached Load**: < 100ms (from Cache Storage)
- **Total Assets**: ~8-12MB for both pages

## Customization

### Change Materials

Edit material buttons in `index.html`:

```javascript
<button class="material-btn" data-material="pbr/your-material">
  <div class="icon">🎨</div>
  <div class="label">Your Material</div>
</button>
```

### Change Environments

Edit environment in `environments.html`:

```javascript
const envMap = await assets.getEnvironment('env/your-environment', {
  pmrem: true
});
```

### Adjust Lighting

Modify exposure slider range or initial values:

```javascript
<input type="range" id="exposure" min="0" max="200" value="100">
```

## Design Notes

### Color Palette
- **Primary**: `#0066ff` (Blue gradient)
- **Accent**: `#00d4ff` (Cyan)
- **Background**: `#0a0a0a` → `#1a1a2e` (Dark gradient)
- **Text**: `#e0e0e0` (Light gray)

### Typography
- **System Font Stack**: `-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto`
- **Headings**: 800 weight, gradient text
- **Body**: 14px base, 1.6 line height

### Layout
- **Navigation**: Fixed top bar, 70px height
- **Controls**: Fixed panels with backdrop blur
- **Responsive**: Grid-based layouts

## Credits

- **WebGPU**: Modern GPU API by W3C
- **Three.js**: r171+ with WebGPU support
- **Asset Library**: Catalog-driven system by Claude Code
- **Design**: Modern gradient aesthetic

---

**Version**: 1.0.0
**Last Updated**: 2026-01-27
**Status**: Production Ready
