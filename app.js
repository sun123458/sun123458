// ==================== 全局变量 ====================
let map;
let markers = [];
let routeLayer;
let polyline;
let pendingLatLng = null;

// 景点类型配置
const markerTypes = {
    sight: { icon: '🏛️', color: '#2196F3' },
    food: { icon: '🍜', color: '#FF9800' },
    hotel: { icon: '🏨', color: '#9C27B0' },
    shopping: { icon: '🛍️', color: '#E91E63' }
};

// ==================== 初始化地图 ====================
function initMap() {
    // 默认中心点：北京
    const defaultCenter = [39.9042, 116.4074];

    map = L.map('map', {
        zoomControl: true
    }).setView(defaultCenter, 12);

    // 添加 OpenStreetMap 图层
    const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19,
        minZoom: 3
    }).addTo(map);

    // 加载本地存储的标记
    loadMarkersFromStorage();

    // 地图点击事件
    map.on('click', onMapClick);

    // 添加定位控件
    L.control.locate({
        position: 'topleft',
        flyTo: true,
        showPopup: true,
        strings: {
            title: '显示我的位置'
        }
    }).addTo(map);
}

// ==================== 创建自定义图标 ====================
function createCustomIcon(type) {
    const config = markerTypes[type] || markerTypes.sight;
    return L.divIcon({
        className: 'custom-marker-container',
        html: `<div class="custom-marker" style="color: ${config.color}">${config.icon}</div>`,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32]
    });
}

// ==================== 地图点击处理 ====================
function onMapClick(e) {
    const addMode = document.getElementById('addMarkerBtn').dataset.mode === 'add';
    if (addMode) {
        pendingLatLng = e.latlng;
        showMarkerModal();
    }
}

// ==================== 显示添加标记模态框 ====================
function showMarkerModal() {
    const modal = document.getElementById('markerModal');
    modal.classList.add('active');
    document.getElementById('markerName').focus();
}

// ==================== 关闭模态框 ====================
function closeMarkerModal() {
    const modal = document.getElementById('markerModal');
    modal.classList.remove('active');
    document.getElementById('markerForm').reset();
    pendingLatLng = null;
}

// ==================== 添加标记 ====================
function addMarker(latLng, data) {
    const markerId = Date.now().toString();
    const icon = createCustomIcon(data.type);

    const marker = L.marker(latLng, { icon: icon }).addTo(map);

    // 创建弹窗内容
    const popupContent = createPopupContent(data);
    marker.bindPopup(popupContent);

    // 标记点击事件
    marker.on('click', () => {
        highlightMarkerItem(markerId);
    });

    // 存储标记数据
    const markerData = {
        id: markerId,
        latlng: latlng,
        data: data,
        marker: marker
    };

    markers.push(markerData);
    updateMarkerList();
    saveMarkersToStorage();

    // 如果不是批量添加，清除添加模式
    if (document.getElementById('addMarkerBtn').dataset.mode === 'add') {
        toggleAddMode();
    }

    showToast(`已添加景点：${data.name}`, 'success');
}

// ==================== 创建弹窗内容 ====================
function createPopupContent(data) {
    const config = markerTypes[data.type];
    return `
        <div class="popup-header">
            <span class="popup-icon">${config.icon}</span>
            <span class="popup-title">${escapeHtml(data.name)}</span>
        </div>
        ${data.desc ? `<div class="popup-desc">${escapeHtml(data.desc)}</div>` : ''}
        <div class="popup-coords">
            ${data.latlng.lat.toFixed(6)}, ${data.latlng.lng.toFixed(6)}
        </div>
    `;
}

// ==================== 更新景点列表 ====================
function updateMarkerList() {
    const markerList = document.getElementById('markerList');

    if (markers.length === 0) {
        markerList.innerHTML = '<p class="empty-message">暂无景点，点击地图添加</p>';
        return;
    }

    markerList.innerHTML = markers.map((m, index) => {
        const config = markerTypes[m.data.type];
        return `
            <div class="marker-item" data-id="${m.id}" style="border-left-color: ${config.color}">
                <div class="marker-item-header">
                    <span class="marker-item-icon">${config.icon}</span>
                    <span class="marker-item-name">${escapeHtml(m.data.name)}</span>
                    <button class="marker-item-delete" onclick="deleteMarker('${m.id}')">✕</button>
                </div>
                ${m.data.desc ? `<div class="marker-item-desc">${escapeHtml(m.data.desc)}</div>` : ''}
                <div class="marker-item-coords">${m.latlng.lat.toFixed(4)}, ${m.latlng.lng.toFixed(4)}</div>
            </div>
        `;
    }).join('');

    // 添加列表项点击事件
    document.querySelectorAll('.marker-item').forEach(item => {
        item.addEventListener('click', (e) => {
            if (!e.target.classList.contains('marker-item-delete')) {
                const markerId = item.dataset.id;
                const markerData = markers.find(m => m.id === markerId);
                if (markerData) {
                    map.setView(markerData.latlng, 15);
                    markerData.marker.openPopup();
                }
            }
        });
    });

    updateRouteInfo();
}

