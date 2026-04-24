/**
 * MultiRoutePlanner — 多路线规划对比组件
 *
 * 输入起终点，自动生成步行/骑行/驾车三种路线，在地图上用不同颜色展示，
 * 对比耗时/距离/红绿灯数量，支持点击查看详细步骤指引，带平滑过渡动画。
 */
class MultiRoutePlanner {
  constructor(container, options = {}) {
    this.container = container;
    this.options = {
      defaultOrigin: '',
      defaultDestination: '',
      onRouteChange: null,
      ...options
    };

    this.routes = [];               // 当前路线数据
    this.activeRouteId = null;      // 当前选中路线
    this.mapLayers = {};            // { walking: L.LayerGroup, cycling, driving }
    this.markers = [];              // 起终点标记
    this.selectedSuggestion = { origin: null, dest: null };
    this.abortController = null;    // 用于取消请求

    this._buildDOM();
    this._initMap();
    this._bindEvents();

    // 如果给了默认地址，自动搜索
    if (this.options.defaultOrigin && this.options.defaultDestination) {
      this.originInput.value = this.options.defaultOrigin;
      this.destInput.value = this.options.defaultDestination;
      this._search();
    }
  }

  /* ================================================================
   * DOM 构建
   * ================================================================ */
  _buildDOM() {
    this.originInput   = this.container.querySelector('#originInput');
    this.destInput     = this.container.querySelector('#destInput');
    this.originDropdown = this.container.querySelector('#originDropdown');
    this.destDropdown   = this.container.querySelector('#destDropdown');
    this.searchBtn     = this.container.querySelector('#searchBtn');
    this.routeCards    = this.container.querySelector('#routeCards');
    this.routesSection = this.container.querySelector('#routesSection');
    this.stepsPanel    = this.container.querySelector('#stepsPanel');
    this.stepsTitle    = this.container.querySelector('#stepsTitle');
    this.stepsList     = this.container.querySelector('#stepsList');
    this.stepsClose    = this.container.querySelector('#stepsClose');
    this.loadingOverlay = this.container.querySelector('#loadingOverlay');
    this.statusText    = this.container.querySelector('#statusText');
    this.mapContainer  = this.container.querySelector('#mapContainer');
  }

