/**
 * AR展厅应用主入口
 * 初始化和协调所有模块
 */

class ARShowroomApp {
    constructor(config) {
        this.config = config;
        this.arScene = null;
        this.modelManager = null;
        this.interactionManager = null;
        this.uiManager = null;
        this.effectsManager = null;
        this.audioManager = null;
        this.performanceManager = null;
        this.isInitialized = false;

        this.init();
    }

    /**
     * 初始化应用
     */
    init() {
        try {
            console.log('正在初始化AR展厅应用...');

            // 等待DOM加载完成
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => this.initializeApp());
            } else {
                this.initializeApp();
            }
        } catch (error) {
            console.error('应用初始化失败:', error);
            this.handleInitError(error);
        }
    }

    /**
     * 初始化应用组件
     */
    initializeApp() {
        try {
            // 初始化UI管理器
            this.uiManager = new UIManager(this.config);

            // 检查兼容性
            this.uiManager.checkCompatibility();

            // 初始化AR场景
            this.arScene = new ARScene(this.config);

            // 等待AR场景准备好
            this.waitForARScene()
                .then(() => {
                    this.onSceneReady();
                })
                .catch((error) => {
                    console.error('AR场景准备失败:', error);
                    this.uiManager.showError(
                        'AR场景初始化失败',
                        error.message
                    );
                });

        } catch (error) {
            console.error('应用初始化失败:', error);
            this.handleInitError(error);
        }
    }

    /**
     * 等待AR场景准备完成
     */
    waitForARScene() {
        return new Promise((resolve) => {
            const checkInterval = setInterval(() => {
                if (this.arScene && this.arScene.isInitialized) {
                    clearInterval(checkInterval);
                    resolve();
                }
            }, 100);

            // 超时处理
            setTimeout(() => {
                clearInterval(checkInterval);
                if (!this.arScene || !this.arScene.isInitialized) {
                    resolve(); // 即使超时也继续，让用户体验基本功能
                }
            }, this.config.ui.loadingTimeout);
        });
    }

    /**
     * 场景准备完成回调
     */
    onSceneReady() {
        console.log('AR场景准备完成');

        // 初始化模型管理器
        this.modelManager = new ModelManager(this.arScene, this.config);

        // 创建展品
        this.modelManager.createExhibits();

        // 初始化交互管理器
        this.interactionManager = new InteractionManager(this.arScene, this.config);

        // 将交互管理器设为全局变量，以便HTML中的onclick可以访问
        window.interaction = this.interactionManager;

        // 初始化效果管理器
        this.effectsManager = new EffectsManager(this.arScene, this.config);
        this.effectsManager.init();

        // 初始化音频管理器
        this.audioManager = new AudioManager(this.config);
        this.audioManager.init();

        // 初始化性能监控
        this.performanceManager = new PerformanceManager(this.config);
        if (this.config.performance.monitorEnabled) {
            this.performanceManager.startMonitoring(this.arScene);
        }

        // 设置动画更新循环
        this.setupAnimationLoop();

        // 显示欢迎信息
        setTimeout(() => {
            this.uiManager.showWelcome();
        }, 1000);

        this.isInitialized = true;
        console.log('AR展厅应用初始化完成');
    }

    /**
     * 设置动画循环
     */
    setupAnimationLoop() {
        let lastTime = performance.now();

        const animate = () => {
            requestAnimationFrame(animate);

            const currentTime = performance.now();
            const delta = (currentTime - lastTime) / 1000;
            lastTime = currentTime;

            // 更新模型动画
            if (this.modelManager) {
                this.modelManager.updateAnimations(delta);
            }

            // 更新粒子效果
            if (this.effectsManager) {
                this.effectsManager.updateParticles(delta);
            }
        };

        animate();
    }

    /**
     * 处理初始化错误
     */
    handleInitError(error) {
        console.error('初始化错误:', error);

        if (this.uiManager) {
            this.uiManager.showError(
                '应用初始化失败',
                `错误: ${error.message}`
            );
        }
    }

    /**
     * 重新初始化应用
     */
    reinitialize() {
        console.log('重新初始化应用...');

        // 清理现有资源
        this.dispose();

        // 重新初始化
        setTimeout(() => {
            this.init();
        }, 1000);
    }

    /**
     * 获取应用状态
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            arSceneReady: this.arScene?.isInitialized || false,
            exhibitorsCount: this.modelManager?.models.size || 0,
            fps: this.arScene?.fps || 0,
        };
    }

    /**
     * 切换调试模式
     */
    toggleDebugMode() {
        this.config.ui.debugMode = !this.config.ui.debugMode;
        console.log('调试模式:', this.config.ui.debugMode ? '开启' : '关闭');
    }

    /**
     * 导出应用数据
     */
    exportData() {
        const data = {
            version: this.config.version,
            timestamp: new Date().toISOString(),
            exhibits: this.config.exhibits.map(exhibit => ({
                id: exhibit.id,
                name: exhibit.name,
                type: exhibit.type,
            })),
            status: this.getStatus(),
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `ar-showroom-data-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);

        this.uiManager.showMessage('数据已导出');
    }

    /**
     * 清理资源
     */
    dispose() {
        console.log('清理资源...');

        if (this.interactionManager) {
            this.interactionManager.dispose();
        }

        if (this.modelManager) {
            this.modelManager.clearAll();
        }

        if (this.arScene) {
            this.arScene.dispose();
        }

        if (this.effectsManager) {
            this.effectsManager.dispose();
        }

        if (this.audioManager) {
            this.audioManager.dispose();
        }

        if (this.performanceManager) {
            this.performanceManager.dispose();
        }

        this.isInitialized = false;
    }

    /**
     * 获取系统信息
     */
    getSystemInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            deviceMemory: navigator.deviceMemory,
            cores: navigator.hardwareConcurrency,
            webGL: this.getWebGLInfo(),
        };
    }

    /**
     * 获取WebGL信息
     */
    getWebGLInfo() {
        const canvas = document.createElement('canvas');
        const gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');

        if (!gl) {
            return { supported: false };
        }

        const debugInfo = gl.getExtension('WEBGL_debug_renderer_info');

        return {
            supported: true,
            vendor: debugInfo ? gl.getParameter(debugInfo.UNMASKED_VENDOR_WEBGL) : 'unknown',
            renderer: debugInfo ? gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL) : 'unknown',
            version: gl.getParameter(gl.VERSION),
            shadingLanguageVersion: gl.getParameter(gl.SHADING_LANGUAGE_VERSION),
        };
    }

    /**
     * 打印系统信息到控制台
     */
    logSystemInfo() {
        const info = this.getSystemInfo();
        console.group('系统信息');
        console.log('平台:', info.platform);
        console.log('用户代理:', info.userAgent);
        console.log('语言:', info.language);
        console.log('设备内存:', info.deviceMemory, 'GB');
        console.log('CPU核心:', info.cores);
        console.log('WebGL:', info.webGL);
        console.groupEnd();
    }
}

// 全局应用实例
let app;

// 应用启动
function startApp() {
    console.log('启动AR展厅应用...');

    // 创建应用实例
    app = new ARShowroomApp(AppConfig);

    // 输出系统信息
    app.logSystemInfo();

    // 将app实例设为全局变量
    window.app = app;

    // 添加全局错误处理
    window.addEventListener('error', (event) => {
        console.error('全局错误:', event.error);
    });

    window.addEventListener('unhandledrejection', (event) => {
        console.error('未处理的Promise拒绝:', event.reason);
    });
}

// 当DOM加载完成后启动应用
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', startApp);
} else {
    startApp();
}

// 导出为全局变量
if (typeof window !== 'undefined') {
    window.ARShowroomApp = ARShowroomApp;
    window.startApp = startApp;
}
