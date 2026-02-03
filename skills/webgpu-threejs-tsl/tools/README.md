# WebGPU Three.js TSL - Development Tools

**Location:** `/Users/jethrovic/.claude/skills/webgpu-threejs-tsl/tools/`
**Version:** 1.0.0

Interactive CLI tools for creating and managing WebGPU Three.js TSL story configurations.

---

## Quick Start

### Install Dependencies

```bash
cd tools
npm install
```

### Run Story Wizard

```bash
npm run wizard
```

### Validate Story File

```bash
npm run validate path/to/story.json
```

---

## Tools Overview

### 1. Story Wizard (Interactive CLI) ⭐

**File:** `story-wizard.js`
**Purpose:** Guide users through creating story.json files

**Features:**
- ✅ Template selection (blank, simple, renaissance)
- ✅ Interactive section builder
- ✅ Asset reference helper
- ✅ Timeline keyframe creator
- ✅ Parameter configuration
- ✅ Performance settings
- ✅ JSON validation and output
- ✅ Colorized terminal output

**Usage:**
```bash
# Run wizard
npm run wizard

# Or directly
node story-wizard.js
```

**What It Does:**
1. Choose starting template
2. Configure story metadata (title, description)
3. Add asset catalog URLs
4. Create story sections:
   - Select block type
   - Add asset references
   - Configure parameters
   - Build timeline keyframes
5. Configure performance settings
6. Save to JSON file

**Example Output:**
```
╔═══════════════════════════════════════════════════╗
║                                                   ║
║         WebGPU Story.json Wizard                  ║
║                                                   ║
║   Interactive CLI for creating scroll stories    ║
║                                                   ║
╚═══════════════════════════════════════════════════╝

? Choose a starting template: Simple Scroll Story - 3 sections
✓ Loaded template: Simple Scroll Story - 3 sections

── Story Metadata ──────────────────────────────────
? Story title (for reference): My WebGPU Gallery
? Story description: A beautiful scroll-driven gallery

✓ Metadata configured
...
```

---

### 2. Story Validator (Schema Validation)

**File:** `story-validator.js`
**Purpose:** Validate story.json files against schema

**Features:**
- ✅ JSON schema validation (using Ajv)
- ✅ Detailed error messages with line references
- ✅ Additional sanity checks
- ✅ Warning detection (duplicate IDs, missing timelines)
- ✅ Performance recommendations
- ✅ Summary statistics

**Usage:**
```bash
# Validate a story file
npm run validate my-story.story.json

# Or directly
node story-validator.js path/to/story.json
```

**Validation Checks:**
- Schema compliance
- Required fields
- Data types
- Value ranges
- Duplicate section IDs
- Missing timeline keyframes
- Memory budget recommendations
- Prefetch threshold warnings

**Example Output (Valid):**
```
╔═══════════════════════════════════════════════════╗
║                                                   ║
║          ✓ Story is valid!                       ║
║                                                   ║
╚═══════════════════════════════════════════════════╝

Summary:
  Version: 1.0.0
  Sections: 3
  Catalogs: 2

Sections:
  1. intro (TitleBlock)
     └─ Keyframes: 2, Assets: 0
  2. gallery (FeatureRailBlock)
     └─ Keyframes: 3, Assets: 3
  3. outro (TitleBlock)
     └─ Keyframes: 2, Assets: 0
```

**Example Output (Invalid):**
```
╔═══════════════════════════════════════════════════╗
║                                                   ║
║          ✗ Validation Failed                     ║
║                                                   ║
╚═══════════════════════════════════════════════════╝

Errors:

  1. /sections/0
     must have required property 'id'
     Details: { "missingProperty": "id" }

  2. /sections/1/timeline/0/t
     must be <= 1
     Details: { "comparison": "<=", "limit": 1 }
```

---

## Templates

### Blank Template
**Sections:** 0
**Use Case:** Complete freedom, start from scratch

```json
{
  "version": "1.0.0",
  "catalogs": [],
  "sections": []
}
```

### Simple Template
**Sections:** 3 (intro, content, outro)
**Use Case:** Quick prototyping, basic scroll stories

