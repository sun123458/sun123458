/**
 * 视觉效果管理器
 * 处理粒子效果、光影效果和其他视觉增强
 */

class EffectsManager {
    constructor(scene, config) {
        this.scene = scene;
        this.config = config;
        this.particleSystems = [];
        this.lights = [];
        this.isInitialized = false;
    }

    /**
     * 初始化效果系统
     */
    init() {
        this.setupEnvironmentalEffects();
        this.setupParticleEffects();
        this.isInitialized = true;
    }

    /**
     * 设置环境效果
     */
    setupEnvironmentalEffects() {
        // 创建环境光晕效果
        const ambientGlow = new THREE.AmbientLight(0x404040, 0.3);
        this.scene.scene.add(ambientGlow);
        this.lights.push(ambientGlow);

        // 添加半影效果（柔和的边缘光）
        const rimLight = new THREE.DirectionalLight(0x4ecdc4, 0.4);
        rimLight.position.set(-5, 5, -5);
        this.scene.scene.add(rimLight);
        this.lights.push(rimLight);
    }

    /**
     * 设置粒子效果
     */
    setupParticleEffects() {
        // 创建环境粒子（浮尘效果）
        const ambientParticles = this.createAmbientParticles();
        if (ambientParticles) {
            this.scene.markerRoot.add(ambientParticles);
            this.particleSystems.push(ambientParticles);
        }
    }

