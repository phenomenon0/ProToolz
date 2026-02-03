# Asset Packs

Guide to creating, organizing, and deploying asset packs for the WebGPU-Three.js-TSL Asset Library.

## Overview

Asset packs are collections of 3D assets (textures, environments, models) organized in a specific directory structure with JSON catalogs. Packs are served via HTTP and loaded on-demand with automatic caching.

### Key Concepts

- **Pack**: A directory containing assets and a catalog
- **Catalog**: JSON file describing all assets in the pack
- **Base URI**: HTTP endpoint serving the pack directory
- **Asset Types**: PBR textures, HDR environments, 3D models, shader snippets

## Pack Structure

### Directory Layout

```
packs/
└── core/                              # Pack directory
    ├── pack.json                      # Pack manifest (optional)
    ├── catalogs/
    │   └── core.catalog.json          # Asset catalog
    ├── textures/
    │   ├── oak_wood/
    │   │   ├── albedo.jpg             # Diffuse/base color (2K, sRGB)
    │   │   ├── normal.png             # Normal map (2K, linear, OpenGL Y+)
    │   │   └── orm.png                # Occlusion+Roughness+Metallic (2K, linear)
    │   ├── brushed_aluminum/
    │   │   └── (same structure)
    │   └── cotton_fabric/
    │       └── (same structure)
    ├── env/
    │   ├── studio_neutral_1k.hdr      # HDR environment (1K equirectangular)
    │   └── outdoor_sunset_1k.hdr      # HDR environment (1K equirectangular)
    ├── models/
    │   ├── suzanne.glb                # 3D model (GLB with Draco compression)
    │   ├── torus_knot.glb
    │   └── sphere_lowpoly.glb
    └── thumbs/                        # Preview thumbnails (optional)
        ├── pbr_oak_wood.webp          # 256x256 WebP thumbnails
        ├── pbr_aluminum.webp
        └── env_studio_neutral.webp
```

## Catalog Format

### Schema Reference

Catalogs follow the `.assetcatalog.schema.json` schema:

```json
{
  "version": "1.0.0",
  "id": "core",
  "name": "Core Asset Pack",
  "description": "Essential assets for WebGPU projects",
  "assets": [
    {
      "id": "pbr/oak-wood",
      "type": "pbr-texture-set",
      "label": "Oak Wood",
      "description": "Natural oak wood texture",
      "files": {
        "albedo": "textures/oak_wood/albedo.jpg",
        "normal": "textures/oak_wood/normal.png",
        "orm": "textures/oak_wood/orm.png"
      },
      "defaults": {
        "roughness": 0.75,
        "metalness": 0.0,
        "uvScale": [2, 2],
        "colorSpace": {
          "albedo": "srgb",
          "normal": "linear",
          "orm": "linear"
        }
      },
      "tags": ["pbr", "wood", "natural"],
      "license": "CC0",
      "preview": "thumbs/pbr_oak_wood.webp"
    }
  ],
  "metadata": {
    "author": "Your Name",
    "license": "CC0",
    "created": "2026-01-27T00:00:00Z",
    "updated": "2026-01-27T00:00:00Z"
  }
}
```

### Asset Types

#### 1. PBR Texture Set

```json
{
  "id": "pbr/material-name",
  "type": "pbr-texture-set",
  "label": "Display Name",
  "files": {
    "albedo": "textures/material_name/albedo.jpg",
    "normal": "textures/material_name/normal.png",
    "orm": "textures/material_name/orm.png"
  },
  "defaults": {
    "roughness": 0.5,
    "metalness": 0.0,
    "uvScale": [1, 1]
  },
  "tags": ["pbr", "category"]
}
```

**Required Files:**
- `albedo`: Base color/diffuse (JPEG 85%, sRGB)
- `normal`: Normal map (PNG, linear, OpenGL Y+)
- `orm`: Combined ORM texture (PNG, linear)
  - R = Ambient Occlusion
  - G = Roughness
  - B = Metalness

#### 2. Environment

