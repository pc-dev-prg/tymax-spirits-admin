<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import { adminStore } from '#lib/stores/admin.svelte.ts';
	import type { AdminUserSession } from '#lib/types/admin.ts';

	interface Props {
		adminUser?: AdminUserSession | null;
	}

	let { adminUser }: Props = $props();

	interface NavItem {
		href: '/' | '/sklad' | '/objednavky' | '/nastaveni';
		label: string;
		shortcut: string;
		badge?: number;
	}

	const navItems = $derived<NavItem[]>([
		{ href: '/', label: 'Velín & Přehled', shortcut: '1' },
		{
			href: '/sklad',
			label: 'Hlavní sklad & Převodky',
			shortcut: '2',
			badge: adminStore.lowEshopStockItems.length
		},
		{
			href: '/objednavky',
			label: 'Objednávky & Polar.sh',
			shortcut: '3',
			badge: adminStore.pendingOrdersCount
		},
		{ href: '/nastaveni', label: 'DPH, PWA & Bezpečnost', shortcut: '4' }
	]);

	const formattedAutoLockCountdown = $derived.by(() => {
		if (adminStore.settings.autoLockMinutes <= 0) return 'Vypnuto';
		const mins = Math.floor(adminStore.secondsUntilAutoLock / 60);
		const secs = adminStore.secondsUntilAutoLock % 60;
		return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
	});

	function isActiveRoute(href: string): boolean {
		if (href === '/') return page.url.pathname === '/';
		return page.url.pathname.startsWith(href);
	}
</script>

<aside
	class="flex flex-col justify-between border-b border-[#d4a559]/15 bg-[#0b0908] p-5 lg:sticky lg:top-0 lg:h-svh lg:w-72 lg:shrink-0 lg:overflow-y-auto lg:border-r lg:border-b-0 lg:p-6"
