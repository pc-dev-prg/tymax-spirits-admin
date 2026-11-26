<script lang="ts">
	import { adminStore } from '#lib/stores/admin.svelte.ts';
	import type { ProductCategory } from '#lib/types/admin.ts';
	import { formatCzk } from '#lib/utils/format.ts';

	let dialogEl: HTMLDialogElement | undefined = $state();
	let isSubmitting = $state(false);

	let name = $state('');
	let subtitle = $state('');
	let category = $state<ProductCategory>('whisky');
	let sku = $state('');
	let origin = $state('');
	let volumeMl = $state(700);
	let abvPercent = $state(46);
	let purchasePriceCzk = $state(1450);
	let retailPriceCzk = $state(2490);
	let initialMainStock = $state(12);
	let rackLocation = $state('A-06 · Příjmová zóna');
	let imagePreviewUrl = $state<string | undefined>(undefined);
	let imageFileName = $state('');

	const suggestedSku = $derived.by(() => {
		const prefixMap: Record<ProductCategory, string> = {
			whisky: 'WH',
			wine: 'WI',
			rum: 'RM',
			craft: 'CR'
		};
		const nextNum = String(adminStore.warehouseItems.length + 1).padStart(3, '0');
		return `TYM-${prefixMap[category]}-${nextNum}`;
	});

	const marginPercent = $derived(
		retailPriceCzk > 0
			? Math.round(((retailPriceCzk - purchasePriceCzk) / retailPriceCzk) * 100)
			: 0
	);

	$effect(() => {
		if (!dialogEl) return;
		if (adminStore.isCreateProductOpen) {
			name = '';
			subtitle = '';
			origin = '';
			sku = suggestedSku;
			imagePreviewUrl = undefined;
			imageFileName = '';
			if (!dialogEl.open) {
				dialogEl.showModal();
			}
		} else if (dialogEl.open) {
			dialogEl.close();
		}
	});

	function handleFileChange(event: Event) {
		const input = event.currentTarget as HTMLInputElement;
		const file = input.files?.[0];
		if (!file) return;

		imageFileName = file.name;
		const reader = new FileReader();
		reader.onload = () => {
			if (typeof reader.result === 'string') {
				imagePreviewUrl = reader.result;
			}
		};
		reader.readAsDataURL(file);
	}

	function handleClose() {
		if (dialogEl) dialogEl.returnValue = '';
		adminStore.isCreateProductOpen = false;
	}

	async function handleSubmit(event: SubmitEvent) {
		event.preventDefault();
		if (!name.trim() || isSubmitting) return;

		isSubmitting = true;
		try {
			await adminStore.createProduct({
				sku: sku.trim() || suggestedSku,
				name,
				subtitle,
				category,
				origin,
				volumeMl,
				abvPercent,
				purchasePriceCzk,
				retailPriceCzk,
				initialMainStock,
				rackLocation,
				imageUrl: imagePreviewUrl
			});
			adminStore.isCreateProductOpen = false;
		} finally {
			isSubmitting = false;
		}
	}
</script>

<dialog
	bind:this={dialogEl}
	closedby="any"
	aria-labelledby="create-product-title"
	onclose={handleClose}
	class="m-auto w-[min(95vw,44rem)] rounded-3xl border border-[#d4a559]/35 bg-[#120e0c] p-6 text-[#f4efe8] shadow-[0_35px_95px_rgba(0,0,0,0.92)] sm:p-8"
