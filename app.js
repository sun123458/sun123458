import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';

// ============================================================
// Constants & Config
// ============================================================
const GRAVITY = new THREE.Vector3(0, -9.8, 0);
const WIND = new THREE.Vector3(0.3, 0, 0.15);
const SUB_STEPS = 4;
const CONSTRAINT_ITERATIONS = 8;
const CLOTH_RES_W = 30;
const CLOTH_RES_H = 30;
const DAMPING = 0.97;
const SKIN_COLOR = 0xf5c5a3;
const HAIR_COLOR = 0x2c1810;

// ============================================================
// Outfit Definitions
// ============================================================
const OUTFIT_DEFS = [
    {
        name: '经典T恤',
        defaultColor: '#e74c3c',
        stiffness: 0.8,
        gravityScale: 1.0,
        // cloth mesh dimensions and offsets
        clothWidth: 1.2,
        clothHeight: 0.9,
        offsetY: 1.15,
        sleeveLen: 0.18,
        sleeveWidth: 0.35,
        type: 'tshirt'
    },
    {
        name: '休闲衬衫',
        defaultColor: '#3498db',
        stiffness: 0.7,
        gravityScale: 0.9,
        clothWidth: 1.3,
        clothHeight: 1.1,
        offsetY: 1.25,
        sleeveLen: 0.55,
        sleeveWidth: 0.25,
        type: 'shirt'
    },
    {
        name: '连衣裙',
        defaultColor: '#9b59b6',
        stiffness: 0.5,
        gravityScale: 1.2,
        clothWidth: 1.0,
        clothHeight: 1.8,
        offsetY: 1.0,
        sleeveLen: 0.02,
        sleeveWidth: 0.15,
        type: 'dress'
    },
    {
        name: '运动卫衣',
        defaultColor: '#2ecc71',
        stiffness: 0.6,
        gravityScale: 0.8,
        clothWidth: 1.5,
        clothHeight: 1.15,
        offsetY: 1.2,
        sleeveLen: 0.45,
        sleeveWidth: 0.35,
        type: 'hoodie'
    },
    {
        name: '正式西装',
        defaultColor: '#2c3e50',
        stiffness: 0.95,
        gravityScale: 0.7,
        clothWidth: 1.35,
        clothHeight: 1.2,
        offsetY: 1.25,
        sleeveLen: 0.55,
        sleeveWidth: 0.22,
        type: 'blazer'
    }
];

// ============================================================
// Scene Setup
// ============================================================
const canvas = document.getElementById('viewport');
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;
renderer.shadowMap.type = THREE.PCFSoftShadowMap;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = 1.1;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x12121a);
scene.fog = new THREE.Fog(0x12121a, 8, 18);

const camera = new THREE.PerspectiveCamera(45, window.innerWidth / window.innerHeight, 0.1, 100);
camera.position.set(0, 1.2, 4);

const controls = new OrbitControls(camera, canvas);
controls.target.set(0, 1, 0);
controls.enableDamping = true;
controls.dampingFactor = 0.08;
controls.minDistance = 2;
controls.maxDistance = 8;
controls.maxPolarAngle = Math.PI * 0.85;
controls.minPolarAngle = Math.PI * 0.15;
controls.update();

// ============================================================
// Lighting
// ============================================================
const ambientLight = new THREE.AmbientLight(0x404060, 0.6);
scene.add(ambientLight);

const hemiLight = new THREE.HemisphereLight(0xffffff, 0x444466, 0.8);
scene.add(hemiLight);

const keyLight = new THREE.DirectionalLight(0xfff0e0, 1.5);
keyLight.position.set(3, 5, 4);
keyLight.castShadow = true;
keyLight.shadow.mapSize.set(1024, 1024);
keyLight.shadow.camera.near = 0.5;
keyLight.shadow.camera.far = 15;
keyLight.shadow.camera.left = -3;
keyLight.shadow.camera.right = 3;
keyLight.shadow.camera.top = 3;
keyLight.shadow.camera.bottom = -1;
keyLight.shadow.bias = -0.001;
scene.add(keyLight);

const fillLight = new THREE.DirectionalLight(0xe0e8ff, 0.5);
fillLight.position.set(-3, 3, -2);
scene.add(fillLight);

const rimLight = new THREE.PointLight(0xffffff, 0.3, 10);
rimLight.position.set(-1, 3, -3);
scene.add(rimLight);

// ============================================================
// Ground
// ============================================================
const groundGeo = new THREE.CircleGeometry(5, 64);
const groundMat = new THREE.MeshStandardMaterial({
    color: 0x18181f,
    roughness: 0.8,
    metalness: 0.2
});
const ground = new THREE.Mesh(groundGeo, groundMat);
ground.rotation.x = -Math.PI / 2;
ground.receiveShadow = true;
scene.add(ground);

// Platform ring
const ringGeo = new THREE.RingGeometry(0.8, 0.85, 64);
const ringMat = new THREE.MeshBasicMaterial({ color: 0x333344, side: THREE.DoubleSide });
const ring = new THREE.Mesh(ringGeo, ringMat);
ring.rotation.x = -Math.PI / 2;
ring.position.y = 0.001;
scene.add(ring);

