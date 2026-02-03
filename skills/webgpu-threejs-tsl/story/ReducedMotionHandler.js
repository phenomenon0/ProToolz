/**
 * ReducedMotionHandler.js - Detect and handle prefers-reduced-motion
 *
 * Features:
 * - Media query detection
 * - Timeline snapping (no interpolation)
 * - Change listeners
 */

export class ReducedMotionHandler {
  constructor() {
    this.mediaQuery = matchMedia('(prefers-reduced-motion: reduce)');
    this.enabled = this.mediaQuery.matches;
    this.listeners = [];

    // Listen for changes
    this.mediaQuery.addEventListener('change', (e) => {
      this.enabled = e.matches;
      this._notifyListeners();
    });
  }

  /**
   * Check if reduced motion is enabled
   * @returns {boolean}
   */
  isEnabled() {
    return this.enabled;
  }

  /**
   * Register a change listener
   * @param {Function} callback - Called when reduced motion preference changes
   */
  onChange(callback) {
    if (typeof callback === 'function') {
      this.listeners.push(callback);
    }
  }

  /**
   * Remove a change listener
   * @param {Function} callback
   */
  offChange(callback) {
    const index = this.listeners.indexOf(callback);
    if (index !== -1) {
      this.listeners.splice(index, 1);
    }
  }

  /**
   * Apply reduced motion handling to a timeline
   * Returns a wrapper that snaps to keyframes instead of interpolating
   * @param {Timeline} timeline - Timeline to wrap
   * @returns {Object} Wrapped timeline with conditional snapping
   */
  applyToTimeline(timeline) {
    const self = this;

    return {
      evaluate(progress) {
        if (self.enabled) {
          // Snap to nearest keyframe
          const snappedProgress = self._snapToKeyframe(timeline, progress);
          return timeline.evaluate(snappedProgress);
        }
        // Normal interpolation
        return timeline.evaluate(progress);
      },

      getDuration() {
        return timeline.getDuration();
      },

      getProperties() {
        return timeline.getProperties();
      }
    };
  }

  /**
   * Snap progress value to nearest keyframe
   * @param {Timeline} timeline
   * @param {number} progress
   * @returns {number} Snapped progress
   */
  _snapToKeyframe(timeline, progress) {
    const keyframes = timeline.keyframes;

    // Find nearest keyframe
    let nearest = keyframes[0];
    let minDistance = Math.abs(progress - nearest.t);

    for (let i = 1; i < keyframes.length; i++) {
      const kf = keyframes[i];
      const distance = Math.abs(progress - kf.t);
      if (distance < minDistance) {
        minDistance = distance;
        nearest = kf;
      }
    }

    return nearest.t;
  }

  /**
   * Get animation duration multiplier for reduced motion
   * Reduced motion animations should be faster/instant
   * @returns {number} Multiplier (0 = instant, 1 = normal)
   */
  getDurationMultiplier() {
    return this.enabled ? 0 : 1;
  }

  /**
   * Should animation be disabled entirely?
   * @returns {boolean}
   */
  shouldDisableAnimation() {
    return this.enabled;
  }

  /**
   * Clean up
   */
  destroy() {
    this.listeners = [];
  }

  // Private methods

  _notifyListeners() {
    this.listeners.forEach(callback => {
      try {
        callback(this.enabled);
      } catch (error) {
        console.error('ReducedMotionHandler: Error in listener:', error);
      }
    });
  }
}

export default ReducedMotionHandler;