    /**
     * 创建环境粒子
     */
    createAmbientParticles() {
        const particleCount = 100;
        const geometry = new THREE.BufferGeometry();
        const positions = new Float32Array(particleCount * 3);
        const velocities = [];

        for (let i = 0; i < particleCount; i++) {
            // 随机分布在场景中
            positions[i * 3] = (Math.random() - 0.5) * 10; // x
            positions[i * 3 + 1] = (Math.random() - 0.5) * 10; // y
            positions[i * 3 + 2] = (Math.random() - 0.5) * 10; // z

            // 随机速度
            velocities.push({
                x: (Math.random() - 0.5) * 0.002,
                y: (Math.random() - 0.5) * 0.002,
                z: (Math.random() - 0.5) * 0.002,
            });
        }

        geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        geometry.userData.velocities = velocities;

        const material = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.02,
            transparent: true,
            opacity: 0.6,
            blending: THREE.AdditiveBlending,
        });

        const particles = new THREE.Points(geometry, material);
        particles.userData.velocities = velocities;
        particles.userData.isAmbientParticles = true;

        return particles;
    }

    /**
     * 创建选中光环效果
     */
    createSelectionGlow(object) {
        // 创建一个发光的环
        const geometry = new THREE.RingGeometry(0.6, 0.7, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x4ecdc4,
            transparent: true,
            opacity: 0.5,
            side: THREE.DoubleSide,
        });

        const ring = new THREE.Mesh(geometry, material);
        ring.rotation.x = -Math.PI / 2;
        ring.position.y = -0.1;
        ring.userData.isSelectionGlow = true;

        return ring;
    }

    /**
     * 添加选中效果
     */
    addSelectionEffect(object) {
        const glow = this.createSelectionGlow(object);
        object.add(glow);
        this.animateGlow(glow);
    }

    /**
     * 移除选中效果
     */
    removeSelectionEffect(object) {
        object.children.forEach((child) => {
            if (child.userData.isSelectionGlow) {
                object.remove(child);
            }
        });
    }

    /**
     * 光环动画
     */
    animateGlow(glow) {
        const animate = () => {
            if (!glow.parent) return;

            const time = Date.now() * 0.001;
            glow.material.opacity = 0.3 + Math.sin(time * 2) * 0.2;
            glow.scale.setScalar(1 + Math.sin(time * 3) * 0.1);
            requestAnimationFrame(animate);
        };
        animate();
    }

    /**
     * 创建点击波纹效果
     */
    createClickRipple(position) {
        const geometry = new THREE.RingGeometry(0.1, 0.15, 32);
        const material = new THREE.MeshBasicMaterial({
            color: 0x4ecdc4,
            transparent: true,
            opacity: 0.8,
            side: THREE.DoubleSide,
        });

        const ripple = new THREE.Mesh(geometry, material);
        ripple.position.copy(position);
        ripple.rotation.x = -Math.PI / 2;
        ripple.userData.isClickRipple = true;

        this.scene.markerRoot.add(ripple);

        // 动画
        let scale = 1;
        let opacity = 0.8;

        const animate = () => {
            scale += 0.1;
            opacity -= 0.05;

            ripple.scale.setScalar(scale);
            ripple.material.opacity = opacity;

            if (opacity > 0) {
                requestAnimationFrame(animate);
            } else {
                this.scene.markerRoot.remove(ripple);
            }
        };

        animate();
    }

    /**
     * 创建标记边框效果
     */
    createMarkerBorder() {
        const size = this.config.ar.markerSize;
        const geometry = new THREE.BoxGeometry(size, size * 0.01, size);
        const edges = new THREE.EdgesGeometry(geometry);
        const material = new THREE.LineBasicMaterial({
            color: 0x4ecdc4,
            transparent: true,
            opacity: 0.3,
        });

        const border = new THREE.LineSegments(edges, material);
        border.position.y = -size * 0.005;
        border.userData.isMarkerBorder = true;

        return border;
    }

    /**
     * 添加闪烁效果
     */
    addBlinkEffect(object, duration = 1000) {
        const originalEmissive = object.material.emissive
            ? object.material.emissive.getHex()
            : 0x000000;

        const blinkTimes = 3;
        const blinkInterval = duration / (blinkTimes * 2);

        let count = 0;
        const blink = setInterval(() => {
            if (object.material.emissive) {
                if (count % 2 === 0) {
                    object.material.emissive.setHex(0x333333);
                } else {
                    object.material.emissive.setHex(originalEmissive);
                }
            }

            count++;
            if (count >= blinkTimes * 2) {
                clearInterval(blink);
                if (object.material.emissive) {
                    object.material.emissive.setHex(originalEmissive);
                }
            }
        }, blinkInterval);
    }

    /**
     * 创建浮动提示
     */
    createFloatingHint(text, position, duration = 3000) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;

        // 背景
        context.fillStyle = 'rgba(0, 0, 0, 0.7)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        // 文字
        context.font = 'Bold 20px Arial';
        context.fillStyle = 'white';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({
            map: texture,
            transparent: true,
            opacity: 0.9,
        });

        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.position.y += 0.5;
        sprite.scale.set(1.5, 0.4, 1);

        this.scene.markerRoot.add(sprite);

        // 动画和消失
        const startTime = Date.now();
        const animate = () => {
            const elapsed = Date.now() - startTime;
            const progress = elapsed / duration;

            if (progress < 1) {
                // 缓慢上升
                sprite.position.y += 0.001;
                // 淡出
                sprite.material.opacity = 0.9 * (1 - progress);
                requestAnimationFrame(animate);
            } else {
                this.scene.markerRoot.remove(sprite);
            }
        };

        animate();
    }

    /**
     * 更新粒子系统
     */
    updateParticles(delta) {
        this.particleSystems.forEach((system) => {
            if (system.userData.isAmbientParticles && system.geometry) {
                const positions = system.geometry.attributes.position.array;
                const velocities = system.userData.velocities;

                for (let i = 0; i < velocities.length; i++) {
                    // 更新位置
                    positions[i * 3] += velocities[i].x;
                    positions[i * 3 + 1] += velocities[i].y;
                    positions[i * 3 + 2] += velocities[i].z;

                    // 边界检查，超出范围则重置
                    if (
                        Math.abs(positions[i * 3]) > 5 ||
                        Math.abs(positions[i * 3 + 1]) > 5 ||
                        Math.abs(positions[i * 3 + 2]) > 5
                    ) {
                        positions[i * 3] = (Math.random() - 0.5) * 10;
                        positions[i * 3 + 1] = (Math.random() - 0.5) * 10;
                        positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
                    }
                }

                system.geometry.attributes.position.needsUpdate = true;
            }
        });
    }

    /**
     * 设置光照强度
     */
    setLightIntensity(intensity) {
        this.lights.forEach((light) => {
            if (light.intensity !== undefined) {
                light.intensity = intensity;
            }
        });
    }

    /**
     * 切换环境光
     */
    toggleAmbientLight() {
        this.lights.forEach((light) => {
            if (light.type === 'AmbientLight') {
                light.intensity = light.intensity > 0 ? 0 : 0.3;
            }
        });
    }

    /**
     * 清理所有效果
     */
    dispose() {
        // 移除粒子系统
        this.particleSystems.forEach((system) => {
            if (system.parent) {
                system.parent.remove(system);
            }
            if (system.geometry) {
                system.geometry.dispose();
            }
            if (system.material) {
                system.material.dispose();
            }
        });
        this.particleSystems = [];

        // 移除额外灯光
        this.lights.forEach((light) => {
            if (light.parent) {
                light.parent.remove(light);
            }
        });
        this.lights = [];
    }
}

// 导出
if (typeof window !== 'undefined') {
    window.EffectsManager = EffectsManager;
}
