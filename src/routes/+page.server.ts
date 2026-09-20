import fs from "fs";
import { parseMarkdown } from "./markdown";
import type { PageServerLoad } from "./$types";

export const load: PageServerLoad = async () => {
	const markdown = fs.readFileSync("README.md", "utf-8");
	const content = await parseMarkdown(markdown);
	return {
		content,
	};
};
