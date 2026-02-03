#!/bin/bash

# WebGPU Three.js TSL - Asset Server Setup Script
# Creates minimal asset pack structure for testing

set -e

SKILL_DIR="$HOME/.claude/skills/webgpu-threejs-tsl"
ASSET_DIR="$HOME/.claude/asset-packs/webgpu-threejs-tsl/packs"

echo "========================================"
echo "WebGPU Asset Server Setup"
echo "========================================"
echo ""

# Check if running from skill directory
if [ ! -f "$SKILL_DIR/assets/AssetLibrary.js" ]; then
  echo "❌ Error: Skill directory not found at $SKILL_DIR"
  echo "Please ensure webgpu-threejs-tsl skill is installed"
  exit 1
fi

echo "✓ Skill directory found"
echo ""

# Create directory structure
echo "Creating asset directory structure..."
mkdir -p "$ASSET_DIR/core"/{textures,models,env,catalogs,thumbs}
mkdir -p "$ASSET_DIR/renaissance"/{images,models,catalogs}

echo "✓ Directories created at:"
echo "  $ASSET_DIR"
echo ""

# Copy catalogs
echo "Copying catalog files..."
cp "$SKILL_DIR/assets/catalogs/core.catalog.json" "$ASSET_DIR/core/catalogs/"
cp "$SKILL_DIR/assets/catalogs/renaissance.catalog.json" "$ASSET_DIR/renaissance/catalogs/"
echo "✓ Catalogs copied"
echo ""

# Copy renaissance assets (already included)
echo "Copying renaissance pack assets..."
cp -r "$SKILL_DIR/assets/images/"* "$ASSET_DIR/renaissance/images/" 2>/dev/null || true
cp -r "$SKILL_DIR/assets/models/"* "$ASSET_DIR/renaissance/models/" 2>/dev/null || true
echo "✓ Renaissance assets copied"
echo ""

# Create placeholder for core assets
echo "Creating placeholder README for core assets..."
cat > "$ASSET_DIR/core/README.md" << 'EOF'
# Core Asset Pack

This directory should contain the core pack assets referenced in `core.catalog.json`.

## Required Assets

### Textures
Place PBR texture sets in the following structure:
```
textures/
├── oak_wood/
│   ├── albedo.jpg
│   ├── normal.png
│   └── orm.png
├── brushed_aluminum/
│   ├── albedo.jpg
│   ├── normal.png
│   └── orm.png
└── cotton_fabric/
    ├── albedo.jpg
    ├── normal.png
    └── orm.png
```

### HDR Environments
```
env/
├── studio_neutral_1k.hdr
└── outdoor_sunset_1k.hdr
```

### Models
```
models/
├── suzanne.glb
├── torus_knot.glb
└── sphere_lowpoly.glb
```

## Asset Sources (CC0 License)

### PBR Textures
- **ambientCG.com** - Free CC0 PBR materials
- Download 2K resolution, convert to required format

### HDR Environments
- **Poly Haven** - https://polyhaven.com/hdris
- Download 1K resolution .hdr files

### Models
- **Blender** - Create simple test geometry
  - Suzanne: Add > Mesh > Monkey
  - Torus Knot: Add > Mesh > Torus Knot
  - Sphere: Add > Mesh > UV Sphere (subdivisions: 3)
  - Export as GLB: File > Export > glTF 2.0 (.glb)

## Quick Download Commands

### HDR Environments (Poly Haven)
```bash
# Studio neutral lighting
wget https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr \
  -O env/studio_neutral_1k.hdr

# Outdoor sunset
wget https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/sunset_jhbcentral_1k.hdr \
  -O env/outdoor_sunset_1k.hdr
```

### PBR Textures (ambientCG)
Visit https://ambientcg.com/ and download:
- Wood051 (Oak)
- Metal032 (Brushed Aluminum)
- Fabric051 (Cotton)

Extract and rename files to match the structure above.

## Alternative: Use Procedural Assets

If you don't want to download assets, modify demos to use procedural geometry and materials instead.
See `examples/procedural-gallery.html` for examples.
EOF

echo "✓ Core assets README created"
echo ""

# Create asset server start script
echo "Creating server start script..."
cat > "$ASSET_DIR/../start-server.sh" << 'EOF'
#!/bin/bash

