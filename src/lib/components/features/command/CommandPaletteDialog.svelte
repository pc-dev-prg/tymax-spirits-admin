<script lang="ts">
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { adminStore } from '#lib/stores/admin.svelte.ts';

	let dialogEl: HTMLDialogElement | undefined = $state();
	let query = $state('');

	$effect(() => {
		if (!dialogEl) return;
		if (adminStore.isCommandPaletteOpen) {
			query = '';
			if (!dialogEl.open) {
				dialogEl.showModal();
			}
		} else if (dialogEl.open) {
			dialogEl.close();
		}
	});

	const matchingItems = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return adminStore.warehouseItems.slice(0, 6);
		return adminStore.warehouseItems
			.filter(
				(i) =>
					i.name.toLowerCase().includes(q) ||
					i.sku.toLowerCase().includes(q) ||
					i.origin.toLowerCase().includes(q) ||
					i.rackLocation.toLowerCase().includes(q)
			)
			.slice(0, 7);
	});

	function handleClose() {
		if (dialogEl) dialogEl.returnValue = '';
		adminStore.isCommandPaletteOpen = false;
	}

	function runAction(fn: () => void) {
		fn();
		adminStore.isCommandPaletteOpen = false;
	}
</script>

<dialog
	bind:this={dialogEl}
	closedby="any"
	aria-labelledby="cmd-palette-title"
	onclose={handleClose}
	class="m-auto w-[min(94vw,38rem)] rounded-3xl border border-[#d4a559]/35 bg-[#110e0c] p-0 text-[#f4efe8] shadow-[0_35px_90px_rgba(0,0,0,0.9)]"
>
	<div class="p-5">
		<div class="flex items-center justify-between border-b border-white/10 pb-3">
			<h1
				id="cmd-palette-title"
				class="text-[11px] font-semibold tracking-[0.22em] text-[#d4a559] uppercase"
			>
				Rychlý příkazový paletář (⌘K)
			</h1>
			<button
				type="button"
				onclick={() => dialogEl?.close()}
				class="cursor-pointer rounded-lg px-2 py-0.5 text-xs text-[#8a7f72] hover:text-[#f4efe8]"
			>
				ESC
			</button>
		</div>

		<!-- Search input -->
		<div class="mt-3">
			<label for="cmd-input" class="sr-only">Hledat příkaz nebo láhev podle SKU</label>
			<!-- svelte-ignore a11y_autofocus -->
			<input
				id="cmd-input"
				type="search"
				autofocus
				bind:value={query}
				placeholder="Zadejte SKU (např. TYM-WH-001), název lahve nebo akci..."
				class="h-11 w-full rounded-xl border border-[#d4a559]/25 bg-[#080707] px-4 text-sm text-[#f4efe8] placeholder:text-[#7c7164] focus:border-[#f0ca85] focus:outline-none"
			/>
		</div>

		<!-- Quick System Actions -->
		<div class="mt-4">
			<p class="text-[10px] tracking-[0.18em] text-[#8a7f72] uppercase">Systémové akce</p>
			<div class="mt-2 grid gap-1.5 sm:grid-cols-2">
				<button
					type="button"
					onclick={() =>
						runAction(() => {
							void goto(resolve('/sklad'));
							adminStore.isCreateProductOpen = true;
						})}
					class="flex cursor-pointer items-center justify-between rounded-xl border border-[#d4a559]/30 bg-[#19130e] px-3.5 py-2.5 text-left text-xs text-[#f0ca85] hover:border-[#f0ca85]"
				>
					<span>+ Přidat nový produkt (s fotkou + Polar.sh)</span>
					<span class="font-mono text-[10px]">NEW</span>
				</button>

				<button
					type="button"
					onclick={() => runAction(() => adminStore.toggleVatPayer())}
					class="flex cursor-pointer items-center justify-between rounded-xl border border-white/8 bg-[#16120f] px-3.5 py-2.5 text-left text-xs hover:border-[#d4a559]/45"
				>
					<span>Přepnout režim Plátce / Neplátce DPH</span>
					<span class="font-mono text-[10px] text-[#f0ca85]">DPH</span>
				</button>

				<button
					type="button"
					onclick={() => runAction(() => void goto(resolve('/sklad')))}
					class="flex cursor-pointer items-center justify-between rounded-xl border border-white/8 bg-[#16120f] px-3.5 py-2.5 text-left text-xs hover:border-[#d4a559]/45"
				>
					<span>Otevřít Hlavní sklad &amp; Převodky</span>
					<span class="font-mono text-[10px] text-[#d4a559]">Alt+2</span>
				</button>

				<button
					type="button"
					onclick={() => runAction(() => void goto(resolve('/objednavky')))}
					class="flex cursor-pointer items-center justify-between rounded-xl border border-white/8 bg-[#16120f] px-3.5 py-2.5 text-left text-xs hover:border-[#d4a559]/45"
				>
					<span>Zobrazit objednávky k expedici ({adminStore.pendingOrdersCount})</span>
					<span class="font-mono text-[10px] text-[#d4a559]">Alt+3</span>
				</button>

				<button
					type="button"
					onclick={() => runAction(() => (adminStore.isTerminalLocked = true))}
					class="flex cursor-pointer items-center justify-between rounded-xl border border-white/8 bg-[#16120f] px-3.5 py-2.5 text-left text-xs hover:border-[#b93b53]/50"
				>
					<span>Zamknout skladový terminál</span>
					<span class="font-mono text-[10px] text-[#ef6b82]">PIN</span>
				</button>
			</div>
		</div>

		<!-- Instant Bottle Stock Transfers -->
		<div class="mt-5">
			<p class="text-[10px] tracking-[0.18em] text-[#8a7f72] uppercase">
				Rychlá převodka z Hlavního skladu na E-shop (+6 ks karton)
			</p>
			<div
				class="mt-2 max-h-60 divide-y divide-white/6 overflow-y-auto rounded-xl border border-white/8 bg-[#0b0908]"
			>
				{#each matchingItems as item (item.id)}
					<div class="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs">
						<div class="min-w-0 flex-1">
							<div class="flex items-center gap-2">
								<span class="font-mono text-[10px] text-[#d4a559]">{item.sku}</span>
								<span class="truncate font-medium text-[#f4efe8]">{item.name}</span>
							</div>
							<div class="mt-0.5 text-[11px] text-[#8a7f72]">
								Hlavní sklad: <strong class="text-[#f4efe8]">{item.mainWarehouseStock} ks</strong>
								&middot; E-shop: <strong class="text-emerald-400">{item.eshopStock} ks</strong>
							</div>
						</div>

						<div class="flex items-center gap-1.5">
							<button
								type="button"
								onclick={() => runAction(() => adminStore.transferToEshop(item.id, 6))}
								class="cursor-pointer rounded-lg border border-emerald-500/35 bg-emerald-500/12 px-2.5 py-1 text-[11px] font-medium text-emerald-300 hover:bg-emerald-500/25"
							>
								+6 ks → E-shop
							</button>
							<button
								type="button"
								onclick={() =>
									runAction(() => {
										void goto(resolve('/sklad'));
										adminStore.openTransferModal(item, 'TRANSFER_TO_ESHOP');
									})}
								class="cursor-pointer rounded-lg border border-[#d4a559]/30 bg-[#17120e] px-2.5 py-1 text-[11px] text-[#f0ca85] hover:border-[#f0ca85]"
							>
								Upravit…
							</button>
						</div>
					</div>
				{/each}
			</div>
		</div>
	</div>
</dialog>
