# AR增强现实展厅应用

基于Web技术栈的A-Frame + AR.js增强现实展厅应用。

## 功能特性

### 核心功能
- **AR标记识别**: 使用Hiro预设标记进行快速识别
- **3D展品展示**: 5个不同的3D几何体展品
- **触摸交互**: 支持单指拖动旋转、双指缩放
- **响应式设计**: 自适应不同设备屏幕
- **展品信息**: 点击展品查看详细信息

### 展品列表
1. **几何立方体** - 展示基本立方体结构
2. **完美球体** - 展示球体的光影效果
3. **圆锥体** - 展示圆锥形状
4. **神秘圆环** - 展示圆环体的弯曲表面
5. **十二面宝石** - 展示复杂的多面体

## 技术栈

- **A-Frame** 1.4.0 - WebVR框架
- **AR.js** - AR标记识别
- **HTML5** - 页面结构
- **CSS3** - 样式和动画
- **JavaScript ES6+** - 交互逻辑

## 安装和运行

### 方式一：本地服务器（推荐）

1. 克隆或下载项目

2. 安装一个本地服务器（如果有Python）：
```bash
# Python 3
python -m http.server 8000

# Python 2
python -m SimpleHTTPServer 8000
```

3. 或者使用Node.js的http-server：
```bash
npm install -g http-server
http-server -p 8000
```

4. 在浏览器中访问：
```
http://localhost:8000
```

### 方式二：直接打开

直接双击 `index.html` 文件在浏览器中打开（某些功能可能受限）。

### 方式三：部署到服务器

将整个项目文件夹上传到任何Web服务器或GitHub Pages。

## 使用说明

### 准备Hiro标记

1. 下载Hiro标记图片（可在网上搜索"Hiro marker"）
2. 将Hiro标记打印出来或显示在另一个设备上
3. 在AR应用中，将摄像头对准Hiro标记

### 交互操作

1. **标记识别**: 将摄像头对准Hiro标记，等待3D展品出现
2. **旋转视角**: 单指在屏幕上拖动
3. **缩放视角**: 双指捏合/张开或在桌面使用滚轮
4. **查看信息**: 点击任意展品查看详细信息
5. **切换交互**: 点击"交互模式"按钮开关触摸功能
6. **重置视角**: 点击"重置视角"按钮恢复初始状态

### 桌面测试

- **鼠标拖动**: 旋转3D场景
- **滚轮**: 缩放场景
- **点击**: 与展品交互

## 文件结构

```
AR展厅应用/
├── index.html              # 主页面文件
├── README.md               # 说明文档
├── css/
│   └── style.css           # 样式文件
└── js/
    ├── ar-exhibition.js    # AR展厅主逻辑
    └── interaction.js      # 交互处理逻辑
```

## 浏览器兼容性

### 推荐浏览器
- **移动端**: Chrome, Safari (iOS 11+)
- **桌面端**: Chrome, Firefox, Safari

### 系统要求
- **iOS**: iOS 11.0+ (需要WebAR支持)
- **Android**: Android 7.0+ (Chrome)
- **桌面**: 支持WebGL的现代浏览器

### 注意事项
- 移动设备需要摄像头权限
- 首次使用需要允许摄像头访问
- 光线充足的环境标记识别效果更好

## 自定义开发

### 添加新展品

在 `index.html` 的 `<a-marker>` 标签内添加新的3D元素：

```html
<!-- 示例：添加圆柱体展品 -->
<a-cylinder position="3 1.2 0"
            radius="0.4"
            height="1"
            color="#ff6b6b"
            metalness="0.5"
            roughness="0.4"
            shadow>
    <a-entity text="value: 圆柱体; align: center; width: 2; color: #ffffff"
             position="0 0.7 0"
             scale="0.5 0.5 0.5">
    </a-entity>
</a-cylinder>
```

### 修改展品信息

在 `js/ar-exhibition.js` 的 `exhibitData` 对象中添加新展品的信息：

```javascript
'exhibit-6': {
    title: '新展品名称',
    description: '展品描述文本',
    details: {
        '属性1': '值1',
        '属性2': '值2'
    }
}
```

### 更换AR标记

在 `index.html` 中修改 `<a-marker>` 的 preset 属性：

```html
<!-- 使用其他预设标记 -->
<a-marker preset="kanji">

<!-- 或使用自定义标记 -->
<a-marker type="pattern" url="path/to/pattern-marker.patt">
```

## 性能优化建议

1. **减少多边形数量**: 使用简化的3D模型
2. **优化纹理**: 使用压缩的纹理格式
3. **控制光源数量**: 尽量减少动态光源
4. **测试性能**: 在目标设备上进行充分测试

## 故障排除

### 无法识别标记
- 确保打印的Hiro标记清晰可见
- 改善光线条件
- 调整摄像头到标记的距离（20-50cm最佳）

### 3D模型不显示
- 检查摄像头权限是否允许
- 确保浏览器支持WebGL和WebAR
- 查看浏览器控制台的错误信息

### 性能卡顿
- 减少展品数量
- 降低3D模型复杂度
- 在更强大的设备上测试

## 未来扩展方向

1. **自定义标记**: 使用训练后的自定义图片标记
2. **真实3D模型**: 导入GLTF/GLB格式的专业3D模型
3. **音频解说**: 为每个展品添加语音讲解
4. **多标记支持**: 使用多个标记展示更大的展厅
5. **后端集成**: 连接数据库实现动态内容管理
6. **社交分享**: 支持分享AR体验截图

## 开源协议

MIT License - 可自由使用和修改

## 技术支持

如有问题或建议，欢迎提Issue。

## 致谢

- A-Frame团队 - 提供优秀的WebVR框架
- AR.js团队 - 提供WebAR解决方案
- WebXR社区 - 推动Web AR/VR技术发展
