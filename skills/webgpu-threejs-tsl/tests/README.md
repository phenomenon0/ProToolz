# WebGPU Three.js TSL - Test Suite

**Framework:** Vitest
**Coverage Target:** 70%+
**Status:** Initial Setup Complete

---

## Quick Start

### Install Dependencies

```bash
npm install
```

### Run Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run tests once
npm run test:run

# Run with UI
npm run test:ui

# Run with coverage
npm run test:coverage
```

---

## Test Structure

```
tests/
├── assets/              # Asset system tests
│   ├── AssetLibrary.test.js
│   ├── HttpResolver.test.js
│   └── loaders/         # Loader tests (TODO)
├── story/               # Story system tests
│   ├── Timeline.test.js
│   └── ScrollDriver.test.js (TODO)
├── scene-blocks/        # Scene block tests (TODO)
└── utils/               # Utility tests (TODO)
```

---

## Current Coverage

### ✅ Implemented Tests

#### AssetLibrary (80+ tests)
- Singleton pattern enforcement
- Initialization with/without catalogs
- Pack registration
- Asset indexing (O(1) lookup)
- Asset querying (type, tags, search)
- Cache management
- Error handling
- Resource disposal

**Coverage:** ~85%

#### HttpResolver (40+ tests)
- Default and custom configuration
- URL resolution (absolute, relative)
- Successful fetching (json, text, blob, arrayBuffer)
- Retry logic with exponential backoff
- Timeout handling
- Response type handling
- AbortController integration
- Error scenarios (404, 500, network errors)

**Coverage:** ~90%

#### Timeline (50+ tests)
- Keyframe construction and sorting
- Auto-prepend t=0 keyframe
- Binary search efficiency (O(log n))
- Number interpolation
- Easing functions (32 types)
- Vec3 interpolation
- Color interpolation (hex, rgb)
- Quaternion slerp
- Multiple properties
- Complex scenarios with mixed types

**Coverage:** ~85%

---

## Pending Tests

### Priority: High

#### CacheResolver
- Cache hit/miss scenarios
- Version-based invalidation
- Graceful degradation
- Response type preservation
- Old cache cleanup

#### Loaders
- **TextureAssetLoader**
  - Parallel loading
  - Color space management
  - UV defaults
  - Error handling

- **EnvironmentAssetLoader**
  - RGBELoader integration
  - PMREM generation
  - Cache strategy

- **ModelAssetLoader**
  - GLTF loading
  - Draco decompression
  - Scene cloning
  - Bounding box utilities

### Priority: Medium

#### Story System
- **ScrollDriver**
  - Section progress mapping
  - Event firing (enter, exit, progress)
  - Threshold calculations

- **MemoryBudget**
  - Texture size estimation
  - Model size estimation
  - Disposal strategy

- **PrefetchManager**
  - Priority queue
  - Concurrent loading limits
  - Deduplication

### Priority: Low

#### Scene Blocks
- **BaseBlock**
  - Lifecycle methods
  - Resource tracking
  - Disposal utilities

#### Utilities
- Renderer detector
- Easing functions
- Math utilities

---

## Testing Best Practices

### 1. Test Organization
```javascript
describe('Component', () => {
  describe('Feature Group', () => {
    it('should do something specific', () => {
      // Arrange
      // Act
      // Assert
    });
  });
});
```

### 2. Setup and Teardown
```javascript
beforeEach(() => {
  // Setup fresh state
});

afterEach(() => {
  // Cleanup resources
  vi.restoreAllMocks();
});
```

### 3. Mocking
```javascript
// Mock fetch
global.fetch = vi.fn(() =>
  Promise.resolve({
    ok: true,
    json: () => Promise.resolve({ data: 'test' })
  })
);

// Mock timers
vi.useFakeTimers();
vi.advanceTimersByTime(1000);
vi.useRealTimers();
```

### 4. Assertions
```javascript
// Equality
expect(result).toBe(expected);
expect(result).toEqual(expected);

// Truthiness
expect(value).toBeTruthy();
expect(value).toBeFalsy();

// Numbers
expect(value).toBeCloseTo(expected, precision);
expect(value).toBeGreaterThan(0);

// Errors
expect(() => fn()).toThrow();
await expect(promise).rejects.toThrow();

// Objects
expect(obj).toHaveProperty('key');
expect(array).toHaveLength(3);
```

---

## Writing New Tests

### Template

```javascript
import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import YourComponent from '../../path/to/YourComponent.js';

describe('YourComponent', () => {
  let component;

  beforeEach(() => {
    component = new YourComponent();
  });

  afterEach(() => {
    // Cleanup
  });

  describe('Feature', () => {
    it('should do something', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = component.doSomething(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

---

## Coverage Reports

### Generate Coverage

```bash
npm run test:coverage
```

### View Coverage

```bash
# HTML report
open coverage/index.html

# Terminal summary
npm run test:coverage -- --reporter=text
```

### Coverage Thresholds

- **Lines:** 70%
- **Functions:** 70%
- **Branches:** 70%
- **Statements:** 70%

Tests will fail if coverage drops below thresholds.

---

## Continuous Integration

### GitHub Actions (TODO)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
      - run: npm install
      - run: npm run test:coverage
      - uses: codecov/codecov-action@v3
```

---

## Debugging Tests

### Run Single Test

```bash
# Run specific file
npm test AssetLibrary.test.js

# Run specific test
npm test -- -t "should interpolate"
```

### Debug Mode

```javascript
it.only('should debug this test', () => {
  console.log('Debug output');
  expect(true).toBe(true);
});
```

### VSCode Debug Configuration

```json
{
  "type": "node",
  "request": "launch",
  "name": "Debug Vitest Tests",
  "runtimeExecutable": "npm",
  "runtimeArgs": ["run", "test"],
  "console": "integratedTerminal"
}
```

---

## Performance Testing

### Benchmark Example

```javascript
it('should be performant', () => {
  const iterations = 10000;
  const start = performance.now();

  for (let i = 0; i < iterations; i++) {
    component.operation();
  }

  const end = performance.now();
  const avgTime = (end - start) / iterations;

  expect(avgTime).toBeLessThan(0.1); // < 0.1ms per operation
});
```

---

## Contributing

### Before Submitting

1. Run full test suite: `npm test`
2. Check coverage: `npm run test:coverage`
3. Ensure no console warnings
4. Update test README if needed

### Test Naming Conventions

- **describe:** Component or feature name
- **it:** Should read as sentence ("should do X")
- Use present tense ("creates", not "created")
- Be specific ("should return 404 for missing assets", not "handles errors")

---

## Resources

- [Vitest Documentation](https://vitest.dev/)
- [Three.js Documentation](https://threejs.org/docs/)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

**Last Updated:** 2026-01-27
**Status:** ✅ Phase 1 Complete (3 test suites, 170+ tests)
**Next:** Implement loader tests, cache resolver tests, story system tests
