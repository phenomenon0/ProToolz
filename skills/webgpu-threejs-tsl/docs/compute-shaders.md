# Compute Shaders with WebGPU

Compute shaders allow GPU-accelerated computations outside of the rendering pipeline. They're perfect for particle systems, physics simulations, procedural generation, and data processing.

## Basics

### Simple Compute Shader

```javascript
import { compute, storage, uniform, storageObject } from 'three/tsl';
import WebGPURenderer from 'three/webgpu';

// Create storage buffer
const dataSize = 1024;
const dataArray = new Float32Array(dataSize);

// Define compute shader
const computeShader = compute({
  workgroupSize: [256], // Threads per workgroup
  layout: {
    data: storage(dataArray, 'float', dataSize),
    multiplier: uniform(2.0)
  },
  compute: ({ data, multiplier, instanceIndex }) => {
    // GPU computation
    const value = data.element(instanceIndex);
    data.element(instanceIndex).assign(value.mul(multiplier));
  }
});

// Execute compute shader
await renderer.computeAsync(computeShader);

// Read results back to CPU
const results = await renderer.readStorageAsync(dataArray);
```

## Workgroup Configuration

### Workgroup Size

Workgroups define how threads are organized:

```javascript
// 1D workgroup (e.g., for arrays)
workgroupSize: [256]

// 2D workgroup (e.g., for images)
workgroupSize: [16, 16]

// 3D workgroup (e.g., for volumes)
workgroupSize: [8, 8, 8]
```

**Best Practices:**
- Use multiples of 64 (most hardware optimal)
- Common sizes: 64, 128, 256
- Maximum size depends on hardware (usually 256 or 1024)

### Thread Indices

```javascript
compute: ({ instanceIndex, workgroupIndex, localIndex }) => {
  // instanceIndex: Global thread index
  // workgroupIndex: Index of current workgroup
  // localIndex: Thread index within workgroup

  // Example: 1D computation
  const globalId = instanceIndex; // 0, 1, 2, 3, ...

  // Example: 2D computation
  const x = instanceIndex.modInt(256); // X coordinate
  const y = instanceIndex.div(256);     // Y coordinate
}
```

## Storage Buffers

Storage buffers hold data accessible by compute shaders:

### Creating Storage Buffers

```javascript
import { storage } from 'three/tsl';

// Single type buffer
const positions = storage(
  new Float32Array(particleCount * 3),
  'vec3',
  particleCount
);

const velocities = storage(
  new Float32Array(particleCount * 3),
  'vec3',
  particleCount
);

const colors = storage(
  new Float32Array(particleCount * 4),
  'vec4',
  particleCount
);
```

### Accessing Storage Elements

```javascript
compute: ({ positions, velocities, instanceIndex }) => {
  // Read element
  const position = positions.element(instanceIndex);
  const velocity = velocities.element(instanceIndex);

  // Write element
  positions.element(instanceIndex).assign(
    position.add(velocity)
  );

  // Modify in place
  velocities.element(instanceIndex).addAssign(
    vec3(0, -9.8, 0).mul(deltaTime)
  );
}
```

### Storage Object (Structured Data)

```javascript
import { storageObject } from 'three/tsl';

// Define structure
const particleData = storageObject({
  position: vec3(),
  velocity: vec3(),
  life: float(),
  mass: float()
});

// Use in compute shader
const particles = storage(particleData, particleCount);

compute: ({ particles, instanceIndex }) => {
  const particle = particles.element(instanceIndex);

  // Access fields
  const pos = particle.position;
  const vel = particle.velocity;

  // Update fields
  particle.position.assign(pos.add(vel));
  particle.life.subAssign(deltaTime);
}
```

## Particle Systems

### Basic Particle System

