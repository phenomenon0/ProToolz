/**
 * Compute Shader Template
 * Template for GPU compute-based simulations and calculations
 */

import * as THREE from 'three';
import WebGPURenderer from 'three/webgpu';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {
  compute,
  storage,
  uniform,
  vec3,
  float,
  If,
  length,
  normalize
} from 'three/tsl';

// Configuration
const CONFIG = {
  particleCount: 10000,
  workgroupSize: 256,
  antialias: true,
  background: 0x000020
};

// State
let renderer, scene, camera, controls;
let computeShader, particleGeometry;
let lastTime = 0;

async function init() {
  // Check WebGPU support
  if (!navigator.gpu) {
    console.error('WebGPU is not supported in your browser');
    return;
  }

  try {
    // Create scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(CONFIG.background);

    // Create camera
    camera = new THREE.PerspectiveCamera(
      75,
      window.innerWidth / window.innerHeight,
      0.1,
      1000
    );
    camera.position.z = 5;

    // Create renderer
    renderer = new WebGPURenderer({ antialias: CONFIG.antialias });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    document.body.appendChild(renderer.domElement);

    // Initialize WebGPU
    await renderer.init();
    console.log('WebGPU initialized successfully');

    // Add controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;

    // Setup compute shader
    await setupCompute();

    // Setup visualization
    setupVisualization();

    // Event listeners
    window.addEventListener('resize', onWindowResize);

    // Start animation loop
    renderer.setAnimationLoop(animate);

  } catch (error) {
    console.error('Initialization failed:', error);
  }
}

async function setupCompute() {
  const count = CONFIG.particleCount;

  // Create data buffers
  const positionsArray = new Float32Array(count * 3);
  const velocitiesArray = new Float32Array(count * 3);
  const dataArray = new Float32Array(count); // Additional data

  // Initialize data
  for (let i = 0; i < count; i++) {
    // Initialize positions (example: random sphere)
    const radius = Math.random() * 2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;

    positionsArray[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
    positionsArray[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positionsArray[i * 3 + 2] = radius * Math.cos(phi);

    // Initialize velocities
    velocitiesArray[i * 3 + 0] = (Math.random() - 0.5) * 0.1;
    velocitiesArray[i * 3 + 1] = (Math.random() - 0.5) * 0.1;
    velocitiesArray[i * 3 + 2] = (Math.random() - 0.5) * 0.1;

    // Initialize additional data
    dataArray[i] = Math.random();
  }

  // Create compute shader
  computeShader = compute({
    workgroupSize: [CONFIG.workgroupSize],
    layout: {
      positions: storage(positionsArray, 'vec3', count),
      velocities: storage(velocitiesArray, 'vec3', count),
      data: storage(dataArray, 'float', count),
      deltaTime: uniform(0),
      time: uniform(0),
      // Add more uniforms as needed
      param1: uniform(1.0),
      param2: uniform(new THREE.Vector3(0, 0, 0))
    },
    compute: ({
      positions,
      velocities,
      data,
      deltaTime,
      time,
      param1,
      param2,
      instanceIndex
    }) => {
      // Get current values
      const pos = positions.element(instanceIndex);
      const vel = velocities.element(instanceIndex);
      const dat = data.element(instanceIndex);

      // ==================================================
      // YOUR COMPUTE LOGIC HERE
      // ==================================================

      // Example: Simple physics simulation
      const gravity = vec3(0, -0.5, 0);
      const newVel = vel.add(gravity.mul(deltaTime));

      // Update velocity
      velocities.element(instanceIndex).assign(newVel);

      // Update position
      const newPos = pos.add(newVel.mul(deltaTime));
      positions.element(instanceIndex).assign(newPos);

      // Example: Boundary conditions
      const bounds = 5.0;
      If(newPos.y.lessThan(-bounds), () => {
        // Reset to top
        positions.element(instanceIndex).assign(
          vec3(newPos.x, bounds, newPos.z)
        );
      });

      // Update additional data
      // data.element(instanceIndex).assign(dat.add(deltaTime));

      // ==================================================
    }
  });

  // Store reference to position buffer for visualization
  window.computePositions = positionsArray;
}

function setupVisualization() {
  // Create geometry for particles
  particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(window.computePositions, 3)
  );

  // Create material
  const particleMaterial = new THREE.PointsMaterial({
    size: 0.05,
    color: 0x00ffff,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.8
  });

  // Create particle system
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  // Optional: Add reference grid
  const gridHelper = new THREE.GridHelper(10, 10);
  gridHelper.material.opacity = 0.2;
  gridHelper.material.transparent = true;
  scene.add(gridHelper);
}

async function animate(time) {
  // Calculate delta time
  const deltaTime = Math.min((time - lastTime) / 1000, 0.1); // Cap at 0.1s
  lastTime = time;

  // Update controls
  controls.update();

  // Update compute shader uniforms
  computeShader.layout.deltaTime.value = deltaTime;
  computeShader.layout.time.value = time / 1000;

  // Execute compute shader
  await renderer.computeAsync(computeShader);

  // Update visualization
  particleGeometry.attributes.position.needsUpdate = true;

  // Render scene
  renderer.render(scene, camera);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Utility: Read compute results back to CPU
async function readComputeResults() {
  const positions = await renderer.readStorageAsync(
    computeShader.layout.positions.value
  );
  console.log('Compute results:', positions);
  return positions;
}

// Utility: Reset simulation
function resetSimulation() {
  // Re-initialize data and restart
  setupCompute().then(() => {
    console.log('Simulation reset');
  });
}

// Start the application
init();

// Expose utilities to window for debugging
window.readComputeResults = readComputeResults;
window.resetSimulation = resetSimulation;
