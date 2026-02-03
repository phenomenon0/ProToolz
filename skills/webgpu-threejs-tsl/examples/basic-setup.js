/**
 * Basic WebGPU + Three.js Setup
 * Minimal example showing WebGPU renderer initialization
 */

import * as THREE from 'three';
import WebGPURenderer from 'three/webgpu';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';

async function init() {
  // Create scene
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  // Create camera
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  // Create WebGPU renderer
  const renderer = new WebGPURenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  // Initialize WebGPU (async operation)
  try {
    await renderer.init();
    console.log('WebGPU initialized successfully');
  } catch (error) {
    console.error('WebGPU not supported:', error);
    return;
  }

  // Add OrbitControls
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Create geometry
  const geometry = new THREE.BoxGeometry(1, 1, 1);

  // Create material
  const material = new THREE.MeshStandardMaterial({
    color: 0x00ff88,
    roughness: 0.3,
    metalness: 0.7
  });

  // Create mesh
  const cube = new THREE.Mesh(geometry, material);
  scene.add(cube);

  // Add lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  // Handle window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Animation loop
  function animate() {
    controls.update();

    // Rotate cube
    cube.rotation.x += 0.01;
    cube.rotation.y += 0.01;

    renderer.render(scene, camera);
  }

  // Start animation loop
  renderer.setAnimationLoop(animate);
}

// Check WebGPU support
if (!navigator.gpu) {
  alert('WebGPU is not supported in your browser');
} else {
  init();
}
