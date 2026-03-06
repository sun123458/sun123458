/**
 * 展品配置数据
 * Exhibit Configuration Data
 */

const exhibits = [
    {
        id: 'hiro',
        pattern: 'hiro',
        name: '古代陶罐',
        description: '这是一件距今约3000年的古代陶罐，出土于黄河流域。陶罐表面刻有精美的几何图案，展现了古代工匠的高超技艺。',
        modelPath: 'assets/models/exhibit1.gltf',
        thumbnail: 'assets/thumbnails/exhibit1.jpg',
        scale: 1.0,
        position: { x: 0, y: 0.5, z: 0 }
    },
    {
        id: 'kanji',
        pattern: 'kanji',
        name: '青铜器皿',
        description: '商周时期的青铜礼器，用于祭祀和宴饮。器身装饰有饕餮纹和云雷纹，体现了古代青铜文明的辉煌成就。',
        modelPath: 'assets/models/exhibit2.gltf',
        thumbnail: 'assets/thumbnails/exhibit2.jpg',
        scale: 0.8,
        position: { x: 0, y: 0.3, z: 0 }
    },
    {
        id: 'letterA',
        pattern: 'letterA',
        name: '古代玉器',
        description: '新石器时代的玉璧，象征着天圆地方的宇宙观念。玉质温润，工艺精湛，是古代权力和地位的象征。',
        modelPath: 'assets/models/exhibit3.gltf',
        thumbnail: 'assets/thumbnails/exhibit3.jpg',
        scale: 1.2,
        position: { x: 0, y: 0.4, z: 0 }
    }
];

// 导出展品数据
if (typeof module !== 'undefined' && module.exports) {
    module.exports = exhibits;
}
