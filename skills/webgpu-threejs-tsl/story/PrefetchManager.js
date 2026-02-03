/**
 * PrefetchManager.js - Manage asset loading queue with concurrency control
 *
 * Features:
 * - Max concurrent loads (default: 3)
 * - Priority-based queue (closer sections = higher priority)
 * - Deduplication (same asset requested multiple times)
 * - Loaded section tracking
 */

export class PrefetchManager {
  constructor(assetLibrary, options = {}) {
    this.assetLibrary = assetLibrary;

    // Options
    this.maxConcurrentLoads = options.maxConcurrentLoads || 3;

    // State
    this.queue = []; // { sectionId, assetIds, priority }
    this.activeLoads = new Set(); // Currently loading asset IDs
    this.loadedAssets = new Set(); // Successfully loaded asset IDs
    this.loadedSections = new Set(); // Sections with all assets loaded
    this.loading = false;
  }

  /**
   * Enqueue assets for a section
   * @param {string} sectionId - Section identifier
   * @param {string[]} assetIds - Asset IDs to load
   * @param {number} priority - Priority (higher = more urgent)
   */
  enqueue(sectionId, assetIds, priority = 0) {
    if (this.loadedSections.has(sectionId)) {
      return; // Already loaded
    }

    // Filter out already loaded/loading assets
    const pendingAssets = assetIds.filter(id =>
      !this.loadedAssets.has(id) && !this.activeLoads.has(id)
    );

    if (pendingAssets.length === 0) {
      this.loadedSections.add(sectionId);
      return;
    }

    // Check if section already in queue
    const existing = this.queue.find(item => item.sectionId === sectionId);
    if (existing) {
      // Update priority and merge asset IDs
      existing.priority = Math.max(existing.priority, priority);
      existing.assetIds = [
        ...new Set([...existing.assetIds, ...pendingAssets])
      ];
    } else {
      // Add new queue item
      this.queue.push({
        sectionId,
        assetIds: pendingAssets,
        priority
      });
    }

    // Sort queue by priority (descending)
    this.queue.sort((a, b) => b.priority - a.priority);

    // Start processing
    this._processQueue();
  }

  /**
   * Clear all pending loads for a section
   * @param {string} sectionId - Section identifier
   */
  clear(sectionId) {
    this.queue = this.queue.filter(item => item.sectionId !== sectionId);
    this.loadedSections.delete(sectionId);
  }

  /**
   * Clear entire queue
   */
  clearAll() {
    this.queue = [];
    // Note: Don't clear activeLoads - let them finish
  }

  /**
   * Check if a section is fully loaded
   * @param {string} sectionId - Section identifier
   * @returns {boolean}
   */
  isLoaded(sectionId) {
    return this.loadedSections.has(sectionId);
  }

  /**
   * Get current queue size
   * @returns {number}
   */
  getQueueSize() {
    return this.queue.reduce((sum, item) => sum + item.assetIds.length, 0);
  }

  /**
   * Get number of active loads
   * @returns {number}
   */
  getActiveCount() {
    return this.activeLoads.size;
  }

  // Private methods

  async _processQueue() {
    if (this.loading) return;
    this.loading = true;

    while (this.queue.length > 0 && this.activeLoads.size < this.maxConcurrentLoads) {
      const item = this.queue[0];

      // Find next asset to load
      const assetId = item.assetIds.find(id =>
        !this.activeLoads.has(id) && !this.loadedAssets.has(id)
      );

      if (!assetId) {
        // All assets for this section are loaded or loading
        const allLoaded = item.assetIds.every(id => this.loadedAssets.has(id));
        if (allLoaded) {
          this.loadedSections.add(item.sectionId);
        }
        this.queue.shift();
        continue;
      }

      // Start loading
      this.activeLoads.add(assetId);
      this._loadAsset(assetId, item.sectionId);

      // Remove from item's asset list
      item.assetIds = item.assetIds.filter(id => id !== assetId);

      if (item.assetIds.length === 0) {
        this.queue.shift();
      }
    }

    this.loading = false;
  }

  async _loadAsset(assetId, sectionId) {
    try {
      await this.assetLibrary.loadAsset(assetId);
      this.loadedAssets.add(assetId);
    } catch (error) {
      console.error(`PrefetchManager: Failed to load asset "${assetId}" for section "${sectionId}":`, error);
    } finally {
      this.activeLoads.delete(assetId);
      // Continue processing queue
      this._processQueue();
    }
  }
}

export default PrefetchManager;
