<script lang="ts">
	let { data } = $props();
</script>

<svelte:head>
	<title>Docs | sv-toc</title>
</svelte:head>

<!-- eslint-disable-next-line svelte/no-at-html-tags -->
{@html data.content}
