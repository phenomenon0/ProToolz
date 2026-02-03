# Model Inspection & Renaming Guide

**Purpose:** Identify and properly name 3D models from Downloads folder
**Tool:** Model Inspector (`examples/model-inspector.html`)
**Time:** ~5-10 minutes for 15 models

---

## Overview

The Model Inspector is a visual tool that lets you:
1. **View** 3D models in an interactive viewer
2. **Inspect** geometry stats (vertices, triangles, dimensions)
3. **Rename** models with descriptive names
4. **Tag** models for easy searching
5. **Export** updated catalog with all changes

---

## Setup (One-Time)

### 1. Ensure Servers Are Running

You need TWO servers running:

**Asset Server (Port 8787) - CORS-enabled:**
```bash
cd ~/.claude/asset-packs/webgpu-threejs-tsl
python3 cors-server.py
```

**Web Server (Port 8080):**
```bash
cd ~/.claude/skills/webgpu-threejs-tsl
python3 -m http.server 8080
```

### 2. Open Model Inspector

```bash
open http://localhost:8080/examples/model-inspector.html
```

Or in your browser: `http://localhost:8080/examples/model-inspector.html`

---

## The Inspection Process

### Step 1: Visual Identification

**Look at the model in the 3D viewer:**
- Rotate with mouse drag
- Zoom with scroll wheel
- Pan with right-click drag

**Use the controls:**
- **Reset** - Return to default camera position
- **Wireframe** - Toggle wireframe view to see topology
- **Grid** - Toggle floor grid

**Check the stats panel:**
- **Vertices** - Higher = more detailed
- **Triangles** - Polygon count
- **Dimensions** - Physical size (X×Y×Z)
- **File Size** - Storage size

### Step 2: Determine Model Type

**Ask yourself:**
1. What is it? (chair, lamp, dragon, plant, etc.)
2. What category? (furniture, creature, decoration, etc.)
3. What style? (realistic, low-poly, fantasy, etc.)
4. What use case? (indoor, outdoor, game asset, etc.)

### Step 3: Choose a Name

**Naming Convention:**
- Use **kebab-case** (lowercase with hyphens)
- Be **descriptive** but concise
- Include **key characteristics** if relevant

**Good Examples:**
```
chinese-dragon          ✓ Clear, specific
office-chair-modern     ✓ Includes style
potted-cactus-large     ✓ Includes size
desk-lamp-adjustable    ✓ Includes feature
```

**Bad Examples:**
```
model1                  ✗ Not descriptive
ChineseDragon          ✗ Wrong case
dragon_red             ✗ Use hyphens, not underscores
very-detailed-dragon   ✗ Too verbose
```

### Step 4: Write Description

**Format:** `[Type] with [key features] ([size], [detail level])`

**Examples:**
```
Oriental dragon with detailed scales and traditional design (12M, high-poly)
Modern office chair with wheels and adjustable height (7M, medium-poly)
Decorative potted cactus for indoor scenes (2.8M, low-poly)
Adjustable desk lamp with metallic finish (5M, medium-poly)
```

**Include:**
- What it is
- Key visual features
- File size (from stats)
- Polygon count category (low/medium/high)

### Step 5: Add Tags

**Tag Categories:**

**By Type:**
- `furniture`, `plant`, `creature`, `decorative`, `tool`, `vehicle`

**By Location:**
- `indoor`, `outdoor`, `office`, `home`, `fantasy`, `sci-fi`

**By Style:**
- `realistic`, `low-poly`, `stylized`, `cartoon`, `fantasy`

**By Detail Level:**
- `high-poly`, `medium-poly`, `low-poly`

**By Function:**
- `prop`, `background`, `hero-asset`, `game-ready`

**Example Tag Sets:**
```
Dragon: dragon, fantasy, creature, high-poly, hero-asset
Office Chair: furniture, chair, office, indoor, medium-poly
Cactus: plant, decorative, indoor, low-poly, prop
```

**Best Practices:**
- Use 3-6 tags per model
- Start specific, then add general
- Think about how you'd search for it
- Include polygon count tag

### Step 6: Save Changes

Click **"Save Changes"** button after:
1. Entering new name
2. Writing label
3. Adding description
4. Adding all tags

You'll see: ✓ Changes saved! Remember to export catalog when done.

---

## Complete Workflow Example

### Example: Identifying "detailed-model-13"

**1. Look at the model:**
- It's a dragon!
- Orange/red scales
- Coiled/serpentine body
- Asian/Chinese style
- Very detailed scales

**2. Check stats:**
- Vertices: ~500,000
- Triangles: ~250,000
- File Size: 12M
- Dimensions: 3×2×4 units

