<script lang="ts">
	import { adminStore } from '#lib/stores/admin.svelte.ts';

	let dialogEl: HTMLDialogElement | undefined = $state();
	let mode = $state<'TRANSFER_TO_ESHOP' | 'RECEIPT_MAIN' | 'RETURN_TO_MAIN'>('TRANSFER_TO_ESHOP');
	let quantity = $state(6);
	let note = $state('');

	const target = $derived(adminStore.transferModalTarget);

	$effect(() => {
		if (!dialogEl) return;
		if (target) {
			mode = target.mode;
			quantity = 6;
			note = '';
			if (!dialogEl.open) {
				dialogEl.showModal();
			}
		} else if (dialogEl.open) {
			dialogEl.close();
		}
	});

	const previewAfter = $derived.by(() => {
		if (!target) return { main: 0, eshop: 0 };
		const item = target.item;
		const q = Math.max(1, quantity);
		if (mode === 'TRANSFER_TO_ESHOP') {
			const moved = Math.min(q, item.mainWarehouseStock);
			return { main: item.mainWarehouseStock - moved, eshop: item.eshopStock + moved };
		}
		if (mode === 'RECEIPT_MAIN') {
			return { main: item.mainWarehouseStock + q, eshop: item.eshopStock };
		}
		const returned = Math.min(q, item.eshopStock);
		return { main: item.mainWarehouseStock + returned, eshop: item.eshopStock - returned };
	});

	function handleClose() {
		if (dialogEl) dialogEl.returnValue = '';
		adminStore.closeTransferModal();
	}

	function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!target) return;

		const defaultNotes = {
			TRANSFER_TO_ESHOP: 'Ruční převodka z Hlavního skladu na E-shop',
			RECEIPT_MAIN: 'Příjem nové dodávky na Hlavní sklad',
			RETURN_TO_MAIN: 'Stažení zásoby z E-shopu zpět na Hlavní sklad'
		};

		const finalNote = note.trim() || defaultNotes[mode];

		if (mode === 'TRANSFER_TO_ESHOP') {
			adminStore.transferToEshop(target.item.id, quantity, finalNote);
		} else if (mode === 'RECEIPT_MAIN') {
			adminStore.receiveToMainWarehouse(target.item.id, quantity, finalNote);
		} else {
			adminStore.returnToMainWarehouse(target.item.id, quantity, finalNote);
		}

		adminStore.closeTransferModal();
	}
</script>

<dialog
	bind:this={dialogEl}
	closedby="any"
	aria-labelledby="stock-modal-title"
	onclose={handleClose}
	class="m-auto w-[min(94vw,32rem)] rounded-3xl border border-[#d4a559]/35 bg-[#120e0c] p-6 text-[#f4efe8] shadow-[0_35px_95px_rgba(0,0,0,0.9)] sm:p-8"
