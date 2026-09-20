<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>sv-toc</title>
</svelte:head>

<!-- eslint-disable-next-line svelte/no-at-html-tags -->
{@html data.content}
