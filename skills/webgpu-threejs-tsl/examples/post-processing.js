/**
 * Post Processing Effects
 * Example showing various post-processing effects with TSL
 */

import * as THREE from 'three';
import WebGPURenderer from 'three/webgpu';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls';
import {
  PostProcessing,
  pass,
  uv,
  length,
  float,
  vec2,
  vec3,
  vec4,
  uniform,
  mix,
  sin,
  timerLocal
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
  camera.position.z = 5;

  const renderer = new WebGPURenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(window.devicePixelRatio);
  document.body.appendChild(renderer.domElement);

  await renderer.init();

  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = true;

  // Create scene content
  const lights = createLights();
  lights.forEach(light => scene.add(light));

  const objects = createObjects();
  objects.forEach(obj => scene.add(obj));

  // Create post processing
  const postProcessing = new PostProcessing(renderer);

  // Get scene pass
  const scenePass = pass(scene, camera);

  // Effect toggles
  const effects = {
    none: false,
    bloom: true,
    vignette: false,
    chromaticAberration: false,
    filmGrain: false,
    colorGrading: false,
    glitch: false,
    custom: false
  };

  // Custom effect parameters
  const vignetteStrength = uniform(0.5);
  const chromaticAberrationStrength = uniform(0.002);
  const filmGrainStrength = uniform(0.1);

  // Build effect chain
  function buildEffects() {
    let output = scenePass;

    if (effects.none) {
      postProcessing.outputNode = scenePass;
      return;
    }

    // Bloom effect
    if (effects.bloom) {
      output = output.bloom({
        intensity: 0.5,
        threshold: 0.8,
        radius: 1.0
      });
    }

    // Vignette effect
    if (effects.vignette) {
      const uvCoord = uv();
      const distFromCenter = length(uvCoord.sub(0.5));
      const vignette = float(1).sub(distFromCenter.mul(vignetteStrength));
      output = output.mul(vignette);
    }

    // Chromatic aberration
    if (effects.chromaticAberration) {
      const uvCoord = uv();
      const strength = chromaticAberrationStrength;

      // Offset each color channel
      const rOffset = vec2(strength, 0);
      const bOffset = vec2(strength.negate(), 0);

      const r = output.getTextureNode(uvCoord.add(rOffset)).r;
      const g = output.g;
      const b = output.getTextureNode(uvCoord.add(bOffset)).b;

      output = vec4(r, g, b, output.a);
    }

    // Film grain
    if (effects.filmGrain) {
      const uvCoord = uv();
      const time = timerLocal();

      // Simple random noise
      const noise = sin(
        uvCoord.x.mul(12.9898).add(uvCoord.y.mul(78.233)).add(time)
      ).mul(43758.5453).fract();

      const grain = noise.mul(filmGrainStrength);
      output = output.add(grain);
    }

    // Color grading
    if (effects.colorGrading) {
      output = output
        .saturation(1.2)
        .contrast(1.1)
        .brightness(1.05);
    }

    // Glitch effect
    if (effects.glitch) {
      const time = timerLocal();
      const uvCoord = uv();

      // Random glitch lines
      const glitchLine = uvCoord.y.mul(100).add(time.mul(10)).floor();
      const glitchRandom = sin(glitchLine).mul(43758.5453).fract();

      // Apply horizontal offset to random lines
      const shouldGlitch = glitchRandom.greaterThan(0.98);
      const offset = shouldGlitch.ternary(
        vec2(glitchRandom.mul(0.02), 0),
        vec2(0, 0)
      );

      output = output.getTextureNode(uvCoord.add(offset));
    }

    // Custom composite effect
    if (effects.custom) {
      // Combine vignette + color shift
      const uvCoord = uv();
      const center = vec2(0.5, 0.5);
      const dist = length(uvCoord.sub(center));

      // Radial color shift
      const shift = sin(dist.mul(10).sub(timerLocal())).mul(0.1);
      const shiftedColor = output.rgb.mul(
        vec3(
          float(1).add(shift),
          float(1),
          float(1).sub(shift)
        )
      );

      output = vec4(shiftedColor, output.a);
    }

    postProcessing.outputNode = output;
  }

  // Initial build
  buildEffects();

  // UI Controls
  const gui = createGUI(effects, () => buildEffects());

  // Window resize
  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
  });

  // Animation loop
  function animate() {
    controls.update();

    // Animate objects
    objects.forEach((obj, i) => {
      obj.rotation.x += 0.005 * (i + 1);
      obj.rotation.y += 0.008 * (i + 1);
    });

    // Render with post processing
    postProcessing.render();
  }

  renderer.setAnimationLoop(animate);
}

