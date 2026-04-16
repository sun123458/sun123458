import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { createBody } from './body.js';
import { GARMENTS } from './garments.js';
import './ui.js';

let scene, camera, renderer, controls;
let bodyColliders = [];
let garmentPieces = [];
let currentGarment = 'tshirt';
let windStrength = 0.3;
let autoRotate = false;
const clock = new THREE.Clock();

export function initApp() {
  const container = document.body;

  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x222222);
  scene.fog = new THREE.Fog(0x222222, 3, 10);

  camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
  camera.position.set(0, 1.4, 2.8);

  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  container.appendChild(renderer.domElement);

  controls = new OrbitControls(camera, renderer.domElement);
  controls.target.set(0, 1.1, 0);
  controls.enableDamping = true;
  controls.dampingFactor = 0.05;
  controls.autoRotate = false;
  controls.autoRotateSpeed = 2.0;
  controls.maxPolarAngle = Math.PI / 2 - 0.05;
  controls.minDistance = 1.5;
  controls.maxDistance = 5;

  const ambient = new THREE.AmbientLight(0xffffff, 0.5);
  scene.add(ambient);

  const dir = new THREE.DirectionalLight(0xffffff, 1.2);
  dir.position.set(2, 4, 3);
  dir.castShadow = true;
  dir.shadow.mapSize.width = 1024;
  dir.shadow.mapSize.height = 1024;
  dir.shadow.bias = -0.0005;
  scene.add(dir);

  const backLight = new THREE.DirectionalLight(0xffffff, 0.4);
  backLight.position.set(-2, 3, -3);
  scene.add(backLight);

  const ground = new THREE.Mesh(
    new THREE.PlaneGeometry(20, 20),
    new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.8, metalness: 0.2 })
  );
  ground.rotation.x = -Math.PI / 2;
  ground.receiveShadow = true;
  scene.add(ground);

  bodyColliders = createBody(scene);
  loadGarment('tshirt');

  window.addEventListener('resize', onWindowResize);

  const loading = document.getElementById('loading');
  if (loading) loading.classList.add('hidden');

  animate();
}

function loadGarment(key) {
  for (const p of garmentPieces) {
    scene.remove(p.mesh);
    p.geometry.dispose();
    p.material.dispose();
  }
  garmentPieces = [];

  const builder = GARMENTS[key];
  if (!builder) return;
  garmentPieces = builder.build();
  for (const p of garmentPieces) {
    scene.add(p.mesh);
  }
  currentGarment = key;
}

export function switchGarment(key) {
  if (key === currentGarment) return;
  loadGarment(key);
}

export function toggleAutoRotate() {
  autoRotate = !autoRotate;
  controls.autoRotate = autoRotate;
  return autoRotate;
}

export function resetCamera() {
  controls.reset();
  camera.position.set(0, 1.4, 2.8);
  controls.target.set(0, 1.1, 0);
}

function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

function animate() {
  requestAnimationFrame(animate);

  const dt = Math.min(clock.getDelta(), 0.05);
  const steps = 4;
  const subDt = dt / steps;

  for (let s = 0; s < steps; s++) {
    for (const piece of garmentPieces) {
      piece.update(subDt, bodyColliders, windStrength);
    }
  }

  controls.update();
  renderer.render(scene, camera);
}

initApp();
