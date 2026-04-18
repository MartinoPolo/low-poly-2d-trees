<script lang="ts">
	import type { GlowConfig } from './overlay_types.js';

	interface Props {
		config: GlowConfig;
		filterId: string;
	}

	let { config, filterId }: Props = $props();
</script>

{#if config.enabled}
	<defs>
		<filter id={filterId} x="-30%" y="-30%" width="160%" height="160%">
			<feFlood flood-color={config.color} flood-opacity="0.6" result="flood" />
			<feComposite in="flood" in2="SourceGraphic" operator="in" result="masked" />
			<feGaussianBlur in="masked" stdDeviation="4" result="blur" />
			<feMerge>
				<feMergeNode in="blur" />
				<feMergeNode in="SourceGraphic" />
			</feMerge>
		</filter>
	</defs>
{/if}

{#if config.enabled && config.pulse}
	<!-- Pulse animation is applied via CSS on the element that references this filter -->
{/if}