// ==================== 高亮列表项 ====================
function highlightMarkerItem(markerId) {
    document.querySelectorAll('.marker-item').forEach(item => {
        item.style.background = item.dataset.id === markerId ? '#e3f2fd' : '';
    });
}

// ==================== 删除标记 ====================
function deleteMarker(markerId) {
    const index = markers.findIndex(m => m.id === markerId);
    if (index !== -1) {
        const markerData = markers[index];
        map.removeLayer(markerData.marker);
        markers.splice(index, 1);
        updateMarkerList();
        saveMarkersToStorage();
        showToast('已删除景点', 'success');

        // 如果有路线，重新计算
        if (polyline) {
            calculateRoute();
        }
    }
}

// ==================== 计算路线 ====================
function calculateRoute() {
    if (markers.length < 2) {
        showToast('至少需要两个景点才能计算路线', 'error');
        return;
    }

    // 移除现有路线
    if (polyline) {
        map.removeLayer(polyline);
    }

    // 按添加顺序创建路线点
    const latlngs = markers.map(m => m.latlng);

    // 绘制折线
    polyline = L.polyline(latlngs, {
        color: '#2196F3',
        weight: 4,
        opacity: 0.7,
        dashArray: '10, 10'
    }).addTo(map);

    // 计算总距离
    let totalDistance = 0;
    for (let i = 0; i < latlngs.length - 1; i++) {
        totalDistance += latlngs[i].distanceTo(latlngs[i + 1]);
    }

    // 更新路线信息
    updateRouteInfo(totalDistance);

    // 调整地图视野以显示完整路线
    map.fitBounds(polyline.getBounds(), { padding: [50, 50] });

    showToast(`路线已生成，总距离：${formatDistance(totalDistance)}`, 'success');
}

// ==================== 更新路线信息 ====================
function updateRouteInfo(distance = null) {
    const routeInfo = document.getElementById('routeInfo');
    const totalDistanceEl = document.getElementById('totalDistance');
    const markerCountEl = document.getElementById('markerCount');

    if (distance !== null) {
        routeInfo.style.display = 'block';
        totalDistanceEl.textContent = formatDistance(distance);
    }

    markerCountEl.textContent = markers.length;
}

// ==================== 格式化距离 ====================
function formatDistance(meters) {
    if (meters < 1000) {
        return `${Math.round(meters)} m`;
    } else {
        return `${(meters / 1000).toFixed(2)} km`;
    }
}

// ==================== 切换添加模式 ====================
function toggleAddMode() {
    const btn = document.getElementById('addMarkerBtn');
    const isAddMode = btn.dataset.mode === 'add';

    if (isAddMode) {
        btn.dataset.mode = 'view';
        btn.classList.remove('btn-primary');
        btn.classList.add('btn-secondary');
        btn.innerHTML = '<span class="btn-icon">👁️</span> 浏览';
        map.getContainer().style.cursor = '';
    } else {
        btn.dataset.mode = 'add';
        btn.classList.remove('btn-secondary');
        btn.classList.add('btn-primary');
        btn.innerHTML = '<span class="btn-icon">📍</span> 添加景点';
        map.getContainer().style.cursor = 'crosshair';
        showToast('点击地图添加景点', 'success');
    }
}

// ==================== 清除所有标记 ====================
function clearAllMarkers() {
    if (markers.length === 0) {
        showToast('没有可清除的景点', 'error');
        return;
    }

    if (!confirm('确定要清除所有景点吗？')) {
        return;
    }

    markers.forEach(m => map.removeLayer(m.marker));
    markers = [];

    if (polyline) {
        map.removeLayer(polyline);
        polyline = null;
    }

    updateMarkerList();
    saveMarkersToStorage();
    document.getElementById('routeInfo').style.display = 'none';

    showToast('已清除所有景点', 'success');
}

// ==================== 本地存储 ====================
function saveMarkersToStorage() {
    const data = markers.map(m => ({
        id: m.id,
        latlng: { lat: m.latlng.lat, lng: m.latlng.lng },
        data: m.data
    }));
    localStorage.setItem('travelMapMarkers', JSON.stringify(data));
}

