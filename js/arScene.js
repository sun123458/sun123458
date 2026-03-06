/**
 * AR场景管理器
 * 负责初始化和管理AR.js + Three.js场景
 */

class ARScene {
    constructor(config) {
        this.config = config;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.arToolkitSource = null;
        this.arToolkitContext = null;
        this.markerRoot = null;
        this.exhibits = [];
        this.isInitialized = false;
        this.clock = new THREE.Clock();

        // 性能监控
        this.frameCount = 0;
        this.lastFPSUpdate = 0;
        this.fps = 0;

        this.init();
    }

    /**
     * 初始化AR场景
     */
    init() {
        try {
            this.initScene();
            this.initCamera();
            this.initRenderer();
            this.initLights();
            this.initARToolkit();
            this.initMarker();
            this.setupEventListeners();
            this.start();

            console.log('AR场景初始化成功');
            this.isInitialized = true;
        } catch (error) {
            console.error('AR场景初始化失败:', error);
            this.handleInitError(error);
        }
    }

    /**
     * 初始化Three.js场景
     */
    initScene() {
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(this.config.scene.backgroundColor);

        // 添加雾效（如果启用）
        if (this.config.scene.fogEnabled) {
            this.scene.fog = new THREE.FogExp2(
                this.config.scene.fogColor,
                this.config.scene.fogDensity
            );
        }

        // 添加辅助网格
        const gridHelper = new THREE.GridHelper(10, 20, 0x444444, 0x888888);
        gridHelper.visible = false;
        gridHelper.name = 'gridHelper';
        this.scene.add(gridHelper);
    }

    /**
     * 初始化相机
     */
    initCamera() {
        this.camera = new THREE.Camera();
        this.scene.add(this.camera);
    }

    /**
     * 初始化渲染器
     */
    initRenderer() {
        this.renderer = new THREE.WebGLRenderer({
            antialias: this.config.renderer.antialias,
            alpha: true,
        });

        this.renderer.setPixelRatio(this.config.renderer.pixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);

        if (this.config.renderer.shadowsEnabled) {
            this.renderer.shadowMap.enabled = true;
            this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        }

        document.getElementById('scene-container').appendChild(this.renderer.domElement);
    }

    /**
     * 初始化灯光
     */
    initLights() {
        // 环境光
        const ambientLight = new THREE.AmbientLight(0xffffff, this.config.scene.ambientLightIntensity);
        this.scene.add(ambientLight);

        // 方向光（模拟太阳光）
        const directionalLight = new THREE.DirectionalLight(
            0xffffff,
            this.config.scene.directionalLightIntensity
        );
        directionalLight.position.set(5, 10, 7);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 1024;
        directionalLight.shadow.mapSize.height = 1024;
        this.scene.add(directionalLight);

        // 添加点光源增加场景氛围
        const pointLight1 = new THREE.PointLight(0xffffff, 0.5, 10);
        pointLight1.position.set(2, 3, 2);
        this.scene.add(pointLight1);

        const pointLight2 = new THREE.PointLight(0xffffff, 0.5, 10);
        pointLight2.position.set(-2, 3, -2);
        this.scene.add(pointLight2);
    }

    /**
     * 初始化AR工具包
     */
    initARToolkit() {
        // 创建AR视频源
        this.arToolkitSource = new THREEx.ArToolkitSource({
            sourceType: 'webcam',
        });

        this.arToolkitSource.init(() => {
            this.onResize();
            this.updateCameraStatus('摄像头已启动');
            setTimeout(() => {
                this.hideLoadingScreen();
            }, 1000);
        }, (error) => {
            console.error('摄像头初始化失败:', error);
            this.handleCameraError();
        });

        // 创建AR上下文
        this.arToolkitContext = new THREEx.ArToolkitContext({
            cameraParametersUrl: this.config.ar.cameraParam,
            detectionMode: 'mono',
        });

        this.arToolkitContext.init(() => {
            this.camera.projectionMatrix.copy(this.arToolkitContext.getProjectionMatrix());
        });
    }

    /**
     * 初始化AR标记
     */
    initMarker() {
        // 创建标记根节点
        this.markerRoot = new THREE.Group();
        this.scene.add(this.markerRoot);

        // 创建AR标记控制器
        const arMarkerControls = new THREEx.ArMarkerControls(
            this.arToolkitContext,
            this.markerRoot,
            {
                type: this.config.ar.type,
                patternUrl: this.config.ar.markerPath,
                size: this.config.ar.markerSize,
            }
        );

        // 监听标记可见性
        this.markerRoot.visible = false;
        this.arMarkerControls = arMarkerControls;
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        // 窗口大小改变
        window.addEventListener('resize', () => this.onResize());

        // AR上下文更新
        this.renderer.domElement.addEventListener('arContextReady', () => {
            console.log('AR上下文已就绪');
        });
    }

