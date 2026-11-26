<script lang="ts">
	import { enhance } from '$app/forms';
	import type { ActionData } from './$types';

	let { form }: { form: ActionData } = $props();

	let username = $state('');
	let password = $state('');
	let quickPin = $state('1818');
	let showPassword = $state(false);
	let isSubmitting = $state(false);

	function fillDemoCredentials() {
		username = 'admin';
		password = 'Tymax2026!';
		quickPin = '1818';
	}
</script>

<svelte:head>
	<title>Přihlášení — Tymax Spirits Admin</title>
</svelte:head>

<div
	class="relative flex min-h-svh items-center justify-center overflow-hidden bg-[#080707] px-6 py-12 text-[#f4efe8]"
>
	<!-- Ambient burgundy & liquid-gold glow -->
	<div
		class="pointer-events-none absolute top-1/4 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[radial-gradient(circle,rgba(212,165,89,0.16)_0%,rgba(122,35,50,0.12)_45%,transparent_72%)] blur-3xl"
		aria-hidden="true"
	></div>

	<div
		class="relative z-10 w-full max-w-md rounded-3xl border border-[#d4a559]/30 bg-gradient-to-b from-[#15110e] to-[#0b0908] p-8 shadow-[0_35px_95px_rgba(0,0,0,0.9)] sm:p-10"
	>
		<!-- Brand Crest -->
		<div class="flex flex-col items-center text-center">
			<div
				class="flex h-14 w-14 items-center justify-center rounded-2xl border border-[#d4a559]/45 bg-gradient-to-br from-[#3a121b] to-[#120b0d] font-serif text-2xl font-semibold text-[#f0ca85] shadow-[0_10px_25px_rgba(0,0,0,0.7)]"
			>
				T
			</div>
			<p class="mt-4 text-[10px] font-semibold tracking-[0.26em] text-[#d4a559] uppercase">
				Zabezpečený přístup · Scrypt Hash Auth
			</p>
			<h1 class="mt-1.5 font-serif text-3xl font-medium text-[#f4efe8]">Tymax Spirits Admin</h1>
			<p class="mt-1.5 text-xs text-[#a89d8e]">
				Přihlaste se ke správě Hlavního skladu, převodek a e-shopu.
			</p>
		</div>

		<!-- Sign-in Form (modern-web-guidance: autofill-sign-in-form) -->
		<form
			method="POST"
			use:enhance={() => {
				isSubmitting = true;
				return async ({ update }) => {
					isSubmitting = false;
					await update();
				};
			}}
			class="mt-7 space-y-4"
		>
			{#if form?.error}
				<div
					role="alert"
					class="rounded-2xl border border-[#b93b53]/45 bg-[#7a2332]/25 px-4 py-3 text-xs text-[#f7cfd6]"
				>
					{form.error}
				</div>
			{/if}

			<div>
				<label for="username" class="block text-xs font-medium text-[#cfc4b4]">
					Uživatelské jméno
				</label>
				<input
					id="username"
					name="username"
					type="text"
					autocomplete="username"
					spellcheck="false"
					autocorrect="off"
					autocapitalize="none"
					enterkeyhint="next"
					required
					bind:value={username}
					placeholder="admin"
					class="mt-1.5 h-11 w-full rounded-xl border border-[#d4a559]/25 bg-[#080707] px-3.5 text-sm text-[#f4efe8] placeholder:text-[#6e6459] focus:border-[#f0ca85] focus:outline-none"
				/>
			</div>

			<div>
				<div class="flex items-center justify-between">
					<label for="current-password" class="block text-xs font-medium text-[#cfc4b4]">
						Heslo
					</label>
					<button
						type="button"
						onclick={() => (showPassword = !showPassword)}
						class="cursor-pointer text-[11px] text-[#d4a559] hover:text-[#f0ca85]"
					>
						{showPassword ? 'Skrýt heslo' : 'Zobrazit heslo'}
					</button>
				</div>
				<input
					id="current-password"
					name="password"
					type={showPassword ? 'text' : 'password'}
					autocomplete="current-password"
					enterkeyhint="next"
					required
					bind:value={password}
					placeholder="••••••••••"
					class="mt-1.5 h-11 w-full rounded-xl border border-[#d4a559]/25 bg-[#080707] px-3.5 text-sm text-[#f4efe8] placeholder:text-[#6e6459] focus:border-[#f0ca85] focus:outline-none"
				/>
			</div>

			<!-- Optional Quick-Lock PIN Choice on Login -->
			<div class="rounded-2xl border border-white/8 bg-[#0b0908] p-3.5">
				<div class="flex items-center justify-between">
					<label for="quick-pin" class="block text-xs font-medium text-[#f0ca85]">
						Váš PIN pro rychlé zamykání při neaktivitě
					</label>
					<span class="font-mono text-[10px] text-[#8a7f72]">4–6 číslic</span>
				</div>
				<p class="mt-0.5 text-[11px] text-[#8a7f72]">
					Slouží k odemčení obrazovky skladu bez nutnosti nového přihlašování.
				</p>
				<input
					id="quick-pin"
					name="quickPin"
					type="password"
					inputmode="numeric"
					pattern="[0-9]+"
					minlength="4"
					maxlength="6"
					enterkeyhint="done"
					bind:value={quickPin}
					placeholder="1818"
					class="mt-2 h-9 w-36 rounded-xl border border-[#d4a559]/30 bg-[#14100d] px-3 text-center font-mono text-sm tracking-[0.35em] text-[#f0ca85] focus:border-[#f0ca85] focus:outline-none"
				/>
			</div>

			<button
				type="submit"
				disabled={isSubmitting}
				class="h-12 w-full cursor-pointer rounded-xl bg-gradient-to-r from-[#c89643] via-[#e4b86a] to-[#c89643] text-xs font-semibold tracking-[0.16em] text-[#090705] uppercase shadow-[0_12px_30px_rgba(212,165,89,0.22)] hover:brightness-110"
			>
				{isSubmitting ? 'Ověřuji hash hesla…' : 'Přihlásit se do administrace'}
			</button>
		</form>

		<!-- Demo Account Box -->
		<div class="mt-6 rounded-2xl border border-[#d4a559]/22 bg-[#0e0b09] p-4">
			<div class="flex items-center justify-between gap-2">
				<div>
					<div class="text-[10px] font-semibold tracking-[0.18em] text-[#d4a559] uppercase">
						Demo účet (hash uložen v DB vrstvě)
					</div>
					<div class="mt-1 font-mono text-xs text-[#cfc4b4]">
						Jméno: <strong class="text-[#f0ca85]">admin</strong> &middot; Heslo:
						<strong class="text-[#f0ca85]">Tymax2026!</strong>
					</div>
				</div>
				<button
					type="button"
					onclick={fillDemoCredentials}
					class="shrink-0 cursor-pointer rounded-xl border border-[#d4a559]/35 bg-[#17120e] px-3 py-1.5 text-xs font-medium text-[#f0ca85] hover:border-[#f0ca85]"
				>
					Vyplnit demo
				</button>
			</div>
		</div>
	</div>
</div>