**3. Fill in fields:**

**New Name:**
```
chinese-dragon
```

**Display Label:**
```
Chinese Dragon
```

**Description:**
```
Oriental dragon with detailed scales and traditional design (12M, high-poly)
```

**Tags:** (add one at a time, press Enter after each)
```
dragon
fantasy
creature
high-poly
hero-asset
oriental
```

**4. Save:**
- Click "Save Changes"
- See confirmation message

**5. Move to next model:**
- Click next model card in sidebar
- Repeat process

---

## Batch Processing Strategy

### For 15 Models, Use This Order:

**1. Quick Scan (2 minutes)**
- Click through all models quickly
- Make mental notes
- Identify obvious ones first

**2. Categorize (3 minutes)**
- Group similar models
- Plants together
- Furniture together
- Creatures together

**3. Rename Easy Ones (5 minutes)**
- Start with clearly identifiable models
- Cactus, dragon, obvious furniture

**4. Research Unclear Ones (5 minutes)**
- Generic models that need closer inspection
- Toggle wireframe
- Check from all angles
- Use file size as hint (bigger = more complex)

**5. Export (1 minute)**
- Click "Save Catalog"
- Download updated JSON

---

## Common Model Types & Naming

### Furniture
```
office-chair-modern
desk-wooden-vintage
table-round-metal
bookshelf-tall
lamp-desk-adjustable
```

**Tags:** furniture, indoor, office/home, [material], [style]

### Plants
```
potted-cactus-large
succulent-small
palm-tree-tropical
fern-hanging
```

**Tags:** plant, decorative, indoor/outdoor, [size]

### Creatures/Characters
```
dragon-chinese
bird-tropical
horse-realistic
character-humanoid
```

**Tags:** creature, [species], [style], fantasy/realistic

### Decorations
```
vase-ceramic-tall
picture-frame-ornate
candle-holder-vintage
sculpture-abstract
```

**Tags:** decorative, indoor, [material], [style]

### Vehicles
```
car-sedan-modern
bicycle-mountain
cart-wooden-medieval
```

**Tags:** vehicle, [type], [era], outdoor

### Tools/Props
```
hammer-claw
wrench-adjustable
sword-medieval
shield-round
```

**Tags:** tool, prop, [type], [era]

---

## After Renaming All Models

### 1. Export the Catalog

Click **"Save Catalog"** button in the inspector.

**Result:** Downloads `downloads-updated.catalog.json`

### 2. Backup Original Catalog

```bash
cd ~/.claude/asset-packs/webgpu-threejs-tsl/packs/downloads-pack
cp downloads.catalog.json downloads.catalog.backup.json
```

### 3. Replace Catalog

```bash
# Move downloaded file to asset pack
mv ~/Downloads/downloads-updated.catalog.json ~/.claude/asset-packs/webgpu-threejs-tsl/packs/downloads-pack/downloads.catalog.json
```

### 4. Rename Model Files (Optional)

If you want the filenames to match the new names:

```bash
cd ~/.claude/asset-packs/webgpu-threejs-tsl/packs/downloads-pack/models

# Example: Rename dragon
mv detailed-model-13.glb chinese-dragon.glb

# Update catalog to match new filename
```

**Note:** You must update the catalog's `files.glb` path if you rename files!

### 5. Test the Updated Catalog

```bash
# Reload model inspector
open http://localhost:8080/examples/model-inspector.html

# Or test in asset browser
open http://localhost:8080/examples/asset-browser.html
```

### 6. Export Inspection Report

Click **"Export Report"** for a markdown summary:

```markdown
## Chinese Dragon
**ID:** downloads-pack/chinese-dragon
**Tags:** dragon, fantasy, creature, high-poly, hero-asset
**Description:** Oriental dragon with detailed scales...
**Size:** 12M

## Office Chair Modern
**ID:** downloads-pack/office-chair-modern
...
```

Save this in `docs/downloads-pack-inventory.md` for future reference.

---

## Troubleshooting

### "Error: Could not load catalog"

**Problem:** Asset server not running or CORS issue

**Solution:**
```bash
# Make sure CORS server is running
cd ~/.claude/asset-packs/webgpu-threejs-tsl
python3 cors-server.py
```

### "Model not loading / blank screen"

**Problem:** Model file path incorrect or file corrupted

**Solution:**
1. Check browser console for errors
2. Verify file exists:
   ```bash
   ls -lh ~/.claude/asset-packs/webgpu-threejs-tsl/packs/downloads-pack/models/
   ```
3. Try loading in a separate viewer (Blender, etc.)

