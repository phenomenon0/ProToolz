/**
 * StoryRunner.js - Main orchestrator for scroll-driven cinematic stories
 *
 * Responsibilities:
 * - Parse and validate story JSON
 * - Initialize AssetLibrary with catalogs
 * - Create ScrollDriver and register sections
 * - Instantiate scene blocks from BlockRegistry
 * - Coordinate prefetch (next section at threshold progress)
 * - Dispose far-behind sections
 * - Manage shared Three.js renderer/scene/camera
 * - Handle render loop with RAF optimization
 */

import * as THREE from 'three';
import { AssetLibrary } from '../assets/AssetLibrary.js';
import { ScrollDriver } from './ScrollDriver.js';
import { Timeline } from './Timeline.js';
import { PrefetchManager } from './PrefetchManager.js';
import { MemoryBudget } from './MemoryBudget.js';
import { ReducedMotionHandler } from './ReducedMotionHandler.js';
import { StoryDebugger } from './StoryDebugger.js';

export class StoryRunner {
  constructor(storyConfigOrUrl, options = {}) {
    this.storyConfig = storyConfigOrUrl;
    this.options = options;

    // Core components
    this.story = null;
    this.assetLibrary = null;
    this.scrollDriver = null;
    this.prefetchManager = null;
    this.memoryBudget = null;
    this.reducedMotionHandler = null;
    this.debugger = null;

    // Three.js components
    this.renderer = null;
    this.scene = null;
    this.camera = null;
    this.canvas = null;

    // Section management
    this.sections = new Map(); // sectionId -> { config, block, timeline, assets, mounted }
    this.currentSectionId = null;
    this.lastProgress = 0;

    // Performance
    this.rafId = null;
    this.clock = new THREE.Clock();

    // Options
    this.canvasSelector = options.canvasSelector || '#story-canvas';
    this.containerSelector = options.containerSelector || '.story-container';
    this.debugMode = options.debugMode || false;
  }

  /**
   * Initialize story runner
   */
  async init() {
    try {
      // Load story JSON
      this.story = await this._loadStory();

      // Validate story
      this._validateStory();

      // Initialize asset library
      await this._initAssetLibrary();

      // Initialize Three.js
      this._initThreeJS();

      // Initialize managers
      this._initManagers();

      // Register sections
      this._registerSections();

      // Setup scroll driver
      this._setupScrollDriver();

      // Start render loop
      this._startRenderLoop();

      // Setup debug controls
      if (this.debugMode) {
        this._setupDebug();
      }

      console.log('StoryRunner: Initialized successfully');
    } catch (error) {
      console.error('StoryRunner: Initialization failed:', error);
      throw error;
    }
  }

  /**
   * Clean up and destroy
   */
  destroy() {
    // Stop render loop
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
      this.rafId = null;
    }

    // Dispose all sections
    this.sections.forEach((section, id) => {
      if (section.block && section.block.dispose) {
        section.block.dispose();
      }
      this.memoryBudget.free(id);
    });
    this.sections.clear();

    // Destroy managers
    if (this.scrollDriver) {
      this.scrollDriver.destroy();
    }
    if (this.reducedMotionHandler) {
      this.reducedMotionHandler.destroy();
    }
    if (this.debugger) {
      this.debugger.destroy();
    }

