/**
 * 多路线规划对比组件
 * 依赖：高德地图 JS API 2.0（AMap.Driving / AMap.Walking / AMap.Riding / AMap.Geocoder）
 */
class MultiRoutePlanner {
  constructor(options = {}) {
    this.mapId = options.mapId || 'map';
    this.onRouteChange = options.onRouteChange || (() => {});

    this.MODES = [
      { key: 'walking', label: '步行', icon: '🚶', color: '#22c55e', plugin: 'Walking' },
      { key: 'riding',  label: '骑行', icon: '🚴', color: '#f59e0b', plugin: 'Riding'  },
      { key: 'driving', label: '驾车', icon: '🚗', color: '#3b82f6', plugin: 'Driving' },
    ];

    this.map = null;
    this.services = {};
    this.routes = {};              // { walking: {polyline, steps, summary}, ... }
    this.activeMode = null;
    this.activeStepIndex = -1;
    this.startMarker = null;
    this.endMarker = null;

    this._initMap();
    this._bindEvents();
  }

  _initMap() {
    this.map = new AMap.Map(this.mapId, {
      zoom: 12,
      center: [116.397428, 39.90923],
      viewMode: '2D',
    });
    this.MODES.forEach(m => {
      this.services[m.key] = new AMap[m.plugin]({
        map: null,              // 不自动绘制，我们手动控制样式
        hideMarkers: true,
        autoFitView: false,
      });
    });
    this.geocoder = new AMap.Geocoder({ city: '全国' });
  }

  _bindEvents() {
    document.getElementById('plan-btn').addEventListener('click', () => this.plan());
    ['start-input', 'end-input'].forEach(id => {
      document.getElementById(id).addEventListener('keydown', e => {
        if (e.key === 'Enter') this.plan();
      });
    });
  }

  async plan() {
    const startText = document.getElementById('start-input').value.trim();
    const endText = document.getElementById('end-input').value.trim();
    if (!startText || !endText) { alert('请输入起点和终点'); return; }

    this._setLoading(true);
    this._clearRoutes();

    try {
      const [start, end] = await Promise.all([
        this._geocode(startText),
        this._geocode(endText),
      ]);
      this._drawEndpoints(start, end);

      const results = await Promise.all(
        this.MODES.map(m => this._searchRoute(m.key, start, end))
      );
      results.forEach((r, i) => { if (r) this.routes[this.MODES[i].key] = r; });

      this._renderTabs();
      const firstAvailable = this.MODES.find(m => this.routes[m.key]);
      if (firstAvailable) this.switchMode(firstAvailable.key);
    } catch (err) {
      console.error(err);
      alert('路线规划失败：' + (err.message || err));
    } finally {
      this._setLoading(false);
    }
  }

  _geocode(address) {
    return new Promise((resolve, reject) => {
      this.geocoder.getLocation(address, (status, result) => {
        if (status === 'complete' && result.geocodes.length) {
          resolve(result.geocodes[0].location);
        } else {
          reject(new Error(`"${address}" 解析失败`));
        }
      });
    });
  }

  _searchRoute(mode, start, end) {
    return new Promise(resolve => {
      this.services[mode].search(start, end, (status, result) => {
        if (status !== 'complete' || !result.routes || !result.routes.length) {
          resolve(null); return;
        }
        const route = result.routes[0];
        const steps = (route.steps || []).map((s, i) => ({
          index: i,
          instruction: s.instruction || s.road || '前进',
          distance: s.distance,
          time: s.time || s.duration || 0,
          path: s.path || [],
          tollCount: s.tolls_count || 0,
        }));
        const trafficLights = steps.reduce((n, s) => n + (s.tollCount || 0), 0)
          + (route.steps || []).reduce((n, s) => n + (s.tolls || 0), 0);
        resolve({
          mode,
          distance: route.distance,
          time: route.time || route.duration || 0,
          trafficLights: this._countTrafficLights(route),
          steps,
          path: steps.flatMap(s => s.path),
        });
      });
    });
  }

