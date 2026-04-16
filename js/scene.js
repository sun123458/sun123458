/**
 * 场景管理
 * 负责Three.js场景、光照、人体模型和服装的加载与渲染
 */

class SceneManager {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.cloth = null;
        this.clothMesh = null;
        this.humanBody = null;
        this.bodyParts = [];
        this.dressManager = new DressManager();

        // 场景参数
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        // 动画循环
        this.clock = new THREE.Clock();
        this.isRunning = false;

        // 当前物理参数
        this.windStrength = 30;
        this.elasticity = 0.5;

        this.init();
    }

    init() {
        // 创建场景
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x2c3e50);
        this.scene.fog = new THREE.Fog(0x2c3e50, 5, 20);

        // 创建相机
        this.camera = new THREE.PerspectiveCamera(
            60,
            this.width / this.height,
            0.1,
            100
        );
        this.camera.position.set(0, 0, 5);

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(this.width, this.height);
        this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.0;

        // 添加到DOM
        const container = document.getElementById('canvas-container');
        container.appendChild(this.renderer.domElement);

        // 设置光照
        this.setupLighting();

        // 创建人体模型
        this.createHumanBody();

        // 初始化控制器
        this.setupControls();

        // 加载默认服装
        this.loadDress('dress1');

        // 添加窗口大小调整
        window.addEventListener('resize', () => this.onWindowResize());

        // 开始渲染循环
        this.start();
    }

    setupLighting() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.5);
        this.scene.add(ambientLight);

        // 主定向光（模拟阳光）
        const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
        mainLight.position.set(5, 10, 5);
        mainLight.castShadow = true;
        mainLight.shadow.mapSize.width = 2048;
        mainLight.shadow.mapSize.height = 2048;
        mainLight.shadow.camera.near = 0.5;
        mainLight.shadow.camera.far = 50;
        mainLight.shadow.camera.left = -5;
        mainLight.shadow.camera.right = 5;
        mainLight.shadow.camera.top = 5;
        mainLight.shadow.camera.bottom = -5;
        mainLight.shadow.bias = -0.0001;
        this.scene.add(mainLight);

        // 补光
        const fillLight = new THREE.DirectionalLight(0x8888ff, 0.3);
        fillLight.position.set(-5, 5, 5);
        this.scene.add(fillLight);

        // 轮廓光
        const rimLight = new THREE.DirectionalLight(0xffffaa, 0.4);
        rimLight.position.set(0, 5, -5);
        this.scene.add(rimLight);

        // 底部反射光
        const bounceLight = new THREE.DirectionalLight(0xffffff, 0.2);
        bounceLight.position.set(0, -5, 0);
        this.scene.add(bounceLight);
    }

    createHumanBody() {
        // 创建人体模型组
        this.humanBody = new THREE.Group();

        // 人体材质
        const skinMaterial = new THREE.MeshStandardMaterial({
            color: 0xffdbac,
            roughness: 0.7,
            metalness: 0.0
        });

        const hairMaterial = new THREE.MeshStandardMaterial({
            color: 0x2c1810,
            roughness: 0.8,
            metalness: 0.0
        });

        // 头部
        const headGeometry = new THREE.SphereGeometry(0.2, 32, 32);
        const head = new THREE.Mesh(headGeometry, skinMaterial);
        head.position.set(0, 1.7, 0);
        head.castShadow = true;
        this.humanBody.add(head);
        this.bodyParts.push({ mesh: head, collisionRadius: 0.2, collisionOffset: new THREE.Vector3(0, 1.7, 0) });

        // 脖子
        const neckGeometry = new THREE.CylinderGeometry(0.08, 0.08, 0.15, 16);
        const neck = new THREE.Mesh(neckGeometry, skinMaterial);
        neck.position.set(0, 1.45, 0);
        neck.castShadow = true;
        this.humanBody.add(neck);
        this.bodyParts.push({ mesh: neck, collisionRadius: 0.08, collisionOffset: new THREE.Vector3(0, 1.45, 0) });

        // 躯干（上半身）
        const torsoGeometry = new THREE.CylinderGeometry(0.2, 0.18, 0.6, 16);
        const torso = new THREE.Mesh(torsoGeometry, skinMaterial);
        torso.position.set(0, 1.1, 0);
        torso.castShadow = true;
        this.humanBody.add(torso);
        this.bodyParts.push({ mesh: torso, collisionRadius: 0.2, collisionOffset: new THREE.Vector3(0, 1.1, 0) });

        // 腰部
        const waistGeometry = new THREE.CylinderGeometry(0.18, 0.2, 0.2, 16);
        const waist = new THREE.Mesh(waistGeometry, skinMaterial);
        waist.position.set(0, 0.65, 0);
        waist.castShadow = true;
        this.humanBody.add(waist);
        this.bodyParts.push({ mesh: waist, collisionRadius: 0.2, collisionOffset: new THREE.Vector3(0, 0.65, 0) });

        // 臀部
        const hipGeometry = new THREE.CylinderGeometry(0.2, 0.22, 0.15, 16);
        const hip = new THREE.Mesh(hipGeometry, skinMaterial);
        hip.position.set(0, 0.5, 0);
        hip.castShadow = true;
        this.humanBody.add(hip);
        this.bodyParts.push({ mesh: hip, collisionRadius: 0.22, collisionOffset: new THREE.Vector3(0, 0.5, 0) });

        // 腿部
        const legGeometry = new THREE.CylinderGeometry(0.08, 0.07, 0.5, 16);
        const leftLeg = new THREE.Mesh(legGeometry, skinMaterial);
        leftLeg.position.set(-0.1, 0.15, 0);
        leftLeg.castShadow = true;
        this.humanBody.add(leftLeg);

        const rightLeg = new THREE.Mesh(legGeometry, skinMaterial);
        rightLeg.position.set(0.1, 0.15, 0);
        rightLeg.castShadow = true;
        this.humanBody.add(rightLeg);

        // 肩膀
        const shoulderGeometry = new THREE.SphereGeometry(0.12, 16, 16);
        const leftShoulder = new THREE.Mesh(shoulderGeometry, skinMaterial);
        leftShoulder.position.set(-0.25, 1.35, 0);
        leftShoulder.castShadow = true;
        this.humanBody.add(leftShoulder);

        const rightShoulder = new THREE.Mesh(shoulderGeometry, skinMaterial);
        rightShoulder.position.set(0.25, 1.35, 0);
        rightShoulder.castShadow = true;
        this.humanBody.add(rightShoulder);

        // 手臂（简化）
        const armGeometry = new THREE.CylinderGeometry(0.05, 0.04, 0.5, 12);
        const leftArm = new THREE.Mesh(armGeometry, skinMaterial);
        leftArm.position.set(-0.35, 1.05, 0);
        leftArm.rotation.z = Math.PI / 8;
        leftArm.castShadow = true;
        this.humanBody.add(leftArm);

        const rightArm = new THREE.Mesh(armGeometry, skinMaterial);
        rightArm.position.set(0.35, 1.05, 0);
        rightArm.rotation.z = -Math.PI / 8;
        rightArm.castShadow = true;
        this.humanBody.add(rightArm);

        // 头发（简单的）
        const hairGeometry = new THREE.SphereGeometry(0.22, 32, 32, 0, Math.PI * 2, 0, Math.PI / 2);
        const hair = new THREE.Mesh(hairGeometry, hairMaterial);
        hair.position.set(0, 1.72, 0);
        hair.castShadow = true;
        this.humanBody.add(hair);

        // 后发
        const backHairGeometry = new THREE.CylinderGeometry(0.15, 0.18, 0.3, 16, 1, true);
        const backHair = new THREE.Mesh(backHairGeometry, hairMaterial);
        backHair.position.set(0, 1.6, -0.08);
        backHair.castShadow = true;
        this.humanBody.add(backHair);

        this.scene.add(this.humanBody);
    }

    setupControls() {
        // 使用OrbitControls
        this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
        this.controls.enableDamping = true;
        this.controls.dampingFactor = 0.05;
        this.controls.rotateSpeed = 0.5;
        this.controls.enablePan = true;
        this.controls.enableZoom = true;
        this.controls.minDistance = 2;
        this.controls.maxDistance = 10;
        this.controls.maxPolarAngle = Math.PI / 2 + 0.2;
        this.controls.minPolarAngle = Math.PI / 4;
        this.controls.target.set(0, 0.8, 0);
    }

    loadDress(dressId) {
        // 移除现有服装
        if (this.clothMesh) {
            this.scene.remove(this.clothMesh);
            this.clothMesh.geometry.dispose();
            this.clothMesh.material.dispose();
        }

        // 获取服装配置
        const config = this.dressManager.getDressConfig(dressId);
        if (!config) return;

        // 创建布料
        this.cloth = this.dressManager.createCloth(config);

        // 设置碰撞体
        this.cloth.clearCollisionBodies();
        for (const part of this.bodyParts) {
            const position = part.collisionOffset.clone();
            this.cloth.addCollisionBody({ x: position.x, y: position.y, z: position.z }, part.collisionRadius);
        }

        // 创建布料网格
        const { mesh, vertexData } = this.dressManager.createClothMesh(this.cloth, config.color);
        this.clothMesh = mesh;
        this.clothMesh.position.copy(config.positionOffset);

        this.scene.add(this.clothMesh);
        this.dressManager.clothMeshes.set(dressId, { mesh: this.clothMesh, vertexData });

        // 更新当前服装
        this.dressManager.setCurrentDress(dressId);
    }

    changeDressColor(color) {
        this.dressManager.updateColor(color);
        if (this.clothMesh) {
            this.clothMesh.material.color.set(color);
        }
    }

    setWindStrength(strength) {
        this.windStrength = strength;
        if (this.cloth) {
            this.cloth.setWindStrength(strength);
        }
    }

    setElasticity(elasticity) {
        this.elasticity = elasticity;
        if (this.cloth) {
            // 更新布料刚度
            this.cloth.stiffness = elasticity;
        }
    }

    resetCamera() {
        this.camera.position.set(0, 0, 5);
        this.controls.target.set(0, 0.8, 0);
        this.controls.update();
    }

    resetPhysics() {
        if (this.cloth) {
            this.cloth.reset();
        }
    }

    start() {
        if (this.isRunning) return;
        this.isRunning = true;
        this.animate();
    }

    animate() {
        if (!this.isRunning) return;

        requestAnimationFrame(() => this.animate());

        const deltaTime = this.clock.getDelta();

        // 更新布料物理
        if (this.cloth && this.clothMesh) {
            this.cloth.update(deltaTime);
            this.dressManager.updateClothMesh(this.clothMesh, this.cloth);
        }

        // 更新控制器
        this.controls.update();

        // 渲染
        this.renderer.render(this.scene, this.camera);
    }

    onWindowResize() {
        this.width = window.innerWidth;
        this.height = window.innerHeight;

        this.camera.aspect = this.width / this.height;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize(this.width, this.height);
    }

    dispose() {
        this.isRunning = false;

        if (this.clothMesh) {
            this.scene.remove(this.clothMesh);
            this.clothMesh.geometry.dispose();
            this.clothMesh.material.dispose();
        }

        if (this.humanBody) {
            this.scene.remove(this.humanBody);
            for (const part of this.humanBody.children) {
                part.geometry.dispose();
                part.material.dispose();
            }
        }

        this.renderer.dispose();
    }
}

// 导出类
window.SceneManager = SceneManager;
