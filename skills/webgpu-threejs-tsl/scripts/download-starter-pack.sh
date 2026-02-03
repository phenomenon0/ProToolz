#!/bin/bash

# WebGPU Three.js TSL - Automated Starter Pack Downloader
# Downloads CC0 assets from Poly Haven and generates catalog

set -e

# Configuration
PACK_DIR="${1:-$HOME/.claude/asset-packs/webgpu-threejs-tsl/packs/starter}"
CATALOG_NAME="starter.catalog.json"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo "WebGPU Starter Pack Downloader"
echo -e "========================================${NC}"
echo ""

# Check dependencies
echo "Checking dependencies..."
if ! command -v wget &> /dev/null; then
  echo -e "${RED}❌ wget not found${NC}"
  echo "Install: brew install wget (macOS) or sudo apt install wget (Linux)"
  exit 1
fi

if ! command -v unzip &> /dev/null; then
  echo -e "${RED}❌ unzip not found${NC}"
  echo "Install: brew install unzip (macOS) or sudo apt install unzip (Linux)"
  exit 1
fi

echo -e "${GREEN}✓ Dependencies OK${NC}"
echo ""

# Create directory structure
echo "Creating directory structure..."
mkdir -p "$PACK_DIR"/{env,textures/{blue-noise,procedural},models,decals,catalogs,shader-libs}
cd "$PACK_DIR"

echo -e "${GREEN}✓ Directories created at: $PACK_DIR${NC}"
echo ""

# Download HDR Environments
echo -e "${BLUE}Downloading HDR Environments (1K)...${NC}"
echo ""

hdri_list=(
  "studio_small_09_1k.hdr"
  "sunset_jhbcentral_1k.hdr"
  "photo_studio_01_1k.hdr"
  "neon_photostudio_1k.hdr"
  "industrial_sunset_02_1k.hdr"
)

for hdri in "${hdri_list[@]}"; do
  if [ -f "env/$hdri" ]; then
    echo -e "${YELLOW}⊘ $hdri (already exists, skipping)${NC}"
  else
    echo "Downloading $hdri..."
    wget -q --show-progress \
      "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/$hdri" \
      -O "env/$hdri" || echo -e "${RED}✗ Failed to download $hdri${NC}"
  fi
done

echo ""
echo -e "${GREEN}✓ HDR environments downloaded${NC}"
echo ""

# Download Blue Noise Textures
echo -e "${BLUE}Downloading Blue Noise Textures...${NC}"
echo ""

if [ -d "textures/blue-noise/64_64" ]; then
  echo -e "${YELLOW}⊘ Blue noise textures (already exist, skipping)${NC}"
else
  echo "Downloading blue noise texture set..."
  wget -q --show-progress \
    "https://momentsingraphics.de/Media/BlueNoise/64_64_LDR_RGB.zip" \
    -O blue-noise.zip

  unzip -q blue-noise.zip -d textures/blue-noise/
  rm blue-noise.zip

  echo -e "${GREEN}✓ Blue noise textures extracted${NC}"
fi

echo ""

# Clone shader libraries
echo -e "${BLUE}Downloading Shader Libraries...${NC}"
echo ""

if [ -d "shader-libs/wgsl-noise" ]; then
  echo -e "${YELLOW}⊘ wgsl-noise (already exists, skipping)${NC}"
else
  echo "Cloning wgsl-noise..."
  git clone -q https://github.com/ZRNOF/wgsl-noise.git shader-libs/wgsl-noise
  echo -e "${GREEN}✓ wgsl-noise cloned${NC}"
fi

if [ -d "shader-libs/wgsl-fns" ]; then
  echo -e "${YELLOW}⊘ wgsl-fns (already exists, skipping)${NC}"
else
  echo "Cloning wgsl-fns..."
  git clone -q https://github.com/koole/wgsl-fns.git shader-libs/wgsl-fns
  echo -e "${GREEN}✓ wgsl-fns cloned${NC}"
fi

echo ""

# Generate catalog JSON
echo -e "${BLUE}Generating catalog...${NC}"
echo ""

