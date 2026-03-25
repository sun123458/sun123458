// app.js - 主应用：场景初始化、渲染循环、模块协调
class VirtualFittingRoom {
  constructor() {
    this.scene = null;
    this.camera = null;
    this.renderer = null;
    this.controls = null;
    this.bodyModel = null;
    this.garmentFactory = null;
    this.currentGarment = null;
    this.isAnimating = false;
    this.transitionState = null;
    this.clostand = null;

    this.init();
  }

  init() {
    // 场景
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(0xf0f0f5);
    this.scene.fog = new THREE.Fog(0xf0f0f5, 8, 20);

    // 相机
    this.camera = new THREE.PerspectiveCamera(
      45, window.innerWidth / window.innerHeight, 0.1, 100
    );
    this.camera.position.set(0, 1.0, 3.0);
    this.camera.lookAt(0, 0.85, 0);

    // 渲染器
    const canvas = document.getElementById('renderCanvas');
    this.renderer = new THREE.WebGLRenderer({
      canvas: canvas,
      antialias: true,
      alpha: false
    });
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    this.renderer.shadowMap.enabled = true;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.0;

    // 灯光
    this._setupLights();

    // 地面
    this._setupGround();

    // 展台
    this._setupPlatform();

    // OrbitControls
    this._setupControls();

    // 人体模型
    this.bodyModel = new BodyModel(this.scene, {
      height: 1.75,
      build: 0.5
    });

    // 服装工厂
    this.garmentFactory = new GarmentFactory();

    // 窗口大小调整
    window.addEventListener('resize', () => this._onResize());

    // 开始渲染
    this._animate();
  }

  _setupLights() {
    // 环境光
    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    this.scene.add(ambient);

    // 主灯（模拟摄影灯光）
    const mainLight = new THREE.DirectionalLight(0xfff5ee, 1.2);
    mainLight.position.set(3, 5, 3);
    mainLight.castShadow = true;
    mainLight.shadow.mapSize.width = 2048;
    mainLight.shadow.mapSize.height = 2048;
    mainLight.shadow.camera.near = 0.1;
    mainLight.shadow.camera.far = 20;
    mainLight.shadow.camera.left = -3;
    mainLight.shadow.camera.right = 3;
    mainLight.shadow.camera.top = 3;
    mainLight.shadow.camera.bottom = -1;
    mainLight.shadow.bias = -0.001;
    this.scene.add(mainLight);

    // 填充光
    const fillLight = new THREE.DirectionalLight(0xccddff, 0.4);
    fillLight.position.set(-2, 3, -1);
    this.scene.add(fillLight);

    // 背光/轮廓光
    const rimLight = new THREE.DirectionalLight(0xffffff, 0.3);
    rimLight.position.set(0, 2, -3);
    this.scene.add(rimLight);

    // 底补光
    const bottomLight = new THREE.PointLight(0xffeedd, 0.3, 5);
    bottomLight.position.set(0, 0.2, 1);
    this.scene.add(bottomLight);
  }

  _setupGround() {
    // 地面网格
    const groundGeo = new THREE.PlaneGeometry(20, 20);
    const groundMat = new THREE.MeshStandardMaterial({
      color: 0xe8e8ea,
      roughness: 0.9,
      metalness: 0.0
    });
    const ground = new THREE.Mesh(groundGeo, groundMat);
    ground.rotation.x = -Math.PI / 2;
    ground.position.y = -0.01;
    ground.receiveShadow = true;
    this.scene.add(ground);
  }

  _setupPlatform() {
    // 圆形展台
    const platformGeo = new THREE.CylinderGeometry(0.6, 0.65, 0.05, 32);
    const platformMat = new THREE.MeshStandardMaterial({
      color: 0xd0d0d5,
      roughness: 0.6,
      metalness: 0.1
    });
    this.clostand = new THREE.Mesh(platformGeo, platformMat);
    this.clostand.position.y = 0.025;
    this.clostand.receiveShadow = true;
    this.clostand.castShadow = true;
    this.scene.add(this.clostand);
  }

  _setupControls() {
    this.controls = new THREE.OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(0, 0.85, 0);
    this.controls.enableDamping = true;
    this.controls.dampingFactor = 0.08;
    this.controls.rotateSpeed = 0.6;
    this.controls.minDistance = 1.5;
    this.controls.maxDistance = 6;
    this.controls.minPolarAngle = 0.2;
    this.controls.maxPolarAngle = Math.PI - 0.2;
    this.controls.enablePan = false;
    this.controls.update();
  }

  // 执行试穿
  tryOn(type, color) {
    // 淡出旧服装
    if (this.currentGarment) {
      this._removeGarment();
    }

    // 创建新服装
    const garment = this.garmentFactory.create(type, this.bodyModel, color);
    this.currentGarment = garment;
    this.currentGarmentType = type;
    this.scene.add(garment.mesh);

    // 设置淡入
    this.isAnimating = true;
    this.simFrames = 0;

    return garment;
  }

  _removeGarment() {
    if (this.currentGarment) {
      this.scene.remove(this.currentGarment.mesh);
      this.currentGarment.mesh.geometry.dispose();
      this.currentGarment.mesh.material.dispose();
      this.currentGarment.physics.reset();
      this.currentGarment = null;
    }
  }

  // 更新服装颜色
  changeColor(color) {
    if (this.currentGarment) {
      this.garmentFactory.updateColor(this.currentGarment, color);
    }
  }

  // 更新体型
  updateBody(params) {
    this.bodyModel.updateParams(params);

    // 重新试穿当前服装
    if (this.currentGarment && this.currentGarmentType) {
      const currentType = this.currentGarmentType;
      const currentColor = this.currentGarment.mesh.material.color.getHex();
      this._removeGarment();
      this.tryOn(currentType, currentColor);
    }
  }

  // 渲染循环
  _animate() {
    requestAnimationFrame(() => this._animate());

    // 物理更新
    if (this.currentGarment && this.isAnimating) {
      this.simFrames++;
      // 模拟稳定后降低更新频率（节省性能）
      if (this.simFrames <= 120 || this.simFrames % 3 === 0) {
        const colliders = this.bodyModel.getColliders();
        this.currentGarment.physics.update(colliders);
        this.garmentFactory.updateGeometry(this.currentGarment);
      }
    }

    this.controls.update();
    this.renderer.render(this.scene, this.camera);
  }

  _onResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
  }
}

// 入口
window.addEventListener('DOMContentLoaded', () => {
  window.app = new VirtualFittingRoom();
});
