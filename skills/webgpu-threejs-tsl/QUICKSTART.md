# Quick Start Guide

Get up and running with the Story System in 5 minutes.

## Prerequisites

- Node.js installed (for local server)
- Modern browser (Chrome 90+, Firefox 88+, Safari 14+)

## Step 1: Start Local Server

```bash
cd /Users/jethrovic/.claude/skills/webgpu-threejs-tsl
npx http-server . -p 8080
```

## Step 2: View the Demo

Open in your browser:
```
http://localhost:8080/examples/renaissance-scrollytell.html
```

**Note:** The demo requires asset files that may not exist yet. If you see errors, proceed to Step 3.

## Step 3: Create a Minimal Demo (No Assets Required)

Create `examples/minimal-demo.html`:

```html
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>Minimal Story Demo</title>
  <style>
    * { margin: 0; padding: 0; }
    body { background: #000; color: #fff; }
    #story-canvas {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100vh;
      z-index: 1;
    }
    .story-container {
      position: relative;
      z-index: 2;
    }
    .story-section {
      min-height: 200vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .content {
      max-width: 600px;
      text-align: center;
      padding: 2rem;
    }
  </style>
</head>
<body>
  <canvas id="story-canvas"></canvas>

  <div class="story-container">
    <section data-section-id="simple">
      <div class="content">
        <h1>Scroll Story Demo</h1>
        <p>Scroll down to see the animation</p>
      </div>
    </section>
  </div>

  <script type="importmap">
    {
      "imports": {
        "three": "https://cdn.jsdelivr.net/npm/three@0.171.0/build/three.module.js"
      }
    }
  </script>

  <script type="module">
    import * as THREE from 'three';
    import { StoryRunner } from '../story/StoryRunner.js';
    import { BlockRegistry } from '../scene-blocks/BlockRegistry.js';
    import { BaseBlock } from '../scene-blocks/BaseBlock.js';

    // Create a simple block
    class SimpleBlock extends BaseBlock {
      async mount({ scene, camera, renderer, assets, params }) {
        await super.mount({ scene, camera, renderer, assets, params });

        // Create a rotating cube
        const geometry = new THREE.BoxGeometry(2, 2, 2);
        const material = new THREE.MeshStandardMaterial({ color: 0x00ff00 });
        this.cube = new THREE.Mesh(geometry, material);

        this.addObject(this.cube);
        this.trackDisposable(geometry);
        this.trackDisposable(material);

        // Add light
        const light = new THREE.DirectionalLight(0xffffff, 1);
        light.position.set(5, 5, 5);
        this.addObject(light);
      }

      update({ progress, time, viewport, state }) {
        if (!this.cube) return;

        // Rotate cube
        this.cube.rotation.y = time;

        // Apply state from timeline
        if (state.scale !== undefined) {
          this.cube.scale.setScalar(state.scale);
        }
        if (state.color !== undefined) {
          this.cube.material.color.setHex(state.color);
        }
      }
    }

    // Register block
    BlockRegistry.register('SimpleBlock', SimpleBlock);

    // Create inline story config
    const storyConfig = {
      version: "1.0.0",
      sections: [{
        id: "simple",
        block: "SimpleBlock",
        assets: {},
        params: {},
        timeline: [
          { t: 0.0, scale: 0.5, color: 0xff0000 },
          { t: 0.5, scale: 1.5, color: 0x00ff00 },
          { t: 1.0, scale: 1.0, color: 0x0000ff }
        ]
      }]
    };

    // Initialize
    const runner = new StoryRunner(storyConfig, {
      canvasSelector: '#story-canvas',
      containerSelector: '.story-container',
      debugMode: true
    });

    await runner.init();
    console.log('Demo ready! Press D to toggle debug overlay.');
  </script>
</body>
</html>
```

## Step 4: View Minimal Demo

```
http://localhost:8080/examples/minimal-demo.html
```

You should see:
- A green cube that scales and changes color as you scroll
- Debug overlay (press 'D' to toggle)
- Smooth scroll-driven animation

## Step 5: Explore the Code

**Key Files to Understand:**

1. **Story Configuration** (`storyConfig` object in demo):
   - Defines sections, blocks, timelines
   - No external assets needed

2. **Custom Block** (`SimpleBlock` class):
   - Extends `BaseBlock`
   - Creates 3D objects in `mount()`
   - Updates based on scroll in `update()`

3. **StoryRunner** (initialization):
   - Takes story config
   - Manages Three.js renderer
   - Coordinates scroll and rendering

## Step 6: Customize

Try modifying the timeline:

```javascript
timeline: [
  { t: 0.0, scale: 0.1, color: 0xff00ff },  // Start: small, magenta
  { t: 0.3, scale: 2.0, color: 0xffff00 },  // Middle: large, yellow
  { t: 1.0, scale: 1.0, color: 0x00ffff }   // End: normal, cyan
]
```

Refresh and scroll to see the changes!

## Next Steps

### Learn More

- [Story Authoring Guide](./docs/story-authoring-guide.md) - Complete authoring reference
- [Block Development Guide](./docs/block-development-guide.md) - Build custom blocks
- [Main README](./STORY_SYSTEM_README.md) - Full system documentation

### Try Built-in Blocks

Replace `SimpleBlock` with built-in blocks:

```javascript
import { CloudLayerBlock } from '../scene-blocks/CloudLayerBlock.js';
BlockRegistry.register('CloudLayerBlock', CloudLayerBlock);

// In story config:
{
  block: "CloudLayerBlock",
  params: {
    layerCount: 3,
    baseOpacity: 0.5
  }
}
```

### Use Real Assets

1. Create asset catalog JSON
2. Reference assets in story config
3. Load textures, models, environments

See `examples/renaissance.story.json` for complete example.

## Troubleshooting

### "Failed to fetch" errors

Make sure you're running a local server (Step 1), not opening HTML files directly.

### Import errors

Check that import paths are correct relative to the HTML file location.

### Blank screen

1. Open browser console (F12)
2. Check for errors
3. Verify StoryRunner initialized successfully
4. Press 'D' to see debug overlay

### Section not activating

1. Verify HTML element has `data-section-id` matching story JSON
2. Check element is tall enough (min-height: 200vh)
3. Enable debug mode to see active section

## Support

For issues or questions:
1. Check documentation in `/docs` folder
2. Review example files in `/examples` folder
3. Enable debug mode for diagnostics

## Summary

✅ **You can now:**
- Run the story system locally
- Create simple scroll-driven animations
- Customize timelines and blocks
- Build upon the foundation

**Total time:** ~5 minutes from zero to working demo!
