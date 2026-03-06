/**
 * 交互管理器
 * 处理用户输入和场景交互
 */

class InteractionManager {
    constructor(scene, config) {
        this.scene = scene;
        this.config = config;
        this.raycaster = new THREE.Raycaster();
        this.mouse = new THREE.Vector2();
        this.isDragging = false;
        this.isShiftDown = false;
        this.previousMousePosition = { x: 0, y: 0 };
        this.selectedObject = null;
        this.autoRotateEnabled = false;

        this.setupEventListeners();
    }

    /**
     * 设置事件监听器
     */
    setupEventListeners() {
        const canvas = this.scene.renderer.domElement;

        // 鼠标事件
        canvas.addEventListener('click', (event) => this.onClick(event));
        canvas.addEventListener('mousedown', (event) => this.onMouseDown(event));
        canvas.addEventListener('mousemove', (event) => this.onMouseMove(event));
        canvas.addEventListener('mouseup', (event) => this.onMouseUp(event));
        canvas.addEventListener('wheel', (event) => this.onWheel(event));
        canvas.addEventListener('contextmenu', (event) => event.preventDefault());

        // 触摸事件
        canvas.addEventListener('touchstart', (event) => this.onTouchStart(event), { passive: false });
        canvas.addEventListener('touchmove', (event) => this.onTouchMove(event), { passive: false });
        canvas.addEventListener('touchend', (event) => this.onTouchEnd(event));

        // 键盘事件
        window.addEventListener('keydown', (event) => this.onKeyDown(event));
        window.addEventListener('keyup', (event) => this.onKeyUp(event));

        // UI按钮事件
        this.setupUIButtons();
    }

    /**
     * 设置UI按钮事件
     */
    setupUIButtons() {
        // 重置视角
        const resetBtn = document.getElementById('btn-reset-view');
        if (resetBtn) {
            resetBtn.addEventListener('click', () => this.resetView());
        }

        // 自动旋转
        const rotateBtn = document.getElementById('btn-auto-rotate');
        if (rotateBtn) {
            rotateBtn.addEventListener('click', () => this.toggleAutoRotate());
        }

        // 显示网格
        const gridBtn = document.getElementById('btn-toggle-grid');
        if (gridBtn) {
            gridBtn.addEventListener('click', () => this.toggleGrid());
        }

        // 显示标签
        const labelsBtn = document.getElementById('btn-toggle-labels');
        if (labelsBtn) {
            labelsBtn.addEventListener('click', () => this.toggleLabels());
        }

        // 关闭信息面板
        const closeInfoBtn = document.getElementById('btn-close-info');
        if (closeInfoBtn) {
            closeInfoBtn.addEventListener('click', () => this.closeInfoPanel());
        }
    }

    /**
     * 鼠标点击事件
     */
    onClick(event) {
        if (this.isDragging) return;

        this.updateMousePosition(event);
        this.raycaster.setFromCamera(this.mouse, this.scene.camera);

        const intersects = this.raycaster.intersectObjects(this.scene.exhibits, true);

        if (intersects.length > 0) {
            // 找到第一个有userData的父对象
            let object = intersects[0].object;
            while (object.parent && !object.userData.id) {
                object = object.parent;
            }

            if (object.userData.id) {
                this.selectObject(object);
            }
        } else {
            this.deselectObject();
        }
    }

    /**
     * 鼠标按下事件
     */
    onMouseDown(event) {
        this.isDragging = false;
        this.previousMousePosition = {
            x: event.clientX,
            y: event.clientY,
        };

        const onMouseMove = (e) => {
            const deltaX = e.clientX - this.previousMousePosition.x;
            const deltaY = e.clientY - this.previousMousePosition.y;

            if (Math.abs(deltaX) > 5 || Math.abs(deltaY) > 5) {
                this.isDragging = true;
            }
        };

        const onMouseUp = () => {
            window.removeEventListener('mousemove', onMouseMove);
            window.removeEventListener('mouseup', onMouseUp);
        };

        window.addEventListener('mousemove', onMouseMove);
        window.addEventListener('mouseup', onMouseUp);
    }

    /**
     * 鼠标移动事件
     */
    onMouseMove(event) {
        if (!this.isDragging || !this.selectedObject) return;

        const deltaX = event.clientX - this.previousMousePosition.x;
        const deltaY = event.clientY - this.previousMousePosition.y;

        if (this.isShiftDown) {
            // 平移
            this.selectedObject.position.x += deltaX * this.config.interaction.panSpeed * 0.01;
            this.selectedObject.position.y -= deltaY * this.config.interaction.panSpeed * 0.01;
        } else {
            // 旋转
            this.selectedObject.rotation.y += deltaX * this.config.interaction.rotateSpeed;
            this.selectedObject.rotation.x += deltaY * this.config.interaction.rotateSpeed;
        }

        this.previousMousePosition = {
            x: event.clientX,
            y: event.clientY,
        };
    }