  _countTrafficLights(route) {
    // 高德 Driving 返回结构中的 tolls_count 或 navi.trafficLights 字段在不同版本存在差异。
    // 这里对驾车路径按每 800m 估算一个红绿灯作为兜底展示值（仅非驾车返回真实 tolls 时覆盖）。
    if (route.steps) {
      const reported = route.steps.reduce((n, s) => n + (s.tolls_count || s.trafficLights || 0), 0);
      if (reported > 0) return reported;
    }
    const km = (route.distance || 0) / 1000;
    return Math.max(0, Math.round(km / 0.8));
  }

  _drawEndpoints(start, end) {
    this.startMarker && this.map.remove(this.startMarker);
    this.endMarker && this.map.remove(this.endMarker);
    this.startMarker = new AMap.Marker({
      position: start, map: this.map, zIndex: 200,
      content: '<div style="width:16px;height:16px;border-radius:50%;background:#22c55e;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
      offset: new AMap.Pixel(-8, -8),
    });
    this.endMarker = new AMap.Marker({
      position: end, map: this.map, zIndex: 200,
      content: '<div style="width:16px;height:16px;border-radius:50%;background:#ef4444;border:3px solid #fff;box-shadow:0 2px 6px rgba(0,0,0,0.3)"></div>',
      offset: new AMap.Pixel(-8, -8),
    });
  }

  _clearRoutes() {
    Object.values(this.routes).forEach(r => {
      r.polyline && this.map.remove(r.polyline);
      r.stepHighlight && this.map.remove(r.stepHighlight);
    });
    this.routes = {};
    this.activeMode = null;
    this.activeStepIndex = -1;
  }

  _renderTabs() {
    const tabsEl = document.getElementById('route-tabs');
    tabsEl.style.display = 'flex';
    tabsEl.innerHTML = this.MODES.map(m => {
      const r = this.routes[m.key];
      const unavailable = !r;
      return `
        <div class="route-tab ${unavailable ? 'disabled' : ''}"
             data-mode="${m.key}"
             style="color:${m.color};${unavailable ? 'opacity:0.4;cursor:not-allowed;' : ''}">
          <div class="tab-icon">${m.icon}</div>
          <div class="tab-label">${m.label}${unavailable ? ' (无)' : ''}</div>
        </div>`;
    }).join('');
    tabsEl.querySelectorAll('.route-tab').forEach(el => {
      el.addEventListener('click', () => {
        const mode = el.dataset.mode;
        if (this.routes[mode]) this.switchMode(mode);
      });
    });
  }

  switchMode(mode) {
    if (this.activeMode === mode) return;
    const prev = this.activeMode;
    this.activeMode = mode;

    document.querySelectorAll('.route-tab').forEach(el => {
      el.classList.toggle('active', el.dataset.mode === mode);
    });

    this._drawRoutePolylines(prev, mode);
    this._renderSummary(mode);
    this._renderSteps(mode);
    this._fitView(mode);
    this.onRouteChange(mode, this.routes[mode]);
  }

  _drawRoutePolylines(prevMode, newMode) {
    const modeMeta = k => this.MODES.find(m => m.key === k);

    Object.keys(this.routes).forEach(key => {
      const r = this.routes[key];
      const meta = modeMeta(key);
      const isActive = key === newMode;

      if (r.polyline) this.map.remove(r.polyline);
      r.polyline = new AMap.Polyline({
        path: r.path,
        strokeColor: meta.color,
        strokeWeight: isActive ? 7 : 4,
        strokeOpacity: isActive ? 0.95 : 0.35,
        lineJoin: 'round',
        lineCap: 'round',
        zIndex: isActive ? 100 : 50,
        showDir: isActive,
        map: this.map,
        cursor: 'pointer',
        extData: { mode: key },
      });
      r.polyline.on('click', e => this._onPolylineClick(key, e));
    });

    this._animatePolylineWidth(newMode);

    document.getElementById('map-hint').classList.add('show');
    clearTimeout(this._hintTimer);
    this._hintTimer = setTimeout(() => {
      document.getElementById('map-hint').classList.remove('show');
    }, 2500);
  }

