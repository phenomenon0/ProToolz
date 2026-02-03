/**
 * ScrollDriver.js - Convert scroll positions into normalized section progress
 *
 * Features:
 * - Track viewport height and section bounding boxes
 * - Compute current section and progress within it (0..1)
 * - Handle sticky sections and activation zones
 * - Support prefers-reduced-motion (instant snapping)
 * - Emit events: section-enter, section-exit, section-progress
 */

export class ScrollDriver {
  constructor(container, options = {}) {
    this.container = container;
    this.sections = new Map(); // id -> { element, id, bounds }
    this.currentSectionId = null;
    this.currentProgress = 0;
    this.listeners = new Map(); // event -> callbacks[]

    // Options
    this.activationZone = options.activationZone || 0.2; // Top 20% of viewport triggers
    this.updateThrottle = options.updateThrottle || 16; // ~60fps
    this.usePassiveListeners = options.usePassiveListeners !== false;

    // Reduced motion support
    this.prefersReducedMotion = matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.reducedMotionQuery = matchMedia('(prefers-reduced-motion: reduce)');
    this.reducedMotionQuery.addEventListener('change', (e) => {
      this.prefersReducedMotion = e.matches;
    });

    // Scroll state
    this.lastScrollTime = 0;
    this.rafId = null;
    this.isScrolling = false;

    // Bind methods
    this._handleScroll = this._handleScroll.bind(this);
    this._handleResize = this._handleResize.bind(this);
    this._updateScrollState = this._updateScrollState.bind(this);

    // Initialize
    this._addListeners();
  }

  /**
   * Register a section element for tracking
   * @param {HTMLElement} element - Section DOM element
   * @param {string} id - Unique section identifier
   */
  registerSection(element, id) {
    if (!element) {
      console.warn(`ScrollDriver: Cannot register section "${id}" - element is null`);
      return;
    }

    this.sections.set(id, {
      element,
      id,
      bounds: this._computeBounds(element)
    });

    // Update bounds on registration
    this._updateBounds();
  }

  /**
   * Unregister a section
   * @param {string} id - Section identifier
   */
  unregisterSection(id) {
    this.sections.delete(id);
  }

  /**
   * Get current active section ID
   * @returns {string|null}
   */
  getCurrentSection() {
    return this.currentSectionId;
  }

  /**
   * Get current progress within active section (0..1)
   * @returns {number}
   */
  getProgress() {
    return this.currentProgress;
  }

  /**
   * Get all registered section IDs
   * @returns {string[]}
   */
  getSectionIds() {
    return Array.from(this.sections.keys());
  }

  /**
   * Subscribe to scroll events
   * @param {string} event - Event name (section-enter, section-exit, section-progress)
   * @param {Function} callback - Callback function
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * Unsubscribe from scroll events
   * @param {string} event - Event name
   * @param {Function} callback - Callback function
   */
  off(event, callback) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    const index = callbacks.indexOf(callback);
    if (index !== -1) {
      callbacks.splice(index, 1);
    }
  }

  /**
   * Manually trigger update (useful after DOM changes)
   */
  update() {
    this._updateBounds();
    this._updateScrollState();
  }

  /**
   * Clean up and remove listeners
   */
  destroy() {
    this._removeListeners();
    if (this.rafId) {
      cancelAnimationFrame(this.rafId);
    }
    this.sections.clear();
    this.listeners.clear();
  }

  // Private methods

  _addListeners() {
    const options = this.usePassiveListeners ? { passive: true } : false;
    window.addEventListener('scroll', this._handleScroll, options);
    window.addEventListener('resize', this._handleResize);
    // Initial update
    this._updateBounds();
    this._updateScrollState();
  }

  _removeListeners() {
    window.removeEventListener('scroll', this._handleScroll);
    window.removeEventListener('resize', this._handleResize);
  }

  _handleScroll() {
    const now = performance.now();

    // Throttle updates
    if (now - this.lastScrollTime < this.updateThrottle) {
      if (!this.rafId) {
        this.rafId = requestAnimationFrame(() => {
          this._updateScrollState();
          this.rafId = null;
        });
      }
      return;
    }

    this.lastScrollTime = now;
    this._updateScrollState();
  }

  _handleResize() {
    this._updateBounds();
    this._updateScrollState();
  }

  _computeBounds(element) {
    const rect = element.getBoundingClientRect();
    const scrollTop = window.pageYOffset || document.documentElement.scrollTop;

    return {
      top: rect.top + scrollTop,
      bottom: rect.bottom + scrollTop,
      height: rect.height
    };
  }

  _updateBounds() {
    this.sections.forEach((section) => {
      section.bounds = this._computeBounds(section.element);
    });
  }

  _updateScrollState() {
    const scrollY = window.pageYOffset || document.documentElement.scrollTop;
    const viewportHeight = window.innerHeight;
    const activationY = scrollY + viewportHeight * this.activationZone;

    let activeSection = null;
    let maxOverlap = 0;

    // Find section with most overlap in activation zone
    this.sections.forEach((section) => {
      const { top, bottom, height } = section.bounds;

      // Check if section is in view
      if (bottom < scrollY || top > scrollY + viewportHeight) {
        return; // Section not visible
      }

      // Calculate overlap with viewport
      const overlapTop = Math.max(scrollY, top);
      const overlapBottom = Math.min(scrollY + viewportHeight, bottom);
      const overlap = overlapBottom - overlapTop;

      if (overlap > maxOverlap) {
        maxOverlap = overlap;
        activeSection = section;
      }
    });

    if (!activeSection) {
      // No section active
      if (this.currentSectionId !== null) {
        this._emit('section-exit', { id: this.currentSectionId });
        this.currentSectionId = null;
        this.currentProgress = 0;
      }
      return;
    }

    // Calculate progress within section
    const { top, height } = activeSection.bounds;
    const sectionScrollStart = top - viewportHeight;
    const sectionScrollEnd = top + height;
    const scrollRange = sectionScrollEnd - sectionScrollStart;

    let progress = 0;
    if (scrollRange > 0) {
      progress = (scrollY - sectionScrollStart) / scrollRange;
      progress = Math.max(0, Math.min(1, progress)); // Clamp to [0, 1]
    }

    // Apply reduced motion (snap to keyframes)
    if (this.prefersReducedMotion) {
      progress = progress < 0.5 ? 0 : 1;
    }

    // Check for section change
    if (activeSection.id !== this.currentSectionId) {
      if (this.currentSectionId !== null) {
        this._emit('section-exit', { id: this.currentSectionId });
      }
      this.currentSectionId = activeSection.id;
      this._emit('section-enter', { id: activeSection.id });
    }

    // Update progress
    if (progress !== this.currentProgress) {
      this.currentProgress = progress;
      this._emit('section-progress', {
        id: activeSection.id,
        progress,
        scrollY,
        bounds: activeSection.bounds
      });
    }
  }

  _emit(event, data) {
    if (!this.listeners.has(event)) return;
    const callbacks = this.listeners.get(event);
    callbacks.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`ScrollDriver: Error in ${event} callback:`, error);
      }
    });
  }
}

export default ScrollDriver;