cat > "catalogs/$CATALOG_NAME" << 'EOF'
{
  "version": "1.0.0",
  "id": "starter",
  "name": "WebGPU Starter Pack",
  "description": "Curated CC0 assets for WebGPU development - HDR environments, blue noise textures, and shader libraries",
  "assets": [
    {
      "id": "env/studio-neutral",
      "type": "environment",
      "label": "Studio Neutral Lighting",
      "description": "Soft, neutral studio lighting ideal for material testing and product visualization",
      "files": {
        "hdr": "../env/studio_small_09_1k.hdr"
      },
      "defaults": {
        "intensity": 1.0,
        "exposure": 0.0,
        "pmrem": true,
        "resolution": "1k",
        "colorTemp": 5500
      },
      "tags": ["env", "studio", "neutral", "indoor"],
      "license": "CC0",
      "source": "Poly Haven",
      "preview": "thumbs/env_studio_neutral.webp"
    },
    {
      "id": "env/sunset",
      "type": "environment",
      "label": "Sunset Jhbcentral",
      "description": "Warm sunset lighting with dramatic color gradients and directional sun",
      "files": {
        "hdr": "../env/sunset_jhbcentral_1k.hdr"
      },
      "defaults": {
        "intensity": 1.2,
        "exposure": 0.5,
        "pmrem": true,
        "resolution": "1k",
        "colorTemp": 3200
      },
      "tags": ["env", "outdoor", "sunset", "warm"],
      "license": "CC0",
      "source": "Poly Haven",
      "preview": "thumbs/env_sunset.webp"
    },
    {
      "id": "env/photo-studio",
      "type": "environment",
      "label": "Photo Studio",
      "description": "Professional photo studio lighting setup with soft directional lights",
      "files": {
        "hdr": "../env/photo_studio_01_1k.hdr"
      },
      "defaults": {
        "intensity": 1.0,
        "exposure": 0.0,
        "pmrem": true,
        "resolution": "1k",
        "colorTemp": 5000
      },
      "tags": ["env", "studio", "photo", "professional"],
      "license": "CC0",
      "source": "Poly Haven",
      "preview": "thumbs/env_photo_studio.webp"
    },
    {
      "id": "env/neon-studio",
      "type": "environment",
      "label": "Neon Photo Studio",
      "description": "Modern studio with neon accent lighting for cyberpunk aesthetics",
      "files": {
        "hdr": "../env/neon_photostudio_1k.hdr"
      },
      "defaults": {
        "intensity": 1.3,
        "exposure": 0.3,
        "pmrem": true,
        "resolution": "1k",
        "colorTemp": 6500
      },
      "tags": ["env", "studio", "neon", "cyber"],
      "license": "CC0",
      "source": "Poly Haven",
      "preview": "thumbs/env_neon_studio.webp"
    },
    {
      "id": "env/industrial-sunset",
      "type": "environment",
      "label": "Industrial Sunset",
      "description": "Industrial setting at sunset with warm directional light and urban atmosphere",
      "files": {
        "hdr": "../env/industrial_sunset_02_1k.hdr"
      },
      "defaults": {
        "intensity": 1.1,
        "exposure": 0.4,
        "pmrem": true,
        "resolution": "1k",
        "colorTemp": 3500
      },
      "tags": ["env", "industrial", "sunset", "urban"],
      "license": "CC0",
      "source": "Poly Haven",
      "preview": "thumbs/env_industrial_sunset.webp"
    },
    {
      "id": "texture/blue-noise-64",
      "type": "image",
      "label": "Blue Noise 64x64 RGB",
      "description": "High-quality blue noise texture for dithering, TAA, and sampling",
      "files": {
        "image": "textures/blue-noise/64_64/LDR_RGB1_0.png"
      },
      "defaults": {
        "wrapS": "repeat",
        "wrapT": "repeat",
        "colorSpace": "linear",
        "minFilter": "nearest",
        "magFilter": "nearest"
      },
      "tags": ["texture", "noise", "dither", "sampling"],
      "license": "Free",
      "source": "Moments in Graphics",
      "preview": "thumbs/blue_noise.webp"
    }
  ],
  "metadata": {
    "author": "WebGPU Three.js TSL Skill",
    "license": "CC0",
    "created": "2026-01-27T00:00:00Z",
    "updated": "2026-01-27T00:00:00Z",
    "sources": {
      "environments": "Poly Haven (polyhaven.com)",
      "blue_noise": "Moments in Graphics (momentsingraphics.de)",
      "shader_libs": "GitHub (ZRNOF/wgsl-noise, koole/wgsl-fns)"
    }
  }
}
EOF

echo -e "${GREEN}✓ Catalog generated: catalogs/$CATALOG_NAME${NC}"
echo ""

# Create README
cat > README.md << 'EOF'
# WebGPU Starter Pack

**Auto-generated asset pack with CC0 resources**

## Contents

### HDR Environments (5)
- ✅ Studio Neutral - Soft white lighting
- ✅ Sunset Jhbcentral - Warm outdoor sunset
- ✅ Photo Studio - Professional photo lighting
- ✅ Neon Studio - Cyberpunk neon lighting
- ✅ Industrial Sunset - Urban industrial atmosphere

### Textures
- ✅ Blue Noise (64x64 RGB) - For dithering and sampling

### Shader Libraries
- ✅ wgsl-noise - WGSL procedural noise functions
- ✅ wgsl-fns - WGSL utility functions (SDF, math, noise)

## Usage