```json
{
  "id": "env/environment-name",
  "type": "environment",
  "label": "Display Name",
  "files": {
    "hdr": "env/environment_name_1k.hdr"
  },
  "defaults": {
    "intensity": 1.0,
    "exposure": 0.0,
    "pmrem": true,
    "resolution": "1k",
    "colorTemp": 5500
  },
  "tags": ["env", "category"]
}
```

**Required Files:**
- `hdr`: HDR equirectangular environment map (.hdr RGBE format)

**Recommended Resolutions:**
- 1K (1024×512): Small environments, testing
- 2K (2048×1024): Standard quality
- 4K (4096×2048): High quality (use sparingly)

#### 3. Model

```json
{
  "id": "model/model-name",
  "type": "model",
  "label": "Display Name",
  "files": {
    "glb": "models/model_name.glb"
  },
  "defaults": {
    "scale": 1.0,
    "triangles": 500
  },
  "tags": ["model", "category"]
}
```

**Required Files:**
- `glb`: GLB binary format (with Draco compression recommended)

**Export Settings (Blender):**
- Format: glTF Binary (.glb)
- Compression: Draco
- Normals: Include
- UVs: Include
- Materials: Embedded

## Creating a Pack

### Step 1: Prepare Assets

#### PBR Textures

1. **Source or Create Textures**
   - Use CC0 sources: ambientCG.com, polyhaven.com, 3dtextures.me
   - Or create in Substance Designer/Painter

2. **Export Texture Maps**
   - Albedo: No lighting info, mid-gray values
   - Normal: OpenGL Y+ convention (Three.js default)
   - ORM: Combine in image editor or use separate maps

3. **Optimize for Web**
   ```bash
   # Resize to 2K
   convert albedo.png -resize 2048x2048 -quality 85 albedo.jpg
   convert normal.png -resize 2048x2048 normal.png

   # Combine ORM (requires ImageMagick)
   convert ao.png roughness.png metallic.png \
     -channel RGB -combine orm.png
   ```

#### HDR Environments

1. **Source HDR Maps**
   - Use CC0 sources: polyhaven.com/hdris
   - Or capture with 360° camera + bracketing

2. **Convert to Equirectangular**
   - Resolution: 1K-4K
   - Format: Radiance HDR (.hdr)

3. **Optimize Size**
   ```bash
   # Resize with HDR tools
   hdrgen input.hdr -resize 1024 512 -o output_1k.hdr
   ```

#### 3D Models

1. **Model Requirements**
   - Clean topology (quads preferred)
   - Proper UVs (0-1 range)
   - Reasonable triangle count (< 10K for test models)

2. **Export as GLB**
   - Blender: File → Export → glTF 2.0 (.glb)
   - Enable Draco compression
   - Include normals and UVs

3. **Verify Export**
   - Test in https://gltf-viewer.donmccurdy.com/
   - Check file size (< 5MB recommended)

### Step 2: Create Directory Structure

```bash
mkdir -p packs/my-pack/{catalogs,textures,env,models,thumbs}
```

### Step 3: Write Catalog

Create `catalogs/my-pack.catalog.json`:

```json
{
  "version": "1.0.0",
  "id": "my-pack",
  "name": "My Custom Pack",
  "description": "Custom assets for my project",
  "assets": [
    {
      "id": "pbr/my-material",
      "type": "pbr-texture-set",
      "label": "My Material",
      "files": {
        "albedo": "textures/my_material/albedo.jpg",
        "normal": "textures/my_material/normal.png",
        "orm": "textures/my_material/orm.png"
      },
      "defaults": {
        "roughness": 0.5,
        "metalness": 0.0,
        "uvScale": [1, 1]
      },
      "tags": ["pbr", "custom"],
      "license": "CC0"
    }
  ]
}
```

### Step 4: Validate Catalog

Use JSON Schema validation:

```javascript
import Ajv from 'ajv';
import schema from './.assetcatalog.schema.json';
import catalog from './packs/my-pack/catalogs/my-pack.catalog.json';

const ajv = new Ajv();
const validate = ajv.compile(schema);

if (validate(catalog)) {
  console.log('✅ Catalog valid');
} else {
  console.error('❌ Validation errors:', validate.errors);
}
```

