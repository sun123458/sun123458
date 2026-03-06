/**
 * AR增强现实展厅应用
 * Main Application
 */

class ARGalleryApp {
    constructor() {
        // 场景组件
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.arToolkitSource = null;
        this.arToolkitContext = null;
        this.markerRoot = null;

        // 模型相关
        this.currentModel = null;
        this.modelLoader = null;
        this.loadingManager = null;

        // 状态
        this.isMarkerFound = false;
        this.isInitialized = false;

        // UI元素
        this.ui = {
            loading: document.getElementById('loading'),
            loadingText: document.getElementById('loading-text'),
            progressFill: document.getElementById('progress-fill'),
            statusDot: document.querySelector('.status-dot'),
            statusText: document.querySelector('.status-text'),
            infoPanel: document.getElementById('exhibit-info'),
            instructions: document.getElementById('instructions')
        };
    }

    /**
     * 初始化应用
     */
    async init() {
        try {
            console.log('初始化AR应用...');

            // 初始化加载管理器
            this._initLoadingManager();

            // 初始化场景
            this._initScene();

            // 初始化AR
            await this._initAR();

            // 设置事件监听
            this._setupEventListeners();

            // 隐藏加载界面
            this._hideLoading();

            this.isInitialized = true;
            console.log('AR应用初始化完成');

            // 启动渲染循环
            this._animate();

        } catch (error) {
            console.error('初始化失败:', error);
            this.ui.loadingText.textContent = '初始化失败，请刷新页面重试';
        }
    }

