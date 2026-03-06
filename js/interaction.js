// AR展厅交互处理模块
class InteractionHandler {
    constructor() {
        this.mainGroup = null;
        this.isDragging = false;
        this.isPinching = false;
        this.controlsEnabled = true;

        // 手势状态
        this.startX = 0;
        this.startY = 0;
        this.currentRotationX = 0;
        this.currentRotationY = 0;
        this.startDistance = 0;
        this.startScale = 1;

        // 当前状态
        this.rotation = { x: 0, y: 0 };
        this.scale = 1;

        this.init();
    }

    init() {
        // 等待场景加载完成
        document.addEventListener('DOMContentLoaded', () => {
            setTimeout(() => {
                this.setupInteraction();
                this.setupControlsListener();
            }, 1000);
        });
    }

    setupInteraction() {
        // 获取主要展品组
        this.mainGroup = document.querySelector('#exhibit-group');

        if (!this.mainGroup) {
            console.error('未找到展品组元素');
            return;
        }

        console.log('设置交互处理...');

        // 添加触摸事件
        document.addEventListener('touchstart', (e) => this.handleTouchStart(e), { passive: false });
        document.addEventListener('touchmove', (e) => this.handleTouchMove(e), { passive: false });
        document.addEventListener('touchend', (e) => this.handleTouchEnd(e), { passive: false });

        // 添加鼠标事件（桌面测试用）
        document.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        document.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        document.addEventListener('wheel', (e) => this.handleWheel(e), { passive: false });

        console.log('交互处理设置完成');
    }

    setupControlsListener() {
        // 监听控制开关状态
        window.addEventListener('controlsToggled', (e) => {
            this.controlsEnabled = e.detail.enabled;
        });
    }

    // 触摸事件处理
    handleTouchStart(e) {
        if (!this.controlsEnabled) return;

        const touches = e.touches;

        if (touches.length === 1) {
            // 单指拖动
            this.isDragging = true;
            this.startX = touches[0].clientX;
            this.startY = touches[0].clientY;

            // 获取当前旋转状态
            const currentRotation = this.mainGroup.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
            this.rotation = { x: currentRotation.x, y: currentRotation.y };

        } else if (touches.length === 2) {
            // 双指缩放
            this.isPinching = true;
            this.isDragging = false;

            const distance = this.getDistance(touches[0], touches[1]);
            this.startDistance = distance;
            this.startScale = this.scale;

            e.preventDefault(); // 防止页面缩放
        }
    }

    handleTouchMove(e) {
        if (!this.controlsEnabled) return;

        const touches = e.touches;

        if (this.isDragging && touches.length === 1) {
            // 单指旋转
            const deltaX = touches[0].clientX - this.startX;
            const deltaY = touches[0].clientY - this.startY;

            const rotateSpeed = 0.3;
            const newRotationY = this.rotation.y + (deltaX * rotateSpeed);
            const newRotationX = this.rotation.x + (deltaY * rotateSpeed);

            this.mainGroup.setAttribute('rotation', {
                x: newRotationX,
                y: newRotationY,
                z: 0
            });

        } else if (this.isPinching && touches.length === 2) {
            // 双指缩放
            const distance = this.getDistance(touches[0], touches[1]);
            const scaleRatio = distance / this.startDistance;
            const newScale = Math.max(0.1, Math.min(5, this.startScale * scaleRatio));

            this.scale = newScale;
            this.mainGroup.setAttribute('scale', {
                x: newScale,
                y: newScale,
                z: newScale
            });

            e.preventDefault();
        }
    }

    handleTouchEnd(e) {
        this.isDragging = false;
        this.isPinching = false;
    }

    // 鼠标事件处理（桌面测试）
    handleMouseDown(e) {
        if (!this.controlsEnabled) return;

        this.isDragging = true;
        this.startX = e.clientX;
        this.startY = e.clientY;

        const currentRotation = this.mainGroup.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
        this.rotation = { x: currentRotation.x, y: currentRotation.y };
    }

    handleMouseMove(e) {
        if (!this.isDragging || !this.controlsEnabled) return;

        const deltaX = e.clientX - this.startX;
        const deltaY = e.clientY - this.startY;

        const rotateSpeed = 0.3;
        const newRotationY = this.rotation.y + (deltaX * rotateSpeed);
        const newRotationX = this.rotation.x + (deltaY * rotateSpeed);

        this.mainGroup.setAttribute('rotation', {
            x: newRotationX,
            y: newRotationY,
            z: 0
        });
    }

    handleMouseUp(e) {
        this.isDragging = false;
    }

    handleWheel(e) {
        if (!this.controlsEnabled) return;

        e.preventDefault();

        const zoomSpeed = 0.001;
        const delta = -e.deltaY;
        const newScale = Math.max(0.1, Math.min(5, this.scale + (delta * zoomSpeed)));

        this.scale = newScale;
        this.mainGroup.setAttribute('scale', {
            x: newScale,
            y: newScale,
            z: newScale
        });
    }

    // 工具函数：计算两点间距离
    getDistance(touch1, touch2) {
        const dx = touch1.clientX - touch2.clientX;
        const dy = touch1.clientY - touch2.clientY;
        return Math.sqrt(dx * dx + dy * dy);
    }
}

// 初始化交互处理
const interactionHandler = new InteractionHandler();

// A-Frame手势组件 (备用方案)
AFRAME.registerComponent('gesture-handler', {
    schema: {
        enabled: { type: 'boolean', default: true }
    },

    init: function() {
        this.el.sceneEl.addEventListener('render-target-loaded', () => {
            this.setupGestures();
        });
    },

    setupGestures: function() {
        const el = this.el;

        // 触摸开始
        el.addEventListener('touchstart', (e) => {
            if (!this.data.enabled) return;

            const touches = e.touches;
            if (touches.length === 2) {
                // 双指缩放开始
                const distance = Math.hypot(
                    touches[0].clientX - touches[1].clientX,
                    touches[0].clientY - touches[1].clientY
                );

                el.dataset.startDistance = distance;
                const currentScale = el.getAttribute('scale') || { x: 1, y: 1, z: 1 };
                el.dataset.startScale = currentScale.x;
            }
        });

        // 触摸移动
        el.addEventListener('touchmove', (e) => {
            if (!this.data.enabled) return;

            const touches = e.touches;
            if (touches.length === 2) {
                // 双指缩放中
                const distance = Math.hypot(
                    touches[0].clientX - touches[1].clientX,
                    touches[0].clientY - touches[1].clientY
                );

                const startDistance = parseFloat(el.dataset.startDistance) || distance;
                const startScale = parseFloat(el.dataset.startScale) || 1;

                const scale = Math.max(0.1, Math.min(5, startScale * (distance / startDistance)));

                el.setAttribute('scale', {
                    x: scale,
                    y: scale,
                    z: scale
                });
            }
        });

        // 触摸结束
        el.addEventListener('touchend', () => {
            delete el.dataset.startDistance;
            delete el.dataset.startScale;
        });
    }
});
