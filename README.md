# AR增强现实展厅应用

基于Web技术的AR增强现实展厅应用，让用户通过手机或平板设备的摄像头扫描特定图像标记，在真实空间中展示3D展品模型。

## 功能特性

- ✅ 基于图像标记的AR识别（使用Hiro标记）
- ✅ 3D模型展示（支持GLTF格式）
- ✅ 多展品切换功能
- ✅ 交互式UI界面
- ✅ 响应式设计（支持移动端）
- ✅ 加载进度显示
- ✅ 标记识别状态提示
- ✅ 触摸手势支持（左右滑动切换展品）

## 技术栈

- **Three.js r128**: 3D渲染引擎
- **AR.js 3.3.2**: AR增强现实框架
- **HTML5**: 页面结构
- **原生JavaScript**: 无需构建工具

## 项目结构

```
ar-gallery/
├── index.html              # 主入口文件
├── README.md              # 项目说明文档
├── css/
│   └── style.css          # 样式文件
├── js/
│   ├── app.js            # 主应用逻辑（AR场景初始化、渲染）
│   ├── gallery.js        # 展厅管理器（展品状态管理）
│   └── models.js         # 3D模型配置数据
├── data/
│   └── camera_para.dat   # AR相机参数文件
└── assets/
    └── models/            # 存放3D模型文件（GLTF格式）
        ├── exhibit1.gltf   # 古代陶罐模型
        ├── exhibit2.gltf   # 青铜器皿模型
        └── exhibit3.gltf   # 古代玉器模型
```

## 快速开始

### 1. 安装本地服务器

由于AR应用需要访问摄像头和加载外部资源，必须通过HTTP服务器运行。选择以下任一方式：

**方式A: 使用Python**
```bash
# Python 3
python3 -m http.server 8000

# 或 Python 2
python -m SimpleHTTPServer 8000
```

**方式B: 使用Node.js (http-server)**
```bash
# 安装
npm install -g http-server

# 运行
http-server -p 8000
```

**方式C: 使用VS Code Live Server扩展**
- 安装Live Server扩展
- 右键点击index.html
- 选择"Open with Live Server"

### 2. 在移动设备上访问

1. 确保移动设备和电脑连接到同一Wi-Fi网络
2. 查看电脑的本地IP地址（例如：192.168.1.100）
3. 在移动设备浏览器中访问：`http://192.168.1.100:8000`
4. 授予摄像头权限
5. 将摄像头对准Hiro标记图案

### 3. Hiro标记

点击以下链接查看和打印Hiro标记：
- [Hiro标记图案](https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/data/hiro.png)
- [Hiro Pattern文件](https://raw.githubusercontent.com/AR-js-org/AR.js/master/data/data/pattern-hiro.patt)

**建议**：
- 打印在A4纸上，标记大小至少10cm x 10cm
- 确保打印区域边缘清晰
- 在光线充足的环境中使用
- 保持摄像头距离标记30-50cm

## 展品配置

展品配置文件位于 `js/models.js`：

```javascript
const exhibits = [
    {
        id: 'hiro',                    // 唯一标识
        pattern: 'hiro',              // AR标记类型
        name: '古代陶罐',             // 展品名称
        description: '...',            // 展品描述
        modelPath: 'assets/models/exhibit1.gltf',  // 模型路径
        thumbnail: 'assets/thumbnails/exhibit1.jpg', // 缩略图
        scale: 1.0,                    // 缩放系数
        position: { x: 0, y: 0.5, z: 0 } // 模型位置
    },
    // 更多展品...
];
```

## 自定义3D模型

### 模型格式要求

- **格式**: GLTF或GLB
- **单位**: 建议使用米作为单位
- **尺寸**: 模型最大尺寸建议不超过2个单位
- **材质**: 支持PBR材质
- **优化**:
  - 面数控制在5000以内（保证流畅运行）
  - 使用压缩纹理
  - 合并相同材质的网格

### 模型转换工具

常用的模型格式转换工具：
- [Blender](https://www.blender.org/) - 导出为GLTF
- [glTF-Validator](https://github.com/KhronosGroup/glTF-Validator) - 验证模型
- [gltf-pipeline](https://github.com/CesiumGS/gltf-pipeline) - 优化压缩

### 添加新展品

1. 将GLTF模型文件放入 `assets/models/` 目录
2. 在 `js/models.js` 中添加展品配置：

```javascript
{
    id: 'new-exhibit',
    name: '新展品名称',
    description: '展品描述文本',
    modelPath: 'assets/models/new-model.gltf',
    scale: 1.0,
    position: { x: 0, y: 0.5, z: 0 }
}
```

## 浏览器兼容性

### 移动端支持

- ✅ Chrome (Android) 推荐
- ✅ Safari (iOS) 推荐
- ⚠️ 其他浏览器可能需要用户特殊配置

### 功能要求

- WebGL 2.0 支持
- 摄像头访问权限
- HTTPS或本地网络环境

## 故障排查

### 问题1: 无法识别标记

**解决方案**:
- 确保光线充足
- 调整摄像头距离（30-50cm）
- 确保标记平整，无遮挡
- 使用高清打印的标记
- 清理摄像头镜头

### 问题2: 摄像头无法启动

**解决方案**:
- 确保使用HTTPS或本地IP访问
- 检查浏览器权限设置
- 如果是iOS，确保使用Safari
- 如果是Android，使用Chrome浏览器

### 问题3: 模型加载失败

**解决方案**:
- 检查模型文件路径是否正确
- 使用GLTF验证工具检查模型文件
- 查看浏览器控制台的错误信息
- 确保通过HTTP服务器访问（不是file://协议）

### 问题4: 性能卡顿

**解决方案**:
- 降低模型面数
- 减少场景中的光源数量
- 使用GLB格式（压缩的二进制GLTF）
- 关闭不必要的后台应用

## 扩展功能建议

### 1. 添加语音讲解
```javascript
// 在app.js的_loadCurrentModel方法中添加
const speak = new SpeechSynthesisUtterance(exhibit.description);
speechSynthesis.speak(speak);
```

### 2. 添加手势交互
- 双指缩放模型
- 单指旋转模型
- 长按显示详细信息

### 3. 支持多种标记
- 使用AR.js Pattern Maker创建自定义标记
- 为每个展品分配不同的标记图案

### 4. 添加导航引导
- 在展厅中添加虚拟箭头
- 指导用户到下一个展品

## 性能优化

### 模型优化
```
使用 gltf-pipeline 压缩模型:
npx gltf-pipeline -i model.gltf -o model.glb -d
```

### 渲染优化
- 已启用：`antialias: true`
- 已实现：加载进度显示
- 已实现：标记丢失时停止渲染模型

## 开发与调试

### 查看日志
在移动设备上：
- Chrome: `chrome://inspect` → 需要USB调试
- Safari: Mac→Safari→开发→[设备名称]

### 本地测试
1. 在浏览器控制台查看错误信息
2. 检查Network标签确认资源加载
3. 使用WebGL inspector调试渲染问题

## 许可证

MIT License - 欢迎自由使用和修改

## 参考资源

- [AR.js官方文档](https://ar-js-org.github.io/AR.js-Docs/)
- [Three.js文档](https://threejs.org/docs/)
- [GLTF格式规范](https://www.khronos.org/gltf/)
- [Hiro标记下载](https://github.com/AR-js-org/AR.js/tree/master/data/data)

## 贡献

欢迎提交问题和改进建议！

---

**Happy AR Creating!** 🎨📱✨
