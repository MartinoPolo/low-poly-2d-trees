<script lang="ts">
	interface Props {
		length: number;
	}

	let { length }: Props = $props();
</script>

<line x1="0" y1="0" x2="2" y2={length} stroke="rgba(174,194,224,0.5)" stroke-width="1.5" />
