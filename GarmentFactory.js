// GarmentFactory.js - 5 款服装的程序化生成器
class GarmentFactory {
  constructor() {
    this.types = ['tshirt', 'dress', 'jacket', 'skirt', 'pants'];
  }

  // 创建服装 - 返回 { mesh, physics, physicsInfo, colliderExclude }
  create(type, bodyModel, color = 0x4488cc) {
    const h = bodyModel.getHeight();
    const b = bodyModel.getBuild();

    switch (type) {
      case 'tshirt':   return this._createTShirt(h, b, color);
      case 'dress':    return this._createDress(h, b, color);
      case 'jacket':   return this._createJacket(h, b, color);
      case 'skirt':    return this._createSkirt(h, b, color);
      case 'pants':    return this._createPants(h, b, color);
      default:         return this._createTShirt(h, b, color);
    }
  }

  // ============ T恤 ============
  _createTShirt(h, b, color) {
    const shoulderW = 0.36 + b * 0.08;
    const segmentsW = 28;
    const segmentsH = 44;

    // 圆柱网格 - 包裹躯干上部
    const circ = shoulderW * 0.55 * Math.PI * 2;
    const bodyH = h * 0.42;
    const origin = new THREE.Vector3(-circ / 2, h * 0.84, 0);
    const uDir = new THREE.Vector3(1, 0, 0);
    const vDir = new THREE.Vector3(0, -1, 0);

    const physics = new ClothPhysics();
    physics.createParticleGrid(circ, bodyH, segmentsW, segmentsH, origin, uDir, vDir);

    // 固定肩部 (第0行)
    for (let i = 0; i <= segmentsW; i++) {
      physics.pinParticle(i);
    }

    // 将初始网格弯成圆筒
    const cols = segmentsW + 1;
    for (let j = 0; j <= segmentsH; j++) {
      for (let i = 0; i <= segmentsW; i++) {
        const idx = j * cols + i;
        const t = i / segmentsW;
        const angle = t * Math.PI * 2;
        const r = shoulderW * 0.55 + 0.02;
        const y = h * 0.84 - j * (bodyH / segmentsH);

        physics.particles[idx].position.set(
          Math.sin(angle) * r,
          y,
          Math.cos(angle) * r
        );
        physics.particles[idx].previous.copy(physics.particles[idx].position);
      }
    }

    const geo = this._createBufferGeometry(physics.particles, segmentsW, segmentsH, true);
    const mat = this._createClothMaterial(color, 0.6);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return {
      mesh,
      physics,
      segmentsW,
      segmentsH,
      colliderExclude: [],
      name: 'T恤'
    };
  }

  // ============ 连衣裙 ============
  _createDress(h, b, color) {
    const shoulderW = 0.36 + b * 0.08;
    const segmentsW = 28;
    const segmentsH = 50;

    const physics = new ClothPhysics();

    // 创建圆台网格
    const cols = segmentsW + 1;
    physics.particles = [];
    physics.constraints = [];
    physics.fixedPoints = [];

    const topR = shoulderW * 0.52;
    const botR = shoulderW * 0.8;
    const dressH = h * 0.58;

    for (let j = 0; j <= segmentsH; j++) {
      for (let i = 0; i <= segmentsW; i++) {
        const t = i / segmentsW;
        const angle = t * Math.PI * 2;
        const frac = j / segmentsH;
        const r = topR + (botR - topR) * frac + 0.02;
        const y = h * 0.82 - frac * dressH;

        const pos = new THREE.Vector3(
          Math.sin(angle) * r,
          y,
          Math.cos(angle) * r
        );
        physics.particles.push({
          position: pos.clone(),
          previous: pos.clone(),
          acceleration: new THREE.Vector3(),
          mass: 1.0,
          pinned: false
        });
      }
    }

    // 网格间距
    const stepH = dressH / segmentsH;
    const stepW = ((topR + botR) / 2) * Math.PI * 2 / segmentsW;

    // 结构约束
    for (let j = 0; j <= segmentsH; j++) {
      for (let i = 0; i <= segmentsW; i++) {
        const idx = j * cols + i;
        if (i < segmentsW) physics._addConstraint(idx, idx + 1, stepW);
        if (j < segmentsH) physics._addConstraint(idx, idx + cols, stepH);
      }
    }
    // 剪切约束
    const diagLen = Math.sqrt(stepW * stepW + stepH * stepH);
    for (let j = 0; j < segmentsH; j++) {
      for (let i = 0; i < segmentsW; i++) {
        const idx = j * cols + i;
        physics._addConstraint(idx, idx + cols + 1, diagLen, 'shear');
        physics._addConstraint(idx + 1, idx + cols, diagLen, 'shear');
      }
    }
    // 弯曲约束
    for (let j = 0; j <= segmentsH; j++) {
      for (let i = 0; i <= segmentsW; i++) {
        const idx = j * cols + i;
        if (i + 2 <= segmentsW) physics._addConstraint(idx, idx + 2, stepW * 2, 'bend');
        if (j + 2 <= segmentsH) physics._addConstraint(idx, idx + cols * 2, stepH * 2, 'bend');
      }
    }

    // 固定肩部
    for (let i = 0; i <= segmentsW; i++) {
      physics.pinParticle(i);
    }

    const geo = this._createBufferGeometry(physics.particles, segmentsW, segmentsH, true);
    const mat = this._createClothMaterial(color, 0.8);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return { mesh, physics, segmentsW, segmentsH, colliderExclude: [], name: '连衣裙' };
  }

