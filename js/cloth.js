/**
 * 布料物理引擎 - 基于Verlet积分算法
 * 实现弹簧质点系统模拟布料物理效果
 */

class ClothParticle {
    constructor(x, y, z, mass = 1.0, pinned = false) {
        this.position = new THREE.Vector3(x, y, z);
        this.oldPosition = new THREE.Vector3(x, y, z);
        this.acceleration = new THREE.Vector3(0, 0, 0);
        this.mass = mass;
        this.pinned = pinned;
        this.originalPosition = new THREE.Vector3(x, y, z);
    }

    applyForce(force) {
        if (!this.pinned) {
            this.acceleration.add(force.clone().divideScalar(this.mass));
        }
    }

    integrate(dt, damping = 0.98) {
        if (this.pinned) return;

        // Verlet积分: position_new = 2 * position_current - position_old + acceleration * dt^2
        const velocity = this.position.clone().sub(this.oldPosition).multiplyScalar(damping);
        this.oldPosition.copy(this.position);
        this.position.add(velocity);
        this.position.add(this.acceleration.clone().multiplyScalar(dt * dt));
        this.acceleration.set(0, 0, 0);
    }
}

class ClothConstraint {
    constructor(particle1, particle2, restDistance = null) {
        this.particle1 = particle1;
        this.particle2 = particle2;
        if (restDistance === null) {
            this.restDistance = particle1.position.distanceTo(particle2.position);
        } else {
            this.restDistance = restDistance;
        }
    }

    satisfy() {
        const diff = this.particle2.position.clone().sub(this.particle1.position);
        const currentDistance = diff.length();
        const correction = diff.multiplyScalar((currentDistance - this.restDistance) / currentDistance * 0.5);

        if (!this.particle1.pinned) {
            this.particle1.position.add(correction);
        }
        if (!this.particle2.pinned) {
            this.particle2.position.sub(correction);
        }
    }
}

class Cloth {
    constructor(width, height, segmentsX, segmentsY, parameters = {}) {
        this.width = width;
        this.height = height;
        this.segmentsX = segmentsX;
        this.segmentsY = segmentsY;

        // 布料参数
        this.particleMass = parameters.particleMass || 1.0;
        this.damping = parameters.damping || 0.98;
        this.constraintIterations = parameters.constraintIterations || 5;
        this.stiffness = parameters.stiffness || 0.5;

        // 粒子和约束数组
        this.particles = [];
        this.constraints = [];

        // 风力参数
        this.windEnabled = true;
        this.windStrength = parameters.windStrength || 30;
        this.windDirection = new THREE.Vector3(1, 0, 0);
        this.windTime = 0;

        // 碰撞体（人体）
        this.collisionBodies = [];

        this.init();
    }

    init() {
        // 创建粒子网格
        const dx = this.width / this.segmentsX;
        const dy = this.height / this.segmentsY;

        for (let y = 0; y <= this.segmentsY; y++) {
            for (let x = 0; x <= this.segmentsX; x++) {
                const posX = x * dx - this.width / 2;
                const posY = y * dy - this.height / 2;
                const posZ = 0;

                // 顶部两排粒子固定（模拟衣服肩部）
                const pinned = y <= 1;

                const particle = new ClothParticle(posX, posY, posZ, this.particleMass, pinned);
                this.particles.push(particle);
            }
        }

        // 创建约束（弹簧）
        for (let y = 0; y <= this.segmentsY; y++) {
            for (let x = 0; x <= this.segmentsX; x++) {
                const index = y * (this.segmentsX + 1) + x;

                // 水平约束
                if (x < this.segmentsX) {
                    this.constraints.push(new ClothConstraint(
                        this.particles[index],
                        this.particles[index + 1]
                    ));
                }

                // 垂直约束
                if (y < this.segmentsY) {
                    this.constraints.push(new ClothConstraint(
                        this.particles[index],
                        this.particles[index + (this.segmentsX + 1)]
                    ));
                }

                // 对角约束（增加结构稳定性）
                if (x < this.segmentsX && y < this.segmentsY) {
                    this.constraints.push(new ClothConstraint(
                        this.particles[index],
                        this.particles[index + (this.segmentsX + 2)],
                        Math.sqrt(dx * dx + dy * dy)
                    ));

                    this.constraints.push(new ClothConstraint(
                        this.particles[index + 1],
                        this.particles[index + (this.segmentsX + 1)],
                        Math.sqrt(dx * dx + dy * dy)
                    ));
                }
            }
        }
    }

    applyGravity(gravity = -9.8) {
        const gravityForce = new THREE.Vector3(0, gravity, 0);
        for (const particle of this.particles) {
            particle.applyForce(gravityForce.clone().multiplyScalar(particle.mass));
        }
    }

