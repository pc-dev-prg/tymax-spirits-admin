<script lang="ts">
	import { onMount } from 'svelte';
	import { page } from '$app/state';
	import CommandPaletteDialog from '#lib/components/features/command/CommandPaletteDialog.svelte';
	import OverviewSection from '#lib/components/features/dashboard/OverviewSection.svelte';
	import OrdersSection from '#lib/components/features/orders/OrdersSection.svelte';
	import TerminalLockDialog from '#lib/components/features/security/TerminalLockDialog.svelte';
	import SettingsSection from '#lib/components/features/settings/SettingsSection.svelte';
	import StockTransferDialog from '#lib/components/features/warehouse/StockTransferDialog.svelte';
	import WarehouseSection from '#lib/components/features/warehouse/WarehouseSection.svelte';
	import AdminSidebar from '#lib/components/layout/AdminSidebar.svelte';
	import AdminTopbar from '#lib/components/layout/AdminTopbar.svelte';
	import ToastContainer from '#lib/components/ui/ToastContainer.svelte';
	import { adminStore } from '#lib/stores/admin.svelte.ts';
	import { pwaStore } from '#lib/stores/pwa.svelte.ts';
	import type { AdminSectionId } from '#lib/types/admin.ts';

	onMount(() => {
		pwaStore.init();
		const sekce = page.url.searchParams.get('sekce') as AdminSectionId | null;
		if (
			sekce === 'overview' ||
			sekce === 'warehouse' ||
			sekce === 'orders' ||
			sekce === 'settings'
		) {
			adminStore.activeSection = sekce;
		}
	});

	// Keep the installed PWA app icon badge automatically synced with pending tasks
	$effect(() => {
		const taskCount = adminStore.pendingOrdersCount + adminStore.lowEshopStockItems.length;
		if (pwaStore.autoSyncBadge) {
			void pwaStore.setAppBadgeCount(taskCount);
		}
	});

	function handleGlobalKeydown(event: KeyboardEvent) {
		if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
			event.preventDefault();
			adminStore.isCommandPaletteOpen = !adminStore.isCommandPaletteOpen;
			return;
		}

		if (event.altKey && !adminStore.isTerminalLocked) {
			if (event.key === '1') adminStore.activeSection = 'overview';
			if (event.key === '2') adminStore.activeSection = 'warehouse';
			if (event.key === '3') adminStore.activeSection = 'orders';
			if (event.key === '4') adminStore.activeSection = 'settings';
		}
	}
</script>

<svelte:window onkeydown={handleGlobalKeydown} />

<svelte:head>
	<title>Tymax Spirits Admin — Hlavní sklad &amp; Velín e-shopu</title>
	<meta
		name="description"
		content="Zabezpečená PWA aplikace Tymax Spirits pro správu Hlavního skladu, převodek na e-shop, objednávek a režimu DPH."
	/>
</svelte:head>

<div class="flex min-h-svh flex-col bg-[#080707] text-[#f4efe8] lg:flex-row">
	<AdminSidebar />

	<div class="flex min-w-0 flex-1 flex-col">
		<AdminTopbar />

		<main class="mx-auto w-full max-w-7xl flex-1 p-6 lg:p-8">
			{#if adminStore.activeSection === 'overview'}
				<OverviewSection />
			{:else if adminStore.activeSection === 'warehouse'}
				<WarehouseSection />
			{:else if adminStore.activeSection === 'orders'}
				<OrdersSection />
			{:else}
				<SettingsSection />
			{/if}
		</main>
	</div>
</div>

<CommandPaletteDialog />
<StockTransferDialog />
<TerminalLockDialog />
<ToastContainer />
