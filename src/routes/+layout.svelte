<script lang="ts">
	import { resolve } from "$app/paths";
	import { Toc } from "$lib/toc";
	let { children } = $props();
	import "@shikijs/twoslash/style-rich.css";
	import "../app.css";

	const toc = new Toc({
		updateHeadings: true,
		headingSelector: "h2, h3, h4, h5, h6",
		rootSelector: "#content",
		observeScroll: true,
		scrollTopOffset: 50,
		scrollBottomOffset: 50,
		activeStrategy: "all",
		addIds: true,
	});

	function formatHeadingData() {
		let lines = [];
		for (const heading of toc.current) {
			// Loop through keys
			for (let i = 0; i < Object.keys(heading).length; i++) {
				const key = Object.keys(heading)[i] as keyof typeof heading;
				const prefix = i === 0 ? "→ " : "  ";
				lines.push(`${prefix}${key}: ${heading[key]}`);
				if (i >= Object.keys(heading).length - 1) {
					lines.push("");
				}
			}
		}
		return lines.join("\n");
	}
</script>

<div id="columns">
	<main id="content">
		<h1>
			<img src="/logo.webp" alt="sv-toc logo" style="height: 1em; vertical-align: middle; margin-bottom: 0.5rem;" /> sv-toc
		</h1>
		<p><a href={resolve("/")}>Readme</a> | <a href={resolve("/demo")}>Demo</a> | <a href={resolve("/docs")}>Docs</a></p>
		<hr />
		{@render children()}
	</main>
	<aside id="sidebar">
		<h2>Table of Contents</h2>
		<ul id="toc">
			{#each toc.current as heading, index (index)}
				<li
					data-active={heading.active ? "true" : undefined}
					style="padding-left: {((heading.headingLevel || 2) - 1) * 1}rem;"
				>
					<a href={"#" + heading.id}>{heading.textContent}</a>
				</li>
			{/each}
		</ul>
		<hr />
		<h2>Raw Heading Data</h2>
		<pre id="raw-toc"><code>{formatHeadingData()}</code></pre>
	</aside>
</div>