    /**
     * 鼠标抬起事件
     */
    onMouseUp(event) {
        this.isDragging = false;
    }

    /**
     * 鼠标滚轮事件
     */
    onWheel(event) {
        event.preventDefault();

        if (this.selectedObject) {
            const delta = event.deltaY * this.config.interaction.zoomSpeed;
            const scale = 1 - delta * 0.01;

            this.selectedObject.scale.multiplyScalar(scale);

            // 限制缩放范围
            const minScale = 0.1;
            const maxScale = 5;
            this.selectedObject.scale.clampScalar(minScale, maxScale);
        }
    }

    /**
     * 触摸开始事件
     */
    onTouchStart(event) {
        event.preventDefault();

        if (event.touches.length === 1) {
            this.updateMousePosition(event.touches[0]);
            this.previousMousePosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY,
            };
        }
    }

    /**
     * 触摸移动事件
     */
    onTouchMove(event) {
        event.preventDefault();

        if (event.touches.length === 1 && this.selectedObject) {
            const deltaX = event.touches[0].clientX - this.previousMousePosition.x;
            const deltaY = event.touches[0].clientY - this.previousMousePosition.y;

            this.selectedObject.rotation.y += deltaX * this.config.interaction.rotateSpeed;
            this.selectedObject.rotation.x += deltaY * this.config.interaction.rotateSpeed;

            this.previousMousePosition = {
                x: event.touches[0].clientX,
                y: event.touches[0].clientY,
            };
        }
    }

    /**
     * 触摸结束事件
     */
    onTouchEnd(event) {
        if (event.changedTouches.length === 1) {
            this.updateMousePosition(event.changedTouches[0]);
            this.raycaster.setFromCamera(this.mouse, this.scene.camera);

            const intersects = this.raycaster.intersectObjects(this.scene.exhibits, true);

            if (intersects.length > 0) {
                let object = intersects[0].object;
                while (object.parent && !object.userData.id) {
                    object = object.parent;
                }

                if (object.userData.id) {
                    this.selectObject(object);
                }
            }
        }
    }

    /**
     * 键盘按下事件
     */
    onKeyDown(event) {
        this.isShiftDown = event.shiftKey;

        switch (event.key) {
            case 'r':
            case 'R':
                this.resetView();
                break;
            case 'g':
            case 'G':
                this.toggleGrid();
                break;
            case 'Escape':
                this.deselectObject();
                break;
        }
    }

    /**
     * 键盘抬起事件
     */
    onKeyUp(event) {
        if (event.key === 'Shift') {
            this.isShiftDown = false;
        }
    }

    /**
     * 更新鼠标位置
     */
    updateMousePosition(event) {
        this.mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
        this.mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    }

    /**
     * 选择对象
     */
    selectObject(object) {
        // 取消之前选中的对象
        if (this.selectedObject && this.selectedObject !== object) {
            this.deselectObject();
        }

        this.selectedObject = object;

        // 高亮效果
        this.highlightObject(object, true);

        // 显示信息面板
        this.showInfoPanel(object.userData);

        // 添加选中动画
        this.animateSelection(object);
    }

    /**
     * 取消选择对象
     */
    deselectObject() {
        if (this.selectedObject) {
            this.highlightObject(this.selectedObject, false);
            this.selectedObject = null;
        }

        this.closeInfoPanel();
    }

    /**
     * 高亮对象
     */
    highlightObject(object, highlight) {
        object.traverse((child) => {
            if (child.isMesh && child.material) {
                if (highlight) {
                    if (!child.userData.originalEmissive) {
                        child.userData.originalEmissive = child.material.emissive
                            ? child.material.emissive.getHex()
                            : 0x000000;
                    }

                    if (child.material.emissive) {
                        child.material.emissive.setHex(0x333333);
                    }
                } else {
                    if (child.material.emissive && child.userData.originalEmissive !== undefined) {
                        child.material.emissive.setHex(child.userData.originalEmissive);
                    }
                }
            }
        });
    }

    /**
     * 显示信息面板
     */
    showInfoPanel(data) {
        const infoPanel = document.getElementById('info-panel');
        const exhibitInfo = document.getElementById('exhibit-info');

        if (infoPanel && exhibitInfo) {
            exhibitInfo.innerHTML = `
                <h4>${data.name}</h4>
                <p class="description">${data.description}</p>
                <div class="info-details">
                    <p><strong>类型:</strong> ${this.getTypeName(data.type)}</p>
                    <p><strong>ID:</strong> ${data.id}</p>
                </div>
                <div class="info-actions">
                    <button onclick="window.interaction.rotateSelected()" class="action-btn">
                        旋转
                    </button>
                    <button onclick="window.interaction.resetSelected()" class="action-btn">
                        重置
                    </button>
                </div>
            `;

            infoPanel.classList.add('visible');
        }
    }

    /**
     * 关闭信息面板
     */
    closeInfoPanel() {
        const infoPanel = document.getElementById('info-panel');
        if (infoPanel) {
            infoPanel.classList.remove('visible');
        }
    }

    /**
     * 旋转选中的对象
     */
    rotateSelected() {
        if (this.selectedObject) {
            this.selectedObject.userData.autoRotate = !this.selectedObject.userData.autoRotate;
        }
    }

    /**
     * 重置选中的对象
     */
    resetSelected() {
        if (this.selectedObject) {
            this.selectedObject.rotation.set(0, 0, 0);
            this.selectedObject.scale.set(1, 1, 1);
        }
    }

    /**
     * 重置视角
     */
    resetView() {
        this.scene.exhibits.forEach((exhibit) => {
            exhibit.rotation.set(
                exhibit.userData.rotation?.x || 0,
                exhibit.userData.rotation?.y || 0,
                exhibit.userData.rotation?.z || 0
            );
            exhibit.scale.set(
                exhibit.userData.scale?.x || 1,
                exhibit.userData.scale?.y || 1,
                exhibit.userData.scale?.z || 1
            );
        });

        this.deselectObject();
    }

    /**
     * 切换自动旋转
     */
    toggleAutoRotate() {
        this.autoRotateEnabled = !this.autoRotateEnabled;

        const btn = document.getElementById('btn-auto-rotate');
        if (btn) {
            btn.classList.toggle('active', this.autoRotateEnabled);
        }

        this.scene.exhibits.forEach((exhibit) => {
            exhibit.userData.autoRotate = this.autoRotateEnabled;
        });
    }

    /**
     * 切换网格显示
     */
    toggleGrid() {
        const gridHelper = this.scene.scene.getObjectByName('gridHelper');
        if (gridHelper) {
            gridHelper.visible = !gridHelper.visible;

            const btn = document.getElementById('btn-toggle-grid');
            if (btn) {
                btn.classList.toggle('active', gridHelper.visible);
            }
        }
    }

    /**
     * 切换标签显示
     */
    toggleLabels() {
        // TODO: 实现标签切换功能
        const btn = document.getElementById('btn-toggle-labels');
        if (btn) {
            btn.classList.toggle('active');
        }
    }

    /**
     * 选中动画
     */
    animateSelection(object) {
        const originalScale = object.scale.clone();
        const targetScale = originalScale.clone().multiplyScalar(1.1);

        // 简单的弹跳动画
        let startTime = null;
        const duration = 200;

        const animate = (currentTime) => {
            if (!startTime) startTime = currentTime;
            const elapsed = currentTime - startTime;
            const progress = Math.min(elapsed / duration, 1);

            // 使用缓动函数
            const easeProgress = 1 - Math.pow(1 - progress, 3);

            const currentScale = originalScale.clone().lerp(targetScale, easeProgress);
            object.scale.copy(currentScale);

            if (progress < 1) {
                requestAnimationFrame(animate);
            } else {
                object.scale.copy(originalScale);
            }
        };

        requestAnimationFrame(animate);
    }

    /**
     * 获取类型名称
     */
    getTypeName(type) {
        const typeNames = {
            sculpture: '雕塑',
            vase: '花瓶',
            technology: '科技',
            default: '其他',
        };
        return typeNames[type] || typeNames.default;
    }

    /**
     * 销毁
     */
    dispose() {
        // 清理事件监听器
        const canvas = this.scene.renderer.domElement;
        canvas.removeEventListener('click', this.onClick);
        canvas.removeEventListener('mousedown', this.onMouseDown);
        canvas.removeEventListener('mousemove', this.onMouseMove);
        canvas.removeEventListener('mouseup', this.onMouseUp);
        canvas.removeEventListener('wheel', this.onWheel);
    }
}
