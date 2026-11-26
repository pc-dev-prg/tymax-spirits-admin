<script lang="ts">
	import StatusBadge from '#lib/components/ui/StatusBadge.svelte';
	import { adminStore } from '#lib/stores/admin.svelte.ts';
	import { calculateVatSnapshot, formatCzk } from '#lib/utils/format.ts';

	const revenueSnapshot = $derived(
		calculateVatSnapshot(
			adminStore.totalRevenueCzk,
			adminStore.settings.isVatPayer,
			adminStore.settings.defaultVatRatePercent
		)
	);
</script>

<div class="space-y-8">
	<!-- Section Title & Quick Action Row -->
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<p class="text-[11px] font-medium tracking-[0.24em] text-[#d4a559] uppercase">
				Centrální dispečink
			</p>
			<h1 class="mt-1 font-serif text-3xl font-medium text-[#f4efe8] sm:text-4xl">
				Velín Tymax Spirits &amp; Hlavní sklad
			</h1>
		</div>

		<div class="flex flex-wrap items-center gap-2.5">
			<button
				type="button"
				onclick={() => (adminStore.activeSection = 'warehouse')}
				class="cursor-pointer rounded-xl bg-gradient-to-r from-[#c89643] via-[#e4b86a] to-[#c89643] px-4 py-2.5 text-xs font-semibold tracking-[0.12em] text-[#090705] uppercase shadow-[0_10px_25px_rgba(212,165,89,0.2)] hover:brightness-110"
			>
				Nová převodka na E-shop →
			</button>
		</div>
	</div>

	<!-- 4 Primary KPI Cards -->
	<div class="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
		<!-- KPI 1: Main Warehouse -->
		<div class="rounded-2xl border border-[#d4a559]/22 bg-[#110e0c] p-5">
			<div class="flex items-center justify-between">
				<span class="text-[11px] tracking-[0.16em] text-[#a89d8e] uppercase">Hlavní sklad</span>
				<StatusBadge tone="amber" dot>Primární zásoba</StatusBadge>
			</div>
			<div class="mt-3 font-serif text-4xl font-semibold text-[#f4efe8] tabular-nums">
				{adminStore.totalMainBottles} <span class="text-lg font-normal text-[#8a7f72]">lahví</span>
			</div>
			<p class="mt-2 text-xs text-[#8a7f72]">
				Nákupní hodnota: <strong class="text-[#cfc4b4] tabular-nums">
					{formatCzk(adminStore.mainWarehouseValueCzk)}
				</strong>
			</p>
		</div>

		<!-- KPI 2: E-shop Allocation -->
		<div class="rounded-2xl border border-emerald-500/25 bg-[#110e0c] p-5">
			<div class="flex items-center justify-between">
				<span class="text-[11px] tracking-[0.16em] text-[#a89d8e] uppercase">Sklad E-shopu</span>
				<StatusBadge tone="emerald" dot>Veřejný prodej</StatusBadge>
			</div>
			<div class="mt-3 font-serif text-4xl font-semibold text-emerald-400 tabular-nums">
				{adminStore.totalEshopBottles} <span class="text-lg font-normal text-[#8a7f72]">lahví</span>
			</div>
			<p class="mt-2 text-xs text-[#8a7f72]">
				Prodejní hodnota: <strong class="text-[#cfc4b4] tabular-nums">
					{formatCzk(adminStore.eshopRetailValueCzk)}
				</strong>
			</p>
		</div>

		<!-- KPI 3: Orders & Polar.sh Revenue -->
		<div class="rounded-2xl border border-white/10 bg-[#110e0c] p-5">
			<div class="flex items-center justify-between">
				<span class="text-[11px] tracking-[0.16em] text-[#a89d8e] uppercase">Obrat (Polar.sh)</span>
				<StatusBadge tone="slate">{adminStore.orders.length} objednávek</StatusBadge>
			</div>
			<div class="mt-3 font-serif text-4xl font-semibold text-[#f0ca85] tabular-nums">
				{formatCzk(revenueSnapshot.totalCzk)}
			</div>
			<p class="mt-2 text-xs text-[#8a7f72]">
				{#if adminStore.settings.isVatPayer}
					Bez DPH: {formatCzk(revenueSnapshot.netCzk)} (DPH: {formatCzk(revenueSnapshot.vatCzk)})
				{:else}
					Konečný obrat (režim neplátce DPH)
				{/if}
			</p>
		</div>

		<!-- KPI 4: VAT & Tax Regime -->
		<div class="rounded-2xl border border-[#d4a559]/22 bg-[#110e0c] p-5">
			<div class="flex items-center justify-between">
				<span class="text-[11px] tracking-[0.16em] text-[#a89d8e] uppercase">Daňový režim</span>
				<button
					type="button"
					onclick={() => (adminStore.activeSection = 'settings')}
					class="cursor-pointer text-[11px] text-[#d4a559] hover:text-[#f0ca85]"
				>
					Nastavit →
				</button>
			</div>
			<div class="mt-3 font-serif text-2xl font-semibold text-[#f4efe8]">
				{adminStore.settings.isVatPayer ? 'Plátce DPH (21 %)' : 'Neplátce DPH'}
			</div>
			<p class="mt-2 text-xs text-[#8a7f72]">Historické objednávky chráněny snapshotem.</p>
		</div>
	</div>

	<!-- Out-of-the-Box Visual Dual-Warehouse Flow Bridge -->
	<section
		aria-label="Vizualizace dvoustupňového skladu"
		class="rounded-3xl border border-[#d4a559]/22 bg-gradient-to-r from-[#14100d] via-[#0f0c0a] to-[#111512] p-6"
	>
		<div class="flex flex-wrap items-center justify-between gap-2">
			<div>
				<span class="text-[10px] font-semibold tracking-[0.22em] text-[#d4a559] uppercase">
					Architektura toku zásob
				</span>
				<h2 class="mt-1 font-serif text-2xl font-medium text-[#f4efe8]">
					Dvoustupňový skladový most (Hlavní sklad → E-shop)
				</h2>
			</div>
			<span class="text-xs text-[#8a7f72]">
				Každý přesun generuje neměnný záznam v auditním deníku (Ledger)
			</span>
		</div>

		<div class="mt-6 grid items-center gap-4 lg:grid-cols-11">
			<!-- Node 1: Main Warehouse -->
			<div class="rounded-2xl border border-[#d4a559]/30 bg-[#0b0908] p-4 lg:col-span-4">
				<div class="flex items-center justify-between text-xs text-[#d4a559]">
					<span class="font-semibold tracking-wider uppercase">1. Hlavní sklad (Primární)</span>
					<span class="font-mono">14,0 °C</span>
				</div>
				<div class="mt-2 flex items-baseline justify-between">
					<span class="font-serif text-3xl font-semibold text-[#f4efe8] tabular-nums">
						{adminStore.totalMainBottles} ks
					</span>
					<span class="text-xs text-[#8a7f72]">20 skladových karet (SKU)</span>
				</div>
				<div class="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
					<div class="h-full w-4/5 rounded-full bg-gradient-to-r from-[#c89643] to-[#f0ca85]"></div>
				</div>
			</div>

			<!-- Bridge Arrow -->
			<div class="flex flex-col items-center justify-center py-2 text-center lg:col-span-3">
				<div class="text-[10px] tracking-[0.2em] text-[#f0ca85] uppercase">Auditovaná převodka</div>
				<div class="my-2 flex w-full items-center justify-center gap-1">
					<span class="h-px flex-1 bg-gradient-to-r from-[#d4a559] to-emerald-400"></span>
					<span
						class="inline-flex h-7 w-7 items-center justify-center rounded-full border border-[#d4a559]/40 bg-[#17120e] text-xs text-[#f0ca85]"
					>
						⇄
					</span>
					<span class="h-px flex-1 bg-gradient-to-r from-emerald-400 to-emerald-500"></span>
				</div>
				<button
					type="button"
					onclick={() => (adminStore.activeSection = 'warehouse')}
					class="cursor-pointer text-[11px] text-[#a89d8e] underline decoration-[#d4a559]/50 underline-offset-4 hover:text-[#f0ca85]"
				>
					Otevřít převodkový pult ({adminStore.ledger.length} záznamů)
				</button>
			</div>

			<!-- Node 2: E-shop Stock & Reservations -->
			<div class="rounded-2xl border border-emerald-500/30 bg-[#0b0908] p-4 lg:col-span-4">
				<div class="flex items-center justify-between text-xs text-emerald-400">
					<span class="font-semibold tracking-wider uppercase">2. Sklad E-shopu (Alokace)</span>
					<span>Supabase + Polar.sh</span>
				</div>
				<div class="mt-2 flex items-baseline justify-between">
					<span class="font-serif text-3xl font-semibold text-emerald-400 tabular-nums">
						{adminStore.totalEshopBottles} ks
					</span>
					<span class="text-xs text-[#a89d8e]">
						+ {adminStore.totalReservedBottles} ks v rezervacích
					</span>
				</div>
				<div class="mt-3 h-2 overflow-hidden rounded-full bg-white/8">
					<div
						class="h-full w-2/5 rounded-full bg-gradient-to-r from-emerald-500 to-emerald-300"
					></div>
				</div>
			</div>
		</div>
	</section>

	<!-- Two-Column Ergonomic Action Grid: Low E-shop Stock Replenishment + Recent Ledger -->
	<div class="grid gap-6 xl:grid-cols-12">
		<!-- Left: Low E-shop Stock Alert & 1-Click Replenishment from Main Warehouse -->
		<section class="rounded-3xl border border-white/10 bg-[#110e0c] p-6 xl:col-span-6">
			<div class="flex items-center justify-between">
				<div>
					<span class="text-[10px] font-semibold tracking-[0.2em] text-[#ef6b82] uppercase">
						Automatický hlídač alokace
					</span>
					<h2 class="mt-1 font-serif text-2xl font-medium text-[#f4efe8]">
						Lahve k doplnění na E-shop ({adminStore.lowEshopStockItems.length})
					</h2>
				</div>
				<button
					type="button"
					onclick={() => (adminStore.activeSection = 'warehouse')}
					class="cursor-pointer text-xs text-[#d4a559] hover:text-[#f0ca85]"
				>
					Celý sklad →
				</button>
			</div>

			{#if adminStore.lowEshopStockItems.length === 0}
				<p
					class="mt-6 rounded-2xl border border-emerald-500/25 bg-emerald-500/8 p-4 text-xs text-emerald-300"
				>
					✓ Všechny položky na e-shopu jsou nad minimálním limitem zásoby.
				</p>
			{:else}
				<div class="mt-4 divide-y divide-white/8">
					{#each adminStore.lowEshopStockItems as item (item.id)}
						<div class="flex flex-wrap items-center justify-between gap-3 py-3.5">
							<div>
								<div class="flex items-center gap-2">
									<span class="font-mono text-[11px] text-[#d4a559]">{item.sku}</span>
									<span class="text-sm font-medium text-[#f4efe8]">{item.name}</span>
								</div>
								<div class="mt-1 text-xs text-[#8a7f72]">
									Na e-shopu zbývá:
									<strong class="text-[#ef6b82] tabular-nums">{item.eshopStock} ks</strong>
									(limit {item.minEshopThreshold} ks) &middot; V Hlavním skladu:
									<strong class="text-[#f4efe8] tabular-nums">{item.mainWarehouseStock} ks</strong>
								</div>
							</div>

							<button
								type="button"
								onclick={() =>
									adminStore.transferToEshop(
										item.id,
										6,
										'Rychlé doplnění podlimitní zásoby z velínu'
									)}
								class="cursor-pointer rounded-xl border border-emerald-500/40 bg-emerald-500/15 px-3.5 py-2 text-xs font-semibold text-emerald-300 transition-colors hover:bg-emerald-500/25"
							>
								+6 ks z Hlavního skladu
							</button>
						</div>
					{/each}
				</div>
			{/if}
		</section>

		<!-- Right: Recent Warehouse Ledger Movements -->
		<section class="rounded-3xl border border-white/10 bg-[#110e0c] p-6 xl:col-span-6">
			<div class="flex items-center justify-between">
				<div>
					<span class="text-[10px] font-semibold tracking-[0.2em] text-[#d4a559] uppercase">
						Auditní stopa
					</span>
					<h2 class="mt-1 font-serif text-2xl font-medium text-[#f4efe8]">
						Poslední pohyby ve skladu
					</h2>
				</div>
				<button
					type="button"
					onclick={() => (adminStore.activeSection = 'warehouse')}
					class="cursor-pointer text-xs text-[#d4a559] hover:text-[#f0ca85]"
				>
					Celý deník →
				</button>
			</div>

			<div class="mt-4 divide-y divide-white/8">
				{#each adminStore.ledger.slice(0, 5) as entry (entry.id)}
					<div class="flex items-start justify-between gap-3 py-3">
						<div>
							<div class="flex flex-wrap items-center gap-2">
								<span class="font-mono text-[11px] font-semibold text-[#f0ca85]">
									{entry.referenceCode}
								</span>
								{#if entry.type === 'TRANSFER_TO_ESHOP'}
									<StatusBadge tone="emerald">Převodka → E-shop (+{entry.quantity} ks)</StatusBadge>
								{:else if entry.type === 'RECEIPT_MAIN'}
									<StatusBadge tone="amber">
										Příjem na Hlavní sklad (+{entry.quantity} ks)
									</StatusBadge>
								{:else if entry.type === 'RETURN_TO_MAIN'}
									<StatusBadge tone="slate">
										Vratka → Hlavní sklad ({entry.quantity} ks)
									</StatusBadge>
								{:else}
									<StatusBadge tone="burgundy">
										Expedice objednávky (−{entry.quantity} ks)
									</StatusBadge>
								{/if}
							</div>
							<p class="mt-1 text-xs font-medium text-[#f4efe8]">
								{entry.productName} <span class="font-mono text-[#8a7f72]">({entry.sku})</span>
							</p>
							<p class="mt-0.5 text-[11px] text-[#8a7f72]">{entry.note}</p>
						</div>

						<div class="text-right text-[11px] text-[#8a7f72] tabular-nums">
							<div>{entry.timestamp}</div>
							<div class="mt-1 font-mono text-[10px] text-[#cfc4b4]">
								HS: {entry.mainBefore}→{entry.mainAfter} | ES: {entry.eshopBefore}→{entry.eshopAfter}
							</div>
						</div>
					</div>
				{/each}
			</div>
		</section>
	</div>
</div>
