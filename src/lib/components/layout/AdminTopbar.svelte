<script lang="ts">
	import { resolve } from '$app/paths';
	import { adminStore } from '#lib/stores/admin.svelte.ts';
	import { pwaStore } from '#lib/stores/pwa.svelte.ts';
	import { formatCzk } from '#lib/utils/format.ts';
</script>

<header
	class="sticky top-0 z-30 border-b border-[#d4a559]/15 bg-[#080707]/85 px-6 py-3.5 backdrop-blur-xl lg:px-8"
>
	<div class="flex flex-wrap items-center justify-between gap-4">
		<!-- Left: ⌘K Command Palette Trigger Bar -->
		<button
			type="button"
			onclick={() => (adminStore.isCommandPaletteOpen = true)}
			class="group flex w-full max-w-md cursor-pointer items-center justify-between rounded-xl border border-[#d4a559]/22 bg-[#120f0c] px-3.5 py-2 text-xs text-[#a89d8e] transition-colors hover:border-[#f0ca85]/60 hover:text-[#f4efe8] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0ca85] sm:w-80"
		>
			<span class="flex items-center gap-2.5">
				<svg
					class="h-4 w-4 text-[#d4a559]"
					viewBox="0 0 24 24"
					fill="none"
					stroke="currentColor"
					stroke-width="1.8"
					aria-hidden="true"
				>
					<circle cx="11" cy="11" r="7" />
					<path d="m20 20-3.5-3.5" />
				</svg>
				<span>Rychlý příkaz, SKU, převodka...</span>
			</span>
			<kbd
				class="rounded border border-white/12 bg-[#080707] px-2 py-0.5 font-mono text-[10px] text-[#d4a559]"
			>
				⌘K
			</kbd>
		</button>

		<!-- Right: Live Warehouse Counters & Active VAT Regime Pill -->
		<div class="flex flex-wrap items-center gap-2.5">
			<!-- Main Warehouse Pill -->
			<a
				href={resolve('/sklad')}
				class="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#110e0c] px-3 py-1.5 text-xs transition-colors hover:border-[#d4a559]/40"
			>
				<span class="text-[#8a7f72]">Hlavní sklad:</span>
				<span class="font-mono font-semibold text-[#f4efe8] tabular-nums">
					{adminStore.totalMainBottles} ks
				</span>
				<span class="hidden text-[11px] text-[#8a7f72] xl:inline">
					({formatCzk(adminStore.mainWarehouseValueCzk)})
				</span>
			</a>

			<!-- E-shop Stock Pill -->
			<a
				href={resolve('/sklad')}
				class="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-[#110e0c] px-3 py-1.5 text-xs transition-colors hover:border-[#d4a559]/40"
			>
				<span class="text-[#8a7f72]">Sklad e-shopu:</span>
				<span class="font-mono font-semibold text-emerald-400 tabular-nums">
					{adminStore.totalEshopBottles} ks
				</span>
			</a>

			<!-- PWA Push & App Icon Badge Quick Control -->
			<a
				href={resolve('/nastaveni')}
				title="Správa PWA instalace, Web Push notifikací a odznaku na ikoně"
				class="inline-flex items-center gap-2 rounded-xl border border-[#d4a559]/30 bg-[#15110e] px-3 py-1.5 text-xs text-[#f0ca85] transition-colors hover:border-[#f0ca85]"
			>
				<span
					class={`h-2 w-2 rounded-full ${
						pwaStore.pushSubscribed ? 'bg-emerald-400 shadow-[0_0_8px_#34d399]' : 'bg-[#d4a559]'
					}`}
					aria-hidden="true"
				></span>
				<span>{pwaStore.pushSubscribed ? 'Push aktivní' : 'PWA & Push'}</span>
				{#if pwaStore.currentBadgeCount > 0}
					<span
						class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#d92b4b] px-1.5 font-mono text-[10px] font-bold text-white tabular-nums"
					>
						{pwaStore.currentBadgeCount}
					</span>
				{/if}
			</a>

			<!-- Active VAT Regime Indicator & Instant Switch -->
			<button
				type="button"
				onclick={() => adminStore.toggleVatPayer()}
				title="Kliknutím přepnete režim plátce / neplátce DPH"
				class={`inline-flex cursor-pointer items-center gap-2 rounded-xl border px-3.5 py-1.5 text-xs font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0ca85] ${
					adminStore.settings.isVatPayer
						? 'border-[#d4a559]/55 bg-[#d4a559]/16 text-[#f0ca85]'
						: 'border-emerald-500/35 bg-emerald-500/12 text-emerald-300'
				}`}
			>
				<span
					class={`h-2 w-2 rounded-full ${
						adminStore.settings.isVatPayer ? 'bg-[#f0ca85]' : 'bg-emerald-400'
					}`}
					aria-hidden="true"
				></span>
				<span>
					{adminStore.settings.isVatPayer
						? `Plátce DPH (${adminStore.settings.defaultVatRatePercent} %)`
						: 'Neplátce DPH'}
				</span>
			</button>
		</div>
	</div>
</header>