// ============================================================
// Procedural Human Model
// ============================================================
function createHumanModel() {
    const group = new THREE.Group();
    const skinMat = new THREE.MeshStandardMaterial({
        color: SKIN_COLOR,
        roughness: 0.7,
        metalness: 0.05
    });
    const hairMat = new THREE.MeshStandardMaterial({
        color: HAIR_COLOR,
        roughness: 0.9,
        metalness: 0.0
    });
    const shoeMat = new THREE.MeshStandardMaterial({
        color: 0x222222,
        roughness: 0.5,
        metalness: 0.1
    });
    const pantsMat = new THREE.MeshStandardMaterial({
        color: 0x1a1a2e,
        roughness: 0.8,
        metalness: 0.05
    });

    function makeLimb(radiusTop, radiusBot, height, pos, rotZ = 0) {
        const geo = new THREE.CylinderGeometry(radiusTop, radiusBot, height, 12);
        const mesh = new THREE.Mesh(geo, skinMat);
        mesh.position.set(pos[0], pos[1], pos[2]);
        mesh.rotation.z = rotZ;
        mesh.castShadow = true;
        return mesh;
    }

    function makeCapsule(radius, height, pos) {
        const group = new THREE.Group();
        const cylGeo = new THREE.CylinderGeometry(radius, radius, height, 16);
        const cyl = new THREE.Mesh(cylGeo, skinMat);
        cyl.castShadow = true;
        group.add(cyl);
        const sphereGeo = new THREE.SphereGeometry(radius, 16, 12);
        const top = new THREE.Mesh(sphereGeo, skinMat);
        top.position.y = height / 2;
        top.castShadow = true;
        group.add(top);
        const bot = new THREE.Mesh(sphereGeo, skinMat);
        bot.position.y = -height / 2;
        bot.castShadow = true;
        group.add(bot);
        group.position.set(pos[0], pos[1], pos[2]);
        return group;
    }

    // Torso using LatheGeometry
    const torsoPoints = [];
    const torsoSegs = 20;
    for (let i = 0; i <= torsoSegs; i++) {
        const t = i / torsoSegs;
        let r;
        if (t < 0.15) {
            r = 0.12 + t * 2.0; // waist to rib
        } else if (t < 0.5) {
            r = 0.42 - (t - 0.15) * 0.3; // chest
        } else if (t < 0.7) {
            r = 0.315 + (t - 0.5) * 0.2; // shoulder area
        } else {
            r = 0.355; // neck base
        }
        const y = t * 0.9 + 0.45; // from hip to neck
        torsoPoints.push(new THREE.Vector2(r, y));
    }
    const torsoGeo = new THREE.LatheGeometry(torsoPoints, 24);
    const torso = new THREE.Mesh(torsoGeo, skinMat);
    torso.castShadow = true;
    group.add(torso);

    // Neck
    const neckGeo = new THREE.CylinderGeometry(0.06, 0.09, 0.15, 12);
    const neck = new THREE.Mesh(neckGeo, skinMat);
    neck.position.set(0, 1.42, 0);
    neck.castShadow = true;
    group.add(neck);

    // Head
    const headGeo = new THREE.SphereGeometry(0.14, 20, 16);
    const head = new THREE.Mesh(headGeo, skinMat);
    head.position.set(0, 1.62, 0);
    head.scale.set(1, 1.15, 1);
    head.castShadow = true;
    group.add(head);

    // Hair
    const hairGeo = new THREE.SphereGeometry(0.155, 20, 16, 0, Math.PI * 2, 0, Math.PI * 0.55);
    const hair = new THREE.Mesh(hairGeo, hairMat);
    hair.position.set(0, 1.64, 0);
    hair.scale.set(1.02, 1.1, 1.02);
    group.add(hair);

    // Left upper arm
    const lUpperArm = makeCapsule(0.055, 0.28, [-0.45, 1.15, 0]);
    lUpperArm.rotation.z = 0.15;
    group.add(lUpperArm);

    // Right upper arm
    const rUpperArm = makeCapsule(0.055, 0.28, [0.45, 1.15, 0]);
    rUpperArm.rotation.z = -0.15;
    group.add(rUpperArm);

    // Left forearm
    const lForearm = makeCapsule(0.045, 0.26, [-0.52, 0.85, 0]);
    lForearm.rotation.z = 0.08;
    group.add(lForearm);

    // Right forearm
    const rForearm = makeCapsule(0.045, 0.26, [0.52, 0.85, 0]);
    rForearm.rotation.z = -0.08;
    group.add(rForearm);

    // Left hand
    const handGeo = new THREE.SphereGeometry(0.04, 10, 8);
    const lHand = new THREE.Mesh(handGeo, skinMat);
    lHand.position.set(-0.54, 0.68, 0);
    group.add(lHand);

    // Right hand
    const rHand = new THREE.Mesh(handGeo, skinMat);
    rHand.position.set(0.54, 0.68, 0);
    group.add(rHand);

    // Upper legs (pants)
    const lThighGeo = new THREE.CylinderGeometry(0.085, 0.08, 0.42, 12);
    const lThigh = new THREE.Mesh(lThighGeo, pantsMat);
    lThigh.position.set(-0.13, 0.37, 0);
    lThigh.castShadow = true;
    group.add(lThigh);

    const rThighGeo = new THREE.CylinderGeometry(0.085, 0.08, 0.42, 12);
    const rThigh = new THREE.Mesh(rThighGeo, pantsMat);
    rThigh.position.set(0.13, 0.37, 0);
    rThigh.castShadow = true;
    group.add(rThigh);

    // Lower legs
    const lShinGeo = new THREE.CylinderGeometry(0.07, 0.055, 0.4, 12);
    const lShin = new THREE.Mesh(lShinGeo, pantsMat);
    lShin.position.set(-0.13, 0.0, 0);
    lShin.castShadow = true;
    group.add(lShin);

    const rShinGeo = new THREE.CylinderGeometry(0.07, 0.055, 0.4, 12);
    const rShin = new THREE.Mesh(rShinGeo, pantsMat);
    rShin.position.set(0.13, 0.0, 0);
    rShin.castShadow = true;
    group.add(rShin);

    // Shoes
    const shoeGeo = new THREE.BoxGeometry(0.1, 0.06, 0.18);
    const lShoe = new THREE.Mesh(shoeGeo, shoeMat);
    lShoe.position.set(-0.13, -0.21, 0.02);
    lShoe.castShadow = true;
    group.add(lShoe);

    const rShoe = new THREE.Mesh(shoeGeo, shoeMat);
    rShoe.position.set(0.13, -0.21, 0.02);
    rShoe.castShadow = true;
    group.add(rShoe);

    return group;
}

