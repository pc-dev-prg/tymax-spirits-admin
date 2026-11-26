<script lang="ts">
	import PwaNotificationCenter from '#lib/components/features/pwa/PwaNotificationCenter.svelte';
	import StatusBadge from '#lib/components/ui/StatusBadge.svelte';
	import { adminStore } from '#lib/stores/admin.svelte.ts';
	import { calculateVatSnapshot, formatCzk } from '#lib/utils/format.ts';

	let sampleBottlePriceCzk = $state(3490);
	let customPin = $state(adminStore.settings.terminalPin);
	let selectedAutoLockMinutes = $state(adminStore.settings.autoLockMinutes);

	$effect(() => {
		customPin = adminStore.settings.terminalPin;
		selectedAutoLockMinutes = adminStore.settings.autoLockMinutes;
	});

	const simulatedCurrent = $derived(
		calculateVatSnapshot(
			sampleBottlePriceCzk,
			adminStore.settings.isVatPayer,
			adminStore.settings.defaultVatRatePercent
		)
	);

	function handleSaveSecurity(event: SubmitEvent) {
		event.preventDefault();
		adminStore.updateSecurityPreferences(customPin, Number(selectedAutoLockMinutes));
	}
</script>

<div class="space-y-8">
	<div>
		<p class="text-[11px] font-medium tracking-[0.24em] text-[#d4a559] uppercase">
			Konfigurace systému &amp; Daňový režim
		</p>
		<h1 class="mt-1 font-serif text-3xl font-medium text-[#f4efe8] sm:text-4xl">
			Nastavení PWA, Notifikací, DPH &amp; Bezpečnosti
		</h1>
	</div>

	<!-- PWA, Web Push & App Icon Badging Control Center -->
	<PwaNotificationCenter />

	<div class="grid gap-6 xl:grid-cols-12">
		<!-- Left Column: VAT Payer Switch & Live Tax Receipt Simulator -->
		<section class="rounded-3xl border border-[#d4a559]/30 bg-[#110e0c] p-6 sm:p-8 xl:col-span-7">
			<div class="flex flex-wrap items-start justify-between gap-4">
				<div>
					<span class="text-[10px] font-semibold tracking-[0.2em] text-[#d4a559] uppercase">
						Klíčové doménové nastavení (`shop_settings.is_vat_payer`)
					</span>
					<h2 class="mt-1 font-serif text-2xl font-medium text-[#f4efe8]">Režim plátcovství DPH</h2>
					<p class="mt-2 max-w-xl text-xs leading-relaxed text-[#a89d8e]">
						Majitel aktuálně není plátcem DPH. Kdykoliv v budoucnu lze jedním přepnutím aktivovat
						režim plátce DPH — e-shop, košík i nové faktury se okamžitě přizpůsobí, zatímco
						historické objednávky si zachovají svůj původní daňový snapshot.
					</p>
				</div>

				<StatusBadge tone={adminStore.settings.isVatPayer ? 'amber' : 'emerald'} dot>
					{adminStore.settings.isVatPayer ? 'AKTIVNÍ: PLÁTCE DPH' : 'AKTIVNÍ: NEPLÁTCE DPH'}
				</StatusBadge>
			</div>

			<!-- Two-card interactive regime selector -->
			<div class="mt-6 grid gap-4 sm:grid-cols-2">
				<button
					type="button"
					onclick={() => {
						if (adminStore.settings.isVatPayer) adminStore.toggleVatPayer();
					}}
					class={`cursor-pointer rounded-2xl border p-5 text-left transition-all ${
						!adminStore.settings.isVatPayer
							? 'border-emerald-500/60 bg-emerald-500/12 shadow-[0_15px_35px_rgba(0,0,0,0.5)]'
							: 'border-white/10 bg-[#0b0908] opacity-75 hover:opacity-100'
					}`}
				>
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold tracking-wider text-emerald-300 uppercase">
							Neplátce DPH (Výchozí)
						</span>
						{#if !adminStore.settings.isVatPayer}
							<span class="h-2.5 w-2.5 rounded-full bg-emerald-400"></span>
						{/if}
					</div>
					<p class="mt-2 text-xs text-[#cfc4b4]">
						Všechny ceny na e-shopu jsou konečné. Na dokladech je uvedeno „Nejsme plátci DPH“.
					</p>
				</button>

				<button
					type="button"
					onclick={() => {
						if (!adminStore.settings.isVatPayer) adminStore.toggleVatPayer();
					}}
					class={`cursor-pointer rounded-2xl border p-5 text-left transition-all ${
						adminStore.settings.isVatPayer
							? 'border-[#f0ca85] bg-[#d4a559]/16 shadow-[0_15px_35px_rgba(0,0,0,0.5)]'
							: 'border-white/10 bg-[#0b0908] opacity-75 hover:opacity-100'
					}`}
				>
					<div class="flex items-center justify-between">
						<span class="text-xs font-semibold tracking-wider text-[#f0ca85] uppercase">
							Plátce DPH ({adminStore.settings.defaultVatRatePercent} %)
						</span>
						{#if adminStore.settings.isVatPayer}
							<span class="h-2.5 w-2.5 rounded-full bg-[#f0ca85]"></span>
						{/if}
					</div>
					<p class="mt-2 text-xs text-[#cfc4b4]">
						Zobrazuje rozpad na základ daně a DPH ({adminStore.settings.defaultVatRatePercent} % pro alkohol)
						na kartách, v košíku i na daňovém dokladu.
					</p>
				</button>
			</div>

			<!-- Live Invoice & E-shop Price Simulator -->
			<div class="mt-6 rounded-2xl border border-white/10 bg-[#0b0908] p-5">
				<div class="flex flex-wrap items-center justify-between gap-3">
					<span class="text-[11px] font-semibold tracking-[0.18em] text-[#d4a559] uppercase">
						Živý simulátor zobrazení ceny a dokladu (Highland Smoke 18 YO)
					</span>
					<div class="flex items-center gap-2 text-xs">
						<label for="sim-price" class="text-[#8a7f72]">Testovací cena:</label>
						<input
							id="sim-price"
							type="number"
							min="100"
							step="10"
							bind:value={sampleBottlePriceCzk}
							class="h-8 w-24 rounded-lg border border-white/12 bg-[#14100d] px-2.5 text-right font-mono text-xs text-[#f0ca85] tabular-nums"
						/>
					</div>
				</div>

				<div class="mt-4 grid gap-4 border-t border-white/8 pt-4 sm:grid-cols-3">
					<div>
						<div class="text-[10px] tracking-[0.16em] text-[#8a7f72] uppercase">
							Konečná cena pro zákazníka
						</div>
						<div class="mt-1 font-serif text-2xl font-semibold text-[#f0ca85] tabular-nums">
							{formatCzk(simulatedCurrent.totalCzk)}
						</div>
					</div>
					<div>
						<div class="text-[10px] tracking-[0.16em] text-[#8a7f72] uppercase">Základ bez DPH</div>
						<div class="mt-1 font-mono text-lg text-[#f4efe8] tabular-nums">
							{formatCzk(simulatedCurrent.netCzk)}
						</div>
					</div>
					<div>
						<div class="text-[10px] tracking-[0.16em] text-[#8a7f72] uppercase">
							Vyčíslené DPH ({adminStore.settings.isVatPayer
								? `${adminStore.settings.defaultVatRatePercent} %`
								: '0 %'})
						</div>
						<div class="mt-1 font-mono text-lg text-emerald-400 tabular-nums">
							{formatCzk(simulatedCurrent.vatCzk)}
						</div>
					</div>
				</div>
			</div>
		</section>

		<!-- Right Column: Quick-Lock PIN, Inactivity Auto-Lock & Infrastructure -->
		<section
			class="space-y-5 rounded-3xl border border-white/10 bg-[#110e0c] p-6 sm:p-8 xl:col-span-5"
		>
			<div>
				<span class="text-[10px] font-semibold tracking-[0.2em] text-[#d4a559] uppercase">
					Zabezpečení relace &amp; Auto-zámek
				</span>
				<h2 class="mt-1 font-serif text-2xl font-medium text-[#f4efe8]">
					PIN pro rychlé zamykání a neaktivitu
				</h2>
			</div>

			<form
				onsubmit={handleSaveSecurity}
				class="space-y-4 rounded-2xl border border-[#d4a559]/25 bg-[#0b0908] p-4"
			>
				<div class="grid grid-cols-2 gap-3">
					<div>
						<label for="cfg-pin" class="block text-xs text-[#cfc4b4]"> Váš PIN (4–6 číslic) </label>
						<input
							id="cfg-pin"
							type="password"
							inputmode="numeric"
							pattern="[0-9]+"
							minlength="4"
							maxlength="6"
							required
							bind:value={customPin}
							class="mt-1.5 h-10 w-full rounded-xl border border-[#d4a559]/35 bg-[#14100d] px-3 text-center font-mono text-sm tracking-[0.35em] text-[#f0ca85] focus:border-[#f0ca85] focus:outline-none"
						/>
					</div>

					<div>
						<label for="cfg-autolock" class="block text-xs text-[#cfc4b4]">
							Zamknout při neaktivitě
						</label>
						<select
							id="cfg-autolock"
							bind:value={selectedAutoLockMinutes}
							class="mt-1.5 h-10 w-full rounded-xl border border-white/12 bg-[#14100d] px-3 text-xs text-[#f4efe8] focus:border-[#f0ca85] focus:outline-none"
						>
							<option value={0.25}>Za 15 sekund (Test)</option>
							<option value={1}>Za 1 minutu</option>
							<option value={3}>Za 3 minuty</option>
							<option value={5}>Za 5 minut (Výchozí)</option>
							<option value={15}>Za 15 minut</option>
							<option value={0}>Vypnuto</option>
						</select>
					</div>
				</div>

				<div class="flex flex-wrap items-center justify-between gap-2 pt-1">
					<button
						type="submit"
						class="cursor-pointer rounded-xl bg-gradient-to-r from-[#c89643] via-[#e4b86a] to-[#c89643] px-4 py-2 text-xs font-semibold tracking-[0.12em] text-[#090705] uppercase hover:brightness-110"
					>
						Uložit PIN &amp; Auto-zámek
					</button>

					<button
						type="button"
						onclick={() => (adminStore.isTerminalLocked = true)}
						class="cursor-pointer rounded-xl border border-[#d4a559]/30 bg-[#17120e] px-3 py-2 text-xs text-[#f0ca85] hover:border-[#f0ca85]"
					>
						🔒 Otestovat zámek hned
					</button>
				</div>
			</form>

			<div class="space-y-2.5 text-xs">
				<div
					class="flex items-center justify-between rounded-2xl border border-white/8 bg-[#0b0908] p-3.5"
				>
					<div>
						<div class="font-semibold text-[#f4efe8]">Ukládání hesel (Scrypt + Salt)</div>
						<div class="mt-0.5 text-[#8a7f72]">V DB pouze hash `scrypt$salt$derivedKey`</div>
					</div>
					<StatusBadge tone="emerald" dot>Aktivní</StatusBadge>
				</div>

				<div
					class="flex items-center justify-between rounded-2xl border border-white/8 bg-[#0b0908] p-3.5"
				>
					<div>
						<div class="font-semibold text-[#f4efe8]">Supabase Row Level Security (RLS)</div>
						<div class="mt-0.5 text-[#8a7f72]">Připraveno na propojení klientského účtu</div>
					</div>
					<StatusBadge tone="emerald" dot>Vynuceno</StatusBadge>
				</div>

				<div
					class="flex items-center justify-between rounded-2xl border border-white/8 bg-[#0b0908] p-3.5"
				>
					<div>
						<div class="font-semibold text-[#f4efe8]">Polar.sh Checkout &amp; Product Sync</div>
						<div class="mt-0.5 text-[#8a7f72]">REST API + podpis webhooků připraveny</div>
					</div>
					<StatusBadge tone="emerald" dot>Připraveno</StatusBadge>
				</div>
			</div>
		</section>
	</div>
</div>
