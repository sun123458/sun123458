/**
 * 3D模型管理器
 * 负责创建和管理展厅中的3D展品模型
 */

class ModelManager {
    constructor(scene, config) {
        this.scene = scene;
        this.config = config;
        this.models = new Map();
        this.materials = new Map();
    }

    /**
     * 创建所有展品
     */
    createExhibits() {
        this.config.exhibits.forEach(exhibitConfig => {
            const exhibit = this.createExhibit(exhibitConfig);
            this.scene.addExhibit(exhibit);
        });
    }

    /**
     * 创建单个展品
     */
    createExhibit(config) {
        let geometry;
        let mesh;

        switch (config.type) {
            case 'sculpture':
                mesh = this.createSculpture(config);
                break;
            case 'vase':
                mesh = this.createVase(config);
                break;
            case 'technology':
                mesh = this.createTechnology(config);
                break;
            default:
                mesh = this.createDefault(config);
        }

        // 设置变换
        mesh.position.set(config.position.x, config.position.y, config.position.z);
        mesh.rotation.set(config.rotation.x, config.rotation.y, config.rotation.z);
        mesh.scale.set(config.scale.x, config.scale.y, config.scale.z);

        // 设置用户数据
        mesh.userData = {
            id: config.id,
            name: config.name,
            description: config.description,
            type: config.type,
            autoRotate: false,
            originalColor: config.color,
        };

        // 添加阴影
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        // 添加到模型映射
        this.models.set(config.id, mesh);

        return mesh;
    }

    /**
     * 创建雕塑模型
     */
    createSculpture(config) {
        const group = new THREE.Group();

        // 主体 - 扭曲的环面结
        const torusKnot = new THREE.TorusKnotGeometry(0.3, 0.1, 100, 16);
        const material = new THREE.MeshPhongMaterial({
            color: config.color,
            shininess: 100,
            specular: 0x444444,
        });
        const mesh = new THREE.Mesh(torusKnot, material);
        group.add(mesh);

        // 底座
        const baseGeometry = new THREE.CylinderGeometry(0.4, 0.5, 0.15, 32);
        const baseMaterial = new THREE.MeshPhongMaterial({
            color: 0x333333,
            shininess: 30,
        });
        const base = new THREE.Mesh(baseGeometry, baseMaterial);
        base.position.y = -0.5;
        base.castShadow = true;
        base.receiveShadow = true;
        group.add(base);

        return group;
    }

    /**
     * 创建花瓶模型
     */
    createVase(config) {
        const group = new THREE.Group();

        // 创建花瓶轮廓
        const points = [];
        for (let i = 0; i <= 20; i++) {
            const t = i / 20;
            const y = t * 0.6;
            let radius;

            if (t < 0.2) {
                // 底部
                radius = 0.15 + t * 0.5;
            } else if (t < 0.7) {
                // 中部
                radius = 0.25 + Math.sin(t * Math.PI) * 0.1;
            } else {
                // 颈部和口部
                radius = 0.2 - (t - 0.7) * 0.3;
            }

            points.push(new THREE.Vector2(radius, y));
        }

        // 使用旋转几何体创建花瓶
        const geometry = new THREE.LatheGeometry(points, 32);
        const material = new THREE.MeshPhongMaterial({
            color: config.color,
            shininess: 80,
            side: THREE.DoubleSide,
        });

        const vase = new THREE.Mesh(geometry, material);
        vase.position.y = 0.15;
        group.add(vase);

        // 添加装饰纹理效果（简单的线框）
        const wireframe = new THREE.WireframeGeometry(geometry);
        const line = new THREE.LineSegments(wireframe);
        line.material.opacity = 0.1;
        line.material.transparent = true;
        line.position.y = 0.15;
        group.add(line);

        return group;
    }

