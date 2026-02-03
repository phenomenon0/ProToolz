# Asset Library

Catalog-driven asset management system for WebGPU-Three.js-TSL projects.

## Structure

```
assets/
├── AssetLibrary.js              # Main API (singleton)
├── resolvers/                   # HTTP + Cache resolvers
│   ├── HttpResolver.js          # Fetch assets via HTTP
│   └── CacheResolver.js         # Cache Storage wrapper
├── loaders/                     # Specialized asset loaders
│   ├── TextureAssetLoader.js    # PBR texture sets
│   ├── EnvironmentAssetLoader.js# HDR environments + PMREM
│   └── ModelAssetLoader.js      # GLB/GLTF models
└── catalogs/                    # Asset catalog metadata
    └── core.catalog.json        # Core pack catalog

Parent directory:
├── .assetcatalog.schema.json    # JSON Schema for catalogs
```

## Quick Start

```javascript
import { AssetLibrary } from './assets/AssetLibrary.js';

// Initialize
const assets = AssetLibrary.getInstance({
  packs: { core: 'http://localhost:8787/packs/core/' }
});

assets.initialize(renderer);

await assets.registerCatalogFromUrl(
  'http://localhost:8787/packs/core/catalogs/core.catalog.json',
  { packId: 'core', baseUri: 'http://localhost:8787/packs/core/' }
);

// Load assets
const material = await assets.createPBRMaterial('pbr/oak-wood');
const envMap = await assets.getEnvironment('env/studio-neutral');
const model = await assets.getModel('model/suzanne');
```

## Features

### AssetLibrary (Core)
- Singleton pattern for centralized asset management
- Catalog registration from URLs or JSON objects
- Pack base URI configuration
- Asset indexing and query API
- Automatic loader creation per pack
- Cache management and statistics

### Resolvers
- **HttpResolver**: Fetch assets via HTTP with retry logic
- **CacheResolver**: Browser Cache Storage wrapper for offline support

### Loaders
- **TextureAssetLoader**: Load PBR texture sets (albedo, normal, ORM)
- **EnvironmentAssetLoader**: Load HDR environments with PMREM generation
- **ModelAssetLoader**: Load GLB models with Draco decompression

### Color Space Management
- Automatic color space configuration
- sRGB for albedo/diffuse textures
- Linear for normal maps and data textures
- OpenGL normal map convention (Y+ up)

## Asset Types

### PBR Texture Set
```json
{
  "id": "pbr/oak-wood",
  "type": "pbr-texture-set",
  "files": {
    "albedo": "textures/oak_wood/albedo.jpg",
    "normal": "textures/oak_wood/normal.png",
    "orm": "textures/oak_wood/orm.png"
  },
  "defaults": {
    "roughness": 0.75,
    "metalness": 0.0,
    "uvScale": [2, 2]
  }
}
```

### Environment
```json
{
  "id": "env/studio-neutral",
  "type": "environment",
  "files": {
    "hdr": "env/studio_neutral_1k.hdr"
  },
  "defaults": {
    "intensity": 1.0,
    "pmrem": true
  }
}
```

### Model
```json
{
  "id": "model/suzanne",
  "type": "model",
  "files": {
    "glb": "models/suzanne.glb"
  },
  "defaults": {
    "scale": 1.0
  }
}
```

## API Reference

### AssetLibrary.getInstance(config)
Get singleton instance with configuration.

### initialize(renderer)
Initialize with WebGPU renderer (required for PMREM).

### registerCatalogFromUrl(url, options)
Register catalog from URL.

### registerCatalog(catalog, options)
Register catalog from JSON object.

### query(filters)
Query assets by type, tags, or text.

### loadPBRTextures(id)
Load PBR texture set (albedo, normal, ORM).

### createPBRMaterial(id, customProps)
Create PBR material from asset (convenience).

### loadEnvironment(id, options)
Load HDR environment map.

### getEnvironment(id, options)
Get environment texture (convenience).

### loadModel(id)
Load 3D model (GLB format).

### getModel(id)
Get model (convenience).

### clearCache()
Clear all caches (HTTP + loader caches).

### getCacheStats()
Get cache statistics for all loaders.

### dispose()
Dispose all resources.

## Examples

See:
- `examples/asset-browser.html` - Interactive asset browser
- `examples/pbr-showcase.html` - PBR materials showcase
- `templates/asset-project.html` - Complete starter template

## Documentation

Full documentation:
- [Asset Library Guide](../docs/asset-library.md) - Complete API reference
- [Asset Packs Guide](../docs/asset-packs.md) - Creating asset packs

## Requirements

- Three.js r171+
- WebGPU-capable browser
- HTTP server for asset hosting (not `file://`)
- Asset packs stored externally and served via HTTP

## Local Development

Start HTTP server:

```bash
# Python
cd ~/.claude/asset-packs
python -m http.server 8787

# Node.js
npm install -g http-server
cd ~/.claude/asset-packs
http-server -p 8787 --cors
```

Then configure pack base:

```javascript
const assets = AssetLibrary.getInstance({
  packs: { core: 'http://localhost:8787/webgpu-threejs-tsl/packs/core/' }
});
```

## Size Budget

- **AssetLibrary.js**: ~8KB
- **Resolvers**: ~5KB
- **Loaders**: ~11KB
- **Catalogs**: ~3KB
- **Total**: ~27KB

Asset packs are external (30-50MB) and loaded on-demand via HTTP.

## License

CC0 (Public Domain) for core library code.
Asset pack licenses vary - see individual catalog metadata.