// ============================================================
// Human Collision Bodies (spheres for cloth collision)
// ============================================================
function createCollisionBodies() {
    // Each: { center: Vector3, radius: number }
    return [
        // Torso main
        { center: new THREE.Vector3(0, 0.85, 0), radius: 0.38 },
        { center: new THREE.Vector3(0, 1.0, 0), radius: 0.36 },
        { center: new THREE.Vector3(0, 1.15, 0), radius: 0.32 },
        // Shoulders
        { center: new THREE.Vector3(-0.38, 1.28, 0), radius: 0.1 },
        { center: new THREE.Vector3(0.38, 1.28, 0), radius: 0.1 },
        // Upper arms
        { center: new THREE.Vector3(-0.45, 1.15, 0), radius: 0.08 },
        { center: new THREE.Vector3(0.45, 1.15, 0), radius: 0.08 },
        { center: new THREE.Vector3(-0.48, 1.02, 0), radius: 0.07 },
        { center: new THREE.Vector3(0.48, 1.02, 0), radius: 0.07 },
        // Forearms
        { center: new THREE.Vector3(-0.52, 0.85, 0), radius: 0.06 },
        { center: new THREE.Vector3(0.52, 0.85, 0), radius: 0.06 },
        { center: new THREE.Vector3(-0.53, 0.73, 0), radius: 0.055 },
        { center: new THREE.Vector3(0.53, 0.73, 0), radius: 0.055 },
        // Neck
        { center: new THREE.Vector3(0, 1.38, 0), radius: 0.08 },
        // Head
        { center: new THREE.Vector3(0, 1.62, 0), radius: 0.16 },
        // Hips
        { center: new THREE.Vector3(-0.12, 0.48, 0), radius: 0.1 },
        { center: new THREE.Vector3(0.12, 0.48, 0), radius: 0.1 },
        // Thighs
        { center: new THREE.Vector3(-0.13, 0.35, 0), radius: 0.09 },
        { center: new THREE.Vector3(0.13, 0.35, 0), radius: 0.09 },
    ];
}

// ============================================================
// Verlet Cloth Physics Engine
// ============================================================
class ClothParticle {
    constructor(x, y, z, mass = 1.0) {
        this.pos = new THREE.Vector3(x, y, z);
        this.prev = new THREE.Vector3(x, y, z);
        this.accel = new THREE.Vector3(0, 0, 0);
        this.mass = mass;
        this.pinned = false;
    }

    addForce(f) {
        this.accel.addScaledVector(f, 1.0 / this.mass);
    }

    integrate(dt) {
        if (this.pinned) return;
        const vel = new THREE.Vector3().subVectors(this.pos, this.prev).multiplyScalar(DAMPING);
        this.prev.copy(this.pos);
        this.pos.add(vel);
        this.pos.addScaledVector(this.accel, dt * dt);
        this.accel.set(0, 0, 0);
    }
}

class ClothConstraint {
    constructor(p1, p2, restLength, stiffness = 1.0) {
        this.p1 = p1;
        this.p2 = p2;
        this.restLength = restLength;
        this.stiffness = stiffness;
    }

    solve() {
        const diff = new THREE.Vector3().subVectors(this.p2.pos, this.p1.pos);
        const dist = Math.max(diff.length(), 0.0001);
        const correction = diff.multiplyScalar((1.0 - this.restLength / dist) * 0.5 * this.stiffness);
        if (!this.p1.pinned) this.p1.pos.add(correction);
        if (!this.p2.pinned) this.p2.pos.sub(correction);
    }
}

class ClothSimulation {
    constructor() {
        this.particles = [];
        this.constraints = [];
        this.collisionBodies = [];
        this.stiffness = 0.8;
        this.gravityScale = 1.0;
        this.windStrength = 1.0;
    }

