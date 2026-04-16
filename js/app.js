/**
 * 3D虚拟试衣间应用主程序
 * 负责初始化、事件监听和各模块协调
 */

class VirtualDressingRoom {
    constructor() {
        this.sceneManager = null;
        this.isLoaded = false;

        // DOM元素
        this.loadingElement = document.getElementById('loading');
        this.dressButtons = document.querySelectorAll('.dress-btn');
        this.colorButtons = document.querySelectorAll('.color-btn');
        this.windSlider = document.getElementById('wind-strength');
        this.elasticitySlider = document.getElementById('elasticity');
        this.resetViewButton = document.getElementById('reset-view');
        this.resetPhysicsButton = document.getElementById('reset-physics');

        this.init();
    }

    async init() {
        try {
            // 等待Three.js加载
            await this.waitForThreeJS();

            // 初始化场景管理器
            this.sceneManager = new SceneManager();

            // 隐藏加载动画
            this.loadingElement.classList.add('hidden');
            this.isLoaded = true;

            // 设置事件监听
            this.setupEventListeners();

            console.log('3D虚拟试衣间初始化完成');
        } catch (error) {
            console.error('初始化失败:', error);
            this.loadingElement.innerHTML = `
                <div class="spinner"></div>
                <p style="color: #e74c3c;">加载失败，请刷新页面重试</p>
            `;
        }
    }

    waitForThreeJS() {
        return new Promise((resolve, reject) => {
            const checkThree = () => {
                if (typeof THREE !== 'undefined') {
                    resolve();
                } else {
                    setTimeout(checkThree, 100);
                }
            };

            // 5秒超时
            const timeout = setTimeout(() => {
                reject(new Error('Three.js加载超时'));
            }, 5000);

            checkThree().then(() => clearTimeout(timeout));
        });
    }

    setupEventListeners() {
        // 服装选择
        this.dressButtons.forEach(button => {
            button.addEventListener('click', () => {
                const dressId = button.getAttribute('data-dress');
                this.changeDress(dressId, button);
            });
        });

        // 颜色选择
        this.colorButtons.forEach(button => {
            button.addEventListener('click', () => {
                const color = button.getAttribute('data-color');
                this.changeColor(color, button);
            });
        });

        // 风力滑块
        this.windSlider.addEventListener('input', (e) => {
            const strength = parseInt(e.target.value);
            if (this.sceneManager) {
                this.sceneManager.setWindStrength(strength);
            }
        });

        // 弹性滑块
        this.elasticitySlider.addEventListener('input', (e) => {
            const elasticity = parseInt(e.target.value) / 100;
            if (this.sceneManager) {
                this.sceneManager.setElasticity(elasticity);
            }
        });

        // 重置视角
        this.resetViewButton.addEventListener('click', () => {
            if (this.sceneManager) {
                this.sceneManager.resetCamera();
            }
        });

        // 重置物理
        this.resetPhysicsButton.addEventListener('click', () => {
            if (this.sceneManager) {
                this.sceneManager.resetPhysics();
            }
        });
    }

    changeDress(dressId, activeButton) {
        if (!this.sceneManager) return;

        // 更新按钮状态
        this.dressButtons.forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');

        // 加载新服装
        this.sceneManager.loadDress(dressId);

        // 更新风力滑块值
        const config = this.sceneManager.dressManager.getDressConfig(dressId);
        if (config) {
            this.windSlider.value = config.windStrength;
            this.elasticitySlider.value = config.stiffness * 100;
        }
    }

    changeColor(color, activeButton) {
        if (!this.sceneManager) return;

        // 更新按钮状态
        this.colorButtons.forEach(btn => btn.classList.remove('active'));
        activeButton.classList.add('active');

        // 更改服装颜色
        this.sceneManager.changeDressColor(color);
    }
}

// 页面加载完成后初始化
document.addEventListener('DOMContentLoaded', () => {
    const app = new VirtualDressingRoom();

    // 添加到全局以便调试
    window.app = app;
});
