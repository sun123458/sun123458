// 应用主逻辑 - 交互式旅行地图
(function() {
    'use strict';

    // 全局变量
    let map = null;
    let attractions = [];
    let markers = [];
    let routeLine = null;
    let showRoute = true;
    let pendingLocation = null;
    let tempMarker = null;

    // 初始化
    function init() {
        console.log('正在初始化旅行地图...');

        try {
            initMap();
            initEventListeners();
            loadFromStorage();

            console.log('旅行地图初始化完成');
            showToast('地图加载完成', 'success');
        } catch (error) {
            console.error('初始化失败:', error);
            showToast('地图初始化失败，请刷新页面重试', 'error');
        }
    }

    // 初始化地图
    function initMap() {
        console.log('创建地图实例...');

        // 创建地图实例，默认定位到中国
        map = L.map('map', {
            zoomControl: false,
            preferCanvas: true
        }).setView([35.8617, 104.1954], 4);

        console.log('地图实例创建成功，中心点: [35.8617, 104.1954]');

        // 添加 OpenStreetMap 图层
        const tileLayer = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
            maxZoom: 19,
            errorTileUrl: 'data:image/svg+xml,<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256"><rect fill="%23ccc" width="256" height="256"/><text x="128" y="128" font-size="20" text-anchor="middle" fill="%23666">加载失败</text></svg>'
        }).addTo(this.map);

        console.log('地图瓦片图层添加成功');

        // 添加地图点击事件
        map.on('click', onMapClick);

        // 检查地图是否正确加载
        setTimeout(() => {
            const mapContainer = document.getElementById('map');
            if (mapContainer && mapContainer.offsetHeight === 0) {
                console.error('地图容器高度为0');
                showToast('地图显示异常，请调整窗口大小', 'error');
            }
        }, 1000);
    }

    // 初始化事件监听器
    function initEventListeners() {
        // 添加景点按钮
        const addBtn = document.getElementById('addAttractionBtn');
        if (addBtn) {
            addBtn.addEventListener('click', addAttractionFromForm);
        }

        // 搜索功能
        const searchBtn = document.getElementById('searchBtn');
        const searchInput = document.getElementById('searchInput');
        if (searchBtn) {
            searchBtn.addEventListener('click', searchLocation);
        }
        if (searchInput) {
            searchInput.addEventListener('keypress', function(e) {
                if (e.key === 'Enter') searchLocation();
            });
        }

        // 计算路线
        const calcRouteBtn = document.getElementById('calculateRouteBtn');
        if (calcRouteBtn) {
            calcRouteBtn.addEventListener('click', calculateRoute);
        }

        // 清除所有
        const clearAllBtn = document.getElementById('clearAllBtn');
        if (clearAllBtn) {
            clearAllBtn.addEventListener('click', clearAll);
        }

        // 导出/导入
        const exportBtn = document.getElementById('exportBtn');
        const importBtn = document.getElementById('importBtn');
        const importFile = document.getElementById('importFile');

        if (exportBtn) exportBtn.addEventListener('click', exportData);
        if (importBtn) importBtn.addEventListener('click', function() {
            if (importFile) importFile.click();
        });
        if (importFile) {
            importFile.addEventListener('change', importData);
        }

        // 地图控制按钮
        const locateBtn = document.getElementById('locateBtn');
        const zoomInBtn = document.getElementById('zoomInBtn');
        const zoomOutBtn = document.getElementById('zoomOutBtn');
        const toggleRouteBtn = document.getElementById('toggleRouteBtn');

        if (locateBtn) locateBtn.addEventListener('click', locateUser);
        if (zoomInBtn) zoomInBtn.addEventListener('click', function() { map.zoomIn(); });
        if (zoomOutBtn) zoomOutBtn.addEventListener('click', function() { map.zoomOut(); });
        if (toggleRouteBtn) toggleRouteBtn.addEventListener('click', toggleRouteDisplay);
    }

    // 地图点击处理
    function onMapClick(e) {
        const { lat, lng } = e.latlng;
        console.log('地图点击位置:', lat, lng);

        pendingLocation = { lat, lng };

        // 移除旧的临时标记
        if (tempMarker) {
            map.removeLayer(tempMarker);
        }

        // 添加临时标记
        tempMarker = L.marker([lat, lng], {
            icon: L.divIcon({
                className: 'temp-marker',
                html: '<div style="background: #FF5722; width: 16px; height: 16px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 8px rgba(0,0,0,0.3);"></div>',
                iconSize: [16, 16],
                iconAnchor: [8, 8]
            })
        }).addTo(map);

        tempMarker.bindPopup('已选择位置，请填写景点信息').openPopup();

        // 自动聚焦到输入框
        const nameInput = document.getElementById('attractionName');
        if (nameInput) {
            nameInput.focus();
        }

        showToast('已选择位置，请填写景点信息', 'info');
    }

    // 从表单添加景点
    function addAttractionFromForm() {
        if (!pendingLocation) {
            showToast('请先点击地图选择位置', 'error');
            return;
        }

        const nameInput = document.getElementById('attractionName');
        const descInput = document.getElementById('attractionDesc');
        const iconSelect = document.getElementById('attractionIcon');

        const name = nameInput ? nameInput.value.trim() : '';
        if (!name) {
            showToast('请输入景点名称', 'error');
            return;
        }

        const attraction = {
            id: Date.now(),
            name: name,
            description: descInput ? descInput.value.trim() : '',
            icon: iconSelect ? iconSelect.value : '🏛️',
            lat: pendingLocation.lat,
            lng: pendingLocation.lng
        };

        attractions.push(attraction);
        addMarker(attraction);
        updateAttractionsList();
        updateRouteButton();
        saveToStorage();

        // 清除临时标记
        if (tempMarker) {
            map.removeLayer(tempMarker);
            tempMarker = null;
        }

        // 清空表单
        if (nameInput) nameInput.value = '';
        if (descInput) descInput.value = '';
        pendingLocation = null;

        showToast('景点添加成功: ' + attraction.name, 'success');
    }

    // 添加标记
    function addMarker(attraction) {
        const icon = L.divIcon({
            className: 'custom-marker',
            html: `<span class="icon">${attraction.icon}</span>`,
            iconSize: [48, 48],
            iconAnchor: [24, 24]
        });

        const marker = L.marker([attraction.lat, attraction.lng], { icon }).addTo(map);

        // 添加弹出窗口
        const popupContent = `
            <div class="popup-header">
                <span class="icon">${attraction.icon}</span>
                <h4>${escapeHtml(attraction.name)}</h4>
            </div>
            ${attraction.description ? `<p class="popup-description">${escapeHtml(attraction.description)}</p>` : ''}
            <div class="popup-coordinates">
                ${attraction.lat.toFixed(6)}, ${attraction.lng.toFixed(6)}
            </div>
        `;

        marker.bindPopup(popupContent);

        // 双击删除
        marker.on('dblclick', function() {
            if (confirm('确定要删除这个景点吗？')) {
                deleteAttraction(attraction.id);
            }
        });

        markers.push({ marker, attraction });
    }

    // 删除景点
    function deleteAttraction(id) {
        const index = attractions.findIndex(a => a.id === id);
        if (index !== -1) {
            // 移除标记
            const markerObj = markers.find(m => m.attraction.id === id);
            if (markerObj) {
                map.removeLayer(markerObj.marker);
                markers = markers.filter(m => m.attraction.id !== id);
            }

            // 移除景点
            attractions.splice(index, 1);
            updateAttractionsList();
            updateRouteButton();
            clearRoute();
            saveToStorage();

            showToast('景点已删除', 'info');
        }
    }

    // 定位到景点
    function locateAttraction(id) {
        const attraction = attractions.find(a => a.id === id);
        if (attraction) {
            map.setView([attraction.lat, attraction.lng], 14);
            const markerObj = markers.find(m => m.attraction.id === id);
            if (markerObj) {
                markerObj.marker.openPopup();
            }
        }
    }

    // 更新景点列表
    function updateAttractionsList() {
        const list = document.getElementById('attractionsList');

        if (!list) return;

        if (attractions.length === 0) {
            list.innerHTML = `
                <div class="empty-state">
                    <div class="icon">📍</div>
                    <p>还没有添加任何景点</p>
                    <p style="font-size: 12px; margin-top: 5px;">点击地图或搜索来添加</p>
                </div>
            `;
            return;
        }

        list.innerHTML = attractions.map(function(attraction) {
            return `
                <li class="attraction-item">
                    <div class="icon-name">
                        <span class="icon">${attraction.icon}</span>
                        <span class="name">${escapeHtml(attraction.name)}</span>
                    </div>
                    <div class="actions">
                        <button class="action-btn locate-btn" data-id="${attraction.id}" title="定位">
                            📍
                        </button>
                        <button class="action-btn delete-btn" data-id="${attraction.id}" title="删除">
                            ✕
                        </button>
                    </div>
                </li>
            `;
        }).join('');

        // 绑定按钮事件
        list.querySelectorAll('.locate-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                locateAttraction(parseInt(this.dataset.id));
            });
        });

        list.querySelectorAll('.delete-btn').forEach(function(btn) {
            btn.addEventListener('click', function() {
                deleteAttraction(parseInt(this.dataset.id));
            });
        });
    }

    // 更新路线按钮状态
    function updateRouteButton() {
        const btn = document.getElementById('calculateRouteBtn');
        if (btn) {
            btn.disabled = attractions.length < 2;
        }
    }

    // 计算路线距离
    function calculateRoute() {
        if (attractions.length < 2) {
            showToast('至少需要2个景点才能计算路线', 'error');
            return;
        }

        // 使用 OSRM 路由服务
        const coordinates = attractions.map(a => `${a.lng},${a.lat}`).join(';');
        const url = `https://router.project-osrm.org/route/v1/driving/${coordinates}?overview=full&geometries=geojson`;

        const btn = document.getElementById('calculateRouteBtn');
        if (btn) {
            btn.innerHTML = '<span class="loading"></span> 计算中...';
            btn.disabled = true;
        }

        fetch(url)
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (btn) {
                    btn.innerHTML = '📏 计算路线距离';
                    btn.disabled = false;
                }

                if (data.code === 'Ok' && data.routes && data.routes.length > 0) {
                    const route = data.routes[0];
                    displayRoute(route.geometry, route.distance, route.duration);
                    showToast('路线计算完成', 'success');
                } else {
                    throw new Error('无法获取路线数据');
                }
            })
            .catch(function(err) {
                console.error('路线计算错误:', err);
                if (btn) {
                    btn.innerHTML = '📏 计算路线距离';
                    btn.disabled = false;
                }
                showToast('路线计算失败，使用直线距离', 'error');
                calculateStraightLineDistance();
            });
    }

    // 计算直线距离
    function calculateStraightLineDistance() {
        let totalDistance = 0;

        for (let i = 0; i < attractions.length - 1; i++) {
            const from = attractions[i];
            const to = attractions[i + 1];
            totalDistance += getHaversineDistance(from.lat, from.lng, to.lat, to.lng);
        }

        // 创建简单的直线连接
        const latlngs = attractions.map(a => [a.lat, a.lng]);
        const geometry = { type: 'LineString', coordinates: latlngs.map(ll => [ll[1], ll[0]]) };

        displayRoute(geometry, totalDistance * 1000, null);
    }

    // Haversine 公式计算距离
    function getHaversineDistance(lat1, lon1, lat2, lon2) {
        const R = 6371;
        const dLat = toRad(lat2 - lat1);
        const dLon = toRad(lon2 - lon1);
        const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
                  Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
                  Math.sin(dLon / 2) * Math.sin(dLon / 2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
        return R * c;
    }

    function toRad(deg) {
        return deg * (Math.PI / 180);
    }

    // 显示路线
    function displayRoute(geometry, distance, duration) {
        clearRoute();

        const coordinates = geometry.coordinates.map(function(coord) {
            return [coord[1], coord[0]];
        });

        routeLine = L.polyline(coordinates, {
            color: '#2196F3',
            weight: 4,
            opacity: 0.8
        }).addTo(map);

        map.fitBounds(routeLine.getBounds(), { padding: [50, 50] });

        const routeInfo = document.getElementById('routeInfo');
        if (routeInfo) {
            routeInfo.classList.add('show');
            routeInfo.innerHTML = `
                <div class="distance">${formatDistance(distance)}</div>
                <div class="detail">
                    包含 ${attractions.length} 个景点<br>
                    ${duration ? `预计时间: ${formatDuration(duration)}` : '(直线距离)'}
                </div>
            `;
        }
    }

    // 清除路线
    function clearRoute() {
        if (routeLine) {
            map.removeLayer(routeLine);
            routeLine = null;
        }
        const routeInfo = document.getElementById('routeInfo');
        if (routeInfo) {
            routeInfo.classList.remove('show');
        }
    }

    // 切换路线显示
    function toggleRouteDisplay() {
        showRoute = !showRoute;
        const btn = document.getElementById('toggleRouteBtn');
        if (btn) {
            btn.classList.toggle('active', showRoute);
        }

        if (routeLine) {
            if (showRoute) {
                routeLine.addTo(map);
            } else {
                map.removeLayer(routeLine);
            }
        }
    }

    // 格式化距离
    function formatDistance(meters) {
        if (meters < 1000) {
            return Math.round(meters) + ' 米';
        } else if (meters < 100000) {
            return (meters / 1000).toFixed(1) + ' 公里';
        } else {
            return Math.round(meters / 1000) + ' 公里';
        }
    }

    // 格式化时长
    function formatDuration(seconds) {
        const hours = Math.floor(seconds / 3600);
        const minutes = Math.floor((seconds % 3600) / 60);

        if (hours > 0) {
            return hours + '小时' + (minutes > 0 ? minutes + '分钟' : '');
        }
        return minutes + '分钟';
    }

    // 搜索地点
    function searchLocation() {
        const searchInput = document.getElementById('searchInput');
        const query = searchInput ? searchInput.value.trim() : '';
        if (!query) return;

        const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=5`;

        const searchBtn = document.getElementById('searchBtn');
        if (searchBtn) {
            searchBtn.innerHTML = '<span class="loading" style="border-color: #333; border-top-color: transparent; width: 16px; height: 16px;"></span>';
        }

        fetch(url)
            .then(function(res) { return res.json(); })
            .then(function(data) {
                if (searchBtn) {
                    searchBtn.innerHTML = '🔍';
                }
                displaySearchResults(data);
            })
            .catch(function(err) {
                console.error('搜索失败:', err);
                if (searchBtn) {
                    searchBtn.innerHTML = '🔍';
                }
                showToast('搜索失败，请检查网络连接', 'error');
            });
    }

    // 显示搜索结果
    function displaySearchResults(results) {
        const container = document.getElementById('searchResults');

        if (!container) return;

        if (results.length === 0) {
            container.innerHTML = '<p style="color: #666; font-size: 14px; text-align: center; padding: 20px;">未找到相关地点</p>';
            return;
        }

        container.innerHTML = results.map(function(result) {
            return `
                <div class="search-result-item" data-lat="${result.lat}" data-lon="${result.lon}" data-name="${result.display_name.split(',')[0]}">
                    <div class="name">${result.display_name.split(',')[0]}</div>
                    <div class="address">${truncateText(result.display_name, 60)}</div>
                </div>
            `;
        }).join('');

        container.querySelectorAll('.search-result-item').forEach(function(item) {
            item.addEventListener('click', function() {
                const lat = parseFloat(this.dataset.lat);
                const lon = parseFloat(this.dataset.lon);
                const name = this.dataset.name;

                map.setView([lat, lon], 14);

                pendingLocation = { lat, lng: lon };

                // 更新表单
                const nameInput = document.getElementById('attractionName');
                if (nameInput) {
                    nameInput.value = name;
                    nameInput.focus();
                }

                showToast('已定位到: ' + name, 'info');
            });
        });
    }

    // 定位用户位置
    function locateUser() {
        if (!navigator.geolocation) {
            showToast('您的浏览器不支持地理定位', 'error');
            return;
        }

        const btn = document.getElementById('locateBtn');
        if (btn) {
            btn.innerHTML = '<span class="loading" style="border-color: #333; border-top-color: transparent; width: 16px; height: 16px;"></span>';
        }

        navigator.geolocation.getCurrentPosition(
            function(position) {
                const lat = position.coords.latitude;
                const lon = position.coords.longitude;

                map.setView([lat, lon], 14);

                L.marker([lat, lon])
                    .addTo(map)
                    .bindPopup('📍 您的位置')
                    .openPopup();

                if (btn) btn.innerHTML = '📍';
                showToast('已定位到您的位置', 'success');
            },
            function(error) {
                if (btn) btn.innerHTML = '📍';
                let message = '定位失败';
                if (error.code === 1) message = '请允许位置访问权限';
                else if (error.code === 2) message = '无法获取位置信息';
                else if (error.code === 3) message = '定位请求超时';
                showToast(message, 'error');
            }
        );
    }

    // 清除所有景点
    function clearAll() {
        if (attractions.length === 0) {
            showToast('没有景点需要清除', 'error');
            return;
        }

        if (confirm('确定要清除所有景点吗？')) {
            markers.forEach(function(m) {
                map.removeLayer(m.marker);
            });
            markers = [];
            attractions = [];

            clearRoute();
            updateAttractionsList();
            updateRouteButton();
            localStorage.removeItem('travelMapAttractions');

            showToast('已清除所有景点', 'info');
        }
    }

    // 导出数据
    function exportData() {
        if (attractions.length === 0) {
            showToast('没有数据可导出', 'error');
            return;
        }

        const data = {
            version: '1.0',
            exportDate: new Date().toISOString(),
            attractions: attractions
        };

        try {
            const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'travel-map-' + new Date().toISOString().split('T')[0] + '.json';
            a.click();
            URL.revokeObjectURL(url);

            showToast('数据已导出', 'success');
        } catch (e) {
            console.error('导出失败:', e);
            showToast('导出失败', 'error');
        }
    }

    // 导入数据
    function importData(event) {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = function(e) {
            try {
                const data = JSON.parse(e.target.result);

                if (!data.attractions || !Array.isArray(data.attractions)) {
                    throw new Error('无效的数据格式');
                }

                // 清除现有数据
                markers.forEach(function(m) {
                    map.removeLayer(m.marker);
                });
                markers = [];
                attractions = [];
                clearRoute();

                // 添加导入的数据
                data.attractions.forEach(function(attraction) {
                    attractions.push(attraction);
                    addMarker(attraction);
                });

                updateAttractionsList();
                updateRouteButton();
                saveToStorage();

                showToast('成功导入 ' + data.attractions.length + ' 个景点', 'success');

                // 调整地图视图
                if (attractions.length > 0) {
                    const group = L.featureGroup(markers.map(function(m) { return m.marker; }));
                    map.fitBounds(group.getBounds().pad(0.1));
                }
            } catch (err) {
                console.error('导入错误:', err);
                showToast('导入失败，文件格式不正确', 'error');
            }
        };
        reader.readAsText(file);

        event.target.value = '';
    }

    // 保存到本地存储
    function saveToStorage() {
        try {
            localStorage.setItem('travelMapAttractions', JSON.stringify(attractions));
        } catch (e) {
            console.error('保存失败:', e);
        }
    }

    // 从本地存储加载
    function loadFromStorage() {
        try {
            const saved = localStorage.getItem('travelMapAttractions');
            if (saved) {
                const loadedAttractions = JSON.parse(saved);
                loadedAttractions.forEach(function(attraction) {
                    attractions.push(attraction);
                    addMarker(attraction);
                });
                updateAttractionsList();
                updateRouteButton();

                if (attractions.length > 0) {
                    const group = L.featureGroup(markers.map(function(m) { return m.marker; }));
                    map.fitBounds(group.getBounds().pad(0.1));
                }
            }
        } catch (e) {
            console.error('加载数据失败:', e);
        }
    }

    // 显示提示消息
    function showToast(message, type) {
        var oldToast = document.querySelector('.toast');
        if (oldToast) oldToast.remove();

        var toast = document.createElement('div');
        toast.className = 'toast ' + (type || 'info');
        toast.textContent = message;
        document.body.appendChild(toast);

        setTimeout(function() { toast.classList.add('show'); }, 10);

        setTimeout(function() {
            toast.classList.remove('show');
            setTimeout(function() { toast.remove(); }, 300);
        }, 3000);
    }

    // HTML 转义
    function escapeHtml(text) {
        var div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    // 截断文本
    function truncateText(text, maxLength) {
        if (text.length <= maxLength) return text;
        return text.substring(0, maxLength) + '...';
    }

    // 暴露全局函数
    window.app = {
        locateAttraction: locateAttraction,
        deleteAttraction: deleteAttraction
    };

    // DOM 加载完成后初始化
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', init);
    } else {
        init();
    }

})();