    createFlatCloth(width, height, resW, resH, originX, originY, originZ) {
        this.particles = [];
        this.constraints = [];

        // Create particles
        for (let j = 0; j <= resH; j++) {
            for (let i = 0; i <= resW; i++) {
                const u = i / resW;
                const v = j / resH;
                const x = (u - 0.5) * width + originX;
                const y = (1.0 - v) * height + originY;
                const z = originZ;
                const p = new ClothParticle(x, y, z);
                this.particles.push(p);
            }
        }

        const addSpring = (idx1, idx2, stiff) => {
            if (idx2 >= 0 && idx2 < this.particles.length) {
                const dist = this.particles[idx1].pos.distanceTo(this.particles[idx2].pos);
                this.constraints.push(new ClothConstraint(
                    this.particles[idx1], this.particles[idx2], dist, stiff
                ));
            }
        };

        // Create constraints: structural, shear, bend
        for (let j = 0; j <= resH; j++) {
            for (let i = 0; i <= resW; i++) {
                const idx = j * (resW + 1) + i;
                // Structural
                if (i < resW) addSpring(idx, idx + 1, this.stiffness);
                if (j < resH) addSpring(idx, idx + resW + 1, this.stiffness);
                // Shear
                if (i < resW && j < resH) {
                    addSpring(idx, idx + resW + 2, this.stiffness * 0.6);
                    addSpring(idx + 1, idx + resW + 1, this.stiffness * 0.6);
                }
                // Bend
                if (i < resW - 1) addSpring(idx, idx + 2, this.stiffness * 0.2);
                if (j < resH - 1) addSpring(idx, idx + (resW + 1) * 2, this.stiffness * 0.2);
            }
        }

        return { resW, resH };
    }

    wrapClothAroundBody(stiffness, startWrapY, endWrapY) {
        // Make particles wrap around body: pin top row, apply position constraints
        const cols = CLOTH_RES_W + 1;
        const rows = CLOTH_RES_H + 1;

        for (let j = 0; j < rows; j++) {
            for (let i = 0; i < cols; i++) {
                const idx = j * cols + i;
                const p = this.particles[idx];
                const v = j / (rows - 1);

                // Top row (shoulder area) — pin the edges
                if (j === 0) {
                    if (i === 0 || i === CLOTH_RES_W) {
                        p.pinned = true;
                    }
                }
            }
        }
    }

    setCollisionBodies(bodies) {
        this.collisionBodies = bodies;
    }

    simulate(dt) {
        const subDt = dt / SUB_STEPS;

        for (let step = 0; step < SUB_STEPS; step++) {
            // Apply forces
            for (const p of this.particles) {
                if (p.pinned) continue;
                p.addForce(GRAVITY.clone().multiplyScalar(this.gravityScale));
                // Wind
                const wind = WIND.clone().multiplyScalar(this.windStrength);
                wind.y += Math.sin(Date.now() * 0.001 + p.pos.x * 3) * 0.5;
                wind.z += Math.cos(Date.now() * 0.0013 + p.pos.y * 2) * 0.4;
                p.addForce(wind);
            }

            // Integrate
            for (const p of this.particles) {
                p.integrate(subDt);
            }

            // Solve constraints
            for (let iter = 0; iter < CONSTRAINT_ITERATIONS; iter++) {
                for (const c of this.constraints) {
                    c.solve();
                }
                // Collision
                this.resolveCollisions();
            }
        }
    }

    resolveCollisions() {
        for (const p of this.particles) {
            if (p.pinned) continue;
            for (const body of this.collisionBodies) {
                const diff = new THREE.Vector3().subVectors(p.pos, body.center);
                const dist = diff.length();
                const minDist = body.radius + 0.02;
                if (dist < minDist && dist > 0.0001) {
                    diff.normalize().multiplyScalar(minDist);
                    p.pos.copy(body.center).add(diff);
                }
            }
            // Floor collision
            if (p.pos.y < 0.0) {
                p.pos.y = 0.0;
            }

            // Keep cloth from going too far inward (fix clipping)
            if (p.pos.y > 0.2 && p.pos.y < 1.7) {
                const bodyCenterDist = Math.sqrt(p.pos.x * p.pos.x + p.pos.z * p.pos.z);
                // Find appropriate body radius at this height
                let bodyR = 0.0;
                for (const body of this.collisionBodies) {
                    const dy = Math.abs(p.pos.y - body.center.y);
                    if (dy < body.radius * 1.5) {
                        bodyR = Math.max(bodyR, body.radius * (1 - dy / (body.radius * 1.5)));
                    }
                }
                const applicableR = bodyR + 0.015;
                if (bodyCenterDist < applicableR && bodyCenterDist > 0.001) {
                    const angle = Math.atan2(p.pos.z, p.pos.x);
                    p.pos.x = Math.cos(angle) * applicableR;
                    p.pos.z = Math.sin(angle) * applicableR;
                }
            }
        }
    }
}

