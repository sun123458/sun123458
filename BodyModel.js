// BodyModel.js - 参数化人体模型
class BodyModel {
  constructor(scene, params = {}) {
    this.scene = scene;
    this.height = params.height || 1.75;    // 身高 (米)
    this.build = params.build || 0.5;       // 胖瘦 0-1
    this.group = new THREE.Group();
    this.colliders = [];
    this.meshes = [];

    this._build();
    scene.add(this.group);
  }

  _build() {
    // 清除旧模型（释放几何体和材质）
    while (this.group.children.length) {
      const child = this.group.children[0];
      this.group.remove(child);
      if (child.geometry) child.geometry.dispose();
      if (child.material) child.material.dispose();
      // 处理 Group 子对象
      if (child.children) {
        child.children.forEach(c => {
          if (c.geometry) c.geometry.dispose();
          if (c.material) c.material.dispose();
        });
      }
    }
    this.meshes = [];
    this.colliders = [];

    const h = this.height;
    const b = this.build;

    // 体型参数
    const shoulderW = 0.36 + b * 0.08;   // 肩宽
    const chestD = 0.18 + b * 0.06;       // 胸厚
    const waistW = 0.24 + b * 0.1;        // 腰宽
    const hipW = 0.28 + b * 0.1;          // 臀宽
    const headR = 0.1;
    const neckR = 0.045;

    // ---- 躯干 (LatheGeometry) ----
    const torsoProfile = this._createTorsoProfile(h, shoulderW, chestD, waistW, hipW);
    const torsoGeo = new THREE.LatheGeometry(torsoProfile, 24);
    const skinMat = this._createSkinMaterial();
    const torsoMesh = new THREE.Mesh(torsoGeo, skinMat);
    torsoMesh.castShadow = true;
    torsoMesh.receiveShadow = true;
    this.group.add(torsoMesh);
    this.meshes.push(torsoMesh);

    // 躯干碰撞体 - 胶囊体近似
    const torsoHalf = h * 0.32;
    this.colliders.push({
      type: 'capsule',
      p1: new THREE.Vector3(0, h * 0.42, 0),
      p2: new THREE.Vector3(0, h * 0.62, 0),
      radius: shoulderW * 0.55
    });
    this.colliders.push({
      type: 'capsule',
      p1: new THREE.Vector3(0, h * 0.62, 0),
      p2: new THREE.Vector3(0, h * 0.82, 0),
      radius: waistW * 0.6
    });
    this.colliders.push({
      type: 'capsule',
      p1: new THREE.Vector3(0, h * 0.82, 0),
      p2: new THREE.Vector3(0, h * 0.95, 0),
      radius: hipW * 0.55
    });

    // ---- 头部 ----
    const headGeo = new THREE.SphereGeometry(headR, 16, 12);
    const headMesh = new THREE.Mesh(headGeo, skinMat);
    headMesh.position.set(0, h * 0.94, 0);
    headMesh.castShadow = true;
    this.group.add(headMesh);
    this.meshes.push(headMesh);

    this.colliders.push({
      type: 'sphere',
      center: new THREE.Vector3(0, h * 0.94, 0),
      radius: headR + 0.01
    });

    // ---- 颈部 ----
    const neckGeo = new THREE.CylinderGeometry(neckR, neckR * 1.1, h * 0.06, 12);
    const neckMesh = new THREE.Mesh(neckGeo, skinMat);
    neckMesh.position.set(0, h * 0.87, 0);
    neckMesh.castShadow = true;
    this.group.add(neckMesh);
    this.meshes.push(neckMesh);

    // ---- 手臂 ----
    const armLen = h * 0.35;
    const upperArmR = 0.04 + b * 0.02;
    const lowerArmR = 0.035 + b * 0.015;

    // 左臂
    this._createLimb(-shoulderW * 0.95, h * 0.80, 0, -0.15, -armLen, 0, upperArmR, lowerArmR, skinMat);
    // 右臂
    this._createLimb(shoulderW * 0.95, h * 0.80, 0, 0.15, -armLen, 0, upperArmR, lowerArmR, skinMat);

    // 手臂碰撞体
    this.colliders.push({
      type: 'capsule',
      p1: new THREE.Vector3(-shoulderW * 0.95, h * 0.80, 0),
      p2: new THREE.Vector3(-shoulderW * 0.95 - 0.08, h * 0.80 - armLen * 0.5, 0),
      radius: upperArmR + 0.02
    });
    this.colliders.push({
      type: 'capsule',
      p1: new THREE.Vector3(-shoulderW * 0.95 - 0.08, h * 0.80 - armLen * 0.5, 0),
      p2: new THREE.Vector3(-shoulderW * 0.95 - 0.15, h * 0.80 - armLen, 0),
      radius: lowerArmR + 0.02
    });
    this.colliders.push({
      type: 'capsule',
      p1: new THREE.Vector3(shoulderW * 0.95, h * 0.80, 0),
      p2: new THREE.Vector3(shoulderW * 0.95 + 0.08, h * 0.80 - armLen * 0.5, 0),
      radius: upperArmR + 0.02
    });
    this.colliders.push({
      type: 'capsule',
      p1: new THREE.Vector3(shoulderW * 0.95 + 0.08, h * 0.80 - armLen * 0.5, 0),
      p2: new THREE.Vector3(shoulderW * 0.95 + 0.15, h * 0.80 - armLen, 0),
      radius: lowerArmR + 0.02
    });

    // ---- 腿 ----
    const legLen = h * 0.45;
    const thighR = 0.065 + b * 0.03;
    const calfR = 0.05 + b * 0.02;
    const legSpacing = hipW * 0.4;

    // 左腿
    this._createLimb(-legSpacing, h * 0.48, 0, 0, -legLen, 0, thighR, calfR, skinMat);
    // 右腿
    this._createLimb(legSpacing, h * 0.48, 0, 0, -legLen, 0, thighR, calfR, skinMat);

    // 腿碰撞体
    this.colliders.push({
      type: 'capsule',
      p1: new THREE.Vector3(-legSpacing, h * 0.48, 0),
      p2: new THREE.Vector3(-legSpacing, h * 0.48 - legLen * 0.5, 0),
      radius: thighR + 0.02
    });
    this.colliders.push({
      type: 'capsule',
      p1: new THREE.Vector3(-legSpacing, h * 0.48 - legLen * 0.5, 0),
      p2: new THREE.Vector3(-legSpacing, h * 0.48 - legLen, 0),
      radius: calfR + 0.02
    });
    this.colliders.push({
      type: 'capsule',
      p1: new THREE.Vector3(legSpacing, h * 0.48, 0),
      p2: new THREE.Vector3(legSpacing, h * 0.48 - legLen * 0.5, 0),
      radius: thighR + 0.02
    });
    this.colliders.push({
      type: 'capsule',
      p1: new THREE.Vector3(legSpacing, h * 0.48 - legLen * 0.5, 0),
      p2: new THREE.Vector3(legSpacing, h * 0.48 - legLen, 0),
      radius: calfR + 0.02
    });

    // 关节碰撞球
    this.colliders.push({ type: 'sphere', center: new THREE.Vector3(-shoulderW * 0.95, h * 0.80, 0), radius: upperArmR + 0.03 });
    this.colliders.push({ type: 'sphere', center: new THREE.Vector3(shoulderW * 0.95, h * 0.80, 0), radius: upperArmR + 0.03 });
    this.colliders.push({ type: 'sphere', center: new THREE.Vector3(-legSpacing, h * 0.48, 0), radius: thighR + 0.02 });
    this.colliders.push({ type: 'sphere', center: new THREE.Vector3(legSpacing, h * 0.48, 0), radius: thighR + 0.02 });
  }