function loadMarkersFromStorage() {
    const stored = localStorage.getItem('travelMapMarkers');
    if (stored) {
        try {
            const data = JSON.parse(stored);
            data.forEach(item => {
                const latlng = L.latLng(item.latlng.lat, item.latlng.lng);
                addMarker(latlng, item.data);
            });
        } catch (e) {
            console.error('加载存储的标记失败:', e);
        }
    }
}

// ==================== Toast 通知 ====================
function showToast(message, type = 'info') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type} active`;

    setTimeout(() => {
        toast.classList.remove('active');
    }, 3000);
}

// ==================== HTML 转义 ====================
function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

// ==================== 网络状态监听 ====================
function initNetworkStatus() {
    // 创建离线提示横幅
    const banner = document.createElement('div');
    banner.className = 'offline-banner';
    banner.textContent = '⚠️ 当前处于离线模式，部分功能可能受限';
    document.body.appendChild(banner);

    function updateOnlineStatus() {
        if (navigator.onLine) {
            banner.classList.remove('active');
            showToast('网络已连接', 'success');
        } else {
            banner.classList.add('active');
            showToast('网络已断开，使用离线模式', 'error');
        }
    }

    window.addEventListener('online', updateOnlineStatus);
    window.addEventListener('offline', updateOnlineStatus);
}

// ==================== PWA 安装 ====================
let deferredPrompt;
function initPWAInstall() {
    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        deferredPrompt = e;

        // 显示安装提示
        const promptDiv = document.createElement('div');
        promptDiv.className = 'install-prompt active';
        promptDiv.innerHTML = `
            <p>📱 安装此应用到桌面，获得更好的体验！</p>
            <div class="buttons">
                <button class="btn btn-secondary btn-sm" onclick="dismissInstall()">稍后</button>
                <button class="btn btn-primary btn-sm" onclick="installPWA()">安装</button>
            </div>
        `;
        document.body.appendChild(promptDiv);
    });
}

window.installPWA = function() {
    if (deferredPrompt) {
        deferredPrompt.prompt();
        deferredPrompt.userChoice.then((choiceResult) => {
            if (choiceResult.outcome === 'accepted') {
                showToast('应用安装中...', 'success');
            }
            deferredPrompt = null;
            dismissInstall();
        });
    }
};

window.dismissInstall = function() {
    const prompt = document.querySelector('.install-prompt');
    if (prompt) prompt.remove();
};

// ==================== Service Worker 注册 ====================
function registerServiceWorker() {
    if ('serviceWorker' in navigator) {
        navigator.serviceWorker.register('service-worker.js')
            .then((registration) => {
                console.log('Service Worker 注册成功:', registration.scope);

                // 监听更新
                registration.addEventListener('updatefound', () => {
                    const newWorker = registration.installing;
                    newWorker.addEventListener('statechange', () => {
                        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                            showToast('有新版本可用，刷新页面更新', 'success');
                        }
                    });
                });
            })
            .catch((error) => {
                console.log('Service Worker 注册失败:', error);
            });
    }
}

// ==================== 初始化应用 ====================
document.addEventListener('DOMContentLoaded', () => {
    initMap();
    initNetworkStatus();
    registerServiceWorker();
    initPWAInstall();

    // 事件监听
    document.getElementById('addMarkerBtn').addEventListener('click', toggleAddMode);
    document.getElementById('routeBtn').addEventListener('click', calculateRoute);
    document.getElementById('clearBtn').addEventListener('click', clearAllMarkers);

    document.getElementById('closeSidebar').addEventListener('click', () => {
        document.getElementById('sidebar').classList.toggle('collapsed');
    });

    document.getElementById('closeModal').addEventListener('click', closeMarkerModal);
    document.getElementById('cancelMarker').addEventListener('click', closeMarkerModal);

    document.getElementById('markerForm').addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('markerName').value.trim();
        const desc = document.getElementById('markerDesc').value.trim();
        const type = document.querySelector('input[name="markerType"]:checked').value;

        if (name && pendingLatLng) {
            const data = {
                name: name,
                desc: desc,
                type: type,
                latlng: { lat: pendingLatLng.lat, lng: pendingLatLng.lng }
            };
            addMarker(pendingLatLng, data);
            closeMarkerModal();
        }
    });

    // 点击模态框外部关闭
    document.getElementById('markerModal').addEventListener('click', (e) => {
        if (e.target.id === 'markerModal') {
            closeMarkerModal();
        }
    });

    // 键盘快捷键
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            closeMarkerModal();
        }
    });

    showToast('欢迎使用旅行地图！点击"添加景点"开始', 'success');
});

// 使函数在全局可用
window.deleteMarker = deleteMarker;
