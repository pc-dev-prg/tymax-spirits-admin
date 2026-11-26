import { goto } from '$app/navigation';
import { resolve } from '$app/paths';
import { adminStore } from '#lib/stores/admin.svelte.ts';

interface BeforeInstallPromptEvent extends Event {
	prompt: () => Promise<void>;
	userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

interface NavigatorWithPwa extends Navigator {
	install?: () => Promise<void>;
}

function urlBase64ToUint8Array(base64String: string): Uint8Array {
	const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
	const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
	const rawData = window.atob(base64);
	const outputArray = new Uint8Array(rawData.length);
	for (let i = 0; i < rawData.length; ++i) {
		outputArray[i] = rawData.charCodeAt(i);
	}
	return outputArray;
}

class PwaStore {
	isStandalone = $state(false);
	supportsWebInstall = $state(false);
	hasDeferredPrompt = $state(false);
	isInstalling = $state(false);
	installStatusText = $state('');

	swReady = $state(false);
	notificationPermission = $state<NotificationPermission>('default');
	pushSubscribed = $state(false);
	pushBusy = $state(false);

	badgeSupported = $state(false);
	currentBadgeCount = $state(0);
	autoSyncBadge = $state(true);

	lockScreenCountdown = $state(0);

	private deferredInstallPrompt: BeforeInstallPromptEvent | undefined;
	private activeSubscription: PushSubscription | null = null;

	canShowInstallButton = $derived(
		!this.isStandalone && (this.supportsWebInstall || this.hasDeferredPrompt)
	);

	init() {
		if (typeof window === 'undefined') return;

		const nav = window.navigator as NavigatorWithPwa;
		this.supportsWebInstall = typeof nav.install === 'function';
		this.badgeSupported = typeof nav.setAppBadge === 'function';
		this.isStandalone =
			window.matchMedia('(display-mode: standalone)').matches ||
			(window.navigator as unknown as { standalone?: boolean }).standalone === true;

		if ('Notification' in window) {
			this.notificationPermission = Notification.permission;
		}

		// Follow modern-web-guidance `install-web-app` fallback pattern
		window.addEventListener('beforeinstallprompt', (event) => {
			event.preventDefault();
			this.deferredInstallPrompt = event as BeforeInstallPromptEvent;
			if (!this.supportsWebInstall) {
				this.hasDeferredPrompt = true;
			}
		});

		window.addEventListener('appinstalled', () => {
			this.isStandalone = true;
			this.hasDeferredPrompt = false;
			this.deferredInstallPrompt = undefined;
			this.installStatusText = 'Aplikace Tymax Admin byla úspěšně nainstalována.';
			adminStore.pushToast(
				'PWA aplikace nainstalována',
				'Tymax Admin je nyní na ploše včetně podpory odznaků a Web Push.',
				'emerald'
			);
		});

		if ('serviceWorker' in navigator) {
			navigator.serviceWorker
				.register('/sw.js', { scope: '/' })
				.then(() => navigator.serviceWorker.ready)
				.then(async (reg) => {
					this.swReady = true;
					const existingSub = await reg.pushManager.getSubscription();
					if (existingSub) {
						this.activeSubscription = existingSub;
						this.pushSubscribed = true;
					}
				})
				.catch(() => {
					// Service worker not active yet
				});

			navigator.serviceWorker.addEventListener('message', (event) => {
				const data = event.data as { type?: string; url?: string } | undefined;
				if (data?.type === 'NOTIFICATION_CLICKED' && data.url) {
					const parsed = new URL(data.url, window.location.origin);
					if (parsed.pathname === '/sklad') void goto(resolve('/sklad'));
					else if (parsed.pathname === '/objednavky') void goto(resolve('/objednavky'));
					else if (parsed.pathname === '/nastaveni') void goto(resolve('/nastaveni'));
					else void goto(resolve('/'));
				}
			});
		}
	}