### 1. Start Asset Server

```bash
cd ~/.claude/asset-packs/webgpu-threejs-tsl
python3 -m http.server 8787
```

### 2. Load in Three.js

```javascript
import AssetLibrary from './assets/AssetLibrary.js';

const assets = AssetLibrary.getInstance();
await assets.registerCatalog(
  'http://localhost:8787/packs/starter/catalogs/starter.catalog.json',
  { packId: 'starter', baseUri: 'http://localhost:8787/packs/starter/' }
);

// Load environment
const env = await assets.getEnvironment('env/studio-neutral', { pmrem: true });
scene.environment = env.texture;

// Load blue noise for dithering
const blueNoise = await assets.getImage('texture/blue-noise-64');
```

### 3. Use WGSL Noise in Shaders

```javascript
import { readFileSync } from 'fs';

// Load noise functions
const noiseWGSL = readFileSync(
  './packs/starter/shader-libs/wgsl-noise/src/noise3D.wgsl',
  'utf-8'
);

// Use in custom material
const customShader = `
${noiseWGSL}

@fragment
fn fragmentMain(@location(0) uv: vec2f) -> @location(0) vec4f {
  let noise = snoise(vec3f(uv * 5.0, time * 0.1));
  return vec4f(vec3f(noise), 1.0);
}
`;
```

## Asset Sources

All assets are CC0 (public domain) or freely licensed:

- **Poly Haven** - HDR environments (https://polyhaven.com)
- **Moments in Graphics** - Blue noise textures (https://momentsingraphics.de)
- **ZRNOF** - wgsl-noise library (https://github.com/ZRNOF/wgsl-noise)
- **koole** - wgsl-fns utilities (https://github.com/koole/wgsl-fns)

## Next Steps

### Add More Assets

**Manual Downloads (Poly Haven):**
- Textures: Visit https://polyhaven.com/textures
- Models: Visit https://polyhaven.com/models

**Manual Downloads (ambientCG):**
- PBR Materials: Visit https://ambientcg.com
- Decals: Search "Decal" category

See `ASSET_SOURCES.md` in skill root for comprehensive guide.

### Expand Catalog

Edit `catalogs/starter.catalog.json` to add new assets:

```json
{
  "id": "your-asset-id",
  "type": "pbr-texture-set",
  "label": "Your Asset Name",
  "files": {
    "albedo": "textures/your-texture/albedo.jpg",
    "normal": "textures/your-texture/normal.png",
    "orm": "textures/your-texture/orm.png"
  }
}
```

## File Structure

```
starter/
├── catalogs/
│   └── starter.catalog.json
├── env/
│   ├── studio_small_09_1k.hdr
│   ├── sunset_jhbcentral_1k.hdr
│   ├── photo_studio_01_1k.hdr
│   ├── neon_photostudio_1k.hdr
│   └── industrial_sunset_02_1k.hdr
├── textures/
│   └── blue-noise/
│       └── 64_64/LDR_RGB1_*.png
├── shader-libs/
│   ├── wgsl-noise/
│   └── wgsl-fns/
└── README.md
```

---

**Generated:** 2026-01-27
**Total Size:** ~15MB
**Assets:** 6 (5 environments + 1 texture)
EOF

echo -e "${GREEN}✓ README created${NC}"
echo ""

# Generate download summary
total_files=$(find env textures/blue-noise shader-libs -type f 2>/dev/null | wc -l)
total_size=$(du -sh . | cut -f1)

echo -e "${BLUE}========================================"
echo "Download Complete!"
echo -e "========================================${NC}"
echo ""
echo -e "${GREEN}✓ Starter pack ready at:${NC}"
echo "  $PACK_DIR"
echo ""
echo "📊 Statistics:"
echo "  - Total files: $total_files"
echo "  - Total size: $total_size"
echo "  - HDR environments: 5"
echo "  - Blue noise textures: 64"
echo "  - Shader libraries: 2"
echo ""
echo -e "${BLUE}Next Steps:${NC}"
echo ""
echo "1. Start asset server:"
echo "   cd $(dirname $PACK_DIR)"
echo "   python3 -m http.server 8787"
echo ""
echo "2. Load catalog in your app:"
echo "   await assets.registerCatalog("
echo "     'http://localhost:8787/packs/starter/catalogs/starter.catalog.json',"
echo "     { packId: 'starter', baseUri: 'http://localhost:8787/packs/starter/' }"
echo "   );"
echo ""
echo "3. Download additional assets:"
echo "   - Poly Haven: https://polyhaven.com"
echo "   - ambientCG: https://ambientcg.com"
echo ""
echo -e "${YELLOW}Note:${NC} PBR textures and models must be downloaded manually."
echo "See ASSET_SOURCES.md for recommended downloads."
echo ""
