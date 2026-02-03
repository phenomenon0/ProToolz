# Model Inspector - Quick Start

**Goal:** Rename 15 models from Downloads in ~10 minutes

---

## 1. Start Servers (2 terminals)

```bash
# Terminal 1: Asset server with CORS
cd ~/.claude/asset-packs/webgpu-threejs-tsl
python3 cors-server.py

# Terminal 2: Web server
cd ~/.claude/skills/webgpu-threejs-tsl
python3 -m http.server 8080
```

---

## 2. Open Inspector

```bash
open http://localhost:8080/examples/model-inspector.html
```

---

## 3. For Each Model

### Look
- Rotate model (mouse drag)
- Check wireframe (button)
- Check stats (vertices, size)

### Name
- **New Name:** `kebab-case-name`
- **Label:** Title Case Name
- **Description:** `What it is with features (size, poly-count)`

### Tag (3-6 tags, press Enter after each)
- Type (furniture, plant, creature)
- Location (indoor, outdoor)
- Style (realistic, fantasy, low-poly)
- Detail (high-poly, medium-poly, low-poly)

### Save
- Click "Save Changes"
- Wait for ✓ confirmation

---

## 4. Export

```bash
# In inspector:
Click "Save Catalog"

# In terminal:
cd ~/.claude/asset-packs/webgpu-threejs-tsl/packs/downloads-pack
cp downloads.catalog.json downloads.catalog.backup.json
mv ~/Downloads/downloads-updated.catalog.json ./downloads.catalog.json
```

---

## Example

**Model 13 (Dragon):**

Name: `chinese-dragon`
Label: `Chinese Dragon`
Description: `Oriental dragon with detailed scales and traditional design (12M, high-poly)`
Tags: `dragon`, `fantasy`, `creature`, `high-poly`, `hero-asset`

---

## Naming Patterns

```
[type]-[descriptor]-[variant]

Examples:
office-chair-modern       ✓
desk-lamp-adjustable      ✓
potted-cactus-large       ✓
dragon-chinese            ✓
```

---

## Common Tags

**Type:** furniture, plant, creature, tool, decorative, vehicle
**Location:** indoor, outdoor, office, home, fantasy
**Style:** realistic, stylized, low-poly, cartoon, fantasy
**Detail:** high-poly, medium-poly, low-poly
**Use:** prop, hero-asset, background, game-ready

---

## Troubleshooting

**Can't load catalog?**
→ Check CORS server running on 8787

**Model won't load?**
→ Check browser console for errors

**Slow performance?**
→ Use wireframe mode, close other tabs

---

## Done!

Your models now have:
- ✓ Descriptive names
- ✓ Searchable tags
- ✓ Updated catalog
- ✓ Ready to use in demos
