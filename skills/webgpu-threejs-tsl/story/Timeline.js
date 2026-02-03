/**
 * Timeline.js - Interpolate keyframe values with easing support
 *
 * Supports:
 * - Value types: number, vec3, color, quaternion
 * - Easing functions from Easing.js
 * - Looping timelines
 * - Sparse keyframes (binary search for large arrays)
 */

import { Easing } from './Easing.js';
import * as THREE from 'three';

export class Timeline {
  constructor(keyframes, options = {}) {
    if (!Array.isArray(keyframes) || keyframes.length === 0) {
      throw new Error('Timeline: keyframes must be a non-empty array');
    }

    // Sort keyframes by time
    this.keyframes = keyframes.sort((a, b) => a.t - b.t);

    // Options
    this.loop = options.loop || false;
    this.defaultEasing = options.defaultEasing || 'linear';

    // Validate keyframes
    this._validate();

    // Cache for property types
    this._propertyTypes = new Map();
    this._analyzePropertyTypes();
  }

  /**
   * Evaluate timeline at given progress
   * @param {number} progress - Progress value (0..1)
   * @returns {Object} Interpolated state object
   */
  evaluate(progress) {
    // Handle looping
    if (this.loop) {
      progress = progress % 1;
    } else {
      progress = Math.max(0, Math.min(1, progress));
    }

    // Find surrounding keyframes
    const { prev, next, t } = this._findKeyframes(progress);

    if (!next) {
      // Past end, return last keyframe
      return { ...prev };
    }

    if (!prev || t <= 0) {
      // Before start, return first keyframe
      return { ...next };
    }

    if (t >= 1) {
      // At end, return last keyframe
      return { ...next };
    }

    // Get easing function
    const easingName = next.easing || this.defaultEasing;
    const easingFn = typeof Easing[easingName] === 'function'
      ? Easing[easingName]
      : Easing.linear;

    const easedT = easingFn(t);

    // Interpolate all properties
    const result = {};
    const allProps = new Set([
      ...Object.keys(prev).filter(k => k !== 't' && k !== 'easing'),
      ...Object.keys(next).filter(k => k !== 't' && k !== 'easing')
    ]);

    allProps.forEach(prop => {
      const prevValue = prev[prop];
      const nextValue = next[prop];

      if (prevValue === undefined) {
        result[prop] = nextValue;
      } else if (nextValue === undefined) {
        result[prop] = prevValue;
      } else {
        result[prop] = this._interpolate(prop, prevValue, nextValue, easedT);
      }
    });

    return result;
  }

  /**
   * Get timeline duration (max t value)
   * @returns {number}
   */
  getDuration() {
    return this.keyframes[this.keyframes.length - 1].t;
  }

  /**
   * Get all property names in timeline
   * @returns {string[]}
   */
  getProperties() {
    const props = new Set();
    this.keyframes.forEach(kf => {
      Object.keys(kf).forEach(key => {
        if (key !== 't' && key !== 'easing') {
          props.add(key);
        }
      });
    });
    return Array.from(props);
  }

  // Private methods

  _validate() {
    // Check t values are in [0, 1]
    this.keyframes.forEach((kf, i) => {
      if (typeof kf.t !== 'number' || kf.t < 0 || kf.t > 1) {
        throw new Error(`Timeline: Invalid t value at keyframe ${i}: ${kf.t}`);
      }
    });

    // Check first keyframe starts at 0
    if (this.keyframes[0].t !== 0) {
      console.warn('Timeline: First keyframe does not start at t=0, prepending start frame');
      this.keyframes.unshift({ t: 0, ...this.keyframes[0] });
    }
  }

  _analyzePropertyTypes() {
    // Detect property types from first occurrence
    this.keyframes.forEach(kf => {
      Object.keys(kf).forEach(prop => {
        if (prop === 't' || prop === 'easing') return;
        if (this._propertyTypes.has(prop)) return;

        const value = kf[prop];
        this._propertyTypes.set(prop, this._detectType(value));
      });
    });
  }

