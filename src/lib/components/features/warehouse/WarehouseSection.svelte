<script lang="ts">
	import StatusBadge from '#lib/components/ui/StatusBadge.svelte';
	import { adminStore } from '#lib/stores/admin.svelte.ts';
	import type { LedgerMovementType, ProductCategory } from '#lib/types/admin.ts';
	import { formatCategoryLabel, formatCzk } from '#lib/utils/format.ts';

	let searchQuery = $state('');
	let categoryFilter = $state<'all' | ProductCategory>('all');
	let onlyLowEshop = $state(false);
	let ledgerFilter = $state<'all' | LedgerMovementType>('all');

	const categoryTabs = $derived([
		{ id: 'all' as const, label: `Vše (${adminStore.warehouseItems.length})` },
		{
			id: 'whisky' as const,
			label: `Whisky (${adminStore.warehouseItems.filter((i) => i.category === 'whisky').length})`
		},
		{
			id: 'wine' as const,
			label: `Vína (${adminStore.warehouseItems.filter((i) => i.category === 'wine').length})`
		},
		{
			id: 'rum' as const,
			label: `Rumy (${adminStore.warehouseItems.filter((i) => i.category === 'rum').length})`
		},
		{
			id: 'craft' as const,
			label: `Giny & Koňaky (${adminStore.warehouseItems.filter((i) => i.category === 'craft').length})`
		}
	]);

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
	<!-- Top Header with + Add New Product CTA -->
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<p class="text-[11px] font-medium tracking-[0.24em] text-[#d4a559] uppercase">
				Dvoustupňové skladové hospodářství &amp; Polar.sh Sync
			</p>
			<h1 class="mt-1 font-serif text-3xl font-medium text-[#f4efe8] sm:text-4xl">
				Hlavní sklad &amp; Převodky na E-shop
			</h1>
		</div>

		<div class="flex flex-wrap items-center gap-3 text-xs">
			<div class="rounded-xl border border-[#d4a559]/25 bg-[#120f0c] px-3.5 py-2">
				<span class="text-[#8a7f72]">Hlavní sklad:</span>
				<strong class="ml-1 font-mono text-[#f0ca85] tabular-nums">
					{adminStore.totalMainBottles} ks
				</strong>
			</div>
			<div class="rounded-xl border border-emerald-500/25 bg-[#120f0c] px-3.5 py-2">
				<span class="text-[#8a7f72]">E-shop:</span>
				<strong class="ml-1 font-mono text-emerald-400 tabular-nums">
					{adminStore.totalEshopBottles} ks
				</strong>
			</div>

			<button
				type="button"
				onclick={() => (adminStore.isCreateProductOpen = true)}
				class="cursor-pointer rounded-xl bg-gradient-to-r from-[#c89643] via-[#e4b86a] to-[#c89643] px-4 py-2.5 text-xs font-semibold tracking-[0.12em] text-[#090705] uppercase shadow-[0_10px_25px_rgba(212,165,89,0.22)] hover:brightness-110"
			>
				+ Přidat produkt (+ Polar.sh)
			</button>
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
				{#each categoryTabs as tab (tab.id)}
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
				Stav zásob Hlavního skladu a skladu E-shopu s možností naskladnění, převodek, editace ceny a
				smazání
			</caption>
			<thead
				class="border-b border-white/10 bg-[#16120f] text-[10px] tracking-[0.16em] text-[#a89d8e] uppercase"
			>
				<tr>
					<th scope="col" class="px-5 py-3.5">Produkt, SKU &amp; Polar</th>
					<th scope="col" class="px-4 py-3.5 text-right">Cena (E-shop / Nákup)</th>
					<th scope="col" class="px-4 py-3.5">Poměr zásob</th>
					<th scope="col" class="px-4 py-3.5 text-right">Hlavní sklad</th>
					<th scope="col" class="px-4 py-3.5 text-right">Sklad E-shopu</th>
					<th scope="col" class="px-5 py-3.5 text-right">Naskladnit · Převodka · Cena · Smazat</th>
				</tr>
			</thead>
			<tbody class="divide-y divide-white/8">
				{#each filteredWarehouse as item (item.id)}
					{@const totalBottles = Math.max(1, item.mainWarehouseStock + item.eshopStock)}
					{@const mainPercent = Math.round((item.mainWarehouseStock / totalBottles) * 100)}
					{@const isLowEshop = item.eshopStock <= item.minEshopThreshold}
					<tr class="transition-colors hover:bg-white/[0.02]">
						<th scope="row" class="px-5 py-4 font-normal">
							<div class="flex items-center gap-3">
								{#if item.imageUrl}
									<img
										src={item.imageUrl}
										alt={item.name}
										class="h-11 w-11 shrink-0 rounded-xl border border-[#d4a559]/30 object-cover"
									/>
								{/if}
								<div>
									<div class="flex flex-wrap items-center gap-1.5">
										<span class="font-mono text-[11px] font-semibold text-[#d4a559]">
											{item.sku}
										</span>
										<span class="text-[10px] text-[#8a7f72]">
											&middot; {formatCategoryLabel(item.category)}
										</span>
										<span
											class={`rounded-md px-1.5 py-0.5 font-mono text-[9px] uppercase ${
												item.polarSyncStatus === 'synced'
													? 'bg-emerald-500/15 text-emerald-300'
													: 'bg-[#d4a559]/12 text-[#d4a559]'
											}`}
											title={`Polar ID: ${item.polarProductId ?? '—'}`}
										>
											{item.polarSyncStatus === 'synced' ? 'Polar ✓' : 'Polar Ready'}
										</span>
									</div>
									<div class="mt-0.5 text-sm font-medium text-[#f4efe8]">{item.name}</div>
									<div class="text-[11px] text-[#8a7f72]">
										{item.rackLocation} &middot; {item.origin}
									</div>
								</div>
							</div>
						</th>

						<td data-label="Cena" class="px-4 py-4 text-right tabular-nums">
							<button
								type="button"
								onclick={() => (adminStore.editPriceTarget = item)}
								title="Kliknutím upravíte cenu zde i na Polar.sh"
								class="group cursor-pointer text-right"
							>
								<div class="font-semibold text-[#f0ca85] group-hover:underline">
									{formatCzk(item.retailPriceCzk)}
								</div>
								<div class="text-[11px] text-[#8a7f72]">
									Nákup: {formatCzk(item.purchasePriceCzk)}
								</div>
							</button>
						</td>

						<td data-label="Poměr zásob" class="px-4 py-4">
							<div class="w-32">
								<div class="flex justify-between text-[10px] text-[#8a7f72] tabular-nums">
									<span>HS {mainPercent} %</span>
									<span>ES {100 - mainPercent} %</span>
								</div>
								<div class="mt-1 flex h-2 overflow-hidden rounded-full bg-white/8">
									<div class="h-full bg-[#d4a559]" style:width={`${mainPercent}%`}></div>
									<div class="h-full bg-emerald-400" style:width={`${100 - mainPercent}%`}></div>
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
									<StatusBadge tone="burgundy" dot>{item.eshopStock} ks</StatusBadge>
								{:else}
									<StatusBadge tone="emerald" dot>{item.eshopStock} ks</StatusBadge>
								{/if}
							</div>
							{#if item.reservedStock > 0}
								<div class="mt-0.5 text-[10px] text-[#8a7f72]">Rez.: {item.reservedStock} ks</div>
							{/if}
						</td>

						<td data-label="Akce" class="px-5 py-4 text-right">
							<div class="inline-flex flex-wrap items-center justify-end gap-1.5">
								<button
									type="button"
									onclick={() => adminStore.openTransferModal(item, 'RECEIPT_MAIN')}
									title="Naskladnit N kusů na Hlavní sklad"
									class="cursor-pointer rounded-lg border border-[#d4a559]/40 bg-[#d4a559]/12 px-2.5 py-1.5 text-[11px] font-medium text-[#f0ca85] transition-colors hover:bg-[#d4a559]/24"
								>
									+N Naskladnit
								</button>

								<button
									type="button"
									onclick={() => adminStore.transferToEshop(item.id, 6)}
									title="Rychlá převodka 6 ks (karton) z Hlavního skladu na E-shop"
									class="cursor-pointer rounded-lg border border-emerald-500/35 bg-emerald-500/12 px-2.5 py-1.5 text-[11px] font-medium text-emerald-300 transition-colors hover:bg-emerald-500/25"
								>
									+6 → E-shop
								</button>

								<button
									type="button"
									onclick={() => adminStore.openTransferModal(item, 'TRANSFER_TO_ESHOP')}
									title="Vlastní převodka / vratka"
									class="cursor-pointer rounded-lg border border-white/12 bg-[#17120e] px-2.5 py-1.5 text-[11px] text-[#cfc4b4] transition-colors hover:border-[#f0ca85] hover:text-[#f0ca85]"
								>
									Převodka
								</button>

								<button
									type="button"
									onclick={() => (adminStore.editPriceTarget = item)}
									title="Upravit prodejní cenu (synchronizuje se s Polar.sh)"
									class="cursor-pointer rounded-lg border border-white/12 bg-[#17120e] px-2.5 py-1.5 text-[11px] text-[#cfc4b4] transition-colors hover:border-[#f0ca85] hover:text-[#f0ca85]"
								>
									Cena
								</button>

								<button
									type="button"
									onclick={() => (adminStore.deleteProductTarget = item)}
									title="Smazat produkt zde i na Polar.sh"
									class="cursor-pointer rounded-lg border border-[#b93b53]/35 bg-[#7a2332]/20 px-2.5 py-1.5 text-[11px] text-[#f5b7c2] transition-colors hover:border-[#ef6b82] hover:bg-[#7a2332]/45"
								>
									Smazat
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
					Deník skladových pohybů a změn ({filteredLedger.length})
				</h2>
			</div>

			<div class="flex flex-wrap items-center gap-1.5" role="group" aria-label="Filtr typu pohybu">
				{#each [{ id: 'all' as const, label: 'Vše' }, { id: 'TRANSFER_TO_ESHOP' as const, label: 'Převodky na E-shop' }, { id: 'RECEIPT_MAIN' as const, label: 'Naskladnění' }, { id: 'PRODUCT_CREATED' as const, label: 'Nové produkty' }, { id: 'PRICE_UPDATED' as const, label: 'Změny cen' }, { id: 'PRODUCT_DELETED' as const, label: 'Smazané' }] as f (f.id)}
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
								<StatusBadge tone="emerald">Převodka Hlavní → E-shop</StatusBadge>
							{:else if entry.type === 'RECEIPT_MAIN'}
								<StatusBadge tone="amber">Příjemka na Hlavní sklad</StatusBadge>
							{:else if entry.type === 'PRODUCT_CREATED'}
								<StatusBadge tone="emerald">Nový produkt + Polar.sh</StatusBadge>
							{:else if entry.type === 'PRICE_UPDATED'}
								<StatusBadge tone="amber">Úprava ceny + Polar.sh</StatusBadge>
							{:else if entry.type === 'PRODUCT_DELETED'}
								<StatusBadge tone="burgundy">Smazáno + Polar.sh</StatusBadge>
							{:else if entry.type === 'RETURN_TO_MAIN'}
								<StatusBadge tone="slate">Vratka E-shop → Hlavní</StatusBadge>
							{:else}
								<StatusBadge tone="burgundy">Výdej na objednávku</StatusBadge>
							{/if}
						</div>
						<div class="font-medium text-[#f4efe8]">
							{entry.productName} <span class="font-mono text-[#d4a559]">({entry.sku})</span>
							{#if entry.quantity > 0}
								— <strong>{entry.quantity} ks</strong>
							{/if}
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
