// ========== 模拟停车场数据 ==========
const CENTER = [31.2304, 121.4737]; // 默认中心(上海人民广场)

const parkingLotData = [
  { id: 1,  name: '人民广场地下停车库',     address: '黄浦区西藏中路290号',         lat: 31.2314,  lng: 121.4747, distance: 120,  price: 10,  totalSpaces: 500, availableSpaces: 186, type: '地下', hourly: '首小时¥10, 之后¥6/h', daily: '¥60/天', features: ['充电桩', '无障碍', '监控', '24小时'], rating: 4.5 },
  { id: 2,  name: '来福士广场停车场',         address: '黄浦区西藏中路268号',         lat: 31.2328,  lng: 121.4755, distance: 280,  price: 15,  totalSpaces: 800, availableSpaces: 312, type: '地下', hourly: '¥15/h', daily: '¥90/天', features: ['充电桩', '洗车', '24小时'], rating: 4.7 },
  { id: 3,  name: '南京东路步行街停车场',     address: '黄浦区南京东路300号',         lat: 31.2352,  lng: 121.4782, distance: 560,  price: 12,  totalSpaces: 300, availableSpaces: 8,   type: '地下', hourly: '¥12/h', daily: '¥80/天', features: ['监控', '24小时'], rating: 4.2 },
  { id: 4,  name: '淮海路立体停车场',         address: '黄浦区淮海中路300号',         lat: 31.2268,  lng: 121.4695, distance: 780,  price: 8,   totalSpaces: 200, availableSpaces: 95,  type: '立体', hourly: '¥8/h', daily: '¥50/天', features: ['监控', '24小时'], rating: 4.0 },
  { id: 5,  name: '外滩停车场',               address: '黄浦区中山东一路18号',        lat: 31.2400,  lng: 121.4900, distance: 1200, price: 18,  totalSpaces: 400, availableSpaces: 0,   type: '地面', hourly: '¥18/h', daily: '¥120/天', features: ['充电桩', '无障碍'], rating: 4.3 },
  { id: 6,  name: '静安寺地下停车场',         address: '静安区南京西路1618号',        lat: 31.2240,  lng: 121.4462, distance: 2100, price: 14,  totalSpaces: 350, availableSpaces: 42,  type: '地下', hourly: '¥14/h', daily: '¥80/天', features: ['充电桩', '无障碍', '监控'], rating: 4.6 },
  { id: 7,  name: '陆家嘴中心停车场',         address: '浦东新区世纪大道100号',       lat: 31.2360,  lng: 121.5050, distance: 3200, price: 16,  totalSpaces: 600, availableSpaces: 210, type: '地下', hourly: '¥16/h', daily: '¥100/天', features: ['充电桩', '无障碍', '洗车', '24小时'], rating: 4.8 },
  { id: 8,  name: '虹桥天地停车场',           address: '闵行区申长路688号',           lat: 31.1952,  lng: 121.3218, distance: 12000, price: 10,  totalSpaces: 1000, availableSpaces: 580, type: '地面', hourly: '¥10/h', daily: '¥60/天', features: ['充电桩', '无障碍', '监控', '洗车', '24小时'], rating: 4.4 },
  { id: 9,  name: '徐家汇港汇广场停车场',     address: '徐汇区虹桥路1号',             lat: 31.1926,  lng: 121.4368, distance: 5000, price: 12,  totalSpaces: 450, availableSpaces: 160, type: '地下', hourly: '¥12/h', daily: '¥70/天', features: ['充电桩', '监控', '24小时'], rating: 4.5 },
  { id: 10, name: '新天地停车场',             address: '黄浦区太仓路181号',           lat: 31.2196,  lng: 121.4746, distance: 1400, price: 20,  totalSpaces: 250, availableSpaces: 15,  type: '地下', hourly: '¥20/h', daily: '¥120/天', features: ['无障碍', '监控'], rating: 4.1 },
  { id: 11, name: '世纪公园停车场',           address: '浦东新区锦绣路1001号',        lat: 31.2110,  lng: 121.5440, distance: 6500, price: 6,   totalSpaces: 300, availableSpaces: 200, type: '地面', hourly: '¥6/h', daily: '¥30/天', features: ['监控', '充电桩'], rating: 4.3 },
  { id: 12, name: '中山公园龙之梦停车场',     address: '长宁区长宁路1018号',          lat: 31.2186,  lng: 121.4158, distance: 4200, price: 10,  totalSpaces: 700, availableSpaces: 330, type: '立体', hourly: '¥10/h', daily: '¥60/天', features: ['充电桩', '监控', '24小时', '洗车'], rating: 4.6 },
];

