/**
 * Earth Shader with Atmosphere
 * Complete example showing realistic Earth rendering with atmosphere
 */

import * as THREE from 'three';
import WebGPURenderer from 'three/webgpu';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {
  MeshStandardNodeMaterial,
  MeshBasicNodeMaterial,
  color,
  vec3,
  vec4,
  float,
  uniform,
  positionLocal,
  positionWorld,
  normalWorld,
  normalLocal,
  uv,
  timerLocal,
  texture,
  normalMap,
  mix,
  pow,
  clamp,
  dot,
  length,
  normalize,
  smoothstep,
  cameraPosition
} from 'three/tsl';

async function init() {
  // Scene setup
  const scene = new THREE.Scene();
  scene.background = new THREE.Color(0x000000);

  const camera = new THREE.PerspectiveCamera(
    45,
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
  controls.dampingFactor = 0.05;
  controls.minDistance = 1.5;
  controls.maxDistance = 5;

  // Load Earth textures
  const textureLoader = new THREE.TextureLoader();

  // Note: You'll need to provide these textures
  const earthDayTexture = textureLoader.load('path/to/earth-day.jpg');
  const earthNightTexture = textureLoader.load('path/to/earth-night.jpg');
  const earthSpecularTexture = textureLoader.load('path/to/earth-specular.jpg');
  const earthCloudsTexture = textureLoader.load('path/to/earth-clouds.jpg');
  const earthNormalTexture = textureLoader.load('path/to/earth-normal.jpg');

  // Alternatively, create procedural textures for demonstration
  const dayTexture = createEarthDayTexture();
  const nightTexture = createEarthNightTexture();

  // Create Earth geometry
  const earthGeometry = new THREE.SphereGeometry(1, 128, 128);

  // Earth material
  const earthMaterial = new MeshStandardNodeMaterial();

  // Sample textures
  const dayColor = texture(dayTexture);
  const nightColor = texture(nightTexture);

  // Calculate lighting
  const lightDirection = normalize(vec3(1, 0.3, 0.5));
  const NdotL = dot(normalWorld, lightDirection);

  // Day/night transition
  const dayNightMix = smoothstep(float(-0.1), float(0.1), NdotL);

  // Combine day and night textures
  earthMaterial.colorNode = mix(nightColor.rgb, dayColor.rgb, dayNightMix);

  // Add atmosphere glow on the day side
  const viewDir = normalize(cameraPosition.sub(positionWorld));
  const fresnel = float(1).sub(abs(dot(viewDir, normalWorld)));
  const atmosphereGlow = pow(fresnel, 3).mul(dayNightMix);

  earthMaterial.emissiveNode = color(0.3, 0.5, 1.0).mul(atmosphereGlow.mul(0.3));

  // Surface properties
  earthMaterial.roughnessNode = float(0.8);
  earthMaterial.metalnessNode = float(0.1);

  const earth = new THREE.Mesh(earthGeometry, earthMaterial);
  scene.add(earth);

  // Create clouds layer
  const cloudsGeometry = new THREE.SphereGeometry(1.01, 128, 128);
  const cloudsMaterial = new MeshBasicNodeMaterial();

  // Procedural clouds (simplified)
  const cloudsTexture = createCloudsTexture();
  const cloudsColor = texture(cloudsTexture);

  cloudsMaterial.colorNode = vec4(vec3(1), cloudsColor.a.mul(0.6));
  cloudsMaterial.transparent = true;
  cloudsMaterial.side = THREE.FrontSide;
  cloudsMaterial.blending = THREE.AdditiveBlending;
  cloudsMaterial.depthWrite = false;

  const clouds = new THREE.Mesh(cloudsGeometry, cloudsMaterial);
  scene.add(clouds);

  // Create atmosphere
  const atmosphereGeometry = new THREE.SphereGeometry(1.1, 64, 64);
  const atmosphereMaterial = new MeshBasicNodeMaterial();

  // Atmosphere shader
  const atmViewDir = normalize(cameraPosition.sub(positionWorld));
  const atmFresnel = float(1).sub(abs(dot(atmViewDir, normalWorld)));
  const atmGlow = pow(atmFresnel, 4);

  // Blue atmosphere color
  const atmColor = color(0.3, 0.6, 1.0);
  atmosphereMaterial.colorNode = vec4(atmColor.rgb, atmGlow.mul(0.8));

  atmosphereMaterial.transparent = true;
  atmosphereMaterial.side = THREE.BackSide;
  atmosphereMaterial.blending = THREE.AdditiveBlending;
  atmosphereMaterial.depthWrite = false;

  const atmosphere = new THREE.Mesh(atmosphereGeometry, atmosphereMaterial);
  scene.add(atmosphere);

  // Add stars
  const starsGeometry = new THREE.BufferGeometry();
  const starCount = 5000;
  const starPositions = new Float32Array(starCount * 3);

  for (let i = 0; i < starCount; i++) {
    const radius = 50;
    const theta = Math.random() * Math.PI * 2;
    const phi = Math.random() * Math.PI;

    starPositions[i * 3 + 0] = radius * Math.sin(phi) * Math.cos(theta);
    starPositions[i * 3 + 1] = radius * Math.sin(phi) * Math.sin(theta);
    starPositions[i * 3 + 2] = radius * Math.cos(phi);
  }

  starsGeometry.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));

  const starsMaterial = new THREE.PointsMaterial({
    color: 0xffffff,
    size: 0.1,
    transparent: true,
    opacity: 0.8
  });

  const stars = new THREE.Points(starsGeometry, starsMaterial);
  scene.add(stars);

  // Lighting
  const sunLight = new THREE.DirectionalLight(0xffffff, 1.5);
  sunLight.position.set(5, 2, 3);
  scene.add(sunLight);

  const ambientLight = new THREE.AmbientLight(0x333333, 0.3);
  scene.add(ambientLight);

  // Window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Animation loop
  function animate() {
    controls.update();

    // Rotate Earth
    earth.rotation.y += 0.001;

    // Rotate clouds slightly faster
    clouds.rotation.y += 0.0012;

    // Slowly rotate stars
    stars.rotation.y += 0.0001;

    renderer.render(scene, camera);
  }

  renderer.setAnimationLoop(animate);
}