  // ============ 夹克 ============
  _createJacket(h, b, color) {
    const shoulderW = 0.36 + b * 0.08;
    const segmentsW = 30;
    const segmentsH = 46;

    const physics = new ClothPhysics();
    const topR = shoulderW * 0.58;
    const jacketH = h * 0.44;
    const cols = segmentsW + 1;

    physics.particles = [];
    physics.constraints = [];
    physics.fixedPoints = [];

    for (let j = 0; j <= segmentsH; j++) {
      for (let i = 0; i <= segmentsW; i++) {
        const t = i / segmentsW;
        const angle = t * Math.PI * 2;
        const r = topR + 0.04;
        const y = h * 0.83 - j * (jacketH / segmentsH);

        const pos = new THREE.Vector3(
          Math.sin(angle) * r,
          y,
          Math.cos(angle) * r
        );
        physics.particles.push({
          position: pos.clone(),
          previous: pos.clone(),
          acceleration: new THREE.Vector3(),
          mass: 1.0,
          pinned: false
        });
      }
    }

    const stepH = jacketH / segmentsH;
    const stepW = topR * Math.PI * 2 / segmentsW;

    for (let j = 0; j <= segmentsH; j++) {
      for (let i = 0; i <= segmentsW; i++) {
        const idx = j * cols + i;
        if (i < segmentsW) physics._addConstraint(idx, idx + 1, stepW);
        if (j < segmentsH) physics._addConstraint(idx, idx + cols, stepH);
      }
    }
    const diagLen = Math.sqrt(stepW * stepW + stepH * stepH);
    for (let j = 0; j < segmentsH; j++) {
      for (let i = 0; i < segmentsW; i++) {
        const idx = j * cols + i;
        physics._addConstraint(idx, idx + cols + 1, diagLen, 'shear');
        physics._addConstraint(idx + 1, idx + cols, diagLen, 'shear');
      }
    }
    for (let j = 0; j <= segmentsH; j++) {
      for (let i = 0; i <= segmentsW; i++) {
        const idx = j * cols + i;
        if (i + 2 <= segmentsW) physics._addConstraint(idx, idx + 2, stepW * 2, 'bend');
        if (j + 2 <= segmentsH) physics._addConstraint(idx, idx + cols * 2, stepH * 2, 'bend');
      }
    }

    for (let i = 0; i <= segmentsW; i++) {
      physics.pinParticle(i);
    }

    const geo = this._createBufferGeometry(physics.particles, segmentsW, segmentsH, true);
    const mat = this._createClothMaterial(color, 0.75, true);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return { mesh, physics, segmentsW, segmentsH, colliderExclude: [], name: '夹克' };
  }