>
	<div>
		<!-- Brand Header -->
		<div class="flex items-center justify-between lg:block">
			<a href={resolve('/')} class="flex items-center gap-3">
				<div
					class="flex h-10 w-10 items-center justify-center rounded-xl border border-[#d4a559]/40 bg-gradient-to-br from-[#3a121b] to-[#120b0d] font-serif text-xl font-semibold text-[#f0ca85] shadow-[0_8px_20px_rgba(0,0,0,0.6)]"
				>
					T
				</div>
				<div>
					<div
						class="font-serif text-lg leading-none font-semibold tracking-[0.2em] text-[#f4efe8]"
					>
						TYMAX ADMIN
					</div>
					<div class="mt-1 text-[10px] tracking-[0.22em] text-[#d4a559] uppercase">
						Sklad &amp; Velín E-shopu
					</div>
				</div>
			</a>

			<!-- Mobile Quick Command Trigger -->
			<button
				type="button"
				onclick={() => (adminStore.isCommandPaletteOpen = true)}
				class="inline-flex cursor-pointer items-center gap-1.5 rounded-xl border border-[#d4a559]/25 bg-[#15110e] px-3 py-1.5 text-xs text-[#f0ca85] lg:hidden"
			>
				<span>⌘K</span>
			</button>
		</div>

		<!-- Primary URL-based Navigation -->
		<nav
			aria-label="Hlavní sekce administrace"
			class="mt-6 flex gap-2 overflow-x-auto lg:mt-8 lg:flex-col"
		>
			{#each navItems as item (item.href)}
				{@const isActive = isActiveRoute(item.href)}
				<a
					href={resolve(item.href)}
					aria-current={isActive ? 'page' : undefined}
					class={`group relative flex shrink-0 items-center justify-between gap-3 rounded-xl border px-3.5 py-2.5 text-left text-xs font-medium transition-all focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#f0ca85] lg:w-full ${
						isActive
							? 'border-[#d4a559]/50 bg-gradient-to-r from-[#1d1612] to-[#130f0c] text-[#f0ca85] shadow-[0_10px_25px_rgba(0,0,0,0.5)]'
							: 'border-transparent text-[#a89d8e] hover:border-white/8 hover:bg-[#14100d] hover:text-[#f4efe8]'
					}`}
				>
					<span class="flex items-center gap-2.5">
						<span
							class={`h-1.5 w-1.5 rounded-full ${
								isActive ? 'bg-[#f0ca85] shadow-[0_0_8px_#f0ca85]' : 'bg-white/15'
							}`}
							aria-hidden="true"
						></span>
						<span>{item.label}</span>
					</span>

					<span class="flex items-center gap-1.5">
						{#if item.badge && item.badge > 0}
							<span
								class="inline-flex h-5 min-w-5 items-center justify-center rounded-full bg-[#7a2332] px-1.5 text-[10px] font-bold text-[#f7cfd6]"
							>
								{item.badge}
							</span>
						{/if}
						<kbd
							class="hidden rounded border border-white/10 bg-[#080707] px-1.5 py-0.5 font-mono text-[10px] text-[#7c7164] lg:inline-block"
						>
							Alt+{item.shortcut}
						</kbd>
					</span>
				</a>
			{/each}
		</nav>
	</div>

	<!-- Bottom Cellar Telemetry & Security Guard Card -->
	<div class="mt-6 hidden space-y-3 lg:block">
		<!-- Climate & Warehouse Telemetry -->
		<div class="rounded-2xl border border-[#d4a559]/18 bg-[#110e0c] p-3.5">
			<div
				class="flex items-center justify-between text-[10px] tracking-[0.18em] text-[#a89d8e] uppercase"
			>
				<span>Hlavní sklad · Čidla</span>
				<span class="inline-flex items-center gap-1 text-emerald-400">
					<span class="h-1.5 w-1.5 rounded-full bg-emerald-400"></span>
					<span>ONLINE</span>
				</span>
			</div>

			<div class="mt-2.5 grid grid-cols-2 gap-2 border-t border-white/6 pt-2.5">
				<div>
					<div class="text-[10px] text-[#8a7f72]">Teplota</div>
					<div class="font-mono text-sm font-semibold text-[#f4efe8] tabular-nums">
						{adminStore.settings.mainWarehouseTempC.toFixed(1)} °C
					</div>
				</div>
				<div>
					<div class="text-[10px] text-[#8a7f72]">Vlhkost</div>
					<div class="font-mono text-sm font-semibold text-[#f4efe8] tabular-nums">
						{adminStore.settings.mainWarehouseHumidityPercent} %
					</div>
				</div>
			</div>
		</div>

		<!-- Security, Auto-Lock Timer & Logout Card -->
		<div class="rounded-2xl border border-white/8 bg-[#0e0b09] p-3.5">
			<div class="flex items-center justify-between">
				<div class="min-w-0">
					<div class="truncate text-xs font-semibold text-[#f4efe8]">
						{adminUser?.displayName ?? 'Petr Cafourek'}
					</div>
					<div class="text-[10px] text-[#8a7f72]">
						@{adminUser?.username ?? 'admin'} &middot; Auto-zámek:
						<span class="font-mono text-[#f0ca85] tabular-nums">{formattedAutoLockCountdown}</span>
					</div>
				</div>
			</div>

			<div class="mt-3 grid grid-cols-2 gap-2 border-t border-white/6 pt-2.5">
				<button
					type="button"
					onclick={() => (adminStore.isTerminalLocked = true)}
					title="Okamžitě uzamknout obrazovku pod PIN"
					class="cursor-pointer rounded-xl border border-[#d4a559]/30 bg-[#17120e] px-2.5 py-1.5 text-[11px] font-medium text-[#f0ca85] transition-colors hover:border-[#f0ca85]"
				>
					🔒 Zamknout
				</button>

				<form method="POST" action="/odhlaseni">
					<button
						type="submit"
						class="w-full cursor-pointer rounded-xl border border-white/10 bg-[#14100d] px-2.5 py-1.5 text-[11px] text-[#a89d8e] transition-colors hover:border-[#b93b53]/50 hover:text-[#f7cfd6]"
					>
						Odhlásit
					</button>
				</form>
			</div>
		</div>
	</div>
</aside>
