#!/usr/bin/env python3
"""
Batch rename models with reasonable defaults
Quick solution for organizing models
"""

import json
import os

catalog_path = os.path.expanduser("~/.claude/asset-packs/webgpu-threejs-tsl/packs/downloads-pack/downloads.catalog.json")

# Load current catalog
with open(catalog_path, 'r') as f:
    catalog = json.load(f)

# Rename mappings based on visual inspection and file characteristics
renames = {
    "standard-model-1": {
        "name": "decorative-object-1",
        "label": "Decorative Object 1",
        "description": "3D decorative object for scenes (7.6M, medium-poly)",
        "tags": ["decorative", "prop", "medium-poly", "indoor"]
    },
    "detailed-model-2": {
        "name": "detailed-prop-1",
        "label": "Detailed Prop 1",
        "description": "High-detail prop model (9.7M, high-poly)",
        "tags": ["prop", "detailed", "high-poly", "decorative"]
    },
    "simple-model-3": {
        "name": "simple-prop-1",
        "label": "Simple Prop 1",
        "description": "Simple prop for background (4.7M, low-poly)",
        "tags": ["prop", "simple", "low-poly", "background"]
    },
    "detailed-model-4": {
        "name": "detailed-prop-2",
        "label": "Detailed Prop 2",
        "description": "High-detail prop model (13M, high-poly)",
        "tags": ["prop", "detailed", "high-poly", "decorative"]
    },
    "standard-model-5": {
        "name": "standard-prop-1",
        "label": "Standard Prop 1",
        "description": "Standard prop model (5.2M, medium-poly)",
        "tags": ["prop", "standard", "medium-poly"]
    },
    "standard-model-6": {
        "name": "standard-prop-2",
        "label": "Standard Prop 2",
        "description": "Standard prop model (5.5M, medium-poly)",
        "tags": ["prop", "standard", "medium-poly"]
    },
    "detailed-model-7": {
        "name": "detailed-prop-3",
        "label": "Detailed Prop 3",
        "description": "High-detail prop model (11M, high-poly)",
        "tags": ["prop", "detailed", "high-poly"]
    },
    "standard-model-8": {
        "name": "standard-prop-3",
        "label": "Standard Prop 3",
        "description": "Standard prop model (6.8M, medium-poly)",
        "tags": ["prop", "standard", "medium-poly"]
    },
    "standard-model-9": {
        "name": "standard-prop-4",
        "label": "Standard Prop 4",
        "description": "Standard prop model (9.0M, medium-poly)",
        "tags": ["prop", "standard", "medium-poly"]
    },
    "detailed-model-11": {
        "name": "detailed-prop-4",
        "label": "Detailed Prop 4",
        "description": "High-detail prop model (9.7M, high-poly)",
        "tags": ["prop", "detailed", "high-poly"]
    },
    "standard-model-12": {
        "name": "standard-prop-5",
        "label": "Standard Prop 5",
        "description": "Standard prop model (7.3M, medium-poly)",
        "tags": ["prop", "standard", "medium-poly"]
    },
    "detailed-model-13": {
        "name": "chinese-dragon",
        "label": "Chinese Dragon",
        "description": "Oriental dragon with detailed scales and traditional design (12M, high-poly)",
        "tags": ["dragon", "fantasy", "creature", "high-poly", "hero-asset", "oriental"]
    },
    "detailed-model-14": {
        "name": "detailed-prop-5",
        "label": "Detailed Prop 5",
        "description": "High-detail prop model (10M, high-poly)",
        "tags": ["prop", "detailed", "high-poly"]
    }
}

# Update catalog
for asset in catalog['assets']:
    if asset['type'] == 'model':
        old_id = asset['id'].split('/')[-1]
        if old_id in renames:
            rename_data = renames[old_id]
            new_id = f"downloads-pack/{rename_data['name']}"

            asset['id'] = new_id
            asset['label'] = rename_data['label']
            asset['description'] = rename_data['description']
            asset['tags'] = rename_data['tags']

            print(f"✓ {old_id} → {rename_data['name']}")

# Save updated catalog
output_path = os.path.expanduser("~/Downloads/downloads-renamed.catalog.json")
with open(output_path, 'w') as f:
    json.dump(catalog, f, indent=2)

print(f"\n✓ Updated catalog saved to: {output_path}")
print("\nTo apply:")
print(f"  cp {catalog_path} {catalog_path}.backup")
print(f"  cp {output_path} {catalog_path}")
