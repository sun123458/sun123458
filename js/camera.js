/**
 * 相机控制模块
 * 扩展OrbitControls，提供额外的相机动画和视角管理
 */

class CameraManager {
    constructor(camera, renderer) {
        this.camera = camera;
        this.renderer = renderer;
        this.controls = null;
        this.targetPosition = null;
        this.targetLookAt = null;
        this.isAnimating = false;
        this.animationProgress = 0;
        this.animationDuration = 1.0;
        this.startPosition = null;
        this.startLookAt = null;

        // 预设视角
        this.views = {
            front: {
                position: new THREE.Vector3(0, 0, 5),
                target: new THREE.Vector3(0, 0.8, 0)
            },
            back: {
                position: new THREE.Vector3(0, 0, -5),
                target: new THREE.Vector3(0, 0.8, 0)
            },
            left: {
                position: new THREE.Vector3(-5, 0, 0),
                target: new THREE.Vector3(0, 0.8, 0)
            },
            right: {
                position: new THREE.Vector3(5, 0, 0),
                target: new THREE.Vector3(0, 0.8, 0)
            },
            top: {
                position: new THREE.Vector3(0, 5, 0.1),
                target: new THREE.Vector3(0, 0.8, 0)
            },
            bottom: {
                position: new THREE.Vector3(0, -2, 3),
                target: new THREE.Vector3(0, 0.8, 0)
            },
            diagonal: {
                position: new THREE.Vector3(3, 2, 3),
                target: new THREE.Vector3(0, 0.8, 0)
            }
        };

        this.initControls();
    }

    initControls() {
        // OrbitControls 已在外部加载
        // 这里初始化控制器
    }

    setControls(controls) {
        this.controls = controls;
    }

    // 设置OrbitControls参数
    configureControls(options = {}) {
        if (!this.controls) return;

        const defaults = {
            enableDamping: true,
            dampingFactor: 0.05,
            rotateSpeed: 0.5,
            enablePan: true,
            enableZoom: true,
            minDistance: 2,
            maxDistance: 10,
            maxPolarAngle: Math.PI / 2 + 0.2,
            minPolarAngle: Math.PI / 4
        };

        const settings = { ...defaults, ...options };

        this.controls.enableDamping = settings.enableDamping;
        this.controls.dampingFactor = settings.dampingFactor;
        this.controls.rotateSpeed = settings.rotateSpeed;
        this.controls.enablePan = settings.enablePan;
        this.controls.enableZoom = settings.enableZoom;
        this.controls.minDistance = settings.minDistance;
        this.controls.maxDistance = settings.maxDistance;
        this.controls.maxPolarAngle = settings.maxPolarAngle;
        this.controls.minPolarAngle = settings.minPolarAngle;
    }

    // 平滑移动相机到指定位置
    animateTo(position, target, duration = 1.0) {
        this.startPosition = this.camera.position.clone();
        this.startLookAt = this.controls ? this.controls.target.clone() : new THREE.Vector3();
        this.targetPosition = position.clone();
        this.targetLookAt = target.clone();
        this.animationDuration = duration;
        this.animationProgress = 0;
        this.isAnimating = true;
    }

    // 使用预设视角
    animateToView(viewName, duration = 1.0) {
        const view = this.views[viewName];
        if (view) {
            this.animateTo(view.position, view.target, duration);
        }
    }

    // 更新动画
    update(deltaTime) {
        if (!this.isAnimating) return false;

        this.animationProgress += deltaTime / this.animationDuration;

        if (this.animationProgress >= 1.0) {
            this.animationProgress = 1.0;
            this.isAnimating = false;
        }

        // 缓动函数 (easeInOutCubic)
        const t = this.animationProgress;
        const easedT = t < 0.5
            ? 4 * t * t * t
            : 1 - Math.pow(-2 * t + 2, 3) / 2;

        // 插值位置
        this.camera.position.lerpVectors(this.startPosition, this.targetPosition, easedT);

        // 插值观察点
        if (this.controls) {
            this.controls.target.lerpVectors(this.startLookAt, this.targetLookAt, easedT);
            this.controls.update();
        }

        return this.isAnimating;
    }

    // 重置到默认视角
    resetView(duration = 1.0) {
        this.animateToView('front', duration);
    }

    // 围绕目标旋转相机
    rotateAround(angleY, angleX = 0) {
        if (!this.controls) return;

        const target = this.controls.target.clone();
        const offset = this.camera.position.clone().sub(target);
        const radius = offset.length();

        // 水平旋转
        const horizontalRotation = angleY;
        const verticalRotation = angleX;

        // 创建旋转矩阵
        const rotationMatrix = new THREE.Matrix4();
        rotationMatrix.makeRotationY(horizontalRotation);
        rotationMatrix.multiply(new THREE.Matrix4().makeRotationX(verticalRotation));

        // 应用旋转
        offset.applyMatrix4(rotationMatrix);

        // 更新相机位置
        this.camera.position.copy(target).add(offset);
        this.camera.lookAt(target);
    }

    // 缩放相机
    zoom(delta, minDistance = 2, maxDistance = 10) {
        const direction = new THREE.Vector3();
        this.camera.getWorldDirection(direction);

        const newDistance = this.camera.position.distanceTo(this.controls ? this.controls.target : new THREE.Vector3()) + delta;
        const clampedDistance = Math.max(minDistance, Math.min(maxDistance, newDistance));

        const movement = direction.multiplyScalar(delta);

        this.camera.position.add(movement);
    }

    // 设置相机视野
    setFOV(fov) {
        this.camera.fov = THREE.MathUtils.clamp(fov, 10, 100);
        this.camera.updateProjectionMatrix();
    }

    // 获取相机当前状态
    getState() {
        return {
            position: this.camera.position.clone(),
            target: this.controls ? this.controls.target.clone() : new THREE.Vector3(),
            fov: this.camera.fov
        };
    }

    // 恢复相机状态
    setState(state, duration = 1.0) {
        this.animateTo(state.position, state.target, duration);
        this.setFOV(state.fov);
    }

    // 添加键盘控制
    setupKeyboardControls() {
        const handleKeyDown = (event) => {
            const speed = 0.1;

            switch (event.key) {
                case 'w':
                case 'ArrowUp':
                    this.zoom(-speed);
                    break;
                case 's':
                case 'ArrowDown':
                    this.zoom(speed);
                    break;
                case 'a':
                case 'ArrowLeft':
                    this.rotateAround(speed);
                    break;
                case 'd':
                case 'ArrowRight':
                    this.rotateAround(-speed);
                    break;
                case 'r':
                    this.resetView();
                    break;
            }
        };

        document.addEventListener('keydown', handleKeyDown);

        // 返回清理函数
        return () => {
            document.removeEventListener('keydown', handleKeyDown);
        };
    }
}

// 导出类
window.CameraManager = CameraManager;
