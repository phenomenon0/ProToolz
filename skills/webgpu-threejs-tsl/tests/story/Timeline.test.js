/**
 * Timeline Tests
 *
 * Tests for keyframe interpolation with binary search and easing
 */

import { describe, it, expect, beforeEach } from 'vitest';
import Timeline from '../../story/Timeline.js';

describe('Timeline', () => {
  describe('Construction', () => {
    it('should create timeline with keyframes', () => {
      const keyframes = [
        { t: 0, opacity: 0 },
        { t: 1, opacity: 1 }
      ];

      const timeline = new Timeline(keyframes);

      expect(timeline.keyframes).toHaveLength(2);
    });

    it('should auto-prepend t=0 keyframe if missing', () => {
      const keyframes = [
        { t: 0.5, opacity: 0.5 },
        { t: 1, opacity: 1 }
      ];

      const timeline = new Timeline(keyframes);

      expect(timeline.keyframes[0].t).toBe(0);
    });

    it('should not duplicate t=0 if already present', () => {
      const keyframes = [
        { t: 0, opacity: 0 },
        { t: 0.5, opacity: 0.5 },
        { t: 1, opacity: 1 }
      ];

      const timeline = new Timeline(keyframes);

      expect(timeline.keyframes).toHaveLength(3);
      expect(timeline.keyframes.filter(kf => kf.t === 0)).toHaveLength(1);
    });

    it('should sort keyframes by time', () => {
      const keyframes = [
        { t: 1, opacity: 1 },
        { t: 0, opacity: 0 },
        { t: 0.5, opacity: 0.5 }
      ];

      const timeline = new Timeline(keyframes);

      expect(timeline.keyframes[0].t).toBe(0);
      expect(timeline.keyframes[1].t).toBe(0.5);
      expect(timeline.keyframes[2].t).toBe(1);
    });
  });

  describe('Number Interpolation', () => {
    it('should interpolate between two keyframes', () => {
      const timeline = new Timeline([
        { t: 0, opacity: 0 },
        { t: 1, opacity: 1 }
      ]);

      const result = timeline.evaluate(0.5);

      expect(result.opacity).toBe(0.5);
    });

    it('should return first keyframe at t=0', () => {
      const timeline = new Timeline([
        { t: 0, opacity: 0 },
        { t: 1, opacity: 1 }
      ]);

      const result = timeline.evaluate(0);

      expect(result.opacity).toBe(0);
    });

    it('should return last keyframe at t=1', () => {
      const timeline = new Timeline([
        { t: 0, opacity: 0 },
        { t: 1, opacity: 1 }
      ]);

      const result = timeline.evaluate(1);

      expect(result.opacity).toBe(1);
    });

    it('should clamp values below 0', () => {
      const timeline = new Timeline([
        { t: 0, opacity: 0 },
        { t: 1, opacity: 1 }
      ]);

      const result = timeline.evaluate(-0.5);

      expect(result.opacity).toBe(0);
    });

    it('should clamp values above 1', () => {
      const timeline = new Timeline([
        { t: 0, opacity: 0 },
        { t: 1, opacity: 1 }
      ]);

      const result = timeline.evaluate(1.5);

      expect(result.opacity).toBe(1);
    });
  });

  describe('Binary Search', () => {
    it('should efficiently find keyframe pairs', () => {
      // Create timeline with many keyframes
      const keyframes = [];
      for (let i = 0; i <= 100; i++) {
        keyframes.push({ t: i / 100, value: i });
      }

      const timeline = new Timeline(keyframes);

      // Measure search time
      const start = performance.now();
      for (let i = 0; i < 1000; i++) {
        timeline.evaluate(Math.random());
      }
      const end = performance.now();

      // Should complete quickly (< 10ms for 1000 searches)
      expect(end - start).toBeLessThan(10);
    });

    it('should handle edge cases in binary search', () => {
      const timeline = new Timeline([
        { t: 0, value: 0 },
        { t: 0.25, value: 25 },
        { t: 0.5, value: 50 },
        { t: 0.75, value: 75 },
        { t: 1, value: 100 }
      ]);

      // Test exact keyframe times
      expect(timeline.evaluate(0).value).toBe(0);
      expect(timeline.evaluate(0.25).value).toBe(25);
      expect(timeline.evaluate(0.5).value).toBe(50);
      expect(timeline.evaluate(0.75).value).toBe(75);
      expect(timeline.evaluate(1).value).toBe(100);

      // Test interpolation between keyframes
      expect(timeline.evaluate(0.125).value).toBeCloseTo(12.5, 1);
      expect(timeline.evaluate(0.375).value).toBeCloseTo(37.5, 1);
    });
  });

  describe('Easing Functions', () => {
    it('should apply linear easing by default', () => {
      const timeline = new Timeline([
        { t: 0, value: 0 },
        { t: 1, value: 100 }
      ]);

      expect(timeline.evaluate(0.5).value).toBe(50);
    });

    it('should apply easeInQuad', () => {
      const timeline = new Timeline([
        { t: 0, value: 0 },
        { t: 1, value: 100, easing: 'easeInQuad' }
      ]);

      const result = timeline.evaluate(0.5);

      // easeInQuad(0.5) = 0.25, so value should be 25
      expect(result.value).toBeCloseTo(25, 1);
    });

    it('should apply easeOutQuad', () => {
      const timeline = new Timeline([
        { t: 0, value: 0 },
        { t: 1, value: 100, easing: 'easeOutQuad' }
      ]);

      const result = timeline.evaluate(0.5);

      // easeOutQuad(0.5) = 0.75, so value should be 75
      expect(result.value).toBeCloseTo(75, 1);
    });

    it('should apply easeInOutCubic', () => {
      const timeline = new Timeline([
        { t: 0, value: 0 },
        { t: 1, value: 100, easing: 'easeInOutCubic' }
      ]);

      const result = timeline.evaluate(0.5);

      // easeInOutCubic(0.5) = 0.5, so value should be 50
      expect(result.value).toBeCloseTo(50, 1);
    });

    it('should fall back to linear for unknown easing', () => {
      const timeline = new Timeline([
        { t: 0, value: 0 },
        { t: 1, value: 100, easing: 'unknownEasing' }
      ]);

      const result = timeline.evaluate(0.5);

      expect(result.value).toBe(50);
    });
  });

  describe('Vec3 Interpolation', () => {
    it('should interpolate vec3 arrays', () => {
      const timeline = new Timeline([
        { t: 0, position: [0, 0, 0] },
        { t: 1, position: [10, 20, 30] }
      ]);

      const result = timeline.evaluate(0.5);

      expect(result.position).toEqual([5, 10, 15]);
    });

    it('should handle partial vec3 values', () => {
      const timeline = new Timeline([
        { t: 0, position: [0, 0] },
        { t: 1, position: [10, 20, 30] }
      ]);

      const result = timeline.evaluate(0.5);

      expect(result.position[0]).toBe(5);
      expect(result.position[1]).toBe(10);
    });
  });

  describe('Color Interpolation', () => {
    it('should interpolate hex colors', () => {
      const timeline = new Timeline([
        { t: 0, color: '#000000' },
        { t: 1, color: '#ffffff' }
      ]);

      const result = timeline.evaluate(0.5);

      // Should interpolate to middle gray
      expect(result.color).toMatch(/^#[0-9a-f]{6}$/i);
    });

    it('should handle rgb() colors', () => {
      const timeline = new Timeline([
        { t: 0, color: 'rgb(0, 0, 0)' },
        { t: 1, color: 'rgb(255, 255, 255)' }
      ]);

      const result = timeline.evaluate(0.5);

      expect(result.color).toBeDefined();
    });
  });

  describe('Quaternion Interpolation', () => {
    it('should slerp quaternions', () => {
      const timeline = new Timeline([
        { t: 0, rotation: { x: 0, y: 0, z: 0, w: 1 } },
        { t: 1, rotation: { x: 0, y: 1, z: 0, w: 0 } }
      ]);

      const result = timeline.evaluate(0.5);

      expect(result.rotation).toBeDefined();
      expect(result.rotation).toHaveProperty('x');
      expect(result.rotation).toHaveProperty('y');
      expect(result.rotation).toHaveProperty('z');
      expect(result.rotation).toHaveProperty('w');
    });
  });

  describe('Multiple Properties', () => {
    it('should interpolate multiple properties simultaneously', () => {
      const timeline = new Timeline([
        {
          t: 0,
          opacity: 0,
          position: [0, 0, 0],
          scale: 1,
          color: '#000000'
        },
        {
          t: 1,
          opacity: 1,
          position: [10, 20, 30],
          scale: 2,
          color: '#ffffff'
        }
      ]);

      const result = timeline.evaluate(0.5);

      expect(result.opacity).toBe(0.5);
      expect(result.position).toEqual([5, 10, 15]);
      expect(result.scale).toBe(1.5);
      expect(result.color).toBeDefined();
    });

    it('should preserve properties not in current segment', () => {
      const timeline = new Timeline([
        { t: 0, opacity: 0, scale: 1 },
        { t: 0.5, opacity: 0.5 },
        { t: 1, opacity: 1, scale: 2 }
      ]);

      const result = timeline.evaluate(0.25);

      expect(result.opacity).toBe(0.25);
      expect(result.scale).toBe(1); // Should preserve from t=0
    });
  });

  describe('Complex Scenarios', () => {
    it('should handle many keyframes efficiently', () => {
      const keyframes = [];
      for (let i = 0; i <= 50; i++) {
        keyframes.push({
          t: i / 50,
          value: i * 2,
          easing: i % 2 === 0 ? 'easeInQuad' : 'easeOutQuad'
        });
      }

      const timeline = new Timeline(keyframes);

      // Should evaluate quickly
      const start = performance.now();
      for (let i = 0; i < 100; i++) {
        timeline.evaluate(i / 100);
      }
      const end = performance.now();

      expect(end - start).toBeLessThan(10);
    });

    it('should handle mixed property types', () => {
      const timeline = new Timeline([
        {
          t: 0,
          opacity: 0,
          position: [0, 0, 0],
          color: '#ff0000',
          rotation: { x: 0, y: 0, z: 0, w: 1 },
          scale: [1, 1, 1]
        },
        {
          t: 1,
          opacity: 1,
          position: [10, 10, 10],
          color: '#00ff00',
          rotation: { x: 0, y: 1, z: 0, w: 0 },
          scale: [2, 2, 2],
          easing: 'easeInOutCubic'
        }
      ]);

      const result = timeline.evaluate(0.5);

      expect(result.opacity).toBeDefined();
      expect(result.position).toBeDefined();
      expect(result.color).toBeDefined();
      expect(result.rotation).toBeDefined();
      expect(result.scale).toBeDefined();
    });
  });
});
