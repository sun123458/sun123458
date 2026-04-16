# 交互式旅行地图 - Leaflet + OpenStreetMap

一个基于 Leaflet 和 OpenStreetMap 的交互式旅行地图应用，支持添加景点标记、显示信息窗口、路线距离计算和 PWA 离线缓存功能。

## 功能特性

### 🗺️ 核心功能
- **交互式地图**：基于 OpenStreetMap 的高质量地图显示
- **景点标记**：点击地图任意位置添加景点
- **信息窗口**：显示景点名称、描述和坐标信息
- **自定义图标**：支持多种景点类型图标（景点、住宿、餐饮、购物等）

### 📏 路线规划
- **路线计算**：使用 OSRM 路由服务计算实际驾车路线
- **距离显示**：显示总距离和预计时间
- **路线可视化**：在地图上绘制路线路径
- **直线距离**：路由服务不可用时使用 Haversine 公式计算

### 📱 PWA 支持
- **离线使用**：Service Worker 缓存静态资源和地图瓦片
- **可安装**：支持安装到主屏幕，像原生应用一样使用
- **后台同步**：支持离线数据同步

### 💾 数据管理
- **本地存储**：景点数据自动保存到 localStorage
- **导出/导入**：支持 JSON 格式的数据导出和导入
- **数据持久化**：页面刷新后数据不丢失

### 🔍 其他功能
- **地点搜索**：使用 Nominatim API 搜索全球地点
- **用户定位**：获取并显示用户当前位置
- **响应式设计**：支持桌面和移动设备

## 快速开始

### 方法一：直接打开
1. 确保所有文件在同一目录下
2. 使用 HTTP 服务器打开（PWA 需要 HTTPS 或 localhost）

### 方法二：使用 Python HTTP 服务器
```bash
python3 -m http.server 8000
```
然后在浏览器访问 `http://localhost:8000`

### 方法三：使用 Node.js http-server
```bash
npx http-server -p 8000
```

## 使用指南

### 添加景点
1. **点击地图**：点击地图上任意位置选择景点位置
2. **填写信息**：输入景点名称、描述，选择图标类型
3. **自动保存**：输入名称后景点会自动添加到列表

### 搜索地点
1. 在搜索框输入地点名称
2. 点击搜索按钮或按回车
3. 点击搜索结果可直接定位

### 计算路线
1. 至少添加 2 个景点
2. 点击"计算路线距离"按钮
3. 系统会自动计算并显示路线

### 导出/导入数据
- **导出**：点击"导出数据"按钮，保存 JSON 文件
- **导入**：点击"导入数据"按钮，选择之前导出的 JSON 文件

## 文件结构

```
.
├── index.html      # 主页面
├── styles.css      # 样式文件
├── app.js          # 应用主逻辑
├── sw.js           # Service Worker (PWA 离线缓存)
├── manifest.json   # PWA 清单文件
└── README.md       # 说明文档
```

## 技术栈

- **Leaflet**：开源交互式地图库
- **OpenStreetMap**：免费地图数据源
- **Nominatim API**：地点搜索服务
- **OSRM**：开源路由引擎
- **Service Worker API**：离线缓存
- **localStorage**：本地数据存储

## 浏览器支持

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Opera 76+

## 注意事项

1. **PWA 要求**：PWA 功能需要通过 HTTPS 或 localhost 访问
2. **网络依赖**：搜索和路由功能需要网络连接
3. **地图瓦片缓存**：访问过的地图区域会自动缓存，支持离线查看
4. **数据备份**：建议定期导出数据进行备份

## API 使用

本项目使用以下免费 API：

- **OpenStreetMap 瓦片**：`https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png`
- **Nominatim 搜索**：`https://nominatim.openstreetmap.org/search`
- **OSRM 路由**：`https://router.project-osrm.org/route`

请遵守各 API 的使用条款和速率限制。

## 许可证

MIT License

## 更新日志

### v1.0.0 (2024-04-16)
- 初始版本发布
- 支持景点标记和路线计算
- 实现 PWA 离线缓存功能
- 支持数据导出/导入