>
	{#if target}
		<div class="flex items-start justify-between gap-4">
			<div>
				<span class="font-mono text-xs text-[#d4a559]">{target.item.sku}</span>
				<h1 id="stock-modal-title" class="mt-1 font-serif text-2xl font-medium text-[#f4efe8]">
					{target.item.name}
				</h1>
				<p class="text-xs text-[#8a7f72]">{target.item.rackLocation}</p>
			</div>
			<button
				type="button"
				onclick={() => dialogEl?.close()}
				aria-label="Zavřít skladový doklad"
				class="cursor-pointer rounded-full border border-white/10 p-2 text-xs text-[#8a7f72] hover:text-[#f4efe8]"
			>
				✕
			</button>
		</div>

		<!-- Operation Type Selector -->
		<form onsubmit={handleSubmit} class="mt-6 space-y-5">
			<div class="grid grid-cols-3 gap-2">
				<button
					type="button"
					onclick={() => (mode = 'TRANSFER_TO_ESHOP')}
					class={`cursor-pointer rounded-xl border p-2.5 text-center text-xs transition-colors ${
						mode === 'TRANSFER_TO_ESHOP'
							? 'border-emerald-500/60 bg-emerald-500/15 font-semibold text-emerald-300'
							: 'border-white/10 bg-[#0b0908] text-[#a89d8e]'
					}`}
				>
					Převodka → E-shop
				</button>
				<button
					type="button"
					onclick={() => (mode = 'RECEIPT_MAIN')}
					class={`cursor-pointer rounded-xl border p-2.5 text-center text-xs transition-colors ${
						mode === 'RECEIPT_MAIN'
							? 'border-[#f0ca85] bg-[#d4a559]/18 font-semibold text-[#f0ca85]'
							: 'border-white/10 bg-[#0b0908] text-[#a89d8e]'
					}`}
				>
					+ Příjem na Hlavní
				</button>
				<button
					type="button"
					onclick={() => (mode = 'RETURN_TO_MAIN')}
					class={`cursor-pointer rounded-xl border p-2.5 text-center text-xs transition-colors ${
						mode === 'RETURN_TO_MAIN'
							? 'border-[#d4a559]/50 bg-white/10 font-semibold text-[#f4efe8]'
							: 'border-white/10 bg-[#0b0908] text-[#a89d8e]'
					}`}
				>
					Vratka do Hlavního
				</button>
			</div>

			<!-- Live Before -> After Preview Box -->
			<div
				class="grid grid-cols-2 gap-3 rounded-2xl border border-white/10 bg-[#0b0908] p-4 text-xs"
			>
				<div>
					<div class="text-[10px] tracking-[0.16em] text-[#8a7f72] uppercase">Hlavní sklad</div>
					<div class="mt-1 font-mono text-base tabular-nums">
						<span class="text-[#8a7f72]">{target.item.mainWarehouseStock}</span>
						<span class="mx-1 text-[#d4a559]">→</span>
						<strong class="text-[#f0ca85]">{previewAfter.main} ks</strong>
					</div>
				</div>
				<div>
					<div class="text-[10px] tracking-[0.16em] text-[#8a7f72] uppercase">Sklad E-shopu</div>
					<div class="mt-1 font-mono text-base tabular-nums">
						<span class="text-[#8a7f72]">{target.item.eshopStock}</span>
						<span class="mx-1 text-emerald-400">→</span>
						<strong class="text-emerald-400">{previewAfter.eshop} ks</strong>
					</div>
				</div>
			</div>

			<!-- Quantity Input + Presets -->
			<div>
				<label for="transfer-qty" class="block text-xs text-[#cfc4b4]">Počet lahví (ks)</label>
				<div class="mt-1.5 flex items-center gap-2">
					<!-- svelte-ignore a11y_autofocus -->
					<input
						id="transfer-qty"
						type="number"
						min="1"
						max="500"
						autofocus
						bind:value={quantity}
						class="h-10 w-28 rounded-xl border border-[#d4a559]/30 bg-[#080707] px-3 font-mono text-sm text-[#f4efe8] focus:border-[#f0ca85] focus:outline-none"
					/>
					{#each [1, 6, 12, 24] as preset (preset)}
						<button
							type="button"
							onclick={() => (quantity = preset)}
							class="cursor-pointer rounded-xl border border-white/10 bg-[#17120e] px-3 py-2 font-mono text-xs text-[#d4a559] hover:border-[#f0ca85]"
						>
							{preset} ks
						</button>
					{/each}
				</div>
			</div>

			<!-- Audit Note Input -->
			<div>
				<label for="transfer-note" class="block text-xs text-[#cfc4b4]">
					Poznámka do auditního deníku (číslo dodacího listu / důvod)
				</label>
				<input
					id="transfer-note"
					type="text"
					bind:value={note}
					placeholder="Např. Doplnění víkendové alokace / Dodací list #DL-882..."
					class="mt-1.5 h-10 w-full rounded-xl border border-[#d4a559]/25 bg-[#080707] px-3.5 text-xs text-[#f4efe8] placeholder:text-[#7c7164] focus:border-[#f0ca85] focus:outline-none"
				/>
			</div>

			<div class="flex justify-end gap-2.5 pt-2">
				<button
					type="button"
					onclick={() => dialogEl?.close()}
					class="cursor-pointer rounded-xl border border-white/10 px-4 py-2.5 text-xs text-[#a89d8e] hover:text-[#f4efe8]"
				>
					Zrušit
				</button>
				<button
					type="submit"
					class="cursor-pointer rounded-xl bg-gradient-to-r from-[#c89643] via-[#e4b86a] to-[#c89643] px-5 py-2.5 text-xs font-semibold tracking-[0.12em] text-[#090705] uppercase hover:brightness-110"
				>
					Zaúčtovat skladový pohyb
				</button>
			</div>
		</form>
	{/if}
</dialog>