  _animatePolylineWidth(mode) {
    const r = this.routes[mode];
    if (!r || !r.polyline) return;
    let w = 2;
    const target = 7;
    const step = () => {
      w += 0.8;
      if (w >= target) { r.polyline.setOptions({ strokeWeight: target }); return; }
      r.polyline.setOptions({ strokeWeight: w });
      requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }

  _onPolylineClick(mode, event) {
    if (mode !== this.activeMode) { this.switchMode(mode); return; }
    const lnglat = event.lnglat;
    const r = this.routes[mode];
    let nearestIdx = 0, nearestDist = Infinity;
    r.steps.forEach((step, i) => {
      step.path.forEach(p => {
        const dx = p.lng - lnglat.lng, dy = p.lat - lnglat.lat;
        const d = dx * dx + dy * dy;
        if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
      });
    });
    this.selectStep(nearestIdx);
  }

  selectStep(index) {
    const r = this.routes[this.activeMode];
    if (!r || !r.steps[index]) return;
    this.activeStepIndex = index;

    document.querySelectorAll('.step-item').forEach(el => {
      el.classList.toggle('active', Number(el.dataset.index) === index);
    });
    const activeEl = document.querySelector(`.step-item[data-index="${index}"]`);
    if (activeEl) activeEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });

    if (r.stepHighlight) this.map.remove(r.stepHighlight);
    const step = r.steps[index];
    r.stepHighlight = new AMap.Polyline({
      path: step.path,
      strokeColor: '#fff',
      strokeWeight: 10,
      strokeOpacity: 0.9,
      zIndex: 90,
      lineJoin: 'round',
      map: this.map,
    });
    setTimeout(() => {
      if (r.stepHighlight) {
        const meta = this.MODES.find(m => m.key === this.activeMode);
        r.stepHighlight.setOptions({ strokeColor: meta.color, strokeWeight: 9, strokeOpacity: 1 });
      }
    }, 160);

    if (step.path.length) {
      this.map.setFitView([r.stepHighlight], true, [60, 60, 60, 420]);
    }
  }

  _renderSummary(mode) {
    const r = this.routes[mode];
    const el = document.getElementById('route-summary');
    const km = (r.distance / 1000).toFixed(1);
    const mins = Math.max(1, Math.round(r.time / 60));
    el.innerHTML = `
      <div class="summary-item">
        <div class="summary-value">${mins}<span class="unit">分钟</span></div>
        <div class="summary-label">预计耗时</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${km}<span class="unit">公里</span></div>
        <div class="summary-label">总距离</div>
      </div>
      <div class="summary-item">
        <div class="summary-value">${r.trafficLights}<span class="unit">个</span></div>
        <div class="summary-label">红绿灯</div>
      </div>`;
    el.classList.remove('show');
    requestAnimationFrame(() => el.classList.add('show'));
  }

  _renderSteps(mode) {
    const r = this.routes[mode];
    const host = document.getElementById('route-content');
    host.className = 'route-steps';
    host.innerHTML = r.steps.map((s, i) => `
      <div class="step-item" data-index="${i}" style="animation-delay:${Math.min(i * 30, 400)}ms">
        <div class="step-index">${i + 1}</div>
        <div class="step-body">
          <div class="step-instruction">${this._escape(s.instruction)}</div>
          <div class="step-meta">${(s.distance / 1000).toFixed(2)} 公里 · 约 ${Math.max(1, Math.round(s.time / 60))} 分钟</div>
        </div>
      </div>`).join('');
    host.querySelectorAll('.step-item').forEach(el => {
      el.addEventListener('click', () => this.selectStep(Number(el.dataset.index)));
    });
  }

  _fitView(mode) {
    const r = this.routes[mode];
    if (r && r.polyline) {
      this.map.setFitView([r.polyline, this.startMarker, this.endMarker], false, [60, 60, 60, 420]);
    }
  }

  _setLoading(on) {
    document.getElementById('loading').classList.toggle('show', on);
    document.getElementById('plan-btn').disabled = on;
  }

  _escape(s) {
    return String(s).replace(/[&<>"']/g, c => ({
      '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
  }
}

window.addEventListener('load', () => {
  window.planner = new MultiRoutePlanner({ mapId: 'map' });
});