>
	<div class="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
		<div>
			<span class="text-[10px] font-semibold tracking-[0.22em] text-[#d4a559] uppercase">
				Hlavní sklad + Automatická synchronizace Polar.sh
			</span>
			<h1 id="create-product-title" class="mt-1 font-serif text-3xl font-medium text-[#f4efe8]">
				Přidat nový produkt
			</h1>
		</div>
		<button
			type="button"
			onclick={() => dialogEl?.close()}
			aria-label="Zavřít formulář nového produktu"
			class="cursor-pointer rounded-full border border-white/10 p-2 text-xs text-[#8a7f72] hover:text-[#f4efe8]"
		>
			✕
		</button>
	</div>

	<form onsubmit={handleSubmit} class="mt-6 space-y-5">
		<!-- Photo Upload Area -->
		<div class="grid gap-4 sm:grid-cols-12">
			<div class="sm:col-span-4">
				<label
					for="product-photo-input"
					class="group relative flex h-40 w-full cursor-pointer flex-col items-center justify-center overflow-hidden rounded-2xl border border-dashed border-[#d4a559]/40 bg-[#0b0908] p-3 text-center transition-colors hover:border-[#f0ca85]"
				>
					{#if imagePreviewUrl}
						<img
							src={imagePreviewUrl}
							alt="Náhled fotografie lahve"
							class="h-full w-full rounded-xl object-cover"
						/>
						<span
							class="absolute inset-x-2 bottom-2 rounded-lg bg-[#080707]/85 px-2 py-1 text-[10px] text-[#f0ca85]"
						>
							Změnit fotku
						</span>
					{:else}
						<svg
							class="h-7 w-7 text-[#d4a559]"
							viewBox="0 0 24 24"
							fill="none"
							stroke="currentColor"
							stroke-width="1.6"
							aria-hidden="true"
						>
							<path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
							<polyline points="17 8 12 3 7 8" />
							<line x1="12" y1="3" x2="12" y2="15" />
						</svg>
						<span class="mt-2 text-xs font-medium text-[#f4efe8]">Nahrát fotografii</span>
						<span class="mt-0.5 text-[10px] text-[#8a7f72]">JPG, PNG, WebP</span>
					{/if}
					<input
						id="product-photo-input"
						type="file"
						accept="image/*"
						onchange={handleFileChange}
						class="sr-only"
					/>
				</label>
				{#if imageFileName}
					<p class="mt-1.5 truncate text-center text-[10px] text-[#8a7f72]">{imageFileName}</p>
				{/if}
			</div>

			<!-- Core Identity Fields -->
			<div class="space-y-3 sm:col-span-8">
				<div>
					<label for="new-prod-name" class="block text-xs text-[#cfc4b4]">Název produktu *</label>
					<!-- svelte-ignore a11y_autofocus -->
					<input
						id="new-prod-name"
						type="text"
						required
						autofocus
						bind:value={name}
						placeholder="Např. Lagavulin Distillers Edition 16 YO"
						class="mt-1 h-10 w-full rounded-xl border border-[#d4a559]/25 bg-[#080707] px-3.5 text-xs text-[#f4efe8] placeholder:text-[#7c7164] focus:border-[#f0ca85] focus:outline-none"
					/>
				</div>

				<div>
					<label for="new-prod-subtitle" class="block text-xs text-[#cfc4b4]">
						Podtitul / Edice
					</label>
					<input
						id="new-prod-subtitle"
						type="text"
						bind:value={subtitle}
						placeholder="Např. Pedro Ximénez Cask Finish · Single Malt"
						class="mt-1 h-10 w-full rounded-xl border border-white/12 bg-[#080707] px-3.5 text-xs text-[#f4efe8] placeholder:text-[#7c7164] focus:border-[#f0ca85] focus:outline-none"
					/>
				</div>

				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="new-prod-cat" class="block text-xs text-[#cfc4b4]">Kategorie</label>
						<select
							id="new-prod-cat"
							bind:value={category}
							onchange={() => (sku = suggestedSku)}
							class="mt-1 h-10 w-full rounded-xl border border-white/12 bg-[#080707] px-3 text-xs text-[#f4efe8] focus:border-[#f0ca85] focus:outline-none"
						>
							<option value="whisky">Single Malt Whisky</option>
							<option value="wine">Archivní víno</option>
							<option value="rum">Stařený rum</option>
							<option value="craft">Gin &amp; Koňak</option>
						</select>
					</div>

					<div>
						<label for="new-prod-sku" class="block text-xs text-[#cfc4b4]">Kód SKU *</label>
						<input
							id="new-prod-sku"
							type="text"
							required
							bind:value={sku}
							class="mt-1 h-10 w-full rounded-xl border border-white/12 bg-[#080707] px-3 font-mono text-xs text-[#f0ca85] focus:border-[#f0ca85] focus:outline-none"
						/>
					</div>
				</div>
			</div>
		</div>

		<!-- Origin, Volume, ABV, Rack -->
		<div class="grid gap-3 sm:grid-cols-4">
			<div class="sm:col-span-2">
				<label for="new-prod-origin" class="block text-xs text-[#cfc4b4]">Původ / Oblast</label>
				<input
					id="new-prod-origin"
					type="text"
					bind:value={origin}
					placeholder="Skotsko · Islay"
					class="mt-1 h-10 w-full rounded-xl border border-white/12 bg-[#080707] px-3 text-xs text-[#f4efe8] focus:border-[#f0ca85] focus:outline-none"
				/>
			</div>

			<div>
				<label for="new-prod-vol" class="block text-xs text-[#cfc4b4]">Objem (ml)</label>
				<input
					id="new-prod-vol"
					type="number"
					min="50"
					step="50"
					bind:value={volumeMl}
					class="mt-1 h-10 w-full rounded-xl border border-white/12 bg-[#080707] px-3 font-mono text-xs text-[#f4efe8] focus:border-[#f0ca85] focus:outline-none"
				/>
			</div>

			<div>
				<label for="new-prod-abv" class="block text-xs text-[#cfc4b4]">Alkohol (%)</label>
				<input
					id="new-prod-abv"
					type="number"
					min="0"
					max="85"
					step="0.1"
					bind:value={abvPercent}
					class="mt-1 h-10 w-full rounded-xl border border-white/12 bg-[#080707] px-3 font-mono text-xs text-[#f4efe8] focus:border-[#f0ca85] focus:outline-none"
				/>
			</div>
		</div>

		<!-- Pricing & Initial Main Warehouse Stock -->
		<div class="grid gap-3 rounded-2xl border border-white/10 bg-[#0b0908] p-4 sm:grid-cols-4">
			<div>
				<label for="new-prod-purchase" class="block text-[11px] text-[#a89d8e]">
					Nákupní cena (Kč)
				</label>
				<input
					id="new-prod-purchase"
					type="number"
					min="0"
					bind:value={purchasePriceCzk}
					class="mt-1 h-10 w-full rounded-xl border border-white/12 bg-[#14100d] px-3 font-mono text-xs text-[#f4efe8] focus:border-[#f0ca85] focus:outline-none"
				/>
			</div>

			<div>
				<label for="new-prod-retail" class="block text-[11px] text-[#f0ca85]">
					Prodejní cena Polar (Kč) *
				</label>
				<input
					id="new-prod-retail"
					type="number"
					min="1"
					required
					bind:value={retailPriceCzk}
					class="mt-1 h-10 w-full rounded-xl border border-[#d4a559]/40 bg-[#14100d] px-3 font-mono text-xs font-semibold text-[#f0ca85] focus:border-[#f0ca85] focus:outline-none"
				/>
			</div>

			<div>
				<label for="new-prod-stock" class="block text-[11px] text-[#a89d8e]">
					Počáteční ks (Hlavní)
				</label>
				<input
					id="new-prod-stock"
					type="number"
					min="0"
					bind:value={initialMainStock}
					class="mt-1 h-10 w-full rounded-xl border border-white/12 bg-[#14100d] px-3 font-mono text-xs text-[#f4efe8] focus:border-[#f0ca85] focus:outline-none"
				/>
			</div>

			<div>
				<label for="new-prod-rack" class="block text-[11px] text-[#a89d8e]">Regál v Hlavním</label>
				<input
					id="new-prod-rack"
					type="text"
					bind:value={rackLocation}
					class="mt-1 h-10 w-full rounded-xl border border-white/12 bg-[#14100d] px-3 font-mono text-xs text-[#f4efe8] focus:border-[#f0ca85] focus:outline-none"
				/>
			</div>
		</div>

		<!-- Margin & Polar.sh Sync Summary -->
		<div class="flex flex-wrap items-center justify-between gap-3 text-xs text-[#8a7f72]">
			<div>
				Orientační marže:
				<strong class="text-emerald-400 tabular-nums">
					{marginPercent} % ({formatCzk(Math.max(0, retailPriceCzk - purchasePriceCzk))} / ks)
				</strong>
			</div>
			<div class="text-[11px] text-[#d4a559]">
				⚡ Po uložení odešle `POST /api/polar/products` (Mock dokud není POLAR_ACCESS_TOKEN)
			</div>
		</div>

		<div class="flex justify-end gap-2.5 border-t border-white/10 pt-4">
			<button
				type="button"
				onclick={() => dialogEl?.close()}
				class="cursor-pointer rounded-xl border border-white/10 px-4 py-2.5 text-xs text-[#a89d8e] hover:text-[#f4efe8]"
			>
				Zrušit
			</button>
			<button
				type="submit"
				disabled={isSubmitting}
				class="cursor-pointer rounded-xl bg-gradient-to-r from-[#c89643] via-[#e4b86a] to-[#c89643] px-5 py-2.5 text-xs font-semibold tracking-[0.12em] text-[#090705] uppercase hover:brightness-110"
			>
				{isSubmitting ? 'Ukládám & synchronizuji…' : 'Vytvořit produkt + Polar.sh'}
			</button>
		</div>
	</form>
</dialog>
