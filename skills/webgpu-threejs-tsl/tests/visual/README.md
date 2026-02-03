# Visual Regression Testing

**Framework:** Playwright
**Purpose:** Catch rendering bugs, performance regressions, and cross-browser issues

---

## Quick Start

### Install Playwright

```bash
cd /Users/jethrovic/.claude/skills/webgpu-threejs-tsl
npm install
npx playwright install
```

### Run Visual Tests

```bash
npm run test:visual
```

### View Report

```bash
npm run test:visual:report
```

---

## Test Suites

### 1. Standalone WebGPU Demo (standalone-demo.spec.js)

**Coverage:**
- ✅ Initial rendering and canvas display
- ✅ Renderer status badge (WebGPU/WebGL)
- ✅ Info panel and stats display
- ✅ Visual snapshots (initial + rotated)
- ✅ Performance monitoring (55+ FPS target)
- ✅ Render time validation (< 5ms)
- ✅ Responsive design (mobile, tablet)
- ✅ Error handling and fallback
- ✅ Memory leak detection
- ✅ Accessibility checks

**Test Count:** 15+

---

### 2. Procedural Gallery (procedural-gallery.spec.js)

**Coverage:**
- ✅ Initial state and default shape
- ✅ Controls panel display
- ✅ Shape switching (6 geometries)
- ✅ Triangle count updates
- ✅ Color scheme switching (gradient, neon, pastel)
- ✅ Material type switching (standard, metallic, glass)
- ✅ Performance with all shapes (55+ FPS)
- ✅ Rapid switching stress test
- ✅ Geometry disposal and memory management
- ✅ Visual snapshots (combinations)
- ✅ Mobile responsiveness
- ✅ Cross-browser compatibility

**Test Count:** 40+

---

## Test Categories

### Visual Snapshots 📸
**Purpose:** Detect rendering changes

```javascript
test('should match initial render', async ({ page }) => {
  await page.goto(DEMO_URL);
  await page.waitForTimeout(3000);

  const screenshot = await page.screenshot();
  expect(screenshot).toMatchSnapshot('demo-initial.png', {
    maxDiffPixels: 100,
    threshold: 0.2
  });
});
```

**Tolerance:**
- `maxDiffPixels`: Maximum different pixels allowed
- `threshold`: Pixel difference threshold (0-1)

---

### Performance Tests ⚡
**Purpose:** Ensure smooth rendering

```javascript
test('should maintain 55+ FPS', async ({ page }) => {
  await page.goto(DEMO_URL);
  await page.waitForTimeout(3000);

  const samples = [];
  for (let i = 0; i < 10; i++) {
    await page.waitForTimeout(1000);
    const fps = await page.locator('#fps').textContent();
    samples.push(parseInt(fps));
  }

  const avgFPS = samples.reduce((a, b) => a + b, 0) / samples.length;
  expect(avgFPS).toBeGreaterThan(55);
});
```

**Targets:**
- Desktop: 55+ FPS
- Mobile: 30+ FPS
- Render time: < 5ms

---

### Memory Tests 💾
**Purpose:** Detect memory leaks

```javascript
test('should not have memory leaks', async ({ page }) => {
  await page.goto(DEMO_URL);

  const initialMemory = await page.evaluate(() => {
    return performance.memory.usedJSHeapSize;
  });

  // Let it run
  await page.waitForTimeout(10000);

  const finalMemory = await page.evaluate(() => {
    return performance.memory.usedJSHeapSize;
  });

  const growth = finalMemory - initialMemory;
  expect(growth).toBeLessThan(50 * 1024 * 1024); // < 50MB
});
```

**Thresholds:**
- Standalone demo: < 50MB growth
- Procedural gallery: < 30MB growth (with disposal)

---

### Responsive Tests 📱
**Purpose:** Verify mobile/tablet layouts

```javascript
test('should work on mobile', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto(DEMO_URL);

  const canvas = await page.locator('canvas');
  await expect(canvas).toBeVisible();
});
```