// ========== 状态管理 ==========
const state = {
  sort: 'distance',       // distance | price | spaces
  searchKeyword: '',
  priceMin: 0,
  priceMax: 20,
  distanceRange: null,    // null=全部 | 500 | 1000 | 2000 | 5000
  parkingType: null,      // null=全部 | '地面' | '地下' | '立体'
  selectedLot: null,
  sheetExpanded: false,
  transportMode: 'driving',
  markers: {},
};

// ========== 初始化地图 ==========
const map = L.map('map', {
  center: CENTER,
  zoom: 14,
  zoomControl: false,
  attributionControl: false,
});
L.control.zoom({ position: 'bottomleft' }).addTo(map);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
  maxZoom: 18,
}).addTo(map);

// 当前位置标记
const userIcon = L.divIcon({
  className: '',
  html: `<div style="width:16px;height:16px;background:#1677ff;border:3px solid #fff;border-radius:50%;box-shadow:0 0 0 2px rgba(22,119,255,0.3), 0 2px 6px rgba(0,0,0,.3);"></div>`,
  iconSize: [16, 16],
  iconAnchor: [8, 8],
});
L.marker(CENTER, { icon: userIcon, zIndexOffset: 1000 }).addTo(map).bindTooltip('我的位置', { direction: 'top', offset: [0, -10] });

// ========== Marker 创建 ==========
function createMarkerIcon(lot) {
  const spaces = lot.availableSpaces;
  const status = spaces === 0 ? 'no-spaces' : spaces <= 20 ? 'few-spaces' : 'has-spaces';
  return L.divIcon({
    className: '',
    html: `
      <div class="parking-marker">
        <div class="marker-pin ${status}">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="4" y="4" width="16" height="16" rx="2"/><path d="M9 4v16M15 4v16M4 9h16M4 15h16"/></svg>
        </div>
        <div class="marker-label">${spaces}</div>
      </div>`,
    iconSize: [40, 52],
    iconAnchor: [20, 48],
    popupAnchor: [0, -50],
  });
}

function getBadge(spaces) {
  if (spaces === 0) return '<span class="badge badge-full">已满</span>';
  if (spaces <= 20) return '<span class="badge badge-busy">紧张</span>';
  return '<span class="badge badge-open">充裕</span>';
}

function getPopupHTML(lot) {
  const disabled = lot.availableSpaces === 0;
  return `
    <div class="popup-card">
      <div class="name">${lot.name} ${getBadge(lot.availableSpaces)}</div>
      <div class="info-row"><span>距离</span><span class="value">${lot.distance}m</span></div>
      <div class="info-row"><span>空位</span><span class="value">${lot.availableSpaces} / ${lot.totalSpaces}</span></div>
      <div class="info-row"><span>费用</span><span class="value">¥${lot.price}/h</span></div>
      <div class="popup-actions">
        <button class="popup-btn popup-btn-primary" onclick="navigateTo(${lot.id})">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
          导航
        </button>
        <button class="popup-btn ${disabled ? 'popup-btn-disabled' : 'popup-btn-outline'}" onclick="${disabled ? '' : `reserveLot(${lot.id})`}" ${disabled ? 'disabled' : ''}>
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          预约
        </button>
      </div>
    </div>`;
}

function renderMarkers(lots) {
  // 清除旧 marker
  Object.values(state.markers).forEach(m => map.removeLayer(m));
  state.markers = {};

  lots.forEach(lot => {
    const marker = L.marker([lot.lat, lot.lng], { icon: createMarkerIcon(lot) })
      .addTo(map)
      .bindPopup(getPopupHTML(lot), { closeButton: false, minWidth: 240 });
    state.markers[lot.id] = marker;
  });
}

