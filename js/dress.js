/**
 * 服装模型定义
 * 定义5款不同服装的参数和配置
 */

// 服装配置
const DRESS_CONFIGS = {
    dress1: {
        name: '连衣裙',
        type: 'dress',
        color: '#e74c3c',
        // 网格参数
        clothWidth: 1.2,
        clothHeight: 2.0,
        segmentsX: 18,
        segmentsY: 25,
        // 固定点位置（肩部）
        pinnedPattern: 'shoulders',
        // 物理参数
        particleMass: 0.8,
        damping: 0.97,
        constraintIterations: 5,
        stiffness: 0.6,
        windStrength: 30,
        // A字裙型参数
        skirtShape: 'a-line',
        topWidth: 0.5,
        bottomWidth: 1.2,
        // 位置偏移
        positionOffset: new THREE.Vector3(0, 0.8, 0)
    },

    dress2: {
        name: '衬衫',
        type: 'shirt',
        color: '#3498db',
        clothWidth: 1.0,
        clothHeight: 1.2,
        segmentsX: 15,
        segmentsY: 18,
        pinnedPattern: 'shoulders',
        particleMass: 1.0,
        damping: 0.98,
        constraintIterations: 6,
        stiffness: 0.7,
        windStrength: 25,
        skirtShape: 'straight',
        topWidth: 0.5,
        bottomWidth: 0.5,
        positionOffset: new THREE.Vector3(0, 0.3, 0)
    },

    dress3: {
        name: 'T恤',
        type: 'tshirt',
        color: '#2ecc71',
        clothWidth: 0.9,
        clothHeight: 1.0,
        segmentsX: 14,
        segmentsY: 16,
        pinnedPattern: 'shoulders',
        particleMass: 1.2,
        damping: 0.97,
        constraintIterations: 4,
        stiffness: 0.8,
        windStrength: 20,
        skirtShape: 'straight',
        topWidth: 0.5,
        bottomWidth: 0.45,
        positionOffset: new THREE.Vector3(0, 0.2, 0)
    },

    dress4: {
        name: '半身裙',
        type: 'skirt',
        color: '#9b59b6',
        clothWidth: 1.0,
        clothHeight: 0.9,
        segmentsX: 16,
        segmentsY: 20,
        pinnedPattern: 'waist',
        particleMass: 0.7,
        damping: 0.96,
        constraintIterations: 5,
        stiffness: 0.5,
        windStrength: 35,
        skirtShape: 'a-line',
        topWidth: 0.35,
        bottomWidth: 1.0,
        positionOffset: new THREE.Vector3(0, -0.2, 0)
    },

    dress5: {
        name: '西装外套',
        type: 'blazer',
        color: '#34495e',
        clothWidth: 1.1,
        clothHeight: 1.3,
        segmentsX: 16,
        segmentsY: 20,
        pinnedPattern: 'shoulders',
        particleMass: 1.5,
        damping: 0.99,
        constraintIterations: 7,
        stiffness: 0.9,
        windStrength: 15,
        skirtShape: 'straight',
        topWidth: 0.6,
        bottomWidth: 0.55,
        positionOffset: new THREE.Vector3(0, 0.4, 0)
    }
};

class DressManager {
    constructor() {
        this.currentDress = null;
        this.currentColor = DRESS_CONFIGS.dress1.color;
        this.clothMeshes = new Map(); // 存储每个服装的布料网格
    }

    // 根据配置创建布料
    createCloth(config) {
        const cloth = new Cloth(
            config.clothWidth,
            config.clothHeight,
            config.segmentsX,
            config.segmentsY,
            {
                particleMass: config.particleMass,
                damping: config.damping,
                constraintIterations: config.constraintIterations,
                stiffness: config.stiffness,
                windStrength: config.windStrength
            }
        );

        // 根据裙子形状调整粒子位置
        if (config.skirtShape === 'a-line') {
            this.applySkirtShape(cloth, config);
        }

        // 根据固定模式设置固定点
        this.applyPinnedPattern(cloth, config);

        return cloth;
    }

