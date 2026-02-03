import { defineConfig } from 'vitest/config';
import { fileURLToPath } from 'url';
import { dirname, resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default defineConfig({
  test: {
    // Environment
    environment: 'happy-dom',

    // Globals
    globals: true,

    // Test files
    include: [
      'tests/**/*.{test,spec}.{js,mjs,cjs}',
      'assets/**/*.{test,spec}.{js,mjs,cjs}',
      'story/**/*.{test,spec}.{js,mjs,cjs}',
      'scene-blocks/**/*.{test,spec}.{js,mjs,cjs}'
    ],

    // Exclude
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/examples/**',
      '**/public/**',
      '**/templates/**',
      '**/.{idea,git,cache,output,temp}/**'
    ],

    // Coverage
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'lcov', 'json'],
      reportsDirectory: './coverage',
      exclude: [
        '**/node_modules/**',
        '**/dist/**',
        '**/examples/**',
        '**/public/**',
        '**/templates/**',
        '**/tests/**',
        '**/*.config.{js,ts}',
        '**/*.d.ts'
      ],
      // Coverage thresholds
      lines: 70,
      functions: 70,
      branches: 70,
      statements: 70
    },

    // Reporters
    reporters: ['verbose'],

    // Timeouts
    testTimeout: 10000,
    hookTimeout: 10000,

    // Concurrent
    pool: 'threads',
    poolOptions: {
      threads: {
        singleThread: false
      }
    },

    // Mock
    mockReset: true,
    restoreMocks: true,
    clearMocks: true
  },

  // Resolve
  resolve: {
    alias: {
      '@': resolve(__dirname, './'),
      '@assets': resolve(__dirname, './assets'),
      '@story': resolve(__dirname, './story'),
      '@scene-blocks': resolve(__dirname, './scene-blocks'),
      '@utils': resolve(__dirname, './utils')
    }
  }
});
