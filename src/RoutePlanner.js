/**
 * MultiRoutePlanner - 多路线规划对比组件
 * 支持步行/骑行/驾车三种出行方式，地图展示+数据面板对比
 */

class MultiRoutePlanner {
  constructor(containerId, options = {}) {
    this.container = document.getElementById(containerId);
    if (!this.container) throw new Error(`容器 #${containerId} 不存在`);

    this.amapKey = options.amapKey || '';
    this.mapCenter = options.center || [116.397428, 39.90923]; // 默认北京天安门
    this.mapZoom = options.zoom || 13;
    this.city = options.city || '北京';

    this.origin = null;
    this.destination = null;
    this.originText = '';
    this.destinationText = '';
    this.routes = { walking: null, riding: null, driving: null };
    this.activeRoute = null;
    this.polylines = [];
    this.markers = [];
    this.activeStepIndex = -1;

    this.routeColors = {
      walking: '#2ecc71',
      riding: '#3498db',
      driving: '#e74c3c'
    };

    this.routeIcons = {
      walking: '🚶',
      riding: '🚴',
      driving: '🚗'
    };

    this.routeLabels = {
      walking: '步行',
      riding: '骑行',
      driving: '驾车'
    };

    this._init();
  }

  _init() {
    this._loadAMap().then(() => {
      this._createDOM();
      this._initMap();
      this._bindEvents();
    });
  }

  _loadAMap() {
    return new Promise((resolve) => {
      if (window.AMap) return resolve();
      const script = document.createElement('script');
      script.src = `https://webapi.amap.com/maps?v=2.0&key=${this.amapKey}&plugin=AMap.Walking,AMap.Riding,AMap.Driving,AMap.AutoComplete,AMap.PlaceSearch,AMap.Geocoder`;
      script.onload = resolve;
      document.head.appendChild(script);
    });
  }

  _createDOM() {
    this.container.innerHTML = `
      <div class="mrp-wrapper">
        <!-- 搜索栏 -->
        <div class="mrp-search-bar">
          <div class="mrp-search-inputs">
            <div class="mrp-input-group">
              <span class="mrp-dot mrp-dot-origin"></span>
              <input type="text" class="mrp-input" id="${this.container.id}-origin"
                     placeholder="请输入起点" value="${this.originText}">
            </div>
            <button class="mrp-swap-btn" id="${this.container.id}-swap" title="交换起终点">⇅</button>
            <div class="mrp-input-group">
              <span class="mrp-dot mrp-dot-dest"></span>
              <input type="text" class="mrp-input" id="${this.container.id}-dest"
                     placeholder="请输入终点" value="${this.destinationText}">
            </div>
          </div>
          <button class="mrp-plan-btn" id="${this.container.id}-plan">路线规划</button>
        </div>

        <!-- 主体区域 -->
        <div class="mrp-main">
          <!-- 地图容器 -->
          <div class="mrp-map-container" id="${this.container.id}-map"></div>

          <!-- 路线对比面板 -->
          <div class="mrp-panel" id="${this.container.id}-panel">
            <div class="mrp-panel-header">
              <h3>路线对比</h3>
              <div class="mrp-panel-tabs" id="${this.container.id}-tabs">
                <button class="mrp-tab active" data-type="all">全部</button>
                <button class="mrp-tab" data-type="walking">步行</button>
                <button class="mrp-tab" data-type="riding">骑行</button>
                <button class="mrp-tab" data-type="driving">驾车</button>
              </div>
            </div>
            <div class="mrp-panel-body" id="${this.container.id}-body">
              <div class="mrp-empty">
                <div class="mrp-empty-icon">🗺️</div>
                <p>请输入起点和终点进行路线规划</p>
              </div>
            </div>
          </div>
        </div>

        <!-- 路线详情浮层 -->
        <div class="mrp-detail-overlay" id="${this.container.id}-detail-overlay">
          <div class="mrp-detail-panel" id="${this.container.id}-detail-panel">
            <div class="mrp-detail-header">
              <h4 id="${this.container.id}-detail-title"></h4>
              <button class="mrp-detail-close" id="${this.container.id}-detail-close">✕</button>
            </div>
            <div class="mrp-detail-summary" id="${this.container.id}-detail-summary"></div>
            <div class="mrp-detail-steps" id="${this.container.id}-detail-steps"></div>
          </div>
        </div>
      </div>
    `;
  }

