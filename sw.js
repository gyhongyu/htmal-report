// Service Worker - 完全控制缓存策略
// 强制所有请求从网络获取，禁用任何缓存

const CACHE_NAME = 'no-cache';

// 安装 Service Worker
self.addEventListener('install', (event) => {
    console.log('[SW] Installing Service Worker');
    self.skipWaiting(); // 立即激活
});

// 激活 Service Worker
self.addEventListener('activate', (event) => {
    console.log('[SW] Activating Service Worker');
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    return caches.delete(cacheName); // 删除所有旧缓存
                })
            );
        }).then(() => {
            return self.clients.claim(); // 立即接管所有页面
        })
    );
});

// 拦截所有请求，强制从网络获取
self.addEventListener('fetch', (event) => {
    event.respondWith(
        fetch(event.request, {
            cache: 'no-store',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache'
            }
        }).catch(() => {
            // 网络失败时返回错误页面
            return new Response('网络错误，请检查连接', {
                status: 503,
                statusText: 'Service Unavailable'
            });
        })
    );
});
