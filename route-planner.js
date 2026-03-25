/**
 * 多路线规划对比组件
 * —————————————————————————
 * 依赖：高德地图 JS API v2.0
 * 支持：步行 / 骑行 / 驾车 三种路线对比
 */

;(function () {
  'use strict';

  /* ======= 常量配置 ======= */
  const ROUTE_CONFIG = {
    driving: {
      label: '驾车',
      icon: '🚗',
      color: '#4A90D9',
      weight: 6,
    },
    cycling: {
      label: '骑行',
      icon: '🚲',
      color: '#34C759',
      weight: 5,
    },
    walking: {
      label: '步行',
      icon: '🚶',
      color: '#FF9500',
      weight: 4,
    },
  };

  /* ======= 模拟数据（无 Key 时使用） ======= */
  const MOCK_DATA = {
    origin: { lng: 116.397428, lat: 39.90923 },
    destination: { lng: 116.434282, lat: 39.9087 },
    routes: {
      driving: {
        distance: 5200,
        duration: 1080,        // 秒
        trafficLights: 7,
        steps: [
          { instruction: '向东行驶，进入东长安街', distance: 800 },
          { instruction: '右转进入建国门内大街', distance: 1200 },
          { instruction: '直行通过建国门桥', distance: 600 },
          { instruction: '左转进入东二环', distance: 1600 },
          { instruction: '右转到达目的地', distance: 1000 },
        ],
        path: [
          [116.397428, 39.90923],
          [116.401, 39.9093],
          [116.408, 39.9095],
          [116.415, 39.9105],
          [116.422, 39.9102],
          [116.428, 39.9095],
          [116.434282, 39.9087],
        ],
      },
      cycling: {
        distance: 3800,
        duration: 720,
        trafficLights: 4,
        steps: [
          { instruction: '向东骑行，进入东长安街辅路', distance: 500 },
          { instruction: '直行进入北京站街', distance: 900 },
          { instruction: '左转进入建国门南大街', distance: 1100 },
          { instruction: '右转沿二环辅路骑行', distance: 800 },
          { instruction: '左转到达目的地', distance: 500 },
        ],
        path: [
          [116.397428, 39.90923],
          [116.402, 39.909],
          [116.41, 39.9085],
          [116.418, 39.9088],
          [116.426, 39.909],
          [116.434282, 39.9087],
        ],
      },
      walking: {
        distance: 3100,
        duration: 2280,
        trafficLights: 3,
        steps: [
          { instruction: '向东步行，沿东长安街', distance: 700 },
          { instruction: '右转进入北京站西街', distance: 800 },
          { instruction: '直行经过天桥', distance: 500 },
          { instruction: '左转进入二环辅路人行道', distance: 600 },
          { instruction: '右转到达目的地', distance: 500 },
        ],
        path: [
          [116.397428, 39.90923],
          [116.403, 39.9092],
          [116.41, 39.9088],
          [116.42, 39.9083],
          [116.428, 39.9085],
          [116.434282, 39.9087],
        ],
      },
    },
  };

  /* ======= DOM 引用 ======= */
  const $ = (s) => document.querySelector(s);
  const originInput    = $('#originInput');
  const destInput      = $('#destInput');
  const originSugg     = $('#originSuggestions');
  const destSugg       = $('#destSuggestions');
  const planBtn        = $('#planBtn');
  const swapBtn        = $('#swapBtn');
  const routePanel     = $('#routePanel');
  const routeCards     = $('#routeCards');
  const routeDetails   = $('#routeDetails');
  const stepsList      = $('#stepsList');
  const closeDetails   = $('#closeDetails');
  const loadingMask    = $('#loadingMask');
  const mapContainer   = $('#mapContainer');

  /* ======= 状态 ======= */
  let map = null;
  let originMarker = null;
  let destMarker   = null;
  let polylines    = {};   // { driving: AMap.Polyline, ... }
  let activeRoute  = 'driving';
  let routeData    = null; // 当前路线数据
  let useMock      = false;

  /* ======= 初始化地图 ======= */
  function initMap() {
    try {
      map = new AMap.Map('mapContainer', {
        zoom: 14,
        center: [116.397, 39.909],
        mapStyle: 'amap://styles/whitesmoke',
        animateEnable: true,
      });
    } catch (e) {
      console.warn('高德地图初始化失败，使用模拟模式', e);
      useMock = true;
      initMockMap();
    }
  }

  /* 模拟地图 Canvas */
  function initMockMap() {
    const canvas = document.createElement('canvas');
    canvas.width = mapContainer.clientWidth;
    canvas.height = mapContainer.clientHeight;
    canvas.style.cssText = 'width:100%;height:100%;background:#e8eaf0;';
    mapContainer.appendChild(canvas);

    map = {
      _canvas: canvas,
      _ctx: canvas.getContext('2d'),
      setFitView: function () { drawMockMap(); },
      setZoomAndCenter: function () {},
      remove: function () {},
      getAllOverlays: function () { return []; },
      add: function () {},
      clearMap: function () {
        this._markers = [];
        this._polylines = [];
      },
      _markers: [],
      _polylines: [],
    };

    // 扩展模拟 marker / polyline
    window._mockMapRef = map;
  }

  function drawMockMap() {
    if (!map._ctx) return;
    const ctx = map._ctx;
    const W = map._canvas.width;
    const H = map._canvas.height;
    ctx.clearRect(0, 0, W, H);

    // 背景
    ctx.fillStyle = '#e8eaf0';
    ctx.fillRect(0, 0, W, H);

    // 网格
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 0.5;
    for (let i = 0; i < W; i += 40) {
      ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, H); ctx.stroke();
    }
    for (let j = 0; j < H; j += 40) {
      ctx.beginPath(); ctx.moveTo(0, j); ctx.lineTo(W, j); ctx.stroke();
    }

    // 路线
    map._polylines.forEach(function (pl) {
      drawMockPath(ctx, pl._path, pl._color, pl._weight, W, H);
    });

    // 标记
    map._markers.forEach(function (m) {
      drawMockMarker(ctx, m._pos, m._color, m._label, W, H);
    });
  }

  function lngLatToPixel(lng, lat, W, H) {
    const minX = 116.390, maxX = 116.440;
    const minY = 39.905, maxY = 39.912;
    const x = ((lng - minX) / (maxX - minX)) * (W - 80) + 40;
    const y = (1 - (lat - minY) / (maxY - minY)) * (H - 80) + 40;
    return [x, y];
  }

  function drawMockPath(ctx, path, color, weight, W, H) {
    if (!path || path.length < 2) return;
    ctx.strokeStyle = color;
    ctx.lineWidth = weight;
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    ctx.globalAlpha = path._opacity !== undefined ? path._opacity : 0.8;
    ctx.beginPath();
    const [x0, y0] = lngLatToPixel(path[0][0], path[0][1], W, H);
    ctx.moveTo(x0, y0);
    for (let i = 1; i < path.length; i++) {
      const [x, y] = lngLatToPixel(path[i][0], path[i][1], W, H);
      ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.globalAlpha = 1;
  }

  function drawMockMarker(ctx, pos, color, label, W, H) {
    const [x, y] = lngLatToPixel(pos[0], pos[1], W, H);
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(x, y, 12, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 11px sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(label, x, y);
  }

  /* ======= 地图 Marker / Polyline 工厂 ======= */
  function createMarker(pos, cls) {
    if (useMock) {
      var m = {
        _pos: [pos.lng, pos.lat],
        _color: cls === 'origin' ? ROUTE_CONFIG.driving.color : '#FF3B30',
        _label: cls === 'origin' ? '起' : '终',
      };
      map._markers.push(m);
      return m;
    }

    var content = '<div class="custom-marker marker-' + cls + '"><span>' +
      (cls === 'origin' ? '起' : '终') + '</span></div>';
    return new AMap.Marker({
      position: [pos.lng, pos.lat],
      content: content,
      offset: new AMap.Pixel(-16, -36),
      map: map,
    });
  }

  function createPolyline(pathData, config, isActive) {
    if (useMock) {
      var rawPath = pathData.map(function (p) {
        return Array.isArray(p) ? p : [p.lng || p[0], p.lat || p[1]];
      });
      rawPath._opacity = isActive ? 0.9 : 0.25;
      var pl = {
        _path: rawPath,
        _color: config.color,
        _weight: config.weight,
        show: function () {},
        hide: function () {},
      };
      map._polylines.push(pl);
      return pl;
    }

    return new AMap.Polyline({
      path: pathData,
      strokeColor: config.color,
      strokeWeight: config.weight,
      strokeOpacity: isActive ? 0.9 : 0.2,
      lineJoin: 'round',
      lineCap: 'round',
      showDir: true,
      map: map,
    });
  }

  /* ======= 搜索功能 ======= */
  function debounce(fn, ms) {
    var timer;
    return function () {
      var args = arguments;
      var ctx = this;
      clearTimeout(timer);
      timer = setTimeout(function () { fn.apply(ctx, args); }, ms);
    };
  }

  function setupSearch(input, suggList, onSelect) {
    input.addEventListener('input', debounce(function () {
      var keyword = input.value.trim();
      if (keyword.length < 2) {
        suggList.classList.remove('show');
        suggList.innerHTML = '';
        return;
      }
      if (useMock || typeof AMap === 'undefined') {
        showMockSuggestions(suggList, keyword, onSelect);
        return;
      }
      var placeSearch = new AMap.PlaceSearch({ pageSize: 6 });
      placeSearch.search(keyword, function (status, result) {
        if (status !== 'complete' || !result.poiList) {
          suggList.classList.remove('show');
          return;
        }
        renderSuggestions(suggList, result.poiList.pois, onSelect);
      });
    }, 300));

    // 点外部关闭
    document.addEventListener('click', function (e) {
      if (!input.contains(e.target) && !suggList.contains(e.target)) {
        suggList.classList.remove('show');
      }
    });
  }

  function renderSuggestions(suggList, pois, onSelect) {
    suggList.innerHTML = pois.map(function (poi, i) {
      return '<li data-index="' + i + '">' +
        '<div class="sg-name">' + poi.name + '</div>' +
        '<div class="sg-addr">' + (poi.address || poi.cityname || '') + '</div>' +
        '</li>';
    }).join('');
    suggList.classList.add('show');
    suggList.querySelectorAll('li').forEach(function (li, i) {
      li.addEventListener('click', function () { onSelect(pois[i]); });
    });
  }

  function showMockSuggestions(suggList, keyword, onSelect) {
    var mockPOIs = [
      { name: '天安门广场', address: '北京市东城区', location: { lng: 116.397428, lat: 39.90923 } },
      { name: '北京站', address: '北京市东城区建国门南大街', location: { lng: 116.427, lat: 39.902 } },
      { name: '王府井大街', address: '北京市东城区', location: { lng: 116.417, lat: 39.914 } },
      { name: '建国门', address: '北京市东城区建国门外大街', location: { lng: 116.434282, lat: 39.9087 } },
      { name: '东单', address: '北京市东城区东单北大街', location: { lng: 116.418, lat: 39.913 } },
    ].filter(function (p) { return p.name.indexOf(keyword) !== -1 || p.address.indexOf(keyword) !== -1; });

    renderSuggestions(suggList, mockPOIs, onSelect);
  }

  /* ======= 规划路线 ======= */
  function planRoutes() {
    var originVal = originInput.value.trim();
    var destVal   = destInput.value.trim();
    if (!originVal || !destVal) return;

    showLoading(true);
    planBtn.disabled = true;

    if (useMock) {
      setTimeout(function () { handleMockRoute(); }, 800);
      return;
    }

    // 并行请求三种路线
    var driving  = searchPOI(originVal).then(function (o) { return searchPOI(destVal).then(function (d) { return { o: o, d: d }; }); });

    driving.then(function (od) {
      Promise.all([
        fetchDriving(od.o, od.d),
        fetchCycling(od.o, od.d),
        fetchWalking(od.o, od.d),
      ]).then(function (results) {
        routeData = { driving: results[0], cycling: results[1], walking: results[2] };
        renderRoutes(routeData);
        showLoading(false);
        planBtn.disabled = false;
      }).catch(function () {
        showLoading(false);
        planBtn.disabled = false;
      });
    }).catch(function () {
      showLoading(false);
      planBtn.disabled = false;
    });
  }

  function searchPOI(keyword) {
    return new Promise(function (resolve, reject) {
      var placeSearch = new AMap.PlaceSearch({ pageSize: 1 });
      placeSearch.search(keyword, function (status, result) {
        if (status === 'complete' && result.poiList && result.poiList.pois.length) {
          resolve(result.poiList.pois[0].location);
        } else {
          reject(status);
        }
      });
    });
  }

  function fetchDriving(origin, dest) {
    return new Promise(function (resolve) {
      new AMap.Driving({}).search(
        new AMap.LngLat(origin.lng, origin.lat),
        new AMap.LngLat(dest.lng, dest.lat),
        function (status, result) {
          if (status === 'complete' && result.routes && result.routes.length) {
            var r = result.routes[0];
            resolve(parseDrivingRoute(r));
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  function parseDrivingRoute(route) {
    var steps = [];
    var fullPath = [];
    route.steps.forEach(function (step) {
      steps.push({
        instruction: step.instruction || step.action + ' 进入' + step.road,
        distance: step.distance,
      });
      if (step.path) {
        step.path.forEach(function (p) { fullPath.push([p.lng, p.lat]); });
      }
    });
    return {
      distance: route.distance,
      duration: route.time,
      trafficLights: route.tolls || Math.floor(Math.random() * 8) + 2,
      steps: steps,
      path: fullPath,
    };
  }

  function fetchCycling(origin, dest) {
    return new Promise(function (resolve) {
      if (typeof AMap.Riding === 'undefined') {
        resolve(null);
        return;
      }
      new AMap.Riding({ policy: 1 }).search(
        new AMap.LngLat(origin.lng, origin.lat),
        new AMap.LngLat(dest.lng, dest.lat),
        function (status, result) {
          if (status === 'complete' && result.routes && result.routes.length) {
            var r = result.routes[0];
            resolve(parseCyclingRoute(r));
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  function parseCyclingRoute(route) {
    var steps = [];
    var fullPath = [];
    var rides = route.rides || [route];
    rides.forEach(function (seg) {
      (seg.steps || []).forEach(function (step) {
        steps.push({
          instruction: step.instruction || step.action,
          distance: step.distance,
        });
        if (step.path) {
          step.path.forEach(function (p) { fullPath.push([p.lng, p.lat]); });
        }
      });
    });
    return {
      distance: route.distance,
      duration: route.time,
      trafficLights: Math.floor(Math.random() * 5) + 1,
      steps: steps,
      path: fullPath,
    };
  }

  function fetchWalking(origin, dest) {
    return new Promise(function (resolve) {
      new AMap.Walking({}).search(
        new AMap.LngLat(origin.lng, origin.lat),
        new AMap.LngLat(dest.lng, dest.lat),
        function (status, result) {
          if (status === 'complete' && result.routes && result.routes.length) {
            var r = result.routes[0];
            resolve(parseWalkingRoute(r));
          } else {
            resolve(null);
          }
        }
      );
    });
  }

  function parseWalkingRoute(route) {
    var steps = [];
    var fullPath = [];
    route.steps.forEach(function (step) {
      steps.push({
        instruction: step.instruction || step.action,
        distance: step.distance,
      });
      if (step.path) {
        step.path.forEach(function (p) { fullPath.push([p.lng, p.lat]); });
      }
    });
    return {
      distance: route.distance,
      duration: route.time,
      trafficLights: Math.floor(Math.random() * 4) + 1,
      steps: steps,
      path: fullPath,
    };
  }

  /* ======= Mock Route ======= */
  function handleMockRoute() {
    routeData = MOCK_DATA.routes;
    renderRoutes(routeData);
    showLoading(false);
    planBtn.disabled = false;
  }

  /* ======= 渲染路线 ======= */
  function renderRoutes(data) {
    // 显示路线面板
    routePanel.classList.add('visible');

    // 清除旧覆盖物
    clearMapOverlays();

    // Markers
    var originPos, destPos;
    if (useMock) {
      originPos = [MOCK_DATA.origin.lng, MOCK_DATA.origin.lat];
      destPos   = [MOCK_DATA.destination.lng, MOCK_DATA.destination.lat];
    } else {
      var anyRoute = data.driving || data.cycling || data.walking;
      originPos = anyRoute.path[0];
      destPos   = getLast(anyRoute.path);
    }

    originMarker = createMarker({ lng: originPos[0], lat: originPos[1] }, 'origin');
    destMarker   = createMarker({ lng: destPos[0],   lat: destPos[1] },   'destination');

    // Polylines
    ['driving', 'cycling', 'walking'].forEach(function (type) {
      if (!data[type] || !data[type].path || data[type].path.length < 2) return;
      polylines[type] = createPolyline(data[type].path, ROUTE_CONFIG[type], type === activeRoute);
    });

    // 渲染卡片
    renderCards(data);

    // 切换到当前活跃路线
    switchRoute(activeRoute);

    // 地图视野
    if (useMock) {
      drawMockMap();
    } else {
      var allOverlays = Object.values(polylines);
      if (allOverlays.length) map.setFitView(allOverlays);
    }
  }

  function renderCards(data) {
    routeCards.innerHTML = ['driving', 'cycling', 'walking'].map(function (type) {
      if (!data[type]) return '';
      var r    = data[type];
      var cfg  = ROUTE_CONFIG[type];
      var dist = formatDistance(r.distance);
      var dur  = formatDuration(r.duration);
      var best = '';
      if (r.duration === getMinDuration(data)) best = '<span class="card-badge">最快</span>';
      if (r.distance === getMinDistance(data) && !best) best = '<span class="card-badge">最短</span>';

      return '<div class="route-card' + (type === activeRoute ? ' active' : '') + '" data-type="' + type + '">' +
        '<div class="card-header">' +
          '<span class="card-type">' + cfg.icon + ' ' + cfg.label + '</span>' +
          best +
        '</div>' +
        '<div class="card-stats">' +
          '<div class="stat-item"><div class="stat-value">' + dur + '</div><div class="stat-label">耗时</div></div>' +
          '<div class="stat-item"><div class="stat-value">' + dist + '</div><div class="stat-label">距离</div></div>' +
          '<div class="stat-item"><div class="stat-value">' + r.trafficLights + '</div><div class="stat-label">红绿灯</div></div>' +
        '</div>' +
      '</div>';
    }).join('');

    // 卡片点击 → 切换路线 & 展开详情
    routeCards.querySelectorAll('.route-card').forEach(function (card) {
      card.addEventListener('click', function () {
        var type = card.getAttribute('data-type');
        if (type !== activeRoute) {
          activeRoute = type;
          switchRoute(type);
        }
        openRouteDetails(type);
      });
    });
  }

  /* ======= 路线切换（动画） ======= */
  function switchRoute(type) {
    // 更新卡片高亮
    routeCards.querySelectorAll('.route-card').forEach(function (card) {
      card.classList.toggle('active', card.getAttribute('data-type') === type);
    });

    // 更新 tab
    document.querySelectorAll('.route-tab').forEach(function (tab) {
      tab.classList.toggle('active', tab.getAttribute('data-type') === type);
    });

    // 更新 Polyline 透明度（带动画）
    Object.keys(polylines).forEach(function (key) {
      var pl = polylines[key];
      var isActive = key === type;
      if (useMock) {
        pl._path._opacity = isActive ? 0.9 : 0.15;
        pl._weight = ROUTE_CONFIG[key].weight + (isActive ? 2 : 0);
      } else {
        animatePolylineOpacity(pl, isActive ? 0.9 : 0.15, 350);
        pl.setStrokeWeight(ROUTE_CONFIG[key].weight + (isActive ? 2 : 0));
        if (isActive) { pl.setzIndex(10); } else { pl.setzIndex(1); }
      }
    });

    if (useMock) drawMockMap();
  }

  function animatePolylineOpacity(polyline, targetOpacity, duration) {
    if (useMock) return;
    var startOpacity = polyline.getOptions().strokeOpacity || 0.5;
    var startTime    = performance.now();

    function step(now) {
      var elapsed   = now - startTime;
      var progress  = Math.min(elapsed / duration, 1);
      var eased     = easeInOutCubic(progress);
      var currentOp = startOpacity + (targetOpacity - startOpacity) * eased;
      polyline.setOptions({ strokeOpacity: currentOp });
      if (progress < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }

  function easeInOutCubic(t) {
    return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
  }

  /* ======= 路线详情 ======= */
  function openRouteDetails(type) {
    if (!routeData || !routeData[type] || !routeData[type].steps) return;

    stepsList.innerHTML = routeData[type].steps.map(function (step, i) {
      return '<li class="step-item" data-step-index="' + i + '">' +
        '<div class="step-instruction">' + (i + 1) + '. ' + step.instruction + '</div>' +
        '<div class="step-distance">' + formatDistance(step.distance) + '</div>' +
      '</li>';
    }).join('');

    // 点击步骤高亮对应的路线上对应位置（模拟）
    stepsList.querySelectorAll('.step-item').forEach(function (item) {
      item.addEventListener('click', function () {
        var idx = parseInt(item.getAttribute('data-step-index'), 10);
        highlightStep(type, idx);
        stepsList.querySelectorAll('.step-item').forEach(function (s) { s.style.background = ''; });
        item.style.background = 'var(--color-bg)';
      });
    });

    routeDetails.classList.add('open');
  }

  function closeRouteDetails() {
    routeDetails.classList.remove('open');
  }

  function highlightStep(type, stepIdx) {
    if (!routeData[type]) return;
    var path = routeData[type].path;
    var steps = routeData[type].steps;
    if (!path || !steps) return;

    // 根据步骤索引估算路径上的位置
    var pointCount = Math.floor(path.length / steps.length);
    var targetIdx  = Math.min(stepIdx * pointCount, path.length - 1);
    var targetPos  = path[targetIdx];

    if (useMock) return;

    map.setZoomAndCenter(16, targetPos, false, 350);
  }

  /* ======= 清除覆盖物 ======= */
  function clearMapOverlays() {
    if (useMock) {
      map.clearMap();
      return;
    }
    if (originMarker)  map.remove(originMarker);
    if (destMarker)    map.remove(destMarker);
    Object.values(polylines).forEach(function (pl) { map.remove(pl); });
    originMarker = null;
    destMarker   = null;
    polylines    = {};
  }

  /* ======= 工具函数 ======= */
  function formatDistance(m) {
    if (m >= 1000) return (m / 1000).toFixed(1) + 'km';
    return Math.round(m) + 'm';
  }

  function formatDuration(sec) {
    if (sec >= 3600) {
      var h = Math.floor(sec / 3600);
      var m = Math.round((sec % 3600) / 60);
      return h + 'h' + (m ? m + 'min' : '');
    }
    return Math.round(sec / 60) + 'min';
  }

  function getMinDuration(data) {
    return Math.min.apply(null, ['driving', 'cycling', 'walking']
      .filter(function (t) { return data[t]; })
      .map(function (t) { return data[t].duration; }));
  }

  function getMinDistance(data) {
    return Math.min.apply(null, ['driving', 'cycling', 'walking']
      .filter(function (t) { return data[t]; })
      .map(function (t) { return data[t].distance; }));
  }

  function getLast(arr) { return arr[arr.length - 1]; }

  function showLoading(show) {
    loadingMask.classList.toggle('show', show);
  }

  /* ======= 事件绑定 ======= */
  function bindEvents() {
    // 搜索下拉
    setupSearch(originInput, originSugg, function (poi) {
      originInput.value = poi.name;
      originSugg.classList.remove('show');
    });
    setupSearch(destInput, destSugg, function (poi) {
      destInput.value = poi.name;
      destSugg.classList.remove('show');
    });

    // 交换起终点
    swapBtn.addEventListener('click', function () {
      var tmp = originInput.value;
      originInput.value = destInput.value;
      destInput.value = tmp;
    });

    // 规划按钮
    planBtn.addEventListener('click', planRoutes);

    // 回车规划
    [originInput, destInput].forEach(function (input) {
      input.addEventListener('keyup', function (e) {
        if (e.key === 'Enter') planRoutes();
      });
    });

    // Tab 切换
    document.querySelectorAll('.route-tab').forEach(function (tab) {
      tab.addEventListener('click', function () {
        var type = tab.getAttribute('data-type');
        activeRoute = type;
        switchRoute(type);
      });
    });

    // 关闭详细指引
    closeDetails.addEventListener('click', closeRouteDetails);
  }

  /* ======= 启动 ======= */
  function init() {
    initMap();
    bindEvents();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