**Viewports Tested:**
- Mobile: 375x667 (iPhone SE)
- Tablet: 768x1024 (iPad)
- Desktop: 1280x720 (default)

---

### Cross-Browser Tests 🌐
**Purpose:** Ensure consistency across browsers

```javascript
test('should render in all browsers', async ({ page, browserName }) => {
  await page.goto(DEMO_URL);
  await page.waitForTimeout(3000);

  const fps = await page.locator('#fps').textContent();
  expect(parseInt(fps)).toBeGreaterThan(0);

  console.log(`${browserName}: ${fps} FPS`);
});
```

**Browsers:**
- Chromium (WebGPU + WebGL)
- Firefox
- WebKit (Safari)
- Mobile Chrome
- Mobile Safari

---

## Running Tests

### All Tests

```bash
npm run test:visual
```

### Specific Test File

```bash
npx playwright test standalone-demo.spec.js
```

### Specific Browser

```bash
npx playwright test --project=chromium-webgpu
npx playwright test --project=firefox
```

### Headed Mode (Watch Browser)

```bash
npx playwright test --headed
```

### Debug Mode

```bash
npm run test:visual:debug
```

### Update Snapshots

When intentional visual changes are made:

```bash
npm run test:visual:update
```

### Generate Report

```bash
npm run test:visual:report
```

---

## Configuration

### playwright.config.js

**Key Settings:**
```javascript
{
  testDir: './tests/visual',
  timeout: 30 * 1000,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,

  use: {
    baseURL: 'http://localhost:8080',
    viewport: { width: 1280, height: 720 },
    screenshot: 'only-on-failure',
    video: 'retain-on-failure'
  },

  webServer: {
    command: 'python3 -m http.server 8080',
    url: 'http://localhost:8080'
  }
}
```

**Projects:**
- `chromium-webgpu` - WebGPU enabled
- `chromium-webgl` - WebGPU disabled (fallback test)
- `firefox` - Firefox browser
- `webkit` - Safari browser
- `mobile-chrome` - Pixel 5 emulation
- `mobile-safari` - iPhone 12 emulation

---

## Snapshot Management

### Directory Structure

```
tests/visual/
├── standalone-demo.spec.js
├── procedural-gallery.spec.js
├── standalone-demo.spec.js-snapshots/
│   ├── standalone-demo-initial-chromium-webgpu.png
│   ├── standalone-demo-rotated-chromium-webgpu.png
│   └── ... (per browser)
└── procedural-gallery.spec.js-snapshots/
    ├── procedural-default-chromium-webgpu.png
    ├── procedural-gradient-chromium-webgpu.png
    └── ...
```

### Updating Snapshots

```bash
# Update all
npm run test:visual:update

# Update specific test
npx playwright test standalone-demo --update-snapshots

# Update specific browser
npx playwright test --project=chromium-webgpu --update-snapshots
```

---

## Continuous Integration

### GitHub Actions Example

```yaml
name: Visual Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npx playwright install --with-deps
      - run: npm run test:visual
      - uses: actions/upload-artifact@v3
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

---

## Debugging Failed Tests

### 1. View Test Report

```bash
npm run test:visual:report
```

Click on failed test to see:
- Screenshot comparison
- Error message
- Step-by-step trace

### 2. Run in Debug Mode

```bash
npx playwright test standalone-demo --debug
```

Features:
- Pause before each action
- Step through test
- Inspect elements
- View console logs

### 3. Run in Headed Mode

```bash
npx playwright test standalone-demo --headed
```

Watch the browser as test runs.

### 4. Screenshot on Failure

Playwright automatically captures:
- Screenshot at failure point
- Full page HTML
- Network logs
- Console logs

Location: `test-results/`

---

## Performance Benchmarking

### FPS Monitoring

```javascript
// Collect FPS over time
const fpsData = [];
for (let i = 0; i < 60; i++) {
  await page.waitForTimeout(1000);
  const fps = await page.locator('#fps').textContent();
  fpsData.push(parseInt(fps));
}