// Create procedural Earth day texture
function createEarthDayTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Ocean (blue)
  ctx.fillStyle = '#1e88e5';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Continents (green/brown)
  ctx.fillStyle = '#4caf50';

  // Simplified continent shapes
  const continents = [
    { x: 200, y: 150, r: 150 }, // Africa/Europe
    { x: 450, y: 200, r: 100 }, // Asia
    { x: 750, y: 300, r: 120 }, // Americas
  ];

  continents.forEach(cont => {
    ctx.beginPath();
    ctx.arc(cont.x, cont.y, cont.r, 0, Math.PI * 2);
    ctx.fill();
  });

  // Ice caps (white)
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, 30); // North pole
  ctx.fillRect(0, canvas.height - 30, canvas.width, 30); // South pole

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Create procedural Earth night texture
function createEarthNightTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Dark ocean
  ctx.fillStyle = '#0a0a1e';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // City lights (yellow dots)
  ctx.fillStyle = '#ffeb3b';

  for (let i = 0; i < 1000; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height * 0.6 + canvas.height * 0.2;
    const size = Math.random() * 2 + 1;

    ctx.beginPath();
    ctx.arc(x, y, size, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Create procedural clouds texture
function createCloudsTexture() {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d');

  // Transparent background
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  // Draw clouds (white with varying opacity)
  for (let i = 0; i < 200; i++) {
    const x = Math.random() * canvas.width;
    const y = Math.random() * canvas.height;
    const radius = Math.random() * 50 + 10;
    const opacity = Math.random() * 0.5 + 0.1;

    const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
    gradient.addColorStop(0, `rgba(255, 255, 255, ${opacity})`);
    gradient.addColorStop(1, 'rgba(255, 255, 255, 0)');

    ctx.fillStyle = gradient;
    ctx.beginPath();
    ctx.arc(x, y, radius, 0, Math.PI * 2);
    ctx.fill();
  }

  const texture = new THREE.CanvasTexture(canvas);
  texture.needsUpdate = true;
  return texture;
}

// Start
if (!navigator.gpu) {
  alert('WebGPU is not supported in your browser');
} else {
  init();
}