  _initMap() {
    this.map = new AMap.Map(`${this.container.id}-map`, {
      zoom: this.mapZoom,
      center: this.mapCenter,
      mapStyle: 'amap://styles/whitesmoke',
      resizeEnable: true
    });

    // 点击地图获取坐标
    this.map.on('click', (e) => {
      if (!this._selectingOrigin && !this._selectingDest) return;
      const lnglat = [e.lnglat.getLng(), e.lnglat.getLat()];

      if (this._selectingOrigin) {
        this._setOrigin(lnglat);
        this._selectingOrigin = false;
        this.map.setDefaultCursor('default');
      } else if (this._selectingDest) {
        this._setDestination(lnglat);
        this._selectingDest = false;
        this.map.setDefaultCursor('default');
      }
    });
  }

  _bindEvents() {
    const originInput = document.getElementById(`${this.container.id}-origin`);
    const destInput = document.getElementById(`${this.container.id}-dest`);
    const planBtn = document.getElementById(`${this.container.id}-plan`);
    const swapBtn = document.getElementById(`${this.container.id}-swap`);

    // 自动补全
    this._initAutocomplete(originInput, (addr, lnglat) => {
      originInput.value = addr;
      this.originText = addr;
      this._setOrigin(lnglat);
    });

    this._initAutocomplete(destInput, (addr, lnglat) => {
      destInput.value = addr;
      this.destinationText = addr;
      this._setDestination(lnglat);
    });

    // 回车搜索
    originInput.addEventListener('keydown', (e) => e.key === 'Enter' && planBtn.click());
    destInput.addEventListener('keydown', (e) => e.key === 'Enter' && planBtn.click());

    // 路线规划
    planBtn.addEventListener('click', () => this.plan());

    // 交换起终点
    swapBtn.addEventListener('click', () => this._swapPoints());

    // Tab 切换
    document.getElementById(`${this.container.id}-tabs`).addEventListener('click', (e) => {
      if (e.target.classList.contains('mrp-tab')) {
        document.querySelectorAll(`#${this.container.id}-tabs .mrp-tab`).forEach(t => t.classList.remove('active'));
        e.target.classList.add('active');
        this._filterRoutes(e.target.dataset.type);
      }
    });

    // 关闭详情
    document.getElementById(`${this.container.id}-detail-close`).addEventListener('click', () => {
      this._closeDetail();
    });
    document.getElementById(`${this.container.id}-detail-overlay`).addEventListener('click', (e) => {
      if (e.target === e.currentTarget) this._closeDetail();
    });
  }

  _initAutocomplete(input, callback) {
    if (!window.AMap.AutoComplete) return;

    const auto = new AMap.AutoComplete({
      city: this.city,
      input: input.id
    });

    auto.on('select', (e) => {
      const { name, location } = e.poi;
      if (location) {
        callback(name, [location.getLng(), location.getLat()]);
      }
    });

    // 如果没有选中建议，回车时做地理编码
    input._geocode = (text) => {
      if (!text) return;
      const geocoder = new AMap.Geocoder({ city: this.city });
      geocoder.getLocation(text, (status, result) => {
        if (status === 'complete' && result.geocodes.length) {
          const geo = result.geocodes[0];
          callback(text, [geo.location.getLng(), geo.location.getLat()]);
        } else {
          this._showToast('未找到该地址，请重新输入');
        }
      });
    };
  }

  _setOrigin(lnglat) {
    this.origin = lnglat;
    this._addMarker(lnglat, 'origin');
  }

  _setDestination(lnglat) {
    this.destination = lnglat;
    this._addMarker(lnglat, 'destination');
  }

  _addMarker(pos, type) {
    // 移除旧 marker
    this.markers = this.markers.filter(m => {
      if (m._type === type) {
        this.map.remove(m);
        return false;
      }
      return true;
    });

    const color = type === 'origin' ? '#2ecc71' : '#e74c3c';
    const label = type === 'origin' ? '起' : '终';

    const marker = new AMap.Marker({
      position: pos,
      _type: type,
      content: `<div class="mrp-marker" style="background:${color}">${label}</div>`,
      offset: new AMap.Pixel(-15, -15),
      zIndex: 120
    });

    marker._type = type;
    this.map.add(marker);
    this.markers.push(marker);

    // 两个点都有的话适配视图
    if (this.origin && this.destination) {
      this.map.setFitView([this.markers], false, [80, 80, 80, 400]);
    }
  }

