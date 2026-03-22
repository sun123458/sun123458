// Mannequin.js - Procedural human body model with collision spheres
class Mannequin {
  constructor(scene) {
    this.group = new THREE.Group();
    this.bodySpheres = []; // for cloth collision
    this.scene = scene;
    this.scale = 1.0;
    this._build();
    scene.add(this.group);
  }

  _build() {
    const skinColor = new THREE.Color(0.85, 0.7, 0.6);
    const skinMat = new THREE.MeshPhysicalMaterial({
      color: skinColor,
      roughness: 0.6,
      metalness: 0.05,
      clearcoat: 0.15,
      clearcoatRoughness: 0.7
    });

    // Body part definitions: {pos, radius, height, type, rotX}
    const parts = [
      // Torso
      { name: 'pelvis', y: 0.0, rTop: 0.16, rBot: 0.14, h: 0.18, rs: 0 },
      { name: 'lowerTorso', y: 0.18, rTop: 0.18, rBot: 0.16, h: 0.20, rs: 0 },
      { name: 'upperTorso', y: 0.38, rTop: 0.20, rBot: 0.18, h: 0.20, rs: 0 },
      { name: 'chest', y: 0.58, rTop: 0.21, rBot: 0.20, h: 0.18, rs: 0 },
      { name: 'shoulders', y: 0.76, rTop: 0.19, rBot: 0.21, h: 0.10, rs: 0 },

      // Neck
      { name: 'neck', y: 0.88, rTop: 0.06, rBot: 0.07, h: 0.12, rs: 0 },

      // Head
      { name: 'head', y: 1.12, rTop: 0.12, rBot: 0.09, h: 0.20, rs: 0 },
    ];

    for (const p of parts) {
      const geo = new THREE.CylinderGeometry(
        Math.max(0.01, p.rTop), Math.max(0.01, p.rBot),
        Math.max(0.01, p.h), 24, 1
      );
      const mesh = new THREE.Mesh(geo, skinMat.clone());
      mesh.position.set(0, p.y + p.h / 2, 0);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      this.group.add(mesh);
    }

    // Arms
    const armDef = [
      { side: -1, name: 'upperArm' },
      { side: 1, name: 'upperArm' },
    ];
    for (const a of armDef) {
      const s = a.side;
      // Shoulder joint sphere
      this._addSphere(s * 0.23, 0.78, 0, 0.065, skinMat);

      // Upper arm
      const uArm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.05, 0.045, 0.28, 16),
        skinMat.clone()
      );
      uArm.position.set(s * 0.27, 0.63, 0);
      uArm.rotation.z = s * 0.12;
      uArm.castShadow = true;
      this.group.add(uArm);

      // Elbow
      this._addSphere(s * 0.30, 0.48, 0, 0.042, skinMat);

      // Forearm
      const forearm = new THREE.Mesh(
        new THREE.CylinderGeometry(0.042, 0.035, 0.26, 16),
        skinMat.clone()
      );
      forearm.position.set(s * 0.32, 0.34, 0.01);
      forearm.rotation.z = s * 0.05;
      forearm.castShadow = true;
      this.group.add(forearm);

