/**
 * FeatureRailBlock.js - Horizontal parallax card rail
 *
 * Creates a horizontal row of cards that move at different speeds
 * based on parallax strength, creating depth illusion.
 */

import * as THREE from 'three';
import { BaseBlock } from './BaseBlock.js';

export class FeatureRailBlock extends BaseBlock {
  static requiredAssets(params) {
    if (!params.cards || !Array.isArray(params.cards)) {
      return [];
    }

    return params.cards.map(card => card.image).filter(Boolean);
  }

  async mount({ scene, camera, renderer, assets, params }) {
    // Don't call super.mount() - BaseBlock.mount() throws error
    // Instead, directly set properties and handle assets
    this.scene = scene;
    this.camera = camera;
    this.renderer = renderer;
    this.assets = assets;
    this.params = params;

    if (!params.cards || !Array.isArray(params.cards)) {
      console.warn('FeatureRailBlock: No cards configuration provided');
      return;
    }

    this.cards = [];
    const spacing = params.spacing || 4.5;
    const cardHeight = params.cardHeight || 3;
    const cardWidth = params.cardWidth || 2.5;

    params.cards.forEach((cardConfig, index) => {
      const card = this._createCard(cardConfig, assets, {
        cardWidth,
        cardHeight
      });

      if (card) {
        // Position cards horizontally
        const totalWidth = (params.cards.length - 1) * spacing;
        card.position.x = -totalWidth / 2 + index * spacing;
        card.position.z = -index * 0.2; // Slight depth variation

        // Store base position and parallax strength
        card.userData.baseX = card.position.x;
        card.userData.parallaxStrength = cardConfig.parallaxStrength || 0.3;

        this.addObject(card);
        this.cards.push(card);
      }
    });
  }

  update({ progress, time, viewport, state }) {
    // Scroll-based parallax
    const scrollOffset = (progress - 0.5) * 10;

    this.cards.forEach(card => {
      const baseX = card.userData.baseX;
      const strength = card.userData.parallaxStrength;

      // Apply parallax offset
      card.position.x = baseX - scrollOffset * strength;

      // Optional: subtle hover animation
      card.position.y = Math.sin(time + card.userData.baseX) * 0.1;
    });

    // Optional: apply state-based animations
    if (state) {
      if (typeof state.railOpacity === 'number') {
        this.cards.forEach(card => {
          if (card.material) {
            card.material.opacity = state.railOpacity;
          }
        });
      }

      if (typeof state.railScale === 'number') {
        this.cards.forEach(card => {
          card.scale.setScalar(state.railScale);
        });
      }
    }
  }

  _createCard(cardConfig, assets, options) {
    const { cardWidth, cardHeight } = options;

    // Get texture
    const textureAsset = assets[cardConfig.image];
    if (!textureAsset) {
      console.warn('FeatureRailBlock: Card texture not found:', cardConfig.image);
      return null;
    }

    let texture = null;
    if (textureAsset instanceof THREE.Texture) {
      texture = textureAsset;
    } else if (textureAsset.albedo) {
      texture = textureAsset.albedo;
    }

    if (!texture) {
      console.warn('FeatureRailBlock: Could not extract texture from asset');
      return null;
    }

    // Create material
    const material = new THREE.MeshBasicMaterial({
      map: texture,
      transparent: true,
      side: THREE.DoubleSide
    });

    // Create card mesh
    const geometry = new THREE.PlaneGeometry(cardWidth, cardHeight);
    const card = new THREE.Mesh(geometry, material);

    // Add subtle border/frame effect
    if (cardConfig.showFrame) {
      this._addCardFrame(card, cardWidth, cardHeight);
    }

    this.trackDisposable(geometry);
    this.trackDisposable(material);

    return card;
  }

  _addCardFrame(card, width, height) {
    // Create thin border using line segments
    const borderGeometry = new THREE.EdgesGeometry(
      new THREE.PlaneGeometry(width + 0.1, height + 0.1)
    );

    const borderMaterial = new THREE.LineBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: 0.6
    });

    const border = new THREE.LineSegments(borderGeometry, borderMaterial);
    border.position.z = 0.01; // Slightly in front

    card.add(border);
    this.trackDisposable(borderGeometry);
    this.trackDisposable(borderMaterial);
  }
}

export default FeatureRailBlock;