  _swapPoints() {
    [this.origin, this.destination] = [this.destination, this.origin];
    [this.originText, this.destinationText] = [this.destinationText, this.originText];

    const originInput = document.getElementById(`${this.container.id}-origin`);
    const destInput = document.getElementById(`${this.container.id}-dest`);
    originInput.value = this.originText;
    destInput.value = this.destinationText;

    if (this.origin) this._addMarker(this.origin, 'origin');
    if (this.destination) this._addMarker(this.destination, 'destination');

    if (this.origin && this.destination) this.plan();
  }

  async plan() {
    const originInput = document.getElementById(`${this.container.id}-origin`);
    const destInput = document.getElementById(`${this.container.id}-dest`);
    const originVal = originInput.value.trim();
    const destVal = destInput.value.trim();

    if (!originVal || !destVal) {
      this._showToast('请输入起点和终点');
      return;
    }

    this._showLoading(true);

    // 起点地理编码（如果还没有坐标）
    if (!this.origin && originInput._geocode) {
      await new Promise(resolve => {
        const geocoder = new AMap.Geocoder({ city: this.city });
        geocoder.getLocation(originVal, (status, result) => {
          if (status === 'complete' && result.geocodes.length) {
            const geo = result.geocodes[0];
            this.origin = [geo.location.getLng(), geo.location.getLat()];
          }
          resolve();
        });
      });
    }
    if (!this.origin) {
      this._showToast('起点地址解析失败');
      this._showLoading(false);
      return;
    }

    // 终点地理编码
    if (!this.destination && destInput._geocode) {
      await new Promise(resolve => {
        const geocoder = new AMap.Geocoder({ city: this.city });
        geocoder.getLocation(destVal, (status, result) => {
          if (status === 'complete' && result.geocodes.length) {
            const geo = result.geocodes[0];
            this.destination = [geo.location.getLng(), geo.location.getLat()];
          }
          resolve();
        });
      });
    }
    if (!this.destination) {
      this._showToast('终点地址解析失败');
      this._showLoading(false);
      return;
    }

    // 确保 markers 显示
    this._addMarker(this.origin, 'origin');
    this._addMarker(this.destination, 'destination');

    // 清除旧路线
    this._clearRoutes();

    // 并行发起三种路线规划
    try {
      const [walking, riding, driving] = await Promise.allSettled([
        this._planWalking(),
        this._planRiding(),
        this._planDriving()
      ]);

      this.routes.walking = walking.status === 'fulfilled' ? walking.value : null;
      this.routes.riding = riding.status === 'fulfilled' ? riding.value : null;
      this.routes.driving = driving.status === 'fulfilled' ? driving.value : null;

      const hasAny = this.routes.walking || this.routes.riding || this.routes.driving;
      if (!hasAny) {
        this._showToast('路线规划失败，请检查起终点是否有效');
      } else {
        this._renderAllRoutes();
        this._renderPanel();
      }
    } catch (err) {
      console.error('路线规划出错:', err);
      this._showToast('路线规划出错: ' + err.message);
    }

    this._showLoading(false);
  }

  _planWalking() {
    return new Promise((resolve, reject) => {
      const walking = new AMap.Walking({ policy: AMap.WalkingPolicy.LEAST_TIME });
      walking.search(this.origin, this.destination, (status, result) => {
        if (status === 'complete' && result.routes && result.routes.length) {
          const route = result.routes[0];
          resolve({
            type: 'walking',
            distance: route.distance,
            time: route.time,
            path: this._extractPath(route),
            steps: (route.steps || []).map(s => ({
              instruction: s.instruction || s.action,
              distance: s.distance,
              road: s.road || '',
              path: s.path ? s.path.map(p => [p.getLng(), p.getLat()]) : []
            }))
          });
        } else {
          reject(new Error('步行路线规划失败'));
        }
      });
    });
  }

  _planRiding() {
    return new Promise((resolve, reject) => {
      const riding = new AMap.Riding({ policy: AMap.RidingPolicy.LEAST_TIME });
      riding.search(this.origin, this.destination, (status, result) => {
        if (status === 'complete' && result.routes && result.routes.length) {
          const route = result.routes[0];
          resolve({
            type: 'riding',
            distance: route.distance,
            time: route.time,
            path: this._extractPath(route),
            steps: (route.rides || route.steps || []).map(s => ({
              instruction: s.instruction || s.action,
              distance: s.distance,
              road: s.road || '',
              path: s.path ? s.path.map(p => [p.getLng(), p.getLat()]) : []
            }))
          });
        } else {
          reject(new Error('骑行路线规划失败'));
        }
      });
    });
  }

