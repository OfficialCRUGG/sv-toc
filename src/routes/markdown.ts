import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeStringify from "rehype-stringify";
import rehypeShiki from "@shikijs/rehype";
import { createTwoslasher } from "twoslash-svelte";

import { rendererRich, transformerTwoslash } from "@shikijs/twoslash";
import { resolve } from "node:path";

export async function parseMarkdown(markdown: string) {
	const result = await unified()
		.use(remarkParse)
		.use(remarkGfm)
		.use(remarkRehype)
		.use(rehypeShiki, {
			theme: "rose-pine",
			transformers: [
				transformerTwoslash({
					renderer: rendererRich(),
					twoslasher: createTwoslasher(),
					langs: ["svelte"],
					twoslashOptions: {
						compilerOptions: {
							baseUrl: resolve("."),
							paths: {
								"sv-toc": [resolve("src/lib/index.ts")],
							},
						},
					},
				}),
			],
		})
		.use(rehypeStringify)
		.process(markdown);
	return result.toString();
}
