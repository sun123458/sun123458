// Service Worker 用于 PWA 离线缓存
const CACHE_NAME = 'travel-map-v1';
const STATIC_CACHE = 'travel-map-static-v1';
const DYNAMIC_CACHE = 'travel-map-dynamic-v1';

// 需要缓存的静态资源
const STATIC_ASSETS = [
    '/',
    '/index.html',
    '/styles.css',
    '/app.js',
    '/manifest.json',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css',
    'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js'
];

// 安装事件 - 缓存静态资源
self.addEventListener('install', (event) => {
    console.log('[SW] 安装中...');

    event.waitUntil(
        caches.open(STATIC_CACHE)
            .then(cache => {
                console.log('[SW] 缓存静态资源');
                return cache.addAll(STATIC_ASSETS.map(url => new Request(url, { cache: 'reload' })));
            })
            .then(() => {
                console.log('[SW] 静态资源缓存完成');
                // 立即激活新的 Service Worker
                return self.skipWaiting();
            })
            .catch(err => {
                console.error('[SW] 缓存失败:', err);
            })
    );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
    console.log('[SW] 激活中...');

    event.waitUntil(
        caches.keys()
            .then(cacheNames => {
                return Promise.all(
                    cacheNames.map(cacheName => {
                        // 保留当前版本的缓存，删除其他版本
                        if (cacheName !== STATIC_CACHE && cacheName !== DYNAMIC_CACHE) {
                            console.log('[SW] 删除旧缓存:', cacheName);
                            return caches.delete(cacheName);
                        }
                    })
                );
            })
            .then(() => {
                console.log('[SW] 激活完成');
                // 立即控制所有页面
                return self.clients.claim();
            })
    );
});

// 拦截网络请求
self.addEventListener('fetch', (event) => {
    const { url, method } = event.request;

    // 只处理 GET 请求
    if (method !== 'GET') return;

    // 跳过某些请求
    if (url.includes('chrome-extension')) return;

    // API 请求（搜索、路由）- 网络优先
    if (url.includes('nominatim.openstreetmap.org') ||
        url.includes('router.project-osrm.org')) {
        event.respondWith(
            fetch(event.request)
                .catch(() => {
                    // 网络失败时返回离线提示
                    return new Response(
                        JSON.stringify({ error: 'offline', message: '网络连接不可用' }),
                        { headers: { 'Content-Type': 'application/json' } }
                    );
                })
        );
        return;
    }

    // 地图瓦片 - 缓存优先，失败则回退到网络
    if (url.includes('tile.openstreetmap.org')) {
        event.respondWith(
            caches.match(event.request)
                .then(cached => {
                    if (cached) {
                        // 后台更新缓存
                        fetch(event.request).then(response => {
                            if (response.ok) {
                                caches.open(DYNAMIC_CACHE).then(cache => {
                                    cache.put(event.request, response.clone());
                                });
                            }
                        });
                        return cached;
                    }

                    return fetch(event.request)
                        .then(response => {
                            // 只缓存成功的响应
                            if (!response || !response.ok) {
                                return response;
                            }

                            const responseToCache = response.clone();
                            caches.open(DYNAMIC_CACHE).then(cache => {
                                cache.put(event.request, responseToCache);
                            });

                            return response;
                        })
                        .catch(() => {
                            // 返回一个简单的错误响应
                            return new Response('Offline', { status: 503 });
                        });
                })
        );
        return;
    }

    // 其他静态资源 - 缓存优先
    event.respondWith(
        caches.match(event.request)
            .then(cached => {
                if (cached) {
                    return cached;
                }

                return fetch(event.request)
                    .then(response => {
                        // 检查是否是有效的响应
                        if (!response || response.status !== 200 || response.type !== 'basic') {
                            return response;
                        }

                        const responseToCache = response.clone();
                        caches.open(DYNAMIC_CACHE).then(cache => {
                            cache.put(event.request, responseToCache);
                        });

                        return response;
                    })
                    .catch(() => {
                        // 对于 HTML 页面请求，返回离线页面
                        if (event.request.destination === 'document') {
                            return caches.match('/index.html');
                        }
                    });
            })
    );
});

// 消息处理 - 用于手动清除缓存
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'CLEAR_CACHE') {
        caches.keys().then(cacheNames => {
            return Promise.all(
                cacheNames.map(cacheName => caches.delete(cacheName))
            );
        }).then(() => {
            self.clients.matchAll().then(clients => {
                clients.forEach(client => {
                    client.postMessage({ type: 'CACHE_CLEARED' });
                });
            });
        });
    }

    // 预缓存新资源
    if (event.data && event.data.type === 'PRECACHE') {
        const url = event.data.url;
        caches.open(DYNAMIC_CACHE).then(cache => {
            fetch(url).then(response => {
                if (response.ok) {
                    cache.put(url, response);
                }
            });
        });
    }
});

// 后台同步 - 用于离线时的数据同步
self.addEventListener('sync', (event) => {
    console.log('[SW] 后台同步:', event.tag);

    if (event.tag === 'sync-attractions') {
        event.waitUntil(
            // 这里可以实现离线时保存的数据同步
            Promise.resolve()
        );
    }
});
