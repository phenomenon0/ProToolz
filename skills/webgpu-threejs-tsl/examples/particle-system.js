/**
 * GPU Compute Particle System
 * Example showing compute shader-based particle simulation
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

async function init() {
  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000020);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 5;

  const renderer = new WebGPURenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  await renderer.init();

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Particle configuration
  const particleCount = 10000;

  // Initialize particle data
  const positionsArray = new Float32Array(particleCount * 3);
  const velocitiesArray = new Float32Array(particleCount * 3);
  const colorsArray = new Float32Array(particleCount * 3);

  for (let i = 0; i < particleCount; i++) {
    // Random sphere distribution
    const radius = Math.random() * 2;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;

    positionsArray[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
    positionsArray[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    positionsArray[i * 3 + 2] = radius * Math.cos(phi);

    // Random velocities
    velocitiesArray[i * 3 + 0] = (Math.random() - 0.5) * 0.5;
    velocitiesArray[i * 3 + 1] = (Math.random() - 0.5) * 0.5;
    velocitiesArray[i * 3 + 2] = (Math.random() - 0.5) * 0.5;

    // Random colors
    colorsArray[i * 3 + 0] = Math.random();
    colorsArray[i * 3 + 1] = Math.random();
    colorsArray[i * 3 + 2] = Math.random();
  }

  // Create compute shader for particle update
  const updateParticles = compute({
    workgroupSize: [256],
    layout: {
      positions: storage(positionsArray, 'vec3', particleCount),
      velocities: storage(velocitiesArray, 'vec3', particleCount),
      deltaTime: uniform(0),
      attractorPosition: uniform(new THREE.Vector3(0, 0, 0)),
      attractorStrength: uniform(5.0),
      damping: uniform(0.98)
    },
    compute: ({
      positions,
      velocities,
      deltaTime,
      attractorPosition,
      attractorStrength,
      damping,
      instanceIndex
    }) => {
      // Get current particle data
      const pos = positions.element(instanceIndex);
      const vel = velocities.element(instanceIndex);

      // Calculate direction to attractor
      const toAttractor = attractorPosition.sub(pos);
      const dist = length(toAttractor);
      const direction = normalize(toAttractor);

      // Apply attraction force (inverse square law with minimum distance)
      const force = direction.mul(
        attractorStrength.div(dist.mul(dist).add(0.1))
      );

      // Update velocity
      const newVel = vel.add(force.mul(deltaTime)).mul(damping);
      velocities.element(instanceIndex).assign(newVel);

      // Update position
      const newPos = pos.add(newVel.mul(deltaTime));
      positions.element(instanceIndex).assign(newPos);

      // Boundary collision (sphere)
      const boundaryRadius = 10.0;
      const posLength = length(newPos);

      If(posLength.greaterThan(boundaryRadius), () => {
        // Reflect off boundary
        const normalizedPos = normalize(newPos);
        const reflectedVel = vel.sub(
          normalizedPos.mul(vel.dot(normalizedPos).mul(2))
        ).mul(0.8);

        velocities.element(instanceIndex).assign(reflectedVel);
        positions.element(instanceIndex).assign(
          normalizedPos.mul(boundaryRadius)
        );
      });
    }
  });

  // Create particle geometry
  const particleGeometry = new THREE.BufferGeometry();
  particleGeometry.setAttribute(
    'position',
    new THREE.BufferAttribute(positionsArray, 3)
  );
  particleGeometry.setAttribute(
    'color',
    new THREE.BufferAttribute(colorsArray, 3)
  );

  // Create particle material
  const particleMaterial = new THREE.PointsMaterial({
    size: 0.05,
    vertexColors: true,
    blending: THREE.AdditiveBlending,
    transparent: true,
    opacity: 0.8
  });

  // Create particle system
  const particles = new THREE.Points(particleGeometry, particleMaterial);
  scene.add(particles);

  // Create attractor visualization
  const attractorGeometry = new THREE.SphereGeometry(0.2, 32, 32);
  const attractorMaterial = new THREE.MeshBasicMaterial({
    color: 0xff0000,
    transparent: true,
    opacity: 0.5
  });
  const attractor = new THREE.Mesh(attractorGeometry, attractorMaterial);
  scene.add(attractor);

  // Mouse interaction
  const mouse = new THREE.Vector2();
  const raycaster = new THREE.Raycaster();

  window.addEventListener('mousemove', (event) => {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
  });

  // Window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Animation loop
  let lastTime = 0;

  function animate(time) {
    const deltaTime = Math.min((time - lastTime) / 1000, 0.1); // Max 0.1s
    lastTime = time;

    controls.update();

    // Update attractor position based on mouse
    raycaster.setFromCamera(mouse, camera);
    const distance = 5;
    const attractorPos = raycaster.ray.origin.clone()
      .add(raycaster.ray.direction.multiplyScalar(distance));

    attractor.position.copy(attractorPos);

    // Update compute shader uniforms
    updateParticles.layout.deltaTime.value = deltaTime;
    updateParticles.layout.attractorPosition.value.copy(attractorPos);

    // Execute compute shader
    renderer.computeAsync(updateParticles).then(() => {
      // Update particle positions
      particleGeometry.attributes.position.needsUpdate = true;

      // Render scene
      renderer.render(scene, camera);
    });
  }

  renderer.setAnimationLoop(animate);
}

// Start
if (!navigator.gpu) {
  alert('WebGPU is not supported in your browser');
} else {
  init();
}
