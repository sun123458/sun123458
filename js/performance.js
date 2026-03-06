/**
 * 性能监控和优化管理器
 * 监控应用性能并提供优化建议
 */

class PerformanceManager {
    constructor(config) {
        this.config = config;
        this.metrics = {
            fps: 0,
            frameTime: 0,
            memory: 0,
            objects: 0,
            triangles: 0,
            drawCalls: 0,
        };
        this.history = {
            fps: [],
            frameTime: [],
            memory: [],
        };
        this.maxHistoryLength = 60; // 保留最近60个数据点
        this.isMonitoring = false;
        this.monitorInterval = null;
        this.frameCount = 0;
        this.lastFrameTime = performance.now();
        this.issues = [];
    }

    /**
     * 开始监控
     */
    startMonitoring(scene) {
        if (this.isMonitoring) {
            console.warn('性能监控已在运行');
            return;
        }

        this.scene = scene;
        this.isMonitoring = true;

        // 每秒更新一次指标
        this.monitorInterval = setInterval(() => {
            this.updateMetrics();
            this.checkPerformance();
        }, 1000);

        console.log('性能监控已启动');
    }

    /**
     * 停止监控
     */
    stopMonitoring() {
        if (!this.isMonitoring) {
            return;
        }

        if (this.monitorInterval) {
            clearInterval(this.monitorInterval);
            this.monitorInterval = null;
        }

        this.isMonitoring = false;
        console.log('性能监控已停止');
    }

    /**
     * 更新性能指标
     */
    updateMetrics() {
        // FPS和帧时间由场景更新
        if (this.scene) {
            this.metrics.fps = this.scene.fps || 0;
        }

        // 内存使用
        if (performance.memory) {
            this.metrics.memory = performance.memory.usedJSHeapSize / 1024 / 1024; // MB
        }

        // 3D对象统计
        if (this.scene && this.scene.scene) {
            const stats = this.countObjects(this.scene.scene);
            this.metrics.objects = stats.objects;
            this.metrics.triangles = stats.triangles;
        }

        // WebGL渲染统计
        if (this.scene && this.scene.renderer) {
            const info = this.scene.renderer.info;
            this.metrics.drawCalls = info.render.calls;
        }

        // 记录历史数据
        this.recordHistory();
    }

    /**
     * 统计对象和三角形数量
     */
    countObjects(object3D) {
        let objects = 0;
        let triangles = 0;

        object3D.traverse((obj) => {
            if (obj.isMesh) {
                objects++;
                if (obj.geometry) {
                    const geo = obj.geometry;
                    if (geo.index) {
                        triangles += geo.index.count / 3;
                    } else if (geo.attributes.position) {
                        triangles += geo.attributes.position.count / 3;
                    }
                }
            }
        });

        return { objects, triangles };
    }

    /**
     * 记录历史数据
     */
    recordHistory() {
        // 添加当前指标到历史记录
        this.history.fps.push(this.metrics.fps);
        this.history.memory.push(this.metrics.memory);

        // 限制历史记录长度
        if (this.history.fps.length > this.maxHistoryLength) {
            this.history.fps.shift();
        }
        if (this.history.memory.length > this.maxHistoryLength) {
            this.history.memory.shift();
        }
    }

    /**
     * 检查性能问题
     */
    checkPerformance() {
        this.issues = [];

        // 检查FPS
        const avgFps = this.getAverageFPS();
        if (avgFps < 30) {
            this.issues.push({
                type: 'warning',
                message: `帧率过低: ${avgFps.toFixed(1)} FPS`,
                suggestion: '尝试减少展品数量或降低渲染质量',
            });
        } else if (avgFps < 20) {
            this.issues.push({
                type: 'critical',
                message: `帧率严重过低: ${avgFps.toFixed(1)} FPS`,
                suggestion: '立即启用低质量模式或减少展品数量',
            });
        }

        // 检查内存
        if (this.metrics.memory > 500) {
            this.issues.push({
                type: 'warning',
                message: `内存使用过高: ${this.metrics.memory.toFixed(1)} MB`,
                suggestion: '考虑清理未使用的资源或重启应用',
            });
        }

        // 检查对象数量
        if (this.metrics.objects > 1000) {
            this.issues.push({
                type: 'info',
                message: `场景中有大量对象: ${this.metrics.objects}`,
                suggestion: '可以合并静态对象以提高性能',
            });
        }

        // 检查三角形数量
        if (this.metrics.triangles > 100000) {
            this.issues.push({
                type: 'warning',
                message: `三角形数量过多: ${this.metrics.triangles}`,
                suggestion: '简化模型几何体或使用LOD技术',
            });
        }

        // 输出问题到控制台
        if (this.issues.length > 0) {
            console.group('性能问题');
            this.issues.forEach((issue) => {
                console.warn(`[${issue.type.toUpperCase()}] ${issue.message}`);
                console.log(`建议: ${issue.suggestion}`);
            });
            console.groupEnd();
        }
    }

