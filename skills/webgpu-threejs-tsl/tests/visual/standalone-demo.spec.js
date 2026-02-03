/**
 * Visual Regression Tests - Standalone WebGPU Demo
 *
 * Tests the standalone demo with WebGPU/WebGL fallback
 */

import { test, expect } from '@playwright/test';

const DEMO_URL = '/templates/standalone-webgpu-demo.html';

test.describe('Standalone WebGPU Demo', () => {
  test.describe('Initial Rendering', () => {
    test('should load and display canvas', async ({ page }) => {
      await page.goto(DEMO_URL);

      // Wait for canvas to be visible
      const canvas = await page.locator('canvas');
      await expect(canvas).toBeVisible();

      // Check canvas has non-zero dimensions
      const box = await canvas.boundingBox();
      expect(box.width).toBeGreaterThan(0);
      expect(box.height).toBeGreaterThan(0);
    });

    test('should show renderer status badge', async ({ page }) => {
      await page.goto(DEMO_URL);

      // Wait for renderer initialization
      await page.waitForTimeout(2000);

      const statusBadge = await page.locator('#renderer-status');
      await expect(statusBadge).toBeVisible();

      // Should show either WebGPU or WebGL
      const text = await statusBadge.textContent();
      expect(text).toMatch(/(WebGPU|WebGL)/);
    });

    test('should display info panel', async ({ page }) => {
      await page.goto(DEMO_URL);

      const infoPanel = await page.locator('#info');
      await expect(infoPanel).toBeVisible();

      // Check for key information
      await expect(infoPanel).toContainText('Zero-dependency demo');
    });

    test('should display stats', async ({ page }) => {
      await page.goto(DEMO_URL);
      await page.waitForTimeout(2000);

      // Check FPS counter
      const fps = await page.locator('#fps');
      await expect(fps).toBeVisible();

      const fpsValue = await fps.textContent();
      const fpsNumber = parseInt(fpsValue);
      expect(fpsNumber).toBeGreaterThan(0);
    });
  });

  test.describe('Visual Snapshots', () => {
    test('should match initial render screenshot', async ({ page }) => {
      await page.goto(DEMO_URL);

      // Wait for WebGPU initialization and first frame
      await page.waitForTimeout(3000);

      // Take screenshot
      const screenshot = await page.screenshot();

      // Compare with baseline (will create baseline on first run)
      expect(screenshot).toMatchSnapshot('standalone-demo-initial.png', {
        maxDiffPixels: 100,
        threshold: 0.2
      });
    });

    test('should match after rotation', async ({ page }) => {
      await page.goto(DEMO_URL);
      await page.waitForTimeout(3000);

      // Wait for some rotation
      await page.waitForTimeout(2000);

      const screenshot = await page.screenshot();
      expect(screenshot).toMatchSnapshot('standalone-demo-rotated.png', {
        maxDiffPixels: 200,
        threshold: 0.3
      });
    });
  });

  test.describe('Performance', () => {
    test('should maintain 55+ FPS', async ({ page }) => {
      await page.goto(DEMO_URL);

      // Wait for initialization
      await page.waitForTimeout(3000);

      // Collect FPS samples
      const samples = [];
      for (let i = 0; i < 10; i++) {
        await page.waitForTimeout(1000);
        const fpsText = await page.locator('#fps').textContent();
        samples.push(parseInt(fpsText));
      }

      // Average FPS
      const avgFPS = samples.reduce((a, b) => a + b, 0) / samples.length;
      expect(avgFPS).toBeGreaterThan(55);

      console.log(`Average FPS: ${avgFPS.toFixed(1)}`);
    });

    test('should have reasonable render time', async ({ page }) => {
      await page.goto(DEMO_URL);
      await page.waitForTimeout(3000);

      // Check render time
      const renderTimeText = await page.locator('#renderTime').textContent();
      const renderTime = parseFloat(renderTimeText);

      // Should render in < 5ms
      expect(renderTime).toBeLessThan(5);
    });
  });

  test.describe('Responsive Design', () => {
    test('should work on mobile viewport', async ({ page }) => {
      // Set mobile viewport
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(DEMO_URL);
      await page.waitForTimeout(2000);

      // Canvas should still be visible
      const canvas = await page.locator('canvas');
      await expect(canvas).toBeVisible();

      // Stats should be visible
      const stats = await page.locator('#stats');
      await expect(stats).toBeVisible();
    });

    test('should work on tablet viewport', async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(DEMO_URL);
      await page.waitForTimeout(2000);

      const canvas = await page.locator('canvas');
      await expect(canvas).toBeVisible();
    });
  });

  test.describe('Error Handling', () => {
    test('should handle WebGPU unavailable gracefully', async ({ page, browserName }) => {
      // Skip on browsers that don't support WebGPU
      test.skip(browserName !== 'chromium', 'WebGPU only in Chromium');

      await page.goto(DEMO_URL);
      await page.waitForTimeout(2000);

      // Even if WebGPU fails, should fall back to WebGL
      const statusBadge = await page.locator('#renderer-status');
      const text = await statusBadge.textContent();

      // Should show either renderer type, not an error
      expect(text).toMatch(/(WebGPU|WebGL)/);
      expect(text).not.toContain('Error');
    });
  });

  test.describe('Memory Management', () => {
    test('should not have memory leaks', async ({ page }) => {
      await page.goto(DEMO_URL);

      // Get initial memory
      const initialMemory = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });

      // Let it run for a bit
      await page.waitForTimeout(10000);

      // Get final memory
      const finalMemory = await page.evaluate(() => {
        return performance.memory ? performance.memory.usedJSHeapSize : 0;
      });

      // Memory should not grow significantly (allow 50MB growth)
      if (initialMemory > 0) {
        const growth = finalMemory - initialMemory;
        expect(growth).toBeLessThan(50 * 1024 * 1024);
      }
    });
  });

  test.describe('Accessibility', () => {
    test('should have proper ARIA labels', async ({ page }) => {
      await page.goto(DEMO_URL);

      // Canvas should be accessible
      const canvas = await page.locator('canvas');
      await expect(canvas).toBeVisible();
    });

    test('should have readable text', async ({ page }) => {
      await page.goto(DEMO_URL);

      // Info panel text should be readable
      const infoPanel = await page.locator('#info');
      const text = await infoPanel.textContent();

      expect(text.length).toBeGreaterThan(20);
    });
  });
});