```javascript
import { compute, storage, uniform } from 'three/tsl';

const particleCount = 10000;

// Create buffers
const positions = new Float32Array(particleCount * 3);
const velocities = new Float32Array(particleCount * 3);

// Initialize particles
for (let i = 0; i < particleCount; i++) {
  positions[i * 3 + 0] = Math.random() * 10 - 5;
  positions[i * 3 + 1] = Math.random() * 10 - 5;
  positions[i * 3 + 2] = Math.random() * 10 - 5;

  velocities[i * 3 + 0] = Math.random() * 2 - 1;
  velocities[i * 3 + 1] = Math.random() * 2 - 1;
  velocities[i * 3 + 2] = Math.random() * 2 - 1;
}

// Compute shader
const updateParticles = compute({
  workgroupSize: [256],
  layout: {
    positions: storage(positions, 'vec3', particleCount),
    velocities: storage(velocities, 'vec3', particleCount),
    deltaTime: uniform(0),
    gravity: uniform(new THREE.Vector3(0, -9.8, 0))
  },
  compute: ({ positions, velocities, deltaTime, gravity, instanceIndex }) => {
    const pos = positions.element(instanceIndex);
    const vel = velocities.element(instanceIndex);

    // Apply gravity
    velocities.element(instanceIndex).assign(
      vel.add(gravity.mul(deltaTime))
    );

    // Update position
    positions.element(instanceIndex).assign(
      pos.add(vel.mul(deltaTime))
    );

    // Bounce off ground
    const newPos = pos.add(vel.mul(deltaTime));
    const bounced = If(
      newPos.y.lessThan(0),
      vec3(newPos.x, abs(newPos.y), newPos.z),
      newPos
    );
    positions.element(instanceIndex).assign(bounced);

    // Invert velocity if bounced
    const bouncedVel = If(
      newPos.y.lessThan(0),
      vec3(vel.x, vel.y.negate().mul(0.8), vel.z),
      vel
    );
    velocities.element(instanceIndex).assign(bouncedVel);
  }
});

// Animation loop
function animate(time) {
  const deltaTime = time - lastTime;
  lastTime = time;

  // Update compute shader uniforms
  updateParticles.layout.deltaTime.value = deltaTime / 1000;

  // Execute compute shader
  renderer.computeAsync(updateParticles).then(() => {
    renderer.render(scene, camera);
  });
}
renderer.setAnimationLoop(animate);
```

### Particle Attraction

```javascript
const attractionPoint = uniform(new THREE.Vector3(0, 0, 0));

compute: ({ positions, velocities, attractionPoint, instanceIndex }) => {
  const pos = positions.element(instanceIndex);
  const vel = velocities.element(instanceIndex);

  // Calculate direction to attraction point
  const toAttractor = attractionPoint.sub(pos);
  const distance = length(toAttractor);
  const direction = normalize(toAttractor);

  // Apply force (inverse square law)
  const force = direction.mul(float(100).div(distance.mul(distance).add(1)));

  // Update velocity
  velocities.element(instanceIndex).assign(
    vel.add(force.mul(deltaTime))
  );

  // Update position
  positions.element(instanceIndex).assign(
    pos.add(vel.mul(deltaTime))
  );
}
```

### Particle Collisions

```javascript
const radius = uniform(0.1);

compute: ({ positions, velocities, radius, instanceIndex }) => {
  const pos = positions.element(instanceIndex);
  const vel = velocities.element(instanceIndex);

  // Check collision with other particles (simplified)
  // Note: For real collision detection, use spatial hashing

  // Boundary collision
  const bounds = vec3(10, 10, 10);

  // X bounds
  const xCollide = pos.x.abs().greaterThan(bounds.x);
  const newVelX = If(xCollide, vel.x.negate().mul(0.9), vel.x);

  // Y bounds
  const yCollide = pos.y.abs().greaterThan(bounds.y);
  const newVelY = If(yCollide, vel.y.negate().mul(0.9), vel.y);

  // Z bounds
  const zCollide = pos.z.abs().greaterThan(bounds.z);
  const newVelZ = If(zCollide, vel.z.negate().mul(0.9), vel.z);

  velocities.element(instanceIndex).assign(
    vec3(newVelX, newVelY, newVelZ)
  );
}
```

## Physics Simulations

### Cloth Simulation

```javascript
const gridSize = 32;
const particleCount = gridSize * gridSize;

const updateCloth = compute({
  workgroupSize: [16, 16],
  layout: {
    positions: storage(posArray, 'vec3', particleCount),
    prevPositions: storage(prevArray, 'vec3', particleCount),
    velocities: storage(velArray, 'vec3', particleCount),
    deltaTime: uniform(0),
    gridSize: uniform(gridSize)
  },
  compute: ({ positions, prevPositions, velocities, deltaTime, gridSize, instanceIndex }) => {
    const x = instanceIndex.modInt(gridSize);
    const y = instanceIndex.div(gridSize);

    // Skip fixed points (top row)
    const isFixed = y.equal(0);

    If(isFixed.not(), () => {
      const idx = instanceIndex;
      const pos = positions.element(idx);
      const prevPos = prevPositions.element(idx);
      const vel = velocities.element(idx);

      // Verlet integration
      const gravity = vec3(0, -9.8, 0);
      const newPos = pos.add(pos.sub(prevPos)).add(gravity.mul(deltaTime.mul(deltaTime)));

      // Update positions
      prevPositions.element(idx).assign(pos);
      positions.element(idx).assign(newPos);

      // Apply constraints (springs to neighbors)
      // ... constraint solving code
    });
  }
});
```

