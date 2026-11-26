<script lang="ts">
	import { adminStore } from '#lib/stores/admin.svelte.ts';
</script>

<div
	aria-live="polite"
	class="pointer-events-none fixed right-6 bottom-6 z-50 flex max-w-sm flex-col gap-2.5"
>
	{#each adminStore.toasts as toast (toast.id)}
		<div
			class={`pointer-events-auto flex items-start justify-between gap-3 rounded-2xl border p-4 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl ${
				toast.tone === 'emerald'
					? 'border-emerald-500/35 bg-[#0c1410]/95 text-emerald-200'
					: toast.tone === 'burgundy'
						? 'border-[#b93b53]/45 bg-[#190c0f]/95 text-[#f7cfd6]'
						: 'border-[#d4a559]/40 bg-[#14100d]/95 text-[#f5efe6]'
			}`}
		>
			<div>
				<p class="text-xs font-semibold tracking-wide">{toast.title}</p>
				<p class="mt-0.5 text-xs text-[#b7ac9e]">{toast.detail}</p>
			</div>

			<button
				type="button"
				onclick={() => adminStore.dismissToast(toast.id)}
				aria-label="Zavřít oznámení"
				class="cursor-pointer text-xs text-[#8a7f72] hover:text-[#f5efe6]"
			>
				✕
			</button>
		</div>
	{/each}
</div>
