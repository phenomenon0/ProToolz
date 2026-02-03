/**
 * WebGPU + Three.js Project Template
 * Starter template for WebGPU projects with Three.js
 */

import * as THREE from 'three';
import WebGPURenderer from 'three/webgpu';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {
  MeshStandardNodeMaterial,
  color,
  vec3,
  float,
  uniform,
  positionLocal,
  normalLocal,
  uv,
  timerLocal
} from 'three/tsl';

// Configuration
const CONFIG = {
  antialias: true,
  pixelRatio: window.devicePixelRatio,
  background: 0x1a1a2e,
  fog: false,
  fogColor: 0x1a1a2e,
  fogNear: 5,
  fogFar: 20
};

// State
let renderer, scene, camera, controls;
let lastTime = 0;

async function init() {
  // Check WebGPU support
  if (!navigator.gpu) {
    showError('WebGPU is not supported in your browser');
    return;
  }

  try {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(CONFIG.background);

    if (CONFIG.fog) {
      scene.fog = new THREE.Fog(
        CONFIG.fogColor,
        CONFIG.fogNear,
        CONFIG.fogFar
      );
    }

    // Create camera
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.set(0, 2, 5);
    camera.lookAt(0, 0, 0);

    // Create renderer
    renderer = new WebGPURenderer({ antialias: CONFIG.antialias });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(CONFIG.pixelRatio);
    document.body.appendChild(renderer.domElement);

    // Initialize WebGPU
    await renderer.init();
    console.log('WebGPU initialized successfully');

    // Add controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.05;

    // Setup scene
    setupLights();
    setupObjects();

    // Event listeners
    window.addEventListener('resize', onWindowResize);
    window.addEventListener('keydown', onKeyDown);

    // Start animation loop
    renderer.setAnimationLoop(animate);

  } catch (error) {
    showError('Failed to initialize WebGPU: ' + error.message);
  }
}

function setupLights() {
  // Ambient light
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.4);
  scene.add(ambientLight);

  // Directional light
  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  directionalLight.castShadow = false;
  scene.add(directionalLight);

  // Optional: Add more lights here
}

function setupObjects() {
  // Example: Create a custom material
  const material = new MeshStandardNodeMaterial();

  // Basic color
  material.colorNode = color(0.0, 0.8, 1.0);

  // Add animation
  const time = timerLocal();
  // material.positionNode = positionLocal.add(
  //   normalLocal.mul(sin(time).mul(0.1))
  // );

  material.roughnessNode = float(0.5);
  material.metalnessNode = float(0.5);

  // Create geometry
  const geometry = new THREE.BoxGeometry(1, 1, 1);

  // Create mesh
  const mesh = new THREE.Mesh(geometry, material);
  mesh.position.set(0, 0, 0);
  scene.add(mesh);

  // Optional: Add more objects here
}

function animate(time) {
  // Calculate delta time
  const deltaTime = (time - lastTime) / 1000;
  lastTime = time;

  // Update controls
  controls.update();

  // Update scene objects
  updateScene(deltaTime);

  // Render
  renderer.render(scene, camera);
}

function updateScene(deltaTime) {
  // Update animations and logic here
  // Example:
  // mesh.rotation.y += deltaTime;
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function onKeyDown(event) {
  switch (event.key) {
    case 'Escape':
      // Handle escape key
      break;
    case ' ':
      // Handle space key
      break;
    // Add more key handlers
  }
}

function showError(message) {
  console.error(message);

  const errorDiv = document.createElement('div');
  errorDiv.style.cssText = `
    position: fixed;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    background: rgba(255, 0, 0, 0.9);
    color: white;
    padding: 20px;
    border-radius: 10px;
    font-family: monospace;
    text-align: center;
    z-index: 1000;
  `;
  errorDiv.textContent = message;
  document.body.appendChild(errorDiv);
}

// Start the application
init();