// ============================================================
// Cloth Mesh Builder
// ============================================================
function createClothMesh(simulation, resW, resH, color) {
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array((resW + 1) * (resH + 1) * 3);
    const indices = [];

    // Build indices
    for (let j = 0; j < resH; j++) {
        for (let i = 0; i < resW; i++) {
            const a = j * (resW + 1) + i;
            const b = j * (resW + 1) + i + 1;
            const c = (j + 1) * (resW + 1) + i;
            const d = (j + 1) * (resW + 1) + i + 1;
            indices.push(a, b, d);
            indices.push(a, d, c);
        }
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.7,
        metalness: 0.05,
        side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    mesh.receiveShadow = true;

    return { mesh, geo };
}

function updateClothMesh(geo, particles) {
    const posAttr = geo.getAttribute('position');
    for (let i = 0; i < particles.length; i++) {
        posAttr.setXYZ(i, particles[i].pos.x, particles[i].pos.y, particles[i].pos.z);
    }
    posAttr.needsUpdate = true;
    geo.computeVertexNormals();
}

// ============================================================
// Outfit Shape Generators
// ============================================================
function createOutfitCloth(simulation, def) {
    const resW = CLOTH_RES_W;
    const resH = CLOTH_RES_H;

    switch (def.type) {
        case 'tshirt':
            return createTorsoCloth(simulation, def, resW, resH, 0.5, 0.95);
        case 'shirt':
            return createTorsoCloth(simulation, def, resW, resH, 0.45, 1.2);
        case 'dress':
            return createDressCloth(simulation, def, resW, resH);
        case 'hoodie':
            return createTorsoCloth(simulation, def, resW, resH, 0.4, 0.85);
        case 'blazer':
            return createTorsoCloth(simulation, def, resW, resH, 0.45, 1.0);
        default:
            return createTorsoCloth(simulation, def, resW, resH, 0.5, 0.95);
    }
}

function createTorsoCloth(simulation, def, resW, resH, shrink, dropAmount) {
    // Create a cylindrical cloth that wraps around the torso top area.
    // We'll place particles on a cylinder around the body.
    simulation.particles = [];
    simulation.constraints = [];

    const startAngle = 0;
    const totalAngle = Math.PI * 2;

    // Create particles on cylinder surface
    for (let j = 0; j <= resH; j++) {
        for (let i = 0; i <= resW; i++) {
            const u = i / resW;
            const v = j / resH;
            const angle = startAngle + u * totalAngle;
            const y = def.offsetY - v * def.clothHeight;

            // Find body radius at this height, start slightly outside
            const bodyR = getBodyRadiusAtHeight(y);
            const r = (bodyR + 0.04) * (1 + shrink * 0.1);

            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;
            const p = new ClothParticle(x, y, z);
            simulation.particles.push(p);
        }
    }

    // Close the cylinder (connect last column to first)
    const addSpring = (idx1, idx2, stiff) => {
        if (idx2 >= 0 && idx2 < simulation.particles.length) {
            const dist = simulation.particles[idx1].pos.distanceTo(simulation.particles[idx2].pos);
            simulation.constraints.push(new ClothConstraint(
                simulation.particles[idx1], simulation.particles[idx2], dist, stiff
            ));
        }
    };

    for (let j = 0; j <= resH; j++) {
        for (let i = 0; i <= resW; i++) {
            const idx = j * (resW + 1) + i;
            const nextI = (i === resW) ? j * (resW + 1) : idx + 1;

            if (i < resW) addSpring(idx, idx + 1, def.stiffness);
            else addSpring(idx, j * (resW + 1), def.stiffness); // wrap around

            if (j < resH) addSpring(idx, idx + resW + 1, def.stiffness);

            // Shear
            if (i < resW && j < resH) {
                const shearNextI = (i + 1 === resW) ? j * (resW + 1) : idx + 1;
                addSpring(idx, shearNextI + resW + 1, def.stiffness * 0.5);
                addSpring(idx + 1, idx + resW + 1, def.stiffness * 0.5);
            }
            // Bend
            if (i < resW - 1) addSpring(idx, idx + 2, def.stiffness * 0.2);
            if (j < resH - 1) addSpring(idx, idx + (resW + 1) * 2, def.stiffness * 0.2);
        }
    }

    // Pin top row slightly
    for (let i = 0; i <= resW; i++) {
        // Don't pin all — let cloth settle naturally but keep top edge fixed relative position
    }
    simulation.stiffness = def.stiffness;
    simulation.gravityScale = def.gravityScale;

    // Create mesh
    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(simulation.particles.length * 3);
    const indices = [];

    // Adjust indices for cylinder (leave a gap at the back for now, or connect)
    for (let j = 0; j < resH; j++) {
        for (let i = 0; i < resW; i++) {
            // Leave a small gap at the back seam
            const a = j * (resW + 1) + i;
            const b = j * (resW + 1) + i + 1;
            const c = (j + 1) * (resW + 1) + i;
            const d = (j + 1) * (resW + 1) + i + 1;
            indices.push(a, b, d);
            indices.push(a, d, c);
        }
        // Close the back seam
        const a = j * (resW + 1) + resW;
        const b = j * (resW + 1) + 0;
        const c = (j + 1) * (resW + 1) + resW;
        const d = (j + 1) * (resW + 1) + 0;
        indices.push(a, b, d);
        indices.push(a, d, c);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return { resW, resH };
}

function createDressCloth(simulation, def, resW, resH) {
    // A-line dress: narrow at top, wider at bottom
    simulation.particles = [];
    simulation.constraints = [];

    for (let j = 0; j <= resH; j++) {
        for (let i = 0; i <= resW; i++) {
            const u = i / resW;
            const v = j / resH;
            const angle = u * Math.PI * 2;
            const y = def.offsetY - v * def.clothHeight;

            // A-line: gets wider toward bottom
            const narrowR = 0.38;
            const wideR = 0.55;
            const r = narrowR + v * (wideR - narrowR) + (0.03 + v * 0.03);

            const x = Math.cos(angle) * r;
            const z = Math.sin(angle) * r;
            const p = new ClothParticle(x, y, z);
            simulation.particles.push(p);
        }
    }

    const addSpring = (idx1, idx2, stiff) => {
        if (idx2 >= 0 && idx2 < simulation.particles.length) {
            const dist = simulation.particles[idx1].pos.distanceTo(simulation.particles[idx2].pos);
            simulation.constraints.push(new ClothConstraint(
                simulation.particles[idx1], simulation.particles[idx2], dist, stiff
            ));
        }
    };

    for (let j = 0; j <= resH; j++) {
        for (let i = 0; i <= resW; i++) {
            const idx = j * (resW + 1) + i;
            if (i < resW) addSpring(idx, idx + 1, def.stiffness);
            else addSpring(idx, j * (resW + 1), def.stiffness);
            if (j < resH) addSpring(idx, idx + resW + 1, def.stiffness);
            if (i < resW - 1) addSpring(idx, idx + 2, def.stiffness * 0.2);
            if (j < resH - 1) addSpring(idx, idx + (resW + 1) * 2, def.stiffness * 0.2);
        }
    }

    simulation.stiffness = def.stiffness;
    simulation.gravityScale = def.gravityScale;

    const geo = new THREE.BufferGeometry();
    const positions = new Float32Array(simulation.particles.length * 3);
    const indices = [];

    for (let j = 0; j < resH; j++) {
        for (let i = 0; i < resW; i++) {
            const a = j * (resW + 1) + i;
            const b = j * (resW + 1) + i + 1;
            const c = (j + 1) * (resW + 1) + i;
            const d = (j + 1) * (resW + 1) + i + 1;
            indices.push(a, b, d);
            indices.push(a, d, c);
        }
        const a = j * (resW + 1) + resW;
        const b = j * (resW + 1) + 0;
        const c = (j + 1) * (resW + 1) + resW;
        const d = (j + 1) * (resW + 1) + 0;
        indices.push(a, b, d);
        indices.push(a, d, c);
    }

    geo.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    return { resW, resH };
}

// Helper: approximate body radius at a given height
function getBodyRadiusAtHeight(y) {
    if (y < 0.5) return 0.12;
    if (y < 0.8) return 0.32;
    if (y < 1.1) return 0.36;
    if (y < 1.3) return 0.30;
    if (y < 1.5) return 0.1;
    return 0.08;
}

// ============================================================
// Sleeve Generator
// ============================================================
function createSleeveMesh(def, side) {
    // side: -1 for left, 1 for right
    const group = new THREE.Group();
    const len = def.sleeveLen;
    const width = def.sleeveWidth;

    if (len < 0.05) return group; // no sleeve (dress)

    // Simple cylinder as sleeve
    const segments = 8;
    const ringCount = 6;
    const positions = [];
    const indices = [];

    for (let j = 0; j <= ringCount; j++) {
        for (let i = 0; i <= segments; i++) {
            const angle = (i / segments) * Math.PI * 2;
            const t = j / ringCount;
            const r = width * 0.5 * (1 - t * 0.15);
            const x = Math.cos(angle) * r;
            const y = -t * len;
            const z = Math.sin(angle) * r;
            positions.push(x, y, z);
        }
    }

    for (let j = 0; j < ringCount; j++) {
        for (let i = 0; i < segments; i++) {
            const a = j * (segments + 1) + i;
            const b = a + 1;
            const c = a + segments + 1;
            const d = c + 1;
            indices.push(a, b, d, a, d, c);
        }
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.Float32ArrayAttribute(positions, 3));
    geo.setIndex(indices);
    geo.computeVertexNormals();

    const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(def.defaultColor),
        roughness: 0.7,
        metalness: 0.05,
        side: THREE.DoubleSide
    });

    const mesh = new THREE.Mesh(geo, mat);
    mesh.castShadow = true;
    group.add(mesh);

    // Position at shoulder
    const shoulderX = side * 0.42;
    const shoulderY = def.offsetY - 0.05;
    group.position.set(shoulderX, shoulderY, 0);
    group.rotation.z = side * 0.75;

    return group;
}

