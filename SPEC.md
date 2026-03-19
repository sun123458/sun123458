# 健身追踪仪表盘 PWA - 规格说明

## 1. 项目概述

- **项目名称**: FitTrack Pro
- **项目类型**: 渐进式网络应用 (PWA)
- **核心功能**: 记录多种锻炼类型、可视化进展、目标设定、分享成果、计步集成、离线支持
- **目标用户**: 健身爱好者，需要追踪和可视化锻炼数据的用户

## 2. 技术栈

- **前端框架**: 纯 HTML/CSS/JavaScript (无框架依赖)
- **图表库**: Chart.js 4.x
- **数据存储**: IndexedDB (使用 idb-keyval 风格的简单封装)
- **PWA**: Service Worker + Web App Manifest
- **图片生成**: html2canvas 用于分享卡片生成
- **图标**: Lucide Icons (SVG)

## 3. 视觉与设计规范

### 3.1 颜色主题 (深色主题)
```
--bg-primary: #0f0f0f (深黑背景)
--bg-secondary: #1a1a1a (卡片背景)
--bg-tertiary: #252525 (输入框背景)
--accent-primary: #00ff88 (活力绿 - 主要强调)
--accent-secondary: #00ccff (科技蓝 - 次要强调)
--accent-tertiary: #ff6b35 (活力橙 - 警告/热量)
--text-primary: #ffffff
--text-secondary: #888888
--border-color: #333333
```

### 3.2 字体
- **标题**: "Outfit", sans-serif (现代几何感)
- **正文**: "Inter", sans-serif (高可读性)
- **数字**: "JetBrains Mono", monospace (等宽数字)

### 3.3 布局
- 移动优先的响应式设计
- 底部导航栏 (4个主要标签)
- 卡片式信息展示
- 流畅的微交互动画

### 3.4 组件样式
- 圆角: 12px (卡片), 8px (按钮), 50% (头像)
- 阴影: 0 4px 20px rgba(0, 255, 136, 0.1)
- 玻璃态效果: backdrop-filter: blur(10px)
- 渐变边框: 1px solid 配合渐变背景

## 4. 功能模块

### 4.1 仪表盘首页
- 今日统计概览卡片 (步数、卡路里、锻炼时长、活跃天数)
- 本周锻炼趋势折线图
- 最近锻炼记录列表 (3条)
- 快速添加锻炼按钮 (FAB)

### 4.2 锻炼记录页
- 锻炼类型选择器 (跑步/举重/骑行/游泳/瑜伽/自定义)
- 锻炼详情表单:
  - 跑步: 时长(分钟)、距离(公里)、平均心率(可选)
  - 举重: 时长、重量(kg)、组数、次数
  - 骑行: 时长、距离(公里)、平均速度
- 历史记录列表 (可按类型筛选)
- 删除/编辑功能

### 4.3 进展图表页
- 时间范围选择器 (周/月/季度/年)
- 体重变化折线图 (带目标线)
- 锻炼量条形图 (按类型分组)
- 卡路里消耗趋势
- 统计数据汇总

### 4.4 目标设定页
- 设定目标类型:
  - 体重目标 (起始体重、目标体重、截止日期)
  - 锻炼频次目标 (每周次数)
  - 距离目标 (月度/年度)
  - 力量目标 (深蹲/卧推/硬拉重量)
- 可视化里程碑进度环
- 目标达成庆祝动画
- 目标历史记录

### 4.5 分享功能
- 选择要分享的锻炼记录
- 生成美观的分享卡片:
  - 锻炼类型图标
  - 关键数据展示
  - 日期和时间戳
  - 应用品牌标识
- 支持复制为图片或 HTML
- 社交媒体优化尺寸

### 4.6 计步集成 (Pedometer API)
- 请求权限并显示步数
- 实时步数更新 (如果支持)
- 步数历史记录
- 优雅降级 (不支持时隐藏功能)

### 4.7 PWA 功能
- 可安装到主屏幕
- 离线数据访问
- 后台数据同步
- 推送通知 (未来扩展)

## 5. 数据模型

### 5.1 Workout (锻炼记录)
```javascript
{
  id: string (UUID),
  type: 'running' | 'weightlifting' | 'cycling' | 'swimming' | 'yoga' | 'custom',
  date: ISO timestamp,
  duration: number (minutes),
  distance: number (km, optional),
  weight: number (kg, optional),
  sets: number (optional),
  reps: number (optional),
  calories: number (estimated),
  notes: string (optional),
  steps: number (optional, from pedometer)
}
```

### 5.2 Goal (目标)
```javascript
{
  id: string (UUID),
  type: 'weight' | 'frequency' | 'distance' | 'strength',
  startValue: number,
  targetValue: number,
  currentValue: number,
  deadline: ISO timestamp,
  createdAt: ISO timestamp,
  completed: boolean
}
```

### 5.3 Weight Entry (体重记录)
```javascript
{
  id: string (UUID),
  date: ISO timestamp,
  weight: number (kg)
}
```

## 6. 离线策略

- Service Worker 缓存所有静态资源
- IndexedDB 存储所有用户数据
- 网络优先策略用于 API 调用 (如有)
- 离线指示器 UI

## 7. 文件结构

```
/Users/a123/Documents/minimax/健身追踪/
├── index.html
├── manifest.json
├── sw.js (Service Worker)
├── css/
│   └── styles.css
├── js/
│   ├── app.js (主应用逻辑)
│   ├── db.js (IndexedDB 封装)
│   ├── charts.js (图表渲染)
│   ├── share.js (分享功能)
│   └── pedometer.js (计步器)
├── icons/
│   ├── icon-192.png
│   └── icon-512.png
└── SPEC.md
```

## 8. 验收标准

1. ✅ 应用可被安装到 iOS/Android 主屏幕
2. ✅ 离线状态下可查看历史数据
3. ✅ 可添加、编辑、删除锻炼记录
4. ✅ 图表正确显示历史数据趋势
5. ✅ 目标设定和里程碑可视化工作正常
6. ✅ 分享卡片可正常生成
7. ✅ 计步器在支持该 API 的设备上工作
8. ✅ 所有动画流畅，无明显性能问题
9. ✅ 响应式设计适配手机和平板
