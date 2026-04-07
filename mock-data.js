/**
 * 模拟路线数据生成
 * 使用高德地图风格的 GPS 坐标模拟步行/骑行/驾车路线
 */

// 北京核心区域坐标范围
const BEIJING_CENTER = [39.9142, 116.3914];

// 已知地点坐标库
const POI_COORDS = {
  '天安门':  [39.9087, 116.3975],
  '颐和园':  [39.9998, 116.2755],
  '鸟巢':    [39.9929, 116.3966],
  '国贸':    [39.9087, 116.4605],
  '西单':    [39.9087, 116.3733],
  '中关村':  [39.9818, 116.3114],
  '望京':    [39.9889, 116.4705],
  '三里屯':  [39.9339, 116.4541],
  '王府井':  [39.9137, 116.4115],
  '后海':    [39.9397, 116.3877],
  '北京站':  [39.9025, 116.4273],
  '北京西站':[39.8947, 116.3221],
  '五道口':  [39.9928, 116.3377],
  '奥林匹克公园': [39.9946, 116.3914],
  '南锣鼓巷': [39.9367, 116.4029],
  '故宫':    [39.9163, 116.3972],
  '圆明园':  [40.0084, 116.2985],
  '清华大学':[39.9993, 116.3266],
  '北京大学':[39.9869, 116.3059],
  '朝阳公园':[39.9377, 116.4729],
  '798艺术区':[39.9844, 116.4955],
  '前门':    [39.8993, 116.3978],
  '地坛公园':[39.9529, 116.4194],
  '雍和宫':  [39.9474, 116.4178],
  '什刹海':  [39.9397, 116.3877],
};

/**
 * 根据地名获取坐标（支持模糊匹配）
 */
function resolveCoordinate(name) {
  for (const [key, coord] of Object.entries(POI_COORDS)) {
    if (name.includes(key) || key.includes(name)) {
      return coord;
    }
  }
  // 未找到地名则生成随机偏移坐标
  return [
    BEIJING_CENTER[0] + (Math.random() - 0.5) * 0.08,
    BEIJING_CENTER[1] + (Math.random() - 0.5) * 0.1,
  ];
}

/**
 * 在两点之间生成带自然偏移的路径点
 */
function generatePathPoints(start, end, mode, numPoints) {
  const points = [];
  const latDiff = end[0] - start[0];
  const lngDiff = end[1] - start[1];
  const dist = Math.sqrt(latDiff * latDiff + lngDiff * lngDiff);

  // 根据出行方式决定偏移幅度
  const deviationScale = {
    walking: dist * 0.12,
    cycling: dist * 0.08,
    driving: dist * 0.06,
  }[mode];

  for (let i = 0; i <= numPoints; i++) {
    const t = i / numPoints;
    const baseLat = start[0] + latDiff * t;
    const baseLng = start[1] + lngDiff * t;

    // 首尾点不加偏移
    if (i === 0 || i === numPoints) {
      points.push([baseLat, baseLng]);
      continue;
    }

    // 使用正弦叠加产生自然的道路弯曲
    const noise1 = Math.sin(t * Math.PI * 3.7) * deviationScale;
    const noise2 = Math.cos(t * Math.PI * 5.3) * deviationScale * 0.4;

    // 偏移方向垂直于起终点连线
    const angle = Math.atan2(lngDiff, latDiff) + Math.PI / 2;
    const offsetLat = (noise1 + noise2) * Math.cos(angle);
    const offsetLng = (noise1 + noise2) * Math.sin(angle);

    points.push([baseLat + offsetLat, baseLng + offsetLng]);
  }

  return points;
}

/**
 * 根据两坐标估算真实距离（简化 Haversine）
 */
