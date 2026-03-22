// ClothSimulation.js - Verlet integration cloth physics with body collision
class ClothSimulation {
  constructor(scene) {
    this.scene = scene;
    this.particles = [];
    this.constraints = [];
    this.gravity = new THREE.Vector3(0, -0.004, 0);
    this.wind = new THREE.Vector3(0, 0, 0);
    this.windEnabled = false;
    this.iterations = 8;
    this.selfCollisionDist = 0.04;
  }

  createCloth(width, height, segW, segH, transform) {
    const clothData = { particles: [], faces: [], constraints: [] };

    for (let j = 0; j <= segH; j++) {
      for (let i = 0; i <= segW; i++) {
        const u = i / segW;
        const v = j / segH;

        // position from transform
        const pos = new THREE.Vector3(
          (u - 0.5) * width,
          -(v) * height,
          0
        );

        // Apply transform (position, rotation, scale)
        if (transform) {
          pos.applyQuaternion(transform.rotation || new THREE.Quaternion());
          pos.multiplyScalar(transform.scale || 1);
          pos.add(transform.position || new THREE.Vector3());
        }

        const particle = {
          position: pos.clone(),
          previous: pos.clone(),
          original: pos.clone(),
          acceleration: new THREE.Vector3(),
          mass: 1,
          pinned: false,
          invMass: 1
        };
        clothData.particles.push(particle);
      }
    }

    // Structural constraints
    for (let j = 0; j <= segH; j++) {
      for (let i = 0; i <= segW; i++) {
        const idx = j * (segW + 1) + i;
        if (i < segW) {
          const dist = clothData.particles[idx].position.distanceTo(clothData.particles[idx + 1].position);
          clothData.constraints.push({ p1: idx, p2: idx + 1, rest: dist, stiffness: 0.9 });
        }
        if (j < segH) {
          const dist = clothData.particles[idx].position.distanceTo(clothData.particles[(j + 1) * (segW + 1) + i].position);
          clothData.constraints.push({ p1: idx, p2: (j + 1) * (segW + 1) + i, rest: dist, stiffness: 0.9 });
        }
      }
    }

    // Shear constraints for stability
    for (let j = 0; j < segH; j++) {
      for (let i = 0; i < segW; i++) {
        const idx = j * (segW + 1) + i;
        const dist1 = clothData.particles[idx].position.distanceTo(clothData.particles[(j + 1) * (segW + 1) + i + 1].position);
        clothData.constraints.push({ p1: idx, p2: (j + 1) * (segW + 1) + i + 1, rest: dist1, stiffness: 0.5 });

        const dist2 = clothData.particles[idx + 1].position.distanceTo(clothData.particles[(j + 1) * (segW + 1) + i].position);
        clothData.constraints.push({ p1: idx + 1, p2: (j + 1) * (segW + 1) + i, rest: dist2, stiffness: 0.5 });
      }
    }

    // Build faces
    for (let j = 0; j < segH; j++) {
      for (let i = 0; i < segW; i++) {
        const a = j * (segW + 1) + i;
        const b = a + 1;
        const c = (j + 1) * (segW + 1) + i;
        const d = c + 1;
        clothData.faces.push([a, b, d]);
        clothData.faces.push([a, d, c]);
      }
    }

    const mesh = this._createClothMesh(clothData, new THREE.Vector3(0.6, 0.4, 0.3));
    clothData.mesh = mesh;
    scene.add(mesh);

    this.particles.push(clothData);
    return clothData;
  }

  _createClothMesh(clothData, color) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(clothData.faces.length * 9);
    const normals = new Float32Array(clothData.faces.length * 9);
    const uvs = new Float32Array(clothData.faces.length * 6);
    const colors = new Float32Array(clothData.faces.length * 9);

    let vi = 0, ui = 0, ci = 0;
    for (const face of clothData.faces) {
      for (let k = 0; k < 3; k++) {
        const p = clothData.particles[face[k]].position;
        positions[vi] = p.x; positions[vi + 1] = p.y; positions[vi + 2] = p.z;

        // Subtle color variation
        const variation = (Math.sin(p.y * 8 + p.x * 4) * 0.03);
        colors[ci] = Math.min(1, color.x + variation);
        colors[ci + 1] = Math.min(1, color.y + variation);
        colors[ci + 2] = Math.min(1, color.z + variation * 0.5);

        vi += 3; ci += 3;
      }
      ui += 6;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geo.setAttribute('normal', new THREE.BufferAttribute(normals, 3));
    geo.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    geo.computeVertexNormals();

    const mat = new THREE.MeshPhysicalMaterial({
      vertexColors: true,
      side: THREE.DoubleSide,
      roughness: 0.75,
      metalness: 0.0,
      clearcoat: 0.1,
      clearcoatRoughness: 0.8
    });

    return new THREE.Mesh(geo, mat);
  }

