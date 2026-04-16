// 应用主逻辑
class TravelMapApp {
    constructor() {
        this.map = null;
        this.attractions = [];
        this.markers = [];
        this.routeLine = null;
        this.showRoute = true;
        this.pendingLocation = null;

        this.init();
    }

    init() {
        this.initMap();
        this.initEventListeners();
        this.loadFromStorage();
    }

    // 初始化地图
    initMap() {
        // 创建地图实例，默认定位到中国
        this.map = L.map('map', {
            zoomControl: false  // 禁用默认缩放控件，使用自定义控件
        }).setView([35.8617, 104.1954], 4);

        // 添加 OpenStreetMap 图层
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19
        }).addTo(this.map);

        // 添加地图点击事件
        this.map.on('click', (e) => this.onMapClick(e));
    }

    // 初始化事件监听器
    initEventListeners() {
        // 搜索功能
        document.getElementById('searchBtn').addEventListener('click', () => this.searchLocation());
        document.getElementById('searchInput').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.searchLocation();
        });

        // 计算路线
        document.getElementById('calculateRouteBtn').addEventListener('click', () => this.calculateRoute());

        // 清除所有
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());

        // 导出/导入
        document.getElementById('exportBtn').addEventListener('click', () => this.exportData());
        document.getElementById('importBtn').addEventListener('click', () => document.getElementById('importFile').click());
        document.getElementById('importFile').addEventListener('change', (e) => this.importData(e));

        // 地图控制按钮
        document.getElementById('locateBtn').addEventListener('click', () => this.locateUser());
        document.getElementById('zoomInBtn').addEventListener('click', () => this.map.zoomIn());
        document.getElementById('zoomOutBtn').addEventListener('click', () => this.map.zoomOut());
        document.getElementById('toggleRouteBtn').addEventListener('click', () => this.toggleRouteDisplay());
    }

    // 地图点击处理
    onMapClick(e) {
        const { lat, lng } = e.latlng;
        this.pendingLocation = { lat, lng };

        // 自动聚焦到输入框
        document.getElementById('attractionName').focus();
        this.showToast('点击了地图，请填写景点信息后继续');
    }

    // 添加景点
    addAttraction(data) {
        const attraction = {
            id: Date.now(),
            name: data.name || '未命名景点',
            description: data.description || '',
            icon: data.icon || '🏛️',
            lat: data.lat,
            lng: data.lng
        };

        this.attractions.push(attraction);
        this.addMarker(attraction);
        this.updateAttractionsList();
        this.updateRouteButton();
        this.saveToStorage();

        this.showToast(`已添加: ${attraction.name}`, 'success');
    }

    // 添加标记
    addMarker(attraction) {
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `<span class="icon">${attraction.icon}</span>`,
            iconSize: [48, 48],
            iconAnchor: [24, 24]
        });

        const marker = L.marker([attraction.lat, attraction.lng], { icon })
            .addTo(this.map);

        // 添加弹出窗口
        const popupContent = `
            <div class="popup-header">
                <span class="icon">${attraction.icon}</span>
                <h4>${this.escapeHtml(attraction.name)}</h4>
            </div>
            ${attraction.description ? `<p class="popup-description">${this.escapeHtml(attraction.description)}</p>` : ''}
            <div class="popup-coordinates">
                ${attraction.lat.toFixed(6)}, ${attraction.lng.toFixed(6)}
            </div>
        `;

        marker.bindPopup(popupContent);

        // 标记点击事件
        marker.on('click', () => {
            marker.openPopup();
        });

        // 双击删除
        marker.on('dblclick', () => {
            this.deleteAttraction(attraction.id);
        });

        this.markers.push({ marker, attraction });
    }

    // 删除景点
    deleteAttraction(id) {
        const index = this.attractions.findIndex(a => a.id === id);
        if (index !== -1) {
            // 移除标记
            const markerObj = this.markers.find(m => m.attraction.id === id);
            if (markerObj) {
                this.map.removeLayer(markerObj.marker);
                this.markers = this.markers.filter(m => m.attraction.id !== id);
            }

            // 移除景点
            this.attractions.splice(index, 1);
            this.updateAttractionsList();
            this.updateRouteButton();
            this.clearRoute();
            this.saveToStorage();

            this.showToast('景点已删除');
        }
    }

    // 定位到景点
    locateAttraction(id) {
        const attraction = this.attractions.find(a => a.id === id);
        if (attraction) {
            this.map.setView([attraction.lat, attraction.lng], 14);
            const markerObj = this.markers.find(m => m.attraction.id === id);
            if (markerObj) {
                markerObj.marker.openPopup();
            }
        }
    }

    // 更新景点列表
    updateAttractionsList() {
        const list = document.getElementById('attractionsList');

        if (this.attractions.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📍</div>
                    <p>还没有添加任何景点</p>
                    <p style="font-size: 12px; margin-top: 5px;">点击地图或搜索来添加</p>
                </div>
            `;
            return;
        }

        list.innerHTML = this.attractions.map((attraction, index) => `
            <li class="attraction-item">
                <div class="icon-name">
                    <span class="icon">${attraction.icon}</span>
                    <span class="name">${this.escapeHtml(attraction.name)}</span>
                </div>
                <div class="actions">
                    <button class="action-btn locate-btn" onclick="app.locateAttraction(${attraction.id})" title="定位">
                        📍
                    </button>
                    <button class="action-btn delete-btn" onclick="app.deleteAttraction(${attraction.id})" title="删除">
                        ✕
                    </button>
                </div>
            </li>
        `).join('');
    }

    // 更新路线按钮状态
    updateRouteButton() {
        const btn = document.getElementById('calculateRouteBtn');
        btn.disabled = this.attractions.length < 2;
    }

    // 计算路线距离
    calculateRoute() {
        if (this.attractions.length < 2) {
            this.showToast('至少需要2个景点才能计算路线', 'error');
            return;
        }

        // 使用 OSRM 路由服务
        const coordinates = this.attractions.map(a => `${a.lng},${a.lat}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

        document.getElementById('calculateRouteBtn').innerHTML = '<span class="loading"></span> 计算中...';

        fetch(url)
            .then(res => res.json())
            .then(data => {
                document.getElementById('calculateRouteBtn').innerHTML = '📏 计算路线距离';

                if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    const distance = route.distance; // 米
                    const duration = route.duration; // 秒

                    this.displayRoute(route.geometry, distance, duration);
                    this.showToast('路线计算完成', 'success');
                } else {
                    throw new Error('无法获取路线数据');
                }
            })
            .catch(err => {
                document.getElementById('calculateRouteBtn').innerHTML = '📏 计算路线距离';
                console.error('路线计算错误:', err);
                this.showToast('路线计算失败，使用直线距离', 'error');
                this.calculateStraightLineDistance();
            });
    }

    // 计算直线距离（当路由服务不可用时）
    calculateStraightLineDistance() {
        let totalDistance = 0;

        for (let i = 0; i < this.attractions.length - 1; i++) {
            const from = this.attractions[i];
            const to = this.attractions[i + 1];
            totalDistance += this.getHaversineDistance(
                from.lat, from.lng,
                to.lat, to.lng
            );
        }

        // 创建简单的直线连接
        const latlngs = this.attractions.map(a => [a.lat, a.lng]);
        const geometry = { type: 'LineString', coordinates: latlngs.map(ll => [ll[1], ll[0]]) };

        this.displayRoute(geometry, totalDistance * 1000, null);
    }

    // Haversine 公式计算两点间距离
    getHaversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371; // 地球半径（公里）
        const dLat = this.toRad(lat2 - lat1);
        const dLon = this.toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(this.toRad(lat1)) * Math.cos(this.toRad(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    toRad(deg) {
        return deg * (Math.PI / 180);
    }

    // 显示路线
    displayRoute(geometry, distance, duration) {
        // 清除旧路线
        this.clearRoute();

        // 创建新路线
        const coordinates = geometry.coordinates.map(coord => [coord[1], coord[0]]);

        this.routeLine = L.polyline(coordinates, {
            color: '#2196F3',
            weight: 4,
            opacity: 0.8,
            dashArray: null
        }).addTo(this.map);

        // 调整视图以显示完整路线
        this.map.fitBounds(this.routeLine.getBounds(), { padding: [50, 50] });

        // 显示路线信息
        const routeInfo = document.getElementById('routeInfo');
        routeInfo.classList.add('show');
        routeInfo.innerHTML = `
            <div class="distance">${this.formatDistance(distance)}</div>
            <div class="detail">
                包含 ${this.attractions.length} 个景点<br>
                ${duration ? `预计时间: ${this.formatDuration(duration)}` : ''}
            </div>
        `;
    }

    // 清除路线
    clearRoute() {
        if (this.routeLine) {
            this.map.removeLayer(this.routeLine);
            this.routeLine = null;
        }
        document.getElementById('routeInfo').classList.remove('show');
    }

    // 切换路线显示
    toggleRouteDisplay() {
        this.showRoute = !this.showRoute;
        const btn = document.getElementById('toggleRouteBtn');
        btn.classList.toggle('active', this.showRoute);

        if (this.routeLine) {
            if (this.showRoute) {
                this.routeLine.addTo(this.map);
            } else {
                this.map.removeLayer(this.routeLine);
            }
        }
    }

    // 格式化距离
    formatDistance(meters) {
        if (meters < 1000) {
            return `${Math.round(meters)} 米`;
        } else if (meters < 100000) {
            return `${(meters / 1000).toFixed(1)} 公里`;
        } else {
            return `${Math.round(meters / 1000)} 公里`;
        }
    }

    // 格式化时长
    formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return `${hours}小时${minutes > 0 ? minutes + '分钟' : ''}`;
        }
        return `${minutes}分钟`;
    }

    // 搜索地点
    searchLocation() {
        const query = document.getElementById('searchInput').value.trim();
        if (!query) return;

        // 使用 Nominatim 搜索 API
        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;

        document.getElementById('searchBtn').innerHTML = '<span class="loading" style="border-color: white; border-top-color: transparent; width: 16px; height: 16px;"></span>';

        fetch(url)
            .then(res => res.json())
            .then(data => {
                document.getElementById('searchBtn').innerHTML = '🔍';
                this.displaySearchResults(data);
            })
            .catch(err => {
                document.getElementById('searchBtn').innerHTML = '🔍';
                this.showToast('搜索失败，请重试', 'error');
            });
    }

    // 显示搜索结果
    displaySearchResults(results) {
        const container = document.getElementById('searchResults');

        if (results.length === 0) {
            container.innerHTML = '<p style="color: #666; font-size: 14px; text-align: center; padding: 20px;">未找到相关地点</p>';
            return;
        }

        container.innerHTML = results.map(result => `
            <div class="search-result-item" data-lat="${result.lat}" data-lon="${result.lon}" data-name="${result.display_name.split(',')[0]}">
                <div class="name">${result.display_name.split(',')[0]}</div>
                <div class="address">${this.truncateText(result.display_name, 60)}</div>
            </div>
        `).join('');

        // 点击搜索结果
        container.querySelectorAll('.search-result-item').forEach(item => {
            item.addEventListener('click', () => {
                const lat = parseFloat(item.dataset.lat);
                const lon = parseFloat(item.dataset.lon);
                const name = item.dataset.name;

                this.map.setView([lat, lon], 14);

                // 添加临时标记
                const tempMarker = L.marker([lat, lon]).addTo(this.map);
                tempMarker.bindPopup(`<b>${name}</b><br>点击此处添加为景点`).openPopup();

                // 设置为待添加位置
                this.pendingLocation = { lat, lng: lon };
                document.getElementById('attractionName').value = name;
                document.getElementById('attractionName').focus();

                // 3秒后移除临时标记
                setTimeout(() => {
                    this.map.removeLayer(tempMarker);
                }, 3000);
            });
        });
    }

    // 定位用户位置
    locateUser() {
        if (!navigator.geolocation) {
            this.showToast('您的浏览器不支持地理定位', 'error');
            return;
        }

        const btn = document.getElementById('locateBtn');
        btn.innerHTML = '<span class="loading" style="border-color: #333; border-top-color: transparent; width: 16px; height: 16px;"></span>';

        navigator.geolocation.getCurrentPosition(
            (position) => {
                const { latitude, longitude } = position.coords;
                this.map.setView([latitude, longitude], 14);

                L.marker([latitude, longitude])
                    .addTo(this.map)
                    .bindPopup('📍 您的位置')
                    .openPopup();

                btn.innerHTML = '📍';
                this.showToast('已定位到您的位置', 'success');
            },
            (error) => {
                btn.innerHTML = '📍';
                let message = '定位失败';
                if (error.code === 1) {
                    message = '请允许位置访问权限';
                } else if (error.code === 2) {
                    message = '无法获取位置信息';
                } else if (error.code === 3) {
                    message = '定位请求超时';
                }
                this.showToast(message, 'error');
            }
        );
    }

    // 清除所有景点
    clearAll() {
        if (this.attractions.length === 0) {
            this.showToast('没有景点需要清除', 'error');
            return;
        }

        if (confirm('确定要清除所有景点吗？')) {
            // 移除所有标记
            this.markers.forEach(m => this.map.removeLayer(m.marker));
            this.markers = [];
            this.attractions = [];

            this.clearRoute();
            this.updateAttractionsList();
            this.updateRouteButton();
            localStorage.removeItem('travelMapAttractions');

            this.showToast('已清除所有景点');
        }
    }

    // 导出数据
    exportData() {
        if (this.attractions.length === 0) {
            this.showToast('没有数据可导出', 'error');
            return;
        }

        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            attractions: this.attractions
        };

        const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `travel-map-${new Date().toISOString().split('T')[0]}.json`;
        a.click();
        URL.revokeObjectURL(url);

        this.showToast('数据已导出', 'success');
    }

    // 导入数据
    importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const data = JSON.parse(e.target.result);

                if (!data.attractions || !Array.isArray(data.attractions)) {
                    throw new Error('无效的数据格式');
                }

                // 清除现有数据
                this.markers.forEach(m => this.map.removeLayer(m.marker));
                this.markers = [];
                this.attractions = [];
                this.clearRoute();

                // 添加导入的数据
                data.attractions.forEach(attraction => {
                    this.attractions.push(attraction);
                    this.addMarker(attraction);
                });

                this.updateAttractionsList();
                this.updateRouteButton();
                this.saveToStorage();

                this.showToast(`成功导入 ${data.attractions.length} 个景点`, 'success');

                // 调整地图视图
                if (this.attractions.length > 0) {
                    const group = L.featureGroup(this.markers.map(m => m.marker));
                    this.map.fitBounds(group.getBounds().pad(0.1));
                }
            } catch (err) {
                console.error('导入错误:', err);
                this.showToast('导入失败，文件格式不正确', 'error');
            }
        };
        reader.readAsText(file);

        // 重置 input
        event.target.value = '';
    }

    // 保存到本地存储
    saveToStorage() {
        localStorage.setItem('travelMapAttractions', JSON.stringify(this.attractions));
    }

    // 从本地存储加载
    loadFromStorage() {
        const saved = localStorage.getItem('travelMapAttractions');
        if (saved) {
            try {
                const attractions = JSON.parse(saved);
                attractions.forEach(attraction => {
                    this.attractions.push(attraction);
                    this.addMarker(attraction);
                });
                this.updateAttractionsList();
                this.updateRouteButton();

                if (this.attractions.length > 0) {
                    const group = L.featureGroup(this.markers.map(m => m.marker));
                    this.map.fitBounds(group.getBounds().pad(0.1));
                }
            } catch (err) {
                console.error('加载数据失败:', err);
            }
        }
    }

    // 显示提示消息
    showToast(message, type = 'info') {
        // 移除旧 toast
        const oldToast = document.querySelector('.toast');
        if (oldToast) oldToast.remove();

        const toast = document.createElement('div');
        toast.className = `toast ${type}`;
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(() => toast.classList.add('show'), 10);
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => toast.remove(), 300);
        }, 3000);
    }

    // HTML 转义
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 截断文本
    truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }
}

// 初始化应用
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new TravelMapApp();

    // 监听输入框变化，自动添加景点
    let timeout;
    const nameInput = document.getElementById('attractionName');
    const descInput = document.getElementById('attractionDesc');
    const iconSelect = document.getElementById('attractionIcon');

    const handleInput = () => {
        clearTimeout(timeout);
        timeout = setTimeout(() => {
            const name = nameInput.value.trim();
            if (name && app.pendingLocation) {
                app.attractions.push({
                    id: Date.now(),
                    name,
                    description: descInput.value.trim(),
                    icon: iconSelect.value,
                    lat: app.pendingLocation.lat,
                    lng: app.pendingLocation.lng
                });
                app.addMarker(app.attractions[app.attractions.length - 1]);
                app.updateAttractionsList();
                app.updateRouteButton();
                app.saveToStorage();

                // 清空表单
                nameInput.value = '';
                descInput.value = '';
                app.pendingLocation = null;

                app.showToast('景点添加成功！', 'success');
            }
        }, 800);
    };

    nameInput.addEventListener('input', handleInput);
    descInput.addEventListener('input', handleInput);
    iconSelect.addEventListener('change', handleInput);
});