### Fluid Simulation (SPH)

```javascript
const updateFluid = compute({
  workgroupSize: [256],
  layout: {
    positions: storage(posArray, 'vec3', particleCount),
    velocities: storage(velArray, 'vec3', particleCount),
    densities: storage(densityArray, 'float', particleCount),
    pressures: storage(pressureArray, 'float', particleCount),
    deltaTime: uniform(0)
  },
  compute: ({ positions, velocities, densities, pressures, deltaTime, instanceIndex }) => {
    const pos = positions.element(instanceIndex);
    const vel = velocities.element(instanceIndex);

    // Calculate density
    let density = float(0);
    // Loop through neighbors...

    // Calculate pressure
    const pressure = density.sub(restDensity).mul(stiffness);

    // Apply pressure force
    let pressureForce = vec3(0, 0, 0);
    // Loop through neighbors...

    // Update velocity
    const newVel = vel.add(pressureForce.mul(deltaTime));
    velocities.element(instanceIndex).assign(newVel);

    // Update position
    positions.element(instanceIndex).assign(
      pos.add(newVel.mul(deltaTime))
    );
  }
});
```

## Procedural Generation

### Noise Generation

```javascript
import { wgslFn } from 'three/tsl';

// Define noise function in WGSL
const noiseFunction = wgslFn(`
  fn hash(p: vec3f) -> f32 {
    let p3 = fract(p * 0.1031);
    let p3dot = dot(p3, vec3f(p3.y + 33.33, p3.z + 33.33, p3.x + 33.33));
    let p3result = p3 + p3dot;
    return fract((p3result.x + p3result.y) * p3result.z);
  }

  fn noise(p: vec3f) -> f32 {
    let i = floor(p);
    let f = fract(p);
    let u = f * f * (3.0 - 2.0 * f);

    return mix(
      mix(mix(hash(i + vec3f(0,0,0)), hash(i + vec3f(1,0,0)), u.x),
          mix(hash(i + vec3f(0,1,0)), hash(i + vec3f(1,1,0)), u.x), u.y),
      mix(mix(hash(i + vec3f(0,0,1)), hash(i + vec3f(1,0,1)), u.x),
          mix(hash(i + vec3f(0,1,1)), hash(i + vec3f(1,1,1)), u.x), u.y),
      u.z
    );
  }
`);

const generateTerrain = compute({
  workgroupSize: [16, 16],
  layout: {
    heights: storage(heightArray, 'float', width * height),
    width: uniform(width),
    scale: uniform(10)
  },
  compute: ({ heights, width, scale, instanceIndex }) => {
    const x = instanceIndex.modInt(width);
    const y = instanceIndex.div(width);

    const worldPos = vec3(x, y, 0).div(scale);
    const height = noiseFunction(worldPos);

    heights.element(instanceIndex).assign(height);
  }
});
```

### Mesh Generation

```javascript
const generateMesh = compute({
  workgroupSize: [256],
  layout: {
    positions: storage(posArray, 'vec3', vertexCount),
    normals: storage(normalArray, 'vec3', vertexCount),
    uvs: storage(uvArray, 'vec2', vertexCount)
  },
  compute: ({ positions, normals, uvs, instanceIndex }) => {
    // Generate sphere mesh
    const theta = instanceIndex.div(vertexCount).mul(Math.PI * 2);
    const phi = instanceIndex.modInt(16).div(16).mul(Math.PI);

    const x = sin(phi).mul(cos(theta));
    const y = sin(phi).mul(sin(theta));
    const z = cos(phi);

    positions.element(instanceIndex).assign(vec3(x, y, z));
    normals.element(instanceIndex).assign(normalize(vec3(x, y, z)));
    uvs.element(instanceIndex).assign(vec2(
      theta.div(Math.PI * 2),
      phi.div(Math.PI)
    ));
  }
});
```

## Data Processing

### Image Processing