// Calculate statistics
const avg = fpsData.reduce((a, b) => a + b, 0) / fpsData.length;
const min = Math.min(...fpsData);
const max = Math.max(...fpsData);

console.log(`FPS: avg=${avg}, min=${min}, max=${max}`);
```

### Memory Profiling

```javascript
// Track memory over shape switches
const memoryData = [];
const shapes = ['sphere', 'cube', 'torus', 'cone'];

for (const shape of shapes) {
  await page.click(`[data-shape="${shape}"]`);
  await page.waitForTimeout(1000);

  const memory = await page.evaluate(() => {
    return performance.memory.usedJSHeapSize;
  });

  memoryData.push({ shape, memory });
}

console.table(memoryData);
```

---

## Best Practices

### 1. Wait for Initialization

Always wait for WebGPU/rendering to initialize:

```javascript
await page.waitForTimeout(2000); // Minimum
await page.waitForTimeout(3000); // Recommended for screenshots
```

### 2. Snapshot Tolerance

Set appropriate thresholds:
- **Strict (0.1):** UI elements, text
- **Moderate (0.2):** Simple 3D scenes
- **Loose (0.3):** Complex animations, procedural content

### 3. Memory Tests

Run garbage collection before measuring:

```javascript
await page.evaluate(() => {
  if (window.gc) window.gc();
});
```

Note: Requires `--js-flags="--expose-gc"` flag.

### 4. Performance Tests

Collect multiple samples for accuracy:

```javascript
const samples = [];
for (let i = 0; i < 10; i++) {
  // ... collect sample
}
const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
```

---

## Troubleshooting

### WebGPU Not Available

**Issue:** Tests fail with "WebGPU not supported"

**Solution:**
```bash
# Use WebGL project instead
npx playwright test --project=chromium-webgl

# Or enable in Chromium
npx playwright test --project=chromium-webgpu
```

### Flaky Visual Tests

**Issue:** Snapshots fail inconsistently

**Causes:**
- Animations not settled
- Loading not complete
- Timing issues

**Solutions:**
```javascript
// Increase wait time
await page.waitForTimeout(5000);

// Wait for specific element
await page.waitForSelector('#fps');

// Wait for network idle
await page.waitForLoadState('networkidle');

// Increase tolerance
expect(screenshot).toMatchSnapshot('test.png', {
  maxDiffPixels: 200,
  threshold: 0.3
});
```

### HTTP Server Not Starting

**Issue:** `webServer` fails to start

**Solution:**
```bash
# Check port 8080 is free
lsof -i :8080

# Or change port in playwright.config.js
webServer: {
  command: 'python3 -m http.server 8081',
  url: 'http://localhost:8081'
}
```

---

## Coverage Summary

**Total Tests:** 55+
**Demo Coverage:**
- Standalone WebGPU Demo: ✅ Complete
- Procedural Gallery: ✅ Complete
- Origami Gallery: ⏳ TODO
- Asset Browser: ⏳ TODO
- Renaissance Scrollytell: ⏳ TODO

**Browser Coverage:**
- Chromium (WebGPU): ✅
- Chromium (WebGL): ✅
- Firefox: ✅
- WebKit: ✅
- Mobile Chrome: ✅
- Mobile Safari: ✅

**Test Categories:**
- Visual Snapshots: ✅ 15+ tests
- Performance: ✅ 10+ tests
- Memory: ✅ 5+ tests
- Responsive: ✅ 5+ tests
- Accessibility: ✅ 5+ tests
- Cross-browser: ✅ 15+ tests

---

## Next Steps

### Additional Tests Needed

- [ ] Origami Gallery tests
- [ ] Asset Browser tests
- [ ] Renaissance Scrollytell tests
- [ ] Story System integration tests
- [ ] Shader compilation tests

### Enhancements

- [ ] Lighthouse performance audits
- [ ] WebGPU error injection tests
- [ ] Network throttling tests
- [ ] Battery usage tests (mobile)

---

**Last Updated:** 2026-01-27
**Framework:** Playwright v1.40+
**Status:** ✅ Production Ready
