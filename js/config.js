/**
 * AR展厅应用配置文件
 */

// 应用配置
const AppConfig = {
    // 应用信息
    appName: 'AR增强现实展厅',
    version: '1.0.0',

    // AR配置
    ar: {
        // AR标记类型: 'pattern' 或 'barcode'
        type: 'pattern',
        // 标记尺寸（米）
        markerSize: 1.5,
        // 标记预设文件路径
        markerPath: 'assets/data/hiro.patt',
        // 摄像头参数
        cameraParam: 'assets/data/camera_para.dat',
    },

    // Three.js场景配置
    scene: {
        // 背景色
        backgroundColor: 0x87CEEB,
        // 雾效
        fogEnabled: false,
        fogColor: 0x87CEEB,
        fogDensity: 0.02,
        // 环境光强度
        ambientLightIntensity: 0.6,
        // 方向光强度
        directionalLightIntensity: 0.8,
    },

    // 渲染配置
    renderer: {
        // 抗锯齿
        antialias: true,
        // 像素比
        pixelRatio: window.devicePixelRatio || 1,
        // 阴影启用
        shadowsEnabled: true,
    },

    // 交互配置
    interaction: {
        // 旋转灵敏度
        rotateSpeed: 0.005,
        // 缩放灵敏度
        zoomSpeed: 0.1,
        // 平移灵敏度
        panSpeed: 0.5,
        // 自动旋转速度
        autoRotateSpeed: 0.001,
        // 点击检测精度
        raycasterPrecision: 0.1,
    },

    // 展品配置
    exhibits: [
        {
            id: 'exhibit-1',
            name: '现代艺术雕塑',
            description: '这是一件代表现代艺术风格的雕塑作品，展现了抽象与具象的完美结合。',
            position: { x: 0, y: 0.5, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            scale: { x: 1, y: 1, z: 1 },
            color: 0xff6b6b,
            type: 'sculpture',
        },
        {
            id: 'exhibit-2',
            name: '古代花瓶',
            description: '古代瓷器精品，工艺精湛，纹饰精美，展现了古代工匠的高超技艺。',
            position: { x: -1.5, y: 0.3, z: 0 },
            rotation: { x: 0, y: Math.PI / 4, z: 0 },
            scale: { x: 0.6, y: 0.6, z: 0.6 },
            color: 0x4ecdc4,
            type: 'vase',
        },
        {
            id: 'exhibit-3',
            name: '未来科技模型',
            description: '探索未来科技发展的概念模型，展示人类对太空探索的无限憧憬。',
            position: { x: 1.5, y: 0.4, z: 0 },
            rotation: { x: 0, y: -Math.PI / 4, z: 0 },
            scale: { x: 0.8, y: 0.8, z: 0.8 },
            color: 0x95e1d3,
            type: 'technology',
        },
    ],

    // UI配置
    ui: {
        // 加载超时时间（毫秒）
        loadingTimeout: 15000,
        // 自动关闭信息面板延迟（毫秒）
        infoPanelDelay: 5000,
        // 是否显示调试信息
        debugMode: false,
        // 语言
        language: 'zh-CN',
    },

    // 性能配置
    performance: {
        // 目标FPS
        targetFPS: 60,
        // 启用性能监控
        monitorEnabled: true,
        // 低质量模式
        lowQualityMode: false,
    },
};

// 导出配置（兼容不同模块系统）
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AppConfig;
}
