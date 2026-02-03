/**
 * MemoryBudget.js - Track GPU memory usage and enforce budgets
 *
 * Features:
 * - Section-based allocation tracking
 * - Size estimation (textures, models)
 * - Budget enforcement (default: 512MB)
 * - Usage percentage reporting
 */

import * as THREE from 'three';

export class MemoryBudget {
  constructor(maxBudgetMB = 512) {
    this.maxBudgetBytes = maxBudgetMB * 1024 * 1024;
    this.allocations = new Map(); // sectionId -> bytes
    this.totalAllocated = 0;
  }

  /**
   * Allocate memory for a section
   * @param {string} sectionId - Section identifier
   * @param {number} bytes - Bytes to allocate
   * @returns {boolean} True if allocation succeeded
   */
  allocate(sectionId, bytes) {
    const newTotal = this.totalAllocated + bytes;

    if (newTotal > this.maxBudgetBytes) {
      console.warn(
        `MemoryBudget: Allocation would exceed budget (${this._formatBytes(newTotal)} > ${this._formatBytes(this.maxBudgetBytes)})`
      );
      return false;
    }

    const existing = this.allocations.get(sectionId) || 0;
    this.allocations.set(sectionId, existing + bytes);
    this.totalAllocated += bytes;

    return true;
  }

  /**
   * Free all memory for a section
   * @param {string} sectionId - Section identifier
   */
  free(sectionId) {
    const bytes = this.allocations.get(sectionId);
    if (bytes) {
      this.totalAllocated -= bytes;
      this.allocations.delete(sectionId);
    }
  }

  /**
   * Get usage percentage
   * @returns {number} Percentage (0-100)
   */
  getUsagePercent() {
    return (this.totalAllocated / this.maxBudgetBytes) * 100;
  }

  /**
   * Get allocated bytes for a section
   * @param {string} sectionId - Section identifier
   * @returns {number}
   */
  getSectionAllocation(sectionId) {
    return this.allocations.get(sectionId) || 0;
  }

  /**
   * Get total allocated bytes
   * @returns {number}
   */
  getTotalAllocated() {
    return this.totalAllocated;
  }

  /**
   * Get available bytes
   * @returns {number}
   */
  getAvailable() {
    return Math.max(0, this.maxBudgetBytes - this.totalAllocated);
  }

  /**
   * Check if allocation would fit in budget
   * @param {number} bytes - Bytes to check
   * @returns {boolean}
   */
  canAllocate(bytes) {
    return this.totalAllocated + bytes <= this.maxBudgetBytes;
  }

  /**
   * Estimate texture size
   * @param {number} width - Texture width
   * @param {number} height - Texture height
   * @param {number} format - Three.js format constant
   * @returns {number} Estimated bytes
   */
  estimateTextureSize(width, height, format = THREE.RGBAFormat) {
    let bytesPerPixel = 4; // RGBA

    switch (format) {
      case THREE.RedFormat:
      case THREE.AlphaFormat:
        bytesPerPixel = 1;
        break;
      case THREE.RGFormat:
        bytesPerPixel = 2;
        break;
      case THREE.RGBAFormat:
      default:
        bytesPerPixel = 4;
        break;
    }

    // Include mipmaps (adds ~33%)
    const baseSize = width * height * bytesPerPixel;
    return Math.floor(baseSize * 1.33);
  }

  /**
   * Estimate model size
   * @param {THREE.BufferGeometry} geometry - Geometry to estimate
   * @returns {number} Estimated bytes
   */
  estimateModelSize(geometry) {
    let bytes = 0;

    // Position attribute (vec3 = 12 bytes per vertex)
    if (geometry.attributes.position) {
      bytes += geometry.attributes.position.count * 12;
    }

    // Normal attribute (vec3 = 12 bytes per vertex)
    if (geometry.attributes.normal) {
      bytes += geometry.attributes.normal.count * 12;
    }

    // UV attribute (vec2 = 8 bytes per vertex)
    if (geometry.attributes.uv) {
      bytes += geometry.attributes.uv.count * 8;
    }

    // Index buffer (uint16 or uint32)
    if (geometry.index) {
      const bytesPerIndex = geometry.index.array.BYTES_PER_ELEMENT;
      bytes += geometry.index.count * bytesPerIndex;
    }

    return bytes;
  }

  /**
   * Estimate asset size from loaded asset
   * @param {*} asset - Loaded asset (texture, model, etc.)
   * @returns {number} Estimated bytes
   */
  estimateAssetSize(asset) {
    if (asset instanceof THREE.Texture) {
      const img = asset.image;
      if (img && img.width && img.height) {
        return this.estimateTextureSize(img.width, img.height, asset.format);
      }
    }

    if (asset instanceof THREE.Group || asset instanceof THREE.Mesh) {
      let bytes = 0;
      asset.traverse((node) => {
        if (node.geometry) {
          bytes += this.estimateModelSize(node.geometry);
        }
        if (node.material) {
          // Estimate material textures
          const material = node.material;
          ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap', 'emissiveMap'].forEach(prop => {
            if (material[prop] instanceof THREE.Texture) {
              const tex = material[prop];
              if (tex.image && tex.image.width) {
                bytes += this.estimateTextureSize(tex.image.width, tex.image.height, tex.format);
              }
            }
          });
        }
      });
      return bytes;
    }

    // Unknown asset type, assume 1MB
    return 1024 * 1024;
  }

  /**
   * Format bytes as human-readable string
   * @param {number} bytes
   * @returns {string}
   */
  _formatBytes(bytes) {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  }

  /**
   * Get memory report
   * @returns {Object}
   */
  getReport() {
    return {
      budgetMB: this.maxBudgetBytes / (1024 * 1024),
      allocatedMB: this.totalAllocated / (1024 * 1024),
      availableMB: this.getAvailable() / (1024 * 1024),
      usagePercent: this.getUsagePercent(),
      sections: Object.fromEntries(
        Array.from(this.allocations.entries()).map(([id, bytes]) => [
          id,
          this._formatBytes(bytes)
        ])
      )
    };
  }
}

export default MemoryBudget;
