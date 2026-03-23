(function () {
  'use strict';

  // ============================================================
  //  Configuration
  // ============================================================
  const CONFIG = {
    GRAVITY: -18,
    DAMPING: 0.97,
    CONSTRAINT_ITERATIONS: 10,
    COLLISION_OFFSET: 0.008,
    TIME_STEP: 1 / 60,
    GROUND_Y: 0.01,
    WIND_STRENGTH: 0,
  };

  // ============================================================
  //  Collision Spheres (mannequin body parts)
  // ============================================================
  const BODY_SPHERES = [
    // Head
    { position: [0, 1.56, 0], radius: 0.13 },
    // Neck
    { position: [0, 1.44, 0], radius: 0.055 },
    // Torso (stacked for smooth coverage)
    { position: [0, 1.32, 0], radius: 0.17 },
    { position: [0, 1.20, 0], radius: 0.185 },
    { position: [0, 1.08, 0], radius: 0.19 },
    { position: [0, 0.96, 0], radius: 0.18 },
    { position: [0, 0.84, 0], radius: 0.16 },
    // Shoulders
    { position: [-0.21, 1.30, 0], radius: 0.065 },
    { position: [0.21, 1.30, 0], radius: 0.065 },
    // Upper arms
    { position: [-0.30, 1.16, 0], radius: 0.05 },
    { position: [0.30, 1.16, 0], radius: 0.05 },
    // Lower arms
    { position: [-0.32, 0.96, 0], radius: 0.042 },
    { position: [0.32, 0.96, 0], radius: 0.042 },
    { position: [-0.32, 0.78, 0], radius: 0.038 },
    { position: [0.32, 0.78, 0], radius: 0.038 },
    // Hands
    { position: [-0.32, 0.66, 0], radius: 0.038 },
    { position: [0.32, 0.66, 0], radius: 0.038 },
    // Hips
    { position: [0, 0.78, 0], radius: 0.145 },
    { position: [-0.09, 0.76, 0], radius: 0.075 },
    { position: [0.09, 0.76, 0], radius: 0.075 },
    // Upper legs
    { position: [-0.09, 0.54, 0], radius: 0.07 },
    { position: [0.09, 0.54, 0], radius: 0.07 },
    { position: [-0.09, 0.38, 0], radius: 0.062 },
    { position: [0.09, 0.38, 0], radius: 0.062 },
    // Lower legs
    { position: [-0.09, 0.20, 0], radius: 0.055 },
    { position: [0.09, 0.20, 0], radius: 0.055 },
    { position: [-0.09, 0.05, 0], radius: 0.05 },
    { position: [0.09, 0.05, 0], radius: 0.05 },
    // Feet
    { position: [-0.09, -0.02, 0], radius: 0.042 },
    { position: [0.09, -0.02, 0], radius: 0.042 },
  ];

  // ============================================================
  //  Cloth Particle (Verlet Integration)
  // ============================================================
  class ClothParticle {
    constructor(x, y, z) {
      this.position = new THREE.Vector3(x, y, z);
      this.previous = new THREE.Vector3(x, y, z);
      this.acceleration = new THREE.Vector3(0, 0, 0);
      this.mass = 1;
      this.invMass = 1;
      this.pinned = false;
    }

    applyForce(fx, fy, fz) {
      this.acceleration.x += fx / this.mass;
      this.acceleration.y += fy / this.mass;
      this.acceleration.z += fz / this.mass;
    }

    update(dt) {
      if (this.pinned) {
        this.acceleration.set(0, 0, 0);
        return;
      }
      const vx = (this.position.x - this.previous.x) * CONFIG.DAMPING;
      const vy = (this.position.y - this.previous.y) * CONFIG.DAMPING;
      const vz = (this.position.z - this.previous.z) * CONFIG.DAMPING;

      this.previous.copy(this.position);

      this.position.x += vx + this.acceleration.x * dt * dt;
      this.position.y += vy + this.acceleration.y * dt * dt;
      this.position.z += vz + this.acceleration.z * dt * dt;

      this.acceleration.set(0, 0, 0);
    }
  }

  // ============================================================
  //  Cloth Constraint (Distance Constraint)
  // ============================================================
  class ClothConstraint {
    constructor(p1, p2, stiffness) {
      this.p1 = p1;
      this.p2 = p2;
      this.restLength = p1.position.distanceTo(p2.position);
      this.stiffness = stiffness !== undefined ? stiffness : 1;
    }

    solve() {
      const dx = this.p2.position.x - this.p1.position.x;
      const dy = this.p2.position.y - this.p1.position.y;
      const dz = this.p2.position.z - this.p1.position.z;
      const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);

      if (dist < 0.0001) return;

      const diff = ((dist - this.restLength) / dist) * this.stiffness;
      const totalInvMass = this.p1.invMass + this.p2.invMass;
      if (totalInvMass === 0) return;

      const p1Factor = (this.p1.invMass / totalInvMass) * diff;
      const p2Factor = (this.p2.invMass / totalInvMass) * diff;

      if (!this.p1.pinned) {
        this.p1.position.x += dx * p1Factor;
        this.p1.position.y += dy * p1Factor;
        this.p1.position.z += dz * p1Factor;
      }
      if (!this.p2.pinned) {
        this.p2.position.x -= dx * p2Factor;
        this.p2.position.y -= dy * p2Factor;
        this.p2.position.z -= dz * p2Factor;
      }
    }
  }

  // ============================================================
  //  Cloth Simulation
  // ============================================================
  class Cloth {
    constructor(cols, rows, shapeFunc, color, options) {
      this.cols = cols;
      this.rows = rows;
      this.particles = [];
      this.constraints = [];
      this.mesh = null;
      this.color = color;
      this.bendingStiffness = (options && options.bendingStiffness) || 0.5;

      this._createParticles(shapeFunc);
      this._createConstraints();
      this._createMesh();
    }

    _createParticles(shapeFunc) {
      for (let j = 0; j < this.rows; j++) {
        for (let i = 0; i < this.cols; i++) {
          const u = i / (this.cols - 1);
          const v = j / (this.rows - 1);
          const pos = shapeFunc(u, v);
          const p = new ClothParticle(pos.x, pos.y, pos.z);
          this.particles.push(p);
        }
      }
    }

    _createConstraints() {
      for (let j = 0; j < this.rows; j++) {
        for (let i = 0; i < this.cols; i++) {
          const idx = j * this.cols + i;

          // Horizontal structural
          if (i < this.cols - 1) {
            this.constraints.push(
              new ClothConstraint(this.particles[idx], this.particles[idx + 1], 1)
            );
          }
          // Vertical structural
          if (j < this.rows - 1) {
            this.constraints.push(
              new ClothConstraint(
                this.particles[idx],
                this.particles[idx + this.cols],
                1
              )
            );
          }
          // Diagonal shear
          if (i < this.cols - 1 && j < this.rows - 1) {
            this.constraints.push(
              new ClothConstraint(
                this.particles[idx],
                this.particles[idx + this.cols + 1],
                1
              )
            );
            this.constraints.push(
              new ClothConstraint(
                this.particles[idx + 1],
                this.particles[idx + this.cols],
                1
              )
            );
          }
          // Bending (skip-one, lower stiffness)
          if (i < this.cols - 2) {
            this.constraints.push(
              new ClothConstraint(
                this.particles[idx],
                this.particles[idx + 2],
                this.bendingStiffness
              )
            );
          }
          if (j < this.rows - 2) {
            this.constraints.push(
              new ClothConstraint(
                this.particles[idx],
                this.particles[idx + 2 * this.cols],
                this.bendingStiffness
              )
            );
          }
        }
      }

      // Wrap-around for cylindrical seam
      for (let j = 0; j < this.rows; j++) {
        this.constraints.push(
          new ClothConstraint(
            this.particles[j * this.cols],
            this.particles[j * this.cols + this.cols - 1],
            1
          )
        );
      }
    }

    _createMesh() {
      const geometry = new THREE.BufferGeometry();
      const vertCount = this.particles.length;
      const vertices = new Float32Array(vertCount * 3);
      const uvs = new Float32Array(vertCount * 2);
      const indices = [];

      for (let i = 0; i < vertCount; i++) {
        vertices[i * 3] = this.particles[i].position.x;
        vertices[i * 3 + 1] = this.particles[i].position.y;
        vertices[i * 3 + 2] = this.particles[i].position.z;

        uvs[i * 2] = (i % this.cols) / (this.cols - 1);
        uvs[i * 2 + 1] = Math.floor(i / this.cols) / (this.rows - 1);
      }

      // Triangle faces
      for (let j = 0; j < this.rows - 1; j++) {
        for (let i = 0; i < this.cols - 1; i++) {
          const a = j * this.cols + i;
          const b = j * this.cols + i + 1;
          const c = (j + 1) * this.cols + i;
          const d = (j + 1) * this.cols + i + 1;
          indices.push(a, b, d);
          indices.push(a, d, c);
        }
        // Wrap seam triangles
        const a = j * this.cols;
        const b = j * this.cols + this.cols - 1;
        const c = (j + 1) * this.cols;
        const d = (j + 1) * this.cols + this.cols - 1;
        indices.push(a, b, d);
        indices.push(a, d, c);
      }

      geometry.setAttribute(
        'position',
        new THREE.BufferAttribute(vertices, 3)
      );
      geometry.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
      geometry.setIndex(indices);
      geometry.computeVertexNormals();

      const material = new THREE.MeshPhongMaterial({
        color: this.color,
        side: THREE.DoubleSide,
        shininess: 25,
        specular: 0x555555,
      });

      this.mesh = new THREE.Mesh(geometry, material);
      this.mesh.castShadow = true;
      this.mesh.receiveShadow = true;
    }

    pinRow(row) {
      for (let i = 0; i < this.cols; i++) {
        this.particles[row * this.cols + i].pinned = true;
      }
    }

    pinParticles(indices) {
      for (const idx of indices) {
        if (idx >= 0 && idx < this.particles.length) {
          this.particles[idx].pinned = true;
        }
      }
    }

    unpinAll() {
      for (const p of this.particles) {
        p.pinned = false;
      }
    }

    setColor(hexColor) {
      if (this.mesh && this.mesh.material) {
        this.mesh.material.color.setHex(hexColor);
      }
    }

    simulate(dt, time) {
      // Gravity + optional wind
      const windX = CONFIG.WIND_STRENGTH * Math.sin(time * 0.8) * 1.2;
      const windZ = CONFIG.WIND_STRENGTH * Math.cos(time * 0.5) * 0.8;

      for (const p of this.particles) {
        p.applyForce(windX, CONFIG.GRAVITY, windZ);
      }

      // Verlet integration
      for (const p of this.particles) {
        p.update(dt);
      }

      // Constraint + collision solving (multiple iterations)
      for (let iter = 0; iter < CONFIG.CONSTRAINT_ITERATIONS; iter++) {
        for (const c of this.constraints) {
          c.solve();
        }
        this._handleCollisions();
        this._handleGround();
      }

      this._updateMesh();
    }

    _handleCollisions() {
      for (const p of this.particles) {
        if (p.pinned) continue;

        const px = p.position.x;
        const py = p.position.y;
        const pz = p.position.z;

        for (const s of BODY_SPHERES) {
          const dx = px - s.position[0];
          const dy = py - s.position[1];
          const dz = pz - s.position[2];
          const distSq = dx * dx + dy * dy + dz * dz;
          const minDist = s.radius + CONFIG.COLLISION_OFFSET;

          if (distSq < minDist * minDist) {
            const dist = Math.sqrt(distSq);
            if (dist < 0.0001) continue;

            const invDist = 1 / dist;
            const nx = dx * invDist;
            const ny = dy * invDist;
            const nz = dz * invDist;

            p.position.x = s.position[0] + nx * minDist;
            p.position.y = s.position[1] + ny * minDist;
            p.position.z = s.position[2] + nz * minDist;
          }
        }
      }
    }

    _handleGround() {
      for (const p of this.particles) {
        if (p.pinned) continue;
        if (p.position.y < CONFIG.GROUND_Y) {
          p.position.y = CONFIG.GROUND_Y;
          // Dampen velocity on ground contact
          const vy = p.position.y - p.previous.y;
          if (vy < 0) {
            p.previous.y = p.position.y;
          }
        }
      }
    }

    _updateMesh() {
      const positions = this.mesh.geometry.attributes.position.array;
      for (let i = 0; i < this.particles.length; i++) {
        positions[i * 3] = this.particles[i].position.x;
        positions[i * 3 + 1] = this.particles[i].position.y;
        positions[i * 3 + 2] = this.particles[i].position.z;
      }
      this.mesh.geometry.attributes.position.needsUpdate = true;
      this.mesh.geometry.computeVertexNormals();
    }

    dispose() {
      if (this.mesh) {
        this.mesh.geometry.dispose();
        this.mesh.material.dispose();
      }
    }
  }

  // ============================================================
  //  Mannequin Builder
  // ============================================================
  function createMannequin() {
    const group = new THREE.Group();
    const skinMat = new THREE.MeshPhongMaterial({
      color: 0xf0c8a8,
      shininess: 15,
      specular: 0x333333,
    });

    // Head
    const head = new THREE.Mesh(
      new THREE.SphereGeometry(0.12, 20, 16),
      skinMat
    );
    head.position.set(0, 1.56, 0);
    group.add(head);

    // Neck
    const neck = new THREE.Mesh(
      new THREE.CylinderGeometry(0.045, 0.05, 0.1, 12),
      skinMat
    );
    neck.position.set(0, 1.44, 0);
    group.add(neck);

    // Upper torso
    const upperTorso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.16, 0.175, 0.28, 16),
      skinMat
    );
    upperTorso.position.set(0, 1.26, 0);
    group.add(upperTorso);

    // Lower torso
    const lowerTorso = new THREE.Mesh(
      new THREE.CylinderGeometry(0.175, 0.16, 0.26, 16),
      skinMat
    );
    lowerTorso.position.set(0, 0.99, 0);
    group.add(lowerTorso);

    // Shoulders
    const shoulderGeo = new THREE.CylinderGeometry(0.055, 0.05, 0.14, 10);
    const leftShoulder = new THREE.Mesh(shoulderGeo, skinMat);
    leftShoulder.position.set(-0.205, 1.32, 0);
    leftShoulder.rotation.z = Math.PI / 2;
    group.add(leftShoulder);

    const rightShoulder = new THREE.Mesh(shoulderGeo, skinMat);
    rightShoulder.position.set(0.205, 1.32, 0);
    rightShoulder.rotation.z = Math.PI / 2;
    group.add(rightShoulder);

    // Upper arms
    const upperArmGeo = new THREE.CylinderGeometry(0.045, 0.042, 0.28, 10);
    const leftUpperArm = new THREE.Mesh(upperArmGeo, skinMat);
    leftUpperArm.position.set(-0.31, 1.16, 0);
    group.add(leftUpperArm);

    const rightUpperArm = new THREE.Mesh(upperArmGeo, skinMat);
    rightUpperArm.position.set(0.31, 1.16, 0);
    group.add(rightUpperArm);

    // Lower arms
    const lowerArmGeo = new THREE.CylinderGeometry(0.038, 0.036, 0.28, 10);
    const leftLowerArm = new THREE.Mesh(lowerArmGeo, skinMat);
    leftLowerArm.position.set(-0.32, 0.88, 0);
    group.add(leftLowerArm);

    const rightLowerArm = new THREE.Mesh(lowerArmGeo, skinMat);
    rightLowerArm.position.set(0.32, 0.88, 0);
    group.add(rightLowerArm);

    // Hands
    const handGeo = new THREE.SphereGeometry(0.038, 12, 10);
    const leftHand = new THREE.Mesh(handGeo, skinMat);
    leftHand.position.set(-0.32, 0.72, 0);
    group.add(leftHand);

    const rightHand = new THREE.Mesh(handGeo, skinMat);
    rightHand.position.set(0.32, 0.72, 0);
    group.add(rightHand);

    // Hips
    const hips = new THREE.Mesh(
      new THREE.CylinderGeometry(0.14, 0.13, 0.14, 14),
      skinMat
    );
    hips.position.set(0, 0.80, 0);
    group.add(hips);

    // Upper legs
    const upperLegGeo = new THREE.CylinderGeometry(0.065, 0.058, 0.36, 12);
    const leftUpperLeg = new THREE.Mesh(upperLegGeo, skinMat);
    leftUpperLeg.position.set(-0.09, 0.54, 0);
    group.add(leftUpperLeg);

    const rightUpperLeg = new THREE.Mesh(upperLegGeo, skinMat);
    rightUpperLeg.position.set(0.09, 0.54, 0);
    group.add(rightUpperLeg);

    // Lower legs
    const lowerLegGeo = new THREE.CylinderGeometry(0.052, 0.048, 0.36, 12);
    const leftLowerLeg = new THREE.Mesh(lowerLegGeo, skinMat);
    leftLowerLeg.position.set(-0.09, 0.18, 0);
    group.add(leftLowerLeg);

    const rightLowerLeg = new THREE.Mesh(lowerLegGeo, skinMat);
    rightLowerLeg.position.set(0.09, 0.18, 0);
    group.add(rightLowerLeg);

    // Feet
    const footGeo = new THREE.BoxGeometry(0.07, 0.05, 0.13);
    const leftFoot = new THREE.Mesh(footGeo, skinMat);
    leftFoot.position.set(-0.09, 0.02, 0.025);
    group.add(leftFoot);

    const rightFoot = new THREE.Mesh(footGeo, skinMat);
    rightFoot.position.set(0.09, 0.02, 0.025);
    group.add(rightFoot);

    return group;
  }

  // ============================================================
  //  Clothing Definitions
  // ============================================================
  const CLOTHING = {
    tshirt: {
      name: 'T-Shirt',
      color: 0x29b6f6,
      cols: 30,
      rows: 22,
      bendingStiffness: 0.4,
      shape: function (u, v) {
        const y = 1.38 - v * 0.52;
        const topR = 0.175;
        const botR = 0.21;
        const r = topR + (botR - topR) * v;
        const a = u * Math.PI * 2 - Math.PI / 2;
        return {
          x: Math.cos(a) * r,
          y: y,
          z: Math.sin(a) * r,
        };
      },
      pinRow: 0,
    },

    dress: {
      name: 'Dress',
      color: 0xef5350,
      cols: 40,
      rows: 42,
      bendingStiffness: 0.3,
      shape: function (u, v) {
        const y = 1.38 - v * 1.08;
        const topR = 0.175;
        const botR = 0.45;
        // A-line curve: stays narrow at top, flares at bottom
        const r = topR + (botR - topR) * Math.pow(v, 0.65);
        const a = u * Math.PI * 2 - Math.PI / 2;
        return {
          x: Math.cos(a) * r,
          y: y,
          z: Math.sin(a) * r,
        };
      },
      pinRow: 0,
    },

    jacket: {
      name: 'Jacket',
      color: 0x37474f,
      cols: 32,
      rows: 26,
      bendingStiffness: 0.85,
      shape: function (u, v) {
        const y = 1.42 - v * 0.56;
        const topR = 0.23;
        const botR = 0.26;
        const r = topR + (botR - topR) * v;
        const a = u * Math.PI * 2 - Math.PI / 2;
        return {
          x: Math.cos(a) * r,
          y: y,
          z: Math.sin(a) * r,
        };
      },
      pinRow: 0,
    },

    pants: {
      name: 'Pants',
      color: 0x607d8b,
      multiPart: true,
      parts: [
        {
          cols: 18,
          rows: 30,
          bendingStiffness: 0.5,
          offsetX: -0.09,
          shape: function (u, v) {
            const y = 0.82 - v * 0.77;
            const topR = 0.095;
            const botR = 0.068;
            const r = topR + (botR - topR) * v;
            const a = u * Math.PI * 2;
            return {
              x: Math.cos(a) * r,
              y: y,
              z: Math.sin(a) * r,
            };
          },
          pinRow: 0,
        },
        {
          cols: 18,
          rows: 30,
          bendingStiffness: 0.5,
          offsetX: 0.09,
          shape: function (u, v) {
            const y = 0.82 - v * 0.77;
            const topR = 0.095;
            const botR = 0.068;
            const r = topR + (botR - topR) * v;
            const a = u * Math.PI * 2;
            return {
              x: Math.cos(a) * r,
              y: y,
              z: Math.sin(a) * r,
            };
          },
          pinRow: 0,
        },
      ],
    },

    skirt: {
      name: 'Skirt',
      color: 0xab47bc,
      cols: 36,
      rows: 26,
      bendingStiffness: 0.35,
      shape: function (u, v) {
        const y = 0.82 - v * 0.52;
        const topR = 0.17;
        const botR = 0.40;
        const r = topR + (botR - topR) * Math.pow(v, 0.55);
        const a = u * Math.PI * 2 - Math.PI / 2;
        return {
          x: Math.cos(a) * r,
          y: y,
          z: Math.sin(a) * r,
        };
      },
      pinRow: 0,
    },
  };

  // ============================================================
  //  Main Application
  // ============================================================
  let scene, camera, renderer, controls;
  let mannequin;
  let activeClothes = [];
  let autoRotate = true;
  let windEnabled = false;

  // Pre-compute sphere Vector3 objects for collision
  const collisionSpheres = BODY_SPHERES.map(function (s) {
    return {
      position: new THREE.Vector3(s.position[0], s.position[1], s.position[2]),
      radius: s.radius,
    };
  });

  function init() {
    const container = document.getElementById('canvas-container');
    const viewport = document.getElementById('viewport');

    // Scene
    scene = new THREE.Scene();
    scene.background = new THREE.Color(0x0d0d1a);
    scene.fog = new THREE.Fog(0x0d0d1a, 4, 12);

    // Camera
    camera = new THREE.PerspectiveCamera(
      45,
      viewport.clientWidth / viewport.clientHeight,
      0.1,
      100
    );
    camera.position.set(0, 1.0, 3.2);

    // Renderer
    renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    renderer.setSize(viewport.clientWidth, viewport.clientHeight);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    renderer.outputEncoding = THREE.sRGBEncoding;
    container.appendChild(renderer.domElement);

    // OrbitControls
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.dampingFactor = 0.08;
    controls.autoRotate = autoRotate;
    controls.autoRotateSpeed = 1.2;
    controls.minDistance = 1.5;
    controls.maxDistance = 7;
    controls.target.set(0, 0.85, 0);
    controls.maxPolarAngle = Math.PI * 0.88;
    controls.update();

    // Lighting
    _setupLighting();

    // Environment
    _setupEnvironment();

    // Mannequin
    mannequin = createMannequin();
    scene.add(mannequin);

    // UI
    _bindEvents();

    // Start with T-shirt
    tryOn('tshirt');

    // Hide loading
    document.getElementById('loading').style.display = 'none';

    // Animation loop
    _animate();
  }

  function _setupLighting() {
    // Ambient
    scene.add(new THREE.AmbientLight(0xffffff, 0.35));

    // Key light (main)
    const keyLight = new THREE.DirectionalLight(0xffffff, 0.7);
    keyLight.position.set(4, 6, 3);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.width = 1024;
    keyLight.shadow.mapSize.height = 1024;
    keyLight.shadow.camera.near = 0.5;
    keyLight.shadow.camera.far = 20;
    keyLight.shadow.camera.left = -3;
    keyLight.shadow.camera.right = 3;
    keyLight.shadow.camera.top = 4;
    keyLight.shadow.camera.bottom = -2;
    scene.add(keyLight);

    // Fill light (cool)
    const fillLight = new THREE.DirectionalLight(0x88ccff, 0.25);
    fillLight.position.set(-4, 3, -2);
    scene.add(fillLight);

    // Rim / back light (warm)
    const rimLight = new THREE.DirectionalLight(0xffaa66, 0.2);
    rimLight.position.set(0, 4, -4);
    scene.add(rimLight);

    // Subtle point light from below for fill
    const bottomLight = new THREE.PointLight(0x4466aa, 0.15, 6);
    bottomLight.position.set(0, 0.3, 1);
    scene.add(bottomLight);
  }

  function _setupEnvironment() {
    // Ground disc
    const groundGeo = new THREE.CircleGeometry(4, 64);
    const groundMat = new THREE.MeshPhongMaterial({
      color: 0x1a1a30,
      side: THREE.DoubleSide,
      shininess: 5,
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = 0;
    ground.receiveShadow = true;
    scene.add(ground);

    // Subtle grid
    const grid = new THREE.GridHelper(8, 40, 0x2a2a4a, 0x1a1a35);
    grid.position.y = 0.005;
    scene.add(grid);
  }

  function _bindEvents() {
    // Clothing buttons
    var btns = document.querySelectorAll('.clothing-btn');
    for (var i = 0; i < btns.length; i++) {
      (function (btn) {
        btn.addEventListener('click', function () {
          // Deactivate all
          var all = document.querySelectorAll('.clothing-btn');
          for (var j = 0; j < all.length; j++) {
            all[j].classList.remove('active');
          }
          btn.classList.add('active');
          tryOn(btn.getAttribute('data-clothing'));
        });
      })(btns[i]);
    }

    // Auto-rotate toggle
    document.getElementById('btn-auto-rotate').addEventListener(
      'click',
      function () {
        autoRotate = !autoRotate;
        controls.autoRotate = autoRotate;
        this.textContent =
          'Auto Rotate: ' + (autoRotate ? 'ON' : 'OFF');
        this.classList.toggle('active', autoRotate);
      }
    );

    // Reset view
    document.getElementById('btn-reset').addEventListener('click', function () {
      camera.position.set(0, 1.0, 3.2);
      controls.target.set(0, 0.85, 0);
      controls.update();
    });

    // Wind toggle
    document.getElementById('btn-wind').addEventListener('click', function () {
      windEnabled = !windEnabled;
      CONFIG.WIND_STRENGTH = windEnabled ? 3 : 0;
      this.textContent = 'Wind: ' + (windEnabled ? 'ON' : 'OFF');
      this.classList.toggle('active', windEnabled);
    });

    // Resize
    window.addEventListener('resize', _onResize);
  }

  function _onResize() {
    var vp = document.getElementById('viewport');
    camera.aspect = vp.clientWidth / vp.clientHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(vp.clientWidth, vp.clientHeight);
  }

  // ----------------------------------------------------------
  //  Try-on clothing
  // ----------------------------------------------------------
  function tryOn(type) {
    // Remove existing clothes
    _removeAllClothes();

    var def = CLOTHING[type];
    if (!def) return;

    if (def.multiPart && def.parts) {
      for (var pi = 0; pi < def.parts.length; pi++) {
        var part = def.parts[pi];
        var offsetX = part.offsetX || 0;
        var cloth = new Cloth(
          part.cols,
          part.rows,
          function (u, v) {
            var pos = part.shape(u, v);
            return {
              x: pos.x + offsetX,
              y: pos.y,
              z: pos.z,
            };
          },
          def.color,
          { bendingStiffness: part.bendingStiffness }
        );
        cloth.pinRow(part.pinRow);
        scene.add(cloth.mesh);
        activeClothes.push(cloth);
      }
    } else {
      var cloth = new Cloth(
        def.cols,
        def.rows,
        def.shape,
        def.color,
        { bendingStiffness: def.bendingStiffness }
      );
      cloth.pinRow(def.pinRow);
      scene.add(cloth.mesh);
      activeClothes.push(cloth);
    }
  }

  function _removeAllClothes() {
    for (var i = 0; i < activeClothes.length; i++) {
      scene.remove(activeClothes[i].mesh);
      activeClothes[i].dispose();
    }
    activeClothes = [];
  }

  // ----------------------------------------------------------
  //  Animation loop
  // ----------------------------------------------------------
  var _clock = new THREE.Clock();

  function _animate() {
    requestAnimationFrame(_animate);

    var dt = CONFIG.TIME_STEP;
    var elapsed = _clock.getElapsedTime();

    // Simulate cloth physics
    for (var i = 0; i < activeClothes.length; i++) {
      activeClothes[i].simulate(dt, elapsed);
    }

    // Subtle mannequin breathing animation
    if (mannequin) {
      var breathScale = 1 + Math.sin(elapsed * 1.5) * 0.008;
      mannequin.scale.set(breathScale, breathScale, breathScale);
    }

    controls.update();
    renderer.render(scene, camera);
  }

  // Start
  init();
})();