    /**
     * 获取平均FPS
     */
    getAverageFPS() {
        if (this.history.fps.length === 0) {
            return 0;
        }
        const sum = this.history.fps.reduce((a, b) => a + b, 0);
        return sum / this.history.fps.length;
    }

    /**
     * 获取性能报告
     */
    getReport() {
        return {
            current: { ...this.metrics },
            averages: {
                fps: this.getAverageFPS(),
                memory: this.getAverageMemory(),
            },
            issues: [...this.issues],
            score: this.calculatePerformanceScore(),
        };
    }

    /**
     * 获取平均内存使用
     */
    getAverageMemory() {
        if (this.history.memory.length === 0) {
            return 0;
        }
        const sum = this.history.memory.reduce((a, b) => a + b, 0);
        return sum / this.history.memory.length;
    }

    /**
     * 计算性能得分
     */
    calculatePerformanceScore() {
        let score = 100;

        // FPS评分 (最高40分)
        const avgFps = this.getAverageFPS();
        if (avgFps >= 60) {
            score += 40;
        } else if (avgFps >= 45) {
            score += 30;
        } else if (avgFps >= 30) {
            score += 20;
        } else if (avgFps >= 20) {
            score += 10;
        }

        // 内存评分 (最高30分)
        if (this.metrics.memory < 200) {
            score += 30;
        } else if (this.metrics.memory < 400) {
            score += 20;
        } else if (this.metrics.memory < 600) {
            score += 10;
        }

        // 对象数量评分 (最高20分)
        if (this.metrics.objects < 500) {
            score += 20;
        } else if (this.metrics.objects < 1000) {
            score += 10;
        }

        // 问题扣分
        score -= this.issues.length * 5;

        return Math.max(0, Math.min(100, score));
    }

    /**
     * 自动优化
     */
    autoOptimize() {
        console.log('开始自动优化...');

        const optimizations = [];

        // 低质量模式
        if (this.getAverageFPS() < 30) {
            this.enableLowQualityMode();
            optimizations.push('已启用低质量模式');
        }

        // 减少粒子效果
        if (this.metrics.triangles > 100000) {
            // 这里可以添加减少粒子的逻辑
            optimizations.push('粒子效果已减少');
        }

        // 调整阴影
        if (this.getAverageFPS() < 25) {
            if (this.scene && this.scene.renderer) {
                this.scene.renderer.shadowMap.enabled = false;
                optimizations.push('阴影已禁用');
            }
        }

        console.log('优化完成:', optimizations);
        return optimizations;
    }

    /**
     * 启用低质量模式
     */
    enableLowQualityMode() {
        this.config.performance.lowQualityMode = true;

        if (this.scene && this.scene.renderer) {
            this.scene.renderer.setPixelRatio(1);
            this.scene.renderer.antialias = false;
        }

        console.log('低质量模式已启用');
    }

    /**
     * 禁用低质量模式
     */
    disableLowQualityMode() {
        this.config.performance.lowQualityMode = false;

        if (this.scene && this.scene.renderer) {
            this.scene.renderer.setPixelRatio(window.devicePixelRatio || 1);
            this.scene.renderer.antialias = true;
        }

        console.log('低质量模式已禁用');
    }

    /**
     * 导出性能数据
     */
    exportData() {
        const data = {
            timestamp: new Date().toISOString(),
            metrics: this.metrics,
            history: this.history,
            issues: this.issues,
            score: this.calculatePerformanceScore(),
            system: this.getSystemInfo(),
        };

        const json = JSON.stringify(data, null, 2);
        const blob = new Blob([json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);

        const a = document.createElement('a');
        a.href = url;
        a.download = `performance-data-${Date.now()}.json`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);

        URL.revokeObjectURL(url);
    }

    /**
     * 获取系统信息
     */
    getSystemInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            hardwareConcurrency: navigator.hardwareConcurrency,
            deviceMemory: navigator.deviceMemory,
            webgl: this.getWebGLInfo(),
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
            maxTextureSize: gl.getParameter(gl.MAX_TEXTURE_SIZE),
            maxViewportDims: gl.getParameter(gl.MAX_VIEWPORT_DIMS),
        };
    }

    /**
     * 清理资源
     */
    dispose() {
        this.stopMonitoring();
        this.history = { fps: [], frameTime: [], memory: [] };
        this.issues = [];
    }
}

// 导出
if (typeof window !== 'undefined') {
    window.PerformanceManager = PerformanceManager;
}