  _planDriving() {
    return new Promise((resolve, reject) => {
      const driving = new AMap.Driving({
        policy: AMap.DrivingPolicy.LEAST_TIME,
        ferry: 1,
        autoFitView: false
      });
      driving.search(this.origin, this.destination, (status, result) => {
        if (status === 'complete' && result.routes && result.routes.length) {
          const route = result.routes[0];
          // 统计红绿灯（来自 tolls / traffic_lights 或算路额外信息）
          const trafficLights = route.traffic_lights || 0;

          resolve({
            type: 'driving',
            distance: route.distance,
            time: route.time,
            tolls: route.tolls || 0,
            trafficLights,
            path: this._extractPath(route),
            steps: (route.steps || []).map(s => ({
              instruction: s.instruction || s.action,
              distance: s.distance,
              road: s.road || s.street || '',
              tolls: s.tolls || 0,
              trafficLights: s.traffic_lights || 0,
              path: s.path ? s.path.map(p => [p.getLng(), p.getLat()]) : []
            }))
          });
        } else {
          reject(new Error('驾车路线规划失败'));
        }
      });
    });
  }

  _extractPath(route) {
    const paths = [];
    if (route.paths) {
      route.paths.forEach(p => {
        if (p.steps) {
          p.steps.forEach(s => {
            if (s.path) {
              s.path.forEach(point => {
                paths.push([point.getLng(), point.getLat()]);
              });
            }
          });
        }
      });
    }
    // 兜底：如果没有 paths，尝试从 steps 直接取
    if (paths.length === 0 && route.steps) {
      route.steps.forEach(s => {
        if (s.path) {
          s.path.forEach(point => {
            paths.push([point.getLng(), point.getLat()]);
          });
        }
      });
    }
    return paths;
  }

  _clearRoutes() {
    this.polylines.forEach(p => this.map.remove(p));
    this.polylines = [];
    this.activeRoute = null;
    this.activeStepIndex = -1;
  }

  _renderAllRoutes() {
    this.polylines.forEach(p => this.map.remove(p));
    this.polylines = [];

    ['walking', 'riding', 'driving'].forEach(type => {
      const route = this.routes[type];
      if (!route || !route.path.length) return;

      const polyline = new AMap.Polyline({
        path: route.path,
        strokeColor: this.routeColors[type],
        strokeWeight: 6,
        strokeOpacity: 0.85,
        lineJoin: 'round',
        lineCap: 'round',
        showDir: true,
        visible: true,
        zIndex: 50 + ({ walking: 1, riding: 2, driving: 3 }[type]),
        _mrpType: type
      });

      polyline.setMap(this.map);
      polyline._mrpType = type;
      this.polylines.push(polyline);
    });

    this.map.setFitView([...this.markers, ...this.polylines], false, [80, 80, 80, 400]);
  }

  _renderPanel() {
    const body = document.getElementById(`${this.container.id}-body`);
    const routeTypes = ['walking', 'riding', 'driving'];

    body.innerHTML = '';

    routeTypes.forEach(type => {
      const route = this.routes[type];
      if (!route) return;

      const card = document.createElement('div');
      card.className = 'mrp-route-card';
      card.dataset.type = type;

      // 推荐标记：耗时最短
      const allTimes = routeTypes.filter(t => this.routes[t]).map(t => this.routes[t].time);
      const minTime = Math.min(...allTimes);
      const isRecommended = route.time === minTime;
      const cardClass = isRecommended ? 'mrp-route-card recommended' : 'mrp-route-card';

      card.className = cardClass;
      card.style.setProperty('--route-color', this.routeColors[type]);

      const distanceKm = (route.distance / 1000).toFixed(1);
      const timeStr = this._formatTime(route.time);

      card.innerHTML = `
        <div class="mrp-card-left">
          <div class="mrp-card-icon">${this.routeIcons[type]}</div>
          <div class="mrp-card-type">${this.routeLabels[type]}</div>
        </div>
        <div class="mrp-card-center">
          <div class="mrp-card-stats">
            <div class="mrp-stat">
              <span class="mrp-stat-value">${timeStr}</span>
              <span class="mrp-stat-label">预计耗时</span>
            </div>
            <div class="mrp-stat">
              <span class="mrp-stat-value">${distanceKm} km</span>
              <span class="mrp-stat-label">总距离</span>
            </div>
            ${type === 'driving' && route.trafficLights !== undefined ? `
              <div class="mrp-stat">
                <span class="mrp-stat-value">${route.trafficLights}</span>
                <span class="mrp-stat-label">红绿灯</span>
              </div>
            ` : ''}
          </div>
          <div class="mrp-card-bar">
            <div class="mrp-card-bar-fill" style="background:${this.routeColors[type]}"></div>
          </div>
        </div>
        <div class="mrp-card-right">
          ${isRecommended ? '<span class="mrp-badge">推荐</span>' : ''}
          <button class="mrp-detail-btn" data-type="${type}">
            查看详情
            <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
              <path d="M4 2l4 4-4 4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
            </svg>
          </button>
        </div>
      `;

      // 时间占比进度条
      setTimeout(() => {
        const maxDist = Math.max(...routeTypes.filter(t => this.routes[t]).map(t => this.routes[t].distance));
        const ratio = (route.distance / maxDist) * 100;
        const fill = card.querySelector('.mrp-card-bar-fill');
        if (fill) fill.style.width = ratio + '%';
      }, 100);

      // 鼠标进入高亮路线
      card.addEventListener('mouseenter', () => this._highlightRoute(type));
      card.addEventListener('mouseleave', () => this._resetRouteHighlight());

      // 点击卡片查看详情
      card.querySelector('.mrp-detail-btn').addEventListener('click', () => {
        this._openDetail(type);
      });

      body.appendChild(card);
    });
  }

