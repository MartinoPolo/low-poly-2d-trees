<script lang="ts">
	import type { GlowConfig } from './overlay_types.js';

	interface Props {
		config: GlowConfig;
		filterId: string;
	}

	let { config, filterId }: Props = $props();

	const floodOpacity = $derived(Math.min(0.6 * config.intensity, 1.0));
	const stdDeviation = $derived(4 * config.intensity);
	const filterMargin = $derived(30 + (config.intensity - 1) * 15);
	const filterSize = $derived(100 + 2 * filterMargin);
</script>

{#if config.enabled}
	<defs>
		<filter
			id={filterId}
			x="-{filterMargin}%"
			y="-{filterMargin}%"
			width="{filterSize}%"
			height="{filterSize}%"
		>
			<feFlood flood-color={config.color} flood-opacity={floodOpacity} result="flood" />
			<feComposite in="flood" in2="SourceGraphic" operator="in" result="masked" />
			<feGaussianBlur in="masked" {stdDeviation} result="blur" />
			{#if config.intensity >= 3}
				<feGaussianBlur in="masked" stdDeviation={stdDeviation * 1.5} result="blur2" />
				<feMerge>
					<feMergeNode in="blur2" />
					<feMergeNode in="blur" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			{:else}
				<feMerge>
					<feMergeNode in="blur" />
					<feMergeNode in="SourceGraphic" />
				</feMerge>
			{/if}
		</filter>
	</defs>
{/if}
