#!/usr/bin/env node

/**
 * Story.json Wizard
 *
 * Interactive CLI tool for creating WebGPU Three.js TSL story configurations.
 * Guides users through story creation with validation and helpful prompts.
 *
 * @version 1.0.0
 * @license CC0
 */

import inquirer from 'inquirer';
import { writeFileSync, readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Available block types
const BLOCK_TYPES = [
  { name: 'TitleBlock - Simple title/text section', value: 'TitleBlock' },
  { name: 'HeroPaintingBlock - Portrait with ornate frame', value: 'HeroPaintingBlock' },
  { name: 'CloudLayerBlock - Atmospheric clouds with parallax', value: 'CloudLayerBlock' },
  { name: 'FeatureRailBlock - Horizontal card carousel', value: 'FeatureRailBlock' },
  { name: 'OrnateFrameRevealBlock - Frame animation reveal', value: 'OrnateFrameRevealBlock' },
  { name: 'Custom - I have my own block', value: 'Custom' }
];

// Common easing functions
const EASING_FUNCTIONS = [
  'linear',
  'easeInQuad', 'easeOutQuad', 'easeInOutQuad',
  'easeInCubic', 'easeOutCubic', 'easeInOutCubic',
  'easeInQuart', 'easeOutQuart', 'easeInOutQuart',
  'easeInSine', 'easeOutSine', 'easeInOutSine',
  'easeInExpo', 'easeOutExpo', 'easeInOutExpo',
  'easeInCirc', 'easeOutCirc', 'easeInOutCirc',
  'easeInBack', 'easeOutBack', 'easeInOutBack',
  'easeInElastic', 'easeOutElastic', 'easeInOutElastic',
  'easeInBounce', 'easeOutBounce', 'easeInOutBounce'
];

// Story templates
const STORY_TEMPLATES = {
  blank: {
    name: 'Blank Story - Start from scratch',
    sections: []
  },
  simple: {
    name: 'Simple Scroll Story - 3 sections',
    sections: [
      {
        id: 'intro',
        block: 'TitleBlock',
        params: { title: 'Welcome', subtitle: 'Scroll to explore' },
        timeline: [
          { t: 0, opacity: 0 },
          { t: 1, opacity: 1, easing: 'easeOutCubic' }
        ]
      },
      {
        id: 'content',
        block: 'FeatureRailBlock',
        params: { cardCount: 3 },
        timeline: [
          { t: 0, position: [0, 0, 0], opacity: 0 },
          { t: 1, position: [0, 0, 0], opacity: 1, easing: 'easeInOutCubic' }
        ]
      },
      {
        id: 'outro',
        block: 'TitleBlock',
        params: { title: 'Thank You', subtitle: 'The End' },
        timeline: [
          { t: 0, opacity: 0 },
          { t: 1, opacity: 1, easing: 'easeOutQuad' }
        ]
      }
    ]
  },
  renaissance: {
    name: 'Renaissance Gallery - Portrait showcase',
    sections: [
      {
        id: 'hero',
        block: 'HeroPaintingBlock',
        assets: {
          portrait: 'renaissance/hero-portrait',
          depthMap: 'renaissance/hero-portrait-depth',
          frame: 'renaissance/ornate-frame-a'
        },
        params: { parallaxStrength: 0.5 },
        timeline: [
          { t: 0, opacity: 0, position: [0, 0, -5] },
          { t: 0.5, opacity: 1, position: [0, 0, 0], easing: 'easeOutCubic' },
          { t: 1, opacity: 1, position: [0, 0, 0] }
        ]
      },
      {
        id: 'clouds',
        block: 'CloudLayerBlock',
        assets: {
          cloudMask: 'renaissance/clouds-wispy'
        },
        params: { layerCount: 3, speed: 0.5 },
        timeline: [
          { t: 0, opacity: 0 },
          { t: 1, opacity: 0.8, easing: 'easeInOutSine' }
        ]
      },
      {
        id: 'features',
        block: 'FeatureRailBlock',
        assets: {
          card1: 'renaissance/feature-card-1',
          card2: 'renaissance/feature-card-2',
          card3: 'renaissance/feature-card-3'
        },
        params: { cardSpacing: 2 },
        timeline: [
          { t: 0, position: [10, 0, 0], opacity: 0 },
          { t: 1, position: [0, 0, 0], opacity: 1, easing: 'easeOutBack' }
        ]
      }
    ]
  }
};

// Color utilities
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  dim: '\x1b[2m',
  blue: '\x1b[34m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  magenta: '\x1b[35m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

function printHeader() {
  console.clear();
  console.log(colorize('\n╔═══════════════════════════════════════════════════╗', 'cyan'));
  console.log(colorize('║                                                   ║', 'cyan'));
  console.log(colorize('║         ', 'cyan') + colorize('WebGPU Story.json Wizard', 'bright') + colorize('              ║', 'cyan'));
  console.log(colorize('║                                                   ║', 'cyan'));
  console.log(colorize('║   Interactive CLI for creating scroll stories    ║', 'cyan'));
  console.log(colorize('║                                                   ║', 'cyan'));
  console.log(colorize('╚═══════════════════════════════════════════════════╝', 'cyan'));
  console.log('');
}

function printSuccess(message) {
  console.log(colorize('✓ ', 'green') + message);
}

function printInfo(message) {
  console.log(colorize('ℹ ', 'blue') + colorize(message, 'dim'));
}

function printWarning(message) {
  console.log(colorize('⚠ ', 'yellow') + message);
}

// Main wizard class
class StoryWizard {
  constructor() {
    this.story = {
      version: '1.0.0',
      catalogs: [],
      sections: [],
      performance: {
        prefetchThreshold: 0.6,
        disposeDistance: 2,
        maxConcurrentLoads: 3,
        budgetMB: 512
      },
      renderer: {
        antialias: true,
        powerPreference: 'high-performance'
      }
    };
  }

  async start() {
    printHeader();

    printInfo('This wizard will guide you through creating a story.json file');
    printInfo('for WebGPU Three.js scroll-driven narratives.\n');

    try {
      await this.chooseTemplate();
      await this.configureMetadata();
      await this.configureCatalogs();

      if (this.story.sections.length === 0) {
        await this.createSections();
      } else {
        const { modifySections } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'modifySections',
            message: 'Template includes sections. Modify them?',
            default: false
          }
        ]);

        if (modifySections) {
          await this.createSections();
        }
      }

      await this.configurePerformance();
      await this.saveStory();

      this.showSummary();
    } catch (error) {
      if (error.isTtyError) {
        console.error('Prompt couldn\'t be rendered in the current environment');
      } else {
        console.error('Error:', error.message);
      }
      process.exit(1);
    }
  }

  async chooseTemplate() {
    const { template } = await inquirer.prompt([
      {
        type: 'list',
        name: 'template',
        message: 'Choose a starting template:',
        choices: [
          { name: STORY_TEMPLATES.blank.name, value: 'blank' },
          { name: STORY_TEMPLATES.simple.name, value: 'simple' },
          { name: STORY_TEMPLATES.renaissance.name, value: 'renaissance' }
        ]
      }
    ]);

    if (template !== 'blank') {
      this.story.sections = JSON.parse(JSON.stringify(STORY_TEMPLATES[template].sections));
      printSuccess(`Loaded template: ${STORY_TEMPLATES[template].name}`);
    }
  }

  async configureMetadata() {
    console.log(colorize('\n── Story Metadata ──────────────────────────────────', 'cyan'));

    const answers = await inquirer.prompt([
      {
        type: 'input',
        name: 'title',
        message: 'Story title (for reference):',
        default: 'My WebGPU Story'
      },
      {
        type: 'input',
        name: 'description',
        message: 'Story description:',
        default: 'A scroll-driven narrative using WebGPU and Three.js'
      }
    ]);

    this.story.title = answers.title;
    this.story.description = answers.description;

    printSuccess('Metadata configured');
  }

  async configureCatalogs() {
    console.log(colorize('\n── Asset Catalogs ──────────────────────────────────', 'cyan'));

    const { addCatalogs } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addCatalogs',
        message: 'Add asset catalogs?',
        default: true
      }
    ]);

    if (!addCatalogs) {
      printInfo('No catalogs added. You can add them later.');
      return;
    }

    const defaultCatalogs = [
      'http://localhost:8787/packs/core/catalogs/core.catalog.json',
      'http://localhost:8787/packs/renaissance/catalogs/renaissance.catalog.json',
      'http://localhost:8787/packs/starter/catalogs/starter.catalog.json'
    ];

    const { catalogChoice } = await inquirer.prompt([
      {
        type: 'list',
        name: 'catalogChoice',
        message: 'Catalog configuration:',
        choices: [
          { name: 'Use default catalogs (recommended)', value: 'default' },
          { name: 'Add custom catalog URLs', value: 'custom' },
          { name: 'Skip for now', value: 'skip' }
        ]
      }
    ]);

    if (catalogChoice === 'default') {
      this.story.catalogs = [...defaultCatalogs];
      printSuccess(`Added ${this.story.catalogs.length} default catalogs`);
    } else if (catalogChoice === 'custom') {
      await this.addCustomCatalogs();
    }
  }

  async addCustomCatalogs() {
    let addMore = true;

    while (addMore) {
      const { catalogUrl } = await inquirer.prompt([
        {
          type: 'input',
          name: 'catalogUrl',
          message: 'Catalog URL:',
          validate: (input) => {
            if (!input) return 'URL is required';
            if (!input.startsWith('http')) return 'URL must start with http:// or https://';
            if (!input.endsWith('.json')) return 'URL must end with .json';
            return true;
          }
        }
      ]);

      this.story.catalogs.push(catalogUrl);
      printSuccess(`Added catalog: ${catalogUrl}`);

      const { more } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'more',
          message: 'Add another catalog?',
          default: false
        }
      ]);

      addMore = more;
    }
  }

  async createSections() {
    console.log(colorize('\n── Story Sections ──────────────────────────────────', 'cyan'));

    const { sectionCount } = await inquirer.prompt([
      {
        type: 'number',
        name: 'sectionCount',
        message: 'How many sections?',
        default: this.story.sections.length || 3,
        validate: (val) => val > 0 || 'Must have at least 1 section'
      }
    ]);

    // Clear existing sections if starting fresh
    if (this.story.sections.length > 0) {
      const { clearSections } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'clearSections',
          message: 'Clear existing sections?',
          default: false
        }
      ]);

      if (clearSections) {
        this.story.sections = [];
      }
    }

    // Create new sections
    const sectionsToCreate = sectionCount - this.story.sections.length;

    for (let i = 0; i < sectionsToCreate; i++) {
      const sectionIndex = this.story.sections.length + 1;
      console.log(colorize(`\n─ Section ${sectionIndex} ─────────────────────────────────────`, 'magenta'));

      const section = await this.createSection(sectionIndex);
      this.story.sections.push(section);

      printSuccess(`Section "${section.id}" created`);
    }
  }

  async createSection(index) {
    const section = {
      id: `section-${index}`,
      block: 'TitleBlock',
      assets: {},
      params: {},
      timeline: []
    };

    // Section ID
    const { id } = await inquirer.prompt([
      {
        type: 'input',
        name: 'id',
        message: 'Section ID (unique):',
        default: `section-${index}`,
        validate: (input) => {
          if (!input) return 'ID is required';
          if (this.story.sections.some(s => s.id === input)) {
            return 'ID must be unique';
          }
          return true;
        }
      }
    ]);
    section.id = id;

    // Block type
    const { blockType } = await inquirer.prompt([
      {
        type: 'list',
        name: 'blockType',
        message: 'Block type:',
        choices: BLOCK_TYPES
      }
    ]);

    if (blockType === 'Custom') {
      const { customBlock } = await inquirer.prompt([
        {
          type: 'input',
          name: 'customBlock',
          message: 'Custom block name:',
          validate: (input) => input ? true : 'Block name is required'
        }
      ]);
      section.block = customBlock;
    } else {
      section.block = blockType;
    }

    // Assets
    const { addAssets } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addAssets',
        message: 'Add asset references?',
        default: false
      }
    ]);

    if (addAssets) {
      await this.addSectionAssets(section);
    }

    // Parameters
    const { addParams } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addParams',
        message: 'Add block parameters?',
        default: false
      }
    ]);

    if (addParams) {
      await this.addSectionParams(section);
    }

    // Timeline
    const { addTimeline } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'addTimeline',
        message: 'Create timeline keyframes?',
        default: true
      }
    ]);

    if (addTimeline) {
      await this.createTimeline(section);
    }

    return section;
  }

  async addSectionAssets(section) {
    let addMore = true;

    while (addMore) {
      const { assetKey, assetId } = await inquirer.prompt([
        {
          type: 'input',
          name: 'assetKey',
          message: 'Asset key (e.g., "mainModel", "texture"):',
          validate: (input) => input ? true : 'Key is required'
        },
        {
          type: 'input',
          name: 'assetId',
          message: 'Asset ID from catalog (e.g., "core/oak-wood"):',
          validate: (input) => input ? true : 'Asset ID is required'
        }
      ]);

      section.assets[assetKey] = assetId;
      printSuccess(`Added asset: ${assetKey} → ${assetId}`);

      const { more } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'more',
          message: 'Add another asset?',
          default: false
        }
      ]);

      addMore = more;
    }
  }

  async addSectionParams(section) {
    let addMore = true;

    while (addMore) {
      const { paramKey, paramType } = await inquirer.prompt([
        {
          type: 'input',
          name: 'paramKey',
          message: 'Parameter name:',
          validate: (input) => input ? true : 'Name is required'
        },
        {
          type: 'list',
          name: 'paramType',
          message: 'Parameter type:',
          choices: ['string', 'number', 'boolean', 'array', 'object']
        }
      ]);

      let value;
      if (paramType === 'string') {
        const { stringValue } = await inquirer.prompt([
          {
            type: 'input',
            name: 'stringValue',
            message: 'Value:'
          }
        ]);
        value = stringValue;
      } else if (paramType === 'number') {
        const { numberValue } = await inquirer.prompt([
          {
            type: 'number',
            name: 'numberValue',
            message: 'Value:'
          }
        ]);
        value = numberValue;
      } else if (paramType === 'boolean') {
        const { boolValue } = await inquirer.prompt([
          {
            type: 'confirm',
            name: 'boolValue',
            message: 'Value:'
          }
        ]);
        value = boolValue;
      } else if (paramType === 'array') {
        const { arrayValue } = await inquirer.prompt([
          {
            type: 'input',
            name: 'arrayValue',
            message: 'Value (comma-separated):',
          }
        ]);
        value = arrayValue.split(',').map(v => v.trim());
      } else {
        printWarning('Object parameters must be added manually to the JSON file');
        value = {};
      }

      section.params[paramKey] = value;
      printSuccess(`Added parameter: ${paramKey} = ${JSON.stringify(value)}`);

      const { more } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'more',
          message: 'Add another parameter?',
          default: false
        }
      ]);

      addMore = more;
    }
  }

  async createTimeline(section) {
    const { keyframeCount } = await inquirer.prompt([
      {
        type: 'number',
        name: 'keyframeCount',
        message: 'Number of keyframes:',
        default: 2,
        validate: (val) => val >= 2 || 'Need at least 2 keyframes (start and end)'
      }
    ]);

    for (let i = 0; i < keyframeCount; i++) {
      const keyframe = await this.createKeyframe(i, keyframeCount);
      section.timeline.push(keyframe);
    }

    printSuccess(`Created ${keyframeCount} keyframes`);
  }

  async createKeyframe(index, total) {
    const defaultT = index / (total - 1);

    const { t, property, easing } = await inquirer.prompt([
      {
        type: 'number',
        name: 't',
        message: `Keyframe ${index + 1} - Time (0-1):`,
        default: defaultT,
        validate: (val) => (val >= 0 && val <= 1) || 'Time must be between 0 and 1'
      },
      {
        type: 'list',
        name: 'property',
        message: 'Animate property:',
        choices: [
          'opacity',
          'position (vec3)',
          'scale (number)',
          'rotation (quaternion)',
          'color',
          'custom'
        ]
      },
      {
        type: 'list',
        name: 'easing',
        message: 'Easing function:',
        choices: EASING_FUNCTIONS.slice(0, 10), // Show top 10
        default: 'linear'
      }
    ]);

    const keyframe = { t };
    if (easing !== 'linear') {
      keyframe.easing = easing;
    }

    // Add property value
    if (property === 'opacity') {
      const { value } = await inquirer.prompt([
        {
          type: 'number',
          name: 'value',
          message: 'Opacity value (0-1):',
          default: index === 0 ? 0 : 1,
          validate: (val) => (val >= 0 && val <= 1) || 'Opacity must be 0-1'
        }
      ]);
      keyframe.opacity = value;
    } else if (property === 'position (vec3)') {
      const { position } = await inquirer.prompt([
        {
          type: 'input',
          name: 'position',
          message: 'Position [x, y, z]:',
          default: '0, 0, 0',
          validate: (input) => {
            const parts = input.split(',').map(p => parseFloat(p.trim()));
            return parts.length === 3 && parts.every(p => !isNaN(p)) || 'Enter 3 numbers';
          }
        }
      ]);
      keyframe.position = position.split(',').map(p => parseFloat(p.trim()));
    } else if (property === 'scale (number)') {
      const { scale } = await inquirer.prompt([
        {
          type: 'number',
          name: 'scale',
          message: 'Scale value:',
          default: 1
        }
      ]);
      keyframe.scale = scale;
    } else if (property === 'color') {
      const { color } = await inquirer.prompt([
        {
          type: 'input',
          name: 'color',
          message: 'Color (hex):',
          default: '#ffffff',
          validate: (input) => /^#[0-9a-f]{6}$/i.test(input) || 'Enter valid hex color'
        }
      ]);
      keyframe.color = color;
    }

    return keyframe;
  }

  async configurePerformance() {
    console.log(colorize('\n── Performance Settings ────────────────────────────', 'cyan'));

    const { configurePerf } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'configurePerf',
        message: 'Configure performance settings?',
        default: false
      }
    ]);

    if (!configurePerf) {
      printInfo('Using default performance settings');
      return;
    }

    const answers = await inquirer.prompt([
      {
        type: 'number',
        name: 'prefetchThreshold',
        message: 'Prefetch threshold (0-1):',
        default: 0.6,
        validate: (val) => (val >= 0 && val <= 1) || 'Must be 0-1'
      },
      {
        type: 'number',
        name: 'disposeDistance',
        message: 'Dispose distance (sections):',
        default: 2,
        validate: (val) => val >= 0 || 'Must be >= 0'
      },
      {
        type: 'number',
        name: 'maxConcurrentLoads',
        message: 'Max concurrent loads:',
        default: 3,
        validate: (val) => val > 0 || 'Must be > 0'
      },
      {
        type: 'number',
        name: 'budgetMB',
        message: 'Memory budget (MB):',
        default: 512,
        validate: (val) => val > 0 || 'Must be > 0'
      }
    ]);

    this.story.performance = { ...this.story.performance, ...answers };
    printSuccess('Performance settings configured');
  }

  async saveStory() {
    console.log(colorize('\n── Save Story ──────────────────────────────────────', 'cyan'));

    const { filename } = await inquirer.prompt([
      {
        type: 'input',
        name: 'filename',
        message: 'Save as:',
        default: `${this.story.title.toLowerCase().replace(/\s+/g, '-')}.story.json`,
        validate: (input) => {
          if (!input) return 'Filename is required';
          if (!input.endsWith('.json')) return 'Must end with .json';
          return true;
        }
      }
    ]);

    const filepath = resolve(process.cwd(), filename);

    // Check if file exists
    if (existsSync(filepath)) {
      const { overwrite } = await inquirer.prompt([
        {
          type: 'confirm',
          name: 'overwrite',
          message: 'File exists. Overwrite?',
          default: false
        }
      ]);

      if (!overwrite) {
        printWarning('Save cancelled');
        process.exit(0);
      }
    }

    // Save file
    const json = JSON.stringify(this.story, null, 2);
    writeFileSync(filepath, json, 'utf8');

    this.savedFilepath = filepath;
    printSuccess(`Story saved to: ${filepath}`);
  }

  showSummary() {
    console.log(colorize('\n╔═══════════════════════════════════════════════════╗', 'green'));
    console.log(colorize('║                                                   ║', 'green'));
    console.log(colorize('║              ', 'green') + colorize('Story Created Successfully!', 'bright') + colorize('         ║', 'green'));
    console.log(colorize('║                                                   ║', 'green'));
    console.log(colorize('╚═══════════════════════════════════════════════════╝', 'green'));
    console.log('');
    console.log(colorize('Summary:', 'bright'));
    console.log(`  Title: ${this.story.title}`);
    console.log(`  Sections: ${this.story.sections.length}`);
    console.log(`  Catalogs: ${this.story.catalogs.length}`);
    console.log(`  File: ${this.savedFilepath}`);
    console.log('');
    console.log(colorize('Next Steps:', 'bright'));
    console.log('  1. Review the generated JSON file');
    console.log('  2. Customize section parameters as needed');
    console.log('  3. Use StoryRunner to load and run your story:');
    console.log('');
    console.log(colorize('     const runner = new StoryRunner("path/to/your-story.json");', 'dim'));
    console.log(colorize('     await runner.init();', 'dim'));
    console.log('');
    console.log(colorize('Documentation:', 'bright'));
    console.log('  - Story Authoring Guide: docs/story-authoring-guide.md');
    console.log('  - Block Development Guide: docs/block-development-guide.md');
    console.log('  - Story Schema: story/story.schema.json');
    console.log('');
  }
}

// Run wizard
const wizard = new StoryWizard();
wizard.start().catch(console.error);
