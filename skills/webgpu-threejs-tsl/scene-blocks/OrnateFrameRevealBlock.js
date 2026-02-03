/**
 * OrnateFrameRevealBlock.js - Frame pieces that slide/rotate into position
 *
 * Animates individual frame pieces (corners and edges) from off-screen
 * positions with staggered timing for dramatic reveal effect.
 */

import * as THREE from 'three';
import { BaseBlock } from './BaseBlock.js';

export class OrnateFrameRevealBlock extends BaseBlock {
  static requiredAssets(params) {
    const assets = [];
    if (params.frame) assets.push(params.frame);
    return assets;
  }

  async mount({ scene, camera, renderer, assets, params }) {
    await super.mount({ scene, camera, renderer, assets, params });

    // Get frame model
    const frameAsset = assets[params.frame];
    if (!frameAsset) {
      console.warn('OrnateFrameRevealBlock: No frame asset provided');
      return;
    }

    // Clone the frame
    this.frameRoot = frameAsset.clone();

    // Find frame pieces by name
    this.pieces = this._identifyFramePieces(this.frameRoot);

    // Store initial positions
    this.pieces.forEach(piece => {
      piece.userData.targetPosition = piece.position.clone();
      piece.userData.targetRotation = piece.rotation.z;
      piece.userData.targetScale = piece.scale.clone();

      // Set starting position (off-screen)
      this._setStartingTransform(piece);
    });

    this.addObject(this.frameRoot);
  }

  update({ progress, time, viewport, state }) {
    const staggerCount = this.pieces.length;
    const staggerDelay = 0.1; // Each piece starts 10% into the progress

    this.pieces.forEach((piece, index) => {
      const pieceDelay = (index / staggerCount) * staggerDelay;
      const pieceDuration = 1.0 - staggerDelay;

      // Calculate piece-specific progress
      const pieceProgress = Math.max(0, Math.min(1, (progress - pieceDelay) / pieceDuration));

      // Ease-out cubic
      const t = 1 - Math.pow(1 - pieceProgress, 3);

      // Interpolate position
      if (piece.userData.startPosition && piece.userData.targetPosition) {
        piece.position.lerpVectors(piece.userData.startPosition, piece.userData.targetPosition, t);
      }

      // Interpolate rotation
      if (typeof piece.userData.startRotation === 'number' && typeof piece.userData.targetRotation === 'number') {
        piece.rotation.z = piece.userData.startRotation + (piece.userData.targetRotation - piece.userData.startRotation) * t;
      }

      // Interpolate scale
      if (piece.userData.startScale && piece.userData.targetScale) {
        piece.scale.lerpVectors(piece.userData.startScale, piece.userData.targetScale, t);
      }
    });
  }

  _identifyFramePieces(frameRoot) {
    const pieces = [];

    frameRoot.traverse(node => {
      // Look for meshes that might be frame pieces
      if (node.isMesh) {
        const name = node.name.toLowerCase();

        // Identify piece type by name
        let pieceType = 'unknown';
        if (name.includes('corner') || name.includes('tl') || name.includes('tr') || name.includes('bl') || name.includes('br')) {
          pieceType = 'corner';
        } else if (name.includes('edge') || name.includes('top') || name.includes('bottom') || name.includes('left') || name.includes('right')) {
          pieceType = 'edge';
        }

        node.userData.pieceType = pieceType;
        pieces.push(node);
      }
    });

    // If no pieces identified, use all meshes
    if (pieces.length === 0) {
      frameRoot.traverse(node => {
        if (node.isMesh) {
          pieces.push(node);
        }
      });
    }

    return pieces;
  }

  _setStartingTransform(piece) {
    const pieceType = piece.userData.pieceType || 'unknown';
    const targetPos = piece.userData.targetPosition;

    // Determine starting offset based on piece type
    let startOffset = new THREE.Vector3(0, 5, 0); // Default: slide from top

    if (pieceType === 'corner') {
      // Corners: slide from diagonal
      if (targetPos.x < 0 && targetPos.y > 0) {
        // Top-left
        startOffset.set(-5, 5, 0);
      } else if (targetPos.x > 0 && targetPos.y > 0) {
        // Top-right
        startOffset.set(5, 5, 0);
      } else if (targetPos.x < 0 && targetPos.y < 0) {
        // Bottom-left
        startOffset.set(-5, -5, 0);
      } else {
        // Bottom-right
        startOffset.set(5, -5, 0);
      }
    } else if (pieceType === 'edge') {
      // Edges: slide from perpendicular direction
      if (Math.abs(targetPos.y) > Math.abs(targetPos.x)) {
        // Top or bottom edge
        startOffset.set(0, targetPos.y > 0 ? 5 : -5, 0);
      } else {
        // Left or right edge
        startOffset.set(targetPos.x > 0 ? 5 : -5, 0, 0);
      }
    }

    piece.userData.startPosition = targetPos.clone().add(startOffset);
    piece.position.copy(piece.userData.startPosition);

    // Starting rotation (90 degrees rotated)
    piece.userData.startRotation = piece.userData.targetRotation + Math.PI / 2;
    piece.rotation.z = piece.userData.startRotation;

    // Starting scale (50%)
    piece.userData.startScale = piece.userData.targetScale.clone().multiplyScalar(0.5);
    piece.scale.copy(piece.userData.startScale);
  }
}

export default OrnateFrameRevealBlock;
