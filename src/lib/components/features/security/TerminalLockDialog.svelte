<script lang="ts">
	import { adminStore } from '#lib/stores/admin.svelte.ts';
	import type { AdminUserSession } from '#lib/types/admin.ts';

	interface Props {
		adminUser?: AdminUserSession | null;
	}

	let { adminUser }: Props = $props();

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
			adminStore.resetInactivityTimer();
			adminStore.pushToast('Terminál odemčen', 'Relace obnovena pomocí vašeho PINu.', 'emerald');
		} else {
			errorMsg = 'Neplatný PIN pro odemčení relace.';
		}
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
		Rychlý zámek relace &middot; {adminUser?.displayName ?? 'Administrátor'}
	</p>

	<h1 id="lock-screen-title" class="mt-2 font-serif text-3xl font-medium text-[#f4efe8]">
		Administrace uzamčena
	</h1>

	<p class="mt-2 text-xs text-[#a89d8e]">
		Zadejte svůj 4–6místný PIN pro okamžité pokračování bez nutnosti nového přihlašování.
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
			Odemknout pomocí PINu
		</button>
	</form>

	<div class="mt-5 flex items-center justify-between border-t border-white/8 pt-4 text-xs">
		<button
			type="button"
			onclick={() => {
				adminStore.isTerminalLocked = false;
				adminStore.resetInactivityTimer();
			}}
			class="cursor-pointer text-[#8a7f72] hover:text-[#f0ca85]"
		>
			Demo odemčení ({adminStore.settings.terminalPin})
		</button>

		<form method="POST" action="/odhlaseni">
			<button type="submit" class="cursor-pointer text-[#ef6b82] hover:underline">
				Odhlásit účet →
			</button>
		</form>
	</div>
</dialog>
