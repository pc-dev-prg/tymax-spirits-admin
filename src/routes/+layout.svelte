<script lang="ts">
	import './layout.css';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import favicon from '#lib/assets/favicon.svg';
	import CommandPaletteDialog from '#lib/components/features/command/CommandPaletteDialog.svelte';
	import TerminalLockDialog from '#lib/components/features/security/TerminalLockDialog.svelte';
	import CreateProductDialog from '#lib/components/features/warehouse/CreateProductDialog.svelte';
	import DeleteProductDialog from '#lib/components/features/warehouse/DeleteProductDialog.svelte';
	import EditPriceDialog from '#lib/components/features/warehouse/EditPriceDialog.svelte';
	import StockTransferDialog from '#lib/components/features/warehouse/StockTransferDialog.svelte';
	import AdminSidebar from '#lib/components/layout/AdminSidebar.svelte';
	import AdminTopbar from '#lib/components/layout/AdminTopbar.svelte';
	import ToastContainer from '#lib/components/ui/ToastContainer.svelte';
	import { adminStore } from '#lib/stores/admin.svelte.ts';
	import { pwaStore } from '#lib/stores/pwa.svelte.ts';
	import type { LayoutProps } from './$types';

	let { data, children }: LayoutProps = $props();

	onMount(() => {
		pwaStore.init();
		adminStore.hydrateSecurityPreferences(page.url.searchParams.get('setPin'));

		const interval = setInterval(() => {
			if (data.adminUser) {
				adminStore.tickInactivitySecond();
			}
		}, 1000);

		return () => clearInterval(interval);
	});

	// Keep the installed PWA app icon badge automatically synced with pending tasks
	$effect(() => {
		const taskCount = adminStore.pendingOrdersCount + adminStore.lowEshopStockItems.length;
		if (pwaStore.autoSyncBadge && data.adminUser) {
			void pwaStore.setAppBadgeCount(taskCount);
		}
	});

	function handleUserActivity() {
		if (!adminStore.isTerminalLocked && data.adminUser) {
			adminStore.resetInactivityTimer();
		}
	}

	function handleGlobalKeydown(event: KeyboardEvent) {
		if (!data.adminUser) return;
		handleUserActivity();

		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			if (!adminStore.isTerminalLocked) {
				adminStore.isCommandPaletteOpen = !adminStore.isCommandPaletteOpen;
			}
			return;
		}

		if (event.altKey && !adminStore.isTerminalLocked) {
			if (event.key === '1') void goto(resolve('/'));
			if (event.key === '2') void goto(resolve('/sklad'));
			if (event.key === '3') void goto(resolve('/objednavky'));
			if (event.key === '4') void goto(resolve('/nastaveni'));
		}
	}
</script>

<svelte:window
	onkeydown={handleGlobalKeydown}
	onpointerdown={handleUserActivity}
	onpointermove={handleUserActivity}
	onwheel={handleUserActivity}
	ontouchstart={handleUserActivity}
/>

<svelte:head>
	<link rel="icon" href={favicon} />
</svelte:head>

{#if !data.adminUser || page.url.pathname === '/prihlaseni'}
	{@render children()}
{:else}
	<div class="flex min-h-svh flex-col bg-[#080707] text-[#f4efe8] lg:flex-row">
		<AdminSidebar adminUser={data.adminUser} />

		<div class="flex min-w-0 flex-1 flex-col">
			<AdminTopbar />

			<main class="mx-auto w-full max-w-7xl flex-1 p-6 lg:p-8">
				{@render children()}
			</main>
		</div>
	</div>

	<CommandPaletteDialog />
	<CreateProductDialog />
	<EditPriceDialog />
	<DeleteProductDialog />
	<StockTransferDialog />
	<TerminalLockDialog adminUser={data.adminUser} />
	<ToastContainer />
{/if}