```javascript
const processImage = compute({
  workgroupSize: [16, 16],
  layout: {
    input: storage(inputData, 'vec4', width * height),
    output: storage(outputData, 'vec4', width * height),
    width: uniform(width),
    height: uniform(height)
  },
  compute: ({ input, output, width, height, instanceIndex }) => {
    const x = instanceIndex.modInt(width);
    const y = instanceIndex.div(width);

    // Blur kernel
    let sum = vec4(0, 0, 0, 0);
    let count = 0;

    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        const nx = x.add(dx);
        const ny = y.add(dy);

        const inBounds = nx.greaterThanEqual(0)
          .and(nx.lessThan(width))
          .and(ny.greaterThanEqual(0))
          .and(ny.lessThan(height));

        If(inBounds, () => {
          const idx = ny.mul(width).add(nx);
          sum.addAssign(input.element(idx));
          count++;
        });
      }
    }

    output.element(instanceIndex).assign(sum.div(count));
  }
});
```

### Sorting (Bitonic Sort)

```javascript
const bitonicSort = compute({
  workgroupSize: [256],
  layout: {
    data: storage(dataArray, 'float', dataSize),
    step: uniform(1),
    stage: uniform(0)
  },
  compute: ({ data, step, stage, instanceIndex }) => {
    const ixj = instanceIndex.xor(step);

    If(ixj.greaterThan(instanceIndex), () => {
      const a = data.element(instanceIndex);
      const b = data.element(ixj);

      const ascending = instanceIndex.and(stage).equal(0);
      const swap = ascending.and(a.greaterThan(b))
        .or(ascending.not().and(a.lessThan(b)));

      If(swap, () => {
        data.element(instanceIndex).assign(b);
        data.element(ixj).assign(a);
      });
    });
  }
});

// Execute multiple passes
async function sort(array) {
  const n = array.length;
  for (let stage = 2; stage <= n; stage *= 2) {
    for (let step = stage / 2; step > 0; step /= 2) {
      bitonicSort.layout.stage.value = stage;
      bitonicSort.layout.step.value = step;
      await renderer.computeAsync(bitonicSort);
    }
  }
}
```

## Performance Optimization

### Workgroup Sizing

```javascript
// Get device limits
const limits = await renderer.getContext().limits;
console.log('Max workgroup size:', limits.maxComputeWorkgroupSizeX);
console.log('Max invocations per workgroup:', limits.maxComputeInvocationsPerWorkgroup);

// Choose optimal size
const optimalSize = Math.min(256, limits.maxComputeWorkgroupSizeX);
```

### Shared Memory (Workgroup Memory)

```javascript
// TODO: Implement when Three.js adds support for workgroup shared memory
// Shared memory allows fast communication between threads in a workgroup
```

### Batch Processing

```javascript
// Process data in batches to avoid timeouts
async function processBatches(totalCount, batchSize) {
  for (let offset = 0; offset < totalCount; offset += batchSize) {
    computeShader.layout.offset.value = offset;
    computeShader.layout.count.value = Math.min(batchSize, totalCount - offset);
    await renderer.computeAsync(computeShader);
  }
}
```

### Double Buffering

```javascript
// Use two buffers to avoid read/write conflicts
let currentBuffer = 0;
const buffers = [
  storage(data1, 'vec3', count),
  storage(data2, 'vec3', count)
];

function update() {
  const input = buffers[currentBuffer];
  const output = buffers[1 - currentBuffer];

  computeShader.layout.input = input;
  computeShader.layout.output = output;

  renderer.computeAsync(computeShader);
  currentBuffer = 1 - currentBuffer;
}
```

## Debugging

### Reading Results

```javascript
// Read storage buffer back to CPU
const results = await renderer.readStorageAsync(storageBuffer);
console.log('Results:', results);

// Read specific range
const partial = await renderer.readStorageAsync(storageBuffer, 0, 100);
```

### Performance Profiling

```javascript
// Use browser DevTools timeline
// Chrome: chrome://gpu
// Look for "Compute" entries in timeline

// Measure execution time
const startTime = performance.now();
await renderer.computeAsync(computeShader);
const endTime = performance.now();
console.log('Compute time:', endTime - startTime, 'ms');
```

### Error Handling

```javascript
try {
  await renderer.computeAsync(computeShader);
} catch (error) {
  console.error('Compute shader error:', error);

  // Check for common issues:
  // - Workgroup size too large
  // - Buffer out of bounds
  // - Invalid buffer format
}
```

## Best Practices

1. **Use appropriate workgroup sizes** - Multiples of 64 are optimal
2. **Minimize data transfer** - Keep data on GPU when possible
3. **Use double buffering** - Avoid read/write conflicts
4. **Batch large operations** - Prevent browser timeouts
5. **Profile performance** - Use browser DevTools
6. **Handle edge cases** - Check array bounds
7. **Reuse compute shaders** - Don't recreate every frame
8. **Optimize memory layout** - Use structured buffers efficiently
