<script lang="ts">
	import type { Snippet } from 'svelte';

	interface Props {
		tone?: 'emerald' | 'amber' | 'burgundy' | 'slate';
		dot?: boolean;
		children: Snippet;
	}

	let { tone = 'slate', dot = false, children }: Props = $props();

	const toneStyles: Record<NonNullable<Props['tone']>, string> = {
		emerald: 'border-emerald-500/30 bg-emerald-500/12 text-emerald-300',
		amber: 'border-[#d4a559]/35 bg-[#d4a559]/14 text-[#f0ca85]',
		burgundy: 'border-[#b93b53]/40 bg-[#7a2332]/30 text-[#f5c2cb]',
		slate: 'border-white/12 bg-white/5 text-[#cfc4b4]'
	};

	const dotStyles: Record<NonNullable<Props['tone']>, string> = {
		emerald: 'bg-emerald-400',
		amber: 'bg-[#f0ca85]',
		burgundy: 'bg-[#ef6b82]',
		slate: 'bg-[#a89d8e]'
	};
</script>

<span
	class={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 text-[11px] font-medium tracking-wide ${toneStyles[tone]}`}
>
	{#if dot}
		<span class={`h-1.5 w-1.5 rounded-full ${dotStyles[tone]}`} aria-hidden="true"></span>
	{/if}
	{@render children()}
</span>
