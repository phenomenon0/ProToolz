/**
 * BlockRegistry.js - Factory registry for block types
 *
 * Blocks are reusable cinematic scene components that can be composed
 * through story JSON configuration.
 */

export class BlockRegistry {
  static blocks = new Map();

  /**
   * Register a block type
   * @param {string} name - Block type name
   * @param {class} BlockClass - Block class (extends BaseBlock)
   */
  static register(name, BlockClass) {
    if (this.blocks.has(name)) {
      console.warn(`BlockRegistry: Overwriting existing block: ${name}`);
    }

    this.blocks.set(name, BlockClass);
    console.log(`BlockRegistry: Registered block: ${name}`);
  }

  /**
   * Get a block class by name
   * @param {string} name - Block type name
   * @returns {class} Block class
   */
  static get(name) {
    const BlockClass = this.blocks.get(name);
    if (!BlockClass) {
      throw new Error(`BlockRegistry: Block not found: ${name}`);
    }
    return BlockClass;
  }

  /**
   * Check if a block type exists
   * @param {string} name - Block type name
   * @returns {boolean}
   */
  static has(name) {
    return this.blocks.has(name);
  }

  /**
   * List all registered block types
   * @returns {string[]}
   */
  static list() {
    return Array.from(this.blocks.keys());
  }

  /**
   * Unregister a block type
   * @param {string} name - Block type name
   */
  static unregister(name) {
    this.blocks.delete(name);
  }

  /**
   * Clear all registered blocks
   */
  static clear() {
    this.blocks.clear();
  }
}

export default BlockRegistry;