    // Dispose Three.js
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.scene) {
      this.scene.clear();
    }

    console.log('StoryRunner: Destroyed');
  }

  // Private methods

  async _loadStory() {
    if (typeof this.storyConfig === 'string') {
      // Load from URL
      const response = await fetch(this.storyConfig);
      if (!response.ok) {
        throw new Error(`Failed to load story from ${this.storyConfig}: ${response.status}`);
      }
      return await response.json();
    }
    // Story config is already an object
    return this.storyConfig;
  }

  _validateStory() {
    if (!this.story.version) {
      throw new Error('Story missing version field');
    }
    if (!Array.isArray(this.story.sections) || this.story.sections.length === 0) {
      throw new Error('Story must have at least one section');
    }

    // Validate section IDs are unique
    const ids = new Set();
    this.story.sections.forEach((section, i) => {
      if (!section.id) {
        throw new Error(`Section ${i} missing id field`);
      }
      if (ids.has(section.id)) {
        throw new Error(`Duplicate section ID: ${section.id}`);
      }
      ids.add(section.id);

      if (!section.block) {
        throw new Error(`Section ${section.id} missing block field`);
      }
    });
  }

  async _initAssetLibrary() {
    this.assetLibrary = AssetLibrary.getInstance();

    // Register catalogs
    if (this.story.catalogs && Array.isArray(this.story.catalogs)) {
      for (const catalogUrl of this.story.catalogs) {
        const url = new URL(catalogUrl, window.location.href).href;
        await this.assetLibrary.registerCatalogFromUrl(url, {
          packId: 'story',
          baseUri: url.substring(0, url.lastIndexOf('/') + 1)
        });
      }
    }
  }

  _initThreeJS() {
    // Get canvas
    this.canvas = document.querySelector(this.canvasSelector);
    if (!this.canvas) {
      throw new Error(`Canvas not found: ${this.canvasSelector}`);
    }

    // Renderer config
    const rendererConfig = this.story.renderer || {};
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.canvas,
      antialias: rendererConfig.antialias !== false,
      alpha: rendererConfig.alpha !== false,
      powerPreference: rendererConfig.powerPreference || 'default'
    });

    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));

    // Initialize asset library with renderer
    this.assetLibrary.initialize(this.renderer);

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(
      50,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    this.camera.position.z = 5;

    // Handle resize
    window.addEventListener('resize', () => {
      this.camera.aspect = window.innerWidth / window.innerHeight;
      this.camera.updateProjectionMatrix();
      this.renderer.setSize(window.innerWidth, window.innerHeight);
    });
  }

  _initManagers() {
    const perf = this.story.performance || {};

    this.prefetchManager = new PrefetchManager(this.assetLibrary, {
      maxConcurrentLoads: perf.maxConcurrentLoads || 3
    });

    this.memoryBudget = new MemoryBudget(perf.budgetMB || 512);

    this.reducedMotionHandler = new ReducedMotionHandler();

    if (this.debugMode) {
      this.debugger = new StoryDebugger({ enabled: true });
      StoryDebugger.setupKeyboardShortcut(this.debugger);
    }
  }

  _registerSections() {
    const container = document.querySelector(this.containerSelector);
    if (!container) {
      console.warn(`StoryRunner: Container not found: ${this.containerSelector}`);
      return;
    }

    this.story.sections.forEach((sectionConfig) => {
      // Create section entry
      const timeline = sectionConfig.timeline
        ? new Timeline(sectionConfig.timeline)
        : null;

      this.sections.set(sectionConfig.id, {
        config: sectionConfig,
        block: null,
        timeline,
        assets: {},
        mounted: false
      });
    });
  }

  _setupScrollDriver() {
    const container = document.querySelector(this.containerSelector);
    if (!container) {
      throw new Error(`Container not found: ${this.containerSelector}`);
    }

    this.scrollDriver = new ScrollDriver(container, {
      activationZone: 0.2,
      updateThrottle: 16
    });

    // Register HTML sections
    this.story.sections.forEach((sectionConfig) => {
      const element = document.querySelector(`[data-section-id="${sectionConfig.id}"]`);
      if (element) {
        this.scrollDriver.registerSection(element, sectionConfig.id);
      } else {
        console.warn(`StoryRunner: HTML section not found for: ${sectionConfig.id}`);
      }
    });

    // Listen for section changes
    this.scrollDriver.on('section-enter', (data) => {
      this._onSectionEnter(data.id);
    });

    this.scrollDriver.on('section-progress', (data) => {
      this._onSectionProgress(data.id, data.progress);
    });
  }

  async _onSectionEnter(sectionId) {
    console.log(`StoryRunner: Entering section: ${sectionId}`);
    this.currentSectionId = sectionId;

    const section = this.sections.get(sectionId);
    if (!section) return;

    // Mount block if not already mounted
    if (!section.mounted) {
      await this._mountSection(sectionId);
    }
  }

  async _onSectionProgress(sectionId, progress) {
    this.lastProgress = progress;

    const section = this.sections.get(sectionId);
    if (!section || !section.mounted) return;

    // Prefetch next section at threshold
    const perf = this.story.performance || {};
    const prefetchThreshold = perf.prefetchThreshold || 0.6;

    if (progress >= prefetchThreshold) {
      const currentIndex = this.story.sections.findIndex(s => s.id === sectionId);
      if (currentIndex >= 0 && currentIndex < this.story.sections.length - 1) {
        const nextSection = this.story.sections[currentIndex + 1];
        this._prefetchSection(nextSection.id);
      }
    }

    // Dispose far-behind sections
    const disposeDistance = perf.disposeDistance || 2;
    this._disposeDistantSections(sectionId, disposeDistance);

    // Evaluate timeline
    if (section.timeline) {
      const state = section.timeline.evaluate(progress);

      // Update block
      if (section.block && section.block.update) {
        section.block.update({
          progress,
          time: this.clock.getElapsedTime(),
          viewport: { width: window.innerWidth, height: window.innerHeight },
          state
        });
      }
    }
  }

  async _mountSection(sectionId) {
    const section = this.sections.get(sectionId);
    if (!section || section.mounted) return;

    try {
      const { config } = section;

      // Load assets
      const assetIds = Object.values(config.assets || {});
      if (assetIds.length > 0) {
        await this._loadAssets(assetIds, section);
      }

      // Import BlockRegistry dynamically
      const { BlockRegistry } = await import('../scene-blocks/BlockRegistry.js');

      // Get block class
      const BlockClass = BlockRegistry.get(config.block);
      if (!BlockClass) {
        throw new Error(`Block type not found: ${config.block}`);
      }

      // Create block instance
      section.block = new BlockClass();

      // Mount block
      await section.block.mount({
        scene: this.scene,
        camera: this.camera,
        renderer: this.renderer,
        assets: section.assets,
        params: config.params || {}
      });

      section.mounted = true;

      console.log(`StoryRunner: Mounted section: ${sectionId}`);
    } catch (error) {
      console.error(`StoryRunner: Failed to mount section ${sectionId}:`, error);
      // Create empty block to prevent crashes
      section.block = {
        update: () => {},
        dispose: () => {}
      };
      section.mounted = true;
    }
  }

  async _loadAssets(assetIds, section) {
    const loadedAssets = {};

    for (const assetId of assetIds) {
      try {
        const asset = await this._loadAsset(assetId);
        loadedAssets[assetId] = asset;

        // Track memory
        const bytes = this.memoryBudget.estimateAssetSize(asset);
        this.memoryBudget.allocate(section.config.id, bytes);
      } catch (error) {
        console.error(`StoryRunner: Failed to load asset ${assetId}:`, error);
      }
    }

    section.assets = loadedAssets;
  }

  async _loadAsset(assetId) {
    const { asset } = this.assetLibrary.get(assetId);

    switch (asset.type) {
      case 'model':
        return await this.assetLibrary.getModel(assetId);

      case 'environment':
        return await this.assetLibrary.getEnvironment(assetId);

      case 'pbr-texture-set':
        return await this.assetLibrary.loadPBRTextures(assetId);

      case 'image':
        return await this.assetLibrary.getImage(assetId);

      case 'depth-map':
        return await this.assetLibrary.getDepthMap(assetId);

      case 'alpha-mask':
        return await this.assetLibrary.getAlphaMask(assetId);

      default:
        console.warn(`StoryRunner: Unknown asset type ${asset.type}, skipping`);
        return null;
    }
  }

  _prefetchSection(sectionId) {
    if (this.prefetchManager.isLoaded(sectionId)) {
      return;
    }

    const section = this.sections.get(sectionId);
    if (!section) return;

    const { config } = section;
    const assetIds = Object.values(config.assets || {});

    if (assetIds.length > 0) {
      // Higher priority for next section
      this.prefetchManager.enqueue(sectionId, assetIds, 100);
    }
  }

  _disposeDistantSections(currentSectionId, distance) {
    const currentIndex = this.story.sections.findIndex(s => s.id === currentSectionId);
    if (currentIndex < 0) return;

    this.story.sections.forEach((sectionConfig, index) => {
      const sectionDistance = currentIndex - index;

      if (sectionDistance >= distance) {
        const section = this.sections.get(sectionConfig.id);
        if (section && section.mounted && section.block) {
          // Dispose block
          if (section.block.dispose) {
            section.block.dispose();
          }

          // Free memory
          this.memoryBudget.free(sectionConfig.id);

          section.mounted = false;
          section.block = null;

          console.log(`StoryRunner: Disposed section: ${sectionConfig.id}`);
        }
      }
    });
  }

  _startRenderLoop() {
    const animate = () => {
      this.rafId = requestAnimationFrame(animate);

      // Render scene
      this.renderer.render(this.scene, this.camera);

      // Update debugger
      if (this.debugger && this.debugger.enabled) {
        this.debugger.update({
          sectionId: this.currentSectionId,
          progress: this.lastProgress,
          memoryPercent: this.memoryBudget.getUsagePercent(),
          queueSize: this.prefetchManager.getQueueSize(),
          activeLoads: this.prefetchManager.getActiveCount()
        });
      }
    };

    animate();
  }

  _setupDebug() {
    console.log('StoryRunner: Debug mode enabled');
    console.log('  - Press "D" to toggle debug overlay');
    console.log('  - Memory budget:', this.memoryBudget.maxBudgetBytes / (1024 * 1024), 'MB');
  }
}

export default StoryRunner;
