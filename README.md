# 多路线规划对比组件

输入起点 / 终点，自动生成 **步行 / 骑行 / 驾车** 三种路线并在地图上对比。

## 功能
- 一次查询并发请求三种出行方式的路线
- 不同颜色区分：步行（绿 `#22c55e`）/ 骑行（橙 `#f59e0b`）/ 驾车（蓝 `#3b82f6`）
- 每条路线展示 **耗时 / 距离 / 红绿灯数量**
- 点击地图上的路线或侧栏步骤条目，高亮对应路段并滚动到详情
- 切换路线时带平滑粗细 / 透明度过渡动画，步骤条目入场错峰动画

## 使用

1. 在 `MultiRoutePlanner.html` 中把 `YOUR_AMAP_KEY` 和 `YOUR_SECURITY_CODE` 替换为你在 [高德开放平台](https://console.amap.com/) 申请的 Web 端 JS API Key 与安全密钥。
2. 由于浏览器安全策略，需通过 HTTP 服务打开（不能直接 `file://`）：
   ```bash
   cd "30_封装多路线规划对比组件："
   python3 -m http.server 8080
   # 浏览器访问 http://localhost:8080/MultiRoutePlanner.html
   ```
3. 输入起点 / 终点（默认 `北京南站 → 天安门`），点击「开始规划」。

## API

```js
const planner = new MultiRoutePlanner({
  mapId: 'map',
  onRouteChange: (mode, route) => { /* 切换回调 */ },
});

planner.plan();                 // 读取输入框并发起规划
planner.switchMode('driving');  // 手动切换到驾车路线
planner.selectStep(3);          // 高亮第 4 个路段
```

## 说明
- `_countTrafficLights` 对高德返回的 `tolls_count` 作了兜底估算（按每 800m 一个红绿灯），实际业务中可替换为接入交通信号数据的真实值。
- 如需集成到 Vue / React 工程，把 `MultiRoutePlanner` 类的 DOM 操作替换为对应框架的模板与状态即可，核心逻辑（路线检索、Polyline 绘制、步骤高亮）保持不变。