    applyWind(deltaTime) {
        if (!this.windEnabled || this.windStrength <= 0) return;

        this.windTime += deltaTime;

        // 创建变化的风力
        const windX = Math.sin(this.windTime * 2) * 0.5 + 0.5;
        const windZ = Math.cos(this.windTime * 3) * 0.3;
        const windY = Math.sin(this.windTime * 1.5) * 0.1;

        const windForce = new THREE.Vector3(
            windX * this.windDirection.x + windZ * 0.5,
            windY,
            windZ
        ).normalize().multiplyScalar(this.windStrength * 0.1);

        for (const particle of this.particles) {
            // 根据粒子位置添加随机扰动
            const turbulence = Math.sin(particle.position.x * 0.5 + this.windTime) *
                               Math.cos(particle.position.y * 0.3 + this.windTime * 1.2);

            particle.applyForce(windForce.clone().multiplyScalar(1 + turbulence * 0.3));
        }
    }

    handleCollisions() {
        for (const particle of this.particles) {
            if (particle.pinned) continue;

            for (const body of this.collisionBodies) {
                this.handleSphereCollision(particle, body);
            }
        }
    }

    handleSphereCollision(particle, sphere) {
        const diff = particle.position.clone().sub(sphere.position);
        const distance = diff.length();

        if (distance < sphere.radius) {
            // 将粒子推出碰撞体
            const normal = diff.normalize();
            const penetration = sphere.radius - distance;
            particle.position.add(normal.clone().multiplyScalar(penetration));

            // 添加摩擦力
            const friction = 0.95;
            const oldDiff = particle.oldPosition.clone().sub(sphere.position);
            const oldTangent = oldDiff.sub(normal.clone().multiplyScalar(oldDiff.dot(normal)));
            particle.oldPosition = particle.position.clone().sub(oldTangent.multiplyScalar(friction));
        }
    }

    update(deltaTime) {
        // 应用外力
        this.applyGravity();
        this.applyWind(deltaTime);

        // 积分粒子位置
        const dt = Math.min(deltaTime, 0.05); // 限制最大时间步长
        for (const particle of this.particles) {
            particle.integrate(dt, this.damping);
        }

        // 满足约束
        for (let i = 0; i < this.constraintIterations; i++) {
            for (const constraint of this.constraints) {
                constraint.satisfy();
            }
        }

        // 处理碰撞
        this.handleCollisions();
    }

    // 获取用于渲染的顶点数据
    getVertexData() {
        const vertices = [];
        const indices = [];
        const uvs = [];

        // 顶点位置
        for (let i = 0; i < this.particles.length; i++) {
            vertices.push(this.particles[i].position.x);
            vertices.push(this.particles[i].position.y);
            vertices.push(this.particles[i].position.z);

            // UV坐标
            const x = i % (this.segmentsX + 1);
            const y = Math.floor(i / (this.segmentsX + 1));
            uvs.push(x / this.segmentsX);
            uvs.push(1 - y / this.segmentsY);
        }

        // 面索引（三角形）
        for (let y = 0; y < this.segmentsY; y++) {
            for (let x = 0; x < this.segmentsX; x++) {
                const i = y * (this.segmentsX + 1) + x;
                const a = i;
                const b = i + 1;
                const c = i + this.segmentsX + 1;
                const d = i + this.segmentsX + 2;

                // 两个三角形组成一个四边形
                indices.push(a, c, b);
                indices.push(b, c, d);
            }
        }

        return { vertices, indices, uvs };
    }

    // 设置固定点
    setPinnedPoints(pinnedIndices) {
        for (let i = 0; i < this.particles.length; i++) {
            this.particles[i].pinned = pinnedIndices.includes(i);
        }
    }

    // 添加碰撞体
    addCollisionBody(position, radius) {
        this.collisionBodies.push({
            position: new THREE.Vector3(position.x, position.y, position.z),
            radius: radius
        });
    }

    // 清除碰撞体
    clearCollisionBodies() {
        this.collisionBodies = [];
    }

    // 设置风力
    setWindStrength(strength) {
        this.windStrength = strength;
    }

    setWindDirection(x, y, z) {
        this.windDirection.set(x, y, z);
    }

    // 重置布料
    reset() {
        this.windTime = 0;
        for (let i = 0; i < this.particles.length; i++) {
            const particle = this.particles[i];
            if (!particle.pinned) {
                particle.position.copy(particle.originalPosition);
                particle.oldPosition.copy(particle.originalPosition);
                particle.acceleration.set(0, 0, 0);
            }
        }
    }
}

// 导出类
window.ClothParticle = ClothParticle;
window.ClothConstraint = ClothConstraint;
window.Cloth = Cloth;
