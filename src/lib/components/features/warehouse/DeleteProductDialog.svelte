<script lang="ts">
	import { adminStore } from '#lib/stores/admin.svelte.ts';

	let dialogEl: HTMLDialogElement | undefined = $state();
	let isDeleting = $state(false);

	const target = $derived(adminStore.deleteProductTarget);

	$effect(() => {
		if (!dialogEl) return;
		if (target) {
			if (!dialogEl.open) {
				dialogEl.showModal();
			}
		} else if (dialogEl.open) {
			dialogEl.close();
		}
	});

	function handleClose() {
		if (dialogEl) dialogEl.returnValue = '';
		adminStore.deleteProductTarget = null;
	}

	async function handleConfirmDelete() {
		if (!target || isDeleting) return;
		isDeleting = true;
		try {
			await adminStore.deleteProduct(target.id);
			adminStore.deleteProductTarget = null;
		} finally {
			isDeleting = false;
		}
	}
</script>

<!-- Destructive confirmation dialog: autofocus on the SAFE action (modern-web-guidance: dialog) -->
<dialog
	bind:this={dialogEl}
	closedby="any"
	aria-labelledby="delete-product-title"
	onclose={handleClose}
	class="m-auto w-[min(94vw,28rem)] rounded-3xl border border-[#b93b53]/45 bg-[#160c0e] p-6 text-[#f4efe8] shadow-[0_35px_95px_rgba(0,0,0,0.92)] sm:p-8"
>
	{#if target}
		<p class="text-[10px] font-semibold tracking-[0.22em] text-[#ef6b82] uppercase">
			Nevratná operace · Hlavní sklad + Polar.sh
		</p>

		<h1 id="delete-product-title" class="mt-2 font-serif text-2xl font-medium text-[#f4efe8]">
			Smazat produkt „{target.name}“?
		</h1>

		<p class="mt-3 text-xs leading-relaxed text-[#cfc4b4]">
			Produkt <strong class="font-mono text-[#f0ca85]">{target.sku}</strong> bude odstraněn z
			Hlavního skladu ({target.mainWarehouseStock} ks) i z e-shopu ({target.eshopStock} ks) a zároveň
			<strong>archivován/smazán na Polar.sh</strong>
			(<span class="font-mono text-[11px]">{target.polarProductId ?? '—'}</span>). Záznam o vyřazení
			zůstane uchován v auditním deníku.
		</p>

		<div class="mt-6 flex justify-end gap-2.5">
			<!-- svelte-ignore a11y_autofocus -->
			<button
				type="button"
				autofocus
				onclick={() => dialogEl?.close()}
				class="cursor-pointer rounded-xl border border-white/15 bg-[#120e0c] px-4 py-2.5 text-xs font-medium text-[#f4efe8] hover:border-[#f0ca85]"
			>
				Ponechat produkt
			</button>
			<button
				type="button"
				disabled={isDeleting}
				onclick={handleConfirmDelete}
				class="cursor-pointer rounded-xl bg-[#b93b53] px-4 py-2.5 text-xs font-semibold tracking-[0.1em] text-white uppercase hover:bg-[#cf445e]"
			>
				{isDeleting ? 'Mažu…' : 'Smazat zde i na Polar.sh'}
			</button>
		</div>
	{/if}
</dialog>