// ============================================================
// Hoodie Hood / Blazer Lapels / Shirt Details
// ============================================================
function createOutfitDetails(def, color) {
    const group = new THREE.Group();

    const mat = new THREE.MeshStandardMaterial({
        color: new THREE.Color(color),
        roughness: 0.7,
        metalness: 0.05,
        side: THREE.DoubleSide
    });

    if (def.type === 'hoodie') {
        // Hood
        const hoodGeo = new THREE.SphereGeometry(0.2, 16, 12, 0, Math.PI * 2, 0, Math.PI * 0.5);
        const hood = new THREE.Mesh(hoodGeo, mat);
        hood.position.set(0, def.offsetY + 0.08, -0.12);
        hood.scale.set(1.1, 0.8, 1.2);
        hood.castShadow = true;
        group.add(hood);

        // Kangaroo pocket
        const pocketGeo = new THREE.BoxGeometry(0.4, 0.15, 0.06);
        const pocket = new THREE.Mesh(pocketGeo, mat);
        pocket.position.set(0, def.offsetY - def.clothHeight * 0.45, 0.32);
        group.add(pocket);
    }

    if (def.type === 'blazer') {
        // Left lapel
        const lapelShape = new THREE.Shape();
        lapelShape.moveTo(0, 0);
        lapelShape.lineTo(-0.08, 0.25);
        lapelShape.lineTo(-0.02, 0.28);
        lapelShape.lineTo(0.04, 0.0);
        const lapelGeo = new THREE.ShapeGeometry(lapelShape);
        const lLapel = new THREE.Mesh(lapelGeo, mat);
        lLapel.position.set(-0.08, def.offsetY + 0.1, 0.28);
        lLapel.rotation.x = -0.15;
        group.add(lLapel);

        // Right lapel
        const rLapel = new THREE.Mesh(lapelGeo.clone(), mat);
        rLapel.position.set(0.08, def.offsetY + 0.1, 0.28);
        rLapel.rotation.x = -0.15;
        rLapel.scale.x = -1;
        group.add(rLapel);

        // Pocket squares
        const squareMat = new THREE.MeshStandardMaterial({
            color: 0xffffff, roughness: 0.5, metalness: 0.0, side: THREE.DoubleSide
        });
        const sGeo = new THREE.PlaneGeometry(0.08, 0.08);
        const sq = new THREE.Mesh(sGeo, squareMat);
        sq.position.set(0.18, def.offsetY - 0.08, 0.28);
        group.add(sq);
    }

    if (def.type === 'shirt') {
        // Buttons
        const btnMat = new THREE.MeshStandardMaterial({ color: 0xeeeeee, roughness: 0.3, metalness: 0.3 });
        const btnGeo = new THREE.SphereGeometry(0.012, 8, 6);
        for (let i = 0; i < 5; i++) {
            const btn = new THREE.Mesh(btnGeo, btnMat);
            btn.position.set(0, def.offsetY - i * 0.2, 0.32);
            group.add(btn);
        }

        // Collar
        const collarMat = new THREE.MeshStandardMaterial({
            color: 0xffffff, roughness: 0.5, metalness: 0.0, side: THREE.DoubleSide
        });
        const collarGeo = new THREE.PlaneGeometry(0.15, 0.08);
        const lCollar = new THREE.Mesh(collarGeo, collarMat);
        lCollar.position.set(-0.1, def.offsetY + 0.03, 0.22);
        lCollar.rotation.y = 0.4;
        lCollar.rotation.x = -0.2;
        group.add(lCollar);
        const rCollar = new THREE.Mesh(collarGeo.clone(), collarMat);
        rCollar.position.set(0.1, def.offsetY + 0.03, 0.22);
        rCollar.rotation.y = -0.4;
        rCollar.rotation.x = -0.2;
        group.add(rCollar);
    }

    if (def.type === 'dress') {
        // Straps
        const strapGeo = new THREE.BoxGeometry(0.04, 0.12, 0.02);
        const lStrap = new THREE.Mesh(strapGeo, mat);
        lStrap.position.set(-0.18, def.offsetY + 0.15, 0.06);
        lStrap.rotation.z = 0.2;
        group.add(lStrap);

        const rStrap = new THREE.Mesh(strapGeo.clone(), mat);
        rStrap.position.set(0.18, def.offsetY + 0.15, 0.06);
        rStrap.rotation.z = -0.2;
        group.add(rStrap);
    }

    return group;
}

