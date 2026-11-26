<script lang="ts">
	import StatusBadge from '#lib/components/ui/StatusBadge.svelte';
	import { adminStore } from '#lib/stores/admin.svelte.ts';
	import type { LedgerMovementType, ProductCategory } from '#lib/types/admin.ts';
	import { formatCategoryLabel, formatCzk } from '#lib/utils/format.ts';

	let searchQuery = $state('');
	let categoryFilter = $state<'all' | ProductCategory>('all');
	let onlyLowEshop = $state(false);
	let ledgerFilter = $state<'all' | LedgerMovementType>('all');

	const filteredWarehouse = $derived.by(() => {
		const q = searchQuery.trim().toLowerCase();
		return adminStore.warehouseItems.filter((item) => {
			if (categoryFilter !== 'all' && item.category !== categoryFilter) return false;
			if (onlyLowEshop && item.eshopStock > item.minEshopThreshold) return false;
			if (!q) return true;
			return (
				item.name.toLowerCase().includes(q) ||
				item.sku.toLowerCase().includes(q) ||
				item.origin.toLowerCase().includes(q) ||
				item.rackLocation.toLowerCase().includes(q)
			);
		});
	});

	const filteredLedger = $derived(
		ledgerFilter === 'all'
			? adminStore.ledger
			: adminStore.ledger.filter((e) => e.type === ledgerFilter)
	);
</script>

