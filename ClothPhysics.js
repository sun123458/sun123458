// ClothPhysics.js - Verlet 积分布料物理引擎
class ClothPhysics {
  constructor() {
    this.particles = [];
    this.constraints = [];
    this.gravity = new THREE.Vector3(0, -9.8, 0);
    this.damping = 0.97;
    this.iterations = 5;
    this.dt = 1 / 60;
    this.fixedPoints = []; // indices of fixed particles
  }

  // 创建粒子网格
  createParticleGrid(width, height, segmentsW, segmentsH, origin, uDir, vDir) {
    this.particles = [];
    this.constraints = [];
    this.fixedPoints = [];

    const stepU = width / segmentsW;
    const stepV = height / segmentsH;

    for (let j = 0; j <= segmentsH; j++) {
      for (let i = 0; i <= segmentsW; i++) {
        const pos = new THREE.Vector3()
          .copy(origin)
          .addScaledVector(uDir, i * stepU)
          .addScaledVector(vDir, j * stepV);

        this.particles.push({
          position: pos.clone(),
          previous: pos.clone(),
          acceleration: new THREE.Vector3(),
          mass: 1.0,
          pinned: false
        });
      }
    }

    const cols = segmentsW + 1;

    // 结构约束（水平+垂直）
    for (let j = 0; j <= segmentsH; j++) {
      for (let i = 0; i <= segmentsW; i++) {
        const idx = j * cols + i;
        // 水平
        if (i < segmentsW) {
          this._addConstraint(idx, idx + 1, stepU);
        }
        // 垂直
        if (j < segmentsH) {
          this._addConstraint(idx, idx + cols, stepV);
        }
      }
    }

    // 剪切约束（对角线）
    const diagLen = Math.sqrt(stepU * stepU + stepV * stepV);
    for (let j = 0; j < segmentsH; j++) {
      for (let i = 0; i < segmentsW; i++) {
        const idx = j * cols + i;
        this._addConstraint(idx, idx + cols + 1, diagLen, 'shear');
        this._addConstraint(idx + 1, idx + cols, diagLen, 'shear');
      }
    }

    // 弯曲约束（隔一个粒子）
    for (let j = 0; j <= segmentsH; j++) {
      for (let i = 0; i <= segmentsW; i++) {
        const idx = j * cols + i;
        if (i + 2 <= segmentsW) {
          this._addConstraint(idx, idx + 2, stepU * 2, 'bend');
        }
        if (j + 2 <= segmentsH) {
          this._addConstraint(idx, idx + cols * 2, stepV * 2, 'bend');
        }
      }
    }

    return this.particles;
  }

  _addConstraint(a, b, restLength, type = 'structural') {
    const stiffness = type === 'bend' ? 0.3 : type === 'shear' ? 0.6 : 1.0;
    this.constraints.push({ a, b, restLength, stiffness, type });
  }

  // 固定粒子
  pinParticle(index) {
    if (index >= 0 && index < this.particles.length) {
      this.particles[index].pinned = true;
      this.fixedPoints.push(index);
    }
  }

  // 固定某一行粒子到指定位置
  pinRow(row, segmentsW, positions) {
    const cols = segmentsW + 1;
    for (let i = 0; i <= segmentsW; i++) {
      const idx = row * cols + i;
      if (idx < this.particles.length && positions[i]) {
        this.particles[idx].position.copy(positions[i]);
        this.particles[idx].previous.copy(positions[i]);
        this.pinParticle(idx);
      }
    }
  }

  // 更新固定点位置（跟随身体运动）
  updateFixedPoints(positions) {
    for (let k = 0; k < this.fixedPoints.length; k++) {
      const idx = this.fixedPoints[k];
      if (positions[k]) {
        this.particles[idx].position.copy(positions[k]);
        this.particles[idx].previous.copy(positions[k]);
      }
    }
  }

  // Verlet 积分更新
  integrate() {
    const dt2 = this.dt * this.dt;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.pinned) continue;

