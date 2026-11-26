/// <reference lib="webworker" />

const CACHE_NAME = 'tymax-admin-pwa-v1';
const PRECACHE_URLS = [
	'/',
	'/manifest.webmanifest',
	'/favicon-32.png',
	'/icons/icon-192.png',
	'/icons/icon-512.png',
	'/icons/icon-maskable-192.png',
	'/icons/icon-maskable-512.png',
	'/icons/apple-touch-icon.png',
	'/icons/badge-monochrome-96.png'
];

async function applySwAppBadge(count) {
	try {
		if (typeof count === 'number' && count > 0 && typeof self.navigator?.setAppBadge === 'function') {
			await self.navigator.setAppBadge(count);
		} else if (count === 0 && typeof self.navigator?.clearAppBadge === 'function') {
			await self.navigator.clearAppBadge();
		}
	} catch {
		// Ignore badging errors on unsupported platforms
	}
}

self.addEventListener('install', (event) => {
	event.waitUntil(
		caches
			.open(CACHE_NAME)
			.then((cache) => cache.addAll(PRECACHE_URLS))
			.then(() => self.skipWaiting())
	);
});

self.addEventListener('activate', (event) => {
	event.waitUntil(
		caches
			.keys()
			.then(async (keys) => {
				for (const key of keys) {
					if (key !== CACHE_NAME) {
						await caches.delete(key);
					}
				}
				await self.clients.claim();
			})
	);
});

self.addEventListener('fetch', (event) => {
	if (event.request.method !== 'GET') return;
	const url = new URL(event.request.url);
	if (url.origin !== self.location.origin) return;
	if (url.pathname.startsWith('/api/')) return;

	event.respondWith(
		(async () => {
			try {
				const networkResponse = await fetch(event.request);
				if (networkResponse && networkResponse.status === 200) {
					const cache = await caches.open(CACHE_NAME);
					cache.put(event.request, networkResponse.clone());
				}
				return networkResponse;
			} catch {
				const cached = await caches.match(event.request);
				if (cached) return cached;
				const rootFallback = await caches.match('/');
				if (rootFallback) return rootFallback;
				throw new Error('Offline');
			}
		})()
	);
});

/**
 * Background Web Push listener — wakes up even when the PWA is closed and phone is locked.
 * Updates the installed PWA icon badge and displays a lock-screen notification.
 */
self.addEventListener('push', (event) => {
	let data = {
		title: 'Tymax Spirits Admin',
		body: 'Nová událost v Hlavním skladu nebo nová objednávka.',
		tag: 'tymax-admin-alert',
		url: '/?sekce=orders',
		badgeCount: 1,
		requireInteraction: true
	};

	if (event.data) {
		try {
			const parsed = event.data.json();
			data = { ...data, ...parsed };
		} catch {
			data.body = event.data.text() || data.body;
		}
	}

	const notificationOptions = {
		body: data.body,
		icon: '/icons/icon-192.png',
		badge: '/icons/badge-monochrome-96.png',
		tag: data.tag || 'tymax-admin-alert',
		renotify: true,
		requireInteraction: data.requireInteraction ?? true,
		vibrate: [180, 80, 240],
		data: {
			url: data.url || '/',
			badgeCount: data.badgeCount ?? 1
		},
		actions: [
			{ action: 'open', title: 'Otevřít ve velínu' },
			{ action: 'dismiss', title: 'Zavřít' }
		]
	};

	event.waitUntil(
		Promise.all([
			applySwAppBadge(data.badgeCount),
			self.registration.showNotification(data.title || 'Tymax Spirits Admin', notificationOptions)
		])
	);
});

/**
 * Handles clicks on the lock-screen / system notification.
 */
self.addEventListener('notificationclick', (event) => {
	event.notification.close();
	if (event.action === 'dismiss') return;

	const targetUrl = event.notification.data?.url || '/';

	event.waitUntil(
		(async () => {
			const windowClients = await self.clients.matchAll({
				type: 'window',
				includeUncontrolled: true
			});

			for (const client of windowClients) {
				if ('focus' in client) {
					await client.focus();
					client.postMessage({
						type: 'NOTIFICATION_CLICKED',
						url: targetUrl
					});
					return;
				}
			}

			if (self.clients.openWindow) {
				await self.clients.openWindow(targetUrl);
			}
		})()
	);
});

/**
 * Allows the active app to trigger a Service Worker notification or sync the app icon badge.
 */
self.addEventListener('message', (event) => {
	const msg = event.data;
	if (!msg) return;

	if (msg.type === 'SW_SET_BADGE') {
		event.waitUntil(applySwAppBadge(msg.count));
		return;
	}

	if (msg.type === 'SW_SHOW_NOTIFICATION') {
		const p = msg.payload || {};
		const options = {
			body: p.body || '',
			icon: '/icons/icon-192.png',
			badge: '/icons/badge-monochrome-96.png',
			tag: p.tag || `tymax-${Date.now()}`,
			renotify: true,
			requireInteraction: p.requireInteraction ?? false,
			vibrate: [160, 70, 200],
			data: { url: p.url || '/', badgeCount: p.badgeCount },
			actions: [{ action: 'open', title: 'Otevřít ve velínu' }]
		};

		event.waitUntil(
			Promise.all([
				applySwAppBadge(p.badgeCount),
				self.registration.showNotification(p.title || 'Tymax Spirits Admin', options)
			])
		);
	}
});