  _createTorsoProfile(h, shoulderW, chestD, waistW, hipW) {
    // 旋转体轮廓 - 从臀部到颈部
    const points = [];
    const hipY = h * 0.42;
    const waistY = h * 0.65;
    const chestY = h * 0.78;
    const shoulderY = h * 0.82;
    const neckY = h * 0.90;

    // 臀部
    points.push(new THREE.Vector2(hipW * 0.5, 0));
    points.push(new THREE.Vector2(hipW * 0.52, h * 0.05));
    points.push(new THREE.Vector2(hipW * 0.48, h * 0.1));

    // 下腰
    points.push(new THREE.Vector2(waistW * 0.48, h * 0.2));
    points.push(new THREE.Vector2(waistW * 0.45, h * 0.35));

    // 上腰
    points.push(new THREE.Vector2(waistW * 0.48, h * 0.45));

    // 胸部扩展
    points.push(new THREE.Vector2(shoulderW * 0.42, h * 0.55));
    points.push(new THREE.Vector2(shoulderW * 0.5, h * 0.62));

    // 肩部
    points.push(new THREE.Vector2(shoulderW * 0.5, h * 0.72));
    points.push(new THREE.Vector2(shoulderW * 0.45, h * 0.78));

    // 收肩到颈部
    points.push(new THREE.Vector2(shoulderW * 0.3, h * 0.83));
    points.push(new THREE.Vector2(0.055, h * 0.88));
    points.push(new THREE.Vector2(0.04, h * 0.90));

    return points;
  }