```json
{
  "version": "1.0.0",
  "catalogs": [...],
  "sections": [
    {
      "id": "intro",
      "block": "TitleBlock",
      "timeline": [
        { "t": 0, "opacity": 0 },
        { "t": 1, "opacity": 1, "easing": "easeOutCubic" }
      ]
    },
    {
      "id": "content",
      "block": "FeatureRailBlock",
      "timeline": [...]
    },
    {
      "id": "outro",
      "block": "TitleBlock",
      "timeline": [...]
    }
  ]
}
```

### Renaissance Template
**Sections:** 3 (hero, clouds, features)
**Use Case:** Art galleries, portrait showcases

```json
{
  "version": "1.0.0",
  "catalogs": ["renaissance.catalog.json"],
  "sections": [
    {
      "id": "hero",
      "block": "HeroPaintingBlock",
      "assets": {
        "portrait": "renaissance/hero-portrait",
        "depthMap": "renaissance/hero-portrait-depth",
        "frame": "renaissance/ornate-frame-a"
      },
      "timeline": [...]
    },
    ...
  ]
}
```

---

## Block Types

The wizard supports these block types:

| Block | Description | Assets Needed |
|-------|-------------|---------------|
| **TitleBlock** | Simple title/text section | None |
| **HeroPaintingBlock** | Portrait with ornate frame | portrait, depthMap, frame |
| **CloudLayerBlock** | Atmospheric clouds with parallax | cloudMask |
| **FeatureRailBlock** | Horizontal card carousel | card1, card2, card3, ... |
| **OrnateFrameRevealBlock** | Frame animation reveal | frame, content |
| **Custom** | Your own block | Varies |

---

## Easing Functions

32 easing functions available:

**Basic:**
- `linear`

**Quadratic:**
- `easeInQuad`, `easeOutQuad`, `easeInOutQuad`

**Cubic:**
- `easeInCubic`, `easeOutCubic`, `easeInOutCubic`

**Quartic:**
- `easeInQuart`, `easeOutQuart`, `easeInOutQuart`

**Sine:**
- `easeInSine`, `easeOutSine`, `easeInOutSine`

**Exponential:**
- `easeInExpo`, `easeOutExpo`, `easeInOutExpo`

**Circular:**
- `easeInCirc`, `easeOutCirc`, `easeInOutCirc`

**Back:**
- `easeInBack`, `easeOutBack`, `easeInOutBack`

**Elastic:**
- `easeInElastic`, `easeOutElastic`, `easeInOutElastic`

**Bounce:**
- `easeInBounce`, `easeOutBounce`, `easeInOutBounce`

---

## Workflow Examples

### Create New Story from Scratch

```bash
# Run wizard
npm run wizard

# Choose "Blank Template"
# Add metadata
# Add catalogs
# Create sections manually
# Configure timeline keyframes
# Save as my-story.story.json
```

### Create Story from Template

```bash
# Run wizard
npm run wizard

# Choose "Simple Template" or "Renaissance Template"
# Modify metadata
# Optionally modify sections
# Save
```

### Validate Existing Story

```bash
# Validate
npm run validate my-story.story.json

# Fix any errors
# Re-validate
npm run validate my-story.story.json
```

### Iterate on Story

```bash
# Edit JSON manually
vim my-story.story.json

# Validate changes
npm run validate my-story.story.json

# Test in StoryRunner
# ... load in browser ...
```

---

## Tips & Best Practices

### Story Structure

1. **Start Simple:** Use 3-5 sections for your first story
2. **Progressive Complexity:** Add more sections/keyframes gradually
3. **Consistent Naming:** Use descriptive section IDs (intro, gallery, outro)
4. **Asset Planning:** List all assets before starting wizard

### Timeline Design

1. **Keyframe Count:** 2-5 keyframes per section is usually enough
2. **Easing:** Use easeOut for entrances, easeIn for exits
3. **Timing:** Keep t values evenly spaced for smooth animation
4. **Properties:** Animate opacity + position for best effect

### Performance

1. **Memory Budget:** 512MB is good default, adjust based on asset count
2. **Prefetch Threshold:** 0.6 gives good balance between preload and memory
3. **Dispose Distance:** 2 sections ensures smooth transitions
4. **Concurrent Loads:** 3 is optimal for most connections

### Asset Organization

1. **Catalog Structure:** Group related assets in same catalog
2. **Naming Convention:** Use namespace/asset-name format
3. **Asset References:** Reference by ID, not by file path
4. **Previews:** Include preview images in catalog for easier selection

---

## Troubleshooting

### Wizard Won't Start