	/**
	 * Triggers installation using `navigator.install()` or captured `beforeinstallprompt`
	 * while preserving transient user activation and focus (modern-web-guidance: install-web-app).
	 */
	async triggerInstall() {
		if (this.isInstalling) return;
		this.isInstalling = true;

		const nav = window.navigator as NavigatorWithPwa;

		try {
			if (this.supportsWebInstall && typeof nav.install === 'function') {
				await nav.install();
				this.installStatusText = 'Aplikace byla nainstalována nebo otevřena.';
				this.hasDeferredPrompt = false;
			} else if (this.deferredInstallPrompt) {
				const promptEvent = this.deferredInstallPrompt;
				this.deferredInstallPrompt = undefined;
				await promptEvent.prompt();
				const { outcome } = await promptEvent.userChoice;
				this.installStatusText =
					outcome === 'accepted'
						? 'Aplikace byla nainstalována.'
						: 'Instalace byla zrušena uživatelem.';
				if (!this.deferredInstallPrompt) {
					this.hasDeferredPrompt = false;
				}
			}
		} catch (error) {
			if (error instanceof DOMException && error.name === 'AbortError') {
				this.installStatusText = 'Instalace byla zrušena nebo nemohla být dokončena.';
			} else {
				this.installStatusText = 'Instalaci se nepodařilo spustit.';
			}
		} finally {
			this.isInstalling = false;
		}
	}

	/**
	 * Updates the numeric badge on the installed PWA app icon via Badging API + Service Worker.
	 */
	async setAppBadgeCount(count: number) {
		const safeCount = Math.max(0, Math.floor(count));
		this.currentBadgeCount = safeCount;

		if (typeof window === 'undefined') return;
		const nav = window.navigator as NavigatorWithPwa;

		try {
			if (safeCount > 0 && typeof nav.setAppBadge === 'function') {
				await nav.setAppBadge(safeCount);
			} else if (safeCount === 0 && typeof nav.clearAppBadge === 'function') {
				await nav.clearAppBadge();
			}
		} catch {
			// Ignore if OS blocks badging
		}

		if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
			navigator.serviceWorker.controller.postMessage({
				type: 'SW_SET_BADGE',
				count: safeCount
			});
		}
	}

	async clearAppBadge() {
		this.autoSyncBadge = false;
		await this.setAppBadgeCount(0);
		adminStore.pushToast(
			'Odznak na ikoně vymazán',
			'Badge na ikoně instalované aplikace byl vynulován.',
			'amber'
		);
	}

	/**
	 * Requests Notification permission and registers a W3C VAPID Web Push subscription
	 * so notifications arrive even when the app is closed and the phone is locked.
	 */
	async enablePushNotifications() {
		if (typeof window === 'undefined' || !('Notification' in window)) {
			adminStore.pushToast(
				'Notifikace nejsou podporovány',
				'Tento prohlížeč nepodporuje Web Notifications API.',
				'burgundy'
			);
			return false;
		}

		this.pushBusy = true;

		try {
			const perm = await Notification.requestPermission();
			this.notificationPermission = perm;

			if (perm !== 'granted') {
				adminStore.pushToast(
					'Oznámení nebyla povolena',
					'Povolte notifikace v nastavení prohlížeče nebo telefonu.',
					'burgundy'
				);
				return false;
			}

			if ('serviceWorker' in navigator) {
				const reg = await navigator.serviceWorker.ready;
				this.swReady = true;

				const res = await fetch('/api/push/subscribe');
				const { publicKey } = (await res.json()) as { publicKey: string };

				let sub = await reg.pushManager.getSubscription();
				if (!sub) {
					const appServerKey = urlBase64ToUint8Array(publicKey);
					sub = await reg.pushManager.subscribe({
						userVisibleOnly: true,
						applicationServerKey: appServerKey.buffer as ArrayBuffer
					});
				}

				this.activeSubscription = sub;
				this.pushSubscribed = true;
			}

			await this.sendPushOrSwNotification({
				title: 'Tymax Admin · Web Push aktivní',
				body: 'Notifikace ze skladu a objednávek Polar.sh budou doručovány i při zamčeném telefonu.',
				tag: 'tymax-welcome-push',
				url: '/',
				badgeCount: this.currentBadgeCount || 1
			});

			adminStore.pushToast(
				'Web Push notifikace aktivovány',
				'Odběr VAPID Web Push je aktivní i pro zavřenou aplikaci a zamčený telefon.',
				'emerald'
			);
			return true;
		} catch (err) {
			const msg = err instanceof Error ? err.message : 'Chyba při registraci Push odběru.';
			adminStore.pushToast('Upozornění Web Push', msg, 'amber');
			return false;
		} finally {
			this.pushBusy = false;
		}
	}