  _highlightRoute(type) {
    this.polylines.forEach(p => {
      if (p._mrpType === type) {
        p.setOptions({
          strokeWeight: 10,
          strokeOpacity: 1,
          zIndex: 100
        });
      } else {
        p.setOptions({
          strokeWeight: 4,
          strokeOpacity: 0.3,
          zIndex: 40
        });
      }
    });
  }

  _resetRouteHighlight() {
    this.polylines.forEach(p => {
      const baseZ = { walking: 51, riding: 52, driving: 53 };
      p.setOptions({
        strokeWeight: 6,
        strokeOpacity: 0.85,
        zIndex: baseZ[p._mrpType] || 50
      });
    });
  }

  _openDetail(type) {
    const route = this.routes[type];
    if (!route) return;

    const overlay = document.getElementById(`${this.container.id}-detail-overlay`);
    const panel = document.getElementById(`${this.container.id}-detail-panel`);
    const title = document.getElementById(`${this.container.id}-detail-title`);
    const summary = document.getElementById(`${this.container.id}-detail-summary`);
    const stepsEl = document.getElementById(`${this.container.id}-detail-steps`);

    // 高亮路线
    this._highlightRoute(type);

    title.innerHTML = `<span style="color:${this.routeColors[type]}">${this.routeIcons[type]}</span> ${this.routeLabels[type]}路线详情`;
    summary.innerHTML = `
      <div class="mrp-summary-item">
        <span class="mrp-summary-label">总距离</span>
        <span class="mrp-summary-value">${(route.distance / 1000).toFixed(1)} km</span>
      </div>
      <div class="mrp-summary-item">
        <span class="mrp-summary-label">预计耗时</span>
        <span class="mrp-summary-value">${this._formatTime(route.time)}</span>
      </div>
      ${type === 'driving' && route.trafficLights !== undefined ? `
        <div class="mrp-summary-item">
          <span class="mrp-summary-label">红绿灯</span>
          <span class="mrp-summary-value">${route.trafficLights} 个</span>
        </div>
      ` : ''}
    `;

    stepsEl.innerHTML = '';

    if (route.steps && route.steps.length) {
      route.steps.forEach((step, index) => {
        const stepEl = document.createElement('div');
        stepEl.className = 'mrp-step-item';

        const dist = step.distance >= 1000
          ? (step.distance / 1000).toFixed(1) + ' km'
          : Math.round(step.distance) + ' m';

        stepEl.innerHTML = `
          <div class="mrp-step-index">${index + 1}</div>
          <div class="mrp-step-content">
            <div class="mrp-step-instruction">${step.instruction || '继续前行'}</div>
            <div class="mrp-step-meta">
              ${step.road ? `<span class="mrp-step-road">${step.road}</span>` : ''}
              <span class="mrp-step-distance">${dist}</span>
              ${type === 'driving' && step.trafficLights ? `
                <span class="mrp-step-lights">🚦 ${step.trafficLights}个红绿灯</span>
              ` : ''}
            </div>
          </div>
        `;

        // 点击步骤在地图上高亮对应路段
        stepEl.addEventListener('click', () => {
          this._highlightStep(type, index);
          document.querySelectorAll('.mrp-step-item').forEach(s => s.classList.remove('active'));
          stepEl.classList.add('active');
        });

        // 悬浮高亮路段
        stepEl.addEventListener('mouseenter', () => this._highlightStep(type, index));
        stepEl.addEventListener('mouseleave', () => this._resetRouteHighlight());

        stepsEl.appendChild(stepEl);
      });
    } else {
      stepsEl.innerHTML = '<div class="mrp-no-steps">暂无详细导航步骤</div>';
    }

    // 打开动画
    overlay.classList.add('active');
    requestAnimationFrame(() => {
      panel.style.transform = 'translateX(0)';
      panel.style.opacity = '1';
    });

    this.activeRoute = type;
  }

