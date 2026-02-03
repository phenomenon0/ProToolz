/**
 * Visual Regression Tests - Procedural Gallery
 *
 * Tests procedural geometry generation and material switching
 */

import { test, expect } from '@playwright/test';

const DEMO_URL = '/examples/procedural-gallery-enhanced.html';

test.describe('Procedural Gallery Enhanced', () => {
  test.describe('Initial State', () => {
    test('should load with default shape', async ({ page }) => {
      await page.goto(DEMO_URL);
      await page.waitForTimeout(2000);

      // Check default shape is torus-knot
      const currentShape = await page.locator('#current-shape');
      await expect(currentShape).toContainText('Torus Knot');

      // Check active button
      const activeButton = await page.locator('[data-shape="torus-knot"].active');
      await expect(activeButton).toBeVisible();
    });

    test('should display controls panel', async ({ page }) => {
      await page.goto(DEMO_URL);

      const controls = await page.locator('#controls');
      await expect(controls).toBeVisible();

      // Check for all control groups
      await expect(controls).toContainText('Geometric Shape');
      await expect(controls).toContainText('Color Scheme');
      await expect(controls).toContainText('Material Type');
    });

    test('should show renderer badge', async ({ page }) => {
      await page.goto(DEMO_URL);
      await page.waitForTimeout(2000);

      const badge = await page.locator('#renderer-badge');
      await expect(badge).toBeVisible();

      const text = await badge.textContent();
      expect(text).toMatch(/(WEBGPU|WEBGL)/);
    });
  });

  test.describe('Shape Switching', () => {
    const shapes = [
      'torus-knot',
      'sphere',
      'cylinder',
      'cone',
      'cube',
      'torus'
    ];

    for (const shape of shapes) {
      test(`should switch to ${shape}`, async ({ page }) => {
        await page.goto(DEMO_URL);
        await page.waitForTimeout(2000);

        // Click shape button
        await page.click(`[data-shape="${shape}"]`);
        await page.waitForTimeout(500);

        // Check current shape updated
        const currentShape = await page.locator('#current-shape');
        const shapeName = shape.split('-').map(w =>
          w.charAt(0).toUpperCase() + w.slice(1)
        ).join(' ');

        await expect(currentShape).toContainText(shapeName);

        // Check button is active
        const button = await page.locator(`[data-shape="${shape}"]`);
        await expect(button).toHaveClass(/active/);
      });
    }

    test('should update triangle count on shape change', async ({ page }) => {
      await page.goto(DEMO_URL);
      await page.waitForTimeout(2000);

      // Get initial triangle count
      const initialCount = await page.locator('#triangles').textContent();

      // Switch shape
      await page.click('[data-shape="sphere"]');
      await page.waitForTimeout(500);

      // Get new triangle count
      const newCount = await page.locator('#triangles').textContent();

      // Counts should be different
      expect(newCount).not.toBe(initialCount);
    });
  });

  test.describe('Color Scheme Switching', () => {
    const schemes = ['gradient', 'neon', 'pastel'];

    for (const scheme of schemes) {
      test(`should switch to ${scheme} color scheme`, async ({ page }) => {
        await page.goto(DEMO_URL);
        await page.waitForTimeout(2000);

        // Click color button
        await page.click(`[data-color="${scheme}"]`);
        await page.waitForTimeout(500);

        // Check button is active
        const button = await page.locator(`[data-color="${scheme}"]`);
        await expect(button).toHaveClass(/active/);

        // Take screenshot to verify visual change
        const screenshot = await page.screenshot();
        expect(screenshot).toMatchSnapshot(`procedural-${scheme}.png`, {
          maxDiffPixels: 500,
          threshold: 0.3
        });
      });
    }
  });

  test.describe('Material Type Switching', () => {
    const materials = ['standard', 'metallic', 'glass'];

    for (const material of materials) {
      test(`should switch to ${material} material`, async ({ page }) => {
        await page.goto(DEMO_URL);
        await page.waitForTimeout(2000);

        // Click material button
        await page.click(`[data-material="${material}"]`);
        await page.waitForTimeout(500);

        // Check button is active
        const button = await page.locator(`[data-material="${material}"]`);
        await expect(button).toHaveClass(/active/);

        // Visual verification
        const screenshot = await page.screenshot();
        expect(screenshot).toMatchSnapshot(`procedural-${material}.png`, {
          maxDiffPixels: 500,
          threshold: 0.3
        });
      });
    }
  });

  test.describe('Performance Monitoring', () => {
    test('should maintain 55+ FPS with all shapes', async ({ page }) => {
      await page.goto(DEMO_URL);
      await page.waitForTimeout(3000);

      const shapes = ['torus-knot', 'sphere', 'cylinder', 'cone', 'cube', 'torus'];

      for (const shape of shapes) {
        await page.click(`[data-shape="${shape}"]`);
        await page.waitForTimeout(2000);

        const fpsText = await page.locator('#fps').textContent();
        const fps = parseInt(fpsText);

        expect(fps).toBeGreaterThan(55);
        console.log(`${shape}: ${fps} FPS`);
      }
    });

    test('should handle rapid shape switching', async ({ page }) => {
      await page.goto(DEMO_URL);
      await page.waitForTimeout(2000);

      const shapes = ['sphere', 'cube', 'torus', 'cone'];

      // Rapidly switch shapes
      for (let i = 0; i < 3; i++) {
        for (const shape of shapes) {
          await page.click(`[data-shape="${shape}"]`);
          await page.waitForTimeout(100);
        }
      }

      // Should still be responsive
      await page.waitForTimeout(1000);
      const fpsText = await page.locator('#fps').textContent();
      const fps = parseInt(fpsText);

      expect(fps).toBeGreaterThan(30);
    });
  });

  test.describe('Geometry Disposal', () => {
    test('should dispose old geometry when switching', async ({ page }) => {
      await page.goto(DEMO_URL);
      await page.waitForTimeout(2000);

      // Get initial memory
      const initialMemory = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });

      // Switch shapes multiple times
      const shapes = ['sphere', 'cube', 'torus', 'cone', 'cylinder'];
      for (let i = 0; i < 5; i++) {
        for (const shape of shapes) {
          await page.click(`[data-shape="${shape}"]`);
          await page.waitForTimeout(200);
        }
      }

      // Force garbage collection if available
      await page.evaluate(() => {
        if (window.gc) {
          window.gc();
        }
      });

      await page.waitForTimeout(1000);

      // Get final memory
      const finalMemory = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });

      // Memory growth should be minimal (< 30MB)
      if (initialMemory > 0) {
        const growth = finalMemory - initialMemory;
        expect(growth).toBeLessThan(30 * 1024 * 1024);
        console.log(`Memory growth: ${(growth / 1024 / 1024).toFixed(2)} MB`);
      }
    });
  });

  test.describe('Visual Snapshots (Combined)', () => {
    test('should match snapshot: torus-knot + gradient + standard', async ({ page }) => {
      await page.goto(DEMO_URL);
      await page.waitForTimeout(3000);

      // Default state
      const screenshot = await page.screenshot();
      expect(screenshot).toMatchSnapshot('procedural-default.png', {
        maxDiffPixels: 100,
        threshold: 0.2
      });
    });

    test('should match snapshot: sphere + neon + metallic', async ({ page }) => {
      await page.goto(DEMO_URL);
      await page.waitForTimeout(2000);

      await page.click('[data-shape="sphere"]');
      await page.waitForTimeout(500);
      await page.click('[data-color="neon"]');
      await page.waitForTimeout(500);
      await page.click('[data-material="metallic"]');
      await page.waitForTimeout(1000);

      const screenshot = await page.screenshot();
      expect(screenshot).toMatchSnapshot('procedural-sphere-neon-metallic.png', {
        maxDiffPixels: 200,
        threshold: 0.3
      });
    });

    test('should match snapshot: cube + pastel + glass', async ({ page }) => {
      await page.goto(DEMO_URL);
      await page.waitForTimeout(2000);

      await page.click('[data-shape="cube"]');
      await page.waitForTimeout(500);
      await page.click('[data-color="pastel"]');
      await page.waitForTimeout(500);
      await page.click('[data-material="glass"]');
      await page.waitForTimeout(1000);

      const screenshot = await page.screenshot();
      expect(screenshot).toMatchSnapshot('procedural-cube-pastel-glass.png', {
        maxDiffPixels: 200,
        threshold: 0.3
      });
    });
  });

  test.describe('Mobile Responsiveness', () => {
    test('should work on mobile viewport', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(DEMO_URL);
      await page.waitForTimeout(2000);

      // Controls should be visible
      const controls = await page.locator('#controls');
      await expect(controls).toBeVisible();

      // Buttons should be clickable
      await page.click('[data-shape="sphere"]');
      await page.waitForTimeout(500);

      const currentShape = await page.locator('#current-shape');
      await expect(currentShape).toContainText('Sphere');
    });
  });

  test.describe('Cross-Browser Compatibility', () => {
    test('should render correctly in all browsers', async ({ page, browserName }) => {
      await page.goto(DEMO_URL);
      await page.waitForTimeout(3000);

      // Should show canvas
      const canvas = await page.locator('canvas');
      await expect(canvas).toBeVisible();

      // Should show FPS
      const fps = await page.locator('#fps');
      const fpsValue = await fps.textContent();
      expect(parseInt(fpsValue)).toBeGreaterThan(0);

      console.log(`${browserName}: FPS = ${fpsValue}`);
    });
  });
});