  _createSkinMaterial() {
    return new THREE.MeshStandardMaterial({
      color: 0xE8B89D,
      roughness: 0.7,
      metalness: 0.0,
      emissive: 0x221108,
      emissiveIntensity: 0.05
    });
  }

  _createLimb(x, y, z, dx, dy, dz, radiusTop, radiusBottom, material) {
    const length = Math.sqrt(dx * dx + dy * dy + dz * dz);
    const rT = Math.max(0.01, radiusTop);
    const rB = Math.max(0.01, radiusBottom);

    // 用圆柱体+两端球体模拟胶囊体 (兼容 r128)
    const group = new THREE.Group();

    const cylGeo = new THREE.CylinderGeometry(rT, rB, Math.max(0.01, length - rT - rB), 12);
    const cylMesh = new THREE.Mesh(cylGeo, material);
    cylMesh.castShadow = true;
    cylMesh.receiveShadow = true;
    group.add(cylMesh);

    // 顶部球体
    const topSphere = new THREE.Mesh(new THREE.SphereGeometry(rT, 12, 8), material);
    topSphere.position.y = (length - rT - rB) * 0.5;
    topSphere.castShadow = true;
    group.add(topSphere);

    // 底部球体
    const botSphere = new THREE.Mesh(new THREE.SphereGeometry(rB, 12, 8), material);
    botSphere.position.y = -(length - rT - rB) * 0.5;
    botSphere.castShadow = true;
    group.add(botSphere);

    group.position.set(x + dx * 0.5, y + dy * 0.5, z + dz * 0.5);

    // 旋转胶囊体对准方向
    const dir = new THREE.Vector3(dx, dy, dz).normalize();
    const up = new THREE.Vector3(0, 1, 0);
    if (Math.abs(dir.dot(up)) < 0.999) {
      const quat = new THREE.Quaternion().setFromUnitVectors(up, dir);
      group.quaternion.copy(quat);
    }

    this.group.add(group);
    this.meshes.push(cylMesh, topSphere, botSphere);
  }

  // 获取固定点位置（肩部、腰部等）
  getShoulderPositions(colCount, y) {
    const positions = [];
    const shoulderW = 0.36 + this.build * 0.08;
    for (let i = 0; i <= colCount; i++) {
      const t = i / colCount;
      const angle = t * Math.PI * 2;
      const r = shoulderW * 0.5;
      positions.push(new THREE.Vector3(
        Math.cos(angle) * r,
        y || this.height * 0.82,
        Math.sin(angle) * r
      ));
    }
    return positions;
  }

  getWaistPositions(colCount) {
    const positions = [];
    const hipW = 0.28 + this.build * 0.1;
    for (let i = 0; i <= colCount; i++) {
      const t = i / colCount;
      const angle = t * Math.PI * 2;
      const r = hipW * 0.48;
      positions.push(new THREE.Vector3(
        Math.cos(angle) * r,
        this.height * 0.42,
        Math.sin(angle) * r
      ));
    }
    return positions;
  }

  // 更新体型参数
  updateParams(params) {
    if (params.height !== undefined) this.height = params.height;
    if (params.build !== undefined) this.build = params.build;
    this._build();
  }

  getColliders() {
    return this.colliders;
  }

  getHeight() {
    return this.height;
  }

  getBuild() {
    return this.build;
  }
}

window.BodyModel = BodyModel;
