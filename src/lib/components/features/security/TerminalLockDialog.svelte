<script lang="ts">
	import { adminStore } from '#lib/stores/admin.svelte.ts';

	let dialogEl: HTMLDialogElement | undefined = $state();
	let pinInput = $state('');
	let errorMsg = $state('');

	$effect(() => {
		if (!dialogEl) return;
		if (adminStore.isTerminalLocked) {
			pinInput = '';
			errorMsg = '';
			if (!dialogEl.open) {
				dialogEl.showModal();
			}
		} else if (dialogEl.open) {
			dialogEl.close();
		}
	});

	function handleUnlock(event: SubmitEvent) {
		event.preventDefault();
		if (pinInput === adminStore.settings.terminalPin) {
			adminStore.isTerminalLocked = false;
			adminStore.pushToast('Terminál odemčen', 'Vítejte zpět ve velínu Tymax Spirits.', 'emerald');
		} else {
			errorMsg = 'Neplatný PIN (výchozí ukázkový PIN je 1818).';
		}
	}

	function handleInstantDemoUnlock() {
		adminStore.isTerminalLocked = false;
	}
</script>

<dialog
	bind:this={dialogEl}
	closedby="none"
	oncancel={(e) => e.preventDefault()}
	aria-labelledby="lock-screen-title"
	class="lock-dialog m-auto w-[min(92vw,26rem)] rounded-3xl border border-[#d4a559]/35 bg-[#120d0c] p-8 text-center text-[#f4efe8] shadow-[0_35px_95px_rgba(0,0,0,0.95)]"
>
	<div
		class="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d4a559]/45 bg-[#3a121b]/60 font-serif text-2xl font-semibold text-[#f0ca85]"
	>
		T
	</div>

	<p class="mt-4 text-[10px] tracking-[0.26em] text-[#d4a559] uppercase">
		Zabezpečený skladový terminál
	</p>

	<h1 id="lock-screen-title" class="mt-2 font-serif text-3xl font-medium text-[#f4efe8]">
		Terminál je uzamčen
	</h1>

	<p class="mt-2 text-xs text-[#a89d8e]">
		Pro pokračování v práci s Hlavním skladem zadejte operátorský PIN (ukázkový PIN: <strong
			class="text-[#f0ca85]"
		>
			1818
		</strong>).
	</p>

	<form onsubmit={handleUnlock} class="mt-6 space-y-3">
		<label for="terminal-pin-input" class="sr-only">Operátorský PIN</label>
		<!-- svelte-ignore a11y_autofocus -->
		<input
			id="terminal-pin-input"
			type="password"
			inputmode="numeric"
			maxlength="6"
			autofocus
			bind:value={pinInput}
			placeholder="••••"
			class="h-12 w-full rounded-xl border border-[#d4a559]/30 bg-[#080707] text-center font-mono text-xl tracking-[0.4em] text-[#f0ca85] focus:border-[#f0ca85] focus:outline-none"
		/>

		{#if errorMsg}
			<p role="alert" class="text-xs text-[#ef6b82]">{errorMsg}</p>
		{/if}

		<button
			type="submit"
			class="h-11 w-full cursor-pointer rounded-xl bg-gradient-to-r from-[#c89643] via-[#e4b86a] to-[#c89643] text-xs font-semibold tracking-[0.16em] text-[#090705] uppercase hover:brightness-110"
		>
			Odemknout terminál
		</button>

		<button
			type="button"
			onclick={handleInstantDemoUnlock}
			class="w-full cursor-pointer py-1.5 text-xs text-[#8a7f72] hover:text-[#f0ca85]"
		>
			Rychlé odemčení (Demo 1818)
		</button>
	</form>
</dialog>
