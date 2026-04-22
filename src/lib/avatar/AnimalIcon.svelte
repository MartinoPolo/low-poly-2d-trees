<script lang="ts">
	import type { AnimalPreset } from './presets.js';
	import Cat from './animals/Cat.svelte';
	import Dog from './animals/Dog.svelte';
	import Fox from './animals/Fox.svelte';
	import Owl from './animals/Owl.svelte';
	import Bear from './animals/Bear.svelte';
	import Rabbit from './animals/Rabbit.svelte';
	import Penguin from './animals/Penguin.svelte';
	import Deer from './animals/Deer.svelte';
	import Wolf from './animals/Wolf.svelte';
	import Frog from './animals/Frog.svelte';
	import type { Component } from 'svelte';

	const ANIMAL_COMPONENTS = {
		cat: Cat,
		dog: Dog,
		fox: Fox,
		owl: Owl,
		bear: Bear,
		rabbit: Rabbit,
		penguin: Penguin,
		deer: Deer,
		wolf: Wolf,
		frog: Frog,
	} as const satisfies Record<AnimalPreset, Component<{ class?: string }>>;

	let { preset, class: className = '' }: { preset: AnimalPreset; class?: string } = $props();

	const AnimalComponent = $derived(ANIMAL_COMPONENTS[preset]);
</script>

<AnimalComponent class={className} />