function estimateDistance(start, end) {
  const R = 6371;
  const dLat = (end[0] - start[0]) * Math.PI / 180;
  const dLng = (end[1] - start[1]) * Math.PI / 180;
  const a = Math.sin(dLat / 2) ** 2 +
    Math.cos(start[0] * Math.PI / 180) * Math.cos(end[0] * Math.PI / 180) *
    Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

/**
 * 生成路线的详细步骤指引
 */
function generateSteps(start, end, mode, pathPoints) {
  const totalDist = estimateDistance(start, end);
  const stepCount = mode === 'walking' ? 5 : mode === 'cycling' ? 4 : 6;

  const walkingInstructions = [
    '向正北方向出发，沿人行道前行',
    '在路口右转，进入大街继续步行',
    '经过公交站后左转，沿小路前行',
    '穿过人行横道，直行约200米',
    '到达目的地，在道路右侧',
  ];

  const cyclingInstructions = [
    '向北出发，沿非机动车道骑行',
    '在第二个路口右转，进入主干道',
    '继续沿非机动车道直行',
    '到达目的地，在道路左侧',
  ];

  const drivingInstructions = [
    '从起点向北出发，沿主路行驶',
    '行驶300米后右转，进入环路辅路',
    '沿环路行驶1.2公里，在出口驶出',
    '右转进入大街，继续直行',
    '经过两个红绿灯后左转',
    '到达目的地，在道路右侧',
  ];

  const instructionSets = {
    walking: walkingInstructions,
    cycling: cyclingInstructions,
    driving: drivingInstructions,
  };

  const instructions = instructionSets[mode];
  const steps = [];
  const stepDist = totalDist / stepCount;

  for (let i = 0; i < stepCount; i++) {
    const pathStart = Math.round((i / stepCount) * (pathPoints.length - 1));
    const pathEnd = Math.round(((i + 1) / stepCount) * (pathPoints.length - 1));

    steps.push({
      instruction: instructions[i % instructions.length],
      distance: +(stepDist * (0.8 + Math.random() * 0.4)).toFixed(2),
      duration: Math.round(stepDist / getSpeed(mode) * 60 * (0.9 + Math.random() * 0.2)),
      pathSegment: pathPoints.slice(pathStart, pathEnd + 1),
    });
  }

  return steps;
}

function getSpeed(mode) {
  return { walking: 5, cycling: 15, driving: 35 }[mode]; // km/h
}

/**
 * 生成一条路线的完整数据
 */
function generateRoute(start, end, mode) {
  const numPoints = { walking: 40, cycling: 30, driving: 50 }[mode];
  const pathPoints = generatePathPoints(start, end, mode, numPoints);
  const directDist = estimateDistance(start, end);

  // 路径系数（实际距离 > 直线距离）
  const factor = { walking: 1.3, cycling: 1.2, driving: 1.4 }[mode];
  const distance = +(directDist * factor).toFixed(1);
  const speed = getSpeed(mode);
  const duration = Math.round(distance / speed * 60); // 分钟

  // 红绿灯数量（步行/骑行少，驾车多）
  const trafficLights = {
    walking: Math.floor(distance * 1.5 + Math.random() * 3),
    cycling: Math.floor(distance * 2 + Math.random() * 4),
    driving: Math.floor(distance * 3 + Math.random() * 6),
  }[mode];

  const steps = generateSteps(start, end, mode, pathPoints);

  return {
    mode,
    distance,
    duration,
    trafficLights,
    path: pathPoints,
    steps,
  };
}

/**
 * 对外接口：生成全部 3 种路线
 */
function generateAllRoutes(originName, destName) {
  const start = resolveCoordinate(originName);
  const end = resolveCoordinate(destName);

  const modes = ['walking', 'cycling', 'driving'];
  const routes = modes.map(mode => generateRoute(start, end, mode));

  // 标记最快 / 最短路线
  const fastest = routes.reduce((a, b) => a.duration < b.duration ? a : b);
  const shortest = routes.reduce((a, b) => a.distance < b.distance ? a : b);
  fastest.isFastest = true;
  shortest.isShortest = true;

  return {
    origin: { name: originName, coord: start },
    destination: { name: destName, coord: end },
    routes,
  };
}