// ============================================================
// Main Application
// ============================================================
class VirtualFittingRoom {
    constructor() {
        this.outfits = OUTFIT_DEFS;
        this.currentOutfitIndex = 0;
        this.autoRotate = false;
        this.physicsEnabled = true;

        // Create human model
        this.humanModel = createHumanModel();
        scene.add(this.humanModel);

        // Collision bodies
        this.collisionBodies = createCollisionBodies();

        // Outfit state
        this.currentMesh = null;
        this.currentGeo = null;
        this.currentSimulation = new ClothSimulation();
        this.currentDetails = null;
        this.currentSleeves = [];
        this.clothData = null;

        // Initialize first outfit
        this.switchOutfit(0, true);

        // UI
        this.setupUI();

        // Resize
        window.addEventListener('resize', () => this.onResize());

        // Start animation loop
        this.clock = new THREE.Clock();
        this.animate();
    }

    setupUI() {
        const clothingItems = document.querySelectorAll('.clothing-item');
        clothingItems.forEach(item => {
            item.addEventListener('click', () => {
                clothingItems.forEach(el => el.classList.remove('active'));
                item.classList.add('active');
                const outfitIdx = parseInt(item.dataset.outfit);
                this.switchOutfit(outfitIdx);
            });
        });

        const colorPicker = document.getElementById('color-picker');
        colorPicker.value = this.outfits[this.currentOutfitIndex].defaultColor;
        colorPicker.addEventListener('input', (e) => {
            this.updateOutfitColor(e.target.value);
        });

        const physicsToggle = document.getElementById('physics-toggle');
        physicsToggle.addEventListener('click', () => {
            this.physicsEnabled = !this.physicsEnabled;
            physicsToggle.textContent = this.physicsEnabled ? '开启' : '关闭';
            physicsToggle.classList.toggle('active', this.physicsEnabled);
        });

        const autoRotToggle = document.getElementById('auto-rotate-toggle');
        autoRotToggle.addEventListener('click', () => {
            this.autoRotate = !this.autoRotate;
            autoRotToggle.textContent = this.autoRotate ? '开启' : '关闭';
            autoRotToggle.classList.toggle('active', this.autoRotate);
            controls.autoRotate = this.autoRotate;
            controls.autoRotateSpeed = 1.5;
        });

        const outfitName = document.getElementById('outfit-name');
        outfitName.textContent = this.outfits[this.currentOutfitIndex].name;
    }