  setClothColor(clothData, color) {
    const positions = clothData.mesh.geometry.attributes.position.array;
    const colors = clothData.mesh.geometry.attributes.color.array;
    let ci = 0;
    for (const face of clothData.faces) {
      for (let k = 0; k < 3; k++) {
        const p = clothData.particles[face[k]].position;
        const variation = (Math.sin(p.y * 8 + p.x * 4) * 0.03);
        colors[ci] = Math.min(1, color.r + variation);
        colors[ci + 1] = Math.min(1, color.g + variation);
        colors[ci + 2] = Math.min(1, color.b + variation * 0.5);
        ci += 3;
      }
    }
    clothData.mesh.geometry.attributes.color.needsUpdate = true;
  }

  simulate(bodySpheres) {
    const dt = 1.0;
    for (const clothData of this.particles) {
      // Verlet integration
      for (const p of clothData.particles) {
        if (p.pinned) continue;

        const temp = p.position.clone();
        const vel = p.position.clone().sub(p.previous).multiplyScalar(0.97); // damping
        p.position.add(vel);
        p.position.add(this.gravity);

        if (this.windEnabled) {
          const windForce = this.wind.clone().multiplyScalar(0.5 * (1 + Math.random() * 0.3));
          p.position.add(windForce);
        }

        p.previous.copy(temp);
      }

      // Collision with body spheres
      for (const p of clothData.particles) {
        if (p.pinned) continue;
        for (const sphere of bodySpheres) {
          const diff = p.position.clone().sub(sphere.center);
          const dist = diff.length();
          if (dist < sphere.radius + 0.005) {
            diff.normalize().multiplyScalar(sphere.radius + 0.005);
            p.position.copy(sphere.center.clone().add(diff));
          }
        }
      }

      // Constraint solving
      for (let iter = 0; iter < this.iterations; iter++) {
        for (const c of clothData.constraints) {
          const p1 = clothData.particles[c.p1];
          const p2 = clothData.particles[c.p2];
          const diff = p2.position.clone().sub(p1.position);
          const dist = diff.length();
          if (dist === 0) continue;
          const correction = diff.multiplyScalar((1 - c.rest / dist) * c.stiffness * 0.5);

          if (!p1.pinned) p1.position.add(correction);
          if (!p2.pinned) p2.position.sub(correction);
        }

        // Collision again after constraints
        for (const p of clothData.particles) {
          if (p.pinned) continue;
          for (const sphere of bodySpheres) {
            const diff = p.position.clone().sub(sphere.center);
            const dist = diff.length();
            if (dist < sphere.radius + 0.003) {
              diff.normalize().multiplyScalar(sphere.radius + 0.003);
              p.position.copy(sphere.center.clone().add(diff));
            }
          }
        }
      }

      // Keep particles above ground
      for (const p of clothData.particles) {
        if (p.pinned) continue;
        if (p.position.y < -0.01) p.position.y = -0.01;
      }

      // Update mesh
      this._updateMesh(clothData);
    }
  }

  _updateMesh(clothData) {
    const positions = clothData.mesh.geometry.attributes.position.array;
    const colors = clothData.mesh.geometry.attributes.color.array;
    let vi = 0, ci = 0;

    const baseColor = clothData._color || new THREE.Vector3(0.6, 0.4, 0.3);

    for (const face of clothData.faces) {
      const p0 = clothData.particles[face[0]].position;
      const p1 = clothData.particles[face[1]].position;
      const p2 = clothData.particles[face[2]].position;

      positions[vi] = p0.x; positions[vi+1] = p0.y; positions[vi+2] = p0.z;
      positions[vi+3] = p1.x; positions[vi+4] = p1.y; positions[vi+5] = p1.z;
      positions[vi+6] = p2.x; positions[vi+7] = p2.y; positions[vi+8] = p2.z;

      // Add subtle shading based on face normal
      const edge1 = new THREE.Vector3().subVectors(p1, p0);
      const edge2 = new THREE.Vector3().subVectors(p2, p0);
      const normal = new THREE.Vector3().crossVectors(edge1, edge2).normalize();
      const lightDir = new THREE.Vector3(0.5, 1, 0.3).normalize();
      const shade = 0.7 + 0.3 * Math.abs(normal.dot(lightDir));

      for (let k = 0; k < 3; k++) {
        colors[ci] = Math.min(1, baseColor.x * shade);
        colors[ci+1] = Math.min(1, baseColor.y * shade);
        colors[ci+2] = Math.min(1, baseColor.z * shade);
        ci += 3;
      }

      vi += 9;
    }

    clothData.mesh.geometry.attributes.position.needsUpdate = true;
    clothData.mesh.geometry.attributes.color.needsUpdate = true;
    clothData.mesh.geometry.computeVertexNormals();
    clothData.mesh.geometry.attributes.normal.needsUpdate = true;
  }

  setWind(direction, strength) {
    this.wind.copy(direction).multiplyScalar(strength);
    this.windEnabled = strength > 0;
  }

  removeCloth(clothData) {
    if (clothData && clothData.mesh) {
      this.scene.remove(clothData.mesh);
      clothData.mesh.geometry.dispose();
      clothData.mesh.material.dispose();
    }
  }
}