## Local Development

### 1. Start HTTP Server

```bash
# Navigate to parent of packs/
cd ~/.claude/asset-packs

# Start server
python -m http.server 8787
# or
http-server -p 8787 --cors
```

### 2. Register Pack

```javascript
const assets = AssetLibrary.getInstance({
  packs: {
    'my-pack': 'http://localhost:8787/webgpu-threejs-tsl/packs/my-pack/'
  }
});

await assets.registerCatalogFromUrl(
  'http://localhost:8787/webgpu-threejs-tsl/packs/my-pack/catalogs/my-pack.catalog.json',
  { packId: 'my-pack', baseUri: 'http://localhost:8787/webgpu-threejs-tsl/packs/my-pack/' }
);
```

### 3. Test Assets

```javascript
const material = await assets.createPBRMaterial('pbr/my-material');
console.log('✅ Material loaded:', material);
```

## CDN Deployment

### 1. Prepare for Production

```bash
# Optimize all images
find packs/my-pack -name "*.png" -exec optipng -o7 {} \;
find packs/my-pack -name "*.jpg" -exec jpegoptim --max=85 {} \;

# Verify file sizes
du -sh packs/my-pack/*
```

### 2. Upload to CDN

#### Option A: GitHub Pages

```bash
# Create gh-pages branch
git checkout --orphan gh-pages
git add packs/
git commit -m "Add asset pack"
git push origin gh-pages

# Access at: https://username.github.io/repo/packs/my-pack/
```

#### Option B: Netlify

```bash
# Deploy directory
netlify deploy --dir=packs --prod

# Access at: https://app-name.netlify.app/my-pack/
```

#### Option C: Cloudflare R2

```bash
# Upload to R2 bucket
wrangler r2 object put my-bucket/packs/my-pack/catalogs/my-pack.catalog.json \
  --file=packs/my-pack/catalogs/my-pack.catalog.json

# Enable public access
# Access at: https://pub-xxx.r2.dev/packs/my-pack/
```

### 3. Update Base URI

```javascript
const assets = AssetLibrary.getInstance({
  packs: {
    'my-pack': 'https://cdn.example.com/packs/my-pack/'
  }
});

await assets.registerCatalogFromUrl(
  'https://cdn.example.com/packs/my-pack/catalogs/my-pack.catalog.json',
  { packId: 'my-pack', baseUri: 'https://cdn.example.com/packs/my-pack/' }
);
```

### 4. Configure CORS

Ensure CDN serves correct CORS headers:

```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, HEAD
Access-Control-Max-Age: 3600
```

## Best Practices

### File Naming

- Use lowercase with underscores: `oak_wood`, `studio_neutral`
- Avoid spaces and special characters
- Keep names under 32 characters

### File Formats

**Textures:**
- Albedo: JPEG 85% quality, sRGB encoding
- Normal: PNG with optimization, linear
- ORM: PNG with optimization, linear
- Max resolution: 2K (2048×2048) for learning, 4K for production

**Environments:**
- Format: Radiance HDR (.hdr)
- Resolution: 1K (1024×512) for testing, 2K-4K for production
- Color space: Linear

**Models:**
- Format: GLB (binary glTF)
- Compression: Draco (reduces size by 70-90%)
- Max triangles: 10K for test models, 100K for production

### Optimization

**Texture Optimization:**
```bash
# Install tools
brew install imagemagick optipng jpegoptim

# Optimize PNGs
optipng -o7 *.png

# Optimize JPEGs
jpegoptim --max=85 *.jpg
```

**HDR Optimization:**
```bash
# Resize with hdrgen or Photoshop
# Target: 1-2MB per HDR file
```

**Model Optimization:**
- Use Blender's Decimate modifier to reduce triangles
- Enable Draco compression in export settings
- Remove unused vertex data (colors, UVs)

### Pack Size Guidelines