  // ============ 半裙 ============
  _createSkirt(h, b, color) {
    const hipW = 0.28 + b * 0.1;
    const segmentsW = 26;
    const segmentsH = 40;

    const physics = new ClothPhysics();
    const topR = hipW * 0.52;
    const botR = hipW * 0.75;
    const skirtH = h * 0.4;
    const cols = segmentsW + 1;

    physics.particles = [];
    physics.constraints = [];
    physics.fixedPoints = [];

    for (let j = 0; j <= segmentsH; j++) {
      for (let i = 0; i <= segmentsW; i++) {
        const t = i / segmentsW;
        const angle = t * Math.PI * 2;
        const frac = j / segmentsH;
        const r = topR + (botR - topR) * frac + 0.02;
        const y = h * 0.55 - frac * skirtH;

        const pos = new THREE.Vector3(
          Math.sin(angle) * r,
          y,
          Math.cos(angle) * r
        );
        physics.particles.push({
          position: pos.clone(),
          previous: pos.clone(),
          acceleration: new THREE.Vector3(),
          mass: 1.0,
          pinned: false
        });
      }
    }

    const stepH = skirtH / segmentsH;
    const stepW = ((topR + botR) / 2) * Math.PI * 2 / segmentsW;

    for (let j = 0; j <= segmentsH; j++) {
      for (let i = 0; i <= segmentsW; i++) {
        const idx = j * cols + i;
        if (i < segmentsW) physics._addConstraint(idx, idx + 1, stepW);
        if (j < segmentsH) physics._addConstraint(idx, idx + cols, stepH);
      }
    }
    const diagLen = Math.sqrt(stepW * stepW + stepH * stepH);
    for (let j = 0; j < segmentsH; j++) {
      for (let i = 0; i < segmentsW; i++) {
        const idx = j * cols + i;
        physics._addConstraint(idx, idx + cols + 1, diagLen, 'shear');
        physics._addConstraint(idx + 1, idx + cols, diagLen, 'shear');
      }
    }
    for (let j = 0; j <= segmentsH; j++) {
      for (let i = 0; i <= segmentsW; i++) {
        const idx = j * cols + i;
        if (i + 2 <= segmentsW) physics._addConstraint(idx, idx + 2, stepW * 2, 'bend');
        if (j + 2 <= segmentsH) physics._addConstraint(idx, idx + cols * 2, stepH * 2, 'bend');
      }
    }

    // 固定腰部 (第0行)
    for (let i = 0; i <= segmentsW; i++) {
      physics.pinParticle(i);
    }

    const geo = this._createBufferGeometry(physics.particles, segmentsW, segmentsH, true);
    const mat = this._createClothMaterial(color, 0.75);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return { mesh, physics, segmentsW, segmentsH, colliderExclude: [], name: '半裙' };
  }

  // ============ 长裤 ============
  _createPants(h, b, color) {
    const hipW = 0.28 + b * 0.1;
    const segmentsW = 24;
    const segH = 44;
    const legSpacing = hipW * 0.22;
    const legR = hipW * 0.25;
    const pantsH = h * 0.53;

    const physics = new ClothPhysics();
    physics.particles = [];
    physics.constraints = [];
    physics.fixedPoints = [];

    const colsL = Math.floor(segmentsW / 2) + 1;
    const colsR = colsL;
    const totalCols = colsL + colsR;

    // 左腿粒子
    for (let j = 0; j <= segH; j++) {
      for (let i = 0; i < colsL; i++) {
        const t = i / (colsL - 1);
        const angle = t * Math.PI * 2;
        const frac = j / segH;
        const r = legR + 0.015;
        const y = h * 0.60 - frac * pantsH;

        physics.particles.push({
          position: new THREE.Vector3(
            Math.sin(angle) * r - legSpacing,
            y,
            Math.cos(angle) * r
          ),
          previous: new THREE.Vector3(
            Math.sin(angle) * r - legSpacing,
            y,
            Math.cos(angle) * r
          ),
          acceleration: new THREE.Vector3(),
          mass: 1.0,
          pinned: false
        });
      }
    }

    // 右腿粒子
    for (let j = 0; j <= segH; j++) {
      for (let i = 0; i < colsR; i++) {
        const t = i / (colsR - 1);
        const angle = t * Math.PI * 2;
        const frac = j / segH;
        const r = legR + 0.015;
        const y = h * 0.60 - frac * pantsH;

        physics.particles.push({
          position: new THREE.Vector3(
            Math.sin(angle) * r + legSpacing,
            y,
            Math.cos(angle) * r
          ),
          previous: new THREE.Vector3(
            Math.sin(angle) * r + legSpacing,
            y,
            Math.cos(angle) * r
          ),
          acceleration: new THREE.Vector3(),
          mass: 1.0,
          pinned: false
        });
      }
    }

    const stepH = pantsH / segH;
    const stepW = legR * Math.PI * 2 / (colsL - 1);
    const diagLen = Math.sqrt(stepW * stepW + stepH * stepH);

    // 左腿约束
    this._addLegConstraints(physics, 0, colsL, colsL, segH, stepW, stepH, diagLen);
    // 右腿约束
    this._addLegConstraints(physics, (segH + 1) * colsL, colsR, colsR, segH, stepW, stepH, diagLen);

    // 固定腰部行（两条腿的第0行）
    for (let i = 0; i < colsL; i++) physics.pinParticle(i);
    for (let i = 0; i < colsR; i++) physics.pinParticle((segH + 1) * colsL + i);

    // 生成两个管子的几何体
    const geo = new THREE.BufferGeometry();
    const leftVerts = this._generateTubeIndices(colsL, segH);
    const rightVerts = this._generateTubeIndices(colsR, segH, (segH + 1) * colsL);

    const indices = leftVerts.concat(rightVerts);
    const posArr = new Float32Array(physics.particles.length * 3);
    const uvs = new Float32Array(physics.particles.length * 2);

    for (let i = 0; i < physics.particles.length; i++) {
      posArr[i * 3] = physics.particles[i].position.x;
      posArr[i * 3 + 1] = physics.particles[i].position.y;
      posArr[i * 3 + 2] = physics.particles[i].position.z;
    }

    // UVs
    for (let leg = 0; leg < 2; leg++) {
      const offset = leg * (segH + 1) * colsL;
      const c = leg === 0 ? colsL : colsR;
      for (let j = 0; j <= segH; j++) {
        for (let i = 0; i < c; i++) {
          const idx = offset + j * c + i;
          uvs[idx * 2] = i / (c - 1);
          uvs[idx * 2 + 1] = j / segH;
        }
      }
    }

    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mat = this._createClothMaterial(color, 0.7);
    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return { mesh, physics, segmentsW: totalCols, segmentsH: segH, colliderExclude: [], name: '长裤', isPants: true, colsL, colsR };
  }

