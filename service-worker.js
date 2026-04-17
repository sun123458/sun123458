// ==================== Service Worker 缓存配置 ====================
const CACHE_NAME = 'travel-map-v1';
const CACHE_VERSION = 1;

// 需要缓存的静态资源
const STATIC_CACHE_URLS = [
    './',
    './index.html',
    './styles.css',
    './app.js',
    './manifest.json'
];

// 需要缓存的外部资源
const EXTERNAL_CACHE_URLS = [
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// ==================== 安装事件 ====================
self.addEventListener('install', (event) => {
    console.log('[Service Worker] 安装中...');

    event.waitUntil(
        caches.open(CACHE_NAME).then((cache) => {
            console.log('[Service Worker] 缓存静态资源');
            return cache.addAll(STATIC_CACHE_URLS);
        })
    );

    // 立即激活新的 Service Worker
    self.skipWaiting();
});

// ==================== 激活事件 ====================
self.addEventListener('activate', (event) => {
    console.log('[Service Worker] 激活中...');

    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    // 删除旧版本的缓存
                    if (cacheName !== CACHE_NAME && cacheName.startsWith('travel-map-')) {
                        console.log('[Service Worker] 删除旧缓存:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );

    // 立即控制所有客户端
    return self.clients.claim();
});

// ==================== 获取事件（请求拦截） ====================
self.addEventListener('fetch', (event) => {
    const { request } = event;
    const url = new URL(request.url);

    // 跳过非 HTTP 请求（如 chrome-extension, data 等）
    if (!url.protocol.startsWith('http')) {
        return;
    }

    // 跳过 API 请求
    if (url.hostname.includes('api.')) {
        return;
    }

    // 策略：静态资源使用 Cache First
    if (isStaticResource(request)) {
        event.respondWith(
            caches.match(request).then((cached) => {
                if (cached) {
                    console.log('[Service Worker] 从缓存返回:', request.url);
                    return cached;
                }
                return fetch(request).then((response) => {
                    // 缓存新的响应
                    if (response.ok) {
                        const responseClone = response.clone();
                        caches.open(CACHE_NAME).then((cache) => {
                            cache.put(request, responseClone);
                        });
                    }
                    return response;
                });
            })
        );
    }
    // 策略：地图瓦片使用 Network First
    else if (isTileRequest(request)) {
        event.respondWith(
            fetch(request).then((response) => {
                // 缓存成功的响应
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        // 限制地图瓦片缓存数量
                        cache.keys().then((keys) => {
                            if (keys.length > 100) {
                                cache.delete(keys[0]);
                            }
                        });
                        cache.put(request, responseClone);
                    });
                }
                return response;
            }).catch(() => {
                // 网络失败时尝试从缓存返回
                return caches.match(request).then((cached) => {
                    if (cached) {
                        return cached;
                    }
                    // 返回离线占位图片
                    return new Response('Offline - Tile not cached', {
                        status: 503,
                        statusText: 'Service Unavailable'
                    });
                });
            })
        );
    }
    // 策略：其他请求使用 Network First
    else {
        event.respondWith(
            fetch(request).then((response) => {
                // 缓存成功的响应
                if (response.ok) {
                    const responseClone = response.clone();
                    caches.open(CACHE_NAME).then((cache) => {
                        cache.put(request, responseClone);
                    });
                }
                return response;
            }).catch(() => {
                // 网络失败时尝试从缓存返回
                return caches.match(request);
            })
        );
    }
});

// ==================== 判断是否为静态资源 ====================
function isStaticResource(request) {
    const url = new URL(request.url);
    const pathname = url.pathname.toLowerCase();

    // 检查是否为应用内的静态文件
    if (url.hostname === location.hostname) {
        return true;
    }

    // 检查是否为外部 CSS/JS
    if (pathname.endsWith('.css') || pathname.endsWith('.js')) {
        return true;
    }

    return false;
}

// ==================== 判断是否为地图瓦片请求 ====================
function isTileRequest(request) {
    const url = new URL(request.url);
    return url.hostname.includes('tile.openstreetmap.org') ||
           url.hostname.includes('tile.osm.org') ||
           url.hostname.includes('maps.wikimedia.org');
}

// ==================== 消息处理 ====================
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => caches.delete(cacheName))
            );
        }).then(() => {
            event.ports[0].postMessage({ success: true });
        });
    }
});

// ==================== 后台同步 ====================
self.addEventListener('sync', (event) => {
    console.log('[Service Worker] 后台同步:', event.tag);
    // 这里可以处理数据同步逻辑
});

// ==================== 推送通知 ====================
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        self.registration.showNotification(data.title || '旅行地图', {
            body: data.body || '',
            icon: data.icon || '/icon-192.png',
            badge: data.badge || '/icon-192.png'
        });
    }
});

// ==================== 通知点击处理 ====================
self.addEventListener('notificationclick', (event) => {
    event.notification.close();

    event.waitUntil(
        clients.matchAll({ type: 'window' }).then((clientList) => {
            // 如果已有窗口打开，聚焦它
            for (const client of clientList) {
                if (client.url === '/' && 'focus' in client) {
                    return client.focus();
                }
            }
            // 否则打开新窗口
            if (clients.openWindow) {
                return clients.openWindow('/');
            }
        })
    );
});