    // 应用裙子形状（A字裙）
    applySkirtShape(cloth, config) {
        const dx = config.clothWidth / cloth.segmentsX;
        const dy = config.clothHeight / cloth.segmentsY;

        for (let y = 0; y <= cloth.segmentsY; y++) {
            const progress = y / cloth.segmentsY;
            const currentWidth = config.topWidth + (config.bottomWidth - config.topWidth) * progress;

            for (let x = 0; x <= cloth.segmentsX; x++) {
                const index = y * (cloth.segmentsX + 1) + x;
                const particle = cloth.particles[index];

                // 调整X位置以形成A字形状
                const normalizedX = (x / cloth.segmentsX - 0.5) * 2; // -1 到 1
                particle.position.x = normalizedX * currentWidth / 2;
                particle.oldPosition.x = particle.position.x;
                particle.originalPosition.x = particle.position.x;
            }
        }
    }

    // 应用固定点模式
    applyPinnedPattern(cloth, config) {
        const pinnedIndices = [];

        if (config.pinnedPattern === 'shoulders') {
            // 固定顶部中间部分（肩部）
            const shoulderWidth = Math.floor(cloth.segmentsX / 4);
            const centerX = Math.floor(cloth.segmentsX / 2);

            for (let x = centerX - shoulderWidth; x <= centerX + shoulderWidth; x++) {
                pinnedIndices.push(x); // 第一排
                pinnedIndices.push((cloth.segmentsX + 1) + x); // 第二排
            }
        } else if (config.pinnedPattern === 'waist') {
            // 固定顶部（腰部）
            for (let x = 0; x <= cloth.segmentsX; x++) {
                pinnedIndices.push(x);
            }
        }

        cloth.setPinnedPoints(pinnedIndices);
    }

    // 创建布料网格
    createClothMesh(cloth, color) {
        const vertexData = cloth.getVertexData();

        const geometry = new THREE.BufferGeometry();
        geometry.setAttribute('position', new THREE.Float32BufferAttribute(vertexData.vertices, 3));
        geometry.setAttribute('uv', new THREE.Float32BufferAttribute(vertexData.uvs, 2));
        geometry.setIndex(vertexData.indices);
        geometry.computeVertexNormals();

        const material = new THREE.MeshStandardMaterial({
            color: color,
            side: THREE.DoubleSide,
            roughness: 0.8,
            metalness: 0.1,
            flatShading: false
        });

        const mesh = new THREE.Mesh(geometry, material);
        mesh.castShadow = true;
        mesh.receiveShadow = true;

        return { mesh, vertexData };
    }

    // 更新布料网格
    updateClothMesh(mesh, cloth) {
        const vertexData = cloth.getVertexData();
        const positions = mesh.geometry.attributes.position.array;

        for (let i = 0; i < vertexData.vertices.length; i++) {
            positions[i] = vertexData.vertices[i];
        }

        mesh.geometry.attributes.position.needsUpdate = true;
        mesh.geometry.computeVertexNormals();
    }

    // 更改服装颜色
    updateColor(color) {
        this.currentColor = color;

        for (const [dressId, { mesh }] of this.clothMeshes) {
            mesh.material.color.set(color);
        }

        if (this.currentDress) {
            const dressMesh = this.clothMeshes.get(this.currentDress);
            if (dressMesh) {
                dressMesh.mesh.material.color.set(color);
            }
        }
    }

    // 获取服装配置
    getDressConfig(dressId) {
        return DRESS_CONFIGS[dressId];
    }

    // 获取所有服装配置
    getAllDressConfigs() {
        return DRESS_CONFIGS;
    }

    // 获取当前服装ID
    getCurrentDress() {
        return this.currentDress;
    }

    // 设置当前服装ID
    setCurrentDress(dressId) {
        this.currentDress = dressId;
        if (DRESS_CONFIGS[dressId]) {
            this.currentColor = DRESS_CONFIGS[dressId].color;
        }
    }

    // 获取当前颜色
    getCurrentColor() {
        return this.currentColor;
    }
}

// 导出类
window.DRESS_CONFIGS = DRESS_CONFIGS;
window.DressManager = DressManager;
