#!/usr/bin/env node

/**
 * Story.json Validator
 *
 * Validates story.json files against the schema and provides helpful error messages.
 *
 * @version 1.0.0
 * @license CC0
 */

import Ajv from 'ajv';
import { readFileSync, existsSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Colors
const colors = {
  reset: '\x1b[0m',
  bright: '\x1b[1m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m'
};

function colorize(text, color) {
  return `${colors[color]}${text}${colors.reset}`;
}

// Load schema
function loadSchema() {
  const schemaPath = resolve(__dirname, '../story/story.schema.json');

  if (!existsSync(schemaPath)) {
    console.error(colorize('✗ Schema file not found:', 'red'), schemaPath);
    process.exit(1);
  }

  try {
    const schemaContent = readFileSync(schemaPath, 'utf8');
    return JSON.parse(schemaContent);
  } catch (error) {
    console.error(colorize('✗ Failed to load schema:', 'red'), error.message);
    process.exit(1);
  }
}

// Validate story file
function validateStory(filepath) {
  console.log(colorize('\n╔═══════════════════════════════════════════════════╗', 'cyan'));
  console.log(colorize('║                                                   ║', 'cyan'));
  console.log(colorize('║            Story.json Validator                  ║', 'cyan'));
  console.log(colorize('║                                                   ║', 'cyan'));
  console.log(colorize('╚═══════════════════════════════════════════════════╝', 'cyan'));
  console.log('');

  // Check file exists
  const fullPath = resolve(process.cwd(), filepath);
  if (!existsSync(fullPath)) {
    console.error(colorize('✗ File not found:', 'red'), fullPath);
    process.exit(1);
  }

  console.log(colorize('Validating:', 'blue'), fullPath);
  console.log('');

  // Load story file
  let story;
  try {
    const content = readFileSync(fullPath, 'utf8');
    story = JSON.parse(content);
  } catch (error) {
    console.error(colorize('✗ Invalid JSON:', 'red'), error.message);
    process.exit(1);
  }

  // Load schema
  const schema = loadSchema();

  // Create validator
  const ajv = new Ajv({ allErrors: true, verbose: true });
  const validate = ajv.compile(schema);

  // Validate
  const valid = validate(story);

  if (valid) {
    console.log(colorize('╔═══════════════════════════════════════════════════╗', 'green'));
    console.log(colorize('║                                                   ║', 'green'));
    console.log(colorize('║          ✓ Story is valid!                       ║', 'green'));
    console.log(colorize('║                                                   ║', 'green'));
    console.log(colorize('╚═══════════════════════════════════════════════════╝', 'green'));
    console.log('');

    // Show summary
    console.log(colorize('Summary:', 'bright'));
    console.log(`  Version: ${story.version || 'not specified'}`);
    console.log(`  Sections: ${story.sections ? story.sections.length : 0}`);
    console.log(`  Catalogs: ${story.catalogs ? story.catalogs.length : 0}`);

    if (story.sections) {
      console.log('');
      console.log(colorize('Sections:', 'bright'));
      story.sections.forEach((section, i) => {
        const keyframes = section.timeline ? section.timeline.length : 0;
        const assets = section.assets ? Object.keys(section.assets).length : 0;
        console.log(`  ${i + 1}. ${section.id} (${section.block})`);
        console.log(`     └─ Keyframes: ${keyframes}, Assets: ${assets}`);
      });
    }

    console.log('');
    return true;
  } else {
    console.log(colorize('╔═══════════════════════════════════════════════════╗', 'red'));
    console.log(colorize('║                                                   ║', 'red'));
    console.log(colorize('║          ✗ Validation Failed                     ║', 'red'));
    console.log(colorize('║                                                   ║', 'red'));
    console.log(colorize('╚═══════════════════════════════════════════════════╝', 'red'));
    console.log('');

    console.log(colorize('Errors:', 'red'));
    validate.errors.forEach((error, i) => {
      console.log('');
      console.log(colorize(`  ${i + 1}. ${error.instancePath || 'root'}`, 'bright'));
      console.log(`     ${error.message}`);

      if (error.params) {
        console.log(`     ${colorize('Details:', 'yellow')}`, JSON.stringify(error.params, null, 2));
      }
    });

    console.log('');
    console.log(colorize('Tips:', 'yellow'));
    console.log('  - Check the story schema: story/story.schema.json');
    console.log('  - Review documentation: docs/story-authoring-guide.md');
    console.log('  - Use the wizard: npm run wizard');
    console.log('');

    return false;
  }
}

// Additional checks beyond schema validation
function performAdditionalChecks(filepath) {
  const fullPath = resolve(process.cwd(), filepath);
  const content = readFileSync(fullPath, 'utf8');
  const story = JSON.parse(content);

  const warnings = [];
  const recommendations = [];

  // Check for duplicate section IDs
  if (story.sections) {
    const ids = story.sections.map(s => s.id);
    const duplicates = ids.filter((id, index) => ids.indexOf(id) !== index);
    if (duplicates.length > 0) {
      warnings.push(`Duplicate section IDs found: ${duplicates.join(', ')}`);
    }
  }

  // Check for missing timeline keyframes
  if (story.sections) {
    story.sections.forEach(section => {
      if (!section.timeline || section.timeline.length === 0) {
        warnings.push(`Section "${section.id}" has no timeline keyframes`);
      }
    });
  }

  // Check memory budget
  if (story.performance && story.performance.budgetMB) {
    if (story.performance.budgetMB < 256) {
      recommendations.push('Memory budget < 256MB may be too restrictive for complex scenes');
    }
    if (story.performance.budgetMB > 1024) {
      recommendations.push('Memory budget > 1GB may cause issues on mobile devices');
    }
  }

  // Check prefetch threshold
  if (story.performance && story.performance.prefetchThreshold) {
    if (story.performance.prefetchThreshold < 0.4) {
      recommendations.push('Prefetch threshold < 0.4 may cause late loading');
    }
    if (story.performance.prefetchThreshold > 0.8) {
      recommendations.push('Prefetch threshold > 0.8 may load assets too early');
    }
  }

  // Output warnings and recommendations
  if (warnings.length > 0) {
    console.log(colorize('⚠ Warnings:', 'yellow'));
    warnings.forEach(w => console.log(`  - ${w}`));
    console.log('');
  }

  if (recommendations.length > 0) {
    console.log(colorize('💡 Recommendations:', 'blue'));
    recommendations.forEach(r => console.log(`  - ${r}`));
    console.log('');
  }

  if (warnings.length === 0 && recommendations.length === 0) {
    console.log(colorize('✓ No warnings or recommendations', 'green'));
    console.log('');
  }
}

// Main
const args = process.argv.slice(2);

if (args.length === 0) {
  console.log('Usage: story-validator <story.json>');
  console.log('');
  console.log('Examples:');
  console.log('  story-validator my-story.story.json');
  console.log('  npm run validate my-story.story.json');
  process.exit(1);
}

const filepath = args[0];
const valid = validateStory(filepath);

if (valid) {
  performAdditionalChecks(filepath);
  process.exit(0);
} else {
  process.exit(1);
}
