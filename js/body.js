import * as THREE from 'three';

export function createBody(scene) {
  const material = new THREE.MeshStandardMaterial({ color: 0xddccaa, roughness: 0.4 });
  const group = new THREE.Group();

  const parts = [
    // head
    { a: new THREE.Vector3(0, 1.6, 0), b: new THREE.Vector3(0, 1.72, 0), r: 0.11 },
    // neck
    { a: new THREE.Vector3(0, 1.52, 0), b: new THREE.Vector3(0, 1.6, 0), r: 0.075 },
    // torso
    { a: new THREE.Vector3(0, 1.0, 0), b: new THREE.Vector3(0, 1.52, 0), r: 0.175 },
    // left arm
    { a: new THREE.Vector3(-0.22, 1.48, 0), b: new THREE.Vector3(-0.38, 1.22, 0), r: 0.065 },
    { a: new THREE.Vector3(-0.38, 1.22, 0), b: new THREE.Vector3(-0.45, 0.92, 0), r: 0.055 },
    // right arm
    { a: new THREE.Vector3(0.22, 1.48, 0), b: new THREE.Vector3(0.38, 1.22, 0), r: 0.065 },
    { a: new THREE.Vector3(0.38, 1.22, 0), b: new THREE.Vector3(0.45, 0.92, 0), r: 0.055 },
    // left leg
    { a: new THREE.Vector3(-0.11, 1.0, 0), b: new THREE.Vector3(-0.14, 0.55, 0), r: 0.085 },
    { a: new THREE.Vector3(-0.14, 0.55, 0), b: new THREE.Vector3(-0.14, 0.1, 0), r: 0.075 },
    // right leg
    { a: new THREE.Vector3(0.11, 1.0, 0), b: new THREE.Vector3(0.14, 0.55, 0), r: 0.085 },
    { a: new THREE.Vector3(0.14, 0.55, 0), b: new THREE.Vector3(0.14, 0.1, 0), r: 0.075 },
  ];

  const colliders = [];

  for (const p of parts) {
    const len = p.a.distanceTo(p.b);
    const geo = new THREE.CapsuleGeometry(p.r, len, 4, 8);
    const mesh = new THREE.Mesh(geo, material);
    mesh.position.copy(p.a).add(p.b).multiplyScalar(0.5);
    mesh.lookAt(p.b);
    mesh.rotateX(Math.PI / 2);
    mesh.castShadow = true;
    mesh.receiveShadow = true;
    group.add(mesh);
    colliders.push({ a: p.a.clone(), b: p.b.clone(), radius: p.r });
  }

  scene.add(group);
  return colliders;
}