<div class="space-y-8">
	<!-- Top Header -->
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<p class="text-[11px] font-medium tracking-[0.24em] text-[#d4a559] uppercase">
				Dvoustupňové skladové hospodářství
			</p>
			<h1 class="mt-1 font-serif text-3xl font-medium text-[#f4efe8] sm:text-4xl">
				Hlavní sklad &amp; Převodky na E-shop
			</h1>
		</div>

		<div class="flex flex-wrap items-center gap-3 text-xs">
			<div class="rounded-xl border border-[#d4a559]/25 bg-[#120f0c] px-3.5 py-2">
				<span class="text-[#8a7f72]">Celkem v Hlavním skladu:</span>
				<strong class="ml-1 font-mono text-[#f0ca85] tabular-nums">
					{adminStore.totalMainBottles} ks
				</strong>
			</div>
			<div class="rounded-xl border border-emerald-500/25 bg-[#120f0c] px-3.5 py-2">
				<span class="text-[#8a7f72]">Alokováno na E-shopu:</span>
				<strong class="ml-1 font-mono text-emerald-400 tabular-nums">
					{adminStore.totalEshopBottles} ks
				</strong>
			</div>
		</div>
	</div>

	<!-- Filter Controls Bar -->
	<div class="flex flex-col gap-3 rounded-2xl border border-white/10 bg-[#110e0c] p-4">
		<div class="flex flex-wrap items-center justify-between gap-3">
			<!-- Category Filter Pills -->
			<div
				class="flex flex-wrap items-center gap-2"
				role="group"
				aria-label="Filtr kategorie skladu"
			>
				{#each [{ id: 'all' as const, label: 'Všechny položky (20)' }, { id: 'whisky' as const, label: 'Whisky (5)' }, { id: 'wine' as const, label: 'Archivní vína (6)' }, { id: 'rum' as const, label: 'Stařené rumy (5)' }, { id: 'craft' as const, label: 'Giny & Koňaky (4)' }] as tab (tab.id)}
					{@const active = categoryFilter === tab.id}
					<button
						type="button"
						aria-pressed={active}
						onclick={() => (categoryFilter = tab.id)}
						class={`inline-flex cursor-pointer items-center gap-1.5 rounded-xl border px-3.5 py-1.5 text-xs transition-colors ${
							active
								? 'border-[#f0ca85] bg-[#d4a559]/18 font-semibold text-[#f4efe8]'
								: 'border-white/10 bg-[#0b0908] text-[#a89d8e] hover:border-[#d4a559]/35'
						}`}
					>
						{#if active}
							<span class="h-1.5 w-1.5 rounded-full bg-[#f0ca85]" aria-hidden="true"></span>
						{/if}
						<span>{tab.label}</span>
					</button>
				{/each}
			</div>

			<!-- Search & Low-stock toggle -->
			<div class="flex flex-wrap items-center gap-2.5">
				<label for="wh-search" class="sr-only">Hledat podle SKU, názvu nebo regálu</label>
				<input
					id="wh-search"
					type="search"
					bind:value={searchQuery}
					placeholder="Hledat SKU, láhev, regál (např. A-01)..."
					class="h-9 w-64 rounded-xl border border-[#d4a559]/22 bg-[#080707] px-3.5 text-xs text-[#f4efe8] placeholder:text-[#7c7164] focus:border-[#f0ca85] focus:outline-none"
				/>

				<label
					class="inline-flex cursor-pointer items-center gap-2 rounded-xl border border-white/10 bg-[#0b0908] px-3 py-1.5 text-xs text-[#cfc4b4]"
				>
					<input type="checkbox" bind:checked={onlyLowEshop} class="h-3.5 w-3.5" />
					<span>Podlimitní na e-shopu ({adminStore.lowEshopStockItems.length})</span>
				</label>
			</div>
		</div>
	</div>

	<!-- Semantic Responsive Warehouse Matrix (modern-web-guidance: responsive-table) -->
	<!-- svelte-ignore a11y_no_noninteractive_tabindex -->
	<div
		tabindex="0"
		role="region"
		aria-labelledby="warehouse-table-caption"
		class="table-region rounded-3xl border border-white/10 bg-[#110e0c]"
	>
		<table class="responsive-data-table text-left text-xs">
			<caption id="warehouse-table-caption" class="sr-only">
				Stav zásob Hlavního skladu a skladu E-shopu s možností okamžitých převodek
			</caption>
			<thead
				class="border-b border-white/10 bg-[#16120f] text-[10px] tracking-[0.16em] text-[#a89d8e] uppercase"
			>
				<tr>
					<th scope="col" class="px-5 py-3.5">SKU &amp; Láhev</th>
					<th scope="col" class="px-4 py-3.5">Regál (Hlavní sklad)</th>
					<th scope="col" class="px-4 py-3.5 text-right">Cena (Nákup / E-shop)</th>
					<th scope="col" class="px-4 py-3.5">Poměr zásob (Hlavní vs. E-shop)</th>
					<th scope="col" class="px-4 py-3.5 text-right">Hlavní sklad</th>
					<th scope="col" class="px-4 py-3.5 text-right">Sklad E-shopu</th>
					<th scope="col" class="px-5 py-3.5 text-right">Rychlá převodka &amp; Příjem</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-white/8">
				{#each filteredWarehouse as item (item.id)}
					{@const totalBottles = Math.max(1, item.mainWarehouseStock + item.eshopStock)}
					{@const mainPercent = Math.round((item.mainWarehouseStock / totalBottles) * 100)}
					{@const isLowEshop = item.eshopStock <= item.minEshopThreshold}
					<tr class="transition-colors hover:bg-white/[0.02]">
						<th scope="row" class="px-5 py-4 font-normal">
							<div class="flex items-center gap-2">
								<span class="font-mono text-[11px] font-semibold text-[#d4a559]">{item.sku}</span>
								<span class="text-[10px] text-[#8a7f72]">
									&middot; {formatCategoryLabel(item.category)}
								</span>
							</div>
							<div class="mt-0.5 text-sm font-medium text-[#f4efe8]">{item.name}</div>
							<div class="text-[11px] text-[#8a7f72]">
								{item.origin} &middot; {item.abvPercent} %
							</div>
						</th>

						<td data-label="Regál" class="px-4 py-4 font-mono text-[11px] text-[#cfc4b4]">
							{item.rackLocation}
						</td>

						<td data-label="Cena" class="px-4 py-4 text-right tabular-nums">
							<div class="font-medium text-[#f4efe8]">{formatCzk(item.retailPriceCzk)}</div>
							<div class="text-[11px] text-[#8a7f72]">
								Nákup: {formatCzk(item.purchasePriceCzk)}
							</div>
						</td>

						<td data-label="Poměr zásob" class="px-4 py-4">
							<div class="w-40">
								<div class="flex justify-between text-[10px] text-[#8a7f72] tabular-nums">
									<span>HS {mainPercent} %</span>
									<span>ES {100 - mainPercent} %</span>
								</div>
								<div class="mt-1 flex h-2 overflow-hidden rounded-full bg-white/8">
									<div
										class="h-full bg-[#d4a559]"
										style:width={`${mainPercent}%`}
										title={`Hlavní sklad: ${item.mainWarehouseStock} ks`}
									></div>
									<div
										class="h-full bg-emerald-400"
										style:width={`${100 - mainPercent}%`}
										title={`Sklad e-shopu: ${item.eshopStock} ks`}
									></div>
								</div>
							</div>
						</td>

						<td
							data-label="Hlavní sklad"
							class="px-4 py-4 text-right font-mono text-sm font-semibold text-[#f0ca85] tabular-nums"
						>
							{item.mainWarehouseStock} ks
						</td>

						<td data-label="Sklad E-shopu" class="px-4 py-4 text-right tabular-nums">
							<div class="inline-flex items-center gap-1.5">
								{#if isLowEshop}
									<StatusBadge tone="burgundy" dot>{item.eshopStock} ks (Nízká)</StatusBadge>
								{:else}
									<StatusBadge tone="emerald" dot>{item.eshopStock} ks</StatusBadge>
								{/if}
							</div>
							{#if item.reservedStock > 0}
								<div class="mt-0.5 text-[10px] text-[#8a7f72]">
									Rezervace: {item.reservedStock} ks
								</div>
							{/if}
						</td>

						<td data-label="Akce" class="px-5 py-4 text-right">
							<div class="inline-flex flex-wrap items-center justify-end gap-1.5">
								<button
									type="button"
									onclick={() => adminStore.transferToEshop(item.id, 1)}
									title="Okamžitě převést 1 láhev z Hlavního skladu na E-shop"
									class="cursor-pointer rounded-lg border border-emerald-500/35 bg-emerald-500/12 px-2.5 py-1.5 text-[11px] font-medium text-emerald-300 transition-colors hover:bg-emerald-500/25"
								>
									+1 → E-shop
								</button>

								<button
									type="button"
									onclick={() => adminStore.transferToEshop(item.id, 6)}
									title="Okamžitě převést 1 karton (6 ks) z Hlavního skladu na E-shop"
									class="cursor-pointer rounded-lg border border-emerald-500/35 bg-emerald-500/12 px-2.5 py-1.5 text-[11px] font-medium text-emerald-300 transition-colors hover:bg-emerald-500/25"
								>
									+6 karton
								</button>

								<button
									type="button"
									onclick={() => adminStore.openTransferModal(item, 'TRANSFER_TO_ESHOP')}
									class="cursor-pointer rounded-lg border border-[#d4a559]/35 bg-[#17120e] px-2.5 py-1.5 text-[11px] font-medium text-[#f0ca85] transition-colors hover:border-[#f0ca85]"
								>
									Doklad…
								</button>
							</div>
						</td>
					</tr>
				{/each}
			</tbody>
		</table>
	</div>

	<!-- Immutable Warehouse Audit Ledger -->
	<section class="rounded-3xl border border-white/10 bg-[#110e0c] p-6">
		<div class="flex flex-wrap items-center justify-between gap-4">
			<div>
				<span class="text-[10px] font-semibold tracking-[0.2em] text-[#d4a559] uppercase">
					Auditovatelná historie (Immutable Ledger)
				</span>
				<h2 class="mt-1 font-serif text-2xl font-medium text-[#f4efe8]">
					Deník skladových pohybů ({filteredLedger.length})
				</h2>
			</div>

			<div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtr typu pohybu">
				{#each [{ id: 'all' as const, label: 'Všechny pohyby' }, { id: 'TRANSFER_TO_ESHOP' as const, label: 'Převodky na E-shop' }, { id: 'RECEIPT_MAIN' as const, label: 'Příjem na Hlavní sklad' }, { id: 'ORDER_DISPATCH' as const, label: 'Expedice objednávek' }, { id: 'RETURN_TO_MAIN' as const, label: 'Vratky' }] as f (f.id)}
					<button
						type="button"
						aria-pressed={ledgerFilter === f.id}
						onclick={() => (ledgerFilter = f.id)}
						class={`cursor-pointer rounded-xl border px-3 py-1.5 text-xs transition-colors ${
							ledgerFilter === f.id
								? 'border-[#f0ca85] bg-[#d4a559]/18 font-semibold text-[#f4efe8]'
								: 'border-white/8 bg-[#0b0908] text-[#a89d8e] hover:border-[#d4a559]/30'
						}`}
					>
						{f.label}
					</button>
				{/each}
			</div>
		</div>

		<div class="mt-5 divide-y divide-white/8">
			{#each filteredLedger as entry (entry.id)}
				<div class="flex flex-wrap items-center justify-between gap-4 py-3.5 text-xs">
					<div class="space-y-1">
						<div class="flex flex-wrap items-center gap-2">
							<span class="font-mono font-semibold text-[#f0ca85]">{entry.referenceCode}</span>
							<span class="text-[#8a7f72]">
								&middot; {entry.timestamp} &middot; {entry.operator}
							</span>
							{#if entry.type === 'TRANSFER_TO_ESHOP'}
								<StatusBadge tone="emerald">Převodka Hlavní sklad → E-shop</StatusBadge>
							{:else if entry.type === 'RECEIPT_MAIN'}
								<StatusBadge tone="amber">Příjemka na Hlavní sklad</StatusBadge>
							{:else if entry.type === 'RETURN_TO_MAIN'}
								<StatusBadge tone="slate">Vratka E-shop → Hlavní sklad</StatusBadge>
							{:else}
								<StatusBadge tone="burgundy">Výdej na objednávku</StatusBadge>
							{/if}
						</div>
						<div class="font-medium text-[#f4efe8]">
							{entry.productName} <span class="font-mono text-[#d4a559]">({entry.sku})</span> —
							<strong>{entry.quantity} ks</strong>
						</div>
						<div class="text-[#8a7f72]">{entry.note}</div>
					</div>

					<div
						class="rounded-xl border border-white/8 bg-[#0b0908] px-3.5 py-2 font-mono text-[11px] tabular-nums"
					>
						<div>
							Hlavní sklad: <span class="text-[#8a7f72]">{entry.mainBefore}</span> →
							<strong class="text-[#f0ca85]">{entry.mainAfter} ks</strong>
						</div>
						<div class="mt-0.5">
							Sklad E-shopu: <span class="text-[#8a7f72]">{entry.eshopBefore}</span> →
							<strong class="text-emerald-400">{entry.eshopAfter} ks</strong>
						</div>
					</div>
				</div>
			{/each}
		</div>
	</section>
</div>