      // Hand
      const hand = new THREE.Mesh(
        new THREE.SphereGeometry(0.04, 12, 12),
        skinMat.clone()
      );
      hand.position.set(s * 0.33, 0.19, 0.02);
      hand.scale.set(0.8, 1.2, 0.6);
      hand.castShadow = true;
      this.group.add(hand);
    }

    // Legs
    for (const s of [-1, 1]) {
      // Hip joint
      this._addSphere(s * 0.09, 0.02, 0, 0.08, skinMat);

      // Upper leg
      const uLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.065, 0.42, 20),
        skinMat.clone()
      );
      uLeg.position.set(s * 0.09, -0.23, 0);
      uLeg.castShadow = true;
      this.group.add(uLeg);

      // Knee
      this._addSphere(s * 0.09, -0.44, 0, 0.06, skinMat);

      // Lower leg
      const lLeg = new THREE.Mesh(
        new THREE.CylinderGeometry(0.06, 0.048, 0.42, 20),
        skinMat.clone()
      );
      lLeg.position.set(s * 0.09, -0.66, 0);
      lLeg.castShadow = true;
      this.group.add(lLeg);

      // Ankle
      this._addSphere(s * 0.09, -0.87, 0, 0.04, skinMat);

      // Foot
      const foot = new THREE.Mesh(
        new THREE.BoxGeometry(0.08, 0.04, 0.16),
        skinMat.clone()
      );
      foot.position.set(s * 0.09, -0.9, 0.03);
      foot.castShadow = true;
      this.group.add(foot);
    }

    this._buildCollisionSpheres();
  }

  _addSphere(x, y, z, radius, mat) {
    const mesh = new THREE.Mesh(
      new THREE.SphereGeometry(Math.max(0.01, radius), 16, 16),
      mat.clone()
    );
    mesh.position.set(x, y, z);
    mesh.castShadow = true;
    this.group.add(mesh);
  }

  _buildCollisionSpheres() {
    this.bodySpheres = [
      // Torso spheres
      { center: new THREE.Vector3(0, 0.08, 0), radius: 0.17 },
      { center: new THREE.Vector3(0, 0.28, 0), radius: 0.19 },
      { center: new THREE.Vector3(0, 0.48, 0), radius: 0.21 },
      { center: new THREE.Vector3(0, 0.65, 0), radius: 0.22 },
      { center: new THREE.Vector3(0, 0.80, 0), radius: 0.20 },

      // Shoulders
      { center: new THREE.Vector3(-0.23, 0.78, 0), radius: 0.10 },
      { center: new THREE.Vector3(0.23, 0.78, 0), radius: 0.10 },

      // Arms
      { center: new THREE.Vector3(-0.27, 0.63, 0), radius: 0.07 },
      { center: new THREE.Vector3(0.27, 0.63, 0), radius: 0.07 },
      { center: new THREE.Vector3(-0.30, 0.48, 0), radius: 0.06 },
      { center: new THREE.Vector3(0.30, 0.48, 0), radius: 0.06 },

      // Neck
      { center: new THREE.Vector3(0, 0.92, 0), radius: 0.08 },

      // Hip area
      { center: new THREE.Vector3(-0.08, 0.02, 0), radius: 0.12 },
      { center: new THREE.Vector3(0.08, 0.02, 0), radius: 0.12 },

      // Upper legs
      { center: new THREE.Vector3(-0.09, -0.15, 0), radius: 0.10 },
      { center: new THREE.Vector3(0.09, -0.15, 0), radius: 0.10 },
      { center: new THREE.Vector3(-0.09, -0.30, 0), radius: 0.08 },
      { center: new THREE.Vector3(0.09, -0.30, 0), radius: 0.08 },

      // Back
      { center: new THREE.Vector3(0, 0.48, -0.12), radius: 0.14 },
      { center: new THREE.Vector3(0, 0.70, -0.10), radius: 0.14 },
      { center: new THREE.Vector3(0, 0.28, -0.10), radius: 0.13 },

      // Front
      { center: new THREE.Vector3(0, 0.48, 0.12), radius: 0.12 },
      { center: new THREE.Vector3(0, 0.65, 0.11), radius: 0.12 },
    ];

    // Scale collision spheres
    for (const s of this.bodySpheres) {
      s.center.multiplyScalar(this.scale);
      s.radius *= this.scale;
    }
  }

  setScale(scale) {
    this.scale = scale;
    this.group.scale.set(scale, scale, scale);
    this._buildCollisionSpheres();
  }

  toggleWireframe(show) {
    this.group.traverse(child => {
      if (child.isMesh) {
        child.material.wireframe = show;
      }
    });
  }
}