  _addLegConstraints(physics, startIdx, cols, actualCols, segH, stepW, stepH, diagLen) {
    for (let j = 0; j <= segH; j++) {
      for (let i = 0; i < cols; i++) {
        const idx = startIdx + j * cols + i;
        if (i < cols - 1) physics._addConstraint(idx, idx + 1, stepW);
        if (j < segH) physics._addConstraint(idx, idx + cols, stepH);
      }
    }
    for (let j = 0; j < segH; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const idx = startIdx + j * cols + i;
        physics._addConstraint(idx, idx + cols + 1, diagLen, 'shear');
        physics._addConstraint(idx + 1, idx + cols, diagLen, 'shear');
      }
    }
    for (let j = 0; j <= segH; j++) {
      for (let i = 0; i < cols; i++) {
        const idx = startIdx + j * cols + i;
        if (i + 2 < cols) physics._addConstraint(idx, idx + 2, stepW * 2, 'bend');
        if (j + 2 <= segH) physics._addConstraint(idx, idx + cols * 2, stepH * 2, 'bend');
      }
    }
  }

  _generateTubeIndices(cols, segH, offset = 0) {
    const indices = [];
    for (let j = 0; j < segH; j++) {
      for (let i = 0; i < cols - 1; i++) {
        const a = offset + j * cols + i;
        const b = a + 1;
        const c = a + cols;
        const d = c + 1;
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }
    return indices;
  }

  // ============ 工具方法 ============

  _createBufferGeometry(particles, segmentsW, segmentsH, closed = false) {
    const cols = segmentsW + 1;
    const vertCount = particles.length;
    const posArr = new Float32Array(vertCount * 3);
    const uvs = new Float32Array(vertCount * 2);

    for (let i = 0; i < vertCount; i++) {
      posArr[i * 3] = particles[i].position.x;
      posArr[i * 3 + 1] = particles[i].position.y;
      posArr[i * 3 + 2] = particles[i].position.z;
    }

    for (let j = 0; j <= segmentsH; j++) {
      for (let i = 0; i <= segmentsW; i++) {
        const idx = j * cols + i;
        uvs[idx * 2] = i / segmentsW;
        uvs[idx * 2 + 1] = j / segmentsH;
      }
    }

    const indices = [];
    for (let j = 0; j < segmentsH; j++) {
      for (let i = 0; i < segmentsW; i++) {
        const a = j * cols + i;
        const b = a + 1;
        const c = a + cols;
        const d = c + 1;
        indices.push(a, c, b);
        indices.push(b, c, d);
      }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(posArr, 3));
    geo.setAttribute('uv', new THREE.BufferAttribute(uvs, 2));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return geo;
  }

  _createClothMaterial(color, opacity = 1.0, isJacket = false) {
    return new THREE.MeshStandardMaterial({
      color: color,
      roughness: isJacket ? 0.8 : 0.65,
      metalness: isJacket ? 0.05 : 0.0,
      side: THREE.DoubleSide,
      transparent: opacity < 1.0,
      opacity: opacity,
      emissive: new THREE.Color(color).multiplyScalar(0.05),
      emissiveIntensity: 0.2
    });
  }

  // 更新几何体顶点位置
  updateGeometry(garment) {
    if (!garment || !garment.mesh) return;

    const positions = garment.mesh.geometry.attributes.position.array;
    const particles = garment.physics.particles;

    for (let i = 0; i < particles.length; i++) {
      positions[i * 3] = particles[i].position.x;
      positions[i * 3 + 1] = particles[i].position.y;
      positions[i * 3 + 2] = particles[i].position.z;
    }

    garment.mesh.geometry.attributes.position.needsUpdate = true;
    garment.mesh.geometry.computeVertexNormals();
  }

  // 更新服装颜色
  updateColor(garment, color) {
    if (garment && garment.mesh) {
      garment.mesh.material.color.setHex(color);
      garment.mesh.material.emissive.setHex(color);
      garment.mesh.material.emissive.multiplyScalar(0.05);
    }
  }
}

window.GarmentFactory = GarmentFactory;