**Error:** `Cannot find module 'inquirer'`
**Solution:**
```bash
cd tools
npm install
```

### Validation Fails

**Error:** `must have required property 'id'`
**Solution:** Add missing required field to section

**Error:** `must be <= 1`
**Solution:** Timeline time values must be 0-1

**Error:** `must be string`
**Solution:** Check data types match schema

### Generated JSON is Malformed

**Issue:** Manual edits broke JSON syntax
**Solution:**
1. Use JSON validator (jsonlint.com)
2. Check for missing commas, brackets
3. Re-run wizard to generate fresh file

### Assets Not Loading

**Issue:** Asset IDs don't match catalog
**Solution:**
1. Check catalog URLs in story.json
2. Verify asset IDs exist in catalogs
3. Use validator to check for typos

---

## Advanced Usage

### Custom Blocks

To use custom blocks in wizard:

1. Choose "Custom" when selecting block type
2. Enter your block class name
3. Add required assets manually
4. Configure parameters as needed

Example:
```json
{
  "id": "custom-section",
  "block": "MyCustomBlock",
  "assets": {
    "texture": "pack/my-texture"
  },
  "params": {
    "customParam": "value"
  }
}
```

### Batch Validation

Validate multiple stories:

```bash
for file in stories/*.story.json; do
  echo "Validating $file..."
  npm run validate "$file"
done
```

### CI/CD Integration

Add to package.json scripts:

```json
{
  "scripts": {
    "validate:stories": "for file in stories/*.story.json; do node tools/story-validator.js \"$file\" || exit 1; done"
  }
}
```

---

## Development

### Adding New Templates

Edit `story-wizard.js`:

```javascript
const STORY_TEMPLATES = {
  // ... existing templates ...
  myTemplate: {
    name: 'My Template - Description',
    sections: [
      // ... section config ...
    ]
  }
};
```

### Adding New Easing Functions

Easing functions are sourced from `story/Easing.js`. To add more:

1. Add function to `Easing.js`
2. Add to `EASING_FUNCTIONS` array in wizard
3. Update this README

### Customizing Colors

Edit color definitions in wizard:

```javascript
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  blue: '\x1b[34m',
  // ... add more ...
};
```

---

## Dependencies

- **inquirer** (^9.2.0) - Interactive CLI prompts
- **ajv** (^8.12.0) - JSON schema validation
- **chalk** (^5.3.0) - Terminal colors (optional enhancement)

---

## Output Files

### Story JSON Structure

```json
{
  "version": "1.0.0",
  "title": "My Story",
  "description": "A beautiful scroll story",
  "catalogs": [
    "http://localhost:8787/packs/core/catalogs/core.catalog.json"
  ],
  "sections": [
    {
      "id": "section-1",
      "block": "TitleBlock",
      "assets": {},
      "params": {
        "title": "Welcome"
      },
      "timeline": [
        { "t": 0, "opacity": 0 },
        { "t": 1, "opacity": 1, "easing": "easeOutCubic" }
      ]
    }
  ],
  "performance": {
    "prefetchThreshold": 0.6,
    "disposeDistance": 2,
    "maxConcurrentLoads": 3,
    "budgetMB": 512
  },
  "renderer": {
    "antialias": true,
    "powerPreference": "high-performance"
  }
}
```

---

## Related Documentation

- **Story Authoring Guide:** `../docs/story-authoring-guide.md`
- **Block Development Guide:** `../docs/block-development-guide.md`
- **Story Schema:** `../story/story.schema.json`
- **Story System README:** `../STORY_SYSTEM_README.md`

---

## Support

### Common Questions

**Q: Can I edit the generated JSON manually?**
A: Yes! The wizard generates valid JSON that you can edit in any text editor.

**Q: How do I add more keyframes after running wizard?**
A: Edit the JSON file and add keyframes to the `timeline` array, then re-validate.

**Q: Can I use the wizard multiple times on the same file?**
A: No, but you can load templates and save to a new file.

**Q: What if my block isn't in the list?**
A: Choose "Custom" and enter your block class name.

---

## Future Enhancements

- [ ] Visual timeline editor (web-based)
- [ ] Story preview generator
- [ ] Asset browser integration
- [ ] Template marketplace
- [ ] Story diff tool
- [ ] Migration tool (v1 → v2)

---

**Last Updated:** 2026-01-27
**Version:** 1.0.0
**Status:** Production Ready ✅