  /* ================================================================
   * 地图初始化
   * ================================================================ */
  _initMap() {
    this.map = L.map(this.mapContainer, {
      center: [39.9042, 116.4074],  // 北京中心
      zoom: 13,
      zoomControl: true,
    });

    // 地图瓦片
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
      maxZoom: 19,
    }).addTo(this.map);

    // 为每种路线类型创建图层组
    this.mapLayers = {
      walking: L.layerGroup().addTo(this.map),
      cycling: L.layerGroup().addTo(this.map),
      driving: L.layerGroup().addTo(this.map),
    };

    // 起点/终点标记图层
    this.markerLayer = L.layerGroup().addTo(this.map);

    // 地图尺寸修正（防止容器初始化时不可见）
    setTimeout(() => this.map.invalidateSize(), 100);
  }

  /* ================================================================
   * 事件绑定
   * ================================================================ */
  _bindEvents() {
    // 搜索按钮
    this.searchBtn.addEventListener('click', () => this._search());

    // 回车搜索
    this.originInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._search();
    });
    this.destInput.addEventListener('keydown', (e) => {
      if (e.key === 'Enter') this._search();
    });

    // 自动补全 — 输入时检索
    this._setupAutocomplete(this.originInput, this.originDropdown, 'origin');
    this._setupAutocomplete(this.destInput, this.destDropdown, 'dest');

    // 关闭步骤面板
    this.stepsClose.addEventListener('click', () => {
      this.stepsPanel.style.display = 'none';
    });

    // 窗口大小改变时修正地图
    window.addEventListener('resize', () => {
      if (this.map) this.map.invalidateSize();
    });
  }

  /* ================================================================
   * 自动补全
   * ================================================================ */
  _setupAutocomplete(input, dropdown, type) {
    let debounceTimer;
    let activeIndex = -1;

    input.addEventListener('input', () => {
      clearTimeout(debounceTimer);
      this.selectedSuggestion[type] = null;
      activeIndex = -1;

      const query = input.value.trim();
      if (query.length < 2) {
        dropdown.classList.remove('active');
        return;
      }

      debounceTimer = setTimeout(() => this._fetchSuggestions(query, dropdown, type), 400);
    });

    input.addEventListener('keydown', (e) => {
      const items = dropdown.querySelectorAll('.autocomplete-item');
      if (!items.length || !dropdown.classList.contains('active')) return;

      if (e.key === 'ArrowDown') {
        e.preventDefault();
        activeIndex = Math.min(activeIndex + 1, items.length - 1);
        this._highlightSuggestion(items, activeIndex);
      } else if (e.key === 'ArrowUp') {
        e.preventDefault();
        activeIndex = Math.max(activeIndex - 1, 0);
        this._highlightSuggestion(items, activeIndex);
      } else if (e.key === 'Enter' && activeIndex >= 0) {
        e.preventDefault();
        items[activeIndex].click();
      }
    });

    input.addEventListener('blur', () => {
      setTimeout(() => dropdown.classList.remove('active'), 200);
    });
  }

  _highlightSuggestion(items, index) {
    items.forEach((item, i) => {
      item.classList.toggle('highlighted', i === index);
    });
  }

  async _fetchSuggestions(query, dropdown, type) {
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5&addressdetails=1&accept-language=zh`;
      const res = await fetch(url);
      const data = await res.json();

      dropdown.innerHTML = '';
      if (!data.length) {
        dropdown.innerHTML = '<div class="autocomplete-item" style="color:#94a3b8;">无结果</div>';
        dropdown.classList.add('active');
        return;
      }

      data.forEach((item) => {
        const div = document.createElement('div');
        div.className = 'autocomplete-item';
        div.textContent = item.display_name;
        div.addEventListener('mousedown', () => {
          const input = type === 'origin' ? this.originInput : this.destInput;
          input.value = item.display_name;
          this.selectedSuggestion[type] = { lat: parseFloat(item.lat), lon: parseFloat(item.lon) };
          dropdown.classList.remove('active');
        });
        dropdown.appendChild(div);
      });

      dropdown.classList.add('active');
    } catch {
      // 静默处理网络错误
    }
  }

  /* ================================================================
   * 地理编码 — 地址 → 坐标
   * ================================================================ */
  async _geocode(address, type) {
    // 优先使用自动补全结果
    if (this.selectedSuggestion[type]) {
      return this.selectedSuggestion[type];
    }

    const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(address)}&limit=1&accept-language=zh`;
    const res = await fetch(url);
    const data = await res.json();

    if (!data.length) throw new Error(`未找到地址: ${address}`);

    return { lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon) };
  }

  /* ================================================================
   * OSRM 路线请求
   * ================================================================ */
  async _fetchRoute(origin, dest, profile) {
    const coordStr = `${origin.lon},${origin.lat};${dest.lon},${dest.lat}`;
    const profileMap = {
      walking: 'foot',
      cycling: 'bike',
      driving: 'car',
    };
    const url = `https://router.project-osrm.org/route/v1/${profileMap[profile]}/${coordStr}?overview=full&geometries=polyline&steps=true&alternatives=false&annotations=true`;

    const res = await fetch(url);
    const json = await res.json();

    if (json.code !== 'Ok' || !json.routes?.length) {
      throw new Error(`${profile} 路线规划失败`);
    }

    const route = json.routes[0];
    const legs = route.legs[0];

    return {
      id: profile,
      label: { walking: '步行', cycling: '骑行', driving: '驾车' }[profile],
      icon:  { walking: '🚶', cycling: '🚴', driving: '🚗' }[profile],
      color: { walking: '#22c55e', cycling: '#3b82f6', driving: '#ef4444' }[profile],
      distance: route.distance,           // 米
      duration: route.duration,           // 秒
      trafficLights: this._countTrafficLights(legs.steps),
      polyline: this._decodePolyline(route.geometry),
      steps: legs.steps.map((step, i) => ({
        index: i + 1,
        instruction: this._translateInstruction(step.maneuver?.type || 'straight', step.name),
        distance: step.distance,
        duration: step.duration,
        name: step.name,
        maneuver: step.maneuver?.type || 'straight',
        intersections: step.intersections || [],
      })),
    };
  }

  /* ================================================================
   * 红绿灯计数（从 OSRM 步骤数据中统计）
   * ================================================================ */
  _countTrafficLights(steps) {
    let count = 0;
    for (const step of steps) {
      if (step.intersections) {
        for (const intersection of step.intersections) {
          // OSRM 中红绿灯标注为 traffic_signals 类
          if (intersection.classes?.includes('traffic_signals')) {
            count++;
          }
        }
      }
    }
    return count;
  }

  /* ================================================================
   * OSRM Polyline 解码
   * ================================================================ */
  _decodePolyline(encoded) {
    let index = 0;
    const len = encoded.length;
    const points = [];
    let lat = 0, lng = 0;

    while (index < len) {
      let b, shift = 0, result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlat = (result & 1) ? ~(result >> 1) : (result >> 1);
      lat += dlat;

      shift = 0;
      result = 0;
      do {
        b = encoded.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);
      const dlng = (result & 1) ? ~(result >> 1) : (result >> 1);
      lng += dlng;

      points.push([lat / 1e5, lng / 1e5]);
    }

    return points;
  }

  /* ================================================================
   * 指令翻译（英→中）
   * ================================================================ */
  _translateInstruction(type, name) {
    const map = {
      'turn-left':        '左转',
      'turn-right':       '右转',
      'turn-sharp-left':  '急左转',
      'turn-sharp-right': '急右转',
      'turn-slight-left': '稍向左转',
      'turn-slight-right':'稍向右转',
      'continue':         '直行',
      'straight':         '直行',
      'arrive':           '到达目的地',
      'depart':           '出发',
      'roundabout':       '进入环岛',
      'exit roundabout':  '驶出环岛',
      'fork-left':        '靠左行驶',
      'fork-right':       '靠右行驶',
      'uturn':            '掉头',
      'merge':            '并道',
    };
    const translated = map[type] || type;
    return name ? `沿${name}${translated}` : translated;
  }

  /* ================================================================
   * 搜索 & 路线规划（入口）
   * ================================================================ */
  async _search() {
    const originAddr = this.originInput.value.trim();
    const destAddr = this.destInput.value.trim();

    if (!originAddr || !destAddr) {
      this._setStatus('请输入起点和终点');
      return;
    }

    // 取消上次未完成的请求
    if (this.abortController) {
      this.abortController.abort();
    }
    this.abortController = new AbortController();

    this._setLoading(true);
    this._setStatus('正在搜索地址...');
    this.stepsPanel.style.display = 'none';
    this.activeRouteId = null;

    try {
      // Step 1: 地理编码
      const [origin, dest] = await Promise.all([
        this._geocode(originAddr, 'origin'),
        this._geocode(destAddr, 'dest'),
      ]);

      this._setStatus('正在规划路线...');

      // Step 2: 并行请求三种路线
      const profiles = ['walking', 'cycling', 'driving'];
      const results = await Promise.allSettled(
        profiles.map(p => this._fetchRoute(origin, dest, p))
      );

      this.routes = results
        .filter(r => r.status === 'fulfilled')
        .map(r => r.value);

      if (!this.routes.length) {
        throw new Error('所有路线规划均失败，请尝试其他地址');
      }

      // 记录失败的路线
      const failed = results
        .map((r, i) => r.status === 'rejected' ? profiles[i] : null)
        .filter(Boolean);

      if (failed.length) {
        this._setStatus(`部分路线规划失败: ${failed.join(', ')}（已显示可用路线）`);
      } else {
        this._setStatus(`已规划 ${this.routes.length} 条路线`);
      }

      // Step 3: 渲染
      this._renderRoutes(origin, dest);

    } catch (err) {
      if (err.name === 'AbortError') return;
      this._setStatus(`错误: ${err.message}`);
      console.error('路线搜索失败:', err);
    } finally {
      this._setLoading(false);
    }
  }

  /* ================================================================
   * 渲染路线到地图和信息卡片
   * ================================================================ */
  _renderRoutes(origin, dest) {
    // 清除旧图层
    Object.values(this.mapLayers).forEach(lg => lg.clearLayers());
    this.markerLayer.clearLayers();

    // 起终点标记
    const originMarker = L.marker([origin.lat, origin.lon], {
      icon: this._createMarkerIcon('#ef4444', '起'),
    }).bindPopup(`<b>起点</b><br>${this.originInput.value}`);
    const destMarker = L.marker([dest.lat, dest.lon], {
      icon: this._createMarkerIcon('#22c55e', '终'),
    }).bindPopup(`<b>终点</b><br>${this.destInput.value}`);

    originMarker.addTo(this.markerLayer);
    destMarker.addTo(this.markerLayer);

    // 绘制路线
    const bounds = L.latLngBounds(
      [origin.lat, origin.lon],
      [dest.lat, dest.lon]
    );

    this.routes.forEach(route => {
      const layer = this.mapLayers[route.id];
      if (!layer) return;

      const polyline = L.polyline(route.polyline, {
        color: route.color,
        weight: 5,
        opacity: 0.8,
        lineCap: 'round',
        lineJoin: 'round',
        className: `route-polyline route-${route.id}`,
      }).addTo(layer);

      polyline.on('click', () => this._activateRoute(route.id));

      // 扩展边界以包含所有路线点
      route.polyline.forEach(p => bounds.extend(p));
    });

    this.map.fitBounds(bounds, { padding: [40, 40] });

    // 渲染信息卡片
    this._renderCards();

    // 默认选中第一条路线
    if (this.routes.length > 0) {
      this._activateRoute(this.routes[0].id);
    }
  }

  /* ================================================================
   * 自定义标记图标
   * ================================================================ */
  _createMarkerIcon(color, label) {
    return L.divIcon({
      className: 'custom-div-icon',
      html: `<div style="
        background:${color};
        color:#fff;
        width:28px;height:28px;
        border-radius:50%;
        display:flex;
        align-items:center;
        justify-content:center;
        font-size:12px;
        font-weight:700;
        box-shadow:0 2px 6px rgba(0,0,0,.3);
        border:2px solid #fff;
      ">${label}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
      popupAnchor: [0, -16],
    });
  }

  /* ================================================================
   * 路线信息卡片
   * ================================================================ */
  _renderCards() {
    this.routeCards.innerHTML = '';

    this.routes.forEach(route => {
      const card = document.createElement('div');
      card.className = `route-card ${route.id}`;
      card.dataset.routeId = route.id;

      const distKm = (route.distance / 1000).toFixed(1);
      const durMin = Math.round(route.duration / 60);

      card.innerHTML = `
        <div class="route-card-header">
          <span class="route-type-badge">${route.icon} ${route.label}</span>
          <span class="route-check">✓</span>
        </div>
        <div class="route-metrics">
          <div class="metric-item">
            <div class="metric-value">${durMin}<small style="font-size:11px;font-weight:400;"> 分钟</small></div>
            <div class="metric-label">⏱ 耗时</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">${distKm}<small style="font-size:11px;font-weight:400;"> km</small></div>
            <div class="metric-label">📏 距离</div>
          </div>
          <div class="metric-item">
            <div class="metric-value">${route.trafficLights}</div>
            <div class="metric-label">🚦 红绿灯</div>
          </div>
        </div>
        <div class="route-summary">${this._getRouteSummary(route)}</div>
      `;

      card.addEventListener('click', () => this._activateRoute(route.id));
      this.routeCards.appendChild(card);
    });
  }

  /* ================================================================
   * 路线摘要
   * ================================================================ */
  _getRouteSummary(route) {
    const mainRoads = route.steps
      .filter(s => s.name && s.maneuver !== 'depart' && s.maneuver !== 'arrive')
      .map(s => s.name)
      .filter((v, i, a) => a.indexOf(v) === i)
      .slice(0, 3);
    return mainRoads.length
      ? `途经: ${mainRoads.join(' → ')}`
      : '规划完成';
  }

  /* ================================================================
   * 激活路线 — 高亮卡片 & 地图 & 显示步骤
   * ================================================================ */
  _activateRoute(routeId) {
    const prevId = this.activeRouteId;
    if (prevId === routeId) return;

    this.activeRouteId = routeId;
    const route = this.routes.find(r => r.id === routeId);
    if (!route) return;

    // 卡片状态切换
    this.container.querySelectorAll('.route-card').forEach(card => {
      card.classList.toggle('active', card.dataset.routeId === routeId);
    });

    // 地图路线高亮 — 目标路线高亮，其余淡化
    Object.entries(this.mapLayers).forEach(([id, layer]) => {
      layer.eachLayer(polyline => {
        if (polyline.setStyle) {
          polyline.setStyle({
            opacity: id === routeId ? 1 : 0.3,
            weight: id === routeId ? 7 : 5,
          });
        }
      });
    });

    // 步骤指引
    this._showSteps(route);

    // 回调
    if (this.options.onRouteChange) {
      this.options.onRouteChange(route);
    }
  }

  /* ================================================================
   * 显示步骤指引
   * ================================================================ */
  _showSteps(route) {
    this.stepsTitle.textContent = `${route.icon} ${route.label} — 详细指引`;
    this.stepsList.innerHTML = '';

    route.steps.forEach((step, i) => {
      const dist = step.distance >= 1000
        ? `${(step.distance / 1000).toFixed(1)} km`
        : `${Math.round(step.distance)} m`;

      const item = document.createElement('div');
      item.className = 'step-item';

      const maneuverIcons = {
        'turn-left': '↰', 'turn-right': '↱', 'straight': '↑', 'continue': '↑',
        'depart': '▶', 'arrive': '🏁', 'roundabout': '⟳', 'uturn': '↩',
        'turn-slight-left': '↰', 'turn-slight-right': '↱',
        'turn-sharp-left': '↰', 'turn-sharp-right': '↱',
        'fork-left': '↰', 'fork-right': '↱', 'merge': '⇶',
        'exit roundabout': '⟳',
      };

      item.innerHTML = `
        <div class="step-marker">${maneuverIcons[step.maneuver] || '•'}</div>
        <div class="step-body">
          <div class="step-instruction">${step.instruction}</div>
          <div class="step-distance">${dist}${step.name ? ' · ' + step.name : ''}</div>
        </div>
      `;

      this.stepsList.appendChild(item);

      // 步骤间分隔线
      if (i < route.steps.length - 1) {
        const divider = document.createElement('div');
        divider.className = 'step-divider';
        this.stepsList.appendChild(divider);
      }
    });

    this.stepsPanel.style.display = 'flex';

    // 滚动到顶部
    this.stepsList.scrollTop = 0;
  }

  /* ================================================================
   * 辅助：设置加载状态
   * ================================================================ */
  _setLoading(loading) {
    this.loadingOverlay.style.display = loading ? 'flex' : 'none';
    this.searchBtn.disabled = loading;
  }

  _setStatus(text) {
    this.statusText.textContent = text;
  }
}
