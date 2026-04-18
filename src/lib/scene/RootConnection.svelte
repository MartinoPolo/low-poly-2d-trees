<script lang="ts">
	import type { Point2D } from '$lib/trees/types/core.js';
	import { CONNECTION_STATES, type ConnectionState } from './root_connection_types.js';
	import {
		generateBezierControlPoints,
		buildBezierPathData,
	} from './root_connection_generators.js';

	interface Props {
		from: Point2D;
		to: Point2D;
		state: ConnectionState;
		seed: number;
	}

	let { from, to, state, seed }: Props = $props();

	const controlPoints = $derived(generateBezierControlPoints(from, to, seed));
	const pathData = $derived(buildBezierPathData(from, to, controlPoints));
	const isConnected = $derived(state === CONNECTION_STATES.connected);
</script>

<path
	d={pathData}
	fill="none"
	stroke={isConnected ? '#8B6914' : '#a0a0a0'}
	stroke-width={isConnected ? 2 : 1.5}
	stroke-dasharray={isConnected ? 'none' : '6 4'}
	opacity={isConnected ? 0.7 : 0.4}
/>