    switchOutfit(idx, initial = false) {
        this.currentOutfitIndex = idx;
        const def = this.outfits[idx];

        // Remove old outfit
        if (this.currentMesh) {
            scene.remove(this.currentMesh);
            this.currentMesh.geometry.dispose();
            this.currentMesh.material.dispose();
        }
        if (this.currentDetails) {
            scene.remove(this.currentDetails);
        }
        this.currentSleeves.forEach(s => scene.remove(s));
        this.currentSleeves = [];

        // Create new cloth simulation
        this.currentSimulation = new ClothSimulation();
        this.currentSimulation.setCollisionBodies(this.collisionBodies);
        this.clothData = createOutfitCloth(this.currentSimulation, def);

        // Create mesh
        const { mesh, geo } = createClothMesh(
            this.currentSimulation, this.clothData.resW, this.clothData.resH, def.defaultColor
        );
        this.currentMesh = mesh;
        this.currentGeo = geo;

        if (initial) {
            // Position already set in cloth creation
            updateClothMesh(geo, this.currentSimulation.particles);
        } else {
            // Drop animation: move all particles up, let them fall
            const dropHeight = 2.5;
            for (const p of this.currentSimulation.particles) {
                if (!p.pinned) {
                    p.pos.y += dropHeight;
                    p.prev.y += dropHeight;
                }
            }
        }

        scene.add(mesh);

        // Sleeves
        const lSleeve = createSleeveMesh(def, -1);
        const rSleeve = createSleeveMesh(def, 1);
        // Update sleeve color
        const sleeveColor = this.getCurrentColor();
        lSleeve.traverse(child => {
            if (child.isMesh && child.material.color) {
                child.material.color.set(sleeveColor);
            }
        });
        rSleeve.traverse(child => {
            if (child.isMesh && child.material.color) {
                child.material.color.set(sleeveColor);
            }
        });
        this.currentSleeves = [lSleeve, rSleeve];
        scene.add(lSleeve);
        scene.add(rSleeve);

        // Detail elements
        if (def.type === 'hoodie' || def.type === 'blazer' || def.type === 'shirt' || def.type === 'dress') {
            this.currentDetails = createOutfitDetails(def, def.defaultColor);
            scene.add(this.currentDetails);
        } else {
            this.currentDetails = null;
        }

        // Update UI
        document.getElementById('color-picker').value = def.defaultColor;
        document.getElementById('outfit-name').textContent = def.name;
    }

    getCurrentColor() {
        const colorPicker = document.getElementById('color-picker');
        return colorPicker ? colorPicker.value : this.outfits[this.currentOutfitIndex].defaultColor;
    }

    updateOutfitColor(color) {
        if (this.currentMesh) {
            this.currentMesh.material.color.set(color);
        }
        this.currentSleeves.forEach(s => {
            s.traverse(child => {
                if (child.isMesh && child.material.color) {
                    // Skip non-clothing materials (buttons, pocket squares, collar)
                    const currentHex = '#' + child.material.color.getHexString();
                    const outfitHex = this.outfits[this.currentOutfitIndex].defaultColor;
                    if (currentHex === outfitHex || child.material._isCloth) {
                        child.material.color.set(color);
                    }
                    child.material._isCloth = true;
                }
            });
        });

        if (this.currentDetails) {
            this.currentDetails.traverse(child => {
                if (child.isMesh && child.material.color) {
                    const c = '#' + child.material.color.getHexString();
                    const outfitHex = this.outfits[this.currentOutfitIndex].defaultColor;
                    if (c === outfitHex) {
                        child.material.color.set(color);
                    }
                }
            });
        }
    }

    onResize() {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    }

    animate() {
        requestAnimationFrame(() => this.animate());

        const dt = Math.min(this.clock.getDelta(), 0.033); // cap at ~30fps

        // Physics
        if (this.physicsEnabled && this.currentSimulation) {
            this.currentSimulation.simulate(dt);

            // Update mesh
            if (this.currentGeo) {
                updateClothMesh(this.currentGeo, this.currentSimulation.particles);
            }
        }

        // Sync sleeve attachment to body
        const def = this.outfits[this.currentOutfitIndex];
        this.currentSleeves.forEach(s => {
            // Keep sleeves at shoulder position
        });

        // Controls
        controls.update();

        renderer.render(scene, camera);
    }
}

// ============================================================
// Initialize
// ============================================================
const app = new VirtualFittingRoom();

// Hide loading screen
setTimeout(() => {
    const loading = document.getElementById('loading');
    loading.classList.add('hidden');
    setTimeout(() => loading.remove(), 600);
}, 500);