// ========== 筛选与排序 ==========
function getFilteredLots() {
  let lots = [...parkingLotData];

  // 搜索
  if (state.searchKeyword) {
    const kw = state.searchKeyword.toLowerCase();
    lots = lots.filter(l => l.name.includes(kw) || l.address.includes(kw));
  }
  // 价格
  lots = lots.filter(l => l.price >= state.priceMin && l.price <= state.priceMax);
  // 距离
  if (state.distanceRange) {
    lots = lots.filter(l => l.distance <= state.distanceRange);
  }
  // 类型
  if (state.parkingType) {
    lots = lots.filter(l => l.type === state.parkingType);
  }
  // 排序
  if (state.sort === 'distance') lots.sort((a, b) => a.distance - b.distance);
  else if (state.sort === 'price') lots.sort((a, b) => a.price - b.price);
  else if (state.sort === 'spaces') lots.sort((a, b) => b.availableSpaces - a.availableSpaces);

  return lots;
}

// ========== 列表渲染 ==========
function renderList(lots) {
  const list = document.getElementById('parkingList');

  if (lots.length === 0) {
    list.innerHTML = '<div class="empty-list">未找到匹配的停车场</div>';
    return;
  }

  list.innerHTML = lots.map((lot, i) => {
    const spaces = lot.availableSpaces;
    const idxClass = spaces === 0 ? 'full' : spaces <= 20 ? 'busy' : '';
    const spaceClass = spaces === 0 ? 'full' : spaces <= 20 ? 'few' : '';
    const disabled = spaces === 0;
    return `
      <div class="parking-card" data-id="${lot.id}" onclick="focusLot(${lot.id})">
        <div class="card-index ${idxClass}">${i + 1}</div>
        <div class="card-body">
          <div class="card-name">${lot.name}</div>
          <div class="card-address">${lot.address}</div>
          <div class="card-tags">
            <span class="card-tag">${lot.type}停车场</span>
            <span class="card-tag">${formatDist(lot.distance)}</span>
            ${lot.features.slice(0, 2).map(f => `<span class="card-tag">${f}</span>`).join('')}
          </div>
        </div>
        <div class="card-right">
          <div>
            <div class="card-price">¥${lot.price}<small>/h</small></div>
            <div class="card-spaces ${spaceClass}">空位 <strong>${spaces}</strong></div>
          </div>
          <div class="card-actions">
            <button class="card-btn card-btn-nav" onclick="event.stopPropagation(); navigateTo(${lot.id})">导航</button>
            ${disabled
              ? '<button class="card-btn" style="background:#f0f0f0;color:#aaa;cursor:not-allowed;border:none;">已满</button>'
              : `<button class="card-btn card-btn-reserve" onclick="event.stopPropagation(); reserveLot(${lot.id})">预约</button>`}
          </div>
        </div>
      </div>`;
  }).join('');
}

function formatDist(d) {
  return d >= 1000 ? (d / 1000).toFixed(1) + 'km' : d + 'm';
}

function updateSummary(lots) {
  document.getElementById('totalCount').textContent = lots.length;
  document.getElementById('totalSpaces').textContent = lots.reduce((s, l) => s + l.availableSpaces, 0);
  document.getElementById('sheetCount').textContent = lots.length + ' 个';
}

// ========== 综合刷新 ==========
function refresh() {
  const lots = getFilteredLots();
  renderMarkers(lots);
  renderList(lots);
  updateSummary(lots);
}

// ========== 聚焦停车场 ==========
function focusLot(id) {
  const lot = parkingLotData.find(l => l.id === id);
  if (!lot) return;

  map.setView([lot.lat, lot.lng], 16, { animate: true });
  if (state.markers[id]) state.markers[id].openPopup();

  // 高亮卡片
  document.querySelectorAll('.parking-card').forEach(c => c.classList.remove('highlight'));
  document.querySelector(`.parking-card[data-id="${id}"]`)?.classList.add('highlight');
}

// ========== 导航 ==========
function navigateTo(id) {
  const lot = parkingLotData.find(l => l.id === id);
  if (!lot) return;

  const mode = state.transportMode === 'driving' ? 'driving' : 'walking';
  // 尝试调起系统地图导航
  const url = `https://uri.amap.com/navigation?from=${CENTER[1]},${CENTER[0]},我的位置&to=${lot.lng},${lot.lat},${lot.name}&mode=${mode}&coordinate=gaode&callnative=1`;
  window.open(url, '_blank');
  showToast(`正在为您导航至「${lot.name}」`);

  // 更新UI状态
  document.querySelectorAll('.parking-card').forEach(c => c.classList.remove('navigating'));
  document.querySelector(`.parking-card[data-id="${id}"]`)?.classList.add('navigating');
}

