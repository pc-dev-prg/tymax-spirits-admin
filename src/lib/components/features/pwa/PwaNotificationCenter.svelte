<script lang="ts">
	import StatusBadge from '#lib/components/ui/StatusBadge.svelte';
	import { adminStore } from '#lib/stores/admin.svelte.ts';
	import { pwaStore } from '#lib/stores/pwa.svelte.ts';

	const computedTaskBadge = $derived(
		adminStore.pendingOrdersCount + adminStore.lowEshopStockItems.length
	);
</script>

<section
	class="rounded-3xl border border-[#d4a559]/35 bg-gradient-to-b from-[#15110e] to-[#0d0a09] p-6 sm:p-8"
>
	<div class="flex flex-wrap items-start justify-between gap-4 border-b border-white/10 pb-6">
		<div class="flex items-center gap-4">
			<!-- Live PWA App Icon Preview with Live Numeric Badge -->
			<div class="relative shrink-0">
				<img
					src="/icons/icon-192.png"
					alt="Ikona PWA aplikace Tymax Admin"
					width="64"
					height="64"
					class="h-16 w-16 rounded-2xl border border-[#d4a559]/40 shadow-[0_12px_30px_rgba(0,0,0,0.8)]"
				/>
				{#if pwaStore.currentBadgeCount > 0}
					<span
						class="absolute -top-2 -right-2 inline-flex h-6 min-w-6 items-center justify-center rounded-full border-2 border-[#080707] bg-[#d92b4b] px-1.5 font-mono text-xs font-bold text-white tabular-nums shadow-lg"
					>
						{pwaStore.currentBadgeCount}
					</span>
				{/if}
			</div>

			<div>
				<span class="text-[10px] font-semibold tracking-[0.22em] text-[#d4a559] uppercase">
					Progressive Web App &amp; Web Push (RFC 8291 VAPID)
				</span>
				<h2 class="mt-1 font-serif text-2xl font-medium text-[#f4efe8] sm:text-3xl">
					Mobilní &amp; Desktop PWA, Notifikace na zamčený telefon a Odznak
				</h2>
			</div>
		</div>

		<div class="flex flex-wrap items-center gap-2">
			{#if pwaStore.isStandalone}
				<StatusBadge tone="emerald" dot>Běží jako instalovaná PWA</StatusBadge>
			{:else}
				<StatusBadge tone="amber" dot>Webový režim (připraveno k instalaci)</StatusBadge>
			{/if}

			{#if pwaStore.pushSubscribed}
				<StatusBadge tone="emerald" dot>Web Push odběr aktivní</StatusBadge>
			{:else}
				<StatusBadge tone="slate">Web Push čeká na povolení</StatusBadge>
			{/if}
		</div>
	</div>

	<div class="mt-6 grid gap-6 lg:grid-cols-12">
		<!-- Left Card: Web Push Notifications (Works Closed & Phone Locked) -->
		<div class="space-y-4 rounded-2xl border border-white/10 bg-[#0b0908] p-5 lg:col-span-7">
			<div class="flex items-center justify-between">
				<h3 class="text-xs font-semibold tracking-[0.18em] text-[#f0ca85] uppercase">
					1. Web Push notifikace (i při zavřené aplikaci a zamčeném telefonu)
				</h3>
				<span class="font-mono text-[11px] text-[#8a7f72]">
					Stav: {pwaStore.notificationPermission}
				</span>
			</div>

			<p class="text-xs leading-relaxed text-[#a89d8e]">
				Využívá nativní Service Worker a šifrovaný protokol <strong>
					W3C Web Push (VAPID P-256)
				</strong>. Po povolení odběru přijímá telefon (iOS 16.4+ PWA na ploše, Android, macOS,
				Windows) okamžité notifikace o nových objednávkách z Polar.sh a podlimitních zásobách i ve
				chvíli, kdy je aplikace zcela ukončená a obrazovka telefonu zamknutá.
			</p>

			<div class="flex flex-wrap gap-3 pt-1">
				<button
					type="button"
					onclick={() => pwaStore.enablePushNotifications()}
					disabled={pwaStore.pushBusy}
					class="cursor-pointer rounded-xl bg-gradient-to-r from-[#c89643] via-[#e4b86a] to-[#c89643] px-4 py-2.5 text-xs font-semibold tracking-[0.12em] text-[#090705] uppercase shadow-[0_10px_25px_rgba(212,165,89,0.2)] hover:brightness-110"
				>
					{#if pwaStore.pushSubscribed}
						✓ Obnovit / Otestovat Web Push odběr
					{:else}
						Aktivovat Web Push notifikace
					{/if}
				</button>

				<button
					type="button"
					onclick={() => pwaStore.triggerDelayedLockScreenTest()}
					class="cursor-pointer rounded-xl border border-emerald-500/45 bg-emerald-500/14 px-4 py-2.5 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/25"
				>
					{#if pwaStore.lockScreenCountdown > 0}
						⏱ Zamkněte telefon… odesílám za {pwaStore.lockScreenCountdown} s
					{:else}
						📱 Test na zamčeném telefonu (odpočet 5 s)
					{/if}
				</button>

				<button
					type="button"
					onclick={() =>
						pwaStore.sendPushOrSwNotification({
							title: 'Hlavní sklad · Podlimitní zásoba na E-shopu',
							body: 'Kansai Mizunara Oak Reserve klesla na 2 ks. Doporučená převodka: +6 ks z regálu A-03.',
							tag: 'tymax-stock-alert',
							url: '/?sekce=warehouse',
							badgeCount: pwaStore.currentBadgeCount + 1
						})}
					class="cursor-pointer rounded-xl border border-white/12 bg-[#16120f] px-3.5 py-2.5 text-xs text-[#cfc4b4] hover:border-[#d4a559]/45 hover:text-[#f0ca85]"
				>
					Simulovat skladový poplach
				</button>
			</div>
		</div>

		<!-- Right Card: App Icon Badging API & PWA Installation -->
		<div class="space-y-4 rounded-2xl border border-white/10 bg-[#0b0908] p-5 lg:col-span-5">
			<div class="flex items-center justify-between">
				<h3 class="text-xs font-semibold tracking-[0.18em] text-[#f0ca85] uppercase">
					2. Odznak na ikoně aplikace (App Badge)
				</h3>
				<span class="font-mono text-xs font-bold text-[#f0ca85] tabular-nums">
					Odznak: {pwaStore.currentBadgeCount}
				</span>
			</div>

			<p class="text-xs leading-relaxed text-[#a89d8e]">
				Číselný odznak na ikoně nainstalované PWA aplikace (`navigator.setAppBadge`) se automaticky
				aktualizuje jak při práci v aplikaci, tak přímo na pozadí uvnitř Service Workeru při přijetí
				Web Push zprávy.
			</p>

			<label
				class="flex cursor-pointer items-center gap-2.5 rounded-xl border border-white/8 bg-[#120f0c] p-3 text-xs text-[#cfc4b4]"
			>
				<input
					type="checkbox"
					checked={pwaStore.autoSyncBadge}
					onchange={(e) => {
						pwaStore.autoSyncBadge = e.currentTarget.checked;
						if (pwaStore.autoSyncBadge) {
							void pwaStore.setAppBadgeCount(computedTaskBadge);
						}
					}}
					class="h-4 w-4"
				/>
				<span>
					Automaticky synchronizovat odznak s úkoly ({computedTaskBadge} = objednávky + podlimitní sklad)
				</span>
			</label>

			<div class="flex flex-wrap items-center gap-2">
				<button
					type="button"
					onclick={() => {
						pwaStore.autoSyncBadge = false;
						void pwaStore.setAppBadgeCount(pwaStore.currentBadgeCount + 1);
					}}
					class="cursor-pointer rounded-xl border border-[#d4a559]/35 bg-[#17120e] px-3 py-2 text-xs font-medium text-[#f0ca85] hover:border-[#f0ca85]"
				>
					+1 na odznak ikony
				</button>

				<button
					type="button"
					onclick={() => {
						pwaStore.autoSyncBadge = true;
						void pwaStore.setAppBadgeCount(computedTaskBadge);
					}}
					class="cursor-pointer rounded-xl border border-white/12 bg-[#14100d] px-3 py-2 text-xs text-[#cfc4b4] hover:border-[#d4a559]/40"
				>
					Nastavit podle úkolů ({computedTaskBadge})
				</button>

				<button
					type="button"
					onclick={() => pwaStore.clearAppBadge()}
					class="cursor-pointer rounded-xl border border-white/10 px-3 py-2 text-xs text-[#8a7f72] hover:text-[#f4efe8]"
				>
					Vymazat (0)
				</button>
			</div>

			<!-- Native Web Install / beforeinstallprompt Button (hidden when unsupported per modern-web-guidance: install-web-app) -->
			<div class="border-t border-white/8 pt-3">
				<button
					type="button"
					hidden={!pwaStore.canShowInstallButton}
					aria-disabled={pwaStore.isInstalling ? 'true' : undefined}
					onclick={() => pwaStore.triggerInstall()}
					class="w-full cursor-pointer rounded-xl bg-gradient-to-r from-[#c89643] via-[#e4b86a] to-[#c89643] px-4 py-2.5 text-xs font-semibold tracking-[0.14em] text-[#090705] uppercase hover:brightness-110"
				>
					📲 Nainstalovat aplikaci Tymax Admin na zařízení
				</button>

				{#if pwaStore.installStatusText}
					<p role="status" class="mt-2 text-xs text-[#f0ca85]">
						{pwaStore.installStatusText}
					</p>
				{/if}
			</div>
		</div>
	</div>
</section>
