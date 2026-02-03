#!/bin/bash

###############################################################################
# Asset Organizer for Downloads Folder
#
# This script:
# 1. Scans ~/Downloads for 3D assets (GLB, GLTF, OBJ, FBX, HDR, EXR)
# 2. Identifies and renames assets with descriptive names
# 3. Organizes them into asset-packs directory
# 4. Generates catalog entries
###############################################################################

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

DOWNLOADS_DIR="$HOME/Downloads"
ASSET_PACK_DIR="$HOME/.claude/asset-packs/webgpu-threejs-tsl/packs/downloads-pack"

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}Asset Organizer - Downloads Folder${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""

# Create directories
echo "Creating asset pack structure..."
mkdir -p "$ASSET_PACK_DIR"/{models,env,textures,images}
echo -e "${GREEN}✓ Directories created${NC}"
echo ""

# Asset counter
MODEL_COUNT=0
ENV_COUNT=0
TEXTURE_SET_COUNT=0

# Catalog header
CATALOG_FILE="$ASSET_PACK_DIR/downloads.catalog.json"
cat > "$CATALOG_FILE" <<'EOF'
{
  "version": "1.0.0",
  "pack": {
    "id": "downloads-pack",
    "name": "Downloads Asset Pack",
    "description": "Curated assets from Downloads folder",
    "author": "User Collection",
    "license": "Mixed (check individual assets)"
  },
  "assets": [
EOF

echo -e "${BLUE}=== Processing GLB Models ===${NC}"
echo ""

# Array to store catalog entries
CATALOG_ENTRIES=()

# Process GLB models
while IFS= read -r glb_file; do
    if [ -f "$glb_file" ]; then
        MODEL_COUNT=$((MODEL_COUNT + 1))

        # Get file size for description
        SIZE=$(du -h "$glb_file" | cut -f1)
        BASENAME=$(basename "$glb_file" .glb)

        # Try to determine model type from filename or size
        MODEL_NAME=""
        DESCRIPTION=""
        TAGS=""

        # Check specific known models
        if [[ "$BASENAME" == *"cactus"* ]]; then
            MODEL_NAME="large-cactus-potted"
            DESCRIPTION="Large potted cactus plant (${SIZE})"
            TAGS='["plant", "cactus", "decorative", "indoor"]'
        elif [[ "$BASENAME" == *"twin"* ]] || [[ "$glb_file" == *"twin"* ]]; then
            MODEL_NAME="twin-pots-plant"
            DESCRIPTION="Twin decorative pots with plant (${SIZE})"
            TAGS='["plant", "decorative", "pot", "indoor"]'
        else
            # Generic naming based on size
            SIZE_BYTES=$(stat -f%z "$glb_file")
            if [ $SIZE_BYTES -gt 10000000 ]; then
                MODEL_NAME="detailed-model-${MODEL_COUNT}"
                DESCRIPTION="High-detail 3D model (${SIZE})"
                TAGS='["detailed", "high-poly"]'
            elif [ $SIZE_BYTES -gt 5000000 ]; then
                MODEL_NAME="standard-model-${MODEL_COUNT}"
                DESCRIPTION="Standard 3D model (${SIZE})"
                TAGS='["standard", "medium-poly"]'
            else
                MODEL_NAME="simple-model-${MODEL_COUNT}"
                DESCRIPTION="Simple 3D model (${SIZE})"
                TAGS='["simple", "low-poly"]'
            fi
        fi

        # Copy to models directory
        NEW_NAME="${MODEL_NAME}.glb"
        cp "$glb_file" "$ASSET_PACK_DIR/models/$NEW_NAME"

        echo -e "${GREEN}✓${NC} $BASENAME → ${YELLOW}$MODEL_NAME${NC}"
        echo "   Size: $SIZE"
        echo "   Dest: models/$NEW_NAME"
        echo ""

        # Add to catalog
        CATALOG_ENTRY=$(cat <<ENTRY
    {
      "id": "downloads-pack/${MODEL_NAME}",
      "type": "model",
      "label": "$(echo $MODEL_NAME | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2));}1')",
      "description": "${DESCRIPTION}",
      "files": {
        "glb": "models/${NEW_NAME}"
      },
      "tags": ${TAGS},
      "metadata": {
        "originalFilename": "$(basename "$glb_file")",
        "fileSize": "${SIZE}",
        "source": "downloads"
      }
    }
ENTRY
)
        CATALOG_ENTRIES+=("$CATALOG_ENTRY")
    fi
done < <(find "$DOWNLOADS_DIR" -maxdepth 1 -type f -name "*.glb" 2>/dev/null)

echo -e "${BLUE}=== Processing Environments (HDR/EXR) ===${NC}"
echo ""

# Process HDR/EXR files
while IFS= read -r env_file; do
    if [ -f "$env_file" ]; then
        ENV_COUNT=$((ENV_COUNT + 1))

        SIZE=$(du -h "$env_file" | cut -f1)
        BASENAME=$(basename "$env_file")
        EXT="${BASENAME##*.}"
        NAME_PART="${BASENAME%.*}"

        # Parse Poly Haven naming convention
        if [[ "$NAME_PART" =~ (.+)_([0-9]+)k$ ]]; then
            ENV_BASE="${BASH_REMATCH[1]}"
            RESOLUTION="${BASH_REMATCH[2]}k"
        else
            ENV_BASE="$NAME_PART"
            RESOLUTION="1k"
        fi

        # Clean up name
        ENV_NAME=$(echo "$ENV_BASE" | tr '_' '-')

        # Determine type from name
        if [[ "$ENV_NAME" =~ studio|photostudio ]]; then
            ENV_TYPE="studio"
            TAGS='["studio", "indoor", "neutral"]'
        elif [[ "$ENV_NAME" =~ sunset|outdoor ]]; then
            ENV_TYPE="outdoor"
            TAGS='["outdoor", "sunset", "warm"]'
        elif [[ "$ENV_NAME" =~ industrial ]]; then
            ENV_TYPE="industrial"
            TAGS='["industrial", "urban"]'
        else
            ENV_TYPE="generic"
            TAGS='["generic"]'
        fi

        NEW_NAME="${ENV_NAME}.${EXT}"
        cp "$env_file" "$ASSET_PACK_DIR/env/$NEW_NAME"

        echo -e "${GREEN}✓${NC} $BASENAME → ${YELLOW}$ENV_NAME${NC}"
        echo "   Type: $ENV_TYPE | Resolution: $RESOLUTION"
        echo "   Size: $SIZE"
        echo "   Dest: env/$NEW_NAME"
        echo ""

        # Add to catalog
        CATALOG_ENTRY=$(cat <<ENTRY
    {
      "id": "downloads-pack/${ENV_NAME}",
      "type": "environment",
      "label": "$(echo $ENV_NAME | sed 's/-/ /g' | awk '{for(i=1;i<=NF;i++) $i=toupper(substr($i,1,1)) tolower(substr($i,2));}1')",
      "description": "${ENV_TYPE} environment (${RESOLUTION}, ${SIZE})",
      "files": {
        "${EXT}": "env/${NEW_NAME}"
      },
      "defaults": {
        "intensity": 1.0,
        "exposure": 1.0
      },
      "tags": ${TAGS},
      "metadata": {
        "resolution": "${RESOLUTION}",
        "format": "${EXT}",
        "source": "downloads"
      }
    }
ENTRY
)
        CATALOG_ENTRIES+=("$CATALOG_ENTRY")
    fi
done < <(find "$DOWNLOADS_DIR" -maxdepth 1 -type f \( -name "*.hdr" -o -name "*.exr" \) 2>/dev/null)

echo -e "${BLUE}=== Processing Twin Pots Model ===${NC}"
echo ""

# Special handling for twin pots with textures
TWIN_POTS_DIR="$DOWNLOADS_DIR/uploads_files_5913417_twin+pots"
if [ -d "$TWIN_POTS_DIR" ]; then
    MODEL_COUNT=$((MODEL_COUNT + 1))
    TEXTURE_SET_COUNT=$((TEXTURE_SET_COUNT + 1))

    # Copy model files
    if [ -f "$TWIN_POTS_DIR/twin pots.gltf" ]; then
        cp "$TWIN_POTS_DIR/twin pots.gltf" "$ASSET_PACK_DIR/models/twin-pots.gltf"
        cp "$TWIN_POTS_DIR/twin pots.bin" "$ASSET_PACK_DIR/models/twin-pots.bin"
        echo -e "${GREEN}✓${NC} twin pots.gltf → ${YELLOW}twin-pots${NC}"
    fi

    # Copy textures
    TEXTURE_DIR="$TWIN_POTS_DIR/textures/GreenLeaf10_packed_2K"
    if [ -d "$TEXTURE_DIR" ]; then
        mkdir -p "$ASSET_PACK_DIR/textures/green-leaf"
        cp "$TEXTURE_DIR/GreenLeaf10_2K_back_BaseColor.png" "$ASSET_PACK_DIR/textures/green-leaf/albedo.png"
        cp "$TEXTURE_DIR/GreenLeaf10_2K_back_Normal.png" "$ASSET_PACK_DIR/textures/green-leaf/normal.png"

        echo -e "${GREEN}✓${NC} GreenLeaf textures → ${YELLOW}green-leaf${NC}"
        echo "   - albedo.png (BaseColor)"
        echo "   - normal.png (Normal)"
        echo ""

        # Add texture set to catalog
        CATALOG_ENTRY=$(cat <<'ENTRY'
    {
      "id": "downloads-pack/green-leaf-textures",
      "type": "pbr-texture-set",
      "label": "Green Leaf Plant Textures",
      "description": "PBR texture set for plant foliage (2K resolution)",
      "files": {
        "albedo": "textures/green-leaf/albedo.png",
        "normal": "textures/green-leaf/normal.png"
      },
      "defaults": {
        "colorSpace": "srgb",
        "normalScale": [1, 1],
        "wrapS": "RepeatWrapping",
        "wrapT": "RepeatWrapping"
      },
      "tags": ["pbr", "plant", "foliage", "2k", "organic"],
      "metadata": {
        "resolution": "2048x2048",
        "source": "downloads"
      }
    }
ENTRY
)
        CATALOG_ENTRIES+=("$CATALOG_ENTRY")
    fi

    # Add model to catalog
    CATALOG_ENTRY=$(cat <<'ENTRY'
    {
      "id": "downloads-pack/twin-pots-plant",
      "type": "model",
      "label": "Twin Pots With Plant",
      "description": "Decorative twin pots with green plant",
      "files": {
        "gltf": "models/twin-pots.gltf"
      },
      "tags": ["plant", "decorative", "pot", "indoor", "foliage"],
      "metadata": {
        "hasTextures": true,
        "textureSet": "green-leaf-textures",
        "source": "downloads"
      }
    }
ENTRY
)
    CATALOG_ENTRIES+=("$CATALOG_ENTRY")
fi

# Write catalog entries
for i in "${!CATALOG_ENTRIES[@]}"; do
    echo "${CATALOG_ENTRIES[$i]}" >> "$CATALOG_FILE"

    # Add comma if not last entry
    if [ $i -lt $((${#CATALOG_ENTRIES[@]} - 1)) ]; then
        echo "," >> "$CATALOG_FILE"
    fi
done

# Close catalog JSON
cat >> "$CATALOG_FILE" <<'EOF'
  ]
}
EOF

echo -e "${BLUE}========================================${NC}"
echo -e "${GREEN}Organization Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo ""
echo "Summary:"
echo "  Models: $MODEL_COUNT"
echo "  Environments: $ENV_COUNT"
echo "  Texture Sets: $TEXTURE_SET_COUNT"
echo "  Total Assets: $((MODEL_COUNT + ENV_COUNT + TEXTURE_SET_COUNT))"
echo ""
echo "Asset Pack Location:"
echo "  $ASSET_PACK_DIR"
echo ""
echo "Catalog Generated:"
echo "  $CATALOG_FILE"
echo ""
echo "Next Steps:"
echo "  1. Review assets: ls -lh $ASSET_PACK_DIR/*/"
echo "  2. View catalog: cat $CATALOG_FILE | jq"
echo "  3. Start server: cd ~/.claude/asset-packs/webgpu-threejs-tsl && ./start-server.sh"
echo ""
