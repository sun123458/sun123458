import * as THREE from 'three';

export class ClothParticle {
  constructor(x, y, z, mass = 1, pinned = false) {
    this.pos = new THREE.Vector3(x, y, z);
    this.prevPos = new THREE.Vector3(x, y, z);
    this.mass = mass;
    this.pinned = pinned;
    this.acceleration = new THREE.Vector3();
  }
}

export class Constraint {
  constructor(p1, p2, restDistance) {
    this.p1 = p1;
    this.p2 = p2;
    this.restDistance = restDistance;
  }
}

export class ClothSystem {
  constructor(rows, cols, spacing, color = 0x4fd1c5) {
    this.rows = rows;
    this.cols = cols;
    this.particles = [];
    this.constraints = [];
    this.geometry = new THREE.BufferGeometry();
    this.material = new THREE.MeshStandardMaterial({
      color, side: THREE.DoubleSide, flatShading: false,
      roughness: 0.6, metalness: 0.1
    });
    this.mesh = new THREE.Mesh(this.geometry, this.material);
    this.mesh.castShadow = true;
    this.mesh.receiveShadow = true;
    this.windTime = 0;
    this.offset = 0.02;
  }

  addParticle(x, y, z, pinned = false) {
    const p = new ClothParticle(x, y, z, 1, pinned);
    this.particles.push(p);
    return p;
  }

  particleAt(r, c) {
    return this.particles[r * this.cols + c];
  }

  addConstraints() {
    for (let r = 0; r < this.rows; r++) {
      for (let c = 0; c < this.cols; c++) {
        const p = this.particleAt(r, c);
        // structural
        if (c < this.cols - 1) {
          const q = this.particleAt(r, c + 1);
          this.constraints.push(new Constraint(p, q, p.pos.distanceTo(q.pos)));
        }
        if (r < this.rows - 1) {
          const q = this.particleAt(r + 1, c);
          this.constraints.push(new Constraint(p, q, p.pos.distanceTo(q.pos)));
        }
        // shear
        if (r < this.rows - 1 && c < this.cols - 1) {
          const q1 = this.particleAt(r + 1, c + 1);
          this.constraints.push(new Constraint(p, q1, p.pos.distanceTo(q1.pos)));
          const q2 = this.particleAt(r + 1, c);
          const q3 = this.particleAt(r, c + 1);
          this.constraints.push(new Constraint(q2, q3, q2.pos.distanceTo(q3.pos)));
        }
      }
    }
  }

  buildMesh(wrap = false) {
    const indices = [];
    for (let r = 0; r < this.rows - 1; r++) {
      for (let c = 0; c < this.cols; c++) {
        const i0 = r * this.cols + c;
        const i1 = r * this.cols + ((c + 1) % this.cols);
        const i2 = (r + 1) * this.cols + c;
        const i3 = (r + 1) * this.cols + ((c + 1) % this.cols);
        if (wrap || c < this.cols - 1) {
          indices.push(i0, i2, i1);
          indices.push(i1, i2, i3);
        }
      }
    }
    this.geometry.setIndex(indices);
    this.geometry.setAttribute('position', new THREE.BufferAttribute(new Float32Array(this.particles.length * 3), 3));
    this.geometry.computeVertexNormals();
    this.updateGeometry();
  }

  updateGeometry() {
    const positions = this.geometry.attributes.position.array;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      positions[i * 3] = p.pos.x;
      positions[i * 3 + 1] = p.pos.y;
      positions[i * 3 + 2] = p.pos.z;
    }
    this.geometry.attributes.position.needsUpdate = true;
    this.geometry.computeVertexNormals();
  }

  update(dt, colliders, windStrength = 0) {
    const gravity = new THREE.Vector3(0, -25, 0);
    const damping = 0.98;
    const dt2 = dt * dt;

    this.windTime += dt;
    const wind = new THREE.Vector3(
      Math.sin(this.windTime * 2) * windStrength,
      0,
      Math.cos(this.windTime * 1.5) * windStrength * 0.5
    );

    // Verlet integration
    for (const p of this.particles) {
      if (p.pinned) continue;
      const temp = p.pos.clone();
      const vel = p.pos.clone().sub(p.prevPos).multiplyScalar(damping);
      p.pos.add(vel).add(gravity.clone().multiplyScalar(dt2)).add(wind.clone().multiplyScalar(dt2 / p.mass));
      p.prevPos.copy(temp);
    }

    // Solve constraints
    for (let iter = 0; iter < 8; iter++) {
      for (const c of this.constraints) {
        const delta = c.p2.pos.clone().sub(c.p1.pos);
        const dist = delta.length();
        if (dist === 0) continue;
        const diff = (dist - c.restDistance) / dist;
        const offset = delta.multiplyScalar(diff * 0.5);
        if (!c.p1.pinned) c.p1.pos.add(offset);
        if (!c.p2.pinned) c.p2.pos.sub(offset);
      }
    }

    // Collision
    for (const p of this.particles) {
      if (p.pinned) continue;
      for (const col of colliders) {
        const ab = col.b.clone().sub(col.a);
        const ap = p.pos.clone().sub(col.a);
        const t = Math.max(0, Math.min(1, ap.dot(ab) / ab.lengthSq()));
        const closest = col.a.clone().add(ab.multiplyScalar(t));
        const diff = p.pos.clone().sub(closest);
        const dist = diff.length();
        const limit = col.radius + this.offset;
        if (dist < limit && dist > 0.0001) {
          const normal = diff.divideScalar(dist);
          p.pos.copy(closest.add(normal.multiplyScalar(limit)));
          // friction
          const vel = p.pos.clone().sub(p.prevPos);
          const tangent = vel.clone().sub(normal.multiplyScalar(vel.dot(normal)));
          p.prevPos.add(tangent.multiplyScalar(-0.2));
        }
      }
    }

    this.updateGeometry();
  }
}