// ========== 预约 ==========
function reserveLot(id) {
  const lot = parkingLotData.find(l => l.id === id);
  if (!lot || lot.availableSpaces === 0) return;
  showDetailModal(lot, true);
}

// ========== 详情弹窗 ==========
function showDetailModal(lot, showReserveForm = false) {
  const spaces = lot.availableSpaces;
  const spaceClass = spaces === 0 ? 'red' : spaces <= 20 ? 'yellow' : 'green';
  const disabled = spaces === 0;

  document.getElementById('modalBody').innerHTML = `
    <div class="detail-header">
      <h2>${lot.name} ${getBadge(spaces)}</h2>
      <div class="address">${lot.address}</div>
    </div>

    <div class="detail-stats">
      <div class="stat-card">
        <div class="stat-value blue">¥${lot.price}</div>
        <div class="stat-label">元/小时</div>
      </div>
      <div class="stat-card">
        <div class="stat-value ${spaceClass}">${spaces}</div>
        <div class="stat-label">剩余车位</div>
      </div>
      <div class="stat-card">
        <div class="stat-value ${spaceClass}">${lot.totalSpaces}</div>
        <div class="stat-label">总车位</div>
      </div>
    </div>

    <div class="detail-fee">
      <h3>收费标准</h3>
      <table class="fee-table">
        <tr><td>计费类型</td><td>${lot.hourly}</td></tr>
        <tr><td>封顶价格</td><td>${lot.daily}</td></tr>
        <tr><td>距离</td><td>${formatDist(lot.distance)}</td></tr>
      </table>
    </div>

    <div class="detail-features">
      ${lot.features.map(f => `<span class="feature-tag">${f}</span>`).join('')}
    </div>

    ${showReserveForm && !disabled ? `
      <div class="reserve-form">
        <h3>预约车位</h3>
        <div class="form-row">
          <label>开始时间</label>
          <input type="datetime-local" id="reserveStart" />
        </div>
        <div class="form-row">
          <label>预计停车时长</label>
          <select id="reserveDuration">
            <option value="1">1 小时</option>
            <option value="2" selected>2 小时</option>
            <option value="3">3 小时</option>
            <option value="4">4 小时</option>
            <option value="8">8 小时</option>
            <option value="24">24 小时</option>
          </select>
        </div>
        <div class="form-row">
          <label>车牌号</label>
          <input type="text" id="reservePlate" placeholder="如: 沪A·12345" maxlength="10" />
        </div>
        <button class="reserve-submit" onclick="submitReserve(${lot.id})">确认预约 (¥${lot.price} × 2h = ¥${lot.price * 2})</button>
      </div>
    ` : ''}

    <div class="detail-actions">
      <button class="detail-btn detail-btn-nav" onclick="navigateTo(${lot.id})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 11l19-9-9 19-2-8-8-2z"/></svg>
        导航前往
      </button>
      <button class="detail-btn ${disabled ? 'detail-btn-disabled' : 'detail-btn-reserve'}" onclick="${disabled ? '' : `reserveLot(${lot.id})`}" ${disabled ? 'disabled' : ''}>
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/></svg>
        预约车位
      </button>
    </div>
  `;

  // 默认时间
  if (showReserveForm && !disabled) {
    const now = new Date();
    now.setMinutes(now.getMinutes() + 30, 0, 0);
    const local = new Date(now.getTime() - now.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
    document.getElementById('reserveStart').value = local;

    // 时长变化时更新预估费用
    document.getElementById('reserveDuration').addEventListener('change', (e) => {
      const h = parseInt(e.target.value);
      const total = lot.price * h;
      document.querySelector('.reserve-submit').textContent = `确认预约 (¥${lot.price} × ${h}h = ¥${total})`;
    });
  }

  document.getElementById('detailModal').classList.add('show');
}

function closeModal() {
  document.getElementById('detailModal').classList.remove('show');
}

function submitReserve(id) {
  const lot = parkingLotData.find(l => l.id === id);
  const start = document.getElementById('reserveStart').value;
  const duration = document.getElementById('reserveDuration').value;
  const plate = document.getElementById('reservePlate').value.trim();

  if (!start) return showToast('请选择开始时间');
  if (!plate) return showToast('请输入车牌号');
  if (!/^[\u4e00-\u9fa5][A-Z]·?\d{4,5}$/.test(plate.replace(/\s/g, ''))) return showToast('请输入正确的车牌号');

  // 模拟预约成功
  lot.availableSpaces = Math.max(0, lot.availableSpaces - 1);
  closeModal();
  showToast(`预约成功！已为您预留「${lot.name}」车位`);
  refresh();
}

// ========== Toast ==========
function showToast(msg) {
  const t = document.getElementById('toast');
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(t._timer);
  t._timer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ========== 搜索 ==========
document.getElementById('searchInput').addEventListener('input', (e) => {
  state.searchKeyword = e.target.value;
  refresh();
});

// ========== 排序按钮 ==========
document.querySelectorAll('.filter-btn[data-sort]').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.filter-btn[data-sort]').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.sort = btn.dataset.sort;
    refresh();
  });
});