  _highlightStep(type, stepIndex) {
    const route = this.routes[type];
    if (!route || !route.steps[stepIndex]) return;

    this.polylines.forEach(p => {
      if (p._mrpType === type) {
        p.setOptions({
          strokeWeight: 10,
          strokeOpacity: 1,
          zIndex: 100
        });
      } else {
        p.setOptions({
          strokeWeight: 3,
          strokeOpacity: 0.15,
          zIndex: 30
        });
      }
    });

    // 如果该步骤有路径，绘制高亮覆盖
    this._clearStepHighlight();

    const step = route.steps[stepIndex];
    if (step.path && step.path.length) {
      this._stepHighlightLine = new AMap.Polyline({
        path: step.path,
        strokeColor: '#fff',
        strokeWeight: 14,
        strokeOpacity: 0.5,
        lineJoin: 'round',
        lineCap: 'round',
        zIndex: 90
      });
      this._stepHighlightLine.setMap(this.map);
    }
  }

  _clearStepHighlight() {
    if (this._stepHighlightLine) {
      this.map.remove(this._stepHighlightLine);
      this._stepHighlightLine = null;
    }
  }

  _closeDetail() {
    const overlay = document.getElementById(`${this.container.id}-detail-overlay`);
    const panel = document.getElementById(`${this.container.id}-detail-panel`);
    this._clearStepHighlight();

    panel.style.transform = 'translateX(100%)';
    panel.style.opacity = '0';
    setTimeout(() => {
      overlay.classList.remove('active');
    }, 300);

    this._resetRouteHighlight();
    this.activeRoute = null;
    this.activeStepIndex = -1;
  }

  _filterRoutes(type) {
    const cards = document.querySelectorAll('.mrp-route-card');
    cards.forEach(card => {
      if (type === 'all' || card.dataset.type === type) {
        card.style.display = '';
        card.style.animation = 'mrpFadeIn 0.3s ease-out';
      } else {
        card.style.display = 'none';
      }
    });

    // 更新地图路线可见性
    this.polylines.forEach(p => {
      if (type === 'all' || p._mrpType === type) {
        p.show();
      } else {
        p.hide();
      }
    });
  }

  _formatTime(seconds) {
    if (!seconds || seconds <= 0) return '--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    if (h > 0) return `${h}小时${m > 0 ? m + '分' : ''}`;
    return `${m}分钟`;
  }

  _showLoading(show) {
    const planBtn = document.getElementById(`${this.container.id}-plan`);
    if (show) {
      planBtn.classList.add('loading');
      planBtn.disabled = true;
    } else {
      planBtn.classList.remove('loading');
      planBtn.disabled = false;
    }
  }

  _showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'mrp-toast';
    toast.textContent = msg;
    this.container.appendChild(toast);

    requestAnimationFrame(() => toast.classList.add('active'));
    setTimeout(() => {
      toast.classList.remove('active');
      setTimeout(() => toast.remove(), 300);
    }, 2500);
  }

  // ---- 公共 API ----

  /** 设置地图中心 */
  setCenter(center) {
    this.mapCenter = center;
    if (this.map) this.map.setCenter(center);
  }

  /** 设置城市 */
  setCity(city) {
    this.city = city;
  }

  /** 销毁实例 */
  destroy() {
    this._clearRoutes();
    this.markers.forEach(m => this.map && this.map.remove(m));
    this.map && this.map.destroy();
    this.container.innerHTML = '';
  }
}

// 导出到全局
window.MultiRoutePlanner = MultiRoutePlanner;