	/**
	 * Sends an encrypted Web Push via server endpoint `/api/push/send` (works while app is closed/locked),
	 * with automatic fallback to Service Worker registration.showNotification.
	 */
	async sendPushOrSwNotification(params: {
		title: string;
		body: string;
		tag?: string;
		url?: string;
		badgeCount?: number;
		delayMs?: number;
	}) {
		const badgeCount = params.badgeCount ?? this.currentBadgeCount;

		if (this.activeSubscription) {
			try {
				const response = await fetch('/api/push/send', {
					method: 'POST',
					headers: { 'Content-Type': 'application/json' },
					body: JSON.stringify({
						subscription: this.activeSubscription.toJSON(),
						delayMs: params.delayMs ?? 0,
						payload: {
							title: params.title,
							body: params.body,
							tag: params.tag ?? `tymax-push-${Date.now()}`,
							url: params.url ?? '/',
							badgeCount,
							requireInteraction: true
						}
					})
				});
				const result = (await response.json()) as { ok: boolean };
				if (result.ok) {
					await this.setAppBadgeCount(badgeCount);
					return true;
				}
			} catch {
				// Fall through to SW message fallback
			}
		}

		// Fallback via local Service Worker if push endpoint is unreachable offline
		if (params.delayMs && params.delayMs > 0) {
			await new Promise((r) => setTimeout(r, params.delayMs));
		}

		if ('serviceWorker' in navigator) {
			const reg = await navigator.serviceWorker.ready;
			await reg.showNotification(params.title, {
				body: params.body,
				icon: '/icons/icon-192.png',
				badge: '/icons/badge-monochrome-96.png',
				tag: params.tag ?? `tymax-sw-${Date.now()}`,
				data: { url: params.url ?? '/', badgeCount }
			});
			await this.setAppBadgeCount(badgeCount);
			return true;
		}

		return false;
	}

	/**
	 * Dispatches a 5-second delayed encrypted server Web Push so the user can close the app
	 * or lock their phone and experience the real lock-screen push notification + app icon badge!
	 */
	async triggerDelayedLockScreenTest() {
		if (this.notificationPermission !== 'granted') {
			const ok = await this.enablePushNotifications();
			if (!ok) return;
		}

		if (this.lockScreenCountdown > 0) return;
		this.lockScreenCountdown = 5;

		const timer = setInterval(() => {
			this.lockScreenCountdown = Math.max(0, this.lockScreenCountdown - 1);
			if (this.lockScreenCountdown === 0) {
				clearInterval(timer);
			}
		}, 1000);

		const nextBadge = Math.max(1, this.currentBadgeCount + 1);

		adminStore.pushToast(
			'Zamkněte telefon / minimalizujte aplikaci (5 s)',
			'Server za 5 sekund odešle šifrovanou Web Push notifikaci a zvýší odznak na ikoně.',
			'amber'
		);

		await this.sendPushOrSwNotification({
			title: 'Nová objednávka #TYM-2026-416 (9 380 Kč)',
			body: 'Zaplaceno přes Polar.sh (18+ ověřeno). K vyskladnění: Highland Smoke 18 YO + Glen Spey 21 YO.',
			tag: 'tymax-lockscreen-test',
			url: '/objednavky',
			badgeCount: nextBadge,
			delayMs: 5000
		});
	}
}

export const pwaStore = new PwaStore();