// ========== 筛选面板 ==========
document.getElementById('filterPanelToggle').addEventListener('click', () => {
  document.getElementById('filterPanel').classList.toggle('open');
});

// 价格 slider
['priceMin', 'priceMax'].forEach(key => {
  document.getElementById(key).addEventListener('input', (e) => {
    const val = parseInt(e.target.value);
    document.getElementById(key + 'Val').textContent = key === 'priceMin' ? `¥${val}` : `¥${val}/h`;
  });
});

// 距离 chip
document.querySelectorAll('.chip[data-range]').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip[data-range]').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.distanceRange = chip.dataset.range === 'all' ? null : parseInt(chip.dataset.range);
  });
});

// 类型 chip
document.querySelectorAll('.chip[data-type]').forEach(chip => {
  chip.addEventListener('click', () => {
    document.querySelectorAll('.chip[data-type]').forEach(c => c.classList.remove('active'));
    chip.classList.add('active');
    state.parkingType = chip.dataset.type === 'all' ? null : chip.dataset.type;
  });
});

// 应用筛选
document.getElementById('filterApply').addEventListener('click', () => {
  state.priceMin = parseInt(document.getElementById('priceMin').value);
  state.priceMax = parseInt(document.getElementById('priceMax').value);
  document.getElementById('filterPanel').classList.remove('open');
  refresh();
});

// ========== 交通方式切换 ==========
document.querySelectorAll('.transport-btn').forEach(btn => {
  btn.addEventListener('click', () => {
    document.querySelectorAll('.transport-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    state.transportMode = btn.dataset.mode;
  });
});

// ========== 底部抽屉拖拽 ==========
const sheet = document.getElementById('bottomSheet');
const handle = document.getElementById('sheetHandle');
let sheetTouch = null;

handle.addEventListener('touchstart', (e) => {
  sheetTouch = { startY: e.touches[0].clientY };
});
handle.addEventListener('touchmove', (e) => {
  if (!sheetTouch) return;
  const dy = e.touches[0].clientY - sheetTouch.startY;
  if (dy < 0) {
    // 上拉展开
    sheet.style.transform = 'translateY(0)';
    state.sheetExpanded = true;
  } else if (dy > 60) {
    // 下拉收起
    sheet.style.transform = '';
    state.sheetExpanded = false;
  }
});
handle.addEventListener('touchend', () => { sheetTouch = null; });
handle.addEventListener('click', () => {
  state.sheetExpanded = !state.sheetExpanded;
  if (state.sheetExpanded) {
    sheet.style.maxHeight = '70vh';
    sheet.style.transform = 'translateY(0)';
  } else {
    sheet.style.maxHeight = '';
    sheet.style.transform = '';
  }
});

// ========== 关闭弹窗 ==========
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('detailModal').addEventListener('click', (e) => {
  if (e.target === e.currentTarget) closeModal();
});

// ========== 模拟实时车位变化 ==========
setInterval(() => {
  const lot = parkingLotData[Math.floor(Math.random() * parkingLotData.length)];
  const delta = Math.random() > 0.5 ? 1 : -1;
  lot.availableSpaces = Math.max(0, Math.min(lot.totalSpaces, lot.availableSpaces + delta));
  refresh();
}, 8000);

// ========== 定位用户位置(可选) ==========
if (navigator.geolocation) {
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      const { latitude, longitude } = pos.coords;
      map.setView([latitude, longitude], 14, { animate: true });
    },
    () => { /* 用户拒绝或定位失败，使用默认位置 */ }
  );
}

// ========== 启动 ==========
refresh();