    /**
     * 创建科技模型
     */
    createTechnology(config) {
        const group = new THREE.Group();

        // 主体 - 八面体
        const octahedron = new THREE.OctahedronGeometry(0.3, 0);
        const material = new THREE.MeshPhongMaterial({
            color: config.color,
            shininess: 100,
            specular: 0x666666,
            transparent: true,
            opacity: 0.8,
        });
        const mesh = new THREE.Mesh(octahedron, material);
        group.add(mesh);

        // 内部核心
        const coreGeometry = new THREE.IcosahedronGeometry(0.15, 0);
        const coreMaterial = new THREE.MeshPhongMaterial({
            color: 0xffffff,
            emissive: 0x444444,
            shininess: 100,
        });
        const core = new THREE.Mesh(coreGeometry, coreMaterial);
        group.add(core);

        // 轨道环
        const ringGeometry = new THREE.TorusGeometry(0.5, 0.02, 16, 100);
        const ringMaterial = new THREE.MeshBasicMaterial({
            color: 0x4ecdc4,
            transparent: true,
            opacity: 0.6,
        });
        const ring = new THREE.Mesh(ringGeometry, ringMaterial);
        ring.rotation.x = Math.PI / 2;
        group.add(ring);

        // 第二个轨道环
        const ring2 = ring.clone();
        ring2.rotation.y = Math.PI / 2;
        group.add(ring2);

        // 粒子效果（小点）
        const particlesGeometry = new THREE.BufferGeometry();
        const particlesCount = 50;
        const positions = new Float32Array(particlesCount * 3);

        for (let i = 0; i < particlesCount * 3; i++) {
            positions[i] = (Math.random() - 0.5) * 1.5;
        }

        particlesGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));

        const particlesMaterial = new THREE.PointsMaterial({
            color: 0xffffff,
            size: 0.02,
            transparent: true,
            opacity: 0.6,
        });

        const particles = new THREE.Points(particlesGeometry, particlesMaterial);
        group.add(particles);

        return group;
    }

    /**
     * 创建默认模型
     */
    createDefault(config) {
        const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
        const material = new THREE.MeshPhongMaterial({
            color: config.color,
            shininess: 60,
        });
        const mesh = new THREE.Mesh(geometry, material);
        return mesh;
    }

    /**
     * 获取模型
     */
    getModel(id) {
        return this.models.get(id);
    }

    /**
     * 获取所有模型
     */
    getAllModels() {
        return Array.from(this.models.values());
    }

    /**
     * 移除模型
     */
    removeModel(id) {
        const model = this.models.get(id);
        if (model) {
            this.scene.removeExhibit(model);
            this.models.delete(id);
        }
    }

    /**
     * 清除所有模型
     */
    clearAll() {
        this.models.forEach((model) => {
            this.scene.removeExhibit(model);
        });
        this.models.clear();
    }

    /**
     * 更新模型动画
     */
    updateAnimations(delta) {
        this.models.forEach((model) => {
            // 可以添加特定的动画逻辑
            if (model.userData.type === 'technology') {
                // 让科技模型的轨道环旋转
                model.children.forEach((child, index) => {
                    if (child.geometry && child.geometry.type === 'TorusGeometry') {
                        child.rotation.z += delta * 0.5;
                    }
                });
            }
        });
    }

    /**
     * 创建平台基座
     */
    createPlatform(position, size = 0.8) {
        const geometry = new THREE.CylinderGeometry(size, size * 1.2, 0.1, 32);
        const material = new THREE.MeshPhongMaterial({
            color: 0x2c3e50,
            shininess: 30,
        });
        const platform = new THREE.Mesh(geometry, material);
        platform.position.set(position.x, 0.05, position.z);
        platform.receiveShadow = true;
        return platform;
    }

    /**
     * 创建标签文字
     */
    createLabel(text, position) {
        const canvas = document.createElement('canvas');
        const context = canvas.getContext('2d');
        canvas.width = 256;
        canvas.height = 64;

        context.fillStyle = 'rgba(255, 255, 255, 0.9)';
        context.fillRect(0, 0, canvas.width, canvas.height);

        context.font = 'Bold 24px Arial';
        context.fillStyle = 'black';
        context.textAlign = 'center';
        context.textBaseline = 'middle';
        context.fillText(text, canvas.width / 2, canvas.height / 2);

        const texture = new THREE.CanvasTexture(canvas);
        const material = new THREE.SpriteMaterial({ map: texture });
        const sprite = new THREE.Sprite(material);
        sprite.position.copy(position);
        sprite.scale.set(1, 0.25, 1);

        return sprite;
    }

    /**
     * 加载外部模型（将来扩展用）
     */
    async loadExternalModel(url, options = {}) {
        // 这里可以扩展为加载GLTF、OBJ等格式的模型
        console.log('外部模型加载功能待实现:', url);
        return null;
    }
}