echo "Starting asset server on port 8787..."
echo "Asset directory: $(pwd)"
echo ""
echo "Press Ctrl+C to stop"
echo ""

# Try Python first
if command -v python3 &> /dev/null; then
  python3 -m http.server 8787
elif command -v python &> /dev/null; then
  python -m http.server 8787
# Fall back to http-server if available
elif command -v http-server &> /dev/null; then
  http-server -p 8787 --cors
else
  echo "❌ Error: No HTTP server found"
  echo "Install one of:"
  echo "  - Python 3 (recommended)"
  echo "  - http-server: npm install -g http-server"
  exit 1
fi
EOF

chmod +x "$ASSET_DIR/../start-server.sh"
echo "✓ Server start script created"
echo ""

# Create asset download helper
echo "Creating asset download helper..."
cat > "$ASSET_DIR/core/download-assets.sh" << 'EOF'
#!/bin/bash

set -e

echo "========================================"
echo "Downloading Core Pack Assets"
echo "========================================"
echo ""

# Check for wget
if ! command -v wget &> /dev/null; then
  echo "❌ wget not found. Please install wget:"
  echo "  macOS: brew install wget"
  echo "  Linux: sudo apt install wget"
  exit 1
fi

# Download HDR environments
echo "Downloading HDR environments from Poly Haven..."
mkdir -p env

wget -q --show-progress \
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/studio_small_09_1k.hdr" \
  -O env/studio_neutral_1k.hdr

wget -q --show-progress \
  "https://dl.polyhaven.org/file/ph-assets/HDRIs/hdr/1k/sunset_jhbcentral_1k.hdr" \
  -O env/outdoor_sunset_1k.hdr

echo "✓ HDR environments downloaded (2 files)"
echo ""

echo "========================================"
echo "Manual Steps Required"
echo "========================================"
echo ""
echo "PBR Textures and Models must be sourced manually:"
echo ""
echo "1. PBR Textures - Visit https://ambientcg.com/"
echo "   - Download Wood051_2K-JPG.zip (oak wood)"
echo "   - Download Metal032_2K-JPG.zip (brushed aluminum)"
echo "   - Download Fabric051_2K-JPG.zip (cotton)"
echo "   - Extract to textures/ folders"
echo "   - Rename Color.jpg to albedo.jpg"
echo "   - Rename NormalGL.jpg to normal.png"
echo "   - Create ORM texture from separate maps"
echo ""
echo "2. Models - Create in Blender:"
echo "   - Suzanne: Add > Mesh > Monkey"
echo "   - Torus Knot: Add > Mesh > Torus Knot"
echo "   - Sphere: Add > Mesh > UV Sphere (subdivisions: 3)"
echo "   - Export each as GLB to models/ folder"
echo ""
echo "Or use the demos that don't require core pack assets:"
echo "  - origami-gallery.html"
echo "  - procedural-gallery.html"
echo "  - test-simple.html"
echo ""
EOF

chmod +x "$ASSET_DIR/core/download-assets.sh"
echo "✓ Asset download helper created"
echo ""

echo "========================================"
echo "Setup Complete!"
echo "========================================"
echo ""
echo "Asset directory created at:"
echo "  $ASSET_DIR"
echo ""
echo "Next steps:"
echo ""
echo "1. [Optional] Download core pack assets:"
echo "   cd $ASSET_DIR/core"
echo "   ./download-assets.sh"
echo ""
echo "2. Start the asset server:"
echo "   cd $ASSET_DIR/.."
echo "   ./start-server.sh"
echo ""
echo "3. Open demos in your browser:"
echo "   - Renaissance pack (ready to use):"
echo "     open http://localhost:8787/renaissance/images/hero-portrait.jpg"
echo "   - Core pack demos (after downloading assets):"
echo "     cd $SKILL_DIR/examples/showcase-demo"
echo "     open index.html"
echo ""
echo "Or use server-free demos:"
echo "   cd $SKILL_DIR/examples"
echo "   open origami-gallery.html"
echo "   open procedural-gallery.html"
echo "   open test-simple.html"
echo ""
echo "See ASSET_SERVER_SETUP.md for detailed instructions."
echo ""