- **Small Pack**: 10-20MB (5-10 materials, 2-3 environments, 3-5 models)
- **Medium Pack**: 30-50MB (15-25 materials, 5-8 environments, 10-15 models)
- **Large Pack**: 100-200MB (50+ materials, 20+ environments, 30+ models)

Keep individual packs focused on a theme (e.g., "Metal Materials", "Outdoor Environments").

### Catalog Organization

**Asset IDs:**
- Use hierarchical format: `category/subcategory/name`
- Examples: `pbr/metal/aluminum`, `env/studio/neutral`, `model/character/avatar`

**Tags:**
- Use consistent tag taxonomy
- Categories: `pbr`, `env`, `model`, `shader`
- Materials: `metal`, `wood`, `fabric`, `stone`, `plastic`
- Environments: `indoor`, `outdoor`, `studio`, `natural`
- Quality: `1k`, `2k`, `4k`

**Descriptions:**
- Be specific about use cases
- Mention technical details (resolution, triangle count)
- Include lighting conditions for environments

### Versioning

Use semantic versioning in catalog:

```json
{
  "version": "1.2.3",
  "id": "my-pack"
}
```

- **Major**: Breaking changes (file paths, asset IDs changed)
- **Minor**: New assets added
- **Patch**: Bug fixes, metadata updates

## Troubleshooting

### Assets Not Loading

**Check file paths:**
```bash
# Verify all files exist
find packs/my-pack -type f -name "*.jpg" -o -name "*.png" -o -name "*.hdr" -o -name "*.glb"

# Check catalog paths match files
jq '.assets[].files' packs/my-pack/catalogs/my-pack.catalog.json
```

**Check HTTP server:**
```bash
# Test file access
curl -I http://localhost:8787/packs/my-pack/textures/oak_wood/albedo.jpg

# Should return 200 OK
```

### CORS Issues

**Problem:** Browser blocks fetch requests

**Solution:** Enable CORS on HTTP server:

```bash
# Python (CORS enabled by default for localhost)
python -m http.server 8787

# Node.js http-server
http-server -p 8787 --cors

# Nginx config
add_header Access-Control-Allow-Origin *;
```

### Large File Sizes

**Problem:** Pack exceeds size budget

**Solutions:**
1. Reduce texture resolution (4K → 2K → 1K)
2. Use JPEG for albedo (PNG → JPEG 85%)
3. Enable Draco compression for models
4. Reduce HDR resolution (4K → 2K → 1K)
5. Split into multiple packs by theme

### Color Space Issues

**Problem:** Materials look incorrect

**Solution:** Ensure correct color space in catalog:

```json
{
  "defaults": {
    "colorSpace": {
      "albedo": "srgb",    // ✅ Correct
      "normal": "linear",  // ✅ Correct
      "orm": "linear"      // ✅ Correct
    }
  }
}
```

## Example Packs

### Minimal Pack

```
packs/minimal/
├── catalogs/
│   └── minimal.catalog.json         # 1 material, 1 env, 1 model
├── textures/
│   └── concrete/
│       ├── albedo.jpg               # 1K, 150KB
│       ├── normal.png               # 1K, 200KB
│       └── orm.png                  # 1K, 180KB
├── env/
│   └── neutral_1k.hdr               # 1K, 1.2MB
└── models/
    └── cube.glb                     # 500 tris, 50KB

Total: ~2MB
```

### Standard Pack

```
packs/standard/
├── catalogs/
│   └── standard.catalog.json        # 5 materials, 2 envs, 3 models
├── textures/                        # 5 materials × 3 maps × 2K
│   ├── wood/
│   ├── metal/
│   ├── fabric/
│   ├── stone/
│   └── plastic/
├── env/                             # 2 environments × 2K
│   ├── studio_2k.hdr
│   └── outdoor_2k.hdr
└── models/                          # 3 models, 5K tris each
    ├── sphere.glb
    ├── cube.glb
    └── torus.glb

Total: ~30MB
```

---

**Next**: [Asset Library API](doc://webgpu-threejs-tsl/docs/asset-library.md) - Complete API reference