    /**
     * 处理窗口大小改变
     */
    onResize() {
        if (this.arToolkitSource) {
            this.arToolkitSource.onResize();
            this.arToolkitSource.copySizeTo(this.renderer.domElement);
        }
        if (this.renderer) {
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        }
    }

    /**
     * 启动渲染循环
     */
    start() {
        const animate = () => {
            requestAnimationFrame(animate);

            const delta = this.clock.getDelta();

            // 更新AR工具包
            if (this.arToolkitContext && this.arToolkitSource) {
                this.arToolkitContext.update(this.arToolkitSource.domElement);

                // 更新标记可见性
                if (this.markerRoot.visible !== this.arMarkerControls.object3d.visible) {
                    this.markerRoot.visible = this.arMarkerControls.object3d.visible;
                    this.onMarkerVisibilityChanged(this.markerRoot.visible);
                }
            }

            // 更新FPS
            this.updateFPS();

            // 更新展品动画
            this.updateExhibits(delta);

            // 渲染场景
            this.renderer.render(this.scene, this.camera);

            // 更新UI
            this.updateUI();
        };

        animate();
    }

    /**
     * 更新FPS计数器
     */
    updateFPS() {
        this.frameCount++;
        const currentTime = performance.now();

        if (currentTime - this.lastFPSUpdate >= 1000) {
            this.fps = this.frameCount;
            this.frameCount = 0;
            this.lastFPSUpdate = currentTime;

            const fpsElement = document.getElementById('fps-counter');
            if (fpsElement) {
                fpsElement.textContent = this.fps;
            }
        }
    }

    /**
     * 更新展品动画
     */
    updateExhibits(delta) {
        this.exhibits.forEach(exhibit => {
            if (exhibit.userData.autoRotate) {
                exhibit.rotation.y += this.config.interaction.autoRotateSpeed;
            }
        });
    }

    /**
     * 更新UI
     */
    updateUI() {
        const objectCountElement = document.getElementById('object-count');
        if (objectCountElement) {
            objectCountElement.textContent = this.exhibits.length;
        }
    }

    /**
     * 标记可见性改变回调
     */
    onMarkerVisibilityChanged(visible) {
        const markerStatus = document.getElementById('marker-status');
        if (markerStatus) {
            markerStatus.textContent = visible ? '已检测到标记' : '未检测到标记';
            markerStatus.style.color = visible ? '#4CAF50' : '#f44336';
        }
    }

    /**
     * 添加展品到场景
     */
    addExhibit(mesh) {
        this.markerRoot.add(mesh);
        this.exhibits.push(mesh);
    }

    /**
     * 清除所有展品
     */
    clearExhibits() {
        this.exhibits.forEach(exhibit => {
            this.markerRoot.remove(exhibit);
        });
        this.exhibits = [];
    }

    /**
     * 获取射线投射器
     */
    getRaycaster() {
        const raycaster = new THREE.Raycaster();
        raycaster.params.Points.threshold = this.config.interaction.raycasterPrecision;
        return raycaster;
    }

    /**
     * 更新摄像机状态显示
     */
    updateCameraStatus(status) {
        const cameraStatus = document.getElementById('camera-status');
        if (cameraStatus) {
            cameraStatus.textContent = status;
        }
    }

    /**
     * 隐藏加载屏幕
     */
    hideLoadingScreen() {
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.style.opacity = '0';
            setTimeout(() => {
                loadingScreen.style.display = 'none';
            }, 500);
        }
    }

    /**
     * 处理初始化错误
     */
    handleInitError(error) {
        console.error('初始化错误:', error);
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div class="error-icon">⚠️</div>
                <p>AR场景初始化失败</p>
                <p class="error-message">${error.message}</p>
                <button onclick="location.reload()" class="retry-btn">重试</button>
            `;
        }
    }

    /**
     * 处理摄像机错误
     */
    handleCameraError() {
        this.updateCameraStatus('摄像头访问失败');
        const loadingScreen = document.getElementById('loading-screen');
        if (loadingScreen) {
            loadingScreen.innerHTML = `
                <div class="error-icon">📷</div>
                <p>无法访问摄像头</p>
                <p class="error-message">请确保已允许摄像头权限</p>
                <button onclick="location.reload()" class="retry-btn">重试</button>
            `;
        }
    }

    /**
     * 销毁场景
     */
    dispose() {
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.arToolkitSource) {
            this.arToolkitSource.domElement.pause();
        }
    }
}
