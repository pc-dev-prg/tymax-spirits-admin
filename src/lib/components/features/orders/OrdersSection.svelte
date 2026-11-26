<script lang="ts">
	import StatusBadge from '#lib/components/ui/StatusBadge.svelte';
	import { adminStore } from '#lib/stores/admin.svelte.ts';
	import type { OrderStatus } from '#lib/types/admin.ts';
	import { calculateVatSnapshot, formatCzk } from '#lib/utils/format.ts';

	let statusFilter = $state<'all' | OrderStatus>('all');

	const filteredOrders = $derived(
		statusFilter === 'all'
			? adminStore.orders
			: adminStore.orders.filter((o) => o.status === statusFilter)
	);

	const statusMeta: Record<
		OrderStatus,
		{ label: string; tone: 'amber' | 'emerald' | 'burgundy' | 'slate'; nextAction?: string }
	> = {
		paid: {
			label: 'Zaplaceno (Polar.sh)',
			tone: 'amber',
			nextAction: 'Vyskladnit ze skladu E-shopu →'
		},
		packed: {
			label: 'Vyskladněno & Zabaleno',
			tone: 'emerald',
			nextAction: 'Předat kurýrovi (18+) →'
		},
		shipped: {
			label: 'Na cestě k zákazníkovi',
			tone: 'slate',
			nextAction: 'Potvrdit doručení →'
		},
		delivered: {
			label: 'Doručeno (Ověřeno 18+)',
			tone: 'emerald'
		}
	};
</script>

<div class="space-y-8">
	<div class="flex flex-wrap items-end justify-between gap-4">
		<div>
			<p class="text-[11px] font-medium tracking-[0.24em] text-[#d4a559] uppercase">
				Expedice &amp; Platební brána Polar.sh
			</p>
			<h1 class="mt-1 font-serif text-3xl font-medium text-[#f4efe8] sm:text-4xl">
				Objednávky &amp; Daňové snapshoty
			</h1>
		</div>

		<!-- Status Filter Pills -->
		<div class="flex flex-wrap items-center gap-2" role="group" aria-label="Filtr stavu objednávek">
			{#each [{ id: 'all' as const, label: `Všechny (${adminStore.orders.length})` }, { id: 'paid' as const, label: 'K vyskladnění' }, { id: 'packed' as const, label: 'Zabaleno' }, { id: 'shipped' as const, label: 'Expedováno' }, { id: 'delivered' as const, label: 'Doručeno' }] as tab (tab.id)}
				<button
					type="button"
					aria-pressed={statusFilter === tab.id}
					onclick={() => (statusFilter = tab.id)}
					class={`cursor-pointer rounded-xl border px-3.5 py-1.5 text-xs transition-colors ${
						statusFilter === tab.id
							? 'border-[#f0ca85] bg-[#d4a559]/18 font-semibold text-[#f4efe8]'
							: 'border-white/10 bg-[#110e0c] text-[#a89d8e] hover:border-[#d4a559]/35'
					}`}
				>
					{tab.label}
				</button>
			{/each}
		</div>
	</div>

	<div class="space-y-4">
		{#each filteredOrders as order (order.id)}
			{@const meta = statusMeta[order.status]}
			{@const tax = calculateVatSnapshot(
				order.totalCzk,
				order.isVatPayerSnapshot,
				order.vatRateSnapshot
			)}
			<article class="rounded-3xl border border-white/10 bg-[#110e0c] p-6">
				<div class="flex flex-wrap items-start justify-between gap-4 border-b border-white/8 pb-4">
					<div>
						<div class="flex flex-wrap items-center gap-2.5">
							<span class="font-mono text-base font-semibold text-[#f0ca85]">
								#{order.orderNumber}
							</span>
							<StatusBadge tone={meta.tone} dot>{meta.label}</StatusBadge>
							<StatusBadge tone="slate">Polar ID: {order.polarPaymentId}</StatusBadge>
							<StatusBadge tone="burgundy">{order.ageVerifiedAt}</StatusBadge>
						</div>

						<div class="mt-2 text-xs text-[#cfc4b4]">
							<strong>{order.customerName}</strong> ({order.customerEmail}) &middot;
							<span>{order.deliveryCity}</span> &middot;
							<span class="text-[#8a7f72]">{order.createdAt}</span>
						</div>
					</div>

					<div class="text-right">
						<div class="font-serif text-3xl font-semibold text-[#f0ca85] tabular-nums">
							{formatCzk(order.totalCzk)}
						</div>
						<div class="mt-0.5 text-[11px] text-[#8a7f72]">
							{#if order.isVatPayerSnapshot}
								Snapshot: Plátce DPH ({order.vatRateSnapshot} %) &middot; Základ {formatCzk(
									tax.netCzk
								)}
							{:else}
								🔒 Snapshot dokladu: Neplátce DPH (0 % DPH)
							{/if}
						</div>
					</div>
				</div>

				<div class="mt-4 flex flex-wrap items-center justify-between gap-4">
					<ul class="space-y-1 text-xs text-[#cfc4b4]">
						{#each order.items as line (line.sku)}
							<li class="flex items-center gap-2">
								<span class="font-mono text-[11px] text-[#d4a559]">{line.sku}</span>
								<span>{line.quantity}× {line.name}</span>
								<span class="text-[#8a7f72]">({formatCzk(line.unitPriceCzk)} / ks)</span>
							</li>
						{/each}
					</ul>

					{#if meta.nextAction}
						<button
							type="button"
							onclick={() => adminStore.advanceOrderStatus(order.id)}
							class="cursor-pointer rounded-xl bg-gradient-to-r from-[#c89643] via-[#e4b86a] to-[#c89643] px-4 py-2.5 text-xs font-semibold tracking-[0.1em] text-[#090705] uppercase hover:brightness-110"
						>
							{meta.nextAction}
						</button>
					{/if}
				</div>
			</article>
		{/each}
	</div>
</div>
