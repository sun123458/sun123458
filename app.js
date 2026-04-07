/**
 * App 主控制器
 * 绑定 UI 交互、驱动 RouteEngine 渲染
 */

(function () {
  'use strict';

  /* ====== DOM 引用 ====== */
  const originInput  = document.getElementById('originInput');
  const destInput    = document.getElementById('destInput');
  const clearOrigin  = document.getElementById('clearOrigin');
  const clearDest    = document.getElementById('clearDest');
  const swapBtn      = document.getElementById('swapBtn');
  const searchBtn    = document.getElementById('searchBtn');
  const routeCards   = document.getElementById('routeCards');
  const detailPanel  = document.getElementById('detailPanel');
  const detailTitle  = document.getElementById('detailTitle');
  const detailSteps  = document.getElementById('detailSteps');
  const backBtn      = document.getElementById('backBtn');
  const mapLegend    = document.getElementById('mapLegend');

  /* ====== 状态 ====== */
  let routeEngine = null;
  let currentData = null;
  let activeMode  = null;

  /* ====== 初始化 ====== */
  function init() {
    routeEngine = new RouteEngine('map');

    // 绑定事件
    searchBtn.addEventListener('click', handleSearch);
    swapBtn.addEventListener('click', handleSwap);
    clearOrigin.addEventListener('click', () => { originInput.value = ''; originInput.focus(); });
    clearDest.addEventListener('click', () => { destInput.value = ''; destInput.focus(); });
    backBtn.addEventListener('click', hideDetail);

    // 回车搜索
    originInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch(); });
    destInput.addEventListener('keydown', e => { if (e.key === 'Enter') handleSearch(); });

    // 图例交互
    mapLegend.querySelectorAll('.legend-item').forEach(item => {
      item.addEventListener('click', () => {
        const mode = item.dataset.mode;
        selectMode(mode);
      });
    });

    // 自动触发首次搜索
    handleSearch();
  }

  /* ====== 搜索 ====== */
  function handleSearch() {
    const origin = originInput.value.trim();
    const dest = destInput.value.trim();

    if (!origin || !dest) {
      routeCards.innerHTML = `
        <div class="empty-state">
          <div class="empty-icon">📍</div>
          <div class="empty-text">请输入起点和终点<br>开始路线规划</div>
        </div>`;
      routeEngine.clearAll();
      return;
    }

    // 加载状态
    searchBtn.classList.add('loading');
    searchBtn.textContent = '规划中...';
    routeCards.innerHTML = '';

    // 模拟网络延迟
    setTimeout(() => {
      currentData = generateAllRoutes(origin, dest);
      routeEngine.renderRoutes(currentData);
      renderCards(currentData.routes);

      // 默认选中最快路线
      const fastest = currentData.routes.find(r => r.isFastest);
      if (fastest) selectMode(fastest.mode);

      searchBtn.classList.remove('loading');
      searchBtn.textContent = '规划路线';
    }, 600);
  }

  /* ====== 交换起终点 ====== */
  function handleSwap() {
    const tmp = originInput.value;
    originInput.value = destInput.value;
    destInput.value = tmp;
    if (originInput.value) handleSearch();
  }

  /* ====== 渲染路线卡片 ====== */
  function renderCards(routes) {
    const maxDuration = Math.max(...routes.map(r => r.duration));

    routeCards.innerHTML = routes.map(route => {
      const modeIcon  = { walking: '🚶', cycling: '🚴', driving: '🚗' }[route.mode];
      const modeLabel = { walking: '步行', cycling: '骑行', driving: '驾车' }[route.mode];
      const progressPercent = (route.duration / maxDuration * 100).toFixed(0);

      let tags = '';
      if (route.isFastest) tags += '<span class="route-tag tag-fastest">最快</span>';
      if (route.isShortest) tags += '<span class="route-tag tag-shortest">最短</span>';

      return `
        <div class="route-card" data-mode="${route.mode}" tabindex="0">
          <div class="route-card-header">
            <div class="route-mode">
              <span class="mode-icon icon-${route.mode}">${modeIcon}</span>
              <span>${modeLabel}</span>
            </div>
            <div>${tags}</div>
          </div>
          <div class="route-stats">
            <div class="stat-item">
              <span>⏱</span>
              <span class="stat-value">${formatDuration(route.duration)}</span>
            </div>
            <div class="stat-item">
              <span>📏</span>
              <span class="stat-value">${route.distance} km</span>
            </div>
            <div class="stat-item">
              <span>🚦</span>
              <span class="stat-value">${route.trafficLights} 个</span>
            </div>
          </div>
          <div class="route-progress">
            <div class="route-progress-bar progress-${route.mode}" style="width:0%"></div>
          </div>
        </div>
      `;
    }).join('');

    // 进度条入场动画
    requestAnimationFrame(() => {
      routeCards.querySelectorAll('.route-progress-bar').forEach((bar, i) => {
        const percent = (routes[i].duration / maxDuration * 100).toFixed(0);
        setTimeout(() => { bar.style.width = percent + '%'; }, 100 + i * 100);
      });
    });

    // 卡片点击事件
    routeCards.querySelectorAll('.route-card').forEach(card => {
      card.addEventListener('click', () => {
        const mode = card.dataset.mode;
        selectMode(mode);
        showDetail(mode);
      });

      // 键盘访问
      card.addEventListener('keydown', e => {
        if (e.key === 'Enter') card.click();
      });
    });
  }

  /* ====== 选中路线模式 ====== */
  function selectMode(mode) {
    activeMode = mode;
    routeEngine.highlightRoute(mode);

    // 更新卡片激活状态
    routeCards.querySelectorAll('.route-card').forEach(card => {
      card.classList.remove('active-walking', 'active-cycling', 'active-driving');
      if (card.dataset.mode === mode) {
        card.classList.add(`active-${mode}`);
      }
    });
  }

  /* ====== 显示详细指引 ====== */
  function showDetail(mode) {
    if (!currentData) return;

    const route = currentData.routes.find(r => r.mode === mode);
    if (!route) return;

    const modeColor = { walking: '#10b981', cycling: '#3b82f6', driving: '#f59e0b' }[mode];
    const modeLabel = { walking: '步行', cycling: '骑行', driving: '驾车' }[mode];

    detailTitle.innerHTML = `<span style="color:${modeColor}">${modeLabel}路线</span> 详细指引`;

    detailSteps.innerHTML = route.steps.map((step, i) => {
      const isFirst = i === 0;
      const isLast = i === route.steps.length - 1;
      const dotClass = isFirst ? 'dot-start' : isLast ? 'dot-end' : '';

      return `
        <div class="step-item" data-step="${i}">
          <div class="step-connector">
            <span class="step-dot ${dotClass}"></span>
            ${!isLast ? '<span class="step-line"></span>' : ''}
          </div>
          <div class="step-content">
            <div class="step-instruction">${step.instruction}</div>
            <div class="step-meta">
              <span>${step.distance} km</span>
              <span>${step.duration} 分钟</span>
            </div>
          </div>
        </div>
      `;
    }).join('');

    detailPanel.classList.add('visible');

    // 步骤点击高亮对应路段
    detailSteps.querySelectorAll('.step-item').forEach(item => {
      item.addEventListener('click', () => {
        const idx = parseInt(item.dataset.step);
        const segment = route.steps[idx];
        if (segment && segment.pathSegment) {
          routeEngine.highlightSegment(segment.pathSegment, modeColor);
        }
      });
    });
  }

  /* ====== 隐藏详细指引 ====== */
  function hideDetail() {
    detailPanel.classList.remove('visible');
  }

  /* ====== 工具函数 ====== */
  function formatDuration(mins) {
    if (mins < 60) return `${mins} 分钟`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  }

  /* ====== 启动 ====== */
  document.addEventListener('DOMContentLoaded', init);
})();
