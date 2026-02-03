/**
 * Custom Material with TSL
 * Example showing various TSL node material techniques
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
  timerLocal,
  sin,
  cos,
  mix,
  texture,
  normalMap
} from 'three/tsl';

async function init() {
  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x1a1a2e);

  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000
  );
  camera.position.z = 3;

  const renderer = new WebGPURenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  await renderer.init();

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Lights
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);
  scene.add(ambientLight);

  const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  directionalLight.position.set(5, 5, 5);
  scene.add(directionalLight);

  // Example 1: Gradient Material
  const gradientMaterial = new MeshStandardNodeMaterial();

  // Create color gradient based on Y position
  const gradient = positionLocal.y.add(1).div(2); // Normalize to 0-1
  gradientMaterial.colorNode = mix(
    color(0.0, 0.2, 0.8), // Blue
    color(1.0, 0.5, 0.0), // Orange
    gradient
  );
  gradientMaterial.roughnessNode = float(0.5);

  const sphere1 = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 64, 64),
    gradientMaterial
  );
  sphere1.position.x = -2;
  scene.add(sphere1);

  // Example 2: Animated Material
  const animatedMaterial = new MeshStandardNodeMaterial();

  // Animated color using time
  const time = timerLocal();
  animatedMaterial.colorNode = color(
    sin(time).mul(0.5).add(0.5),
    cos(time.add(2.094)).mul(0.5).add(0.5), // 2π/3 offset
    sin(time.add(4.189)).mul(0.5).add(0.5)  // 4π/3 offset
  );
  animatedMaterial.roughnessNode = float(0.3);
  animatedMaterial.metalnessNode = float(0.8);

  const sphere2 = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 64, 64),
    animatedMaterial
  );
  sphere2.position.x = 0;
  scene.add(sphere2);

  // Example 3: Vertex Displacement
  const displacedMaterial = new MeshStandardNodeMaterial();

  // Animate vertex positions along normals
  const wave = sin(positionLocal.y.mul(10).add(time.mul(2))).mul(0.1);
  displacedMaterial.positionNode = positionLocal.add(normalLocal.mul(wave));

  // Color based on displacement
  displacedMaterial.colorNode = mix(
    color(0.2, 0.0, 0.8),
    color(0.0, 0.8, 1.0),
    wave.add(0.1).mul(5)
  );
  displacedMaterial.roughnessNode = float(0.4);

  const sphere3 = new THREE.Mesh(
    new THREE.SphereGeometry(0.5, 128, 128),
    displacedMaterial
  );
  sphere3.position.x = 2;
  scene.add(sphere3);

  // Example 4: Pattern Material
  const patternMaterial = new MeshStandardNodeMaterial();

  // Create checkerboard pattern from UVs
  const uvCoord = uv();
  const checker = sin(uvCoord.x.mul(20))
    .mul(sin(uvCoord.y.mul(20)))
    .step(0); // 0 or 1

  patternMaterial.colorNode = mix(
    color(0.1, 0.1, 0.1),
    color(0.9, 0.9, 0.9),
    checker
  );
  patternMaterial.roughnessNode = float(0.6);

  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    patternMaterial
  );
  box.position.y = -1.5;
  scene.add(box);

  // Example 5: Fresnel Effect
  const fresnelMaterial = new MeshStandardNodeMaterial();

  const viewDirection = camera.position
    .clone()
    .sub(new THREE.Vector3())
    .normalize();

  // Note: In real implementation, use cameraPosition and positionWorld from TSL
  // This is simplified for the example
  fresnelMaterial.colorNode = color(0.0, 0.5, 1.0);
  fresnelMaterial.roughnessNode = float(0.1);
  fresnelMaterial.metalnessNode = float(1.0);

  // Add emissive fresnel glow
  const fresnel = float(1).sub(
    // This would use proper view direction in actual implementation
    float(0.5)
  ).pow(3);

  fresnelMaterial.emissiveNode = color(0.0, 0.8, 1.0).mul(fresnel);

  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(0.6, 0.2, 32, 64),
    fresnelMaterial
  );
  torus.position.y = 1.5;
  scene.add(torus);

  // Window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Animation loop
  function animate() {
    controls.update();

    // Rotate objects
    sphere1.rotation.y += 0.005;
    sphere2.rotation.y += 0.01;
    sphere3.rotation.y += 0.008;
    box.rotation.y += 0.003;
    torus.rotation.x += 0.01;
    torus.rotation.y += 0.005;

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);
}

// Start
if (!navigator.gpu) {
  alert('WebGPU is not supported in your browser');
} else {
  init();
}