      const vel = new THREE.Vector3().subVectors(p.position, p.previous);
      vel.multiplyScalar(this.damping);

      p.previous.copy(p.position);
      p.position.add(vel);
      p.position.addScaledVector(this.gravity, dt2);
    }
  }

  // 约束求解
  solveConstraints() {
    for (let iter = 0; iter < this.iterations; iter++) {
      for (let i = 0; i < this.constraints.length; i++) {
        const c = this.constraints[i];
        const p1 = this.particles[c.a];
        const p2 = this.particles[c.b];

        const diff = new THREE.Vector3().subVectors(p2.position, p1.position);
        const dist = diff.length();
        if (dist < 0.0001) continue;

        const correction = diff.multiplyScalar((1 - c.restLength / dist) * 0.5 * c.stiffness);

        if (!p1.pinned) p1.position.add(correction);
        if (!p2.pinned) p2.position.sub(correction);
      }
    }
  }

  // 碰撞检测 - 球体
  collideSphere(center, radius) {
    const friction = 0.9;
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.pinned) continue;

      const diff = new THREE.Vector3().subVectors(p.position, center);
      const dist = diff.length();
      if (dist < radius) {
        const n = diff.normalize();
        p.position.copy(center).addScaledVector(n, radius);

        // 摩擦力 - 降低法向速度
        const vel = new THREE.Vector3().subVectors(p.position, p.previous);
        const vn = vel.dot(n);
        if (vn < 0) {
          const velNormal = n.clone().multiplyScalar(vn);
          const velTangent = vel.clone().sub(velNormal);
          p.previous.copy(p.position).sub(
            velTangent.multiplyScalar(friction)
          );
        }
      }
    }
  }

  // 碰撞检测 - 胶囊体
  collideCapsule(p1, p2, radius) {
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      if (p.pinned) continue;

      const closest = this._closestPointOnSegment(p.position, p1, p2);
      const diff = new THREE.Vector3().subVectors(p.position, closest);
      const dist = diff.length();

      if (dist < radius) {
        const n = diff.length() > 0.0001 ? diff.normalize() : new THREE.Vector3(0, 1, 0);
        p.position.copy(closest).addScaledVector(n, radius);

        const vel = new THREE.Vector3().subVectors(p.position, p.previous);
        const vn = vel.dot(n);
        if (vn < 0) {
          const velNormal = n.clone().multiplyScalar(vn);
          p.previous.copy(p.position).sub(
            vel.clone().sub(velNormal).multiplyScalar(0.9)
          );
        }
      }
    }
  }

  _closestPointOnSegment(point, a, b) {
    const ab = new THREE.Vector3().subVectors(b, a);
    const ap = new THREE.Vector3().subVectors(point, a);
    let t = ap.dot(ab) / ab.dot(ab);
    t = Math.max(0, Math.min(1, t));
    return new THREE.Vector3().copy(a).addScaledVector(ab, t);
  }

  // 主更新循环
  update(colliders) {
    this.integrate();
    this.solveConstraints();

    // 应用碰撞
    if (colliders) {
      for (const col of colliders) {
        if (col.type === 'sphere') {
          this.collideSphere(col.center, col.radius);
        } else if (col.type === 'capsule') {
          this.collideCapsule(col.p1, col.p2, col.radius);
        }
      }
    }
  }

  // 获取粒子位置数组（用于更新 BufferGeometry）
  getPositions() {
    const arr = new Float32Array(this.particles.length * 3);
    for (let i = 0; i < this.particles.length; i++) {
      arr[i * 3] = this.particles[i].position.x;
      arr[i * 3 + 1] = this.particles[i].position.y;
      arr[i * 3 + 2] = this.particles[i].position.z;
    }
    return arr;
  }

  reset() {
    this.particles = [];
    this.constraints = [];
    this.fixedPoints = [];
  }
}

window.ClothPhysics = ClothPhysics;