function createLights() {
  const ambientLight = new THREE.AmbientLight(0xffffff, 0.3);

  const directionalLight1 = new THREE.DirectionalLight(0xff6b6b, 1);
  directionalLight1.position.set(5, 5, 5);

  const directionalLight2 = new THREE.DirectionalLight(0x4ecdc4, 0.5);
  directionalLight2.position.set(-5, -5, -5);

  return [ambientLight, directionalLight1, directionalLight2];
}

function createObjects() {
  const objects = [];

  // Torus
  const torus = new THREE.Mesh(
    new THREE.TorusGeometry(0.7, 0.3, 32, 64),
    new THREE.MeshStandardMaterial({
      color: 0xff6b6b,
      roughness: 0.2,
      metalness: 0.8,
      emissive: 0xff6b6b,
      emissiveIntensity: 0.2
    })
  );
  torus.position.x = -2;
  objects.push(torus);

  // Sphere
  const sphere = new THREE.Mesh(
    new THREE.SphereGeometry(0.8, 64, 64),
    new THREE.MeshStandardMaterial({
      color: 0x4ecdc4,
      roughness: 0.3,
      metalness: 0.7,
      emissive: 0x4ecdc4,
      emissiveIntensity: 0.2
    })
  );
  sphere.position.x = 0;
  objects.push(sphere);

  // Box
  const box = new THREE.Mesh(
    new THREE.BoxGeometry(1, 1, 1),
    new THREE.MeshStandardMaterial({
      color: 0xffe66d,
      roughness: 0.4,
      metalness: 0.6,
      emissive: 0xffe66d,
      emissiveIntensity: 0.2
    })
  );
  box.position.x = 2;
  objects.push(box);

  return objects;
}

function createGUI(effects, onChange) {
  const container = document.createElement('div');
  container.style.position = 'absolute';
  container.style.top = '20px';
  container.style.right = '20px';
  container.style.background = 'rgba(0, 0, 0, 0.7)';
  container.style.padding = '20px';
  container.style.borderRadius = '10px';
  container.style.color = 'white';
  container.style.fontFamily = 'monospace';
  document.body.appendChild(container);

  const title = document.createElement('h3');
  title.textContent = 'Post Processing Effects';
  title.style.margin = '0 0 15px 0';
  container.appendChild(title);

  Object.keys(effects).forEach(key => {
    const label = document.createElement('label');
    label.style.display = 'block';
    label.style.marginBottom = '8px';
    label.style.cursor = 'pointer';

    const checkbox = document.createElement('input');
    checkbox.type = 'checkbox';
    checkbox.checked = effects[key];
    checkbox.style.marginRight = '10px';
    checkbox.addEventListener('change', (e) => {
      // If 'none' is checked, uncheck all others
      if (key === 'none' && e.target.checked) {
        Object.keys(effects).forEach(k => {
          effects[k] = k === 'none';
        });
        // Update all checkboxes
        const checkboxes = container.querySelectorAll('input[type="checkbox"]');
        checkboxes.forEach((cb, i) => {
          cb.checked = Object.keys(effects)[i] === 'none';
        });
      } else {
        effects[key] = e.target.checked;
        if (key !== 'none' && e.target.checked) {
          effects.none = false;
          const noneCheckbox = container.querySelector('input[type="checkbox"]');
          if (noneCheckbox) noneCheckbox.checked = false;
        }
      }
      onChange();
    });

    label.appendChild(checkbox);
    label.appendChild(document.createTextNode(key.charAt(0).toUpperCase() + key.slice(1)));
    container.appendChild(label);
  });

  return container;
}

// Start
if (!navigator.gpu) {
  alert('WebGPU is not supported in your browser');
} else {
  init();
}