### "Changes not saving"

**Problem:** Browser blocking local storage or catalog not writable

**Solution:**
1. Check browser console
2. Make sure you clicked "Save Changes"
3. Export catalog manually at end

### "Inspector very slow"

**Problem:** High-poly models causing performance issues

**Solution:**
1. Close other browser tabs
2. Use wireframe mode for inspection
3. Inspect high-poly models last

---

## Tips & Best Practices

### Naming Tips

1. **Be consistent** - Pick a style and stick to it
2. **Think searchability** - How would you search for this?
3. **Avoid abbreviations** - Use `modern` not `mod`
4. **Be specific** - `chair-office` not just `chair`
5. **Group related** - Prefix series: `plant-cactus`, `plant-palm`

### Tagging Tips

1. **Start specific, end general** - `dragon` before `creature`
2. **Include polygon count** - Helps with LOD selection
3. **Add use-case tags** - `game-ready`, `hero-asset`, `background`
4. **Think categories** - What filters would be useful?

### Inspection Tips

1. **Use wireframe** - See topology and detail level
2. **Check all angles** - Rotate 360°
3. **Compare sizes** - Use grid for scale reference
4. **Note quality** - UV seams, smoothing, etc.

### Workflow Tips

1. **Do similar models together** - Easier to maintain consistency
2. **Take breaks** - Eyes get tired after ~30 minutes
3. **Document decisions** - Write notes for unclear models
4. **Test early** - Export and test catalog after first 5 models

---

## Model Inspection Checklist

For each model, verify:

- [ ] Name is descriptive and kebab-case
- [ ] Label is properly capitalized
- [ ] Description includes key features
- [ ] Description includes file size
- [ ] Description includes polygon count level
- [ ] 3-6 relevant tags added
- [ ] Polygon count tag included (high/medium/low-poly)
- [ ] Use-case tag added (prop, hero-asset, etc.)
- [ ] Category tag added (furniture, plant, creature, etc.)
- [ ] "Save Changes" clicked
- [ ] Green confirmation message seen

---

## Example: Complete Inspection Session

```bash
# 1. Start servers
Terminal 1: cd ~/.claude/asset-packs/webgpu-threejs-tsl && python3 cors-server.py
Terminal 2: cd ~/.claude/skills/webgpu-threejs-tsl && python3 -m http.server 8080

# 2. Open inspector
open http://localhost:8080/examples/model-inspector.html

# 3. Inspect each model (repeat 15 times):
- Click model card
- Rotate and view model
- Fill in name, label, description
- Add 3-6 tags
- Click "Save Changes"
- See confirmation ✓

# 4. Export catalog
- Click "Save Catalog"
- File downloads to ~/Downloads/

# 5. Backup and replace
cd ~/.claude/asset-packs/webgpu-threejs-tsl/packs/downloads-pack
cp downloads.catalog.json downloads.catalog.backup.json
mv ~/Downloads/downloads-updated.catalog.json ./downloads.catalog.json

# 6. Export report
- Click "Export Report"
- Save to docs/downloads-pack-inventory.md

# 7. Test
open http://localhost:8080/examples/asset-browser.html
```

---

## Quick Reference

### Keyboard Shortcuts (in 3D viewer)
- **Mouse Drag** - Rotate camera
- **Mouse Wheel** - Zoom in/out
- **Right-Click Drag** - Pan camera
- **Enter** (in tag input) - Add tag

### Button Reference
- **Reset** - Reset camera to default position
- **Wireframe** - Toggle wireframe view
- **Grid** - Toggle floor grid
- **Save Changes** - Save current model edits
- **Save Catalog** - Export entire catalog as JSON
- **Export Report** - Generate markdown inventory

### File Locations
```
Model Inspector:
  ~/.claude/skills/webgpu-threejs-tsl/examples/model-inspector.html

Asset Catalog:
  ~/.claude/asset-packs/webgpu-threejs-tsl/packs/downloads-pack/downloads.catalog.json

Model Files:
  ~/.claude/asset-packs/webgpu-threejs-tsl/packs/downloads-pack/models/

CORS Server:
  ~/.claude/asset-packs/webgpu-threejs-tsl/cors-server.py
```

---

## What's Next?

After renaming all models:

1. **Document findings** - Export report and review
2. **Organize by category** - Consider creating sub-catalogs
3. **Add previews** - Generate thumbnail images
4. **Test in demos** - Use renamed models in showcase demos
5. **Share catalog** - Publish to team or personal site

---

**Last Updated:** 2026-01-28
**Tool Version:** Model Inspector v1.0
**Status:** Production Ready
