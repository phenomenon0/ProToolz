# Story Authoring Guide

Complete guide to creating scroll-driven cinematic experiences using the Story system.

## Table of Contents

- [Overview](#overview)
- [Story JSON Format](#story-json-format)
- [Block Catalog](#block-catalog)
- [Timeline Syntax](#timeline-syntax)
- [Easing Functions](#easing-functions)
- [Performance Tuning](#performance-tuning)
- [Example Recipes](#example-recipes)

## Overview

The Story system enables non-technical creators to author scroll-driven cinematic experiences through JSON configuration. No code required - just define your sections, assets, and animation timelines.

**Key Concepts:**
- **Story**: Top-level configuration defining the entire experience
- **Sections**: Individual scroll-activated scenes
- **Blocks**: Reusable visual components (hero portraits, cloud layers, etc.)
- **Timeline**: Animation keyframes that respond to scroll progress
- **Assets**: Images, 3D models, textures managed by the asset library

## Story JSON Format

### Basic Structure

```json
{
  "version": "1.0.0",
  "catalogs": ["url/to/catalog.json"],
  "sections": [...],
  "performance": {...},
  "renderer": {...}
}
```

### Required Fields

- **version**: Semantic version string (e.g., "1.0.0")
- **sections**: Array of section objects (minimum 1)

### Optional Fields

- **catalogs**: Array of asset catalog URLs to load
- **performance**: Performance tuning parameters
- **renderer**: Three.js renderer configuration

## Section Configuration

Each section represents a scroll-activated scene:

```json
{
  "id": "unique-section-id",
  "block": "BlockTypeName",
  "assets": {
    "key": "assetId"
  },
  "params": {
    "blockSpecific": true
  },
  "timeline": [
    { "t": 0.0, "property": value },
    { "t": 1.0, "property": value }
  ]
}
```

### Section Fields

- **id**: Unique identifier (must match HTML `data-section-id` attribute)
- **block**: Block type name from BlockRegistry
- **assets**: Map of asset keys to catalog IDs
- **params**: Block-specific configuration parameters
- **timeline**: Animation keyframes (optional)

## Block Catalog

### HeroPaintingBlock

Hero section with portrait, halo, clouds, and ornate frame.

**Required Assets:**
- `portrait`: Image asset
- `frame`: 3D model asset

**Optional Assets:**
- `portraitDepth`: Depth map for parallax effect
- `cloudAlpha`: Alpha-masked cloud texture
- `env`: Environment map

**Timeline Properties:**
- `cameraZ`: Camera Z position (number)
- `halo`: Halo opacity 0-1 (number)
- `frameScale`: Frame scale 0-1 (number)
- `frameRotation`: Frame rotation in radians (number)

**Example:**
```json
{
  "id": "hero",
  "block": "HeroPaintingBlock",
  "assets": {
    "portrait": "img/hero-portrait",
    "portraitDepth": "img/hero-portrait-depth",
    "cloudAlpha": "img/clouds-wispy",
    "frame": "model/ornate-frame-a"
  },
  "timeline": [
    { "t": 0.0, "cameraZ": 8.0, "halo": 0.0, "frameScale": 0.0 },
    { "t": 1.0, "cameraZ": 3.0, "halo": 1.0, "frameScale": 1.0 }
  ]
}
```

### CloudLayerBlock

Multiple drifting cloud layers with parallax.

**Required Assets:**
- `cloudTexture`: Alpha-masked cloud image

**Parameters:**
- `layerCount`: Number of cloud layers (default: 3)
- `baseOpacity`: Starting opacity (default: 0.4)
- `baseSpeed`: Drift speed multiplier (default: 0.02)
- `baseZ`: Starting Z position (default: -2)
- `layerSpacing`: Depth spacing between layers (default: 0.5)

**Timeline Properties:**
- `cloudOpacity`: Overall opacity multiplier (number)

**Example:**
```json
{
  "id": "clouds",
  "block": "CloudLayerBlock",
  "assets": {
    "cloudTexture": "img/clouds-dense"
  },
  "params": {
    "layerCount": 4,
    "baseOpacity": 0.5
  },
  "timeline": [
    { "t": 0.0, "cloudOpacity": 0.0 },
    { "t": 1.0, "cloudOpacity": 1.0 }
  ]
}
```

### FeatureRailBlock

Horizontal parallax card rail.

**Required Assets:**
- One image asset per card (referenced in params)

**Parameters:**
- `cards`: Array of card configurations:
  - `image`: Asset key for card image
  - `parallaxStrength`: Parallax intensity 0-1
  - `showFrame`: Show border frame (boolean)
- `spacing`: Horizontal spacing between cards (default: 4.5)
- `cardWidth`: Card width (default: 2.5)
- `cardHeight`: Card height (default: 3.5)

**Timeline Properties:**
- `railOpacity`: Overall opacity (number)
- `railScale`: Scale multiplier (number)

**Example:**
```json
{
  "id": "feature-rail",
  "block": "FeatureRailBlock",
  "assets": {
    "card1": "img/feature-1",
    "card2": "img/feature-2"
  },
  "params": {
    "cards": [
      { "image": "card1", "parallaxStrength": 0.3 },
      { "image": "card2", "parallaxStrength": 0.5 }
    ]
  }
}
```

## Timeline Syntax

Timelines define how properties animate based on scroll progress.

### Keyframe Format

```json
{
  "t": 0.5,
  "property1": value1,
  "property2": value2,
  "easing": "easingFunction"
}
```

- **t**: Time position 0-1 (0 = start of section, 1 = end)
- **easing**: Easing function name (optional, default: "linear")
- **properties**: Any number of animated properties

### Value Types

- **Number**: `"opacity": 0.5`
- **Vec3 (array)**: `"position": [1, 2, 3]`
- **Vec3 (object)**: `"rotation": { "x": 0, "y": 1.57, "z": 0 }`
- **Color**: `"tint": "#ff6600"`

### Example Timeline

```json
"timeline": [
  {
    "t": 0.0,
    "opacity": 0.0,
    "scale": 0.8,
    "rotation": 1.57,
    "easing": "easeOutCubic"
  },
  {
    "t": 0.5,
    "opacity": 1.0,
    "scale": 1.0,
    "rotation": 0.0,
    "easing": "easeInOutQuad"
  }
]
```

## Easing Functions

Available easing functions for smooth animations:

### Basic
- `linear`

### Quadratic
- `easeInQuad`, `easeOutQuad`, `easeInOutQuad`

### Cubic
- `easeInCubic`, `easeOutCubic`, `easeInOutCubic`

### Quartic
- `easeInQuart`, `easeOutQuart`, `easeInOutQuart`

### Quintic
- `easeInQuint`, `easeOutQuint`, `easeInOutQuint`

### Sinusoidal
- `easeInSine`, `easeOutSine`, `easeInOutSine`

### Exponential
- `easeInExpo`, `easeOutExpo`, `easeInOutExpo`

### Circular
- `easeInCirc`, `easeOutCirc`, `easeInOutCirc`

### Back (overshoot)
- `easeInBack`, `easeOutBack`, `easeInOutBack`

### Elastic (spring)
- `easeInElastic`, `easeOutElastic`, `easeInOutElastic`

### Bounce
- `easeInBounce`, `easeOutBounce`, `easeInOutBounce`

## Performance Tuning

Configure performance parameters for optimal experience:

```json
"performance": {
  "prefetchThreshold": 0.6,
  "disposeDistance": 2,
  "maxConcurrentLoads": 3,
  "budgetMB": 512
}
```

### Parameters

- **prefetchThreshold**: Progress (0-1) to start prefetching next section (default: 0.6)
- **disposeDistance**: Number of sections back before disposal (default: 2)
- **maxConcurrentLoads**: Maximum concurrent asset loads (default: 3)
- **budgetMB**: GPU memory budget in MB (default: 512)

### Tuning Tips

- **Mobile devices**: Reduce `budgetMB` to 256-384
- **Slow connections**: Increase `prefetchThreshold` to 0.7-0.8
- **Memory-constrained**: Reduce `disposeDistance` to 1
- **Fast networks**: Increase `maxConcurrentLoads` to 5-6

## Example Recipes

### Simple Fade-In Section

```json
{
  "id": "intro",
  "block": "HeroPaintingBlock",
  "assets": {
    "portrait": "img/intro-image"
  },
  "timeline": [
    { "t": 0.0, "cameraZ": 10.0, "halo": 0.0 },
    { "t": 1.0, "cameraZ": 5.0, "halo": 1.0, "easing": "easeOutQuad" }
  ]
}
```

### Multi-Stage Animation

```json
{
  "timeline": [
    { "t": 0.0, "scale": 0.0, "easing": "easeOutBack" },
    { "t": 0.3, "scale": 1.2, "easing": "easeInOutCubic" },
    { "t": 0.6, "scale": 1.0, "easing": "easeOutQuad" },
    { "t": 1.0, "scale": 1.0, "easing": "linear" }
  ]
}
```

### Dramatic Entrance

```json
{
  "timeline": [
    { "t": 0.0, "opacity": 0.0, "scale": 0.5, "rotation": 3.14, "easing": "easeOutExpo" },
    { "t": 0.7, "opacity": 1.0, "scale": 1.1, "rotation": 0.0, "easing": "easeOutBack" },
    { "t": 1.0, "opacity": 1.0, "scale": 1.0, "rotation": 0.0, "easing": "easeInOutQuad" }
  ]
}
```

## HTML Integration

Match section IDs with HTML elements:

```html
<section id="hero" data-section-id="hero">
  <div class="content">
    <h2>Title</h2>
    <p>Description</p>
  </div>
</section>
```

The `data-section-id` attribute must match the section `id` in the story JSON.

## Validation

Use the story schema for validation:

```bash
# Validate with ajv-cli
ajv validate -s story/story.schema.json -d examples/your-story.json
```

## Next Steps

- [Block Development Guide](./block-development-guide.md) - Create custom blocks
- [Asset Library Guide](./asset-library.md) - Manage assets
- [Core Concepts](./core-concepts.md) - Three.js fundamentals