    /**
     * 初始化加载管理器
     */
    _initLoadingManager() {
        this.loadingManager = new THREE.LoadingManager();

        this.loadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal) * 100;
            this.ui.progressFill.style.width = progress + '%';
            this.ui.loadingText.textContent = `加载中... ${Math.round(progress)}%`;
        };

        this.loadingManager.onLoad = () => {
            console.log('所有资源加载完成');
        };

        this.loadingManager.onError = (url) => {
            console.error('加载失败:', url);
        };

        // 创建GLTF加载器
        this.modelLoader = new THREE.GLTFLoader(this.loadingManager);
    }

    /**
     * 初始化场景
     */
    _initScene() {
        // 创建场景
        this.scene = new THREE.Scene();

        // 创建相机
        this.camera = new THREE.Camera();
        this.scene.add(this.camera);

        // 创建渲染器
        this.renderer = new THREE.WebGLRenderer({
            antialias: true,
            alpha: true
        });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.outputEncoding = THREE.sRGBEncoding;

        // 将渲染器添加到AR容器
        const arContainer = document.getElementById('ar-container');
        arContainer.appendChild(this.renderer.domElement);

        // 添加灯光
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);

        const directionalLight = new THREE.DirectionalLight(0xffffff, 0.8);
        directionalLight.position.set(5, 10, 7);
        this.scene.add(directionalLight);

        const backLight = new THREE.DirectionalLight(0xffffff, 0.3);
        backLight.position.set(-5, 5, -5);
        this.scene.add(backLight);
    }

    /**
     * 初始化AR
     */
    async _initAR() {
        // 设置ARToolkitSource
        this.arToolkitSource = new THREEx.ArToolkitSource({
            sourceType: 'webcam',
            sourceWidth: 480,
            sourceHeight: 640,
            displayWidth: window.innerWidth,
            displayHeight: window.innerHeight
        });

        // 等待ARToolkitSource初始化完成
        await new Promise((resolve, reject) => {
            this.arToolkitSource.init(() => {
                this.arToolkitSource.domElement.addEventListener('canplay', () => {
                    resolve();
                });
            });
        });

        // 设置ARToolkitContext
        this.arToolkitContext = new THREEx.ArToolkitContext({
            cameraParametersUrl: 'data/camera_para.dat',
            detectionMode: 'mono',
            matrixCodeType: '3x3'
        });

        // 初始化ARToolkitContext
        this.arToolkitContext.init(() => {
            this.camera.projectionMatrix.copy(this.arToolkitContext.getProjectionMatrix());
        });

        // 创建标记根节点
        this.markerRoot = new THREE.Group();
        this.scene.add(this.markerRoot);

        // 创建AR标记控件
        const arMarkerControls = new THREEx.ArMarkerControls(
            this.arToolkitContext,
            this.markerRoot,
            {
                type: 'pattern',
                patternUrl: 'https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/data/pattern-hiro.patt'
            }
        );

        // 监听标记识别事件
        arMarkerControls.addEventListener('markerFound', () => {
            this._onMarkerFound();
        });

        arMarkerControls.addEventListener('markerLost', () => {
            this._onMarkerLost();
        });

        // 监听窗口大小变化
        window.addEventListener('resize', () => {
            this._onWindowResize();
        });
    }

    /**
     * 设置事件监听
     */
    _setupEventListeners() {
        // 初始化展厅管理器
        gallery.init();

        // 监听展品切换事件
        gallery.on('change', (data) => {
            this._onExhibitChange(data);
        });

        // 导航按钮
        document.getElementById('prev-btn').addEventListener('click', () => {
            gallery.previous();
        });

        document.getElementById('next-btn').addEventListener('click', () => {
            gallery.next();
        });

        // 触摸手势支持
        let touchStartX = 0;
        let touchStartY = 0;

        this.renderer.domElement.addEventListener('touchstart', (e) => {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        });

        this.renderer.domElement.addEventListener('touchend', (e) => {
            const touchEndX = e.changedTouches[0].clientX;
            const touchEndY = e.changedTouches[0].clientY;
            const deltaX = touchEndX - touchStartX;
            const deltaY = touchEndY - touchStartY;

            // 水平滑动超过100px时切换展品
            if (Math.abs(deltaX) > 100 && Math.abs(deltaY) < 50) {
                if (deltaX > 0) {
                    gallery.previous();
                } else {
                    gallery.next();
                }
            }
        });
    }

    /**
     * 标记识别事件
     */
    _onMarkerFound() {
        console.log('标记已识别');
        this.isMarkerFound = true;
        this.ui.statusDot.classList.add('active');
        this.ui.statusText.textContent = '已识别标记';
        this.ui.infoPanel.classList.remove('hidden');
        this.ui.instructions.classList.add('hidden');

        // 加载当前展品模型
        this._loadCurrentModel();
    }

    /**
     * 标记丢失事件
     */
    _onMarkerLost() {
        console.log('标记丢失');
        this.isMarkerFound = false;
        this.ui.statusDot.classList.remove('active');
        this.ui.statusText.textContent = '正在寻找标记...';
        this.ui.infoPanel.classList.add('hidden');
        this.ui.instructions.classList.remove('hidden');
    }

    /**
     * 展品切换事件
     */
    async _onExhibitChange(data) {
        console.log('切换展品:', data.current.name);

        // 移除旧模型
        if (this.currentModel) {
            this.markerRoot.remove(this.currentModel);
            this.currentModel = null;
        }

        // 加载新模型
        if (this.isMarkerFound) {
            await this._loadCurrentModel();
        }
    }

    /**
     * 加载当前展品模型
     */
    async _loadCurrentModel() {
        const exhibit = gallery.getCurrentExhibit();

        if (!exhibit || !exhibit.modelPath) {
            console.warn('展品或模型路径不存在');
            return;
        }

        try {
            // 显示加载进度
            this.ui.loading.classList.remove('hidden');
            this.ui.loadingText.textContent = '加载模型中...';
            this.ui.progressFill.style.width = '0%';

            // 加载GLTF模型
            const gltf = await new Promise((resolve, reject) => {
                this.modelLoader.load(
                    exhibit.modelPath,
                    resolve,
                    (xhr) => {
                        const progress = (xhr.loaded / xhr.total) * 100;
                        this.ui.progressFill.style.width = progress + '%';
                    },
                    reject
                );
            });

            // 设置模型位置和缩放
            const model = gltf.scene;
            model.position.set(
                exhibit.position.x,
                exhibit.position.y,
                exhibit.position.z
            );

            // 计算模型边界并自动缩放
            const box = new THREE.Box3().setFromObject(model);
            const size = box.getSize(new THREE.Vector3());
            const maxDim = Math.max(size.x, size.y, size.z);
            const scale = (1.5 / maxDim) * exhibit.scale;
            model.scale.setScalar(scale);

            // 设置阴影
            model.traverse((child) => {
                if (child.isMesh) {
                    child.castShadow = true;
                    child.receiveShadow = true;
                }
            });

            // 添加到标记根节点
            this.markerRoot.add(model);
            this.currentModel = model;

            console.log('模型加载完成:', exhibit.name);

        } catch (error) {
            console.error('模型加载失败:', error);

            // 创建备用立方体表示模型
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshPhongMaterial({
                color: 0x4CAF50,
                shininess: 100
            });
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(0, 0.5, 0);
            this.markerRoot.add(cube);
            this.currentModel = cube;

            console.log('已创建备用模型');
        }

        // 隐藏加载界面
        this.ui.loading.classList.add('hidden');
    }

    /**
     * 隐藏加载界面
     */
    _hideLoading() {
        this.ui.loading.classList.add('hidden');
    }

    /**
     * 窗口大小变化处理
     */
    _onWindowResize() {
        this.arToolkitSource.onResizeElement();
        this.arToolkitSource.copyElementSizeTo(this.renderer.domElement);

        if (this.arToolkitContext.arController !== null) {
            this.arToolkitSource.copyElementSizeTo(this.arToolkitContext.arController.canvas);
        }
    }

    /**
     * 渲染循环
     */
    _animate() {
        requestAnimationFrame(() => this._animate());

        // 更新AR上下文
        if (this.arToolkitContext) {
            this.arToolkitContext.update(this.arToolkitSource.domElement);
        }

        // 渲染场景
        this.renderer.render(this.scene, this.camera);
    }
}

// 创建应用实例并初始化
let app = null;

document.addEventListener('DOMContentLoaded', () => {
    app = new ARGalleryApp();
    app.init();
});
