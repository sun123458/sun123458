/**
 * RouteEngine —— 地图路线渲染 & 动画引擎
 * 封装 Leaflet 地图操作、路线绘制、切换过渡动画
 */

class RouteEngine {
  constructor(mapContainerId) {
    this.map = null;
    this.routeLayers = {};        // { walking: <L.layerGroup>, ... }
    this.markers = null;          // 起终点标记
    this.activeMode = null;       // 当前选中的出行方式
    this.routeData = null;        // 当前路线数据
    this.animationFrame = null;   // 路线绘制动画帧

    this._initMap(mapContainerId);
  }

  /* ====== 地图初始化 ====== */
  _initMap(id) {
    this.map = L.map(id, {
      zoomControl: false,
      attributionControl: false,
    }).setView([39.92, 116.39], 12);

    // 使用 OpenStreetMap 瓦片
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 18,
    }).addTo(this.map);

    // 缩放控件放右下
    L.control.zoom({ position: 'bottomleft' }).addTo(this.map);
  }

  /* ====== 清除所有路线 ====== */
  clearAll() {
    Object.values(this.routeLayers).forEach(layer => {
      if (layer) this.map.removeLayer(layer);
    });
    this.routeLayers = {};
    if (this.markers) {
      this.map.removeLayer(this.markers);
      this.markers = null;
    }
    if (this.animationFrame) {
      cancelAnimationFrame(this.animationFrame);
      this.animationFrame = null;
    }
    this.activeMode = null;
    this.routeData = null;
  }

  /* ====== 渲染全部路线 ====== */
  renderRoutes(data) {
    this.clearAll();
    this.routeData = data;

    // 起终点标记
    this.markers = L.layerGroup().addTo(this.map);

    const originMarker = L.marker(data.origin.coord, {
      icon: this._createIcon('#10b981', 'A'),
    }).addTo(this.markers);
    originMarker.bindPopup(`<b>起点：</b>${data.origin.name}`);

    const destMarker = L.marker(data.destination.coord, {
      icon: this._createIcon('#ef4444', 'B'),
    }).addTo(this.markers);
    destMarker.bindPopup(`<b>终点：</b>${data.destination.name}`);

    // 逐条绘制路线（带动画延迟）
    const modeColors = {
      walking: '#10b981',
      cycling: '#3b82f6',
      driving: '#f59e0b',
    };

    data.routes.forEach((route, index) => {
      setTimeout(() => {
        this._drawRoute(route, modeColors[route.mode]);
      }, index * 150);
    });

    // 自适应视野
    const allPoints = data.routes.flatMap(r => r.path);
    const bounds = L.latLngBounds(allPoints.map(p => [p[0], p[1]]));
    this.map.fitBounds(bounds, { padding: [60, 60], maxZoom: 14 });

    // 默认选中第一条
    this.activeMode = null;
  }

  /* ====== 绘制单条路线（带动画） ====== */
  _drawRoute(route, color) {
    // 清除该模式旧图层
    if (this.routeLayers[route.mode]) {
      this.map.removeLayer(this.routeLayers[route.mode]);
    }

    const group = L.layerGroup().addTo(this.map);
    this.routeLayers[route.mode] = group;

    // 底层阴影线
    L.polyline(route.path, {
      color: color,
      weight: 10,
      opacity: 0.15,
      smoothFactor: 1.5,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(group);

    // 主路线
    const mainLine = L.polyline(route.path, {
      color: color,
      weight: 5,
      opacity: 0.85,
      smoothFactor: 1.5,
      lineCap: 'round',
      lineJoin: 'round',
    }).addTo(group);

    // 点击路线弹出信息
    mainLine.on('click', (e) => {
      L.popup()
        .setLatLng(e.latlng)
        .setContent(`
          <div class="route-popup">
            <h4 style="color:${color}">${this._modeLabel(route.mode)}</h4>
            <p>距离：${route.distance} km</p>
            <p>耗时：${this._formatDuration(route.duration)}</p>
          </div>
        `)
        .openOn(this.map);
    });

    // 路线绘制动画：从起点到终点逐段展现
    this._animateLine(mainLine, route.path);
  }

  /* ====== 路线绘制动画 ====== */
  _animateLine(polyline, points) {
    let drawn = [];
    let i = 0;
    const step = Math.max(1, Math.floor(points.length / 40)); // 分 40 帧画完

    polyline.setLatLngs([]);

    const animate = () => {
      const end = Math.min(i + step, points.length);
      for (let j = i; j < end; j++) {
        drawn.push(points[j]);
      }
      polyline.setLatLngs(drawn);
      i = end;

      if (i < points.length) {
        this.animationFrame = requestAnimationFrame(animate);
      }
    };

    this.animationFrame = requestAnimationFrame(animate);
  }

  /* ====== 切换路线高亮（带平滑过渡） ====== */
  highlightRoute(mode) {
    if (this.activeMode === mode) return;
    this.activeMode = mode;

    const modeColors = {
      walking: '#10b981',
      cycling: '#3b82f6',
      driving: '#f59e0b',
    };

    // 遍历所有路线图层，调整样式
    Object.entries(this.routeLayers).forEach(([m, group]) => {
      group.eachLayer(layer => {
        if (layer instanceof L.Polyline) {
          const isActive = m === mode;
          const isShadow = layer.options.weight >= 8;

          if (isShadow) {
            layer.setStyle({
              opacity: isActive ? 0.25 : 0.08,
              weight: isActive ? 14 : 10,
            });
          } else {
            layer.setStyle({
              weight: isActive ? 7 : 4,
              opacity: isActive ? 1 : 0.4,
            });
          }

          // 动态调整 Z-index：选中路线置顶
          if (layer.getElement) {
            const el = layer.getElement();
            if (el) {
              el.style.transition = 'all 0.4s cubic-bezier(0.4, 0, 0.2, 1)';
            }
          }
        }
      });

      // 选中路线提到最上层
      if (m === mode && this.routeLayers[m]) {
        this.routeLayers[m].bringToFront();
      }
    });

    // 更新图例状态
    document.querySelectorAll('.legend-item').forEach(item => {
      item.classList.toggle('dimmed', item.dataset.mode !== mode);
    });
  }

  /* ====== 高亮路线段（点击步骤指引时） ====== */
  highlightSegment(pathSegment, color) {
    // 清除之前的段高亮
    if (this._segmentHighlight) {
      this.map.removeLayer(this._segmentHighlight);
    }

    this._segmentHighlight = L.polyline(pathSegment, {
      color: color,
      weight: 9,
      opacity: 0.6,
      dashArray: '8 6',
      lineCap: 'round',
    }).addTo(this.map);

    // 3 秒后自动移除
    setTimeout(() => {
      if (this._segmentHighlight) {
        this.map.removeLayer(this._segmentHighlight);
        this._segmentHighlight = null;
      }
    }, 3000);
  }

  /* ====== 工具方法 ====== */
  _createIcon(color, label) {
    return L.divIcon({
      className: '',
      html: `<div style="
        background:${color};
        color:#fff;
        width:28px;height:28px;
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        font-weight:700;font-size:14px;
        box-shadow:0 2px 8px ${color}88;
        border:2px solid #fff;
      ">${label}</div>`,
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });
  }

  _modeLabel(mode) {
    return { walking: '步行', cycling: '骑行', driving: '驾车' }[mode];
  }

  _formatDuration(mins) {
    if (mins < 60) return `${mins} 分钟`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h} 小时 ${m} 分钟` : `${h} 小时`;
  }

  /* ====== 销毁 ====== */
  destroy() {
    this.clearAll();
    this.map.remove();
  }
}
