/**
 * StoryDebugger.js - Real-time debug overlay for story system
 *
 * Features:
 * - Active section ID and progress
 * - Memory usage percentage
 * - Prefetch queue size
 * - FPS counter
 * - Enable/disable on demand
 */

export class StoryDebugger {
  constructor(options = {}) {
    this.enabled = options.enabled !== false;
    this.position = options.position || 'top-right'; // top-left, top-right, bottom-left, bottom-right

    this.overlay = null;
    this.stats = {
      fps: 0,
      sectionId: null,
      progress: 0,
      memoryPercent: 0,
      queueSize: 0,
      activeLoads: 0
    };

    // FPS tracking
    this.frameCount = 0;
    this.lastFpsUpdate = performance.now();

    if (this.enabled) {
      this._createOverlay();
    }
  }

  /**
   * Enable debugger
   */
  enable() {
    if (!this.enabled) {
      this.enabled = true;
      this._createOverlay();
    }
  }

  /**
   * Disable debugger
   */
  disable() {
    if (this.enabled) {
      this.enabled = false;
      this._removeOverlay();
    }
  }

  /**
   * Toggle debugger
   */
  toggle() {
    if (this.enabled) {
      this.disable();
    } else {
      this.enable();
    }
  }

  /**
   * Update debugger stats
   * @param {Object} stats - Stats to display
   */
  update(stats = {}) {
    Object.assign(this.stats, stats);

    // Update FPS
    this.frameCount++;
    const now = performance.now();
    if (now - this.lastFpsUpdate >= 1000) {
      this.stats.fps = this.frameCount;
      this.frameCount = 0;
      this.lastFpsUpdate = now;
    }

    if (this.enabled && this.overlay) {
      this._updateOverlay();
    }
  }

  /**
   * Clean up
   */
  destroy() {
    this._removeOverlay();
  }

  // Private methods

  _createOverlay() {
    if (this.overlay) return;

    this.overlay = document.createElement('div');
    this.overlay.id = 'story-debugger';
    this.overlay.style.cssText = this._getOverlayStyles();

    document.body.appendChild(this.overlay);
    this._updateOverlay();
  }

  _removeOverlay() {
    if (this.overlay && this.overlay.parentNode) {
      this.overlay.parentNode.removeChild(this.overlay);
      this.overlay = null;
    }
  }

  _getOverlayStyles() {
    const positions = {
      'top-left': 'top: 10px; left: 10px;',
      'top-right': 'top: 10px; right: 10px;',
      'bottom-left': 'bottom: 10px; left: 10px;',
      'bottom-right': 'bottom: 10px; right: 10px;'
    };

    return `
      position: fixed;
      ${positions[this.position] || positions['top-right']}
      background: rgba(0, 0, 0, 0.8);
      color: #0f0;
      font-family: 'Courier New', monospace;
      font-size: 12px;
      padding: 10px;
      border-radius: 4px;
      z-index: 999999;
      pointer-events: none;
      user-select: none;
      min-width: 200px;
      box-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
    `;
  }

  _updateOverlay() {
    if (!this.overlay) return;

    const { fps, sectionId, progress, memoryPercent, queueSize, activeLoads } = this.stats;

    // Color code memory usage
    let memoryColor = '#0f0';
    if (memoryPercent > 80) memoryColor = '#f00';
    else if (memoryPercent > 60) memoryColor = '#ff0';

    // Color code FPS
    let fpsColor = '#0f0';
    if (fps < 30) fpsColor = '#f00';
    else if (fps < 50) fpsColor = '#ff0';

    this.overlay.innerHTML = `
      <div style="margin-bottom: 5px; font-weight: bold; color: #0ff;">
        STORY DEBUGGER
      </div>
      <div style="color: ${fpsColor};">
        FPS: ${fps}
      </div>
      <div>
        Section: ${sectionId || 'none'}
      </div>
      <div>
        Progress: ${(progress * 100).toFixed(1)}%
      </div>
      <div style="color: ${memoryColor};">
        Memory: ${memoryPercent.toFixed(1)}%
      </div>
      <div>
        Queue: ${queueSize} (${activeLoads} active)
      </div>
      <div style="margin-top: 5px; color: #888; font-size: 10px;">
        Press 'D' to toggle
      </div>
    `;
  }

  /**
   * Setup keyboard shortcut
   */
  static setupKeyboardShortcut(instance) {
    document.addEventListener('keydown', (e) => {
      if (e.key === 'd' || e.key === 'D') {
        instance.toggle();
      }
    });
  }
}

export default StoryDebugger;
