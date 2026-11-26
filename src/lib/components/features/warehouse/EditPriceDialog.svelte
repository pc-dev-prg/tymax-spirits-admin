<script lang="ts">
	import { adminStore } from '#lib/stores/admin.svelte.ts';
	import { calculateVatSnapshot, formatCzk } from '#lib/utils/format.ts';

	let dialogEl: HTMLDialogElement | undefined = $state();
	let retailPriceCzk = $state(0);
	let purchasePriceCzk = $state(0);
	let isSaving = $state(false);

	const target = $derived(adminStore.editPriceTarget);

	const vatPreview = $derived(
		calculateVatSnapshot(
			retailPriceCzk,
			adminStore.settings.isVatPayer,
			adminStore.settings.defaultVatRatePercent
		)
	);

	const marginPercent = $derived(
		retailPriceCzk > 0
			? Math.round(((retailPriceCzk - purchasePriceCzk) / retailPriceCzk) * 100)
			: 0
	);

	$effect(() => {
		if (!dialogEl) return;
		if (target) {
			retailPriceCzk = target.retailPriceCzk;
			purchasePriceCzk = target.purchasePriceCzk;
			if (!dialogEl.open) {
				dialogEl.showModal();
			}
		} else if (dialogEl.open) {
			dialogEl.close();
		}
	});

	function handleClose() {
		if (dialogEl) dialogEl.returnValue = '';
		adminStore.editPriceTarget = null;
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!target || isSaving) return;

		isSaving = true;
		try {
			await adminStore.updateProductPrice(target.id, retailPriceCzk, purchasePriceCzk);
			adminStore.editPriceTarget = null;
		} finally {
			isSaving = false;
		}
	}
</script>

<dialog
	bind:this={dialogEl}
	closedby="any"
	aria-labelledby="edit-price-title"
	onclose={handleClose}
	class="m-auto w-[min(94vw,30rem)] rounded-3xl border border-[#d4a559]/35 bg-[#120e0c] p-6 text-[#f4efe8] shadow-[0_35px_95px_rgba(0,0,0,0.9)] sm:p-8"
>
	{#if target}
		<div class="flex items-start justify-between gap-4">
			<div>
				<span class="font-mono text-xs text-[#d4a559]">{target.sku}</span>
				<h1 id="edit-price-title" class="mt-1 font-serif text-2xl font-medium text-[#f4efe8]">
					Úprava ceny — {target.name}
				</h1>
				<p class="mt-0.5 text-[11px] text-[#8a7f72]">
					Polar ID: <span class="font-mono text-[#cfc4b4]">{target.polarProductId ?? '—'}</span>
				</p>
			</div>
			<button
				type="button"
				onclick={() => dialogEl?.close()}
				aria-label="Zavřít úpravu ceny"
				class="cursor-pointer rounded-full border border-white/10 p-2 text-xs text-[#8a7f72] hover:text-[#f4efe8]"
			>
				✕
			</button>
		</div>

		<form onsubmit={handleSubmit} class="mt-6 space-y-4">
			<div class="grid grid-cols-2 gap-3">
				<div>
					<label for="edit-retail-price" class="block text-xs text-[#f0ca85]">
						Prodejní cena E-shop &amp; Polar (Kč)
					</label>
					<!-- svelte-ignore a11y_autofocus -->
					<input
						id="edit-retail-price"
						type="number"
						min="1"
						required
						autofocus
						bind:value={retailPriceCzk}
						class="mt-1.5 h-11 w-full rounded-xl border border-[#d4a559]/45 bg-[#080707] px-3.5 font-mono text-base font-semibold text-[#f0ca85] focus:border-[#f0ca85] focus:outline-none"
					/>
				</div>

				<div>
					<label for="edit-purchase-price" class="block text-xs text-[#a89d8e]">
						Nákupní cena (Kč)
					</label>
					<input
						id="edit-purchase-price"
						type="number"
						min="0"
						bind:value={purchasePriceCzk}
						class="mt-1.5 h-11 w-full rounded-xl border border-white/12 bg-[#080707] px-3.5 font-mono text-base text-[#f4efe8] focus:border-[#f0ca85] focus:outline-none"
					/>
				</div>
			</div>

			<!-- Live Margin & VAT Preview -->
			<div class="rounded-2xl border border-white/10 bg-[#0b0908] p-4 text-xs">
				<div class="flex justify-between">
					<span class="text-[#8a7f72]">Marže po úpravě:</span>
					<strong class="text-emerald-400 tabular-nums">
						{marginPercent} % ({formatCzk(retailPriceCzk - purchasePriceCzk)})
					</strong>
				</div>
				<div class="mt-1.5 flex justify-between">
					<span class="text-[#8a7f72]">
						{adminStore.settings.isVatPayer
							? `Základ bez DPH (${adminStore.settings.defaultVatRatePercent} %):`
							: 'Režim neplátce DPH:'}
					</span>
					<span class="font-mono text-[#cfc4b4] tabular-nums">
						{adminStore.settings.isVatPayer
							? `${formatCzk(vatPreview.netCzk)} + DPH ${formatCzk(vatPreview.vatCzk)}`
							: `${formatCzk(vatPreview.totalCzk)} (konečná cena)`}
					</span>
				</div>
			</div>

			<p class="text-[11px] text-[#8a7f72]">
				⚡ Uložení automaticky aktualizuje cenu produktu na <strong>Polar.sh</strong> přes
				<code class="text-[#d4a559]">PATCH /api/polar/products</code>.
			</p>

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
					disabled={isSaving}
					class="cursor-pointer rounded-xl bg-gradient-to-r from-[#c89643] via-[#e4b86a] to-[#c89643] px-5 py-2.5 text-xs font-semibold tracking-[0.12em] text-[#090705] uppercase hover:brightness-110"
				>
					{isSaving ? 'Synchronizuji…' : 'Uložit cenu + Polar.sh'}
				</button>
			</div>
		</form>
	{/if}
</dialog>