  _detectType(value) {
    if (typeof value === 'number') return 'number';
    if (Array.isArray(value)) {
      if (value.length === 3) return 'vec3';
      if (value.length === 4) return 'vec4';
      return 'array';
    }
    if (typeof value === 'string') {
      // Check if color string
      if (value.startsWith('#') || value.startsWith('rgb')) {
        return 'color';
      }
    }
    if (typeof value === 'object' && value !== null) {
      if ('x' in value && 'y' in value && 'z' in value) return 'vec3';
      if ('r' in value && 'g' in value && 'b' in value) return 'color';
      if ('w' in value && 'x' in value && 'y' in value && 'z' in value) return 'quaternion';
    }
    return 'unknown';
  }

  _findKeyframes(progress) {
    const len = this.keyframes.length;

    // Binary search for efficiency with large keyframe arrays
    let left = 0;
    let right = len - 1;

    while (left < right) {
      const mid = Math.floor((left + right) / 2);
      if (this.keyframes[mid].t < progress) {
        left = mid + 1;
      } else {
        right = mid;
      }
    }

    const nextIndex = left;
    const prevIndex = Math.max(0, nextIndex - 1);

    const prev = this.keyframes[prevIndex];
    const next = nextIndex < len ? this.keyframes[nextIndex] : null;

    let t = 0;
    if (prev && next && next.t > prev.t) {
      t = (progress - prev.t) / (next.t - prev.t);
    }

    return { prev, next, t };
  }

  _interpolate(prop, a, b, t) {
    const type = this._propertyTypes.get(prop) || this._detectType(a);

    switch (type) {
      case 'number':
        return this._lerpNumber(a, b, t);

      case 'vec3':
        return this._lerpVec3(a, b, t);

      case 'vec4':
        return this._lerpVec4(a, b, t);

      case 'color':
        return this._lerpColor(a, b, t);

      case 'quaternion':
        return this._slerpQuaternion(a, b, t);

      case 'array':
        return this._lerpArray(a, b, t);

      default:
        // Unknown type, return next value
        console.warn(`Timeline: Unknown interpolation type for property "${prop}"`);
        return t < 0.5 ? a : b;
    }
  }

  _lerpNumber(a, b, t) {
    return a + (b - a) * t;
  }

  _lerpVec3(a, b, t) {
    if (Array.isArray(a) && Array.isArray(b)) {
      return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t
      ];
    }
    // Object format { x, y, z }
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: a.z + (b.z - a.z) * t
    };
  }

  _lerpVec4(a, b, t) {
    if (Array.isArray(a) && Array.isArray(b)) {
      return [
        a[0] + (b[0] - a[0]) * t,
        a[1] + (b[1] - a[1]) * t,
        a[2] + (b[2] - a[2]) * t,
        a[3] + (b[3] - a[3]) * t
      ];
    }
    return {
      x: a.x + (b.x - a.x) * t,
      y: a.y + (b.y - a.y) * t,
      z: a.z + (b.z - a.z) * t,
      w: a.w + (b.w - a.w) * t
    };
  }

  _lerpColor(a, b, t) {
    // Use Three.js color for proper interpolation
    const colorA = new THREE.Color(a);
    const colorB = new THREE.Color(b);
    const result = colorA.clone().lerp(colorB, t);

    // Return as hex string
    return '#' + result.getHexString();
  }

  _slerpQuaternion(a, b, t) {
    // Spherical linear interpolation for quaternions
    const quatA = new THREE.Quaternion(a.x, a.y, a.z, a.w);
    const quatB = new THREE.Quaternion(b.x, b.y, b.z, b.w);
    const result = quatA.clone().slerp(quatB, t);

    return {
      x: result.x,
      y: result.y,
      z: result.z,
      w: result.w
    };
  }

  _lerpArray(a, b, t) {
    const len = Math.min(a.length, b.length);
    const result = [];
    for (let i = 0; i < len; i++) {
      result[i] = this._lerpNumber(a[i], b[i], t);
    }
    return result;
  }
}

export default Timeline;
